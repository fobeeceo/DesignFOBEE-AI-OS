/**
 * AI HQ ERP 공용 타입 — Dashboard(`app/hq/page.tsx`)·ERP 상세(`app/hq/erp/page.tsx`)·
 * `/api/hq/erp`(라이브)·`erpSnapshot.ts`(폴백)가 전부 이 타입 하나를 공유한다.
 * 구조 변경 시 이 파일만 고치면 나머지는 타입 에러로 즉시 드러난다(암묵적 any 금지).
 */

export type SalesSummary = {
  period: string;
  revenue: number;
  qty: number;
  discount: number;
  products: number;
};

export type RankedMenu = { name: string; qty: number; revenue: number };

export type Reorder = { item: string; current: number; safe: number; order: number; urgent: boolean };

export type PurchaseOrder = {
  id: string;
  item: string;
  current: number;
  safe: number;
  order: number;
  urgent: boolean;
  supplier: string;
  estimatedCost: number | null;
  approvalStatus: string;
};

export type SupplierTotal = {
  supplier: string;
  itemCount: number;
  totalCost: number | null;
  note: string | null;
};

export type InventoryData = {
  shortageCount: number;
  urgentCount: number;
  reorders: Reorder[];
  purchaseOrders: PurchaseOrder[];
  supplierTotals: SupplierTotal[];
};

export type CostMenu = { name: string; price: number; ratio: number };

export type CostData = { avgRatio: number; menus: CostMenu[] };

export type MastersData = { ingredientGroups: number; options: number; menus: number };

export type DessertData = {
  count: number;
  avgPrice: number;
  avgRatio: number;
  highRatio: CostMenu[];
};

export type MenuEngineeringRow = {
  메뉴: string; 판매량: number; 판매가: number; 마진: number; 원가율: number; 분류: string; 제안: string;
};

export type MenuEngineering =
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

/** Dashboard·ERP 상세가 공유하는 ERP 전체 데이터 형태. */
export interface ErpData {
  updatedAt: string;
  store: string;
  sales: SalesSummary;
  topByQty: RankedMenu[];
  topByRevenue: RankedMenu[];
  inventory: InventoryData;
  cost: CostData;
  masters: MastersData;
  dessert: DessertData;
  menuEngineering: MenuEngineering;
}

export type ErpApiResponse = { ok: true; source: "live" | "snapshot"; data: ErpData };
