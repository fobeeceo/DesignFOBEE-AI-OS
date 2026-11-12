import { createClient } from "@supabase/supabase-js";
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
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
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
  async findOptions(menuId: string) {
    const sb = getAdmin();
    const { data } = await sb.from("gb_menu_options").select("*").eq("menuId", menuId).eq("isActive", true).order("sortOrder");
    return (data ?? []) as unknown as import("../types").MenuOptionDto[];
  },
  async addOption(menuId: string, data: { groupName: string; name: string; extraPrice: number; isDefault?: boolean }) {
    const sb = getAdmin();
    const id = `opt-${nanoid()}`;
    const { data: row, error } = await sb.from("gb_menu_options").insert({
      id, menuId, name: data.name, extraPrice: data.extraPrice,
      isDefault: data.isDefault ?? false, groupName: data.groupName,
      sortOrder: 99, isActive: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return row as unknown as import("../types").MenuOptionDto;
  },
  async deleteOption(optionId: string) {
    const sb = getAdmin();
    const { error } = await sb.from("gb_menu_options").update({ isActive: false, updatedAt: new Date().toISOString() }).eq("id", optionId);
    if (error) throw error;
  },
  async findCategories(storeId?: string) {
    const sb = getAdmin();

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

    // isActive 필터 (컬럼 없으면 전체 포함)
    const activeMenus = (menusRaw ?? []).filter((m: Record<string, unknown>) =>
      m.isActive === undefined || m.isActive === null || m.isActive === true
    );

    // 3) 카테고리 테이블이 비어있으면 메뉴의 categoryId에서 가상 카테고리 생성
    let activeCats: Record<string, unknown>[];
    const dbCats = (catsRaw ?? []).filter((c: Record<string, unknown>) =>
      c.isActive === undefined || c.isActive === null || c.isActive === true
    );

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

    const optsByMenu = groupBy(
      (optRes.data ?? []).filter((o: Record<string, unknown>) => o.isActive !== false),
      "menuId"
    );
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
          storeAvailability: availByMenu[m.id] ?? [],
        })),
      };
    });
    return result as unknown as MenuCategoryDto[];
  },
};

// ─── Order Repository ─────────────────────────────────────────

export const sbOrderRepo: IOrderRepository = {
  async findById(id: string) {
    const sb = getAdmin();
    const { data: order, error } = await sb.from("gb_orders").select("*, store:gb_stores(name)").eq("id", id).single();
    if (error) return null;
    const { data: items } = await sb.from("gb_order_items").select("*, options:gb_order_item_options(*)").eq("orderId", id);
    return { ...order, items: items ?? [] } as unknown as OrderDto;
  },
  async findByOrderNumber(orderNumber: string) {
    const sb = getAdmin();
    const { data: order, error } = await sb.from("gb_orders").select("*, store:gb_stores(name)").eq("orderNumber", orderNumber).single();
    if (error) return null;
    const { data: items } = await sb.from("gb_order_items").select("*, options:gb_order_item_options(*)").eq("orderId", order.id);
    return { ...order, items: items ?? [] } as unknown as OrderDto;
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
    return orders.map((o: Record<string, unknown> & { id: string }) => ({ ...o, items: itemsByOrder[o.id] ?? [] })) as unknown as OrderDto[];
  },
  async findByStore(storeId: string, status?: string) {
    const sb = getAdmin();
    let q = sb.from("gb_orders").select("*, items:gb_order_items(*, options:gb_order_item_options(*))").eq("storeId", storeId).order("createdAt", { ascending: false });
    if (status) {
      // status may be comma-separated (e.g. "PENDING,CONFIRMED,PREPARING,READY") — use .in() not .eq()
      const statuses = status.split(",").map(s => s.trim()).filter(Boolean);
      q = statuses.length > 1 ? q.in("status", statuses) : q.eq("status", statuses[0]);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as unknown as OrderDto[];
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

    const optionInserts = input.items.flatMap((i, idx) =>
      (i.options ?? []).map((o) => ({
        id: nanoid(),
        orderItemId: items![idx].id,
        menuOptionId: null, // FK 제약 회피 — 옵션명·가격은 텍스트로 보존
        optionName: o.optionName,
        extraPrice: o.extraPrice,
      }))
    );
    if (optionInserts.length > 0) {
      const { error: optErr } = await sb.from("gb_order_item_options").insert(optionInserts);
      if (optErr) throw optErr;
    }

    await sb.from("gb_order_status_history").insert({ id: nanoid(), orderId, status: "PENDING", changedBy: input.customerId ?? "guest" });

    const { data: storeRow } = await sb.from("gb_stores").select("name").eq("id", input.storeId).single();
    return { ...order, items: items ?? [], store: storeRow } as unknown as OrderDto;
  },
  async updateStatus(orderId: string, status: string, changedBy: string, note?: string) {
    const sb = getAdmin();
    const { data: order, error } = await sb.from("gb_orders").update({ status, updatedAt: new Date().toISOString() }).eq("id", orderId).select().single();
    if (error) throw error;
    await sb.from("gb_order_status_history").insert({ id: nanoid(), orderId, status, changedBy, note: note ?? null });
    const { data: items } = await sb.from("gb_order_items").select("*, options:gb_order_item_options(*)").eq("orderId", orderId);
    return { ...order, items: items ?? [] } as unknown as OrderDto;
  },
};

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
