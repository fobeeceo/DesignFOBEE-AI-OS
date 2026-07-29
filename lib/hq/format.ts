/**
 * HQ 표시(Presentation) 레이어 — 화면에 보여줄 문자열 포맷팅만 담당한다.
 * 데이터(erpSnapshot.ts)·계산(kpi.ts)과 분리해, 표시 형식만 바뀔 때 이 파일만 고치면 된다.
 */
export const won = (n: number) => n.toLocaleString("ko-KR") + "원";
