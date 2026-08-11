import type { ErpData } from "./types";

/**
 * HQ 데이터(Data) 레이어 — 가공하지 않은 SSOT 값만 둔다. 파생값 계산은 kpi.ts, 문자열
 * 포맷팅은 format.ts, 화면 표시는 app/hq/**로 분리되어 있다(3계층: Data → Calculation →
 * Presentation). 이 파일에는 계산식·포맷 함수를 추가하지 않는다.
 *
 * AI HQ ERP 실데이터 스냅샷 (SSOT: content-automation-agent/src erp_engine + pos_import).
 * POS clsProd 2026-07-01~07-20 · 재고관리 DB 2026-07-05 · 09_MENU_COST_TABLE.
 * 추후 라이브 API(/api/hq/erp)로 대체 가능한 형태. 값은 실제 계산 결과.
 * `/api/hq/erp`의 라이브 데이터와 동일한 `ErpData` 타입을 공유한다(Dashboard·ERP 상세 공용).
 */
export const ERP_SNAPSHOT: ErpData = {
  updatedAt: "2026-07-20",
  store: "지브릭커피 본점",
  sales: {
    period: "2026-07-01 ~ 2026-07-20",
    revenue: 16627700,
    qty: 5406,
    discount: 169250,
    products: 182,
  },
  topByQty: [
    { name: "ICE아메리카노(스페셜티)", qty: 804, revenue: 2139000 },
    { name: "카페라떼(기본2샷)", qty: 467, revenue: 1832800 },
    { name: "ICE아메리카노(예가체프)", qty: 279, revenue: 729000 },
    { name: "HOT아메리카노(스페셜티)", qty: 237, revenue: 735000 },
    { name: "팥빙수", qty: 200, revenue: 2400000 },
  ],
  topByRevenue: [
    { name: "팥빙수", revenue: 2400000, qty: 200 },
    { name: "ICE아메리카노(스페셜티)", revenue: 2139000, qty: 804 },
    { name: "카페라떼(기본2샷)", revenue: 1832800, qty: 467 },
  ],
  inventory: {
    shortageCount: 15,
    urgentCount: 3,
    reorders: [
      { item: "딸기라떼소분", current: 0, safe: 6, order: 6, urgent: true },
      { item: "치즈케익박스", current: 0, safe: 2, order: 2, urgent: true },
      { item: "초코케익박스", current: 0, safe: 2, order: 2, urgent: true },
      { item: "일반두유", current: 0.5, safe: 10, order: 9.5, urgent: false },
      { item: "우유", current: 1, safe: 10, order: 9, urgent: false },
      { item: "탄산수", current: 2, safe: 10, order: 8, urgent: false },
    ],
    purchaseOrders: [
      { id: "PO-2026-07-20-01", item: "딸기라떼소분", current: 0, safe: 6, order: 6, urgent: true, supplier: "본사 제작(자체 제조, 외부 거래처 없음)", estimatedCost: null, approvalStatus: "대기" },
      { id: "PO-2026-07-20-02", item: "치즈케익박스", current: 0, safe: 2, order: 2, urgent: true, supplier: "제원인터내셔날 (SUPPLIER-001, DESSERT)", estimatedCost: null, approvalStatus: "대기" },
      { id: "PO-2026-07-20-03", item: "초코케익박스", current: 0, safe: 2, order: 2, urgent: true, supplier: "제원인터내셔날 (SUPPLIER-001, DESSERT)", estimatedCost: null, approvalStatus: "대기" },
    ],
    supplierTotals: [
      { supplier: "제원인터내셔날 (SUPPLIER-001, DESSERT)", itemCount: 2, totalCost: null, note: "확인불가(단가 미확정)" },
      { supplier: "본사 제작(자체 제조, 외부 거래처 없음)", itemCount: 1, totalCost: null, note: "확인불가(단가 미확정)" },
    ],
  },
  cost: {
    avgRatio: 22.6,
    menus: [
      { name: "카페모카", price: 5400, ratio: 30.9 },
      { name: "자바칩프라페", price: 6500, ratio: 29.8 },
      { name: "망고빙수", price: 15000, ratio: 28.4 },
      { name: "카페라떼", price: 4400, ratio: 26.9 },
      { name: "아메리카노", price: 3500, ratio: 24.1 },
      { name: "에스프레소", price: 2500, ratio: 20.9 },
      { name: "팥빙수", price: 12000, ratio: 20.7 },
      { name: "레몬에이드", price: 5500, ratio: 14.4 },
      { name: "자몽에이드", price: 5500, ratio: 7.6 },
    ],
  },
  masters: { ingredientGroups: 57, options: 8, menus: 63 },
  dessert: {
    count: 28,
    avgPrice: 4411,
    avgRatio: 49.9,
    highRatio: [
      { name: "가나슈초코케이크", price: 7000, ratio: 62 },
      { name: "티라미수케이크", price: 6000, ratio: 59 },
      { name: "쿠키생크림케이크", price: 6000, ratio: 59 },
      { name: "크로아상", price: 2900, ratio: 57 },
      { name: "당근케익", price: 6000, ratio: 50 },
    ],
  },
  /** 메뉴 엔지니어링(Kasavana & Smith 매트릭스, SSOT: erp_engine.menu_engineering) — 판매량x마진 2x2 분류. */
  menuEngineering: {
    available: true,
    기준_평균판매량: 60,
    기준_평균마진: 6652,
    인기도_임계값: 42,
    단종후보: [
      { 메뉴: "카페모카", 판매량: 8, 판매가: 5400, 마진: 3731, 원가율: 30.9, 분류: "Dog", 제안: "단종 후보" },
      { 메뉴: "자바칩프라페", 판매량: 8, 판매가: 6500, 마진: 4563, 원가율: 29.8, 분류: "Dog", 제안: "단종 후보" },
      { 메뉴: "레몬에이드", 판매량: 1, 판매가: 5500, 마진: 4708, 원가율: 14.4, 분류: "Dog", 제안: "단종 후보" },
    ],
    프로모션후보: [
      { 메뉴: "망고빙수", 판매량: 37, 판매가: 15000, 마진: 10740, 원가율: 28.4, 분류: "Puzzle", 제안: "프로모션 · 이벤트로 노출 확대" },
    ],
    전체: [
      { 메뉴: "카페모카", 판매량: 8, 판매가: 5400, 마진: 3731, 원가율: 30.9, 분류: "Dog", 제안: "단종 후보" },
      { 메뉴: "자바칩프라페", 판매량: 8, 판매가: 6500, 마진: 4563, 원가율: 29.8, 분류: "Dog", 제안: "단종 후보" },
      { 메뉴: "레몬에이드", 판매량: 1, 판매가: 5500, 마진: 4708, 원가율: 14.4, 분류: "Dog", 제안: "단종 후보" },
      { 메뉴: "망고빙수", 판매량: 37, 판매가: 15000, 마진: 10740, 원가율: 28.4, 분류: "Puzzle", 제안: "프로모션 · 이벤트로 노출 확대" },
      { 메뉴: "팥빙수", 판매량: 246, 판매가: 12000, 마진: 9516, 원가율: 20.7, 분류: "Star", 제안: "유지 · 적극 홍보" },
    ],
  },
};

