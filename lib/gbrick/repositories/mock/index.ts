import { GbOrderStatus, GbPaymentMethod, GbPaymentStatus, GbPointLedgerType, GbStampLedgerType } from "@prisma/client";
import { MOCK_STORES, MOCK_MENU_CATEGORIES, MOCK_MENUS, MOCK_MENU_OPTIONS } from "@/lib/gbrick/mockData";
import type {
  IStoreRepository, IMenuRepository, IOrderRepository, IPaymentRepository,
  IPointRepository, IStampRepository, ICouponRepository, IChecklistRepository, INoticeRepository,
  StoreDto, MenuCategoryDto, OrderDto, PaymentDto, PointAccountDto, PointLedgerDto,
  StampAccountDto, StampLedgerDto, CouponDto, CouponIssueDto, ChecklistDto, StoreNoticeDto,
  CreateOrderInput,
} from "../types";

function cuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── In-memory state (dev only) ──────────────────────────────

const orders: OrderDto[] = [];
const payments: PaymentDto[] = [];
const pointAccounts: Map<string, PointAccountDto> = new Map();
const pointLedgers: PointLedgerDto[] = [];
const pointIdempotency: Set<string> = new Set();
const stampAccounts: Map<string, StampAccountDto> = new Map();
const stampLedgers: StampLedgerDto[] = [];
const stampIdempotency: Set<string> = new Set();
const couponIssues: CouponIssueDto[] = [];
const paymentIdempotency: Map<string, PaymentDto> = new Map();
const idempotencyCache: Map<string, PaymentDto> = new Map();

const MOCK_COUPONS: CouponDto[] = [
  {
    id: "coupon_welcome",
    code: "WELCOME2024",
    name: "첫 방문 감사 쿠폰",
    type: "DISCOUNT_AMOUNT",
    status: "ACTIVE",
    discountAmount: 1000,
    discountRate: null,
    minOrderAmount: 5000,
    maxDiscount: null,
    perCustomerLimit: 1,
    validFrom: new Date("2024-01-01"),
    validUntil: new Date("2027-12-31"),
  },
];

const checklists: ChecklistDto[] = [
  {
    id: "cl_opening",
    storeId: "store_gbrick_sinchon",
    title: "오픈 체크리스트",
    category: "OPENING",
    isActive: true,
    items: [
      { id: "cl_01", title: "청소 완료", isRequired: true, sortOrder: 1 },
      { id: "cl_02", title: "재료 확인", isRequired: true, sortOrder: 2 },
      { id: "cl_03", title: "장비 가동 확인", isRequired: true, sortOrder: 3 },
      { id: "cl_04", title: "영수증지 확인", isRequired: false, sortOrder: 4 },
    ],
  },
  {
    id: "cl_closing",
    storeId: "store_gbrick_sinchon",
    title: "마감 체크리스트",
    category: "CLOSING",
    isActive: true,
    items: [
      { id: "cl_05", title: "장비 세척 완료", isRequired: true, sortOrder: 1 },
      { id: "cl_06", title: "재료 냉장 보관", isRequired: true, sortOrder: 2 },
      { id: "cl_07", title: "매출 정산", isRequired: true, sortOrder: 3 },
      { id: "cl_08", title: "잠금 확인", isRequired: true, sortOrder: 4 },
    ],
  },
];

const notices: StoreNoticeDto[] = [
  {
    id: "notice_001",
    storeId: null,
    isGlobal: true,
    title: "[전체] 여름 메뉴 출시 안내",
    content: "2024 여름 시즌 수제 팥빙수가 출시되었습니다.",
    isPinned: true,
    publishedAt: new Date("2024-06-01"),
    createdBy: "hq",
  },
];

// ─── Store Repository ─────────────────────────────────────────

export const mockStoreRepo: IStoreRepository = {
  async findMany(status?: string) {
    const stores = MOCK_STORES as unknown as StoreDto[];
    if (status) return stores.filter((s) => s.status === status);
    return stores;
  },
  async findById(id: string) {
    return (MOCK_STORES.find((s) => s.id === id) as unknown as StoreDto) ?? null;
  },
  async findMenus(_storeId: string) {
    return mockMenuRepo.findCategories(_storeId);
  },
  async updateSoldOut(_storeId: string, _menuId: string, _isSoldOut: boolean) {},
};

// ─── Menu Repository ──────────────────────────────────────────

export const mockMenuRepo: IMenuRepository = {
  async findCategories(_storeId?: string) {
    return MOCK_MENU_CATEGORIES.map((cat) => ({
      ...cat,
      menus: MOCK_MENUS.filter((m) => m.categoryId === cat.id).map((m) => ({
        ...m,
        nameEn: undefined,
        description: (m as { description?: string }).description ?? null,
        imageUrl: null,
        isActive: true,
        calories: null,
        allergens: [],
        metadata: null,
        options: MOCK_MENU_OPTIONS.filter((o) => o.menuId === m.id).map((o) => ({
          ...o,
          isRequired: false,
          sortOrder: 0,
        })),
        storeAvailability: [],
      })),
    })) as MenuCategoryDto[];
  },
};

