import { GbOrderStatus } from "@prisma/client";
import { orderRepo, paymentRepo, pointRepo, stampRepo, couponRepo } from "@/lib/gbrick/repositories";
import { calcPointEarn } from "@/lib/gbrick/pointPolicy";
import type { CreateOrderInput, OrderDto } from "@/lib/gbrick/repositories/types";

// ─── State Machine ────────────────────────────────────────────

const VALID_TRANSITIONS: Record<GbOrderStatus, GbOrderStatus[]> = {
  PENDING: [GbOrderStatus.CONFIRMED, GbOrderStatus.CANCELLED],
  CONFIRMED: [GbOrderStatus.PREPARING, GbOrderStatus.CANCELLED],
  PREPARING: [GbOrderStatus.READY, GbOrderStatus.CANCELLED],
  READY: [GbOrderStatus.PICKED_UP, GbOrderStatus.CANCELLED],
  PICKED_UP: [],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransition(from: GbOrderStatus, to: GbOrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Order Number ─────────────────────────────────────────────

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `GB${date}${rand}`;
}

// ─── Coupon Discount Calculation ─────────────────────────────

async function calcCouponDiscount(couponIssueId: string, subtotal: number): Promise<number> {
  const issue = await couponRepo.findIssueById(couponIssueId);
  if (!issue) throw new Error("쿠폰 발급 내역을 찾을 수 없습니다");
  if (issue.redeemed) throw new Error("이미 사용된 쿠폰입니다");
  const now = new Date();
  if (issue.expiresAt && issue.expiresAt < now) throw new Error("만료된 쿠폰입니다");
  const { coupon } = issue;
  if (coupon.validUntil < now) throw new Error("만료된 쿠폰입니다");
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) throw new Error(`최소 주문 금액은 ${coupon.minOrderAmount.toLocaleString()}원입니다`);
  if (coupon.type === "DISCOUNT_AMOUNT") return coupon.discountAmount ?? 0;
  if (coupon.type === "DISCOUNT_RATE" && coupon.discountRate) {
    const discount = Math.floor(subtotal * coupon.discountRate);
    return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
  }
  return 0;
}

// ─── Create Order ─────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput): Promise<OrderDto> {
  const totalAmount = input.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity + (item.options ?? []).reduce((s, o) => s + o.extraPrice, 0) * item.quantity,
    0
  );

  let couponDiscount = 0;
  if (input.couponIssueId) {
    couponDiscount = await calcCouponDiscount(input.couponIssueId, totalAmount);
  }

  const pointUsed = input.pointUsed ?? 0;
  if (pointUsed > 0 && input.customerId) {
    const balance = await pointRepo.getBalance(input.customerId);
    if (balance < pointUsed) throw new Error("잔여 포인트 부족");
  }

  const finalAmount = Math.max(0, totalAmount - couponDiscount - pointUsed);

  const store = await orderRepo.findByOrderNumber("__check__").then(() => null).catch(() => null);
  void store;

  const pointEarned = calcPointEarn(finalAmount, 0.03);

  const idempotencyBase = `order_${input.storeId}_${input.customerId ?? "guest"}_${Date.now()}`;

  const order = await orderRepo.create({
    ...input,
    orderNumber: generateOrderNumber(),
    totalAmount,
    finalAmount,
    pointEarned,
    couponDiscount,
    pointUsed,
  });

  // Process mock payment immediately
  const idempotencyKey = `pay_${order.id}`;
  const existingPayment = await paymentRepo.checkIdempotency(idempotencyKey);
  if (!existingPayment) {
    const payment = await paymentRepo.createMockPayment(order.id, finalAmount);
    await paymentRepo.saveIdempotency(idempotencyKey, payment);
  }

  // Redeem points if used
  if (pointUsed > 0 && input.customerId) {
    const pointAccount = await pointRepo.findOrCreateAccount(input.customerId);
    const redeemKey = `redeem_${order.id}`;
    const alreadyRedeemed = await pointRepo.checkIdempotency(redeemKey);
    if (!alreadyRedeemed) {
      await pointRepo.redeemPoints(pointAccount.id, order.id, pointUsed, redeemKey);
    }
  }

  // Redeem coupon if used
  if (input.couponIssueId && couponDiscount > 0) {
    await couponRepo.redeemCoupon(input.couponIssueId, order.id, couponDiscount);
  }

  // Confirm order after payment
  await orderRepo.updateStatus(order.id, GbOrderStatus.CONFIRMED, input.customerId ?? "system");

  // Earn points after confirmation
  if (pointEarned > 0 && input.customerId) {
    const pointAccount = await pointRepo.findOrCreateAccount(input.customerId);
    const earnKey = `earn_${order.id}`;
    const alreadyEarned = await pointRepo.checkIdempotency(earnKey);
    if (!alreadyEarned) {
      await pointRepo.earnPoints(pointAccount.id, order.id, pointEarned, earnKey);
    }
  }

  // Earn 1 stamp per order for logged-in customers
  if (input.customerId) {
    const stampAccount = await stampRepo.findOrCreateAccount(input.customerId, input.storeId);
    const stampKey = `stamp_${order.id}`;
    const alreadyStamped = await stampRepo.checkIdempotency(stampKey);
    if (!alreadyStamped) {
      await stampRepo.earnStamps(stampAccount.id, order.id, 1, stampKey);
    }
  }

  void idempotencyBase;

  return { ...order, status: GbOrderStatus.CONFIRMED };
}

// ─── Update Order Status ──────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  newStatus: GbOrderStatus,
  changedBy: string,
  note?: string
): Promise<OrderDto> {
  const order = await orderRepo.findById(orderId);
  if (!order) throw new Error("주문을 찾을 수 없습니다");

  if (!canTransition(order.status, newStatus)) {
    throw new Error(`${order.status} → ${newStatus} 상태 변경은 허용되지 않습니다`);
  }

  const updated = await orderRepo.updateStatus(orderId, newStatus, changedBy, note);

  // Refund points on cancellation (after CONFIRMED = earned)
  if (newStatus === GbOrderStatus.CANCELLED && order.pointEarned > 0 && order.customerId) {
    const pointAccount = await pointRepo.findOrCreateAccount(order.customerId);
    const refundKey = `refund_earn_${orderId}`;
    const alreadyRefunded = await pointRepo.checkIdempotency(refundKey);
    if (!alreadyRefunded) {
      await pointRepo.refundPoints(pointAccount.id, orderId, order.pointEarned, refundKey);
    }
  }

  return updated;
}
