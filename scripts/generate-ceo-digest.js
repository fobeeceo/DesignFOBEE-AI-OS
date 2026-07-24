#!/usr/bin/env node
/**
 * generate-ceo-digest.js — 정규직 AI 산출물 + 최근 결정 + 승인대기 항목을 하나의
 * CEO 다이제스트로 종합한다(CEO 지시: "보고서만 주면 승인/반려하겠다" §10 확장).
 *
 * ⚠️ 정직한 범위 고지: 이 스크립트는 다이제스트 "내용 생성"까지만 자동화한다.
 * 실제 이메일 발송은 Gmail API 자격증명이 배포 시스템에 없어 자동화돼 있지 않다
 * (Drive 이미지·Meta/YouTube API와 동일한 구조적 제약). 현재는 Claude Code 세션이
 * 이 스크립트의 출력을 가지고 이메일 초안을 만드는 반자동 방식이다(수동 호출, CEO 지시 준수).
 *
 * 사용: node scripts/generate-ceo-digest.js
 */
const fs = require("fs");
const path = require("path");
const { execSync, execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

function readFile(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "";
}

/** DECISION-LOG.md / CHANGELOG.md에서 최근 N개 "## " 섹션을 뽑는다. */
function topSections(content, count, skipTitle = true) {
  const lines = content.split("\n");
  const sections = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { heading: line.replace(/^##\s*/, ""), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) sections.push(current);
  return sections.slice(0, count);
}

function summarizeSection(section, maxBullets = 3) {
  const bullets = section.body
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .slice(0, maxBullets);
  return { heading: section.heading, bullets };
}

function runMenuStrategist() {
  try {
    execFileSync("python", ["src/erp_engine.py"], {
      cwd: path.join(ROOT, "content-automation-agent"),
      stdio: "pipe",
    });
    const reportPath = path.join(ROOT, "content-automation-agent", "output", "erp_daily_report.json");
    if (!fs.existsSync(reportPath)) return null;
    const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
    return report["메뉴엔지니어링"] || null;
  } catch (e) {
    return { available: false, reason: `실행 실패: ${e.message.split("\n")[0]}` };
  }
}

function approvalPending() {
  const todo = readFile(path.join(ROOT, "TODO.md"));
  const section = todo.split("## 완료")[0]; // "CEO 승인 대상" 섹션만
  return section
    .split("\n")
    .filter((l) => l.trim().startsWith("- [ ]") && l.includes("**"))
    .map((l) => l.replace(/^- \[ \]\s*/, "").trim());
}

function main() {
  const today = new Date().toISOString().slice(0, 10);

  const decisionLog = readFile(path.join(ROOT, "DECISION-LOG.md"));
  const changelog = readFile(path.join(ROOT, "CHANGELOG.md"));

  const recentDecisions = topSections(decisionLog, 3).map((s) => summarizeSection(s, 2));
  const recentChanges = topSections(changelog, 1)[0]; // "## [Unreleased]" 바로 아래 최신 ### 항목들
  const recentChangeItems = recentChanges
    ? recentChanges.body.filter((l) => l.trim().startsWith("### ")).slice(0, 3).map((l) => l.replace(/^###\s*/, "").trim())
    : [];

  const menuStrategy = runMenuStrategist();
  const pending = approvalPending();

  const lines = [];
  lines.push(`# DesignFOBEE AI HQ — CEO 다이제스트 (${today})`);
  lines.push("");
  lines.push("## 1. AI 메뉴전략가 — 오늘의 제안");
  if (menuStrategy && menuStrategy.available) {
    const dogs = (menuStrategy["단종후보"] || []).map((m) => m["메뉴"]);
    const puzzles = (menuStrategy["프로모션후보"] || []).map((m) => m["메뉴"]);
    lines.push(`- 단종 후보: ${dogs.length ? dogs.join(", ") : "없음"}`);
    lines.push(`- 프로모션 후보: ${puzzles.length ? puzzles.join(", ") : "없음"}`);
  } else {
    lines.push(`- 확인 불가(${menuStrategy ? menuStrategy.reason : "산출물 없음"}) — 추측하지 않음`);
  }
  lines.push("");
  lines.push("## 2. 최근 결정 사항 (DECISION-LOG.md 최신 3건)");
  for (const d of recentDecisions) {
    lines.push(`- **${d.heading}**`);
    for (const b of d.bullets) lines.push(`  ${b}`);
  }
  lines.push("");
  lines.push("## 3. 최근 변경 (CHANGELOG.md)");
  for (const c of recentChangeItems) lines.push(`- ${c}`);
  lines.push("");
  lines.push("## 4. CEO 승인 필요 사항");
  if (pending.length) {
    for (const p of pending) lines.push(`- ${p}`);
  } else {
    lines.push("- 없음");
  }
  lines.push("");
  lines.push("---");
  lines.push("이 메일에 회신으로 승인/반려(또는 코멘트)를 남겨주시면 다음 작업에 반영합니다.");

  const digest = lines.join("\n");
  console.log(digest);

  const outPath = path.join(ROOT, `ceo-digest-${today}.md`);
  fs.writeFileSync(outPath, digest, "utf-8");
  console.error(`\n[generate-ceo-digest] 저장: ${outPath}`);
}

main();
