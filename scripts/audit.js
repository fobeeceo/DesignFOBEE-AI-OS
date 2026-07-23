#!/usr/bin/env node
/**
 * Audit — CLAUDE.md §10: 다른 AI를 믿지 않는다. 직접 실행·검사·확인한다.
 * Dead Code · Duplicate Component · Unused Import · Broken Route ·
 * Build Error · Security · Environment Variable · Git Status.
 * 결과를 audit-report.md 로 생성한다. 이 스크립트는 아무것도 삭제/수정하지 않는다(읽기 전용, §6 준수).
 */
const fs = require("fs");
const path = require("path");
const { execSync, execFileSync } = require("child_process");
const { walk, readFile, rel } = require("./lib/files");
const { getRouteMatchers, routeExists } = require("./lib/routes");

const ROOT = process.cwd();
const results = {};

// ── 1. Dead Code (components/ 각 파일이 실제로 import 되는가) ───────────
// 주의: basename 접미사 매칭은 동일 파일명이 다른 경로에 있을 때(§2 중복) 오탐(false-negative)을
// 일으킨다 (예: "@/components/layout/Header" 가 "components/Header.tsx"를 오매칭). 그래서
// import specifier를 실제 절대경로로 해석해 "정확히 이 파일"인지 비교한다(§8 추측 금지).
const EXTS = [".tsx", ".ts", ".jsx", ".js"];

function resolveSpecifier(specifier, fromFile) {
  let base;
  if (specifier.startsWith("@/")) base = path.join(ROOT, specifier.slice(2));
  else if (specifier.startsWith(".")) base = path.join(path.dirname(fromFile), specifier);
  else return null; // 외부 패키지
  for (const ext of EXTS) if (fs.existsSync(base + ext)) return base + ext;
  for (const ext of EXTS) if (fs.existsSync(path.join(base, "index" + ext))) return path.join(base, "index" + ext);
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  return null;
}

function extractSpecifiers(src) {
  const specs = [];
  const re = /(?:from\s+|require\()\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src))) specs.push(m[1]);
  return specs;
}

function checkDeadCode() {
  const componentFiles = walk(path.join(ROOT, "components"), [".tsx", ".ts"]);
  const allFiles = [...walk(path.join(ROOT, "app"), [".tsx", ".ts"]), ...componentFiles];

  // 파일 f가 "자기 자신"을 resolve하는 경우(자기참조)는 사용 근거로 치지 않는다.
  const importedByOthers = new Set();
  for (const f of allFiles) {
    const src = readFile(f);
    for (const spec of extractSpecifiers(src)) {
      const resolved = resolveSpecifier(spec, f);
      if (resolved && path.normalize(resolved) !== path.normalize(f)) {
        importedByOthers.add(path.normalize(resolved));
      }
    }
  }

  const directDead = new Set(
    componentFiles.filter((f) => !importedByOthers.has(path.normalize(f))).map((f) => path.normalize(f))
  );

  // 연쇄 데드코드: "죽은 파일에게만 import되는" 파일도 고정점까지 반복 전파.
  // 예: StyleGallery.tsx(무사용) 가 StyleCards.tsx 를 import 하면, StyleCards도 사실상 죽은 코드.
  const importersOf = new Map(); // 절대경로 -> Set(importer 절대경로)
  for (const f of allFiles) {
    const src = readFile(f);
    for (const spec of extractSpecifiers(src)) {
      const resolved = resolveSpecifier(spec, f);
      if (!resolved) continue;
      const target = path.normalize(resolved);
      if (target === path.normalize(f)) continue;
      if (!importersOf.has(target)) importersOf.set(target, new Set());
      importersOf.get(target).add(path.normalize(f));
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of componentFiles) {
      const norm = path.normalize(f);
      if (directDead.has(norm)) continue;
      const importers = importersOf.get(norm) || new Set();
      const nonAppImporters = [...importers].filter((imp) => !directDead.has(imp));
      if (importers.size > 0 && nonAppImporters.length === 0) {
        // 이 파일을 참조하는 곳이 전부 dead-set 뿐이고, app/ 라우트에서 직접 쓰이지도 않는다.
        const referencedByApp = [...importers].some((imp) => imp.startsWith(path.normalize(path.join(ROOT, "app"))));
        if (!referencedByApp) { directDead.add(norm); changed = true; }
      }
    }
  }

  const dead = componentFiles.filter((f) => directDead.has(path.normalize(f))).map((f) => rel(f));
  results.deadCode = { scanned: componentFiles.length, dead };
}

