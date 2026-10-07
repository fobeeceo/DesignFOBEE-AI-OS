// STORE MODE(지브릭 본점 파일럿 v0.2) 테스트 — 지시서 §25 TEST 01~12
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createHandler, createStoreContext, loadMenu } from '../server.mjs';
import { createOrderService } from '../backend/orderService.mjs';
import { createMemoryStore } from '../backend/store.mjs';
import { createBrowserPrintProvider } from '../backend/print/printService.mjs';
import { nextQuestion, applyAnswer, interpretAnswer } from '../core/dialog.mjs';

const menu = loadMenu();
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'vo-store-'));

async function startServer({ env = {}, staffKey } = {}) {
  const dir = tmp();
  const storeCtx = createStoreContext({ menu, getKnowledge: () => ({}), dir, env });
  const demo = createOrderService({ store: createMemoryStore(), menu, printProvider: createBrowserPrintProvider() });
  const server = http.createServer(createHandler(demo, { storeCtx, staffKey: staffKey ?? env.STORE_STAFF_KEY ?? '' }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (p, body, headers = {}) => {
    const res = await fetch(base + p, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data };
  };
  return { server, base, call, dir, storeCtx, close: () => new Promise((r) => server.close(r)) };
}

const S = '/api/store/GBRICK_MAIN';
let n = 0;
const key = () => `test-key-${Date.now()}-${++n}`;

/** 손님 한 명의 대화 → 확인 → 주문 */
async function order(call, text, answers = [], extra = {}) {
  const sess = (await call(`${S}/sessions`, { input_type: 'VOICE' })).data;
  const parsed = (await call(`${S}/sessions/${sess.id}/parse`, { text })).data;
  let items = parsed.items;
  let clar = 0;
  for (const a of answers) {
    const q = nextQuestion(items, menu);
    clar += 1;
    items = applyAnswer(items, q, a, menu);
  }
  const res = await call(`${S}/orders`, { session_id: sess.id, items, dining: 'DINE_IN', order_source: 'VOICE', idempotency_key: key(), clarification_count: clar, ...extra });
  return { sess, parsed, res };
}

test('TEST 01 정상 음성 주문: "아메리카노 한 잔 주세요" → (온도 확인) → 주문 생성', async () => {
  const t = await startServer();
  try {
    const { parsed, res } = await order(t.call, '아메리카노 한 잔 주세요.', ['HOT']);
    assert.equal(parsed.kind, 'clarify', '온도를 말하지 않았으므로 추측하지 않고 묻는다');
    assert.equal(res.status, 201);
    assert.equal(res.data.status, 'NEW');
    assert.equal(res.data.store_id, 'GBRICK_MAIN');
    assert.deepEqual(res.data.items.map((i) => [i.menu_id, i.options.temperature, i.quantity, i.unit_price, i.amount]), [['AMERICANO', 'HOT', 1, 3500, 3500]]);
    assert.equal(res.data.payment_status, 'PAY_AT_COUNTER');
    // "아이스 아메리카노 두 잔" / "따뜻한 라떼 하나"는 바로 이해
    const ice = (await order(t.call, '아이스 아메리카노 두 잔 주세요.')).res.data;
    assert.deepEqual(ice.items.map((i) => [i.menu_id, i.options.temperature, i.quantity]), [['AMERICANO', 'ICE', 2]]);
    const latte = (await order(t.call, '따뜻한 라떼 하나 주세요.')).res.data;
    assert.deepEqual(latte.items.map((i) => [i.menu_id, i.options.temperature]), [['CAFE_LATTE', 'HOT']]);
  } finally {
    await t.close();
  }
});

test('TEST 02 HOT/ICE 확인 질문: "라떼 주세요"', async () => {
  const t = await startServer();
  try {
    const sess = (await t.call(`${S}/sessions`, { input_type: 'VOICE' })).data;
    const p = (await t.call(`${S}/sessions/${sess.id}/parse`, { text: '라떼 주세요.' })).data;
    const q = nextQuestion(p.items, menu);
    assert.equal(q.type, 'choose_temperature');
    assert.equal(q.text, '카페라떼는 따뜻한 것과 차가운 것 중 어떤 걸로 드릴까요?');
    assert.equal(interpretAnswer('따뜻한 걸로'), 'HOT');
  } finally {
    await t.close();
  }
});

test('TEST 03 없는 메뉴 → 메뉴 없음 안내 (메뉴·가격을 만들어내지 않음)', async () => {
  const t = await startServer();
  try {
    const sess = (await t.call(`${S}/sessions`, { input_type: 'VOICE' })).data;
    const p = (await t.call(`${S}/sessions/${sess.id}/parse`, { text: '아인슈페너 주세요.' })).data;
    assert.equal(p.kind, 'not_found');
    assert.equal(p.items.length, 0);
    // 서버도 메뉴에 없는 id·임의 가격을 받지 않는다
    const bad = await t.call(`${S}/orders`, { session_id: sess.id, items: [{ menu_id: 'EINSPANNER', quantity: 1 }], dining: 'DINE_IN', idempotency_key: key() });
    assert.equal(bad.status, 400);
    const forged = await t.call(`${S}/orders`, {
      items: [{ menu_id: 'AMERICANO', temperature: 'ICE', quantity: 1, unit_price: 100, amount: 100 }], dining: 'DINE_IN', idempotency_key: key(),
    });
    assert.equal(forged.data.total_amount, 3500, '클라이언트가 보낸 금액은 무시');
    // 사실 확인: 지시서 예시의 '딸기라떼'는 승인 메뉴판(10/1)에 있는 메뉴(아이스 4,900원)다
    const s2 = (await t.call(`${S}/sessions`, { input_type: 'VOICE' })).data;
    const berry = (await t.call(`${S}/sessions/${s2.id}/parse`, { text: '딸기라떼 주세요.' })).data;
    assert.deepEqual(berry.items.map((i) => [i.menu_id, i.temperature]), [['STRAWBERRY_LATTE', 'ICE']]);
  } finally {
    await t.close();
  }
});

test('TEST 04 주문 수정: "아니요" → 다시 말하기', () => {
  assert.equal(interpretAnswer('아니요'), 'no');
  const items = [{ menu_id: 'AMERICANO', name: '아메리카노', temperature: null, quantity: 1, needs_confirm: true }];
  const q = nextQuestion(items, menu);
  assert.equal(applyAnswer(items, q, 'no', menu), null, 'null이면 화면이 처음부터 다시 듣는다');
});

test('TEST 05 주문 확정 → ORDER·ORDER_ITEM·ORDER_EVENT·VOICE_LOG 생성, 세션 닫힘', async () => {
  const t = await startServer();
  try {
    const { sess, res } = await order(t.call, '아이스 아메리카노 하나하고 라떼 하나', ['HOT']);
    const o = res.data;
    assert.match(o.order_id, /^ord_/);
    assert.equal(o.total_amount, 3500 + 4400);
    assert.equal(o.clarification_count, 1);
    assert.ok(o.customer_confirmed_at);
    const db = t.storeCtx.orders.all();
    assert.deepEqual(db.events.filter((e) => e.order_id === o.order_id).map((e) => [e.status, e.actor]), [['NEW', 'customer']]);
    const logs = db.voice_logs.filter((v) => v.order_id === o.order_id);
    assert.equal(logs.length, 1);
    assert.equal(logs[0].recognized_text, '아이스 아메리카노 하나하고 라떼 하나');
    assert.equal(t.storeCtx.sessions.get(sess.id).status, 'CONFIRMED');
    // 개인정보·결제정보 필드가 없다
    assert.ok(!JSON.stringify(db).match(/phone|card_no|customer_name/));
  } finally {
    await t.close();
  }
});

test('TEST 06 주문번호: 동시 주문 50건도 중복 없음, 영업일마다 001부터', async () => {
  const t = await startServer();
  try {
    const res = await Promise.all(
      Array.from({ length: 50 }, () => t.call(`${S}/orders`, { items: [{ menu_id: 'ESPRESSO', temperature: 'HOT', quantity: 1 }], dining: 'DINE_IN', idempotency_key: key() })),
    );
    const nums = res.map((r) => r.data.order_number);
    assert.equal(new Set(nums).size, 50);
    assert.deepEqual([...nums].sort(), Array.from({ length: 50 }, (_, i) => `T${String(i + 1).padStart(3, '0')}`));
  } finally {
    await t.close();
  }
  // 날짜가 바뀌면 다시 001 (한국시간 자정 기준)
  const { createStoreOrders } = await import('../backend/storeOrders.mjs');
  const { createMemoryDb } = await import('../backend/store.mjs');
  let clock = new Date('2026-10-03T14:59:00Z'); // KST 23:59
  const o = createStoreOrders({ db: createMemoryDb(), menu, stores: [{ store_id: 'GBRICK_MAIN', name: '본점', order_prefix: 'A' }], mode: 'production', now: () => clock });
  const mk = () => o.create({ store_id: 'GBRICK_MAIN', items: [{ menu_id: 'ESPRESSO', temperature: 'HOT', quantity: 1 }], dining: 'DINE_IN', idempotency_key: key() }).order_number;
  assert.equal(mk(), 'A001');
  assert.equal(mk(), 'A002');
  clock = new Date('2026-10-03T15:00:30Z'); // KST 10/04 00:00
  assert.equal(mk(), 'A001');
});

test('TEST 07 카운터 전달: 주문이 카운터 화면 데이터에 바로 나타난다', async () => {
  const t = await startServer();
  try {
    const o = (await order(t.call, '아이스 아메리카노 하나')).res.data;
    const c = (await t.call(`${S}/counter`)).data;
    assert.equal(c.store.name, 'GBRICK Coffee 본점');
    assert.deepEqual(c.active.map((x) => x.order_number), [o.order_number]);
    const page = await fetch(`${t.base}/counter/GBRICK_MAIN`).then((r) => r.text());
    assert.match(page, /data-store-id="GBRICK_MAIN"/);
    assert.equal((await fetch(`${t.base}/counter/NO_SUCH_STORE`)).status, 404);
  } finally {
    await t.close();
  }
});

test('TEST 08 직원 도움 요청 → HELP_REQUEST 생성 → 카운터 표시 → 확인하면 RESOLVED', async () => {
  const t = await startServer();
  try {
    const sess = (await t.call(`${S}/sessions`, { input_type: 'VOICE' })).data;
    const h = (await t.call(`${S}/help`, { session_id: sess.id })).data;
    assert.equal(h.status, 'OPEN');
    const again = (await t.call(`${S}/help`, { session_id: sess.id })).data;
    assert.equal(again.request_id, h.request_id, '같은 손님이 여러 번 눌러도 알림은 하나');
    assert.deepEqual((await t.call(`${S}/counter`)).data.help.map((x) => x.request_id), [h.request_id]);
    const r = (await t.call(`${S}/help/${h.request_id}/resolve`, { actor: 'counter' })).data;
    assert.equal(r.status, 'RESOLVED');
    assert.equal(r.resolved_by, 'counter');
    assert.ok(r.resolved_at);
    assert.equal((await t.call(`${S}/counter`)).data.help.length, 0);
  } finally {
    await t.close();
  }
});

test('TEST 09 주문 상태 NEW → CONFIRMED → PREPARING → READY → COMPLETED (로그 기록, 잘못된 변경 거절)', async () => {
  const t = await startServer();
  try {
    const o = (await order(t.call, '아이스 아메리카노 하나')).res.data;
    for (const st of ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED']) {
      const r = await t.call(`${S}/orders/${o.order_id}/status`, { status: st });
      assert.equal(r.status, 200, st);
      assert.equal(r.data.status, st);
    }
    assert.deepEqual(t.storeCtx.orders.events(o.order_id).map((e) => e.status), ['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED']);
    assert.equal((await t.call(`${S}/orders/${o.order_id}/status`, { status: 'PREPARING' })).status, 409);
    // 출력: NEW → (CONFIRMED) → PRINTED, 주문서에 주문번호·HOT/ICE·합계·카운터 결제
    const o2 = (await order(t.call, '따뜻한 라떼 하나')).res.data;
    const p = (await t.call(`${S}/orders/${o2.order_id}/print`, {})).data;
    assert.equal(p.order.status, 'PRINTED');
    for (const s of ['GBRICK COFFEE', 'GBRICK Coffee 본점', `주문번호 ${o2.order_number}`, '카페라떼', 'HOT', '합계 4,400원', '결제: 카운터', 'TEST 주문', '주문시간']) {
      assert.ok(p.html.includes(s), `주문서에 "${s}" 없음`);
    }
    const c = (await t.call(`${S}/orders/${o2.order_id}/status`, { status: 'CANCELLED' })).data;
    assert.equal(c.status, 'CANCELLED');
    assert.equal((await t.call(`${S}/orders/${o2.order_id}/print`, {})).status, 409, '취소된 주문은 출력하지 않음');
  } finally {
    await t.close();
  }
});

test('TEST 10 중복 주문 방지: 같은 확인 키로 여러 번 보내도 주문은 하나', async () => {
  const t = await startServer();
  try {
    const k = key();
    const body = { items: [{ menu_id: 'AMERICANO', temperature: 'ICE', quantity: 1 }], dining: 'DINE_IN', idempotency_key: k };
    const res = await Promise.all(Array.from({ length: 10 }, () => t.call(`${S}/orders`, body)));
    assert.equal(new Set(res.map((r) => r.data.order_id)).size, 1);
    assert.equal(res.filter((r) => r.status === 201).length, 1);
    assert.equal(t.storeCtx.orders.all().orders.length, 1);
    assert.equal((await t.call(`${S}/orders`, { ...body, idempotency_key: 'x' })).status, 400, '키가 없거나 짧으면 거절');
  } finally {
    await t.close();
  }
});

test('TEST 11 네트워크·서버 오류: 저장되지 않은 주문은 만들어지지 않고 재전송해도 하나만', async () => {
  const t = await startServer();
  try {
    assert.equal((await t.call(`${S}/health`)).data.ok, true);
    // 잘못된 요청은 실패 응답 + 주문 0건 (화면은 '아직 접수되지 않았습니다'를 보여준다)
    const bad = await fetch(`${t.base}${S}/orders`, { method: 'POST', body: '{' });
    assert.equal(bad.status, 400);
    assert.equal(t.storeCtx.orders.all().orders.length, 0);
    // 응답을 못 받은 손님이 '다시 보내기'를 눌러도 같은 키라 주문은 하나
    const k = key();
    const body = { items: [{ menu_id: 'AMERICANO', temperature: 'HOT', quantity: 1 }], dining: 'DINE_IN', idempotency_key: k };
    await t.call(`${S}/orders`, body);
    const retry = await t.call(`${S}/orders`, body);
    assert.equal(retry.status, 200);
    assert.equal(retry.data.duplicate, true);
    assert.equal(t.storeCtx.orders.all().orders.length, 1);
    // 서버를 다시 켜도 파일에서 주문과 번호가 이어진다
    const again = createStoreContext({ menu, getKnowledge: () => ({}), dir: t.dir, env: {} });
    assert.equal(again.orders.all().orders.length, 1);
    const next = again.orders.create({ store_id: 'GBRICK_MAIN', items: body.items, dining: 'DINE_IN', idempotency_key: key() });
    assert.equal(next.order_number, 'T002');
  } finally {
    await t.close();
  }
});

test('TEST 12 TEST / PRODUCTION 분리: 기본 TEST, PRODUCTION은 환경변수 + 직원 키가 있어야만', async () => {
  const dir = tmp();
  const testCtx = createStoreContext({ menu, dir, env: {} });
  assert.equal(testCtx.mode, 'test');
  assert.throws(() => createStoreContext({ menu, dir, env: { VOICE_ORDER_MODE: 'production' } }), /STORE_STAFF_KEY/);
  assert.throws(() => createStoreContext({ menu, dir, env: { VOICE_ORDER_MODE: 'live' } }), /test 또는 production/);
  const prodCtx = createStoreContext({ menu, dir, env: { VOICE_ORDER_MODE: 'production', STORE_STAFF_KEY: 'pin-1234' } });
  const items = [{ menu_id: 'AMERICANO', temperature: 'ICE', quantity: 1 }];
  const tOrder = testCtx.orders.create({ store_id: 'GBRICK_MAIN', items, dining: 'DINE_IN', idempotency_key: key() });
  const pOrder = prodCtx.orders.create({ store_id: 'GBRICK_MAIN', items, dining: 'DINE_IN', idempotency_key: key() });
  assert.equal(tOrder.order_number, 'T001');
  assert.equal(pOrder.order_number, 'A001');
  assert.ok(fs.existsSync(path.join(dir, 'store-orders.test.json')));
  assert.ok(fs.existsSync(path.join(dir, 'store-orders.production.json')));
  assert.equal(prodCtx.orders.all().orders.length, 1, '테스트 주문이 실제 주문 파일에 섞이지 않음');

  // PRODUCTION 카운터는 직원 키가 있어야 한다. 손님 태블릿 API는 키 없이 된다
  const t = await startServer({ env: { VOICE_ORDER_MODE: 'production', STORE_STAFF_KEY: 'pin-1234' } });
  try {
    assert.equal((await t.call(`${S}/counter`)).status, 401);
    assert.equal((await t.call(`${S}/counter`, undefined, { 'X-Staff-Key': 'wrong' })).status, 401);
    assert.equal((await t.call(`${S}/counter`, undefined, { 'X-Staff-Key': 'pin-1234' })).status, 200);
    assert.equal((await t.call(`${S}/sessions`, { input_type: 'VOICE' })).status, 201);
    const page = await fetch(`${t.base}/store/GBRICK_MAIN`).then((r) => r.text());
    assert.match(page, /data-order-mode="production"/);
  } finally {
    await t.close();
  }
  // 직원 키가 없어도 인터넷 공유(터널)로 들어온 직원용 요청은 막는다
  const t2 = await startServer();
  try {
    assert.equal((await t2.call(`${S}/counter`)).status, 200, '매장 Wi-Fi 안');
    assert.equal((await t2.call(`${S}/counter`, undefined, { 'cf-connecting-ip': '203.0.113.9' })).status, 401, '터널 밖');
  } finally {
    await t2.close();
  }
});

test('KPI는 실제 기록으로만 — 기록이 없으면 null(화면 "-")', async () => {
  const t = await startServer();
  try {
    const empty = (await t.call(`${S}/stats`)).data;
    assert.equal(empty.total_orders, 0);
    assert.equal(empty.order_completion_rate, null);
    assert.equal(empty.avg_order_seconds, null);
    await order(t.call, '아이스 아메리카노 하나');
    const sess = (await t.call(`${S}/sessions`, { input_type: 'VOICE' })).data;
    await t.call(`${S}/sessions/${sess.id}/parse`, { text: '아인슈페너 하나' });
    await t.call(`${S}/sessions/${sess.id}/fail`, { reason: 'no-speech' });
    await t.call(`${S}/help`, { session_id: sess.id });
    const st = (await t.call(`${S}/stats`)).data;
    assert.equal(st.total_orders, 1);
    assert.equal(st.voice_orders, 1);
    assert.equal(st.conversations, 2);
    assert.equal(st.order_completion_rate, 50);
    assert.equal(st.menu_failures, 1);
    assert.equal(st.stt_failures, 1);
    assert.equal(st.help_requests, 1);
    assert.equal(typeof st.avg_order_seconds, 'number');
  } finally {
    await t.close();
  }
});

test('기존 DEMO(/ 와 /api/sessions)는 그대로, STORE와 데이터가 섞이지 않음', async () => {
  const t = await startServer();
  try {
    const home = await fetch(`${t.base}/`).then((r) => r.text());
    assert.match(home, /말씀만 해주세요/);
    assert.doesNotMatch(home, /data-mode="store"/);
    const s = (await t.call('/api/sessions', { input_type: 'TEXT' })).data;
    const p = (await t.call(`/api/sessions/${s.id}/parse`, { text: '아이스 아메리카노 하나' })).data;
    const demoOrder = (await t.call(`/api/sessions/${s.id}/confirm`, { items: p.items })).data;
    assert.match(demoOrder.order_id, /^GB-\d{8}-001$/);
    assert.equal(t.storeCtx.orders.all().orders.length, 0, 'DEMO 주문은 매장 주문 서버에 들어가지 않음');
    // 매장 세션 id로 DEMO 경로를, DEMO 세션 id로 매장 경로를 쓸 수 없다
    assert.equal((await t.call(`${S}/sessions/${s.id}/parse`, { text: '라떼' })).status, 404);
  } finally {
    await t.close();
  }
});

test('포장 주문: 할인 가격으로 저장 · 카운터/주문서에 [포장] 표시 · 매장/포장 없으면 접수 안 함', async () => {
  const t = await startServer();
  try {
    const items = [{ menu_id: 'AMERICANO', temperature: 'ICE', quantity: 1 }, { menu_id: 'CAFE_LATTE', temperature: 'HOT', quantity: 1 }];
    const none = await t.call(`${S}/orders`, { items, idempotency_key: key() });
    assert.equal(none.status, 400, '매장/포장을 고르지 않은 주문은 만들지 않는다');
    assert.match(none.data.error, /포장/);
    assert.equal(t.storeCtx.orders.all().orders.length, 0);

    const q = await t.call(`${S}/quote`, { items, dining: 'TAKEOUT' });
    assert.equal(q.data.total_amount, 2000 + 3400);
    const res = await t.call(`${S}/orders`, { items, dining: 'TAKEOUT', idempotency_key: key() });
    assert.equal(res.status, 201);
    const o = res.data;
    assert.equal(o.dining, 'TAKEOUT');
    assert.deepEqual([o.list_amount, o.discount_amount, o.total_amount], [7900, 2500, 5400]);
    assert.deepEqual(o.items.map((l) => [l.menu_id, l.unit_price, l.amount]), [['AMERICANO', 2000, 2000], ['CAFE_LATTE', 3400, 3400]]);
    const counter = (await t.call(`${S}/counter`)).data;
    assert.equal(counter.active[0].dining, 'TAKEOUT');
    const printed = (await t.call(`${S}/orders/${o.order_id}/print`, {})).data;
    assert.match(printed.html, /\[ 포장 \]/);
    assert.match(printed.html, /포장 할인 -2,500원/);
    assert.match(printed.html, /합계 5,400원/);

    const dineIn = (await t.call(`${S}/orders`, { items, dining: 'DINE_IN', idempotency_key: key() })).data;
    assert.equal(dineIn.total_amount, 7900, '매장은 정상가');
  } finally {
    await t.close();
  }
});
