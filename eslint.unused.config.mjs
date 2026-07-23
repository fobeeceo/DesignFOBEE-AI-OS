// Unused Import 전용 ESLint 설정 — audit.js 가 사용. 메인 lint 게이트와 분리.
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    ignores: ["**/*.d.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // @next/next·react-hooks도 함께 등록한다 — 소스의 eslint-disable 주석이 이 플러그인들의
    // 규칙을 참조하는데, 미등록 상태면 "Definition for rule ... was not found" 오탐이 난다
    // (unused-vars만 보는 체크지만, 규칙 해석 자체는 플러그인이 있어야 가능).
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@next/next": nextPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
    },
  },
];