// ── 2. Duplicate Component (동일 basename이 여러 경로에 존재) ────────────
function checkDuplicates() {
  const componentFiles = walk(path.join(ROOT, "components"), [".tsx"]);
  const byBase = {};
  for (const f of componentFiles) {
    const base = path.basename(f);
    (byBase[base] ||= []).push(rel(f));
  }
  const duplicates = Object.entries(byBase)
    .filter(([, list]) => list.length > 1)
    .map(([base, list]) => ({ base, paths: list }));
  results.duplicates = duplicates;
}

// ── 3. Unused Import (ESLint @typescript-eslint/no-unused-vars) ─────────
async function checkUnusedImports() {
  const { FlatESLint } = require("eslint/use-at-your-own-risk");
  const eslint = new FlatESLint({ overrideConfigFile: path.join(ROOT, "eslint.unused.config.mjs") });
  const targets = [
    ...walk(path.join(ROOT, "app"), [".tsx", ".ts"]),
    ...walk(path.join(ROOT, "components"), [".tsx", ".ts"]),
  ];
  const lintResults = await eslint.lintFiles(targets);
  const issues = [];
  for (const r of lintResults) {
    for (const m of r.messages) {
      issues.push({ file: rel(r.filePath), line: m.line, message: m.message });
    }
  }
  results.unusedImports = { scanned: targets.length, count: issues.length, issues };
}

