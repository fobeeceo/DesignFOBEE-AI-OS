// AI 바리스타 (Gemini) — 대표 승인 2026-10-26. 실제 Gemini 대신 같은 모양의 가짜 서버로 검증한다.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createAiBarista, validateAiItems, cleanSay } from '../backend/aiBarista.mjs';
import { createHandler, createStoreContext, loadMenu } from '../server.mjs';
import { createOrderService } from '../backend/orderService.mjs';
import { createMemoryStore } from '../backend/store.mjs';
import { createBrowserPrintProvider } from '../backend/print/printService.mjs';
import { startFakeGemini } from './helpers/fakeGemini.mjs';

const menu = loadMenu();
const KEY = 'test-only-key-123';

test('키가 없으면 꺼져 있고 바깥으로 아무것도 보내지 않는다', async () => {
  let called = 0;
  const ai = createAiBarista({ apiKey: '', menu, fetchImpl: async () => { called++; } });
  assert.equal(ai.enabled, false);
  assert.equal(await ai.reply({ text: '안녕하세요' }), null);
  assert.equal(called, 0);
});

test('모델: 이 키로 쓸 수 있는 모델 중 가장 빠르고 저렴한 Flash-Lite를 고른다', async () => {
  const g = await startFakeGemini();
  try {
    const ai = createAiBarista({ apiKey: KEY, menu, apiBase: g.base });
    assert.equal(await ai.pickModel(), 'gemini-3.1-flash-lite');
  } finally {
    await g.close();
  }
});

test('AI가 담은 메뉴는 메뉴판으로 검증: 없는 메뉴는 버리고, 없는 온도는 다시 묻고, 수량은 1~20', () => {
  const { items, dropped } = validateAiItems([
    { menu_id: 'EINSPANNER', temperature: 'HOT', quantity: 1 },
    { menu_id: 'LEMON_ADE', temperature: 'HOT', quantity: 2 },
    { menu_id: 'AMERICANO', temperature: null, quantity: 99 },
    { menu_id: 'VIN_CHAUD', temperature: 'HOT', quantity: 1 }, // 판매 중지
  ], menu);
  assert.deepEqual(dropped, ['EINSPANNER', 'VIN_CHAUD']);
  const lemon = items.find((i) => i.menu_id === 'LEMON_ADE');
  assert.deepEqual([lemon.temperature, lemon.temperature_unavailable], [null, 'HOT'], '"따뜻한 레몬에이드" → 아이스만 있다고 다시 묻는다');
  const ame = items.find((i) => i.menu_id === 'AMERICANO');
  assert.equal(ame.temperature, null, '말 안 한 온도는 시스템이 다시 묻는다');
  assert.equal(ame.quantity, 20);
});

test('AI가 가격을 말하면 그 문장은 지운다 (가격은 서버·화면만)', () => {
  assert.equal(cleanSay('따뜻한 생강차는 어떠세요? 한 잔에 6,000원이에요.'), '따뜻한 생강차는 어떠세요?');
});

test('대화: 키는 헤더로만, 전화번호는 가려서 보내고, 생각은 최소로 · 실패하면 null(규칙형 그대로)', async () => {
  const g = await startFakeGemini();
  try {
    const logs = [];
    const ai = createAiBarista({ apiKey: KEY, menu, apiBase: g.base, log: (m) => logs.push(m) });
    const out = await ai.reply({ text: '어제 마신 노란 차 주세요 제 번호 010-1234-5678' });
    assert.deepEqual(out.items.map((i) => [i.menu_id, i.temperature, i.quantity]), [['YUZU_TEA', 'HOT', 1]]);
    assert.ok(!JSON.stringify(out).includes(KEY), '결과에 키가 없다');
    const sent = JSON.stringify(g.calls[0].body);
    assert.doesNotMatch(sent, /1234-5678/, '전화번호는 가려서 보낸다');
    assert.ok(!sent.includes(KEY), '본문에 키를 싣지 않는다');
    assert.equal(g.calls[0].key, KEY);
    assert.deepEqual(g.calls[0].body.generationConfig.thinkingConfig, { thinkingLevel: 'low' });
    assert.match(g.calls[0].body.systemInstruction.parts[0].text, /AMERICANO \| 아메리카노/);
    assert.doesNotMatch(g.calls[0].body.systemInstruction.parts[0].text, /3500|3,500/, '프롬프트에 가격을 주지 않는다');
    g.server.fail = true;
    assert.equal(await ai.reply({ text: '아무 말' }), null);
    const st = ai.stats();
    assert.deepEqual([st.calls, st.failures, st.input_tokens], [2, 1, 3000]);
    assert.ok(!logs.join('\n').includes(KEY), '로그에 키가 없다');
  } finally {
    await g.close();
  }
});

