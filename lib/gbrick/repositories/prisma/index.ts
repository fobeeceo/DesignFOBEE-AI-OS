import { GbOrderStatus, GbPaymentMethod, GbPaymentStatus, GbPointLedgerType, GbStampLedgerType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  IStoreRepository, IMenuRepository, IOrderRepository, IPaymentRepository,
  IPointRepository, IStampRepository, ICouponRepository, IChecklistRepository, INoticeRepository,
  StoreDto, MenuCategoryDto, OrderDto, PaymentDto, PointAccountDto, PointLedgerDto,
  StampAccountDto, StampLedgerDto, CouponDto, CouponIssueDto, ChecklistDto, StoreNoticeDto,
  CreateOrderInput,
} from "../types";

// ─── Store Repository ─────────────────────────────────────────

export const prismaStoreRepo: IStoreRepository = {
  async findMany(status?: string) {
    const where = status ? { status: status as never } : {};
    const stores = await prisma.gbStore.findMany({ where, orderBy: { name: "asc" } });
    return stores as unknown as StoreDto[];
  },
  async findById(id: string) {
    const store = await prisma.gbStore.findUnique({ where: { id } });
    return store as unknown as StoreDto | null;
  },
  async findMenus(storeId: string) {
    return prismaMenuRepo.findCategories(storeId);
  },
  async updateSoldOut(storeId: string, menuId: string, isSoldOut: boolean) {
    await prisma.gbStoreMenuAvailability.upsert({
      where: { storeId_menuId: { storeId, menuId } },
      create: { storeId, menuId, isSoldOut },
      update: { isSoldOut },
    });
  },
  async update(id: string, data: Record<string, unknown>) {
    const store = await prisma.gbStore.update({
      where: { id },
      data: { ...data, updatedAt: new Date() } as never,
    });
    return store as unknown as StoreDto;
  },
};

// ─── Menu Repository ──────────────────────────────────────────

export const prismaMenuRepo: IMenuRepository = {
  async updateMenu(menuId: string, data: Record<string, unknown>) {
    await prisma.gbMenu.update({
      where: { id: menuId },
      data: { ...data, updatedAt: new Date() } as never,
    });
  },
  async findCategories(storeId?: string) {
    const categories = await prisma.gbMenuCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        menus: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            options: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
            storeAvailability: storeId ? { where: { storeId } } : false,
          },
        },
      },
    });
    return categories as unknown as MenuCategoryDto[];
  },
};

// ─── Order Repository ─────────────────────────────────────────

export const prismaOrderRepo: IOrderRepository = {
  async findById(id: string) {
    const order = await prisma.gbOrder.findUnique({
      where: { id },
      include: { items: { include: { options: true } }, store: { select: { name: true } }, payment: true },
    });
    return order as unknown as OrderDto | null;
  },
  async findByOrderNumber(orderNumber: string) {
    const order = await prisma.gbOrder.findUnique({
      where: { orderNumber },
      include: { items: { include: { options: true } }, store: { select: { name: true } } },
    });
    return order as unknown as OrderDto | null;
  },
  async findByCustomer(customerId: string, limit = 20) {
    const orders = await prisma.gbOrder.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { items: { include: { options: true } }, store: { select: { name: true } } },
    });
    return orders as unknown as OrderDto[];
  },
  async findByStore(storeId: string, status?: GbOrderStatus) {
    const orders = await prisma.gbOrder.findMany({
      where: { storeId, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { options: true } } },
    });
    return orders as unknown as OrderDto[];
  },
  async create(input) {
    const order = await prisma.gbOrder.create({
      data: {
        orderNumber: input.orderNumber,
        storeId: input.storeId,
        customerId: input.customerId,
        totalAmount: input.totalAmount,
        discountAmount: 0,
        finalAmount: input.finalAmount,
        pointEarned: input.pointEarned,
        pointUsed: input.pointUsed ?? 0,
        couponDiscount: input.couponDiscount ?? 0,
        pickupName: input.pickupName,
        note: input.note,
        isGuest: input.isGuest ?? false,
        items: {
          create: input.items.map((i) => ({
            menuId: i.menuId,
            menuName: i.menuName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.unitPrice * i.quantity,
            options: {
              create: (i.options ?? []).map((o) => ({
                menuOptionId: o.menuOptionId,
                optionName: o.optionName,
                extraPrice: o.extraPrice,
              })),
            },
          })),
        },
        statusHistory: {
          create: { status: GbOrderStatus.PENDING, changedBy: input.customerId ?? "guest" },
        },
      },
      include: { items: { include: { options: true } }, store: { select: { name: true } } },
    });
    return order as unknown as OrderDto;
  },
  async updateStatus(orderId: string, status: GbOrderStatus, changedBy: string, note?: string) {
    const order = await prisma.gbOrder.update({
      where: { id: orderId },
      data: {
        status,
        statusHistory: { create: { status, changedBy, note } },
      },
      include: { items: { include: { options: true } } },
    });
    return order as unknown as OrderDto;
  },
};

