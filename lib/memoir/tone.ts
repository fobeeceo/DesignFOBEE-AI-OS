/**
 * 다듬는 방식. 자서전에서 말투는 그 사람 자체라 하나로 정해두면 안 된다.
 *
 * 화면과 서버가 같은 목록을 봐야 하므로 여기 한 곳에 둔다(§14-A ⑥).
 * (라우트 파일은 임의 값을 export할 수 없어 별도 모듈로 분리했다.)
 */
export const POLISH_TONES = ["voice", "natural", "publish"] as const;
export type PolishTone = (typeof POLISH_TONES)[number];

/** 화면에 보여줄 이름과 설명. */
export const POLISH_TONE_LABEL: Record<PolishTone, { name: string; desc: string }> = {
  voice: { name: "내 말투 그대로", desc: "군더더기만 걷어냅니다" },
  natural: { name: "자연스럽게", desc: "읽기 좋게 다듬습니다" },
  publish: { name: "출판용 문체", desc: "책에 실을 문장으로" },
};

/** AI에게 주는 지시. 어느 방식이든 "사실을 만들지 않는다"는 규칙 위에서 동작한다. */
export const POLISH_TONE_RULE: Record<PolishTone, string> = {
  voice:
    "말한 그대로를 지킵니다. 반복되는 말과 군더더기만 걷어내고, 어순·사투리·입버릇·말끝은 손대지 마세요. 문어체로 바꾸지 마세요.",
  natural:
    "읽기 좋게 다듬되 말투는 남깁니다. 문장을 끊고 조사·어미를 고르되, 그 사람이 말하는 느낌이 사라지지 않게 하세요.",
  publish:
    "책에 실을 문어체로 고릅니다. 구어체 표현을 정돈하고 문장을 단정하게 만드세요. 다만 사실과 감정의 크기는 원문 그대로 두세요.",
};
