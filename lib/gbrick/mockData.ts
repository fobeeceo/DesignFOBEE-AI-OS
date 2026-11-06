// 개발 환경에서 DATABASE_URL 없이 UI 테스트용 목업 데이터
// Supabase dev 프로젝트 연결 후 실제 DB로 교체

export const MOCK_STORES = [
  {
    id: "store_gbrick_sinchon",
    code: "GBR-001",
    name: "지브릭커피 신촌점",
    brandName: "GBRICK Coffee",
    status: "ACTIVE",
    address: "서울 서대문구 신촌로 123",
    phone: "02-517-1474",
    pointRate: 0.03,
    stampGoal: 10,
    imageUrl: null,
    lat: 37.5596,
    lng: 126.9377,
    operatingHours: {
      mon: { open: "08:00", close: "22:00" },
      tue: { open: "08:00", close: "22:00" },
      wed: { open: "08:00", close: "22:00" },
      thu: { open: "08:00", close: "22:00" },
      fri: { open: "08:00", close: "23:00" },
      sat: { open: "09:00", close: "23:00" },
      sun: { open: "10:00", close: "21:00" },
    },
  },
  {
    id: "store_gbrick_hongdae",
    code: "GBR-002",
    name: "지브릭커피 홍대점",
    brandName: "GBRICK Coffee",
    status: "ACTIVE",
    address: "서울 마포구 와우산로 94",
    phone: "02-333-5678",
    pointRate: 0.03,
    stampGoal: 10,
    imageUrl: null,
    lat: 37.5519,
    lng: 126.9237,
    operatingHours: {
      mon: { open: "09:00", close: "23:00" },
      tue: { open: "09:00", close: "23:00" },
      wed: { open: "09:00", close: "23:00" },
      thu: { open: "09:00", close: "23:00" },
      fri: { open: "09:00", close: "24:00" },
      sat: { open: "10:00", close: "24:00" },
      sun: { open: "10:00", close: "22:00" },
    },
  },
  {
    id: "store_gbrick_itaewon",
    code: "GBR-003",
    name: "지브릭커피 이태원점",
    brandName: "GBRICK Coffee",
    status: "ACTIVE",
    address: "서울 용산구 이태원로 180",
    phone: "02-794-9012",
    pointRate: 0.03,
    stampGoal: 10,
    imageUrl: null,
    lat: 37.5345,
    lng: 126.9941,
    operatingHours: {
      mon: { open: "10:00", close: "22:00" },
      tue: { open: "10:00", close: "22:00" },
      wed: { open: "10:00", close: "22:00" },
      thu: { open: "10:00", close: "22:00" },
      fri: { open: "10:00", close: "23:00" },
      sat: { open: "10:00", close: "23:00" },
      sun: { open: "11:00", close: "21:00" },
    },
  },
  {
    id: "store_gbrick_gangnam",
    code: "GBR-004",
    name: "지브릭커피 강남점",
    brandName: "GBRICK Coffee",
    status: "PREPARING",
    address: "서울 강남구 테헤란로 152",
    phone: "02-555-3456",
    pointRate: 0.03,
    stampGoal: 10,
    imageUrl: null,
    lat: 37.4979,
    lng: 127.0276,
    operatingHours: {},
  },
] as const;

export const MOCK_MENU_CATEGORIES = [
  { id: "cat_signature", name: "시그니처", nameEn: "Signature", sortOrder: 1 },
  { id: "cat_espresso", name: "에스프레소", nameEn: "Espresso", sortOrder: 2 },
  { id: "cat_non_coffee", name: "논커피", nameEn: "Non Coffee", sortOrder: 3 },
  { id: "cat_seasonal", name: "계절 한정", nameEn: "Seasonal", sortOrder: 4 },
  { id: "cat_food", name: "푸드", nameEn: "Food", sortOrder: 5 },
];