// ─── Payment Repository ───────────────────────────────────────

export const prismaPaymentRepo: IPaymentRepository = {
  async findByOrderId(orderId: string) {
    const p = await prisma.gbPayment.findFirst({ where: { orderId } });
    return p as unknown as PaymentDto | null;
  },
  async createMockPayment(orderId: string, amount: number) {
    const p = await prisma.gbPayment.create({
      data: {
        orderId, method: GbPaymentMethod.MOCK, status: GbPaymentStatus.COMPLETED,
        amount, pgTransactionId: `mock_${Date.now()}`, paidAt: new Date(),
      },
    });
    return p as unknown as PaymentDto;
  },
  async failPayment(paymentId: string) {
    const p = await prisma.gbPayment.update({
      where: { id: paymentId }, data: { status: GbPaymentStatus.FAILED },
    });
    return p as unknown as PaymentDto;
  },
  async checkIdempotency(key: string) {
    const rec = await prisma.gbIdempotencyKey.findUnique({ where: { key } });
    if (!rec?.response) return null;
    return rec.response as unknown as PaymentDto;
  },
  async saveIdempotency(key: string, payment: PaymentDto) {
    await prisma.gbIdempotencyKey.create({
      data: { key, resource: "payment", response: payment as never, expiresAt: new Date(Date.now() + 86400_000) },
    });
  },
};

// ─── Point Repository ─────────────────────────────────────────

export const prismaPointRepo: IPointRepository = {
  async findOrCreateAccount(customerId: string) {
    let account = await prisma.gbPointAccount.findUnique({ where: { customerId } });
    if (!account) {
      account = await prisma.gbPointAccount.create({ data: { customerId } });
    }
    return account as unknown as PointAccountDto;
  },
  async getBalance(customerId: string) {
    const account = await prisma.gbPointAccount.findUnique({ where: { customerId } });
    return account?.balance ?? 0;
  },
  async getLedgers(customerId: string, limit = 20) {
    const account = await prisma.gbPointAccount.findUnique({ where: { customerId } });
    if (!account) return [];
    const ledgers = await prisma.gbPointLedger.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return ledgers as unknown as PointLedgerDto[];
  },
  async earnPoints(accountId: string, orderId: string, amount: number, idempotencyKey: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.gbIdempotencyKey.findUnique({ where: { key: idempotencyKey } });
      if (existing) throw new Error("중복 적립 요청입니다");
      const account = await tx.gbPointAccount.update({
        where: { id: accountId },
        data: { balance: { increment: amount }, totalEarned: { increment: amount } },
      });
      const ledger = await tx.gbPointLedger.create({
        data: { accountId, orderId, type: GbPointLedgerType.EARN, amount, balanceAfter: account.balance },
      });
      await tx.gbIdempotencyKey.create({
        data: { key: idempotencyKey, resource: "point_earn", response: { ledgerId: ledger.id } as never, expiresAt: new Date(Date.now() + 86400_000) },
      });
      return ledger as unknown as PointLedgerDto;
    });
  },
  async redeemPoints(accountId: string, orderId: string, amount: number, idempotencyKey: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.gbIdempotencyKey.findUnique({ where: { key: idempotencyKey } });
      if (existing) throw new Error("중복 차감 요청입니다");
      const current = await tx.gbPointAccount.findUnique({ where: { id: accountId } });
      if (!current || current.balance < amount) throw new Error("잔여 포인트 부족");
      const account = await tx.gbPointAccount.update({
        where: { id: accountId },
        data: { balance: { decrement: amount }, totalUsed: { increment: amount } },
      });
      const ledger = await tx.gbPointLedger.create({
        data: { accountId, orderId, type: GbPointLedgerType.REDEEM, amount: -amount, balanceAfter: account.balance },
      });
      await tx.gbIdempotencyKey.create({
        data: { key: idempotencyKey, resource: "point_redeem", response: { ledgerId: ledger.id } as never, expiresAt: new Date(Date.now() + 86400_000) },
      });
      return ledger as unknown as PointLedgerDto;
    });
  },
  async refundPoints(accountId: string, orderId: string, amount: number, idempotencyKey: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.gbIdempotencyKey.findUnique({ where: { key: idempotencyKey } });
      if (existing) throw new Error("중복 환불 요청입니다");
      const account = await tx.gbPointAccount.update({
        where: { id: accountId },
        data: { balance: { decrement: amount }, totalEarned: { decrement: amount } },
      });
      const ledger = await tx.gbPointLedger.create({
        data: { accountId, orderId, type: GbPointLedgerType.REFUND, amount: -amount, balanceAfter: Math.max(0, account.balance) },
      });
      await tx.gbIdempotencyKey.create({
        data: { key: idempotencyKey, resource: "point_refund", response: { ledgerId: ledger.id } as never, expiresAt: new Date(Date.now() + 86400_000) },
      });
      return ledger as unknown as PointLedgerDto;
    });
  },
  async checkIdempotency(key: string) {
    const rec = await prisma.gbIdempotencyKey.findUnique({ where: { key } });
    return !!rec;
  },
};

