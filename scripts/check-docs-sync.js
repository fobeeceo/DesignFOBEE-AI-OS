#!/usr/bin/env node
/**
 * check-docs-sync.js — AI Documentation 역할의 실제 코드.
 * CEO MASTER 업무지시서 §1 "설계만 된 역할은 직원으로 간주하지 않는다" 대응 — 지금까지
 * "본 세션 절차"로만 수행하던 문서 정합성 점검을 결정적(deterministic) 스크립트로 코드화한다.
 * LLM 미사용(순수 파일시스템/git 검사) — 불필요한 API 비용 없음.
 *
 * 검사 항목:
 * 1. 루트에 Git 추적 중인 .md 파일 중 DOCUMENT-INDEX.md에 안 실린 것(문서 색인 누락)
 * 2. DOCUMENT-INDEX.md가 참조하는 루트 .md 파일 중 실제로 없는 것(깨진 색인)
 * 3. CHANGELOG.md 최상단 항목 날짜가 최근 커밋일 기준 N일 이상 오래된 경우(경고만)
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const STALE_DAYS = 3;

function readFile(p) {
  return fs.readFileSync(p, "utf-8");
}

function gitTrackedRootMdFiles() {
  const out = execFileSync("git", ["ls-files", "*.md"], { cwd: ROOT, encoding: "utf-8" });
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.includes("/")); // 루트 파일만(하위 폴더 제외)
}

function extractReferencedMdFiles(documentIndexContent) {
  const re = /\[([^\]]+\.md)\]\(([^)]+\.md)\)/g;
  const refs = new Set();
  let m;
  while ((m = re.exec(documentIndexContent))) {
    if (!m[2].includes("/")) refs.add(m[2]);
  }
  return refs;
}

function lastCommitDate() {
  const iso = execFileSync("git", ["log", "-1", "--format=%cI"], { cwd: ROOT, encoding: "utf-8" }).trim();
  return new Date(iso);
}

function changelogTopDate(changelogContent) {
  const m = changelogContent.match(/\((\d{4}-\d{2}-\d{2})\)/);
  return m ? new Date(m[1]) : null;
}

function main() {
  const issues = [];

  const documentIndexPath = path.join(ROOT, "DOCUMENT-INDEX.md");
  const changelogPath = path.join(ROOT, "CHANGELOG.md");

  if (!fs.existsSync(documentIndexPath)) {
    console.error("DOCUMENT-INDEX.md가 없습니다.");
    process.exit(1);
  }

  const documentIndexContent = readFile(documentIndexPath);
  const referenced = extractReferencedMdFiles(documentIndexContent);
  const trackedRoot = gitTrackedRootMdFiles();

  const missingFromIndex = trackedRoot.filter((f) => !referenced.has(f) && f !== "DOCUMENT-INDEX.md");
  const brokenRefs = [...referenced].filter((f) => !fs.existsSync(path.join(ROOT, f)));

  if (missingFromIndex.length) {
    issues.push({ type: "색인누락", files: missingFromIndex, detail: "DOCUMENT-INDEX.md에 등록 안 된 루트 .md 파일" });
  }
  if (brokenRefs.length) {
    issues.push({ type: "깨진색인", files: brokenRefs, detail: "DOCUMENT-INDEX.md가 참조하지만 실제로 없는 파일" });
  }

  if (fs.existsSync(changelogPath)) {
    const changelogContent = readFile(changelogPath);
    const topDate = changelogTopDate(changelogContent);
    const commitDate = lastCommitDate();
    if (topDate) {
      const diffDays = Math.round((commitDate - topDate) / (1000 * 60 * 60 * 24));
      if (diffDays > STALE_DAYS) {
        issues.push({
          type: "CHANGELOG_오래됨",
          files: [],
          detail: `최근 커밋(${commitDate.toISOString().slice(0, 10)}) 대비 CHANGELOG.md 최상단 항목이 ${diffDays}일 오래됨(경고)`,
        });
      }
    }
  }

  const report = {
    checkedAt: new Date().toISOString(),
    rootMdCount: trackedRoot.length,
    issueCount: issues.length,
    issues,
  };

  const reportPath = path.join(ROOT, "docs-sync-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log(`[check-docs-sync] 루트 .md ${trackedRoot.length}개 검사, 발견 ${issues.length}건`);
  for (const issue of issues) {
    console.log(`  - [${issue.type}] ${issue.detail}${issue.files.length ? ": " + issue.files.join(", ") : ""}`);
  }
  console.log(`[check-docs-sync] 리포트: ${reportPath}`);
}

main();
