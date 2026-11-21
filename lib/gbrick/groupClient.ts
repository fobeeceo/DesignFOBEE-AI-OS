// 함께오더 — 브라우저 쪽 보관 (이 기기에서 내가 방장인지, 내 참여자 번호는 무엇인지).
// 비밀값은 이 기기의 localStorage 에만 두고 링크에는 넣지 않는다. 저장소를 못 쓰는 환경에서도 화면은 깨지지 않는다.

export interface GroupLocal {
  hostSecret?: string; // 방장일 때만
  pid?: string;        // 내 메뉴를 올린 뒤에 생긴다
  secret?: string;
}

const key = (code: string) => `gbrick_group_${code}`;
const NAME_KEY = "gbrick_group_name";
const MODE_KEY = "gbrick_group_mode"; // sessionStorage — 지금 "함께오더에 담는 중"인 방

export function loadGroupLocal(code: string): GroupLocal {
  try { return JSON.parse(localStorage.getItem(key(code)) ?? "{}") as GroupLocal; } catch { return {}; }
}
export function saveGroupLocal(code: string, patch: GroupLocal) {
  try { localStorage.setItem(key(code), JSON.stringify({ ...loadGroupLocal(code), ...patch })); } catch { /* 저장 불가 */ }
}

export function loadGroupName(): string {
  try { return localStorage.getItem(NAME_KEY) ?? ""; } catch { return ""; }
}
export function saveGroupName(name: string) {
  try { localStorage.setItem(NAME_KEY, name); } catch { /* 저장 불가 */ }
}

export function getGroupMode(): string | null {
  try { return sessionStorage.getItem(MODE_KEY); } catch { return null; }
}
export function setGroupMode(code: string | null) {
  try { code ? sessionStorage.setItem(MODE_KEY, code) : sessionStorage.removeItem(MODE_KEY); } catch { /* 저장 불가 */ }
}
