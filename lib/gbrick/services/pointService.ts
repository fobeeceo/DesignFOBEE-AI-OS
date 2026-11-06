import { pointRepo } from "@/lib/gbrick/repositories";
import { validatePointRedeem } from "@/lib/gbrick/pointPolicy";
import type { PointAccountDto, PointLedgerDto } from "@/lib/gbrick/repositories/types";

export async function getPointAccount(customerId: string): Promise<PointAccountDto> {
  return pointRepo.findOrCreateAccount(customerId);
}

export async function getPointBalance(customerId: string): Promise<number> {
  return pointRepo.getBalance(customerId);
}

export async function getPointHistory(customerId: string, limit = 20): Promise<PointLedgerDto[]> {
  return pointRepo.getLedgers(customerId, limit);
}

export async function earnPoints(
  customerId: string,
  orderId: string,
  orderAmount: number,
  pointRate: number,
  idempotencyKey: string
): Promise<PointLedgerDto> {
  const account = await pointRepo.findOrCreateAccount(customerId);
  const amount = Math.floor(orderAmount * pointRate);
  if (amount <= 0) throw new Error("적립 포인트가 없습니다");
  return pointRepo.earnPoints(account.id, orderId, amount, idempotencyKey);
}

export async function redeemPoints(
  customerId: string,
  orderId: string,
  amount: number,
  orderAmount: number,
  idempotencyKey: string
): Promise<PointLedgerDto> {
  const balance = await pointRepo.getBalance(customerId);
  validatePointRedeem(balance, amount, orderAmount);
  const account = await pointRepo.findOrCreateAccount(customerId);
  return pointRepo.redeemPoints(account.id, orderId, amount, idempotencyKey);
}
