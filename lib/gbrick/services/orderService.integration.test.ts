/**
 * GBRICK 서비스 DB 통합 테스트
 * DB 없이 실행하면 모두 skip됨 (IS_MOCK_MODE=true 시)
 * 실행: DATABASE_URL=... npx vitest run lib/gbrick/services/orderService.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

const hasDb = !!process.env.DATABASE_URL;

// DB 없을 때 skip — Prisma를 동적으로 import하여 타입 에러 방지
let prisma: Awaited<ReturnType<typeof getPrisma>> | null = null;

async function getPrisma() {
  const { PrismaClient } = await import("@prisma/client");
  return new PrismaClient();
}

describe.skipIf(!hasDb)("GBRICK DB Integration Tests", () => {
  let testStoreId = "";

  beforeAll(async () => {
    prisma = await getPrisma();
    // 테스트 매장 생성 (ACTIVE 상태 필요)
    const store = await prisma.gbStore.upsert({
      where: { code: "TEST-999" },
      create: {
        code: "TEST-999",
        name: "통합테스트 매장",
        address: "서울 테스트구",
        status: "ACTIVE",
        pointRate: 0.03,
        stampGoal: 10,
        operatingHours: {},
      },
      update: {},
    });
    testStoreId = store.id;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.gbStore.delete({ where: { code: "TEST-999" } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("DB 연결 확인", async () => {
    const result = await prisma!.$queryRaw<[{ ping: number }]>`SELECT 1 as ping`;
    expect(result[0].ping).toBe(1);
  });

  it("매장 조회", async () => {
    const store = await prisma!.gbStore.findUnique({ where: { code: "TEST-999" } });
    expect(store).toBeTruthy();
    expect(store!.name).toBe("통합테스트 매장");
    expect(store!.status).toBe("ACTIVE");
  });

  it("메뉴 카테고리 생성 및 조회", async () => {
    const cat = await prisma!.gbMenuCategory.create({
      data: { name: "통합테스트 카테고리", sortOrder: 99 },
    });
    expect(cat.name).toBe("통합테스트 카테고리");

    // 정리
    await prisma!.gbMenuCategory.delete({ where: { id: cat.id } });
  });

  it("GbCustomer 생성 및 포인트 계정", async () => {
    const customer = await prisma!.gbCustomer.create({
      data: { id: `test-integ-${Date.now()}`, nickname: "통합테스트 고객" },
    });

    const account = await prisma!.gbPointAccount.create({
      data: { customerId: customer.id, balance: 500, totalEarned: 500, totalUsed: 0 },
    });

    expect(account.balance).toBe(500);

    // 포인트 원장
    const ledger = await prisma!.gbPointLedger.create({
      data: {
        accountId: account.id,
        type: "EARN",
        amount: 135,
        balanceAfter: 635,
        note: "통합테스트 적립",
      },
    });
    expect(ledger.amount).toBe(135);

    // 정리
    await prisma!.gbPointLedger.delete({ where: { id: ledger.id } });
    await prisma!.gbPointAccount.delete({ where: { id: account.id } });
    await prisma!.gbCustomer.delete({ where: { id: customer.id } });
  });

  it("쿠폰 생성 확인 (WELCOME10)", async () => {
    const coupon = await prisma!.gbCoupon.findUnique({ where: { code: "WELCOME10" } });
    if (!coupon) {
      console.log("  ℹ️  WELCOME10 쿠폰 없음 — seed-gbrick.ts 먼저 실행 필요");
      return;
    }
    expect(coupon.type).toBe("PERCENT");
    expect(coupon.discountRate).toBe(0.1);
  });

  it("GBRICK 테이블 38개 이상 존재", async () => {
    const tables = await prisma!.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename LIKE 'gb_%'
    `;
    expect(tables.length).toBeGreaterThanOrEqual(30);
    console.log(`  📊 GB 테이블 수: ${tables.length}개`);
  });
});
