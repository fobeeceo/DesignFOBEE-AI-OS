# GBRICK APP — 구현 계획서 v1.0

> CEO 전권 위임 명령서 v1.0 기준 | 2026-11-06

---

## 개발 원칙

| 원칙 | 내용 |
|------|------|
| MVP 우선 | 핵심 기능 먼저, 완벽함보다 작동하는 제품 |
| 무파괴 | 기존 DesignFOBEE 운영 시스템 절대 변경 금지 |
| 목업 허용 | Supabase dev 연결 전까지 Mock 데이터로 UI 개발 |
| PWA 우선 | 별도 앱 없이 모바일 웹으로 고객 앱 제공 |

---

## Phase 0: 시스템 분석 및 설계 ✅ COMPLETED

| 작업 | 상태 |
|------|------|
| 기존 시스템 감사 (16개 모델) | ✅ |
| 아키텍처 설계 (4개 서브시스템) | ✅ |
| DB 스키마 설계 (38개 Gb 모델) | ✅ |
| 구현 계획 수립 | ✅ |

---

## Phase 1: 핵심 인프라 ✅ IN PROGRESS

| 작업 | 상태 | 비고 |
|------|------|------|
| Prisma 스키마 38개 모델 추가 | ✅ | prisma generate 완료 |
| lib/gbrick/constants.ts | ✅ | 역할, 브랜드 상수 |
| lib/gbrick/auth.ts | ✅ | RBAC 미들웨어 |
| lib/gbrick/pointPolicy.ts | ✅ | 3% 기본 포인트 정책 |
| lib/gbrick/mockData.ts | ✅ | DB 없이 UI 개발 가능 |
| API: /api/gbrick/stores | ✅ | Mock 모드 지원 |
| API: /api/gbrick/menus | ✅ | Mock 모드 지원 |
| API: /api/gbrick/customers | ✅ | Mock 모드 지원 |
| API: /api/gbrick/orders | ✅ | Mock 모드 지원 |
| Prisma Migration 실행 | ⏳ | D-01: Supabase dev 프로젝트 필요 |

**D-01 블로커**: CEO가 Supabase dev 프로젝트 생성 → 4개 키 제공

---

## Phase 2: 고객 앱 UI (PWA) ✅ IN PROGRESS

| 작업 | 상태 |
|------|------|
| PWA manifest.json | ✅ |
| /gbrick layout (모바일 최적화) | ✅ |
| /gbrick 홈 화면 | ✅ |
| /gbrick/(auth)/login | ✅ |
| /gbrick/(auth)/signup | ✅ |
| /gbrick/(app)/stores (매장 목록) | ✅ |
| /gbrick/(app)/stores/[storeId]/menu | ✅ |
| /gbrick/(app)/cart | ✅ |
| /gbrick/(app)/history | ✅ |
| /gbrick/(app)/mypage | ✅ |
| PWA 아이콘 생성 | ⏳ |
| Service Worker | ⏳ |

---

## Phase 3: 주문/결제 (Mock Payment)

| 작업 | 상태 | 비고 |
|------|------|------|
| Mock 결제 플로우 | ⏳ | PG 계약 전 Mock |
| 포인트 적립/사용 API | ⏳ | /api/gbrick/points |
| 쿠폰 조회/사용 API | ⏳ | |
| 스탬프 적립 API | ⏳ | |
| 주문 상태 실시간 업데이트 | ⏳ | Supabase Realtime |

---

## Phase 4: 가맹점 시스템

| 작업 | 상태 |
|------|------|
| /store 가맹점 로그인 | ⏳ |
| /store/orders 주문 현황 | ⏳ |
| /store/menu 메뉴 관리 | ⏳ |
| /store/checklist 체크리스트 | ⏳ |
| /store/inquiry 문의/민원 | ⏳ |

---

## Phase 5: 본사 관리 시스템

| 작업 | 상태 |
|------|------|
| /gbrick-admin 본사 대시보드 | ⏳ |
| 가맹점 관리 | ⏳ |
| 메뉴 관리 | ⏳ |
| 쿠폰/캠페인 관리 | ⏳ |
| 매출 분석 | ⏳ |

---

## Phase 6: AI 분석

| 작업 | 상태 |
|------|------|
| Gemini API 연동 | ⏳ | GEMINI_API_KEY 환경변수 필요 |
| 매출 AI 분석 리포트 | ⏳ | |
| 고객 패턴 분석 | ⏳ | |

---

## Phase 7: 운영 배포

| 작업 | 상태 | 비고 |
|------|------|------|
| Supabase 운영 프로젝트 Migration | ⏳ | CEO 별도 승인 필요 |
| Vercel 도메인 설정 | ⏳ | gbrickcoffee.com |
| 운영 환경변수 설정 | ⏳ | CEO 별도 승인 필요 |

---

## 보류 의사결정 (D-02 ~ D-05)

| ID | 결정 사항 | 현재 기본값 |
|----|----------|------------|
| D-02 | 포인트 소멸 주기 | 1년 |
| D-03 | 주문 접수 후 취소 가능 시간 | 5분 |
| D-04 | PG사 선택 (Toss/KG이니시스/나이스) | Mock |
| D-05 | 모바일 앱 출시 여부 (React Native) | PWA 우선 |
