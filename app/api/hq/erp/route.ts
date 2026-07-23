import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ERP_SNAPSHOT } from "@/lib/hq/erpSnapshot";

export const dynamic = "force-dynamic";

const OUT_DIR = path.join(process.cwd(), "content-automation-agent", "output");

type DailyReport = {
  date: string;
  store: string;
  재고부족_건수: number;
  긴급발주_건수: number;
  발주추천: { 품목: string; 현재: number; 적정: number; 발주추천: number; 긴급: boolean }[];
  평균원가율: number;
  메뉴원가: { 메뉴: string; 판매가: number; 원가율: number }[];
  디저트: {
    품목수: number;
    평균판매가: number;
    평균원가율: number;
    고원가_TOP: { 메뉴: string; 판매가: number; 원가율: number }[];
  };
  메뉴엔지니어링: MenuEngineering;
};

type MenuEngineeringRow = {
  메뉴: string; 판매량: number; 판매가: number; 마진: number; 원가율: number; 분류: string; 제안: string;
};
type MenuEngineering =
  | { available: false; reason: string }
  | {
      available: true;
      기준_평균판매량: number;
      기준_평균마진: number;
      인기도_임계값: number;
      단종후보: MenuEngineeringRow[];
      프로모션후보: MenuEngineeringRow[];
      전체: MenuEngineeringRow[];
    };

type PosAnalysis = {
  period: string;
  상품수: number;
  총판매수량: number;
  총매출_순액: number;
  총할인: number;
  판매순위_수량: { 메뉴: string; 수량: number; 매출: number }[];
  판매순위_매출: { 메뉴: string; 매출: number; 수량: number }[];
};

async function readJson<T>(file: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path.join(OUT_DIR, file), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * erp_engine.py(daily_report)·pos_import.py(analyze) 실행 산출물을 읽어
 * ERP_SNAPSHOT과 동일한 형태로 변환. 산출물이 없으면(Vercel 등, .gitignore 처리됨) null.
 */
async function readLiveData() {
  const [report, pos] = await Promise.all([
    readJson<DailyReport>("erp_daily_report.json"),
    readJson<PosAnalysis>("pos_analysis.json"),
  ]);
  if (!report) return null;

  return {
    ...ERP_SNAPSHOT,
    updatedAt: report.date ?? ERP_SNAPSHOT.updatedAt,
    store: report.store ?? ERP_SNAPSHOT.store,
    sales: pos
      ? {
          period: pos.period || ERP_SNAPSHOT.sales.period,
          revenue: pos.총매출_순액,
          qty: pos.총판매수량,
          discount: pos.총할인,
          products: pos.상품수,
        }
      : ERP_SNAPSHOT.sales,
    topByQty: pos
      ? pos.판매순위_수량.slice(0, 5).map((i) => ({ name: i.메뉴, qty: i.수량, revenue: i.매출 }))
      : ERP_SNAPSHOT.topByQty,
    topByRevenue: pos
      ? pos.판매순위_매출.slice(0, 3).map((i) => ({ name: i.메뉴, revenue: i.매출, qty: i.수량 }))
      : ERP_SNAPSHOT.topByRevenue,
    inventory: {
      shortageCount: report.재고부족_건수,
      urgentCount: report.긴급발주_건수,
      reorders: report.발주추천.map((r) => ({
        item: r.품목,
        current: r.현재,
        safe: r.적정,
        order: r.발주추천,
        urgent: r.긴급,
      })),
    },
    cost: {
      avgRatio: report.평균원가율,
      menus: report.메뉴원가.map((m) => ({ name: m.메뉴, price: m.판매가, ratio: m.원가율 })),
    },
    dessert: {
      count: report.디저트.품목수,
      avgPrice: report.디저트.평균판매가,
      avgRatio: report.디저트.평균원가율,
      highRatio: report.디저트.고원가_TOP.map((m) => ({ name: m.메뉴, price: m.판매가, ratio: m.원가율 })),
    },
    menuEngineering: report.메뉴엔지니어링,
  };
}

/**
 * AI HQ ERP 라이브 API.
 * content-automation-agent(erp_engine.py·pos_import.py) 실행 산출물이 로컬/서버 파일시스템에 있으면
 * 그 실데이터를 읽어 반환(source: "live"). 없으면(Vercel 배포본 등, output/은 .gitignore로 미추적)
 * SSOT 스냅샷으로 폴백(source: "snapshot"). 스냅샷도 동일 산출물을 손으로 옮겨 만든 실제값.
 */
export async function GET() {
  const live = await readLiveData();
  if (live) return NextResponse.json({ ok: true, source: "live", data: live });
  return NextResponse.json({ ok: true, source: "snapshot", data: ERP_SNAPSHOT });
}
