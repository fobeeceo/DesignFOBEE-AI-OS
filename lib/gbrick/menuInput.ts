// 사장님 앱에서 들어오는 메뉴·카테고리·옵션 수정값 검증 (서버 전용)

export function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length >= 1 && name.length <= 50 ? name : null;
}

export function cleanPrice(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1_000_000 ? value : null;
}

export function cleanSortOrder(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100_000 ? value : null;
}
