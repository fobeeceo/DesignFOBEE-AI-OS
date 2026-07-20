// STEP 4+5: 공간 유형 · 인테리어 스타일 정의 (UI와 Gemini 프롬프트가 공유)
// ReRoom AI 프로토타입에서 이식 — 프롬프트 문구는 그대로 재사용한다.
// 공간 유형은 주거(거실~원룸) + 상업/교회/전시(사무실~회의실)로 구성된다.
// 디자인포비가 실제로 다루는 영역(상업공간, 교회, 교육시설, 오피스, 주거공간)에 맞춰 확장.

export type RoomType = {
  id: string;
  label: string;
  /** Gemini 프롬프트에 들어갈 영문 명칭 */
  prompt: string;
};

export type StyleOption = {
  id: string;
  label: string;
  desc: string;
  /** 스타일 카드에 표시되는 대표 색상 스와치 */
  swatch: [string, string, string];
  /** Gemini 프롬프트에 들어갈 스타일 지시문 */
  prompt: string;
};

export const ROOM_TYPES: RoomType[] = [
  { id: "living_room", label: "거실", prompt: "living room" },
  { id: "bedroom", label: "침실", prompt: "bedroom" },
  { id: "kitchen", label: "주방", prompt: "kitchen" },
  { id: "bathroom", label: "욕실", prompt: "bathroom" },
  { id: "study", label: "서재", prompt: "home office / study room" },
  { id: "studio", label: "원룸", prompt: "studio apartment" },
  { id: "office", label: "사무실", prompt: "corporate office workspace" },
  { id: "meeting_room", label: "회의실", prompt: "meeting room / conference room" },
  { id: "lobby", label: "로비", prompt: "building lobby / reception hall" },
  { id: "guest_room", label: "호텔 객실", prompt: "hotel guest room" },
  { id: "chapel", label: "예배당", prompt: "church sanctuary / worship hall" },
  { id: "exhibition_hall", label: "전시장", prompt: "exhibition hall / gallery space" },
];

export const STYLES: StyleOption[] = [
  {
    id: "modern",
    label: "모던",
    desc: "깔끔하고 정돈된 분위기",
    swatch: ["#2b2b2e", "#c9c9cd", "#8a6f52"],
    prompt:
      "sleek modern style: clean lines, neutral palette with charcoal and greige, low-profile furniture, matte finishes, statement lighting",
  },
  {
    id: "minimal",
    label: "미니멀",
    desc: "단순함과 절제의 미학",
    swatch: ["#f4f2ee", "#d8d4cc", "#9a958a"],
    prompt:
      "minimalist style: pared-down furnishings, warm white walls, hidden storage, soft diffuse light, generous negative space",
  },
  {
    id: "scandinavian",
    label: "북유럽",
    desc: "따뜻하고 내추럴한 감성",
    swatch: ["#e9e2d5", "#b9a284", "#5f6f5e"],
    prompt:
      "Scandinavian style: light oak wood, cozy wool and linen textiles, white and sage accents, hygge atmosphere, potted greenery",
  },
  {
    id: "industrial",
    label: "인더스트리얼",
    desc: "콘크리트와 철제의 조화",
    swatch: ["#4a4a4a", "#7d6a58", "#2f3540"],
    prompt:
      "industrial loft style: exposed concrete texture, black steel frames, leather and reclaimed wood furniture, Edison bulb lighting",
  },
  {
    id: "japandi",
    label: "재팬디",
    desc: "동양적 미와 서양식 실용성",
    swatch: ["#ded5c4", "#8c7b60", "#3d3a33"],
    prompt:
      "Japandi style: low wooden furniture, wabi-sabi ceramics, rice-paper lighting, muted earth tones, calm uncluttered balance",
  },
  {
    id: "mid_century",
    label: "미드센추리",
    desc: "레트로한 컬러와 나무 질감",
    swatch: ["#b0562f", "#e0b04e", "#3f5748"],
    prompt:
      "mid-century modern style: walnut furniture with tapered legs, mustard and teal accent colors, geometric patterns, retro lighting",
  },
  {
    id: "hanok",
    label: "한옥",
    desc: "전통적인 선과 나무의 편안함",
    swatch: ["#c7b299", "#6e4f33", "#eae3d2"],
    prompt:
      "modern Korean hanok style: warm wooden beams, hanji paper screens, low traditional furniture, natural linen, serene earthy palette",
  },
  {
    id: "hotel_lounge",
    label: "호텔 라운지",
    desc: "고급스럽고 웅장한 디자인",
    swatch: ["#1f2430", "#9c8455", "#5c5148"],
    prompt:
      "luxury hotel lounge style: plush velvet seating, brass and marble details, layered ambient lighting, dark sophisticated palette",
  },
];

/** 로그인 사용자 1인당 평생 무료 생성 횟수 (이후 결제/구독 연동 시 대체) */
export const FREE_GENERATIONS_PER_USER = 3;

export function buildRedesignInstruction(roomType: RoomType, style: StyleOption) {
  return `Redesign this ${roomType.prompt} interior in ${style.prompt}. Keep the room architecture — walls, windows, doors, ceiling and camera perspective — exactly the same. Replace furniture, lighting, color palette and decor to match the target style. Photorealistic interior photography, natural lighting, high detail.`;
}
