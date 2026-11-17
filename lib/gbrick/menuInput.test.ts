import { describe, it, expect } from "vitest";
import { cleanName, cleanPrice, cleanSortOrder } from "./menuInput";

describe("menu input validation", () => {
  it("trims names and rejects empty, too long or non-text values", () => {
    expect(cleanName("  바닐라 라떼 ")).toBe("바닐라 라떼");
    expect(cleanName("   ")).toBeNull();
    expect(cleanName("가".repeat(51))).toBeNull();
    expect(cleanName(123)).toBeNull();
  });

  it("accepts only whole, non-negative prices within range", () => {
    expect(cleanPrice(0)).toBe(0);
    expect(cleanPrice(3900)).toBe(3900);
    expect(cleanPrice(-100)).toBeNull();
    expect(cleanPrice(0.5)).toBeNull();
    expect(cleanPrice("3900")).toBeNull();
    expect(cleanPrice(1_000_001)).toBeNull();
    expect(cleanPrice(NaN)).toBeNull();
  });

  it("accepts sort positions starting at 0", () => {
    expect(cleanSortOrder(0)).toBe(0);
    expect(cleanSortOrder(12)).toBe(12);
    expect(cleanSortOrder(-1)).toBeNull();
    expect(cleanSortOrder(1.5)).toBeNull();
  });
});
