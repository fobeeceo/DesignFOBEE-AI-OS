/**
 * AI HQ ERP 실데이터 스냅샷 (SSOT: content-automation-agent/src erp_engine + pos_import).
 * POS clsProd 2026-07-01~07-20 · 재고관리 DB 2026-07-05 · 09_MENU_COST_TABLE.
 * 추후 라이브 API(/api/hq/erp)로 대체 가능한 형태. 값은 실제 계산 결과.
 */
export const ERP_SNAPSHOT = {
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
} as const;

/** 가맹/직영점 로스터 (SSOT: Franchise KB 정보공개서 2024-07-18). 본점만 POS 실데이터 연결됨. */
export const STORES = [
  { name: "은평본점", type: "직영", region: "서울 은평구", open: "2013-11-11", live: true },
  { name: "단대점", type: "가맹", region: "경기 성남시", open: "2013-12-23", live: false },
  { name: "월곳점", type: "가맹", region: "경기 김포시", open: "2017-06-20", live: false },
  { name: "가좌점", type: "가맹", region: "경기 고양시", open: "2018-04-10", live: false },
  { name: "인덕원점", type: "가맹", region: "경기 의왕시", open: "2019-06-30", live: false },
  { name: "덕은점", type: "가맹", region: "경기 고양 덕양", open: "2021-05-15", live: false },
  { name: "신원점", type: "가맹", region: "경기", open: "2023-03-25", live: false },
] as const;

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

export const won = (n: number) => n.toLocaleString("ko-KR") + "원";
