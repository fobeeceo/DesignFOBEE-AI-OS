// 함께오더 — 한 사람이 방을 만들고 초대 링크를 보내면, 친구들이 각자 메뉴를 담고, 방장이 한 번에 주문한다.
// 결제는 소프트 런칭 동안 픽업할 때 방장이 매장에서 한다. 이 파일은 서버·브라우저 어디서든 쓸 수 있게 DB 코드를 두지 않는다.
import { cleanGuestText, MAX_QUANTITY, MAX_ORDER_LINES } from "@/lib/gbrick/orderPricing";

export const MAX_PARTICIPANTS = 10;
export const NAME_MAX = 10;

// 헷갈리는 글자(0 O 1 I L)를 뺀 32자 — 8자리면 추측하기 어렵다
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const randomString = (len: number) => {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
};
export const newRoomCode = () => randomString(8);
export const newSecret = () => randomString(24);
export const newParticipantId = () => randomString(8);

export const isRoomCode = (v: unknown): v is string => typeof v === "string" && /^[2-9A-HJKMNP-Z]{8}$/.test(v);
export const isParticipantId = (v: unknown): v is string => typeof v === "string" && /^[2-9A-HJKMNP-Z]{8}$/.test(v);

/** 이름 정리 — 제어문자 제거, 10자까지. 비면 undefined */
export const cleanName = (v: unknown) => cleanGuestText(v, NAME_MAX);

export interface GroupLine {
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  options: { menuOptionId: string; optionName: string; extraPrice: number }[];
}

const optionKey = (l: Pick<GroupLine, "options">) => l.options.map(o => o.menuOptionId).sort().join("|");

/**
 * 참여자들이 담은 줄을 하나의 주문으로 합친다. 같은 메뉴·같은 옵션이면 수량을 더하고,
 * 한 줄 수량 한도(20)를 넘으면 여러 줄로 나눈다. 가격은 여기서 믿지 않는다 (주문 접수 때 서버가 다시 계산).
 */
export function mergeGroupLines(participants: { items: GroupLine[] }[]): { menuId: string; quantity: number; options: { menuOptionId: string }[] }[] {
  const merged = new Map<string, { menuId: string; quantity: number; options: { menuOptionId: string }[] }>();
  for (const p of participants) {
    for (const line of p.items) {
      const key = `${line.menuId}#${optionKey(line)}`;
      const found = merged.get(key);
      if (found) found.quantity += line.quantity;
      else merged.set(key, { menuId: line.menuId, quantity: line.quantity, options: line.options.map(o => ({ menuOptionId: o.menuOptionId })) });
    }
  }
  const out: { menuId: string; quantity: number; options: { menuOptionId: string }[] }[] = [];
  for (const line of merged.values()) {
    for (let left = line.quantity; left > 0; left -= MAX_QUANTITY) out.push({ ...line, quantity: Math.min(left, MAX_QUANTITY) });
  }
  return out;
}

export const tooManyLines = (lines: unknown[]) => lines.length > MAX_ORDER_LINES;

/** 주방에 보이는 메모 — 몇 명이 함께 주문했는지와 이름 (100자 안으로) */
export function groupNote(names: string[], hostNote?: string): string {
  const head = `함께오더 ${names.length}명(${names.join("·")})`;
  return [head, hostNote].filter(Boolean).join(" / ");
}

export const subtotal = (items: GroupLine[]) => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
