import { createClient } from "@supabase/supabase-js";
import { DEFAULT_OPTIONS } from "@/lib/gbrick/defaultOptions";
import type {
  IStoreRepository, IMenuRepository, IOrderRepository, IPaymentRepository,
  IPointRepository, IStampRepository, ICouponRepository, IChecklistRepository, INoticeRepository,
  StoreDto, MenuCategoryDto, MenuDto, OrderDto, PaymentDto, PointAccountDto, PointLedgerDto,
  StampAccountDto, StampLedgerDto, CouponDto, CouponIssueDto, ChecklistDto, StoreNoticeDto,
  CreateOrderInput,
} from "../types";

// gbrick-app-dev 전용 Supabase URL — NEXT_PUBLIC_SUPABASE_URL이 다른 프로젝트를 가리킬 때 대비
const GBRICK_SUPABASE_URL = "https://rzgrkrffksqdeztzxyrt.supabase.co";

function getAdmin() {
  // URL: GBRICK 전용 URL 우선, 없으면 하드코딩된 GBRICK URL
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const url = envUrl.includes("rzgrkrffksqdeztzxyrt") ? envUrl : GBRICK_SUPABASE_URL;

  // KEY 우선순위: GBRICK 전용 서비스키 → GBRICK 전용 anon키 → 범용 키 (범용키는 DesignFOBEE 프로젝트용일 수 있으므로 마지막)
  const key =
    process.env.GBRICK_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_GBRICK_SUPABASE_ANON_KEY ??
    (envUrl.includes("rzgrkrffksqdeztzxyrt") ? (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) : null) ??
    null;

  if (!key) throw new Error("GBRICK Supabase 키 미설정 — Vercel에 NEXT_PUBLIC_GBRICK_SUPABASE_ANON_KEY 추가 필요");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Next.js 는 서버의 GET fetch 결과를 기본으로 저장해 재사용한다.
    // 주문·품절 같은 실시간 데이터가 옛 결과로 굳지 않도록 항상 DB에서 새로 읽는다.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

function nanoid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Store Repository ─────────────────────────────────────────

export const sbStoreRepo: IStoreRepository = {
  async findMany(status?: string) {
    const sb = getAdmin();
    let q = sb.from("gb_stores").select("*").order("name");
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as unknown as StoreDto[];
  },
  async findById(id: string) {
    const sb = getAdmin();
    const { data, error } = await sb.from("gb_stores").select("*").eq("id", id).single();
    if (error) return null;
    return data as unknown as StoreDto;
  },
  async findMenus(storeId: string) {
    return sbMenuRepo.findCategories(storeId);
  },
  async updateSoldOut(storeId: string, menuId: string, isSoldOut: boolean) {
    const sb = getAdmin();
    const { error } = await sb.from("gb_store_menu_availability").upsert(
      { storeId, menuId, isSoldOut },
      { onConflict: "storeId,menuId" }
    );
    if (error) throw error;
  },
  async update(id: string, data: Record<string, unknown>) {
    const sb = getAdmin();
    const { data: row, error } = await sb.from("gb_stores").update({ ...data, updatedAt: new Date().toISOString() }).eq("id", id).select().single();
    if (error) throw error;
    return row as unknown as StoreDto;
  },
};

// ─── Menu Repository ──────────────────────────────────────────

export const sbMenuRepo: IMenuRepository = {
  async updateMenu(menuId: string, data: Record<string, unknown>) {
    const sb = getAdmin();
    const { error } = await sb.from("gb_menus").update({ ...data, updatedAt: new Date().toISOString() }).eq("id", menuId);
    if (error) throw error;
  },
  // 사장님 앱용: 숨긴 옵션도 포함한다. groupName 이 없는 행은 지난 주문 기록만 붙들고 있는 보관용이라 제외한다.
  async findOptions(menuId: string) {
    const sb = getAdmin();
    const { data } = await sb.from("gb_menu_options").select("*").eq("menuId", menuId).not("groupName", "is", null).order("sortOrder");
    return (data ?? []) as unknown as import("../types").MenuOptionDto[];
  },
  async addOption(menuId: string, data: { groupName: string; name: string; extraPrice: number; isDefault?: boolean }) {
    const sb = getAdmin();
    const id = `opt-${nanoid()}`;
    const { data: last } = await sb.from("gb_menu_options").select("sortOrder").eq("menuId", menuId).not("groupName", "is", null)
      .order("sortOrder", { ascending: false }).limit(1);
    const { data: row, error } = await sb.from("gb_menu_options").insert({
      id, menuId, name: data.name, extraPrice: data.extraPrice,
      isDefault: data.isDefault ?? false, groupName: data.groupName,
      sortOrder: ((last?.[0]?.sortOrder as number | undefined) ?? 0) + 1, isActive: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return row as unknown as import("../types").MenuOptionDto;
  },
  async deleteOption(optionId: string) {
    const sb = getAdmin();
    const { error } = await sb.from("gb_menu_options").delete().eq("id", optionId);
    if (!error) return;
    // 지난 주문이 이 옵션을 가리키고 있으면 지울 수 없다 → 화면에서만 빼고 기록용으로 남긴다
    if (error.code !== "23503") throw error;
    const { error: archiveErr } = await sb.from("gb_menu_options")
      .update({ isActive: false, groupName: null, updatedAt: new Date().toISOString() }).eq("id", optionId);
    if (archiveErr) throw archiveErr;
  },
  async findCategories(storeId?: string, opts?: { includeHidden?: boolean }) {
    const sb = getAdmin();
    const includeHidden = opts?.includeHidden === true;
    const visible = (r: Record<string, unknown>) =>
      includeHidden || r.isActive === undefined || r.isActive === null || r.isActive === true;

    // 1) 카테고리 테이블 조회 (sortOrder 컬럼 없을 수 있으므로 order 없이)
    const { data: catsRaw } = await sb
      .from("gb_menu_categories")
      .select("*");

    // 2) 메뉴 전체 조회 — sortOrder 컬럼이 있으면 함께 가져오고 없으면 무시
    let menusRaw: any[] | null = null; // eslint-disable-line
    {
      const withSort = await sb
        .from("gb_menus")
        .select("id, categoryId, name, nameEn, description, basePrice, imageUrl, isSignature, isNew, isSoldOut, isActive, sortOrder")
        .order("sortOrder", { ascending: true, nullsFirst: false });
      if (!withSort.error) {
        menusRaw = withSort.data;
      } else {
        const noSort = await sb
          .from("gb_menus")
          .select("id, categoryId, name, nameEn, description, basePrice, imageUrl, isSignature, isNew, isSoldOut, isActive");
        if (noSort.error) throw noSort.error;
        menusRaw = noSort.data;
      }
    }

    // isActive 필터 (컬럼 없으면 전체 포함) — 사장님 앱은 숨긴 메뉴도 본다
    const activeMenus = (menusRaw ?? []).filter(visible);

    // 3) 카테고리 테이블이 비어있으면 메뉴의 categoryId에서 가상 카테고리 생성
    let activeCats: Record<string, unknown>[];
    const dbCats = (catsRaw ?? []).filter(visible)
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));

    if (dbCats.length > 0) {
      activeCats = dbCats;
    } else {
      // gb_menu_categories가 비어있음 → categoryId 값으로 가상 카테고리 구성
      const seen = new Set<string>();
      activeCats = [];
      for (const m of activeMenus) {
        const catId = String((m as Record<string, unknown>).categoryId ?? "");
        if (catId && !seen.has(catId)) {
          seen.add(catId);
          // 카테고리 이름은 ID에서 추출 (예: cat-esp-002 → 에스프레소)
          activeCats.push({ id: catId, name: catId, sortOrder: activeCats.length });
        }
      }
    }

    const menuIds = activeMenus.map((m: { id: string }) => m.id);

    const [optRes, availRes] = await Promise.all([
      menuIds.length > 0
        ? sb.from("gb_menu_options").select("*").in("menuId", menuIds)
        : Promise.resolve({ data: [], error: null }),
      storeId && menuIds.length > 0
        ? sb.from("gb_store_menu_availability").select("*").eq("storeId", storeId).in("menuId", menuIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    // 옵션/재고 테이블 오류는 무시하고 빈 배열로 처리 (테이블 미생성 시에도 카테고리/메뉴 표시)
    // if (optRes.error) throw optRes.error;

    const allOpts = (optRes.data ?? []) as Record<string, unknown>[];
    const optsByMenu = groupBy(
      allOpts.filter(o => o.isActive !== false)
        .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)),
      "menuId"
    );
    // 사장님이 옵션을 직접 관리하는 메뉴 (전부 숨겨도 기본 옵션으로 되돌아가지 않게 구분한다)
    const configuredMenus = new Set(allOpts.filter(o => o.groupName != null).map(o => String(o.menuId)));
    const availByMenu = groupBy(availRes.data ?? [], "menuId");

    const menusByCatId = new Map<string, typeof activeMenus>();
    for (const m of activeMenus) {
      const key = String((m as Record<string, unknown>).categoryId ?? "");
      if (!menusByCatId.has(key)) menusByCatId.set(key, []);
      menusByCatId.get(key)!.push(m);
    }

    const result = activeCats.map((cat: Record<string, unknown>) => {
      const key = String(cat.id ?? "");
      const catMenus = menusByCatId.get(key) ?? [];
      return {
        ...cat,
        menus: catMenus.map((m: Record<string, unknown> & { id: string }) => ({
          ...m,
          options: optsByMenu[m.id] ?? [],
          optionsConfigured: configuredMenus.has(m.id),
          storeAvailability: availByMenu[m.id] ?? [],
        })),
      };
    });
    return result as unknown as MenuCategoryDto[];
  },
};

// ─── Order Repository ─────────────────────────────────────────

// ─── 사장님 앱: 카테고리·옵션 일괄 수정 ─────────────────────────
export async function updateCategories(rows: { id: string; name: string; sortOrder: number; isActive: boolean }[]): Promise<void> {
  const sb = getAdmin();
  const updatedAt = new Date().toISOString();
  for (const { id, ...data } of rows) {
    const { error } = await sb.from("gb_menu_categories").update({ ...data, updatedAt }).eq("id", id);
    if (error) throw error;
  }
}

export async function updateMenuOptions(
  menuId: string,
  rows: { id: string; name: string; extraPrice: number; sortOrder: number; isActive: boolean }[],
): Promise<void> {
  const sb = getAdmin();
  const updatedAt = new Date().toISOString();
  for (const { id, ...data } of rows) {
    // menuId 조건: 다른 메뉴의 옵션이 섞여 들어와도 바뀌지 않게 한다
    const { error } = await sb.from("gb_menu_options").update({ ...data, updatedAt }).eq("id", id).eq("menuId", menuId);
    if (error) throw error;
  }
}

/** 옵션을 등록한 적 없는 메뉴에 기본 옵션을 저장해 수정할 수 있게 한다. 이미 옵션이 있으면 아무것도 하지 않는다. */
export async function importDefaultOptions(menuId: string): Promise<void> {
  const sb = getAdmin();
  const { data: existing, error } = await sb.from("gb_menu_options").select("id").eq("menuId", menuId).not("groupName", "is", null).limit(1);
  if (error) throw error;
  if ((existing ?? []).length > 0) return;
  const now = new Date().toISOString();
  const { error: insertErr } = await sb.from("gb_menu_options").insert(DEFAULT_OPTIONS.map((o, idx) => ({
    id: `opt-${nanoid()}`, menuId, name: o.name, extraPrice: o.extraPrice, isDefault: o.isDefault,
    groupName: o.groupName, sortOrder: idx + 1, isActive: true, createdAt: now, updatedAt: now,
  })));
  if (insertErr) throw insertErr;
}

const optionKey = (menuId: string, optionName: string) => `${menuId}\u0000${optionName}`;

// 주문 옵션(gb_order_item_options.menuOptionId)은 gb_menu_options 의 실제 행을 가리켜야 한다(필수 + FK).
// 메뉴에 등록되지 않은 기본 옵션(따뜻하게·시럽 등)은 고객 화면에 나오지 않는 비활성 행을 만들어 연결한다.
async function resolveMenuOptionIds(
  sb: ReturnType<typeof getAdmin>,
  items: { menuId: string; options?: { menuOptionId: string; optionName: string; extraPrice: number }[] }[],
): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  const chosen = items.flatMap(i => (i.options ?? []).map(o => ({ menuId: i.menuId, ...o })));
  const menuIds = [...new Set(chosen.map(c => c.menuId))];
  const { data, error } = await sb.from("gb_menu_options").select("id, menuId, name").in("menuId", menuIds);
  if (error) throw error;
  const rows = (data ?? []) as { id: string; menuId: string; name: string }[];

  const now = new Date().toISOString();
  const toCreate: Record<string, unknown>[] = [];
  for (const c of chosen) {
    const key = optionKey(c.menuId, c.optionName);
    if (ids.has(key)) continue;
    const match = rows.find(r => r.id === c.menuOptionId && r.menuId === c.menuId)
      ?? rows.find(r => r.menuId === c.menuId && r.name === c.optionName);
    if (match) { ids.set(key, match.id); continue; }
    const id = `opt-${nanoid()}`;
    toCreate.push({ id, menuId: c.menuId, name: c.optionName, extraPrice: c.extraPrice, sortOrder: 999, isActive: false, updatedAt: now });
    ids.set(key, id);
  }
  if (toCreate.length > 0) {
    const { error: createErr } = await sb.from("gb_menu_options").insert(toCreate);
    if (createErr) throw createErr;
  }
  return ids;
}

// gb_orders 의 시각 컬럼은 시간대 없는 TIMESTAMP 에 UTC 값으로 저장된다.
// "Z" 없이 내려가면 브라우저가 현지 시각으로 읽어 9시간 어긋나므로 UTC 임을 표기해 준다.
function utcTimes<T>(row: T): T {
  const r = row as Record<string, unknown>;
  for (const key of ["createdAt", "updatedAt"]) {
    const v = r[key];
    if (typeof v === "string" && !/(Z|[+-]\d\d:?\d\d)$/i.test(v)) r[key] = `${v}Z`;
  }
  return row;
}

export const sbOrderRepo: IOrderRepository = {
  async findById(id: string) {
    const sb = getAdmin();
    const { data: order, error } = await sb.from("gb_orders").select("*, store:gb_stores(name)").eq("id", id).single();
    if (error) return null;
    const { data: items } = await sb.from("gb_order_items").select("*, options:gb_order_item_options(*)").eq("orderId", id);
    return utcTimes({ ...order, items: items ?? [] }) as unknown as OrderDto;
  },
  async findByOrderNumber(orderNumber: string) {
    const sb = getAdmin();
    const { data: order, error } = await sb.from("gb_orders").select("*, store:gb_stores(name)").eq("orderNumber", orderNumber).single();
    if (error) return null;
    const { data: items } = await sb.from("gb_order_items").select("*, options:gb_order_item_options(*)").eq("orderId", order.id);
    return utcTimes({ ...order, items: items ?? [] }) as unknown as OrderDto;
  },
  async findByCustomer(customerId: string, limit = 20) {
    const sb = getAdmin();
    const { data: orders, error } = await sb
      .from("gb_orders")
      .select("*, store:gb_stores(name)")
      .eq("customerId", customerId)
      .order("createdAt", { ascending: false })
      .limit(limit);
    if (error) throw error;
    if (!orders?.length) return [];
    const ids = orders.map((o: { id: string }) => o.id);
    const { data: items } = await sb.from("gb_order_items").select("*, options:gb_order_item_options(*)").in("orderId", ids);
    const itemsByOrder = groupBy(items ?? [], "orderId");
    return orders.map((o: Record<string, unknown> & { id: string }) => utcTimes({ ...o, items: itemsByOrder[o.id] ?? [] })) as unknown as OrderDto[];
  },
  async findByStore(storeId: string, status?: string, since?: string) {
    const sb = getAdmin();
    let q = sb.from("gb_orders").select("*, items:gb_order_items(*, options:gb_order_item_options(*))").eq("storeId", storeId).order("createdAt", { ascending: false });
    if (status) {
      // status may be comma-separated (e.g. "PENDING,CONFIRMED,PREPARING,READY") — use .in() not .eq()
      const statuses = status.split(",").map(s => s.trim()).filter(Boolean);
      q = statuses.length > 1 ? q.in("status", statuses) : q.eq("status", statuses[0]);
    }
    if (since) q = q.gte("createdAt", since);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(utcTimes) as unknown as OrderDto[];
  },
  async create(input) {
    const sb = getAdmin();
    const orderId = nanoid();
    const now = new Date().toISOString();
    const { data: order, error } = await sb.from("gb_orders").insert({
      id: orderId,
      orderNumber: input.orderNumber,
      storeId: input.storeId,
      customerId: input.customerId ?? null,
      totalAmount: input.totalAmount,
      discountAmount: 0,
      finalAmount: input.finalAmount,
      pointEarned: input.pointEarned,
      pointUsed: input.pointUsed ?? 0,
      couponDiscount: input.couponDiscount ?? 0,
      pickupName: input.pickupName ?? null,
      note: input.note ?? null,
      isGuest: input.isGuest ?? false,
      status: "PENDING",
      updatedAt: now,
    }).select().single();
    if (error) throw error;

    const itemInserts = input.items.map((i) => ({
      id: nanoid(),
      orderId,
      menuId: i.menuId,
      menuName: i.menuName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.unitPrice * i.quantity,
    }));
    const { data: items, error: itemErr } = await sb.from("gb_order_items").insert(itemInserts).select();
    if (itemErr) throw itemErr;

    if (input.items.some(i => (i.options ?? []).length > 0)) {
      try {
        const optionIds = await resolveMenuOptionIds(sb, input.items);
        const optionInserts = input.items.flatMap((i, idx) =>
          (i.options ?? []).map((o) => ({
            id: nanoid(),
            orderItemId: items![idx].id,
            menuOptionId: optionIds.get(optionKey(i.menuId, o.optionName))!,
            optionName: o.optionName,
            extraPrice: o.extraPrice,
          }))
        );
        const { error: optErr } = await sb.from("gb_order_item_options").insert(optionInserts);
        if (optErr) throw optErr;
      } catch (optErr) {
        // 옵션 표에 저장하지 못해도 주문 자체는 이미 들어갔다. 주방이 옵션을 놓치지 않도록 메모에 남긴다.
        console.error("[orders.create] option insert failed — options kept in note:", (optErr as { message?: string })?.message ?? optErr);
        const summary = input.items
          .filter(i => (i.options ?? []).length > 0)
          .map(i => `${i.menuName}: ${i.options!.map(o => o.optionName).join(", ")}`)
          .join(" / ");
        // 영수증 프린터가 찍을 수 있는 글자만 쓴다 (긴 줄표 등은 ? 로 나온다)
        const note = [input.note, `[옵션] ${summary}`].filter(Boolean).join(" | ");
        const { error: noteErr } = await sb.from("gb_orders").update({ note }).eq("id", orderId);
        if (noteErr) throw noteErr;
        order.note = note;
      }
    }

    await sb.from("gb_order_status_history").insert({ id: nanoid(), orderId, status: "PENDING", changedBy: input.customerId ?? "guest" });

    const { data: storeRow } = await sb.from("gb_stores").select("name").eq("id", input.storeId).single();
    return utcTimes({ ...order, items: items ?? [], store: storeRow }) as unknown as OrderDto;
  },
  async updateStatus(orderId: string, status: string, changedBy: string, note?: string) {
    const sb = getAdmin();
    const { data: order, error } = await sb.from("gb_orders").update({ status, updatedAt: new Date().toISOString() }).eq("id", orderId).select().single();
    if (error) throw error;
    await sb.from("gb_order_status_history").insert({ id: nanoid(), orderId, status, changedBy, note: note ?? null });
    const { data: items } = await sb.from("gb_order_items").select("*, options:gb_order_item_options(*)").eq("orderId", orderId);
    return utcTimes({ ...order, items: items ?? [] }) as unknown as OrderDto;
  },
};

// 기준 시각 이전에 들어와 아직 끝나지 않은(대기·접수·조리중) 주문을 취소 처리하고 건수를 반환
export async function cancelUnfinishedOrdersBefore(before: string, note: string): Promise<number> {
  const sb = getAdmin();
  const { data, error } = await sb.from("gb_orders")
    .update({ status: "CANCELLED", updatedAt: new Date().toISOString() })
    .in("status", ["PENDING", "CONFIRMED", "PREPARING"])
    .lt("createdAt", before)
    .select("id");
  if (error) throw error;
  const ids = (data ?? []).map((o: { id: string }) => o.id);
  if (ids.length > 0) {
    const { error: historyError } = await sb.from("gb_order_status_history")
      .insert(ids.map(orderId => ({ id: nanoid(), orderId, status: "CANCELLED", changedBy: "system", note })));
    if (historyError) throw historyError;
  }
  return ids.length;
}

// ─── 주문 알림(웹 푸시) 구독 ───────────────────────────────────
// 새 표를 만들지 않고, 만료 시각이 있는 기존 키-값 표(gb_idempotency_keys)에 주문별로 저장한다.
//   key = push:<orderId>:<폰 주소 해시>, resource = "push_subscription", resourceId = orderId
export interface PushSubscriptionRow { endpoint: string; p256dh: string; auth: string; }
const PUSH_RESOURCE = "push_subscription";

async function endpointHash(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return Array.from(new Uint8Array(digest).slice(0, 16), b => b.toString(16).padStart(2, "0")).join("");
}

/** 이 주문에 처음 등록되는 폰이면 true */
export async function savePushSubscription(orderId: string, sub: PushSubscriptionRow): Promise<boolean> {
  const sb = getAdmin();
  const key = `push:${orderId}:${await endpointHash(sub.endpoint)}`;
  const { data: existing } = await sb.from("gb_idempotency_keys").select("id").eq("key", key).maybeSingle();
  if (existing) return false;
  const { error } = await sb.from("gb_idempotency_keys").insert({
    id: nanoid(), key, resource: PUSH_RESOURCE, resourceId: orderId, response: sub,
    expiresAt: new Date(Date.now() + 86400_000).toISOString(),
  });
  if (error) throw error;
  return true;
}

export async function findPushSubscriptions(orderId: string): Promise<PushSubscriptionRow[]> {
  const sb = getAdmin();
  const { data, error } = await sb.from("gb_idempotency_keys").select("response").eq("resource", PUSH_RESOURCE).eq("resourceId", orderId);
  if (error) throw error;
  return (data ?? []).map((r: { response: unknown }) => r.response as PushSubscriptionRow);
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const sb = getAdmin();
  const { error } = await sb.from("gb_idempotency_keys").delete().eq("resource", PUSH_RESOURCE).like("key", `push:%:${await endpointHash(endpoint)}`);
  if (error) throw error;
}

export async function deleteExpiredPushSubscriptions(): Promise<void> {
  const sb = getAdmin();
  const { error } = await sb.from("gb_idempotency_keys").delete().eq("resource", PUSH_RESOURCE).lt("expiresAt", new Date().toISOString());
  if (error) throw error;
}

// ─── Payment Repository ───────────────────────────────────────

export const sbPaymentRepo: IPaymentRepository = {
  async findByOrderId(orderId: string) {
    const sb = getAdmin();
    const { data, error } = await sb.from("gb_payments").select("*").eq("orderId", orderId).limit(1).single();
    if (error) return null;
    return data as unknown as PaymentDto;
  },
  async createMockPayment(orderId: string, amount: number) {
    const sb = getAdmin();
    const { data, error } = await sb.from("gb_payments").insert({
      id: nanoid(), orderId, method: "MOCK", status: "COMPLETED",
      amount, pgTransactionId: `mock_${Date.now()}`, paidAt: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return data as unknown as PaymentDto;
  },
  async failPayment(paymentId: string) {
    const sb = getAdmin();
    const { data, error } = await sb.from("gb_payments").update({ status: "FAILED" }).eq("id", paymentId).select().single();
    if (error) throw error;
    return data as unknown as PaymentDto;
  },
  async checkIdempotency(key: string) {
    const sb = getAdmin();
    const { data } = await sb.from("gb_idempotency_keys").select("response").eq("key", key).single();
    if (!data?.response) return null;
    return data.response as unknown as PaymentDto;
  },
  async saveIdempotency(key: string, payment: PaymentDto) {
    const sb = getAdmin();
    await sb.from("gb_idempotency_keys").insert({
      id: nanoid(), key, resource: "payment", response: payment,
      expiresAt: new Date(Date.now() + 86400_000).toISOString(),
    });
  },
};

// ─── Point Repository ─────────────────────────────────────────

export const sbPointRepo: IPointRepository = {
  async findOrCreateAccount(customerId: string) {
    const sb = getAdmin();
    const { data: existing } = await sb.from("gb_point_accounts").select("*").eq("customerId", customerId).single();
    if (existing) return existing as unknown as PointAccountDto;
    const { data, error } = await sb.from("gb_point_accounts").insert({ id: nanoid(), customerId, balance: 0, totalEarned: 0, totalUsed: 0 }).select().single();
    if (error) throw error;
    return data as unknown as PointAccountDto;
  },
  async getBalance(customerId: string) {
    const sb = getAdmin();
    const { data } = await sb.from("gb_point_accounts").select("balance").eq("customerId", customerId).single();
    return (data as { balance: number } | null)?.balance ?? 0;
  },
  async getLedgers(customerId: string, limit = 20) {
    const sb = getAdmin();
    const { data: acct } = await sb.from("gb_point_accounts").select("id").eq("customerId", customerId).single();
    if (!acct) return [];
    const { data, error } = await sb.from("gb_point_ledger").select("*").eq("accountId", acct.id).order("createdAt", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as PointLedgerDto[];
  },
  async earnPoints(accountId: string, orderId: string, amount: number, idempotencyKey: string) {
    const sb = getAdmin();
    const { data: existing } = await sb.from("gb_idempotency_keys").select("id").eq("key", idempotencyKey).single();
    if (existing) throw new Error("중복 적립 요청입니다");
    const { data: acct, error: acctErr } = await sb.from("gb_point_accounts").select("balance").eq("id", accountId).single();
    if (acctErr) throw acctErr;
    const newBalance = (acct.balance as number) + amount;
    await sb.from("gb_point_accounts").update({ balance: newBalance }).eq("id", accountId);
    const { data: ledger, error: ledgerErr } = await sb.from("gb_point_ledger").insert({
      id: nanoid(), accountId, orderId, type: "EARN", amount, balanceAfter: newBalance,
    }).select().single();
    if (ledgerErr) throw ledgerErr;
    await sb.from("gb_idempotency_keys").insert({ id: nanoid(), key: idempotencyKey, resource: "point_earn", response: { ledgerId: ledger.id }, expiresAt: new Date(Date.now() + 86400_000).toISOString() });
    return ledger as unknown as PointLedgerDto;
  },
  async redeemPoints(accountId: string, orderId: string, amount: number, idempotencyKey: string) {
    const sb = getAdmin();
    const { data: existing } = await sb.from("gb_idempotency_keys").select("id").eq("key", idempotencyKey).single();
    if (existing) throw new Error("중복 차감 요청입니다");
    const { data: acct, error: acctErr } = await sb.from("gb_point_accounts").select("balance").eq("id", accountId).single();
    if (acctErr) throw acctErr;
    if ((acct.balance as number) < amount) throw new Error("잔여 포인트 부족");
    const newBalance = (acct.balance as number) - amount;
    await sb.from("gb_point_accounts").update({ balance: newBalance }).eq("id", accountId);
    const { data: ledger, error: ledgerErr } = await sb.from("gb_point_ledger").insert({
      id: nanoid(), accountId, orderId, type: "REDEEM", amount: -amount, balanceAfter: newBalance,
    }).select().single();
    if (ledgerErr) throw ledgerErr;
    await sb.from("gb_idempotency_keys").insert({ id: nanoid(), key: idempotencyKey, resource: "point_redeem", response: { ledgerId: ledger.id }, expiresAt: new Date(Date.now() + 86400_000).toISOString() });
    return ledger as unknown as PointLedgerDto;
  },
  async refundPoints(accountId: string, orderId: string, amount: number, idempotencyKey: string) {
    const sb = getAdmin();
    const { data: existing } = await sb.from("gb_idempotency_keys").select("id").eq("key", idempotencyKey).single();
    if (existing) throw new Error("중복 환불 요청입니다");
    const { data: acct, error: acctErr } = await sb.from("gb_point_accounts").select("balance, totalEarned").eq("id", accountId).single();
    if (acctErr) throw acctErr;
    const newBalance = Math.max(0, (acct.balance as number) - amount);
    await sb.from("gb_point_accounts").update({ balance: newBalance }).eq("id", accountId);
    const { data: ledger, error: ledgerErr } = await sb.from("gb_point_ledger").insert({
      id: nanoid(), accountId, orderId, type: "REFUND", amount: -amount, balanceAfter: newBalance,
    }).select().single();
    if (ledgerErr) throw ledgerErr;
    await sb.from("gb_idempotency_keys").insert({ id: nanoid(), key: idempotencyKey, resource: "point_refund", response: { ledgerId: ledger.id }, expiresAt: new Date(Date.now() + 86400_000).toISOString() });
    return ledger as unknown as PointLedgerDto;
  },
  async checkIdempotency(key: string) {
    const sb = getAdmin();
    const { data } = await sb.from("gb_idempotency_keys").select("id").eq("key", key).single();
    return !!data;
  },
};

// ─── Stamp Repository ─────────────────────────────────────────

export const sbStampRepo: IStampRepository = {
  async findOrCreateAccount(customerId: string, storeId: string) {
    const sb = getAdmin();
    const { data: existing } = await sb.from("gb_stamp_accounts").select("*").eq("customerId", customerId).eq("storeId", storeId).single();
    if (existing) return existing as unknown as StampAccountDto;
    const { data, error } = await sb.from("gb_stamp_accounts").insert({ id: nanoid(), customerId, storeId, balance: 0, totalEarned: 0, totalUsed: 0 }).select().single();
    if (error) throw error;
    return data as unknown as StampAccountDto;
  },
  async earnStamps(accountId: string, orderId: string, amount: number, idempotencyKey: string) {
    const sb = getAdmin();
    const { data: existing } = await sb.from("gb_idempotency_keys").select("id").eq("key", idempotencyKey).single();
    if (existing) throw new Error("중복 스탬프 요청입니다");
    const { data: acct, error: acctErr } = await sb.from("gb_stamp_accounts").select("balance").eq("id", accountId).single();
    if (acctErr) throw acctErr;
    const newBalance = (acct.balance as number) + amount;
    await sb.from("gb_stamp_accounts").update({ balance: newBalance }).eq("id", accountId);
    const { data: ledger, error: ledgerErr } = await sb.from("gb_stamp_ledger").insert({
      id: nanoid(), accountId, orderId, type: "EARN", amount, balanceAfter: newBalance,
    }).select().single();
    if (ledgerErr) throw ledgerErr;
    await sb.from("gb_idempotency_keys").insert({ id: nanoid(), key: idempotencyKey, resource: "stamp_earn", response: { ledgerId: ledger.id }, expiresAt: new Date(Date.now() + 86400_000).toISOString() });
    return ledger as unknown as StampLedgerDto;
  },
  async redeemStamps(accountId: string, amount: number, idempotencyKey: string) {
    const sb = getAdmin();
    const { data: existing } = await sb.from("gb_idempotency_keys").select("id").eq("key", idempotencyKey).single();
    if (existing) throw new Error("중복 스탬프 차감입니다");
    const { data: acct, error: acctErr } = await sb.from("gb_stamp_accounts").select("balance").eq("id", accountId).single();
    if (acctErr) throw acctErr;
    if ((acct.balance as number) < amount) throw new Error("스탬프 부족");
    const newBalance = (acct.balance as number) - amount;
    await sb.from("gb_stamp_accounts").update({ balance: newBalance }).eq("id", accountId);
    const { data: ledger, error: ledgerErr } = await sb.from("gb_stamp_ledger").insert({
      id: nanoid(), accountId, type: "REDEEM", amount: -amount, balanceAfter: newBalance,
    }).select().single();
    if (ledgerErr) throw ledgerErr;
    await sb.from("gb_idempotency_keys").insert({ id: nanoid(), key: idempotencyKey, resource: "stamp_redeem", response: { ledgerId: ledger.id }, expiresAt: new Date(Date.now() + 86400_000).toISOString() });
    return ledger as unknown as StampLedgerDto;
  },
  async checkIdempotency(key: string) {
    const sb = getAdmin();
    const { data } = await sb.from("gb_idempotency_keys").select("id").eq("key", key).single();
    return !!data;
  },
};

// ─── Coupon Repository ────────────────────────────────────────

export const sbCouponRepo: ICouponRepository = {
  async findByCode(code: string) {
    const sb = getAdmin();
    const { data, error } = await sb.from("gb_coupons").select("*").eq("code", code).single();
    if (error) return null;
    return data as unknown as CouponDto;
  },
  async findCustomerCoupons(customerId: string) {
    const sb = getAdmin();
    const { data, error } = await sb.from("gb_coupon_issues").select("*, coupon:gb_coupons(*)").eq("customerId", customerId).order("issuedAt", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as CouponIssueDto[];
  },
  async findIssueById(issueId: string) {
    const sb = getAdmin();
    const { data, error } = await sb.from("gb_coupon_issues").select("*, coupon:gb_coupons(*)").eq("id", issueId).single();
    if (error) return null;
    return data as unknown as CouponIssueDto;
  },
  async issueToCustomer(couponId: string, customerId: string, expiresAt?: Date) {
    const sb = getAdmin();
    const { data, error } = await sb.from("gb_coupon_issues").insert({ id: nanoid(), couponId, customerId, expiresAt: expiresAt?.toISOString() ?? null }).select("*, coupon:gb_coupons(*)").single();
    if (error) throw error;
    return data as unknown as CouponIssueDto;
  },
  async redeemCoupon(issueId: string, orderId: string, discountApplied: number) {
    const sb = getAdmin();
    await sb.from("gb_coupon_redemptions").insert({ id: nanoid(), couponIssueId: issueId, orderId, discountApplied });
    await sb.from("gb_coupon_issues").update({ redeemed: true }).eq("id", issueId);
  },
};

// ─── Checklist Repository ─────────────────────────────────────

export const sbChecklistRepo: IChecklistRepository = {
  async findByStore(storeId: string) {
    const sb = getAdmin();
    const { data, error } = await sb.from("gb_checklists").select("*, items:gb_checklist_items(*)").eq("storeId", storeId).eq("isActive", true);
    if (error) throw error;
    return (data ?? []) as unknown as ChecklistDto[];
  },
  async completeChecklist(checklistId: string, completedBy: string, completedByName: string, itemsChecked: Record<string, boolean>, notes?: string) {
    const sb = getAdmin();
    const { data, error } = await sb.from("gb_checklist_completions").insert({ id: nanoid(), checklistId, completedBy, completedByName, itemsChecked, notes: notes ?? null }).select("id").single();
    if (error) throw error;
    return { id: data.id };
  },
};

// ─── Notice Repository ────────────────────────────────────────

export const sbNoticeRepo: INoticeRepository = {
  async findByStore(storeId: string) {
    const sb = getAdmin();
    const { data, error } = await sb
      .from("gb_store_notices")
      .select("*")
      .or(`storeId.eq.${storeId},isGlobal.eq.true`)
      .order("isPinned", { ascending: false })
      .order("publishedAt", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as StoreNoticeDto[];
  },
};

// ─── Helpers ──────────────────────────────────────────────────

function groupBy<T extends Record<string, unknown>>(arr: T[], key: string): Record<string, T[]> {
  return arr.reduce((acc: Record<string, T[]>, item) => {
    const k = item[key] as string;
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

export type {
  StoreDto, MenuCategoryDto, MenuDto, OrderDto, PaymentDto,
  PointAccountDto, PointLedgerDto, StampAccountDto, StampLedgerDto,
  CouponDto, CouponIssueDto, ChecklistDto, StoreNoticeDto,
};