async function storeServer(env) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vo-ai-'));
  const storeCtx = createStoreContext({ menu, getKnowledge: () => ({}), dir, env });
  const demo = createOrderService({ store: createMemoryStore(), menu, printProvider: createBrowserPrintProvider() });
  const server = http.createServer(createHandler(demo, { storeCtx, staffKey: '' }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (p, body) => {
    const res = await fetch(base + p, { method: body === undefined ? 'GET' : 'POST', headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text();
    return { status: res.status, data: JSON.parse(text), text };
  };
  return { call, storeCtx, close: () => new Promise((r) => server.close(r)) };
}

test('매장 서버 (AI 먼저): 알아들은 주문도 AI가 규칙형 해석을 힌트로 받아 맞장구, 못 알아들은 말은 AI가 대답 → 확인 화면을 거쳐 주문', async () => {
  const g = await startFakeGemini();
  const t = await storeServer({ GEMINI_API_KEY: KEY, GEMINI_API_BASE: g.base });
  const S = '/api/store/GBRICK_MAIN';
  try {
    assert.equal((await t.call(`${S}/config`)).data.ai.enabled, true);
    const sess = (await t.call(`${S}/sessions`, { input_type: 'VOICE' })).data;

    const rule = (await t.call(`${S}/sessions/${sess.id}/parse`, { text: '아이스 아메리카노 하나' })).data;
    assert.equal(rule.kind, 'ok');
    assert.equal(rule.say, '네, 아이스 아메리카노 한 잔이요.', 'AI 바리스타의 맞장구');
    assert.match(g.calls[0].body.contents.at(-1).parts[0].text, /\(규칙 해석: 아이스 아메리카노 1\)/, '규칙형 해석을 힌트로 준다');

    const chat = await t.call(`${S}/sessions/${sess.id}/parse`, { text: '속이 안 좋은데 뭐 마시면 좋을까요' });
    assert.equal(chat.data.kind, 'chat');
    assert.equal(chat.data.say, '따뜻한 캐모마일이나 생강차는 어떠세요?', '가격 문장은 지워짐');
    assert.ok(!chat.text.includes(KEY), '손님 화면 응답에 키가 없다');

    const ai = (await t.call(`${S}/sessions/${sess.id}/parse`, { text: '어제 마신 그 노란 거 하나 주세요' })).data;
    assert.equal(ai.kind, 'ok');
    assert.deepEqual(ai.items.map((i) => [i.menu_id, i.temperature]), [['YUZU_TEA', 'HOT']]);
    assert.equal(ai.fail_count, 0, 'AI가 알아들었으면 실패로 세지 않는다');
    assert.equal(g.calls.at(-1).body.contents.length, 5, '앞 대화를 기억한다 (손님·바리스타·손님·바리스타·손님)');

    const order = await t.call(`${S}/orders`, { session_id: sess.id, items: ai.items, dining: 'TAKEOUT', idempotency_key: `k-${Date.now()}-ai` });
    assert.equal(order.status, 201);
    assert.equal(order.data.total_amount, 5000, '가격은 서버가 메뉴판으로 (포장 6,000-1,000)');

    const fake = (await t.call(`${S}/sessions/${(await t.call(`${S}/sessions`, { input_type: 'VOICE' })).data.id}/parse`, { text: '없는 메뉴 시험' })).data;
    assert.equal(fake.kind, 'chat', 'AI가 메뉴판에 없는 메뉴를 담아도 주문에 들어가지 않는다');
    assert.deepEqual(fake.items, []);

    g.server.fail = true;
    const down = (await t.call(`${S}/sessions/${(await t.call(`${S}/sessions`, { input_type: 'VOICE' })).data.id}/parse`, { text: '아인슈페너 주세요' })).data;
    assert.equal(down.kind, 'not_found', 'AI가 안 되면 규칙형 안내 그대로');

    const stats = (await t.call(`${S}/stats`)).data;
    assert.equal(stats.ai.calls, 5);
    assert.equal(stats.ai.failures, 1);
  } finally {
    await t.close();
    await g.close();
  }
});

test('VOICE_ORDER_AI_FIRST=off 이면 예전처럼 알아들은 주문은 AI를 부르지 않는다 (비용 0) · 메뉴 지식 답은 언제나 규칙형', async () => {
  const g = await startFakeGemini();
  const t = await storeServer({ GEMINI_API_KEY: KEY, GEMINI_API_BASE: g.base, VOICE_ORDER_AI_FIRST: 'off' });
  const S = '/api/store/GBRICK_MAIN';
  try {
    const sess = (await t.call(`${S}/sessions`, { input_type: 'VOICE' })).data;
    const r = (await t.call(`${S}/sessions/${sess.id}/parse`, { text: '아이스 아메리카노 하나' })).data;
    assert.equal(r.kind, 'ok');
    assert.equal(r.say, undefined);
    assert.equal(g.calls.length, 0);
  } finally {
    await t.close();
    await g.close();
  }
});

test('VOICE_ORDER_AI=off 이면 키가 있어도 끈다', async () => {
  const t = await storeServer({ GEMINI_API_KEY: KEY, VOICE_ORDER_AI: 'off' });
  try {
    assert.equal((await t.call('/api/store/GBRICK_MAIN/config')).data.ai.enabled, false);
  } finally {
    await t.close();
  }
});
