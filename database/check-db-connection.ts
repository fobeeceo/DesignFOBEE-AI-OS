/**
 * GBRICK DB 연결 확인 스크립트
 * 실행: DATABASE_URL=... DIRECT_URL=... npx tsx database/check-db-connection.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 GBRICK DB 연결 확인...\n");

  // 1. 연결 테스트
  console.log("1️⃣  DB 연결 테스트...");
  await prisma.$queryRaw`SELECT 1 as ping`;
  console.log("   ✅ PostgreSQL 연결 성공\n");

  // 2. GBRICK 테이블 존재 확인
  console.log("2️⃣  GBRICK 테이블 확인...");
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename LIKE 'gb_%'
    ORDER BY tablename
  `;
  console.log(`   총 ${tables.length}개 GB 테이블:`);
  tables.forEach((t) => console.log(`   - ${t.tablename}`));

  if (tables.length < 30) {
    console.log("\n   ⚠️  테이블이 부족합니다. Migration을 실행하세요:");
    console.log("   npx prisma migrate deploy --schema=database/prisma/schema.prisma");
    return;
  }
  console.log("\n   ✅ 테이블 정상\n");

  // 3. 매장 데이터 확인
  console.log("3️⃣  매장 데이터 확인...");
  const storeCount = await prisma.gbStore.count();
  console.log(`   매장: ${storeCount}개`);
  if (storeCount === 0) {
    console.log("   ℹ️  시드 데이터가 없습니다. seed-gbrick.ts를 실행하세요.");
  }

  // 4. 메뉴 데이터 확인
  const menuCount = await prisma.gbMenu.count();
  console.log(`   메뉴: ${menuCount}개`);

  // 5. DB 버전
  const version = await prisma.$queryRaw<{ version: string }[]>`SELECT version()`;
  console.log(`\n   📊 DB: ${version[0].version.split(" ").slice(0, 2).join(" ")}`);

  console.log("\n✅ DB 상태 정상 — GBRICK APP 실제 모드로 운영 가능합니다.");
}

main()
  .catch((e) => { console.error("❌ 연결 실패:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
