// 공간 유형 · 인테리어 스타일 정의 (클라이언트 UI와 서버 프롬프트가 공유)

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

export const FREE_GENERATIONS = 2;
export const DAILY_IP_LIMIT = 10;

/**
 * 자서전 코너의 AI 도움(꼬리질문·글 다듬기) 하루 무료 횟수 — IP 기준.
 *
 * /design(DAILY_IP_LIMIT=10)보다 넉넉하게 잡았다. 이미지 생성과 달리 짧은 텍스트
 * 호출이라 비용이 훨씬 낮고, 자서전은 한자리에서 여러 질문을 이어 답하는 작업이라
 * 10회면 한 시간도 못 쓰고 막힌다. 넘으면 「내 API 키」로 계속 쓸 수 있다.
 */
export const MEMOIR_DAILY_IP_LIMIT = 30;
