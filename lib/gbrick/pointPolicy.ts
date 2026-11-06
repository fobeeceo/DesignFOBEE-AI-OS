import { POINT_DEFAULTS } from "./constants";

export function calcPointEarn(
  orderAmount: number,
  rate: number = POINT_DEFAULTS.rate
): number {
  if (orderAmount < POINT_DEFAULTS.minEarnAmount) return 0;
  const earned = Math.floor(orderAmount * rate);
  return Math.min(earned, POINT_DEFAULTS.maxEarnPerOrder);
}

export function calcPointExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + POINT_DEFAULTS.expiryDays);
  return d;
}

export function validatePointRedeem(
  balance: number,
  requested: number,
  orderAmount: number
): { valid: boolean; error?: string } {
  if (requested <= 0) return { valid: false, error: "포인트는 1원 이상이어야 합니다" };
  if (requested > balance) return { valid: false, error: "잔여 포인트가 부족합니다" };
  if (requested > orderAmount) return { valid: false, error: "주문금액을 초과할 수 없습니다" };
  return { valid: true };
}
