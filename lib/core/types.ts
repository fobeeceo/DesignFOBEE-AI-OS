/**
 * AI HQ Core — 앱 전역에서 쓰는 최소 공통 타입. 도메인 타입(ERP 등)은 각 도메인의
 * lib/<domain>/types.ts에 둔다(예: lib/hq/types.ts) — Core에는 도메인에 묶이지 않는 것만.
 */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };
