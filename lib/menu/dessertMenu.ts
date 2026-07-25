/**
 * GBRICK Coffee 디저트 메뉴 — 공개용(이름·판매가만).
 * SSOT: 지브릭커피 디저트단가표(Google Drive) → content-automation-agent/src/dessert_import.py →
 * output/dessert_menu.json(28종, 원가·원가율 포함). 원가·원가율은 내부 경영정보라 공개 노출하지 않고
 * 이름·판매가만 골라 여기 옮겨 적었다(공급사 코드/중량 표기만 정리, 이름·가격 자체는 변경 없음).
 * 메뉴/가격 변경 시 디저트단가표 갱신 → dessert_import.py 재실행 → 이 파일도 함께 갱신한다.
 */
export interface DessertMenuItem {
  name: string;
  price: number;
}

export const DESSERT_MENU: DessertMenuItem[] = [
  { name: "가나슈초코케이크", price: 7000 },
  { name: "티라미수케이크", price: 6000 },
  { name: "쿠키생크림케이크", price: 6000 },
  { name: "당근케익", price: 6000 },
  { name: "크로아상", price: 2900 },
  { name: "플레인스콘", price: 2900 },
  { name: "크랜베리스콘", price: 2900 },
  { name: "에그타르트", price: 2600 },
  { name: "초코칩믹스너트르뱅쿠키", price: 3900 },
  { name: "황치즈르뱅쿠키", price: 3900 },
  { name: "쿠키앤크림르뱅쿠키", price: 3900 },
  { name: "레드벨벳크림치즈르뱅쿠키", price: 3900 },
  { name: "플레인베이글", price: 2900 },
  { name: "어니언베이글", price: 3200 },
  { name: "아지아고베이글", price: 3600 },
  { name: "초콜릿마카롱", price: 2500 },
  { name: "바닐라마카롱", price: 2500 },
  { name: "라즈베리마카롱", price: 2500 },
  { name: "딸기마카롱", price: 2500 },
  { name: "레몬마카롱", price: 2500 },
  { name: "피스타치오마카롱", price: 2500 },
  { name: "크림치즈마카롱", price: 2500 },
  { name: "버터소금빵", price: 2900 },
  { name: "단팥빵", price: 3900 },
  { name: "허니브레드", price: 6500 },
  { name: "갈릭브레드", price: 6500 },
  { name: "바스크치즈케익", price: 12800 },
  { name: "뉴욕치즈케익", price: 11800 },
];

export function won(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}
