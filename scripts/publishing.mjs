#!/usr/bin/env node
/**
 * AI 출판부 실행 도구.
 *
 *   npm run publishing -- init
 *   npm run publishing -- split  <원고파일>
 *   npm run publishing -- editor <원고파일>
 *   npm run publishing -- proof  <원고파일> [장id]
 *
 * ⚠️ 원본 파일을 절대 수정하지 않는다. 결과는 AI-HQ/publishing/ 아래에만 쓴다.
 *    그 폴더는 .gitignore로 제외돼 있다 — 이 저장소는 PUBLIC이다.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const WORK = join(ROOT, "AI-HQ", "publishing");

const FOLDERS = [
  "00_ORIGINAL",
  "01_WORKING",
  "02_EDITING",
  "03_CONSISTENCY",
  "04_COPYRIGHT",
  "05_DESIGN",
  "06_MARKETING",
  "07_QA",
  "08_APPROVAL",
];

/**
 * TS 모듈을 그대로 불러온다.
 *
 * 저장소에 이미 있는 vite로 변환한다(vitest가 쓰는 것과 같은 도구·같은 `@` 별칭).
 * 별도 패키지를 더 깔지 않기 위해서다. 서버는 한 번만 띄우고 재사용한다.
 */
let viteServer = null;
async function loadTs(relPath) {
  if (!viteServer) {
    const { createServer } = await import("vite");
    viteServer = await createServer({
      root: ROOT,
      configFile: false,
      appType: "custom",
      logLevel: "error",
      server: { middlewareMode: true },
      resolve: { alias: { "@": ROOT } },
    });
  }
  return viteServer.ssrLoadModule("/" + relPath);
}

async function closeLoader() {
  if (viteServer) await viteServer.close();
}

function die(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

function readManuscript(file) {
  if (!file) die("원고 파일을 지정해 주세요.\n   예: npm run publishing -- split AI-HQ/publishing/00_ORIGINAL/원고.md");
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) die(`파일을 찾을 수 없습니다: ${path}`);
  return { path, text: readFileSync(path, "utf8") };
}

function ensureWork() {
  for (const f of FOLDERS) mkdirSync(join(WORK, f), { recursive: true });
}

// ── init ───────────────────────────────────────────────
function cmdInit() {
  ensureWork();
  console.log(`\n작업 폴더를 만들었습니다: ${WORK}\n`);
  for (const f of FOLDERS) console.log(`  ${f}/`);
  console.log(`
이 폴더는 Git에 올라가지 않습니다(.gitignore). 이 저장소는 PUBLIC이라
원고를 커밋하면 되돌릴 수 없이 공개됩니다.

다음: 원본 원고를 00_ORIGINAL/ 에 넣고
  npm run publishing -- split AI-HQ/publishing/00_ORIGINAL/<파일명>
`);
}

// ── split ──────────────────────────────────────────────
async function cmdSplit(file) {
  const { splitManuscript, summarize, unitFileName } = await loadTs("lib/publishing/manuscript.ts");
  const { text } = readManuscript(file);
  const units = splitManuscript(text);
  if (units.length === 0) die("원고가 비어 있습니다.");

  ensureWork();
  const dir = join(WORK, "01_WORKING");
  units.forEach((u, i) => {
    const header = [
      `<!-- ${u.id} · ${u.kind} · ${u.chars.toLocaleString()}자`,
      u.part ? ` · ${u.part}` : "",
      " -->",
    ].join("");
    writeFileSync(
      join(dir, unitFileName(u, i)),
      `${header}\n# ${u.heading}\n${u.subtitle ? `\n_${u.subtitle}_\n` : ""}\n${u.body}\n`
    );
  });

  const s = summarize(units);
  console.log(`\n분해 완료 — ${s.units}개 단위 (장 ${s.chapters}개) · ${s.chars.toLocaleString()}자`);
  if (s.parts.length) console.log(`부 구성: ${s.parts.join(" / ")}`);
  console.log(`\n${dir} 에 저장했습니다.\n`);
  units.forEach((u, i) => {
    console.log(`  ${unitFileName(u, i)}  (${u.chars.toLocaleString()}자)`);
  });
  if (s.thin.length) {
    console.log(`\n⚠️  본문이 짧은 단위 ${s.thin.length}개 — 분해가 잘못됐을 수 있으니 확인해 주세요:`);
    for (const t of s.thin) console.log(`     ${t.id} "${t.heading}" ${t.chars}자`);
  }
  console.log("");
}

