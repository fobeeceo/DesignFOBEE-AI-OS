// 화면 → 주문 엔진 호출. 매장 서버에서는 HTTP(/api/...), 웹 체험판에서는 브라우저 안의 엔진(web-demo.js)으로 간다.
export async function api(path, body) {
  if (window.__voiceOrderApi) return window.__voiceOrderApi(path, body);
  const res = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
