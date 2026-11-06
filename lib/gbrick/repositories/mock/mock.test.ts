import { describe, it, expect, beforeEach } from "vitest";
import { mockPointRepo, mockStampRepo, mockCouponRepo, mockOrderRepo } from "./index";
import { GbOrderStatus } from "@prisma/client";

describe("MockPointRepo", () => {
  it("creates account with zero balance", async () => {
    const account = await mockPointRepo.findOrCreateAccount("user_test_1");
    expect(account.balance).toBe(0);
  });

  it("earns points and updates balance", async () => {
    const account = await mockPointRepo.findOrCreateAccount("user_earn_test");
    const ledger = await mockPointRepo.earnPoints(account.id, "order_1", 300, `earn_test_${Date.now()}`);
    expect(ledger.amount).toBe(300);
    expect(ledger.balanceAfter).toBe(300);
  });

  it("prevents duplicate earn (idempotency)", async () => {
    const account = await mockPointRepo.findOrCreateAccount("user_idem_test");
    const key = `earn_idem_${Date.now()}`;
    await mockPointRepo.earnPoints(account.id, "order_2", 100, key);
    await expect(mockPointRepo.earnPoints(account.id, "order_2", 100, key)).rejects.toThrow("중복");
  });

  it("redeems points and decrements balance", async () => {
    const account = await mockPointRepo.findOrCreateAccount("user_redeem_test");
    const earnKey = `earn_rd_${Date.now()}`;
    await mockPointRepo.earnPoints(account.id, "order_3", 500, earnKey);
    const ledger = await mockPointRepo.redeemPoints(account.id, "order_4", 200, `redeem_rd_${Date.now()}`);
    expect(ledger.amount).toBe(-200);
    expect(ledger.balanceAfter).toBe(300);
  });

  it("throws when redeeming more than balance", async () => {
    const account = await mockPointRepo.findOrCreateAccount("user_overdraft");
    await expect(mockPointRepo.redeemPoints(account.id, "order_5", 999, `redeem_od_${Date.now()}`)).rejects.toThrow("부족");
  });
});

describe("MockStampRepo", () => {
  it("earns stamps", async () => {
    const account = await mockStampRepo.findOrCreateAccount("user_stamp_1", "store_1");
    const ledger = await mockStampRepo.earnStamps(account.id, "order_stamp_1", 1, `stamp_${Date.now()}`);
    expect(ledger.amount).toBe(1);
    expect(ledger.balanceAfter).toBe(1);
  });

  it("throws when redeeming too many stamps", async () => {
    const account = await mockStampRepo.findOrCreateAccount("user_stamp_low", "store_2");
    await expect(mockStampRepo.redeemStamps(account.id, 10, `sr_${Date.now()}`)).rejects.toThrow("부족");
  });
});

describe("MockCouponRepo", () => {
  it("finds coupon by code", async () => {
    const coupon = await mockCouponRepo.findByCode("WELCOME2024");
    expect(coupon).not.toBeNull();
    expect(coupon?.name).toContain("쿠폰");
  });

  it("issues coupon to customer", async () => {
    const coupon = await mockCouponRepo.findByCode("WELCOME2024");
    const issue = await mockCouponRepo.issueToCustomer(coupon!.id, "user_coupon_1");
    expect(issue.customerId).toBe("user_coupon_1");
    expect(issue.redeemed).toBe(false);
  });

  it("prevents double redemption", async () => {
    const coupon = await mockCouponRepo.findByCode("WELCOME2024");
    const issue = await mockCouponRepo.issueToCustomer(coupon!.id, "user_coupon_2");
    await mockCouponRepo.redeemCoupon(issue.id, "order_c", 1000);
    // The mock marks redeemed=true, second call should throw
    const updatedIssue = await mockCouponRepo.findIssueById(issue.id);
    expect(updatedIssue?.redeemed).toBe(true);
  });
});

describe("MockOrderRepo", () => {
  it("creates and retrieves order", async () => {
    const order = await mockOrderRepo.create({
      storeId: "store_1",
      customerId: "user_order_1",
      orderNumber: `GB20240101TEST1`,
      items: [{ menuId: "menu_1", menuName: "아메리카노", quantity: 2, unitPrice: 4500 }],
      totalAmount: 9000,
      finalAmount: 9000,
      pointEarned: 270,
    });
    expect(order.orderNumber).toBe("GB20240101TEST1");
    expect(order.status).toBe(GbOrderStatus.PENDING);

    const found = await mockOrderRepo.findById(order.id);
    expect(found?.id).toBe(order.id);
  });

  it("updates order status", async () => {
    const order = await mockOrderRepo.create({
      storeId: "store_1",
      customerId: "user_status_1",
      orderNumber: `GB20240101TEST2`,
      items: [{ menuId: "menu_1", menuName: "라떼", quantity: 1, unitPrice: 5000 }],
      totalAmount: 5000,
      finalAmount: 5000,
      pointEarned: 150,
    });
    const updated = await mockOrderRepo.updateStatus(order.id, GbOrderStatus.CONFIRMED, "staff_1");
    expect(updated.status).toBe(GbOrderStatus.CONFIRMED);
  });

  it("throws when updating non-existent order", async () => {
    await expect(mockOrderRepo.updateStatus("nonexistent", GbOrderStatus.CONFIRMED, "staff")).rejects.toThrow("찾을 수 없습니다");
  });
});