// ── editor ─────────────────────────────────────────────
async function cmdEditor(file) {
  const { splitManuscript } = await loadTs("lib/publishing/manuscript.ts");
  const { reviewStructure, editorFindingToMarkdown } = await loadTs("agents/editorInChiefAgent.ts");
  const { text } = readManuscript(file);
  const units = splitManuscript(text);
  if (units.length === 0) die("원고가 비어 있습니다.");

  console.log(`\n편집장 검토 중… (장 ${units.filter((u) => u.kind === "chapter").length}개)`);
  const finding = await reviewStructure(units);
  ensureWork();
  const out = join(WORK, "02_EDITING", `편집장검토_${stamp()}.md`);
  writeFileSync(out, editorFindingToMarkdown(finding, units));
  console.log(`\n완료 — ${out}`);
  console.log(`  중복 의심 ${finding.중복의심.length}건 · 흐름 지적 ${finding.흐름.length}건 · 목차 제안 ${finding.목차.length}건\n`);
}

// ── proof ──────────────────────────────────────────────
async function cmdProof(file, only) {
  const { splitManuscript } = await loadTs("lib/publishing/manuscript.ts");
  const { proofread } = await loadTs("agents/proofreaderAgent.ts");
  const { correctionsToMarkdown } = await loadTs("lib/publishing/corrections.ts");
  const { text } = readManuscript(file);
  let units = splitManuscript(text);
  if (only) {
    units = units.filter((u) => u.id === only);
    if (units.length === 0) die(`'${only}' 장을 찾을 수 없습니다.`);
  }

  ensureWork();
  let total = 0;
  let dropped = 0;
  for (const u of units) {
    process.stdout.write(`교정 중… ${u.id} ${u.subtitle || u.heading} `);
    const result = await proofread(u);
    total += result.accepted.length;
    dropped += result.rejected.length;
    const heading = `${u.heading}${u.subtitle ? " — " + u.subtitle : ""}`;
    writeFileSync(
      join(WORK, "02_EDITING", `교정_${u.id}_${stamp()}.md`),
      correctionsToMarkdown(heading, result)
    );
    console.log(`→ 제안 ${result.accepted.length}건 (걸러냄 ${result.rejected.length}건)`);
  }
  console.log(`\n완료 — 제안 ${total}건 · 걸러낸 것 ${dropped}건`);
  console.log(`${join(WORK, "02_EDITING")} 에 저장했습니다.`);
  console.log(`\n모든 수정은 대표님이 고르십니다. AI가 원고를 바꾸지 않았습니다.\n`);
}

function stamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

// ── 진입점 ──────────────────────────────────────────────
const [cmd, file, extra] = process.argv.slice(2);

const USAGE = `
AI 출판부

  npm run publishing -- init                      작업 폴더 만들기
  npm run publishing -- split  <원고파일>          장 단위로 분해 (AI 불필요)
  npm run publishing -- editor <원고파일>          편집장 — 구성·중복·흐름
  npm run publishing -- proof  <원고파일> [장id]   교정 — 원문·수정안·사유

editor·proof 는 GEMINI_API_KEY 가 필요합니다.
`;

try {
  if (cmd === "init") cmdInit();
  else if (cmd === "split") await cmdSplit(file);
  else if (cmd === "editor") await cmdEditor(file);
  else if (cmd === "proof") await cmdProof(file, extra);
  else console.log(USAGE);
  await closeLoader();
} catch (error) {
  await closeLoader().catch(() => {});
  if (error?.code === "NO_API_KEY") {
    die("GEMINI_API_KEY가 없습니다. 이 명령은 AI를 씁니다.\n   split 명령은 AI 없이 동작합니다.");
  }
  die(error?.message ?? String(error));
}