export const MOCK_MENUS = [
  {
    id: "menu_gbrick_latte",
    categoryId: "cat_signature",
    name: "지브릭 라떼",
    nameEn: "GBRICK Latte",
    description: "스페셜티 원두로 만든 지브릭만의 시그니처 라떼",
    basePrice: 6500,
    isSignature: true,
    isNew: false,
    isSoldOut: false,
    tags: ["시그니처", "스페셜티"],
  },
  {
    id: "menu_americano",
    categoryId: "cat_espresso",
    name: "아메리카노",
    nameEn: "Americano",
    description: "스페셜티 원두의 깔끔한 아메리카노",
    basePrice: 4500,
    isSignature: false,
    isNew: false,
    isSoldOut: false,
    tags: ["스페셜티"],
  },
  {
    id: "menu_grapefruit_tea",
    categoryId: "cat_non_coffee",
    name: "수제 자몽티",
    nameEn: "Homemade Grapefruit Tea",
    description: "직접 담근 수제 자몽청으로 만든 자몽티",
    basePrice: 6000,
    isSignature: true,
    isNew: false,
    isSoldOut: false,
    tags: ["수제", "시그니처"],
  },
  {
    id: "menu_bingsu",
    categoryId: "cat_seasonal",
    name: "수제 팥빙수",
    nameEn: "Homemade Red Bean Shaved Ice",
    description: "직접 만든 수제 팥앙금을 올린 팥빙수",
    basePrice: 9000,
    isSignature: true,
    isNew: false,
    isSoldOut: false,
    tags: ["수제", "계절한정"],
  },
  {
    id: "menu_vanilla_latte",
    categoryId: "cat_signature",
    name: "바닐라 라떼",
    nameEn: "Vanilla Latte",
    description: "부드러운 바닐라향과 에스프레소의 조화",
    basePrice: 6000,
    isSignature: false,
    isNew: true,
    isSoldOut: false,
    tags: ["신메뉴"],
  },
  {
    id: "menu_croissant",
    categoryId: "cat_food",
    name: "버터 크루아상",
    nameEn: "Butter Croissant",
    description: "매일 아침 직접 굽는 버터 크루아상",
    basePrice: 3500,
    isSignature: false,
    isNew: false,
    isSoldOut: false,
    tags: ["베이커리"],
  },
];

export const MOCK_MENU_OPTIONS = [
  { id: "opt_hot", menuId: "menu_gbrick_latte", name: "HOT", extraPrice: 0, isDefault: true, groupName: "온도" },
  { id: "opt_ice", menuId: "menu_gbrick_latte", name: "ICE", extraPrice: 0, isDefault: false, groupName: "온도" },
  { id: "opt_hot_amer", menuId: "menu_americano", name: "HOT", extraPrice: 0, isDefault: true, groupName: "온도" },
  { id: "opt_ice_amer", menuId: "menu_americano", name: "ICE", extraPrice: 0, isDefault: false, groupName: "온도" },
  { id: "opt_soy", menuId: "menu_gbrick_latte", name: "두유 변경", extraPrice: 500, isDefault: false, groupName: "우유" },
  { id: "opt_oat", menuId: "menu_gbrick_latte", name: "오트밀크 변경", extraPrice: 700, isDefault: false, groupName: "우유" },
];

// HQ 대시보드용 집계 목업 데이터

export const MOCK_HQ_STATS = {
  today: {
    revenue: 2847000,
    orders: 312,
    newCustomers: 28,
    avgOrderValue: 9124,
  },
  yesterday: {
    revenue: 2615000,
    orders: 287,
    newCustomers: 22,
    avgOrderValue: 9112,
  },
  thisMonth: {
    revenue: 58940000,
    orders: 6421,
    newCustomers: 487,
  },
  lastMonth: {
    revenue: 54320000,
    orders: 5987,
    newCustomers: 423,
  },
  totalCustomers: 3847,
  activeStores: 3,
  totalStores: 4,
};

export const MOCK_STORE_STATS = [
  { storeId: "store_gbrick_sinchon", storeName: "신촌점", todayRevenue: 1245000, todayOrders: 136, monthRevenue: 25800000 },
  { storeId: "store_gbrick_hongdae", storeName: "홍대점", todayRevenue: 987000, todayOrders: 108, monthRevenue: 20450000 },
  { storeId: "store_gbrick_itaewon", storeName: "이태원점", todayRevenue: 615000, todayOrders: 68, monthRevenue: 12690000 },
  { storeId: "store_gbrick_gangnam", storeName: "강남점", todayRevenue: 0, todayOrders: 0, monthRevenue: 0 },
];

