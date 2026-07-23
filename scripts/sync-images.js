#!/usr/bin/env node
/**
 * sync-images.js — 이미지 SSOT 동기화(CEO MASTER 업무지시서 §5).
 *
 * 구조: Google Drive(GBRICK_AI_SYSTEM/MASTER-ASSETS/...)가 원본, public/images는 캐시(복사본).
 * 이 스크립트는 "로컬 스테이징 폴더 → public/images" 절반을 자동화한다.
 *
 * ⚠️ 정직한 범위 고지: "Drive → 로컬 스테이징" 절반은 이 스크립트가 하지 않는다.
 * Drive API 서비스 계정 자격증명이 프로젝트에 없어(외부서비스가입, CEO 승인 대상 — INSTALL.md §6과 동일 성격)
 * 완전 무인 동기화는 아직 불가능하다. 현재는 Claude Code 세션이 Drive MCP로 직접 다운로드해
 * --source 스테이징 폴더를 채우고, 이 스크립트가 그 다음(WebP 변환·최적화·썸네일·ALT 생성·배치)을 자동 수행한다.
 *
 * 사용: node scripts/sync-images.js --source <스테이징폴더> [--force]
 * 스테이징 폴더는 Drive와 동일한 하위구조를 따른다(§5):
 *   LOGO/ BRAND/ MENU/ STORE/<매장명>/ PORTFOLIO/{BEFORE_AFTER,SNS,WEBSITE}/
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_IMAGES = path.join(ROOT, "public", "images");
const MANIFEST_PATH = path.join(PUBLIC_IMAGES, "manifest.json");
const MAX_WIDTH = 1920;
const THUMB_WIDTH = 400;
const WEBP_QUALITY = 82;

// Drive 폴더명(§5) → public/images 하위경로(URL-safe kebab) 매핑.
const FOLDER_MAP = {
  LOGO: "logo",
  BRAND: "brand",
  MENU: "menu",
  STORE: "store",
  PORTFOLIO: "portfolio",
  BEFORE_AFTER: "before-after",
  SNS: "sns",
  WEBSITE: "website",
};

function mapSegment(seg) {
  if (FOLDER_MAP[seg]) return FOLDER_MAP[seg];
  // 매장명 등 한글 폴더명은 그대로 유지(슬러그화는 파일명에서만 적용).
  return seg;
}

function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/[^\w가-힣.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  }
  return { syncedAt: null, items: {} };
}

function saveManifest(manifest) {
  fs.mkdirSync(PUBLIC_IMAGES, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
}

function walkImages(dir, base = dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkImages(full, base));
    } else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
      out.push({ abs: full, rel: path.relative(base, full) });
    }
  }
  return out;
}

/** ALT 텍스트 자동 생성(Gemini Vision). GEMINI_API_KEY 없으면 대기 상태로 표시(추측 금지). */
async function generateAlt(imagePath, contextLabel) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "[ALT 자동생성 대기 — GEMINI_API_KEY 없음]";
  try {
    const { GoogleGenAI } = require("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const imageBuffer = fs.readFileSync(imagePath);
    const mimeType = imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    const instruction = `이 이미지는 "${contextLabel}" 용도로 쓰이는 실제 공간/브랜드 사진입니다. 웹 접근성용 alt 텍스트를 한국어 1문장(20자 내외)으로 작성하세요. 과장 없이 사실만, 문장만 출력하세요.`;
    const res = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        { role: "user", parts: [{ inlineData: { mimeType, data: imageBuffer.toString("base64") } }, { text: instruction }] },
      ],
    });
    const text = res.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim();
    return text || "[ALT 자동생성 실패 — 빈 응답]";
  } catch (e) {
    return `[ALT 자동생성 실패 — ${e.message}]`;
  }
}

async function processImage(item, force) {
  const segments = item.rel.split(path.sep).map(mapSegment);
  const filename = segments.pop();
  const slug = slugify(path.parse(filename).name);
  const destDir = path.join(PUBLIC_IMAGES, ...segments);
  fs.mkdirSync(destDir, { recursive: true });

  const webpPath = path.join(destDir, `${slug}.webp`);
  const thumbPath = path.join(destDir, `${slug}-thumb.webp`);
  const manifestKey = path.join(...segments, `${slug}.webp`).replace(/\\/g, "/");

  const manifest = processImage._manifest;
  if (!force && manifest.items[manifestKey] && fs.existsSync(webpPath)) {
    return { key: manifestKey, skipped: true };
  }

  await sharp(item.abs).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: WEBP_QUALITY }).toFile(webpPath);
  await sharp(item.abs).resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: WEBP_QUALITY }).toFile(thumbPath);

  const contextLabel = segments.join("/") || "브랜드 자산";
  const alt = await generateAlt(item.abs, contextLabel);

  manifest.items[manifestKey] = {
    source: item.rel,
    webp: `/images/${manifestKey}`,
    thumb: `/images/${path.join(...segments, `${slug}-thumb.webp`).replace(/\\/g, "/")}`,
    alt,
    syncedAt: new Date().toISOString(),
  };
  return { key: manifestKey, skipped: false };
}

async function main() {
  const args = process.argv.slice(2);
  const sourceIdx = args.indexOf("--source");
  const source = sourceIdx >= 0 ? args[sourceIdx + 1] : null;
  const force = args.includes("--force");

  if (!source) {
    console.error("사용법: node scripts/sync-images.js --source <스테이징폴더> [--force]");
    process.exit(1);
  }
  const sourceAbs = path.resolve(source);
  if (!fs.existsSync(sourceAbs)) {
    console.error(`스테이징 폴더가 없습니다: ${sourceAbs}`);
    process.exit(1);
  }

  const images = walkImages(sourceAbs);
  console.log(`[sync-images] 스테이징 폴더에서 이미지 ${images.length}개 발견: ${sourceAbs}`);

  const manifest = loadManifest();
  processImage._manifest = manifest;

  let synced = 0, skipped = 0;
  for (const item of images) {
    const result = await processImage(item, force);
    if (result.skipped) skipped++;
    else { synced++; console.log(`  ✓ ${result.key}`); }
  }

  manifest.syncedAt = new Date().toISOString();
  saveManifest(manifest);
  console.log(`[sync-images] 완료 — 신규/갱신 ${synced}건, 스킵(이미 최신) ${skipped}건. manifest: ${MANIFEST_PATH}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("[sync-images] 실패:", e);
    process.exit(1);
  });
}

module.exports = { walkImages, slugify, mapSegment };
