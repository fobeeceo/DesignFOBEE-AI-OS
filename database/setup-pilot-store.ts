export {};
/**
 * GBRICK Coffee 직영점 파일럿 셋업
 * 실행: DATABASE_URL=... DIRECT_URL=... NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx database/setup-pilot-store.ts
 *
 * 대상: gbrick-app-dev (rzgrkrffksqdeztzxyrt) ONLY
 * 운영 DB에 절대 실행 금지
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require("@supabase/supabase-js");

const prisma = new PrismaClient();

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl?.includes("rzgrkrffksqdeztzxyrt")) {
    console.error("❌ 대상 DB가 gbrick-app-dev가 아닙니다. 중단합니다.");
    console.error("   DATABASE_URL:", dbUrl?.split("@")[1] ?? "(없음)");
    process.exit(1);
  }

  console.log("🚀 GBRICK Coffee 직영점 파일럿 셋업 시작\n");

  // ── 1. 직영점 ────────────────────────────────────────────────────
  console.log("📍 직영점 등록...");
  const pilotStore = await prisma.gbStore.upsert({
    where: { code: "GBR-PILOT-001" },
    create: {
      code: "GBR-PILOT-001",
      name: "GBRICK Coffee 직영점",
      address: "서울시 (직영점 주소 입력 필요)",
      phone: "02-000-0000",
      status: "ACTIVE",
      pointRate: 0.03,
      stampGoal: 10,
      brandName: "GBRICK Coffee",
      operatingHours: {
        mon: "09:00-21:00", tue: "09:00-21:00", wed: "09:00-21:00",
        thu: "09:00-21:00", fri: "09:00-22:00", sat: "10:00-22:00", sun: "10:00-20:00",
      },
    },
    update: { status: "ACTIVE" },
  });
  console.log(`  ✅ 직영점: ${pilotStore.name} (${pilotStore.id})`);

  // ── 2. Supabase 관리자 계정 (서비스 롤 필요) ────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    console.log("\n👤 관리자 계정 생성...");
    const adminClient = createClient(supabaseUrl, serviceKey);

    // 비밀번호는 환경변수에서 읽음 (없으면 랜덤 생성)
    const hqPwd = process.env.PILOT_HQ_PASSWORD || `Gbrick-${Math.random().toString(36).slice(2, 10)}!`;
    const storePwd = process.env.PILOT_STORE_PASSWORD || `Gbrick-${Math.random().toString(36).slice(2, 10)}!`;
    const testPwd = process.env.PILOT_TEST_PASSWORD || `Gbrick-${Math.random().toString(36).slice(2, 10)}!`;

    // CEO 본사 관리자 계정
    const { data: hqAdmin, error: hqErr } = await adminClient.auth.admin.createUser({
      email: "ceo@fobee.co.kr",
      password: hqPwd,
      email_confirm: true,
      user_metadata: { role: "HQ_SUPER_ADMIN", name: "이대성 대표" },
    });
    if (hqErr && !hqErr.message.includes("already")) {
      console.log(`  ⚠️  CEO 계정: ${hqErr.message}`);
    } else {
      console.log(`  ✅ CEO 본사 관리자: ceo@fobee.co.kr (pw: ${hqPwd})`);
    }

    // 직영점 점주 계정
    const { data: storeOwner, error: ownerErr } = await adminClient.auth.admin.createUser({
      email: "store@gbrick.co.kr",
      password: storePwd,
      email_confirm: true,
      user_metadata: { role: "STORE_OWNER", storeId: pilotStore.id, name: "직영점 점주" },
    });
    if (ownerErr && !ownerErr.message.includes("already")) {
      console.log(`  ⚠️  점주 계정: ${ownerErr.message}`);
    } else {
      console.log(`  ✅ 직영점 점주: store@gbrick.co.kr (pw: ${storePwd})`);
    }

    // 테스트 고객 계정
    const { data: testCustomer, error: custErr } = await adminClient.auth.admin.createUser({
      email: "test@gbrick.co.kr",
      password: testPwd,
      email_confirm: true,
      user_metadata: { role: "CUSTOMER", name: "테스트 고객" },
    });
    if (custErr && !custErr.message.includes("already")) {
      console.log(`  ⚠️  테스트 고객: ${custErr.message}`);
    } else if (testCustomer?.user) {
      // GbCustomer 레코드도 생성
      await prisma.gbCustomer.upsert({
        where: { id: testCustomer.user.id },
        create: {
          id: testCustomer.user.id,
          nickname: "테스트 고객",
          email: "test@gbrick.co.kr",
        },
        update: {},
      });
      // 포인트 계정 생성
      await prisma.gbPointAccount.upsert({
        where: { customerId: testCustomer.user.id },
        create: { customerId: testCustomer.user.id, balance: 500, totalEarned: 500, totalUsed: 0 },
        update: {},
      });
      console.log(`  ✅ 테스트 고객: test@gbrick.co.kr (500P 지급)`);
    }

    // 직영점 Staff 테이블 등록
    if (storeOwner?.user) {
      await prisma.gbStoreUser.upsert({
        where: { storeId_userId: { storeId: pilotStore.id, userId: storeOwner.user.id } },
        create: {
          storeId: pilotStore.id,
          userId: storeOwner.user.id,
          role: "STORE_OWNER",
          isActive: true,
        },
        update: {},
      });
      console.log(`  ✅ 직영점 점주 권한 등록 완료`);
    }

  } else {
    console.log("\n⚠️  Supabase 서비스 롤 키 없음 — 계정 생성 건너뜀");
    console.log("   NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY 설정 후 재실행");
  }

  // ── 3. 체크리스트 등록 ────────────────────────────────────────────
  console.log("\n✅ 직영점 체크리스트 등록...");
  const checklistItems = [
    { title: "매장 청소 및 위생 점검", category: "OPENING" },
    { title: "에스프레소 머신 예열 및 점검", category: "OPENING" },
    { title: "냉장·냉동 온도 확인 (2~5°C / -18°C 이하)", category: "OPENING" },
    { title: "재료 재고 확인 및 발주", category: "INVENTORY" },
    { title: "커피 원두 잔량 확인", category: "INVENTORY" },
    { title: "일일 매출 정산", category: "CLOSING" },
    { title: "마감 청소 및 소독", category: "CLOSING" },
    { title: "문 잠금 및 보안 확인", category: "CLOSING" },
    { title: "화재 감지기 및 소화기 확인", category: "SAFETY" },
    { title: "HACCP 위생관리 기록", category: "SAFETY" },
  ];

  let checklistCount = 0;
  for (const item of checklistItems) {
    const existing = await prisma.gbChecklist.findFirst({
      where: { storeId: pilotStore.id, title: item.title },
    });
    if (!existing) {
      await prisma.gbChecklist.create({
        data: { storeId: pilotStore.id, ...item },
      });
      checklistCount++;
    }
  }
  console.log(`  ✅ ${checklistCount}개 체크리스트 추가 완료`);

  console.log("\n🎉 파일럿 셋업 완료!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  직영점 ID : ${pilotStore.id}`);
  console.log("  HQ 관리자 : ceo@fobee.co.kr (위 콘솔 pw 확인)");
  console.log("  점주 계정 : store@gbrick.co.kr (위 콘솔 pw 확인)");
  console.log("  테스트 고객: test@gbrick.co.kr (위 콘솔 pw 확인)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n다음 단계:");
  console.log("  1. 직영점 주소/전화번호 업데이트");
  console.log("  2. npm run seed:gbrick (전체 메뉴 시드)");
  console.log("  3. /gbrick-hq/dashboard 에서 대시보드 확인");
  console.log("  4. /store/orders 에서 점주 주문 관리 확인");
}

main()
  .catch((e: Error) => { console.error("❌ 셋업 실패:", e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