export const MOCK_RECENT_ORDERS = [
  { id: "ord_1", orderNumber: "GB20261101A1B2C", storeId: "store_gbrick_sinchon", storeName: "신촌점", status: "PICKED_UP", finalAmount: 13000, pickupName: "이대성", createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), items: [{ menuName: "지브릭 라떼", quantity: 2 }] },
  { id: "ord_2", orderNumber: "GB20261101D3E4F", storeId: "store_gbrick_hongdae", storeName: "홍대점", status: "PREPARING", finalAmount: 9000, pickupName: "김지연", createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(), items: [{ menuName: "수제 팥빙수", quantity: 1 }] },
  { id: "ord_3", orderNumber: "GB20261101G5H6I", storeId: "store_gbrick_sinchon", storeName: "신촌점", status: "CONFIRMED", finalAmount: 4500, pickupName: "박성준", createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(), items: [{ menuName: "아메리카노", quantity: 1 }] },
  { id: "ord_4", orderNumber: "GB20261101J7K8L", storeId: "store_gbrick_itaewon", storeName: "이태원점", status: "PENDING", finalAmount: 12000, pickupName: "Sarah K.", createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), items: [{ menuName: "수제 자몽티", quantity: 2 }] },
  { id: "ord_5", orderNumber: "GB20261101M9N0O", storeId: "store_gbrick_hongdae", storeName: "홍대점", status: "READY", finalAmount: 6500, pickupName: "최민준", createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), items: [{ menuName: "지브릭 라떼", quantity: 1 }] },
];

export const MOCK_TOP_MENUS = [
  { menuId: "menu_gbrick_latte", name: "지브릭 라떼", count: 2847, revenue: 18505500 },
  { menuId: "menu_americano", name: "아메리카노", count: 2156, revenue: 9702000 },
  { menuId: "menu_grapefruit_tea", name: "수제 자몽티", count: 1423, revenue: 8538000 },
  { menuId: "menu_bingsu", name: "수제 팥빙수", count: 987, revenue: 8883000 },
  { menuId: "menu_vanilla_latte", name: "바닐라 라떼", count: 756, revenue: 4536000 },
];

export const MOCK_WEEKLY_REVENUE = [
  { date: "10/27", revenue: 2410000, orders: 264 },
  { date: "10/28", revenue: 2680000, orders: 293 },
  { date: "10/29", revenue: 2520000, orders: 276 },
  { date: "10/30", revenue: 2890000, orders: 316 },
  { date: "10/31", revenue: 3120000, orders: 341 },
  { date: "11/01", revenue: 2615000, orders: 287 },
  { date: "11/02(오늘)", revenue: 2847000, orders: 312 },
];

export const MOCK_CUSTOMERS = [
  { id: "cust_1", nickname: "이대성", email: "ceo@fobee.co.kr", phone: "010-1234-5678", pointBalance: 15400, totalOrders: 42, totalSpent: 387000, joinedAt: "2024-01-15", lastOrderAt: "2026-11-02" },
  { id: "cust_2", nickname: "김지연", email: "jiyeon@example.com", phone: "010-2345-6789", pointBalance: 8700, totalOrders: 28, totalSpent: 241000, joinedAt: "2024-02-20", lastOrderAt: "2026-11-01" },
  { id: "cust_3", nickname: "박성준", email: "sungjun@example.com", phone: "010-3456-7890", pointBalance: 3200, totalOrders: 15, totalSpent: 125000, joinedAt: "2024-03-10", lastOrderAt: "2026-10-30" },
  { id: "cust_4", nickname: "Sarah K.", email: "sarah@example.com", phone: "010-4567-8901", pointBalance: 22100, totalOrders: 67, totalSpent: 612000, joinedAt: "2023-11-05", lastOrderAt: "2026-11-02" },
  { id: "cust_5", nickname: "최민준", email: "minjun@example.com", phone: "010-5678-9012", pointBalance: 1800, totalOrders: 9, totalSpent: 72000, joinedAt: "2024-05-18", lastOrderAt: "2026-10-28" },
];

export const MOCK_CHECKLISTS = [
  { id: "chk_1", storeId: "store_gbrick_sinchon", title: "매장 청소 및 위생 점검", category: "OPENING", isActive: true },
  { id: "chk_2", storeId: "store_gbrick_sinchon", title: "에스프레소 머신 예열 및 점검", category: "OPENING", isActive: true },
  { id: "chk_3", storeId: "store_gbrick_sinchon", title: "냉장·냉동 온도 확인", category: "OPENING", isActive: true },
  { id: "chk_4", storeId: "store_gbrick_sinchon", title: "재료 재고 확인 및 발주", category: "INVENTORY", isActive: true },
  { id: "chk_5", storeId: "store_gbrick_sinchon", title: "일일 매출 정산", category: "CLOSING", isActive: true },
  { id: "chk_6", storeId: "store_gbrick_sinchon", title: "마감 청소 및 소독", category: "CLOSING", isActive: true },
  { id: "chk_7", storeId: "store_gbrick_sinchon", title: "화재 감지기 및 소화기 확인", category: "SAFETY", isActive: true },
];

export const IS_MOCK_MODE = !process.env.DATABASE_URL || process.env.USE_MOCK_DATA === "true";
