export {};
/**
 * GBRICK Coffee 개발 DB 시드 데이터
 * 실행: DATABASE_URL=... DIRECT_URL=... npx tsx database/seed-gbrick.ts
 *
 * 대상: gbrick-app-dev (rzgrkrffksqdeztzxyrt)
 * 운영 DB에 절대 실행 금지
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 GBRICK Coffee 개발 DB 시드 시작...\n");

  // ── 1. 매장 ────────────────────────────────────────────────────
  console.log("📍 매장 생성...");
  const storeList = [
    { code: "GBR-001", name: "지브릭커피 신촌점", address: "서울 서대문구 신촌로 123", phone: "02-517-1474", status: "ACTIVE", lat: 37.5596, lng: 126.9377 },
    { code: "GBR-002", name: "지브릭커피 홍대점", address: "서울 마포구 와우산로 94", phone: "02-333-5678", status: "ACTIVE", lat: 37.5519, lng: 126.9237 },
    { code: "GBR-003", name: "지브릭커피 이태원점", address: "서울 용산구 이태원로 180", phone: "02-794-9012", status: "ACTIVE", lat: 37.5345, lng: 126.9941 },
    { code: "GBR-004", name: "지브릭커피 강남점", address: "서울 강남구 테헤란로 152", phone: "02-555-3456", status: "PENDING", lat: 37.4979, lng: 127.0276 },
  ];

  const stores = [];
  for (const s of storeList) {
    const store = await prisma.gbStore.upsert({
      where: { code: s.code },
      create: { ...s, pointRate: 0.03, stampGoal: 10, brandName: "GBRICK Coffee", operatingHours: {} },
      update: { name: s.name, status: s.status },
    });
    stores.push(store);
  }
  console.log(`  ✅ ${stores.length}개 매장 완료`);

  // ── 2. 메뉴 카테고리 ────────────────────────────────────────────
  console.log("📂 메뉴 카테고리 생성...");
  const catList = [
    { name: "시그니처", nameEn: "Signature", sortOrder: 1 },
    { name: "에스프레소", nameEn: "Espresso", sortOrder: 2 },
    { name: "논커피", nameEn: "Non Coffee", sortOrder: 3 },
    { name: "계절 한정", nameEn: "Seasonal", sortOrder: 4 },
    { name: "푸드", nameEn: "Food", sortOrder: 5 },
  ];

  const cats = [];
  for (const c of catList) {
    const existing = await prisma.gbMenuCategory.findFirst({ where: { name: c.name } });
    const cat = existing ?? await prisma.gbMenuCategory.create({ data: c });
    cats.push(cat);
  }
  const [catSig, catEsp, catNon, catSea, catFood] = cats;
  console.log(`  ✅ ${cats.length}개 카테고리 완료`);

  // ── 3. 메뉴 ────────────────────────────────────────────────────
  console.log("☕ 메뉴 생성...");
  const menuList = [
    { categoryId: catSig.id, name: "지브릭 라떼", nameEn: "GBRICK Latte", description: "스페셜티 원두로 만든 지브릭만의 시그니처 라떼", basePrice: 6500, isSignature: true, isNew: false, sortOrder: 1 },
    { categoryId: catEsp.id, name: "아메리카노", nameEn: "Americano", description: "스페셜티 원두의 깔끔한 아메리카노", basePrice: 4500, isSignature: false, isNew: false, sortOrder: 2 },
    { categoryId: catNon.id, name: "수제 자몽티", nameEn: "Homemade Grapefruit Tea", description: "직접 담근 수제 자몽청으로 만든 자몽티", basePrice: 6000, isSignature: true, isNew: false, sortOrder: 3 },
    { categoryId: catSea.id, name: "수제 팥빙수", nameEn: "Homemade Red Bean Shaved Ice", description: "직접 만든 수제 팥앙금을 올린 팥빙수", basePrice: 9000, isSignature: true, isNew: false, sortOrder: 4 },
    { categoryId: catSig.id, name: "바닐라 라떼", nameEn: "Vanilla Latte", description: "부드러운 바닐라향과 에스프레소의 조화", basePrice: 6000, isSignature: false, isNew: true, sortOrder: 5 },
    { categoryId: catFood.id, name: "버터 크루아상", nameEn: "Butter Croissant", description: "매일 아침 직접 굽는 버터 크루아상", basePrice: 3500, isSignature: false, isNew: false, sortOrder: 6 },
  ];

  const menus = [];
  for (const m of menuList) {
    const existing = await prisma.gbMenu.findFirst({ where: { name: m.name, categoryId: m.categoryId } });
    const menu = existing ?? await prisma.gbMenu.create({ data: m });
    menus.push(menu);
  }
  console.log(`  ✅ ${menus.length}개 메뉴 완료`);

  // ── 4. 쿠폰 ────────────────────────────────────────────────────
  console.log("🎟️ 쿠폰 생성...");
  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  const welcomeCoupon = await prisma.gbCoupon.upsert({
    where: { code: "WELCOME10" },
    create: {
      code: "WELCOME10",
      name: "웰컴 쿠폰 10%",
      description: "첫 주문 10% 할인 (최대 2,000원)",
      type: "PERCENT",
      status: "ACTIVE",
      discountRate: 0.1,
      minOrderAmount: 5000,
      maxDiscount: 2000,
      validFrom: now,
      validUntil: nextYear,
      perCustomerLimit: 1,
    },
    update: { status: "ACTIVE" },
  });
  console.log(`  ✅ 쿠폰 1개 완료 (${welcomeCoupon.code})`);

  // ── 5. 체크리스트 ──────────────────────────────────────────────
  console.log("✅ 체크리스트 생성...");
  const checklistItems = [
    { title: "매장 청소 및 위생 점검", category: "OPENING" },
    { title: "재료 재고 확인", category: "INVENTORY" },
    { title: "장비 점검 (에스프레소 머신, 그라인더)", category: "OPENING" },
    { title: "냉장·냉동 온도 확인", category: "SAFETY" },
    { title: "마감 청소", category: "CLOSING" },
    { title: "문 잠금 확인", category: "CLOSING" },
  ];

  const activeStores = stores.filter((s: { status: string }) => s.status === "ACTIVE");
  for (const store of activeStores) {
    for (const item of checklistItems) {
      const existing = await prisma.gbChecklist.findFirst({ where: { storeId: store.id, title: item.title } });
      if (!existing) {
        await prisma.gbChecklist.create({ data: { storeId: store.id, ...item } });
      }
    }
  }
  console.log(`  ✅ 활성 ${activeStores.length}개 매장 × ${checklistItems.length}개 체크리스트 완료`);

  console.log("\n🎉 GBRICK Coffee 개발 DB 시드 완료!");
  console.log(`  매장: ${stores.length}개 / 카테고리: ${cats.length}개 / 메뉴: ${menus.length}개 / 쿠폰: 1개`);
}

main()
  .catch((e: Error) => { console.error("❌ 시드 실패:", e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