/**
 * AI 직원 조직 (SSOT: Notion AI Prompt Library + AI Media Workforce + AI-STAFF-POLICY.md §7).
 * status: 설계/개발중/수습/정규직/개선중/은퇴(CEO MASTER 업무지시서 §9 6단계 인사제도).
 */
export const AI_STAFF = {
  roles: [
    { name: "AI CEO(전략)", mission: "전략·리스크·대안 제시(공동 의사결정)", status: "정규직" },
    { name: "AI 디자이너", mission: "공간 사진 → AI 리디자인", status: "정규직" },
    { name: "AI 마케터", mission: "GBRICK 창업/브랜드 마케팅", status: "정규직" },
    { name: "AI 견적", mission: "예상 견적 산정", status: "개선중" },
    { name: "AI CRM", mission: "리드 응대·상담 관리", status: "수습" },
    { name: "AI 콘텐츠", mission: "SNS/블로그/쇼츠 기획(Media Director로 통합)", status: "설계" },
    { name: "AI 웹디자인전략가", mission: "경쟁사 분석·트렌드 반영 홈페이지 개선안", status: "정규직" },
    { name: "AI 메뉴전략가", mission: "판매량×마진 매트릭스로 단종·프로모션 후보 산출", status: "정규직" },
    { name: "헤르메스(전령)", mission: "내부 신호·대외 문의·부서 배분·외부 소식을 한 발송대기함으로 전달", status: "수습" },
  ],
  media: [
    { name: "Media Director", status: "정규직" },
    { name: "Trend Researcher", status: "정규직" },
    { name: "Blog Writer", status: "정규직" },
    { name: "Shorts Producer", status: "정규직" },
    { name: "SEO Manager", status: "정규직" },
    { name: "Content Analyst", status: "수습" },
    { name: "Voice Producer", status: "설계" },
    { name: "Video Editor", status: "설계" },
    { name: "Thumbnail Designer", status: "설계" },
    { name: "Instagram Manager", status: "설계" },
    { name: "YouTube Manager", status: "설계" },
    { name: "TikTok Manager", status: "설계" },
    { name: "Naver Blog Manager", status: "설계" },
  ],
} as const;

