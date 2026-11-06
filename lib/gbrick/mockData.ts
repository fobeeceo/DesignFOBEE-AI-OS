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
];

export const MOCK_MENU_OPTIONS = [
  { id: "opt_hot", menuId: "menu_gbrick_latte", name: "HOT", extraPrice: 0, isDefault: true, groupName: "온도" },
  { id: "opt_ice", menuId: "menu_gbrick_latte", name: "ICE", extraPrice: 0, isDefault: false, groupName: "온도" },
  { id: "opt_hot_amer", menuId: "menu_americano", name: "HOT", extraPrice: 0, isDefault: true, groupName: "온도" },
  { id: "opt_ice_amer", menuId: "menu_americano", name: "ICE", extraPrice: 0, isDefault: false, groupName: "온도" },
];

export const IS_MOCK_MODE = !process.env.DATABASE_URL || process.env.USE_MOCK_DATA === "true";
