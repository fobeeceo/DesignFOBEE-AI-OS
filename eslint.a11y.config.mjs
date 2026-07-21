// 접근성(Accessibility) 전용 ESLint 설정 — 메인 lint(eslint.config.mjs)와 분리.
// 이유: jsx-a11y/recommended를 메인 게이트에 합치면 기존 통과 기준이 갑자기 깨짐.
// scripts/qa-extended.js 가 이 설정으로 별도 실행해 QA-REPORT.md 에 보고한다.
import jsxA11y from "eslint-plugin-jsx-a11y";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["app/**/*.{tsx,jsx}", "components/**/*.{tsx,jsx}"],
    ignores: ["**/*.d.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
];
