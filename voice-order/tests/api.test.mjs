// HTTP API 통합 테스트 — 실제 서버 핸들러를 임시 포트로 띄운다.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHandler, loadMenu } from '../server.mjs';
import { createOrderService } from '../backend/orderService.mjs';
import { createMemoryStore } from '../backend/store.mjs';
import { createBrowserPrintProvider } from '../backend/print/printService.mjs';

let server;
let base;

test.before(async () => {
  const service = createOrderService({ store: createMemoryStore(), menu: loadMenu(), printProvider: createBrowserPrintProvider() });
  server = http.createServer(createHandler(service));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

async function call(path, body) {
  const res = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, data: res.headers.get('content-type').includes('json') ? await res.json() : await res.text() };
}

test('정적 화면·메뉴 제공', async () => {
  const home = await call('/');
  assert.equal(home.status, 200);
  assert.match(home.data, /말씀만 해주세요/);
  assert.match((await call('/dashboard')).data, /DEMO \/ TEST DATA/);
  assert.equal((await call('/core/parser.mjs')).status, 200);
  assert.equal((await call('/../server.mjs')).status, 404);
  const menu = await call('/api/menu');
  assert.equal(menu.data.items.length, 54);
});

test('텍스트 주문 전체 흐름: 세션 → 분석 → 가격 → 확정 → 출력 → 통계', async () => {
  const s = (await call('/api/sessions', { input_type: 'TEXT' })).data;
  const parsed = (await call(`/api/sessions/${s.id}/parse`, { text: '아이스 아메리카노 하나하고 아이스 라떼 하나' })).data;
  assert.equal(parsed.kind, 'ok');
  const q = (await call('/api/quote', { items: parsed.items })).data;
  assert.equal(q.total_amount, 7900);
  const order = (await call(`/api/sessions/${s.id}/confirm`, { items: parsed.items })).data;
  assert.match(order.order_id, /^GB-\d{8}-001$/);
  assert.equal(order.payment_status, 'PAY_AT_COUNTER');
  const printed = (await call(`/api/orders/${order.order_id}/print`, {})).data;
  assert.ok(printed.html.includes('합계: 7,900원'));
  await call(`/api/orders/${order.order_id}/print-result`, { ok: true });
  const st = (await call('/api/stats')).data;
  assert.equal(st.demo, true);
  assert.equal(st.completed, 1);
  assert.equal(st.text, 1);
  assert.equal(st.recent[0].print_status, 'PRINTED');
});

test('오류는 고객 탓 없는 문구 + 올바른 상태 코드', async () => {
  assert.equal((await call('/api/sessions/nope/parse', { text: '라떼' })).status, 404);
  assert.equal((await call('/api/quote', { items: [] })).status, 400);
  const bad = await fetch(base + '/api/quote', { method: 'POST', body: '{' });
  assert.equal(bad.status, 400);
  const help = (await call('/api/help', {})).data;
  assert.equal(help.help_requested, true);
});
