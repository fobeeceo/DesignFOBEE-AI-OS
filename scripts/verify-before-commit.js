#!/usr/bin/env node
/**
 * verify-before-commit.js — "PASS 아니면 Commit 금지"를 습관이 아니라 실제 게이트로 만든다.
 * npm run qa(lint+typecheck+build+test) → npm run audit → check-docs-sync 순으로 실행하고,
 * 하나라도 실패하면 non-zero exit(git pre-commit hook이 커밋을 막는다).
 */
const { execSync } = require("child_process");

const steps = [
  ["QA (lint+typecheck+build+test)", "npm run qa"],
  ["Audit", "npm run audit"],
  ["문서 동기화", "node scripts/check-docs-sync.js"],
];

for (const [label, cmd] of steps) {
  console.log(`\n[verify] ${label} 실행 중...`);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch {
    console.error(`\n[verify] 실패: ${label}. 커밋을 진행하지 않는다.`);
    process.exit(1);
  }
}

console.log("\n[verify] 전부 PASS — 커밋 진행 가능.");
