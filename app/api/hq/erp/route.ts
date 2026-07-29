import { NextResponse } from "next/server";
import path from "path";
import { ERP_SNAPSHOT } from "@/lib/hq/erpSnapshot";
import type { ErpData, ErpApiResponse, MenuEngineering } from "@/lib/hq/types";
import { config } from "@/lib/core/config";
import { readJsonFile } from "@/lib/core/helpers";
import { logger } from "@/lib/core/logger";

export const dynamic = "force-dynamic";

const OUT_DIR = config.contentAutomationOutputDir();

/** erp_engine.py `daily_report()`가 실제로 쓰는 원시 JSON 산출물 형태(한글 키, 파이썬 산출물 그대로). */
type DailyReport = {
  date: string;
  store: string;
  재고부족_건수: number;
  긴급발주_건수: number;
  발주추천: { 품목: string; 현재: number; 적정: number; 발주추천: number; 긴급: boolean }[];
  발주서초안: {
    발주ID: string; 품목: string; 현재재고: number; 안전재고: number;
    발주추천수량: number; 긴급: boolean; 공급처: string; 예상금액: number | null; 승인상태: string;
  }[];
  발주거래처합계: { 거래처: string; 품목수: number; 예상금액합계: number | null; 비고: string | null }[];
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

type PosAnalysis = {
  period: string;
  상품수: number;
  총판매수량: number;
  총매출_순액: number;
  총할인: number;
  판매순위_수량: { 메뉴: string; 수량: number; 매출: number }[];
  판매순위_매출: { 메뉴: string; 매출: number; 수량: number }[];
};

/**
 * erp_engine.py(daily_report)·pos_import.py(analyze) 실행 산출물을 읽어
 * ErpData(Dashboard·ERP 상세 공용 타입)로 변환. 산출물이 없으면(Vercel 등, .gitignore 처리됨) null.
 */
async function readLiveData(): Promise<ErpData | null> {
  const [report, pos] = await Promise.all([
    readJsonFile<DailyReport>(path.join(OUT_DIR, "erp_daily_report.json")),
    readJsonFile<PosAnalysis>(path.join(OUT_DIR, "pos_analysis.json")),
  ]);
  if (!report) {
    logger.warn("hq.erp", "erp_daily_report.json 없음 — 스냅샷으로 폴백");
    return null;
  }

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
      purchaseOrders: (report.발주서초안 ?? []).map((o) => ({
        id: o.발주ID,
        item: o.품목,
        current: o.현재재고,
        safe: o.안전재고,
        order: o.발주추천수량,
        urgent: o.긴급,
        supplier: o.공급처,
        estimatedCost: o.예상금액,
        approvalStatus: o.승인상태,
      })),
      supplierTotals: (report.발주거래처합계 ?? []).map((s) => ({
        supplier: s.거래처,
        itemCount: s.품목수,
        totalCost: s.예상금액합계,
        note: s.비고,
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
  if (live) logger.info("hq.erp", "live 데이터 응답");
  const body: ErpApiResponse = live
    ? { ok: true, source: "live", data: live }
    : { ok: true, source: "snapshot", data: ERP_SNAPSHOT };
  return NextResponse.json(body);
}
