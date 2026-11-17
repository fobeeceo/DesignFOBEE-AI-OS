// 옵션을 따로 등록하지 않은 메뉴에 고객 앱이 보여 주는 기본 옵션.
// 사장님 앱에서 "기본 옵션 불러오기"를 누르면 같은 목록이 그 메뉴의 옵션으로 저장되어 수정할 수 있게 된다.
export interface DefaultOption {
  id: string;
  name: string;
  extraPrice: number;
  isDefault: boolean;
  groupName: string;
}

export const DEFAULT_OPTIONS: DefaultOption[] = [
  { id: "def-van",    name: "바닐라시럽",   extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-haz",    name: "헤이즐넛시럽", extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-whip",   name: "휘핑크림",     extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-eshot",  name: "에스프레소샷", extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-pearl",  name: "펄",           extraPrice: 700, isDefault: false, groupName: "추가옵션" },
  { id: "def-milk",   name: "우유추가",     extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-decaf",  name: "디카페인샷",   extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-oat",    name: "오트밀크",     extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-almond", name: "아몬드브리즈", extraPrice: 500, isDefault: false, groupName: "추가옵션" },
  { id: "def-lowsug", name: "저당시럽",     extraPrice: 300, isDefault: false, groupName: "추가옵션" },
  { id: "def-hot",    name: "따뜻하게",     extraPrice: 0,   isDefault: true,  groupName: "온도" },
  { id: "def-ice",    name: "아이스",       extraPrice: 0,   isDefault: false, groupName: "온도" },
];
