import { describe, it, expect } from "vitest";
import { canTransition } from "./orderService";
import { GbOrderStatus } from "@prisma/client";

describe("Order State Machine", () => {
  it("PENDING → CONFIRMED allowed", () => {
    expect(canTransition(GbOrderStatus.PENDING, GbOrderStatus.CONFIRMED)).toBe(true);
  });
  it("PENDING → CANCELLED allowed", () => {
    expect(canTransition(GbOrderStatus.PENDING, GbOrderStatus.CANCELLED)).toBe(true);
  });
  it("CONFIRMED → PREPARING allowed", () => {
    expect(canTransition(GbOrderStatus.CONFIRMED, GbOrderStatus.PREPARING)).toBe(true);
  });
  it("PREPARING → READY allowed", () => {
    expect(canTransition(GbOrderStatus.PREPARING, GbOrderStatus.READY)).toBe(true);
  });
  it("READY → PICKED_UP allowed", () => {
    expect(canTransition(GbOrderStatus.READY, GbOrderStatus.PICKED_UP)).toBe(true);
  });
  it("PICKED_UP → CANCELLED not allowed", () => {
    expect(canTransition(GbOrderStatus.PICKED_UP, GbOrderStatus.CANCELLED)).toBe(false);
  });
  it("CANCELLED → CONFIRMED not allowed", () => {
    expect(canTransition(GbOrderStatus.CANCELLED, GbOrderStatus.CONFIRMED)).toBe(false);
  });
  it("PENDING → PICKED_UP not allowed (skip steps)", () => {
    expect(canTransition(GbOrderStatus.PENDING, GbOrderStatus.PICKED_UP)).toBe(false);
  });
  it("READY → PENDING not allowed (backward)", () => {
    expect(canTransition(GbOrderStatus.READY, GbOrderStatus.PENDING)).toBe(false);
  });
});