/**
 * 가맹/직영점 로스터 (SSOT: 대표 확인 2026-08-01).
 *
 * ⚠️ `live`(운영 여부)와 `pos`(POS 실데이터 연결)를 분리한다.
 *    이전에는 `live` 하나로 두 가지를 겸했는데, 운영 중인 매장을 live로 바꾸면
 *    POS가 붙지 않은 매장까지 "POS 연결"로 표시되어 버린다. 실제 POS 연결은 본점뿐이다.
 *
 * region·open이 "—"인 항목은 대표 확인 시 값이 나오지 않은 것이다. 추측해서 채우지 않는다.
 *
 * open에 "(추정)"이 붙은 항목은 대표 기억에 의한 개략 연도다(2026-08-02).
 * 가맹계약서 확인 후 정확한 날짜로 바꾸고 "(추정)"을 뗀다.
 * 확정값과 섞이지 않도록 표기를 남겨둔다 — 모르는 것을 아는 것처럼 쓰지 않는다(CLAUDE.md §0-2 원칙 3).
 */
export type Store = {
  name: string;
  type: "직영" | "가맹";
  region: string;
  area: string;
  open: string;
  /** 현재 영업 중인가 */
  live: boolean;
  /** POS 실데이터가 연결되어 자동 집계되는가 */
  pos: boolean;
  /** 폐점 사유 — live가 false일 때만 채운다. */
  closed?: string;
};

export const STORES: Store[] = [
  { name: "은평본점", type: "직영", region: "서울 은평구", area: "45평", open: "2013-11-11", live: true, pos: true },
  { name: "김포월곶점", type: "가맹", region: "경기 김포시", area: "65평(실시공 15평)", open: "2017-06-20", live: true, pos: false },
  { name: "일산가좌점", type: "가맹", region: "경기 고양시", area: "65평", open: "2018-04-10", live: true, pos: false },
  { name: "인덕원점", type: "가맹", region: "경기 의왕시", area: "35평", open: "2019-06-30", live: true, pos: false },
  { name: "덕은점", type: "가맹", region: "경기 고양 덕양", area: "15평", open: "2021-05-15", live: true, pos: false },

  { name: "안산점", type: "가맹", region: "경기 안산시", area: "—", open: "2015", live: false, pos: false, closed: "2019 양도 후 브랜드 이탈 — 같은 자리에서 다른 간판 영업 중" },
  { name: "단대점", type: "가맹", region: "경기 성남시", area: "—", open: "2013-12-23", live: false, pos: false, closed: "2023 승계 → 2024 폐점(승계 실패)" },
  { name: "원흥점", type: "가맹", region: "경기 고양시 원흥동", area: "30평", open: "2019(추정)", live: false, pos: false, closed: "점주 독립 브랜드 전환" },
  { name: "동백점", type: "가맹", region: "경기 용인시 동백동", area: "45평(1층 30 + 2층 15)", open: "2018(추정)", live: false, pos: false, closed: "2년 운영 후 개인 사정" },
  { name: "신원점", type: "가맹", region: "경기", area: "—", open: "2023-03-25", live: false, pos: false, closed: "건물주 임대료 협상 결렬" },
];

/** 현재 운영 중인 매장. 대시보드 집계는 이 값을 쓴다. */
export const OPERATING_STORES = STORES.filter((s) => s.live);
export const CLOSED_STORES = STORES.filter((s) => !s.live);

export const HQ_MENU = [
  { key: "", label: "CEO Dashboard", icon: "📊" },
  { key: "erp", label: "ERP", icon: "🏭" },
  { key: "franchise", label: "가맹점", icon: "🏪" },
  { key: "logistics", label: "물류", icon: "🚚" },
  { key: "academy", label: "교육센터", icon: "🎓" },
  { key: "content", label: "콘텐츠센터", icon: "🎬" },
  { key: "staff", label: "AI 직원", icon: "🤖" },
  { key: "settings", label: "설정", icon: "⚙️" },
] as const;
