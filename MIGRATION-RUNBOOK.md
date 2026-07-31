# Migration 실행 런북 (백업 · 롤백 · 위험요소)

대상 마이그레이션 2건 (아직 **미적용**, 대표 승인 후에만 실행):

| # | 폴더 | 내용 |
|---|---|---|
| 1 | `20260730080000_add_franchise_lead_fields` | 가맹상담 입력 필드 7개 추가 |
| 2 | `20260731090000_add_franchise_ai_fields` | AI 진단 필드 8개 + enum + 인덱스 5개 |

현재 Supabase 프로젝트가 일시정지 상태(`FATAL: tenant/user ... not found`)라 적용할 수 없다.
DB 연결이 복구된 뒤, 아래 순서를 그대로 따른다.

---

## 1. 실행할 SQL 전체

### 마이그레이션 1
```sql
ALTER TABLE "leads" ADD COLUMN "consultationPurpose" TEXT,
ADD COLUMN "currentOccupation" TEXT,
ADD COLUMN "expectedInvestment" TEXT,
ADD COLUMN "hasStorefront" BOOLEAN,
ADD COLUMN "plannedTiming" TEXT,
ADD COLUMN "preferredRegion" TEXT,
ADD COLUMN "privacyConsent" BOOLEAN NOT NULL DEFAULT false;
```

### 마이그레이션 2
```sql
CREATE TYPE "LeadPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

ALTER TABLE "leads" ADD COLUMN "aiMemo" TEXT,
ADD COLUMN "aiSummary" TEXT,
ADD COLUMN "fitScore" INTEGER,
ADD COLUMN "nextAction" TEXT,
ADD COLUMN "priority" "LeadPriority",
ADD COLUMN "recommendedCases" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "referenceNo" TEXT,
ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE UNIQUE INDEX "leads_referenceNo_key" ON "leads"("referenceNo");
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");
CREATE INDEX "leads_source_idx" ON "leads"("source");
CREATE INDEX "leads_priority_idx" ON "leads"("priority");
CREATE INDEX "leads_preferredRegion_idx" ON "leads"("preferredRegion");
```

---

## 2. 위험도 평가

| 항목 | 판정 | 근거 |
|---|---|---|
| 기존 데이터 삭제 | **없음** | `DROP`·`DELETE`·`TRUNCATE` 구문이 하나도 없다 |
| 기존 컬럼 변경 | **없음** | 기존 컬럼의 타입·이름·제약을 건드리지 않는다 |
| 추가 컬럼의 NULL 허용 | 대부분 허용 | 기존 행은 전부 NULL로 채워지고 애플리케이션도 NULL을 정상 처리 |
| `privacyConsent NOT NULL` | 낮음 | `DEFAULT false`가 있어 기존 행이 자동으로 false로 채워진다 |
| `referenceNo` UNIQUE 인덱스 | 낮음 | 기존 행은 전부 NULL이고, Postgres는 NULL 중복을 허용한다 |
| 테이블 잠금 | 낮음 | Postgres 11+ 에서 DEFAULT 있는 컬럼 추가는 테이블 재작성 없이 즉시 완료 |
| 인덱스 생성 잠금 | **주의** | 아래 3번 참고 |
| 되돌리기 가능 여부 | 가능 | 4번 롤백 SQL로 완전 원복 가능 |

**종합 판정: 낮은 위험.** 다만 인덱스 생성 중 짧은 쓰기 잠금이 발생할 수 있어, 상담 유입이 적은
시간대(심야)에 실행하는 것을 권한다.

---

## 3. 실행 전 백업 (필수)

### 방법 A — Supabase 자동 백업 확인 (권장, 가장 간단)
1. Supabase 대시보드 → 해당 프로젝트 → **Database → Backups**
2. 최신 백업 시각이 **오늘** 인지 확인한다. (Pro 플랜은 일 단위 자동 백업)
3. 시각이 오래되었으면 방법 B를 반드시 병행한다.

### 방법 B — leads 테이블 수동 백업 (권장, 무료 플랜은 필수)
DB 연결 복구 후, SQL Editor에서 실행:
```sql
CREATE TABLE leads_backup_20260731 AS SELECT * FROM leads;
SELECT count(*) FROM leads_backup_20260731;
```
- 원본 `leads`는 그대로 두고 사본만 만든다.
- 마이그레이션 성공 및 운영 검증 완료 후, 승인 하에 사본을 정리한다.

### 방법 C — 파일로 덤프 (추가 안전장치)
```bash
pg_dump "$DIRECT_URL" -t leads --data-only -f leads_backup_20260731.sql
```

**세 방법 중 최소 A+B는 반드시 수행한 뒤 마이그레이션을 실행한다.**

---

## 4. 롤백 방법

### 4-1. 마이그레이션만 되돌리기 (데이터 유지, 권장)
추가한 컬럼·인덱스·타입만 제거한다. 기존 데이터는 영향받지 않는다.

```sql
-- 마이그레이션 2 롤백
DROP INDEX IF EXISTS "leads_preferredRegion_idx";
DROP INDEX IF EXISTS "leads_priority_idx";
DROP INDEX IF EXISTS "leads_source_idx";
DROP INDEX IF EXISTS "leads_createdAt_idx";
DROP INDEX IF EXISTS "leads_referenceNo_key";

ALTER TABLE "leads"
  DROP COLUMN IF EXISTS "aiMemo",
  DROP COLUMN IF EXISTS "aiSummary",
  DROP COLUMN IF EXISTS "fitScore",
  DROP COLUMN IF EXISTS "nextAction",
  DROP COLUMN IF EXISTS "priority",
  DROP COLUMN IF EXISTS "recommendedCases",
  DROP COLUMN IF EXISTS "referenceNo",
  DROP COLUMN IF EXISTS "tags";

DROP TYPE IF EXISTS "LeadPriority";

-- 마이그레이션 1 롤백
ALTER TABLE "leads"
  DROP COLUMN IF EXISTS "consultationPurpose",
  DROP COLUMN IF EXISTS "currentOccupation",
  DROP COLUMN IF EXISTS "expectedInvestment",
  DROP COLUMN IF EXISTS "hasStorefront",
  DROP COLUMN IF EXISTS "plannedTiming",
  DROP COLUMN IF EXISTS "preferredRegion",
  DROP COLUMN IF EXISTS "privacyConsent";
```

⚠️ 롤백하면 **마이그레이션 이후 새로 접수된 상담의 AI 분석 값과 접수번호는 사라진다**
(컬럼 자체가 없어지므로). 이름·연락처·문의내용 등 기본 상담 정보는 유지된다.
운영 중 롤백이 필요하면, 먼저 3번 방법 B로 현재 상태를 한 번 더 백업하고 진행한다.

### 4-2. 코드도 함께 되돌리기
DB만 롤백하면 애플리케이션이 없는 컬럼을 조회해 오류가 난다. 반드시 함께 되돌린다.
```bash
git revert 0f2967c fd280ff
```
그 후 `npx prisma generate` 실행.

### 4-3. 전체 복원 (최후 수단)
```sql
DROP TABLE leads;
ALTER TABLE leads_backup_20260731 RENAME TO leads;
```
⚠️ 이 방법은 백업 시점 이후 접수된 상담이 전부 사라진다. 대표 승인 없이 수행 금지.

---

## 5. 실행 절차 (승인 후)

```bash
npx prisma migrate status
```
```bash
npx prisma migrate deploy
```

1. `migrate status`로 미적용 마이그레이션 2건을 확인한다.
2. 3번 백업을 수행한다.
3. `migrate deploy` 실행 (`migrate dev`는 운영 DB에서 절대 사용하지 않는다 — 데이터 삭제 위험).
4. 아래 6번 검증을 수행한다.
5. 실패 시 4번 롤백을 수행하고 대표에게 즉시 보고한다.

⚠️ `prisma migrate reset`, `prisma db push --force-reset`은 **어떤 경우에도 사용하지 않는다**
(전체 데이터 삭제).

---

## 6. 적용 후 검증 체크리스트

```sql
-- 컬럼 15개가 추가되었는지
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads' ORDER BY ordinal_position;

-- 인덱스 5개 확인
SELECT indexname FROM pg_indexes WHERE tablename = 'leads';

-- 기존 데이터 건수가 그대로인지 (백업본과 비교)
SELECT (SELECT count(*) FROM leads) AS now,
       (SELECT count(*) FROM leads_backup_20260731) AS backup;
```

애플리케이션 검증:
- [ ] `/franchise` 상담 신청 → 저장 성공
- [ ] 완료 모달에 접수번호(GBR-YYYYMMDD-NNNN) · AI 점수 · 추천사례 표시
- [ ] 관리자 리드 목록에서 접수번호로 검색
- [ ] 관리자 상세에 AI 진단(점수·우선순위·태그) 표시
- [ ] AI 상담요약 패널 저장 동작
- [ ] `getLeadStats()` 집계값이 실제 DB 건수와 일치

---

## 7. 사전 준비 사항

- Supabase 프로젝트 재개 (현재 일시정지 상태 — 대표 계정에서 Resume 필요)
- `DATABASE_URL` / `DIRECT_URL` 환경변수 유효성 확인
- 실행 시간대: 상담 유입이 적은 심야 권장
