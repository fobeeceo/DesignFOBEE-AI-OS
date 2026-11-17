import { describe, it, expect } from "vitest";
import { isWithinOperatingHours, todayHoursLabel } from "./storeHours";

const week = (over: Record<string, unknown> = {}) => {
  const day = { open: "09:00", close: "21:00", closed: false };
  return { mon: day, tue: day, wed: day, thu: day, fri: day, sat: day, sun: { open: "10:00", close: "21:00", closed: false }, ...over };
};
// 2026-11-17 은 화요일. UTC 시각 = KST - 9시간
const kst = (iso: string) => new Date(`${iso}+09:00`);

describe("isWithinOperatingHours (Korea time)", () => {
  it("is open between opening and closing time, closed outside", () => {
    expect(isWithinOperatingHours(week(), kst("2026-11-17T08:59:00"))).toBe(false);
    expect(isWithinOperatingHours(week(), kst("2026-11-17T09:00:00"))).toBe(true);
    expect(isWithinOperatingHours(week(), kst("2026-11-17T20:59:00"))).toBe(true);
    expect(isWithinOperatingHours(week(), kst("2026-11-17T21:00:00"))).toBe(false);
    expect(isWithinOperatingHours(week(), kst("2026-11-17T23:30:00"))).toBe(false);
  });

  it("uses Korea time even if the server clock is in another zone (just after midnight KST is still the previous UTC day)", () => {
    expect(isWithinOperatingHours(week(), kst("2026-11-18T00:10:00"))).toBe(false);
    expect(isWithinOperatingHours(week(), kst("2026-11-18T09:30:00"))).toBe(true);
  });

  it("uses the opening time of that weekday", () => {
    expect(isWithinOperatingHours(week(), kst("2026-11-22T09:30:00"))).toBe(false); // 일요일은 10시 오픈
    expect(isWithinOperatingHours(week(), kst("2026-11-22T10:30:00"))).toBe(true);
  });

  it("is closed on a closed day", () => {
    expect(isWithinOperatingHours(week({ tue: { open: "09:00", close: "21:00", closed: true } }), kst("2026-11-17T12:00:00"))).toBe(false);
  });

  it("handles shops that close after midnight", () => {
    const late = week({ tue: { open: "18:00", close: "02:00", closed: false } });
    expect(isWithinOperatingHours(late, kst("2026-11-17T23:00:00"))).toBe(true);
    expect(isWithinOperatingHours(late, kst("2026-11-17T01:00:00"))).toBe(true);
    expect(isWithinOperatingHours(late, kst("2026-11-17T12:00:00"))).toBe(false);
  });

  it("does not block when there is no usable opening-hours data", () => {
    for (const hours of [null, undefined, {}, "x", { tue: null }, { tue: { open: "??", close: "21:00" } }]) {
      expect(isWithinOperatingHours(hours, kst("2026-11-17T03:00:00"))).toBe(true);
    }
  });
});

describe("todayHoursLabel", () => {
  it("shows today's hours, 휴무 (callers add the \"오늘\" prefix), or nothing", () => {
    expect(todayHoursLabel(week(), kst("2026-11-17T12:00:00"))).toBe("09:00 ~ 21:00");
    expect(todayHoursLabel(week(), kst("2026-11-22T12:00:00"))).toBe("10:00 ~ 21:00");
    expect(todayHoursLabel(week({ tue: { closed: true } }), kst("2026-11-17T12:00:00"))).toBe("휴무");
    expect(todayHoursLabel(null)).toBeNull();
  });
});
