import { describe, it, expect } from "vitest";
import { calcPointEarn, calcPointExpiry, validatePointRedeem } from "./pointPolicy";

describe("calcPointEarn", () => {
  it("3% rate on 10000 = 300", () => {
    expect(calcPointEarn(10000, 0.03)).toBe(300);
  });
  it("3% rate on 1500 = 45 (floored)", () => {
    expect(calcPointEarn(1500, 0.03)).toBe(45);
  });
  it("0 amount = 0 (below minimum)", () => {
    expect(calcPointEarn(0, 0.03)).toBe(0);
  });
  it("default rate is 2%", () => {
    expect(calcPointEarn(10000)).toBe(200);
  });
});

describe("calcPointExpiry", () => {
  it("returns date ~10 years from now", () => {
    const expiry = calcPointExpiry();
    const diff = expiry.getTime() - Date.now();
    expect(diff).toBeGreaterThan(3649 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(3651 * 24 * 60 * 60 * 1000);
  });
});

describe("validatePointRedeem", () => {
  it("returns error if balance < requested", () => {
    const result = validatePointRedeem(100, 500, 10000);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("부족");
  });
  it("returns error if redeem > order amount", () => {
    const result = validatePointRedeem(20000, 15000, 10000);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
  it("returns valid when balance >= requested", () => {
    const result = validatePointRedeem(5000, 3000, 10000);
    expect(result.valid).toBe(true);
  });
  it("returns valid at exact balance", () => {
    const result = validatePointRedeem(5000, 5000, 10000);
    expect(result.valid).toBe(true);
  });
});