// ─── Order Repository ─────────────────────────────────────────

export const mockOrderRepo: IOrderRepository = {
  async findById(id: string) {
    return orders.find((o) => o.id === id) ?? null;
  },
  async findByOrderNumber(orderNumber: string) {
    return orders.find((o) => o.orderNumber === orderNumber) ?? null;
  },
  async findByCustomer(customerId: string, limit = 20) {
    return orders.filter((o) => o.customerId === customerId).slice(0, limit);
  },
  async findByStore(storeId: string, status?: GbOrderStatus) {
    return orders.filter((o) => o.storeId === storeId && (!status || o.status === status));
  },
  async create(input) {
    const order: OrderDto = {
      id: cuid(),
      orderNumber: input.orderNumber,
      storeId: input.storeId,
      customerId: input.customerId ?? null,
      status: GbOrderStatus.PENDING,
      totalAmount: input.totalAmount,
      discountAmount: 0,
      finalAmount: input.finalAmount,
      pointEarned: input.pointEarned,
      pointUsed: input.pointUsed ?? 0,
      couponDiscount: input.couponDiscount ?? 0,
      pickupName: input.pickupName ?? null,
      note: input.note ?? null,
      isGuest: input.isGuest ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: input.items.map((i) => ({
        id: cuid(),
        menuId: i.menuId,
        menuName: i.menuName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.unitPrice * i.quantity,
        options: i.options?.map((o) => ({ optionName: o.optionName, extraPrice: o.extraPrice })) ?? [],
      })),
    };
    orders.push(order);
    return order;
  },
  async updateStatus(orderId: string, status: GbOrderStatus, _changedBy: string, _note?: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error("주문을 찾을 수 없습니다");
    order.status = status;
    order.updatedAt = new Date();
    return order;
  },
};

// ─── Payment Repository ───────────────────────────────────────

export const mockPaymentRepo: IPaymentRepository = {
  async findByOrderId(orderId: string) {
    return payments.find((p) => p.orderId === orderId) ?? null;
  },
  async createMockPayment(orderId: string, amount: number) {
    const payment: PaymentDto = {
      id: cuid(),
      orderId,
      method: GbPaymentMethod.MOCK,
      status: GbPaymentStatus.COMPLETED,
      amount,
      pgTransactionId: `mock_${Date.now()}`,
      paidAt: new Date(),
    };
    payments.push(payment);
    return payment;
  },
  async failPayment(paymentId: string) {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error("결제를 찾을 수 없습니다");
    payment.status = GbPaymentStatus.FAILED;
    return payment;
  },
  async checkIdempotency(key: string) {
    return idempotencyCache.get(key) ?? null;
  },
  async saveIdempotency(key: string, payment: PaymentDto) {
    idempotencyCache.set(key, payment);
  },
};

// ─── Point Repository ─────────────────────────────────────────

