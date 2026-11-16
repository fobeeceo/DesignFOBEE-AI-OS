// 한국 시간(KST) 기준 오늘 0시를 UTC ISO 문자열로 반환
export function kstDayStartIso(now = new Date()): string {
  const KST = 9 * 60 * 60 * 1000;
  const k = new Date(now.getTime() + KST);
  return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()) - KST).toISOString();
}
