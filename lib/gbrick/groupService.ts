// 함께오더 서버 처리 — API 라우트가 부른다. 방 정보는 gb_idempotency_keys 임시 행(groupOrder.ts 설명 참고)에 둔다.
import { timingSafeEqual } from "crypto";
import {
  GROUP_MEMBER, GROUP_ROOM, GROUP_SUBMIT, countGroupRoomsSince, deleteGroupRow, findStoreStrict, getDefaultOptions,
  getGroupRow, insertGroupRow, listGroupRows, sbMenuRepo, updateGroupRow,
} from "@/lib/gbrick/repositories/supabase";
import { isLaunchStore, NOT_LAUNCHED_MESSAGE } from "@/lib/gbrick/launch";
import { priceOrderItems, type PriceableMenu } from "@/lib/gbrick/orderPricing";
import { submitOrder, type SubmitResult } from "@/lib/gbrick/orderSubmit";
import {
  MAX_PARTICIPANTS, cleanName, groupNote, mergeGroupLines, newParticipantId, newRoomCode, newSecret, subtotal, tooManyLines, type GroupLine,
} from "@/lib/gbrick/groupOrder";

const MAX_ROOMS_PER_10_MIN = 30; // 가게 전체 기준 — 반복 요청으로 임시 행이 쌓이는 것을 막는다

export type GroupError = { ok: false; error: string; status: number; orderId?: string };
const fail = (error: string, status: number, orderId?: string): GroupError => ({ ok: false, error, status, ...(orderId ? { orderId } : {}) });

// 비밀값 비교 — 걸린 시간으로 값을 짐작하지 못하게 한다
const sameSecret = (a: unknown, b: string) => {
  if (typeof a !== "string") return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

const roomKey = (code: string) => `gor:${code}`;
const memberKey = (code: string, pid: string) => `gom:${code}:${pid}`;
const submitKey = (code: string) => `gos:${code}`;

interface RoomData { storeId: string; hostName: string; hostSecret: string }
interface MemberData { name: string; secret: string; items: GroupLine[] }

export async function createRoom(storeId: unknown, hostName: unknown) {
  if (typeof storeId !== "string" || !storeId) return fail("매장을 선택해 주세요", 400);
  if (!isLaunchStore(storeId)) return fail(NOT_LAUNCHED_MESSAGE, 403);
  const store = await findStoreStrict(storeId);
  if (!store) return fail("매장을 찾을 수 없습니다", 404);
  if (store.status !== "ACTIVE") return fail("지금은 함께오더를 만들 수 없어요 (영업 준비중)", 409);
  if (await countGroupRoomsSince(new Date(Date.now() - 10 * 60_000).toISOString()) >= MAX_ROOMS_PER_10_MIN) {
    return fail("지금 요청이 많아요. 잠시 후 다시 시도해 주세요", 429);
  }
  const room: RoomData = { storeId, hostName: cleanName(hostName) ?? "방장", hostSecret: newSecret() };
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newRoomCode();
    if (await insertGroupRow(GROUP_ROOM, roomKey(code), { ...room })) {
      return { ok: true as const, code, hostSecret: room.hostSecret, storeName: store.name as string, hostName: room.hostName };
    }
  }
  throw new Error("함께오더 방 코드 생성 실패");
}

/** 방의 현재 모습 — 비밀값(방장·참여자 암호)은 절대 내보내지 않는다 */
export async function getRoomView(code: string) {
  const room = await getGroupRow(roomKey(code));
  if (!room) return fail("함께오더를 찾을 수 없어요. 링크가 만료됐거나 잘못됐어요", 404);
  const data = room.response as unknown as RoomData;
  const [members, submitted, store] = await Promise.all([
    listGroupRows(`gom:${code}:`, GROUP_MEMBER),
    getGroupRow(submitKey(code)),
    findStoreStrict(data.storeId),
  ]);
  const participants = members.map(m => {
    const d = m.response as unknown as MemberData;
    return { id: m.key.split(":")[2], name: d.name, items: d.items, subtotal: subtotal(d.items) };
  });
  const orderId = (submitted?.response as { orderId?: string } | undefined)?.orderId ?? null;
  return {
    ok: true as const,
    room: {
      code, storeId: data.storeId, storeName: (store?.name as string | undefined) ?? "", hostName: data.hostName,
      status: submitted ? (orderId ? "ORDERED" : "ORDERING") : "OPEN",
      orderId, participants, total: participants.reduce((s, p) => s + p.subtotal, 0),
    },
  };
}

