// 매장 영업시간 판정 — 항상 한국 시간(KST) 기준. 서버와 고객 앱이 같은 규칙을 쓴다.

export interface DayHours { open?: string; close?: string; closed?: boolean }

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function kstParts(now: Date): { day: (typeof DAYS)[number]; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  const day = get("weekday").toLowerCase().slice(0, 3) as (typeof DAYS)[number];
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const toMinutes = (hhmm: string | undefined): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

function todayHours(hours: unknown, now: Date): DayHours | null {
  if (!hours || typeof hours !== "object") return null;
  const entry = (hours as Record<string, unknown>)[kstParts(now).day];
  return entry && typeof entry === "object" ? (entry as DayHours) : null;
}

/** 지금 주문을 받을 수 있는 시간인가. 영업시간 정보가 없으면 막지 않는다. */
export function isWithinOperatingHours(hours: unknown, now = new Date()): boolean {
  const today = todayHours(hours, now);
  if (!today) return true;
  if (today.closed) return false;
  const open = toMinutes(today.open);
  const close = toMinutes(today.close);
  if (open === null || close === null) return true;
  const { minutes } = kstParts(now);
  return close > open ? minutes >= open && minutes < close : minutes >= open || minutes < close; // close <= open: 자정을 넘기는 영업
}

/** 오늘 영업시간 안내 문구("09:00 ~ 21:00" 또는 "휴무"). 호출하는 쪽에서 "오늘 "을 붙인다. 정보가 없으면 null */
export function todayHoursLabel(hours: unknown, now = new Date()): string | null {
  const today = todayHours(hours, now);
  if (!today) return null;
  if (today.closed) return "휴무";
  return today.open && today.close ? `${today.open} ~ ${today.close}` : null;
}
