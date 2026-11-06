import { couponRepo } from "@/lib/gbrick/repositories";
import type { CouponDto, CouponIssueDto } from "@/lib/gbrick/repositories/types";

export async function getCustomerCoupons(customerId: string): Promise<CouponIssueDto[]> {
  return couponRepo.findCustomerCoupons(customerId);
}

export async function issueWelcomeCoupon(customerId: string): Promise<CouponIssueDto> {
  const coupon = await couponRepo.findByCode("WELCOME2024");
  if (!coupon) throw new Error("웰컴 쿠폰을 찾을 수 없습니다");
  const existing = await couponRepo.findCustomerCoupons(customerId);
  const alreadyIssued = existing.some((i) => i.couponId === coupon.id);
  if (alreadyIssued) throw new Error("이미 발급된 쿠폰입니다");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  return couponRepo.issueToCustomer(coupon.id, customerId, expiresAt);
}

export async function validateCoupon(couponIssueId: string, orderAmount: number): Promise<{ discount: number; issue: CouponIssueDto }> {
  const issue = await couponRepo.findIssueById(couponIssueId);
  if (!issue) throw new Error("쿠폰 발급 내역을 찾을 수 없습니다");
  if (issue.redeemed) throw new Error("이미 사용된 쿠폰입니다");
  const now = new Date();
  if (issue.expiresAt && issue.expiresAt < now) throw new Error("만료된 쿠폰입니다");
  const { coupon } = issue;
  if (coupon.validUntil < now) throw new Error("만료된 쿠폰입니다");
  if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
    throw new Error(`최소 주문 금액은 ${coupon.minOrderAmount.toLocaleString()}원입니다`);
  }
  let discount = 0;
  if (coupon.type === "DISCOUNT_AMOUNT") discount = coupon.discountAmount ?? 0;
  else if (coupon.type === "DISCOUNT_RATE" && coupon.discountRate) {
    discount = Math.floor(orderAmount * coupon.discountRate);
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  }
  return { discount, issue };
}

export async function redeemCoupon(issueId: string, orderId: string, discountApplied: number): Promise<void> {
  return couponRepo.redeemCoupon(issueId, orderId, discountApplied);
}