/** 내 메뉴를 올리거나(처음이면 참여자가 새로 생긴다) 고친다. items 가 비면 빠진다. 서버가 가격을 다시 계산한다. */
export async function putMemberItems(code: string, input: { pid?: unknown; secret?: unknown; name?: unknown; items?: unknown }) {
  const room = await getGroupRow(roomKey(code));
  if (!room) return fail("함께오더를 찾을 수 없어요. 링크가 만료됐거나 잘못됐어요", 404);
  if (await getGroupRow(submitKey(code))) return fail("이미 주문이 접수된 함께오더예요", 409);
  const roomData = room.response as unknown as RoomData;

  const name = cleanName(input.name);
  if (!name) return fail("이름을 입력해 주세요", 400);

  let pid = typeof input.pid === "string" ? input.pid : null;
  let existing: MemberData | null = null;
  if (pid) {
    const row = await getGroupRow(memberKey(code, pid));
    existing = (row?.response as unknown as MemberData | undefined) ?? null;
    if (!existing || !sameSecret(input.secret, existing.secret)) return fail("내 메뉴를 고칠 수 없어요. 새로 참여해 주세요", 403);
  }

  const wantsRemove = Array.isArray(input.items) && input.items.length === 0;
  if (wantsRemove) {
    if (pid && existing) await deleteGroupRow(memberKey(code, pid));
    return { ok: true as const, removed: true as const };
  }

  const [categories, defaultOptions] = await Promise.all([sbMenuRepo.findCategories(roomData.storeId), getDefaultOptions()]);
  const menus = categories.flatMap(c => c.menus) as unknown as PriceableMenu[];
  const priced = priceOrderItems(input.items, menus, defaultOptions);
  if (!priced.ok) return fail(priced.error, 400);
  const lines = priced.items as unknown as GroupLine[];

  if (!pid) {
    const members = await listGroupRows(`gom:${code}:`, GROUP_MEMBER);
    if (members.length >= MAX_PARTICIPANTS) return fail(`함께오더는 최대 ${MAX_PARTICIPANTS}명까지 참여할 수 있어요`, 409);
    const secret = newSecret();
    for (let attempt = 0; attempt < 5; attempt++) {
      pid = newParticipantId();
      if (await insertGroupRow(GROUP_MEMBER, memberKey(code, pid), { name, secret, items: lines })) {
        return { ok: true as const, pid, secret, subtotal: subtotal(lines) };
      }
    }
    throw new Error("함께오더 참여자 번호 생성 실패");
  }
  await updateGroupRow(memberKey(code, pid), { name, secret: existing!.secret, items: lines });
  return { ok: true as const, pid, secret: existing!.secret, subtotal: subtotal(lines) };
}

/** 방장이 한 번에 주문한다. 같은 방은 한 번만 주문되고(두 번 눌러도), 주문이 실패하면 다시 시도할 수 있다. */
export async function submitRoom(code: string, input: { hostSecret?: unknown; pickupName?: unknown; note?: unknown }, memberId: string | null): Promise<SubmitResult | GroupError> {
  const room = await getGroupRow(roomKey(code));
  if (!room) return fail("함께오더를 찾을 수 없어요. 링크가 만료됐거나 잘못됐어요", 404);
  const roomData = room.response as unknown as RoomData;
  if (!sameSecret(input.hostSecret, roomData.hostSecret)) return fail("방장만 주문할 수 있어요", 403);

  const members = await listGroupRows(`gom:${code}:`, GROUP_MEMBER);
  const participants = members.map(m => m.response as unknown as MemberData).filter(d => d.items.length > 0);
  if (participants.length === 0) return fail("담은 메뉴가 아직 없어요", 400);
  const lines = mergeGroupLines(participants);
  if (tooManyLines(lines)) return fail("메뉴 종류가 너무 많아요. 일부를 줄여 주세요", 400);

  // 이미 주문한 방이면 그 주문을 알려 준다
  const done = await getGroupRow(submitKey(code));
  if (done) {
    const orderId = (done.response as { orderId?: string }).orderId;
    return orderId ? fail("이미 주문이 접수됐어요", 409, orderId) : fail("주문을 처리하고 있어요. 잠시만 기다려 주세요", 409);
  }
  // 먼저 "주문 중" 표시를 선점한다 — 동시에 두 번 눌러도 한쪽만 통과
  if (!(await insertGroupRow(GROUP_SUBMIT, submitKey(code), {}))) return fail("주문을 처리하고 있어요. 잠시만 기다려 주세요", 409);

  try {
    const result = await submitOrder({
      storeId: roomData.storeId,
      items: lines,
      pickupName: roomData.hostName,
      note: groupNote(participants.map(p => p.name), typeof input.note === "string" ? input.note : undefined),
      memberId,
    });
    if (!result.ok) { await deleteGroupRow(submitKey(code)); return result; }
    await updateGroupRow(submitKey(code), { orderId: result.order.id });
    return result;
  } catch (err) {
    await deleteGroupRow(submitKey(code)).catch(() => {});
    throw err;
  }
}
