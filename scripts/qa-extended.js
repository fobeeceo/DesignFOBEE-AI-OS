#!/usr/bin/env node
/**
 * QA Extended — CLAUDE.md §9 확장 검사: Accessibility · SEO · Broken Link · Image · Performance.
 * 결과를 QA-REPORT.md 로 생성한다. 각 검사는 실제 파일/빌드 결과를 직접 읽어 판정한다(추측 없음).
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { walk, readFile, rel } = require("./lib/files");
const { getRouteMatchers, routeExists } = require("./lib/routes");

const ROOT = process.cwd();
const results = { a11y: null, seo: null, links: null, images: null, perf: null };

// ── 1. Accessibility (jsx-a11y via ESLint) ──────────────────────────────
async function checkA11y() {
  // ESLint 8.x 기본 클래스는 legacy(.eslintrc) 로더 — flat config(.mjs)는 FlatESLint로 명시 로드해야 한다.
  const { FlatESLint } = require("eslint/use-at-your-own-risk");
  const eslint = new FlatESLint({ overrideConfigFile: path.join(ROOT, "eslint.a11y.config.mjs") });
  const targets = [
    ...walk(path.join(ROOT, "app"), [".tsx"]),
    ...walk(path.join(ROOT, "components"), [".tsx"]),
  ];
  const lintResults = await eslint.lintFiles(targets);
  const issues = [];
  for (const r of lintResults) {
    for (const m of r.messages) {
      // "Definition for rule X was not found"는 실제 a11y 위반이 아니라, 이 축소 config에
      // next/react-hooks 플러그인이 없어서 소스의 eslint-disable 주석을 검증 못 하는 메타 노이즈다.
      // 직접 확인(§8) 후 제외 — 잘못된 문제를 보고하지 않는다.
      if (/was not found/.test(m.message)) continue;
      issues.push({ file: rel(r.filePath), line: m.line, rule: m.ruleId, message: m.message, severity: m.severity });
    }
  }
  results.a11y = { filesScanned: targets.length, issueCount: issues.length, issues };
}

// ── 2. SEO ───────────────────────────────────────────────────────────────
// Next.js metadata는 상위 layout → 하위 page로 상속/병합된다. 그래서 page.tsx에
// metadata export가 없어도 상위 어딘가(app/layout.tsx 등)에 있으면 실제 SEO 공백이 아니다.
// 트리를 거슬러 올라가며 조상 layout.tsx 중 하나라도 metadata를 가지면 "상속 OK"로 판정한다.
function hasOwnMetadata(filePath) {
  const src = readFile(filePath);
  return /export\s+const\s+metadata|export\s+async\s+function\s+generateMetadata/.test(src);
}

function findAncestorLayouts(fileDir) {
  const layouts = [];
  let dir = fileDir;
  const appRoot = path.join(ROOT, "app");
  while (true) {
    const layoutTsx = path.join(dir, "layout.tsx");
    if (fs.existsSync(layoutTsx)) layouts.push(layoutTsx);
    if (path.normalize(dir) === path.normalize(appRoot)) break;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return layouts;
}

function checkSeo() {
  const pageFiles = walk(path.join(ROOT, "app"), [".tsx"]).filter((f) => /page\.tsx$|layout\.tsx$/.test(f));
  const missingMetadata = []; // 진짜 공백: 본인 + 모든 조상 layout에 metadata 없음
  const inheritedOk = []; // 본인은 없지만 조상 layout이 있어 상속됨(문제 아님)
  for (const f of pageFiles) {
    const src = readFile(f);
    const isClientOnly = /^["']use client["']/.test(src.trim());
    if (hasOwnMetadata(f)) continue; // 자체 보유 — OK
    const ancestors = findAncestorLayouts(path.dirname(f)).filter((l) => l !== f);
    const inherits = ancestors.some(hasOwnMetadata);
    if (inherits) { inheritedOk.push(rel(f)); continue; }
    if (!isClientOnly) missingMetadata.push(rel(f)); // 클라이언트 컴포넌트는 애초에 export 불가, 스킵
  }
  const hasRobots = fs.existsSync(path.join(ROOT, "app", "robots.ts"));
  const hasSitemap = fs.existsSync(path.join(ROOT, "app", "sitemap.ts"));
  results.seo = { pagesScanned: pageFiles.length, missingMetadata, inheritedOk, hasRobots, hasSitemap };
}

// ── 3. Broken Link (내부 href) ───────────────────────────────────────────
function checkLinks() {
  const srcFiles = [...walk(path.join(ROOT, "app"), [".tsx"]), ...walk(path.join(ROOT, "components"), [".tsx"])];
  const matchers = getRouteMatchers();
  const broken = [];
  const hrefRe = /href=["'](\/[^"'#?]*)/g;
  const seen = new Set();
  for (const f of srcFiles) {
    const src = readFile(f);
    let m;
    while ((m = hrefRe.exec(src))) {
      const href = m[1];
      if (href.startsWith("/api/")) continue; // API 라우트는 route.ts 별도 체계, 여기서 제외
      const key = href + "|" + f;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!routeExists(href, matchers)) {
        broken.push({ href, file: rel(f) });
      }
    }
  }
  results.links = { checked: seen.size, brokenCount: broken.length, broken };
}

// ── 4. Image ────────────────────────────────────────────────────────────
function checkImages() {
  const srcFiles = [...walk(path.join(ROOT, "app"), [".tsx"]), ...walk(path.join(ROOT, "components"), [".tsx"])];
  const plainImgTags = [];
  const acknowledgedImgTags = []; // 바로 위 줄에 eslint-disable-next-line no-img-element 주석이 있음 = 의도적
  const missingAlt = [];
  for (const f of srcFiles) {
    const src = readFile(f);
    const lines = src.split("\n");
    lines.forEach((line, i) => {
      if (!/<img\s/.test(line)) return;
      const prevLine = lines[i - 1] || "";
      const entry = { file: rel(f), line: i + 1, text: line.trim().slice(0, 100) };
      if (/eslint-disable-next-line\s+@next\/next\/no-img-element/.test(prevLine)) {
        acknowledgedImgTags.push(entry);
      } else {
        plainImgTags.push(entry);
      }
    });
    // <Image ... /> 블록에서 alt= 누락 탐지 (단순 태그 단위 스캔)
    const imageTagRe = /<Image\b[^>]*?\/?>/gs;
    let m;
    while ((m = imageTagRe.exec(src))) {
      if (!/\balt\s*=/.test(m[0])) {
        const line = src.slice(0, m.index).split("\n").length;
        missingAlt.push({ file: rel(f), line, text: m[0].replace(/\s+/g, " ").slice(0, 100) });
      }
    }
  }
  results.images = { plainImgTags, acknowledgedImgTags, missingAlt };
}

// ── 5. Performance (빌드 번들 크기 예산) ─────────────────────────────────
function checkPerf() {
  const BUDGET_KB = 200; // First Load JS 예산 (kB)
  let buildOutput = "";
  try {
    buildOutput = execSync("npx next build", { cwd: ROOT, encoding: "utf8", stdio: "pipe", env: { ...process.env } });
  } catch (e) {
    results.perf = { error: "build failed", detail: String(e.message || e).slice(0, 500) };
    return;
  }
  const lines = buildOutput.split("\n");
  const routes = [];
  const rowRe = /^[│├└─\s]*[○ƒ]\s+(\S+)\s+([\d.]+)\s*(kB|B)\s+([\d.]+)\s*(kB|B)/;
  for (const line of lines) {
    const m = line.match(rowRe);
    if (m) {
      const [, route, , , sizeVal, sizeUnit] = m;
      const kb = sizeUnit === "kB" ? parseFloat(sizeVal) : parseFloat(sizeVal) / 1024;
      routes.push({ route, firstLoadKb: Math.round(kb * 10) / 10 });
    }
  }
  const overBudget = routes.filter((r) => r.firstLoadKb > BUDGET_KB);
  results.perf = { budgetKb: BUDGET_KB, routesParsed: routes.length, overBudget, routes };
}

// ── Report ──────────────────────────────────────────────────────────────
function toReport() {
  const now = new Date().toISOString();
  const lines = [`# QA Extended Report`, ``, `생성: ${now}`, `기준: CLAUDE.md §9`, ``];

  lines.push(`## 1. Accessibility (jsx-a11y)`);
  if (results.a11y) {
    lines.push(`- 스캔 파일: ${results.a11y.filesScanned}`);
    lines.push(`- 이슈: ${results.a11y.issueCount}건`);
    if (results.a11y.issueCount > 0) {
      lines.push(`| 파일 | 라인 | 규칙 | 메시지 |`, `|---|---|---|---|`);
      for (const i of results.a11y.issues.slice(0, 30)) {
        lines.push(`| ${i.file} | ${i.line} | ${i.rule} | ${i.message.replace(/\|/g, "\\|")} |`);
      }
      if (results.a11y.issueCount > 30) lines.push(`| ... | 외 ${results.a11y.issueCount - 30}건 생략 | | |`);
    }
  }
  lines.push(``, `## 2. SEO`);
  if (results.seo) {
    lines.push(`- 스캔 페이지: ${results.seo.pagesScanned}`);
    lines.push(`- robots.ts: ${results.seo.hasRobots ? "✅ 있음" : "❌ 없음"}`);
    lines.push(`- sitemap.ts: ${results.seo.hasSitemap ? "✅ 있음" : "❌ 없음"}`);
    lines.push(`- metadata **진짜 공백**(본인+조상 layout 모두 없음): ${results.seo.missingMetadata.length}건`);
    for (const f of results.seo.missingMetadata) lines.push(`  - ${f}`);
    lines.push(`- metadata 상위 layout 상속(문제 아님, 참고용): ${results.seo.inheritedOk.length}건`);
    for (const f of results.seo.inheritedOk) lines.push(`  - ${f}`);
  }
  lines.push(``, `## 3. Broken Link (내부 링크)`);
  if (results.links) {
    lines.push(`- 검사한 링크: ${results.links.checked}`);
    lines.push(`- 깨진 링크: ${results.links.brokenCount}건`);
    for (const b of results.links.broken) lines.push(`  - \`${b.href}\` (${b.file})`);
  }
  lines.push(``, `## 4. Image`);
  if (results.images) {
    lines.push(`- 순수 <img> 태그(next/image 미사용, **미검토**): ${results.images.plainImgTags.length}건`);
    for (const t of results.images.plainImgTags) lines.push(`  - ${t.file}:${t.line}`);
    lines.push(`- 순수 <img> 태그(disable 주석으로 **이미 의도적 처리됨**, 참고용): ${results.images.acknowledgedImgTags.length}건`);
    for (const t of results.images.acknowledgedImgTags) lines.push(`  - ${t.file}:${t.line}`);
    lines.push(`- alt 누락 <Image>: ${results.images.missingAlt.length}건`);
    for (const t of results.images.missingAlt) lines.push(`  - ${t.file}:${t.line}`);
  }
  lines.push(``, `## 5. Performance (빌드 번들 예산 ${results.perf?.budgetKb ?? "?"}kB)`);
  if (results.perf?.error) {
    lines.push(`- ❌ 빌드 실패: ${results.perf.detail}`);
  } else if (results.perf) {
    lines.push(`- 파싱된 라우트: ${results.perf.routesParsed}`);
    lines.push(`- 예산 초과 라우트: ${results.perf.overBudget.length}건`);
    for (const r of results.perf.overBudget) lines.push(`  - ${r.route}: ${r.firstLoadKb}kB`);
    lines.push(``, `> 참고: 이 지표는 First Load JS 번들 크기 기준(빌드 정적 분석)이다. LCP/TBT/CLS 등 런타임 지표는 Lighthouse가 필요하며(서버 구동 필요), 수동 실행: \`npx lighthouse http://localhost:3000 --view\`.`);
  }

  const totalIssues =
    (results.a11y?.issueCount || 0) +
    (results.seo?.missingMetadata.length || 0) +
    (results.links?.brokenCount || 0) +
    (results.images?.plainImgTags.length || 0) +
    (results.images?.missingAlt.length || 0) +
    (results.perf?.overBudget.length || 0);

  lines.unshift(
    `> **요약**: 실제 조치 필요 ${totalIssues}건 (상속 OK/의도적 처리 항목은 참고용으로 별도 표시, 문제 건수에서 제외).`,
    ``
  );
  return { markdown: lines.join("\n") + "\n", totalIssues };
}

(async () => {
  console.log("[qa-extended] Accessibility 검사...");
  await checkA11y();
  console.log("[qa-extended] SEO 검사...");
  checkSeo();
  console.log("[qa-extended] Link 검사...");
  checkLinks();
  console.log("[qa-extended] Image 검사...");
  checkImages();
  console.log("[qa-extended] Performance 검사 (빌드 실행)...");
  checkPerf();

  const { markdown, totalIssues } = toReport();
  fs.writeFileSync(path.join(ROOT, "QA-REPORT.md"), markdown, "utf8");
  console.log(`[qa-extended] QA-REPORT.md 생성 완료. 총 이슈: ${totalIssues}건`);
  process.exit(0); // 확장 QA는 정보성 — 메인 qa 게이트를 막지 않음(§12는 lint/tsc/build가 게이트)
})();