export const mockPointRepo: IPointRepository = {
  async findOrCreateAccount(customerId: string) {
    if (!pointAccounts.has(customerId)) {
      pointAccounts.set(customerId, {
        id: cuid(),
        customerId,
        balance: 0,
        totalEarned: 0,
        totalUsed: 0,
      });
    }
    return pointAccounts.get(customerId)!;
  },
  async getBalance(customerId: string) {
    return pointAccounts.get(customerId)?.balance ?? 0;
  },
  async getLedgers(customerId: string, limit = 20) {
    const account = pointAccounts.get(customerId);
    if (!account) return [];
    return pointLedgers
      .filter((l) => l.accountId === account.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  },
  async earnPoints(accountId: string, orderId: string, amount: number, idempotencyKey: string) {
    if (pointIdempotency.has(idempotencyKey)) throw new Error("중복 적립 요청입니다");
    const account = [...pointAccounts.values()].find((a) => a.id === accountId);
    if (!account) throw new Error("포인트 계정을 찾을 수 없습니다");
    account.balance += amount;
    account.totalEarned += amount;
    const ledger: PointLedgerDto = {
      id: cuid(), accountId, orderId, type: GbPointLedgerType.EARN,
      amount, balanceAfter: account.balance, createdAt: new Date(),
    };
    pointLedgers.push(ledger);
    pointIdempotency.add(idempotencyKey);
    return ledger;
  },
  async redeemPoints(accountId: string, orderId: string, amount: number, idempotencyKey: string) {
    if (pointIdempotency.has(idempotencyKey)) throw new Error("중복 차감 요청입니다");
    const account = [...pointAccounts.values()].find((a) => a.id === accountId);
    if (!account) throw new Error("포인트 계정을 찾을 수 없습니다");
    if (account.balance < amount) throw new Error("잔여 포인트 부족");
    account.balance -= amount;
    account.totalUsed += amount;
    const ledger: PointLedgerDto = {
      id: cuid(), accountId, orderId, type: GbPointLedgerType.REDEEM,
      amount: -amount, balanceAfter: account.balance, createdAt: new Date(),
    };
    pointLedgers.push(ledger);
    pointIdempotency.add(idempotencyKey);
    return ledger;
  },
  async refundPoints(accountId: string, orderId: string, amount: number, idempotencyKey: string) {
    if (pointIdempotency.has(idempotencyKey)) throw new Error("중복 환불 요청입니다");
    const account = [...pointAccounts.values()].find((a) => a.id === accountId);
    if (!account) throw new Error("포인트 계정을 찾을 수 없습니다");
    account.balance = Math.max(0, account.balance - amount);
    account.totalEarned = Math.max(0, account.totalEarned - amount);
    const ledger: PointLedgerDto = {
      id: cuid(), accountId, orderId, type: GbPointLedgerType.REFUND,
      amount: -amount, balanceAfter: account.balance, createdAt: new Date(),
    };
    pointLedgers.push(ledger);
    pointIdempotency.add(idempotencyKey);
    return ledger;
  },
  async checkIdempotency(key: string) {
    return pointIdempotency.has(key);
  },
};

// ─── Stamp Repository ─────────────────────────────────────────

export const mockStampRepo: IStampRepository = {
  async findOrCreateAccount(customerId: string, storeId: string) {
    const key = `${customerId}:${storeId}`;
    if (!stampAccounts.has(key)) {
      stampAccounts.set(key, {
        id: cuid(), customerId, storeId, balance: 0, totalEarned: 0, totalUsed: 0,
      });
    }
    return stampAccounts.get(key)!;
  },
  async earnStamps(accountId: string, orderId: string, amount: number, idempotencyKey: string) {
    if (stampIdempotency.has(idempotencyKey)) throw new Error("중복 스탬프 요청입니다");
    const account = [...stampAccounts.values()].find((a) => a.id === accountId);
    if (!account) throw new Error("스탬프 계정을 찾을 수 없습니다");
    account.balance += amount;
    account.totalEarned += amount;
    const ledger: StampLedgerDto = {
      id: cuid(), accountId, orderId, type: GbStampLedgerType.EARN,
      amount, balanceAfter: account.balance, createdAt: new Date(),
    };
    stampLedgers.push(ledger);
    stampIdempotency.add(idempotencyKey);
    return ledger;
  },
  async redeemStamps(accountId: string, amount: number, idempotencyKey: string) {
    if (stampIdempotency.has(idempotencyKey)) throw new Error("중복 스탬프 차감입니다");
    const account = [...stampAccounts.values()].find((a) => a.id === accountId);
    if (!account) throw new Error("스탬프 계정을 찾을 수 없습니다");
    if (account.balance < amount) throw new Error("스탬프 부족");
    account.balance -= amount;
    account.totalUsed += amount;
    const ledger: StampLedgerDto = {
      id: cuid(), accountId, orderId: null, type: GbStampLedgerType.REDEEM,
      amount: -amount, balanceAfter: account.balance, createdAt: new Date(),
    };
    stampLedgers.push(ledger);
    stampIdempotency.add(idempotencyKey);
    return ledger;
  },
  async checkIdempotency(key: string) {
    return stampIdempotency.has(key);
  },
};

// ─── Coupon Repository ────────────────────────────────────────

export const mockCouponRepo: ICouponRepository = {
  async findByCode(code: string) {
    return MOCK_COUPONS.find((c) => c.code === code) ?? null;
  },
  async findCustomerCoupons(customerId: string) {
    return couponIssues.filter((i) => i.customerId === customerId);
  },
  async findIssueById(issueId: string) {
    return couponIssues.find((i) => i.id === issueId) ?? null;
  },
  async issueToCustomer(couponId: string, customerId: string, expiresAt?: Date) {
    const coupon = MOCK_COUPONS.find((c) => c.id === couponId);
    if (!coupon) throw new Error("쿠폰을 찾을 수 없습니다");
    const issue: CouponIssueDto = {
      id: cuid(), couponId, customerId, issuedAt: new Date(),
      expiresAt: expiresAt ?? null, redeemed: false, coupon,
    };
    couponIssues.push(issue);
    return issue;
  },
  async redeemCoupon(issueId: string, _orderId: string, _discountApplied: number) {
    const issue = couponIssues.find((i) => i.id === issueId);
    if (!issue) throw new Error("쿠폰 발급 내역을 찾을 수 없습니다");
    if (issue.redeemed) throw new Error("이미 사용된 쿠폰입니다");
    issue.redeemed = true;
  },
};

// ─── Checklist Repository ─────────────────────────────────────

export const mockChecklistRepo: IChecklistRepository = {
  async findByStore(storeId: string) {
    return checklists.filter((c) => c.storeId === storeId && c.isActive);
  },
  async completeChecklist(checklistId: string, completedBy: string, completedByName: string, itemsChecked: Record<string, boolean>, notes?: string) {
    return { id: cuid() };
  },
};

// ─── Notice Repository ────────────────────────────────────────

export const mockNoticeRepo: INoticeRepository = {
  async findByStore(storeId: string) {
    return notices.filter((n) => n.isGlobal || n.storeId === storeId);
  },
};
