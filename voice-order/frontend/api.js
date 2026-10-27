// 화면 → 주문 엔진 호출. 매장 서버에서는 HTTP(/api/...), 웹 체험판에서는 브라우저 안의 엔진(web-demo.js)으로 간다.
// 휴대폰 인터넷이 잠깐 끊겨도 화면이 멈춰 있지 않게: 이 시간 안에 답이 없으면 실패로 보고 다음 안내로 간다
// (AI 바리스타 7초 + 여유. 주문 접수는 같은 키로 다시 보내도 하나만 생기므로 안전)
export const API_TIMEOUT_MS = 12000;

export async function api(path, body) {
  if (window.__voiceOrderApi) return window.__voiceOrderApi(path, body);
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), API_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
    });
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'timeout' : 'network');
  } finally {
    clearTimeout(t);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