// ─── Stamp Repository ─────────────────────────────────────────

export const prismaStampRepo: IStampRepository = {
  async findOrCreateAccount(customerId: string, storeId: string) {
    let account = await prisma.gbStampAccount.findUnique({ where: { customerId_storeId: { customerId, storeId } } });
    if (!account) {
      account = await prisma.gbStampAccount.create({ data: { customerId, storeId } });
    }
    return account as unknown as StampAccountDto;
  },
  async earnStamps(accountId: string, orderId: string, amount: number, idempotencyKey: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.gbIdempotencyKey.findUnique({ where: { key: idempotencyKey } });
      if (existing) throw new Error("중복 스탬프 요청입니다");
      const account = await tx.gbStampAccount.update({
        where: { id: accountId },
        data: { balance: { increment: amount }, totalEarned: { increment: amount } },
      });
      const ledger = await tx.gbStampLedger.create({
        data: { accountId, orderId, type: GbStampLedgerType.EARN, amount, balanceAfter: account.balance },
      });
      await tx.gbIdempotencyKey.create({
        data: { key: idempotencyKey, resource: "stamp_earn", response: { ledgerId: ledger.id } as never, expiresAt: new Date(Date.now() + 86400_000) },
      });
      return ledger as unknown as StampLedgerDto;
    });
  },
  async redeemStamps(accountId: string, amount: number, idempotencyKey: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.gbIdempotencyKey.findUnique({ where: { key: idempotencyKey } });
      if (existing) throw new Error("중복 스탬프 차감입니다");
      const current = await tx.gbStampAccount.findUnique({ where: { id: accountId } });
      if (!current || current.balance < amount) throw new Error("스탬프 부족");
      const account = await tx.gbStampAccount.update({
        where: { id: accountId },
        data: { balance: { decrement: amount }, totalUsed: { increment: amount } },
      });
      const ledger = await tx.gbStampLedger.create({
        data: { accountId, type: GbStampLedgerType.REDEEM, amount: -amount, balanceAfter: account.balance },
      });
      await tx.gbIdempotencyKey.create({
        data: { key: idempotencyKey, resource: "stamp_redeem", response: { ledgerId: ledger.id } as never, expiresAt: new Date(Date.now() + 86400_000) },
      });
      return ledger as unknown as StampLedgerDto;
    });
  },
  async checkIdempotency(key: string) {
    const rec = await prisma.gbIdempotencyKey.findUnique({ where: { key } });
    return !!rec;
  },
};

// ─── Coupon Repository ────────────────────────────────────────

export const prismaCouponRepo: ICouponRepository = {
  async findByCode(code: string) {
    const coupon = await prisma.gbCoupon.findUnique({ where: { code } });
    return coupon as unknown as CouponDto | null;
  },
  async findCustomerCoupons(customerId: string) {
    const issues = await prisma.gbCouponIssue.findMany({
      where: { customerId },
      include: { coupon: true },
      orderBy: { issuedAt: "desc" },
    });
    return issues as unknown as CouponIssueDto[];
  },
  async findIssueById(issueId: string) {
    const issue = await prisma.gbCouponIssue.findUnique({
      where: { id: issueId }, include: { coupon: true },
    });
    return issue as unknown as CouponIssueDto | null;
  },
  async issueToCustomer(couponId: string, customerId: string, expiresAt?: Date) {
    const issue = await prisma.gbCouponIssue.create({
      data: { couponId, customerId, expiresAt },
      include: { coupon: true },
    });
    return issue as unknown as CouponIssueDto;
  },
  async redeemCoupon(issueId: string, orderId: string, discountApplied: number) {
    await prisma.gbCouponRedemption.create({
      data: { couponIssueId: issueId, orderId, discountApplied },
    });
  },
};

// ─── Checklist Repository ─────────────────────────────────────

export const prismaChecklistRepo: IChecklistRepository = {
  async findByStore(storeId: string) {
    const checklists = await prisma.gbChecklist.findMany({
      where: { storeId, isActive: true },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    return checklists as unknown as ChecklistDto[];
  },
  async completeChecklist(checklistId: string, completedBy: string, completedByName: string, itemsChecked: Record<string, boolean>, notes?: string) {
    const completion = await prisma.gbChecklistCompletion.create({
      data: {
        checklistId, completedBy, completedByName,
        itemsChecked: itemsChecked as never, notes,
      },
    });
    return { id: completion.id };
  },
};

// ─── Notice Repository ────────────────────────────────────────

export const prismaNoticeRepo: INoticeRepository = {
  async findByStore(storeId: string) {
    const notices = await prisma.gbStoreNotice.findMany({
      where: { OR: [{ storeId }, { isGlobal: true }] },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    });
    return notices as unknown as StoreNoticeDto[];
  },
};
