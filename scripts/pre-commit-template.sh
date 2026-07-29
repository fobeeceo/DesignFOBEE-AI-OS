#!/bin/sh
# GBRICK AI HQ — 커밋 전 QA/Audit/문서동기화 자동 검증 (npm run verify).
# 설치: cp scripts/pre-commit-template.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
npm run verify || exit 1
# verify가 audit-report.md·docs-sync-report.json(및 실행했다면 QA-REPORT.md)을 새로
# 재생성하므로, 그 결과를 같은 커밋에 포함시킨다(다음 git status가 매번 지저분해지는 것 방지).
git add audit-report.md docs-sync-report.json 2>/dev/null
if [ -f QA-REPORT.md ]; then git add QA-REPORT.md 2>/dev/null; fi
