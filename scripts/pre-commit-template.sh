#!/bin/sh
# GBRICK AI HQ — 커밋 전 QA/Audit/문서동기화 자동 검증 (npm run verify).
# 설치: cp scripts/pre-commit-template.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
npm run verify