// ── 4. Broken Route (nav 컴포넌트의 내부 링크) ────────────────────────────
function checkBrokenRoutes() {
  const navFiles = walk(path.join(ROOT, "components"), [".tsx"]).filter((f) =>
    /Header|Footer|Nav|MobileNav/i.test(path.basename(f))
  );
  const matchers = getRouteMatchers();
  const broken = [];
  const hrefRe = /href=["'](\/[^"'#?]*)/g;
  for (const f of navFiles) {
    const src = readFile(f);
    let m;
    while ((m = hrefRe.exec(src))) {
      const href = m[1];
      if (href.startsWith("/api/")) continue;
      if (!routeExists(href, matchers)) broken.push({ href, file: rel(f) });
    }
  }
  results.brokenRoutes = { navFilesScanned: navFiles.length, broken };
}

// ── 5. Build Error (독립 실행 — 다른 보고를 신뢰하지 않는다) ─────────────
function checkBuild() {
  try {
    execSync("npx tsc --noEmit", { cwd: ROOT, stdio: "pipe" });
    execSync("npx next build", { cwd: ROOT, stdio: "pipe", env: { ...process.env } });
    results.build = { typeCheck: "PASS", build: "PASS" };
  } catch (e) {
    results.build = { typeCheck: "UNKNOWN", build: "FAIL", detail: String(e.stdout || e.message || e).slice(0, 800) };
  }
}

// ── 6. Security (하드코딩 시크릿 패턴, npm audit) ─────────────────────────
function checkSecurity() {
  const srcFiles = [
    ...walk(path.join(ROOT, "app"), [".ts", ".tsx"]),
    ...walk(path.join(ROOT, "components"), [".ts", ".tsx"]),
    ...walk(path.join(ROOT, "lib"), [".ts", ".tsx"]),
    ...walk(path.join(ROOT, "services"), [".ts", ".tsx"]),
  ];
  const secretRe = /(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{30,}|postgres(?:ql)?:\/\/[^:\s"']+:[^@\s"']+@)/;
  const findings = [];
  for (const f of srcFiles) {
    const src = readFile(f);
    const m = src.match(secretRe);
    if (m) findings.push({ file: rel(f), match: m[0].slice(0, 20) + "..." });
  }
  let npmAudit = null;
  try {
    const out = execSync("npm audit --production --json", { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
    const parsed = JSON.parse(out);
    npmAudit = parsed.metadata?.vulnerabilities || null;
  } catch (e) {
    // npm audit는 취약점 발견 시 non-zero exit — stdout에서 파싱 시도
    try {
      const out = e.stdout ? e.stdout.toString() : "";
      const parsed = JSON.parse(out);
      npmAudit = parsed.metadata?.vulnerabilities || null;
    } catch {
      npmAudit = { error: "npm audit 실행 불가(오프라인 또는 파싱 실패)" };
    }
  }
  results.security = { hardcodedSecrets: findings, npmAudit };
}

// ── 7. Environment Variable (코드 참조 vs .env.example) ──────────────────
function checkEnvVars() {
  const srcFiles = [
    ...walk(path.join(ROOT, "app"), [".ts", ".tsx"]),
    ...walk(path.join(ROOT, "lib"), [".ts", ".tsx"]),
    ...walk(path.join(ROOT, "services"), [".ts", ".tsx"]),
  ];
  const middlewarePath = path.join(ROOT, "middleware.ts");
  if (fs.existsSync(middlewarePath)) srcFiles.push(middlewarePath);
  const prismaSchemaPath = path.join(ROOT, "database", "prisma", "schema.prisma");
  if (fs.existsSync(prismaSchemaPath)) srcFiles.push(prismaSchemaPath);

  const referenced = new Set();
  // process.env.X (TS/TSX) 와 env("X") (Prisma schema) 둘 다 인식한다.
  const envRes = [/process\.env\.([A-Z0-9_]+)/g, /env\("([A-Z0-9_]+)"\)/g];
  for (const f of srcFiles) {
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) continue;
    const src = readFile(f);
    for (const envRe of envRes) {
      let m;
      while ((m = envRe.exec(src))) referenced.add(m[1]);
    }
  }
  const examplePath = path.join(ROOT, ".env.example");
  const declared = new Set();
  if (fs.existsSync(examplePath)) {
    const src = readFile(examplePath);
    for (const line of src.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=/);
      if (m) declared.add(m[1]);
    }
  }
  // NODE_ENV는 Node.js/Next.js가 런타임에 자동 주입 — 사용자가 .env에 직접 선언하는 값이 아니다
  // (오히려 .env.local에 잘못 넣으면 `next dev`의 HMR을 깨뜨릴 수 있어 예제에서 의도적으로 제외).
  const PLATFORM_INJECTED = new Set(["NODE_ENV"]);
  const missingFromExample = [...referenced].filter((k) => !declared.has(k) && !PLATFORM_INJECTED.has(k)).sort();
  const unusedInExample = [...declared].filter((k) => !referenced.has(k)).sort();
  results.envVars = { referencedCount: referenced.size, declaredCount: declared.size, missingFromExample, unusedInExample };
}

// ── 8. Git Status ─────────────────────────────────────────────────────
function checkGit() {
  // execFileSync는 셸을 거치지 않는다 — Windows cmd.exe의 %VAR% 확장이 git --format=%H 등을 깨는 문제 회피.
  const short = execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" }).trim();
  const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  const hash = execFileSync("git", ["log", "-1", "--format=%H"], { cwd: ROOT, encoding: "utf8" }).trim();
  const subject = execFileSync("git", ["log", "-1", "--format=%s"], { cwd: ROOT, encoding: "utf8" }).trim();
  const uncommittedCount = short ? short.split("\n").length : 0;
  results.git = { branch, lastCommit: `${hash} ${subject}`, uncommittedCount, uncommittedFiles: short };
}

// ── Report ──────────────────────────────────────────────────────────────
function toReport() {
  const now = new Date().toISOString();
  const lines = [`# Audit Report`, ``, `생성: ${now}`, `기준: CLAUDE.md §10 (직접 실행·검사·확인, 삭제/수정 없음)`, ``];

  lines.push(`## 1. Dead Code`);
  lines.push(`- 스캔: ${results.deadCode.scanned}개 컴포넌트`);
  lines.push(`- 미사용(어디서도 import 안 됨): ${results.deadCode.dead.length}건`);
  for (const f of results.deadCode.dead) lines.push(`  - ${f}`);
  lines.push(`- ⚠️ §6 규정: 삭제는 CEO 승인 후에만 수행.`);

  lines.push(``, `## 2. Duplicate Component`);
  lines.push(`- 중복 파일명: ${results.duplicates.length}건`);
  for (const d of results.duplicates) {
    lines.push(`  - **${d.base}**`);
    for (const p of d.paths) lines.push(`    - ${p}`);
  }

  lines.push(``, `## 3. Unused Import`);
  lines.push(`- 스캔: ${results.unusedImports.scanned}개 파일`);
  lines.push(`- 이슈: ${results.unusedImports.count}건`);
  for (const i of results.unusedImports.issues.slice(0, 30)) lines.push(`  - ${i.file}:${i.line} — ${i.message}`);
  if (results.unusedImports.count > 30) lines.push(`  - ... 외 ${results.unusedImports.count - 30}건 생략`);

  lines.push(``, `## 4. Broken Route (nav 컴포넌트)`);
  lines.push(`- nav 파일 스캔: ${results.brokenRoutes.navFilesScanned}`);
  lines.push(`- 깨진 링크: ${results.brokenRoutes.broken.length}건`);
  for (const b of results.brokenRoutes.broken) lines.push(`  - \`${b.href}\` (${b.file})`);

  lines.push(``, `## 5. Build Error (독립 실행)`);
  lines.push(`- Type Check: ${results.build.typeCheck}`);
  lines.push(`- Build: ${results.build.build}`);
  if (results.build.detail) lines.push(`\n\`\`\`\n${results.build.detail}\n\`\`\``);

  lines.push(``, `## 6. Security`);
  lines.push(`- 하드코딩 시크릿 패턴: ${results.security.hardcodedSecrets.length}건`);
  for (const f of results.security.hardcodedSecrets) lines.push(`  - ${f.file}: ${f.match}`);
  if (results.security.npmAudit) {
    if (results.security.npmAudit.error) {
      lines.push(`- npm audit: ${results.security.npmAudit.error}`);
    } else {
      const v = results.security.npmAudit;
      lines.push(`- npm audit(production): critical ${v.critical || 0}, high ${v.high || 0}, moderate ${v.moderate || 0}, low ${v.low || 0}`);
    }
  }

  lines.push(``, `## 7. Environment Variable`);
  lines.push(`- 코드에서 참조: ${results.envVars.referencedCount}개`);
  lines.push(`- .env.example 선언: ${results.envVars.declaredCount}개`);
  lines.push(`- .env.example 누락(코드는 참조하나 예제엔 없음): ${results.envVars.missingFromExample.length}건`);
  for (const k of results.envVars.missingFromExample) lines.push(`  - ${k}`);
  lines.push(`- .env.example 미사용(예제엔 있으나 코드가 참조 안 함): ${results.envVars.unusedInExample.length}건`);
  for (const k of results.envVars.unusedInExample) lines.push(`  - ${k}`);

  lines.push(``, `## 8. Git Status`);
  lines.push(`- 브랜치: ${results.git.branch}`);
  lines.push(`- 최근 커밋: ${results.git.lastCommit}`);
  lines.push(`- 미커밋 변경: ${results.git.uncommittedCount}건`);
  if (results.git.uncommittedCount > 0) lines.push(`\n\`\`\`\n${results.git.uncommittedFiles}\n\`\`\``);

  const totalFindings =
    results.deadCode.dead.length +
    results.duplicates.length +
    results.unusedImports.count +
    results.brokenRoutes.broken.length +
    (results.build.build === "FAIL" ? 1 : 0) +
    results.security.hardcodedSecrets.length +
    results.envVars.missingFromExample.length;

  lines.unshift(`> **요약**: 총 ${totalFindings}건 발견 (Git 미커밋 변경 제외). §6에 따라 이 스크립트는 아무것도 삭제/수정하지 않았다.`, ``);
  return { markdown: lines.join("\n") + "\n", totalFindings };
}

(async () => {
  console.log("[audit] 1/8 Dead Code...");
  checkDeadCode();
  console.log("[audit] 2/8 Duplicate Component...");
  checkDuplicates();
  console.log("[audit] 3/8 Unused Import...");
  await checkUnusedImports();
  console.log("[audit] 4/8 Broken Route...");
  checkBrokenRoutes();
  console.log("[audit] 5/8 Build Error (독립 실행)...");
  checkBuild();
  console.log("[audit] 6/8 Security...");
  checkSecurity();
  console.log("[audit] 7/8 Environment Variable...");
  checkEnvVars();
  console.log("[audit] 8/8 Git Status...");
  checkGit();

  const { markdown, totalFindings } = toReport();
  fs.writeFileSync(path.join(ROOT, "audit-report.md"), markdown, "utf8");
  console.log(`[audit] audit-report.md 생성 완료. 총 발견: ${totalFindings}건`);
})();
