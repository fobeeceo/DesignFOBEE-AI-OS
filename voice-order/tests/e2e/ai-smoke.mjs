// AI 바리스타 E2E (매장 모드) — 실제 Gemini 대신 가짜 Gemini 서버로 대화 흐름을 확인한다.
// 실행: node tests/helpers/fakeGemini.mjs 3999 &
//       GEMINI_API_KEY=test GEMINI_API_BASE=http://127.0.0.1:3999 npm start   (TEST 모드, 새 데이터 폴더)
//       BASE_URL=http://localhost:3100 node tests/e2e/ai-smoke.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const OUT = new URL('./screenshots/ai/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });

const MOCK = () => {
  window.__queue = [];
  window.__spoken = [];
  class FakeRecognition {
    start() {
      this.t = setTimeout(() => {
        const next = window.__queue.shift();
        if (next === undefined || next === '__nospeech__') this.onerror?.({ error: 'no-speech' });
        else {
          const res = [{ transcript: next }];
          res.isFinal = true;
          this.onresult?.({ resultIndex: 0, results: [res] });
        }
        this.onend?.();
      }, 30);
    }
    stop() {}
    abort() { clearTimeout(this.t); }
  }
  window.SpeechRecognition = FakeRecognition;
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [], cancel() {}, speak(u) { window.__spoken.push(u.text); setTimeout(() => u.onend?.(), 5); } } });
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const tctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true });
await tctx.addInitScript(MOCK);
const tablet = await tctx.newPage();
const counter = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const errors = [];
for (const p of [tablet, counter]) p.on('pageerror', (e) => errors.push(e.message));
const results = [];
async function step(name, fn) {
  try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name, e.message.split('\n')[0]]); }
}
const screen = (s) => tablet.locator(`section[data-screen="${s}"]`).waitFor({ state: 'visible', timeout: 10000 });

await tablet.goto(`${BASE}/store/GBRICK_MAIN`);
await counter.goto(`${BASE}/counter/GBRICK_MAIN`);
await tablet.waitForFunction(() => document.getElementById('conn').textContent.includes('연결 정상'));

await step('AI 대화: "속이 안 좋은데 뭐 마시면 좋을까요" → 바리스타가 권하고(가격 문장은 빠짐) 곧바로 다시 듣는다', async () => {
  await tablet.evaluate(() => window.__queue.push('속이 안 좋은데 뭐 마시면 좋을까요'));
  await tablet.getByRole('button', { name: /주문 시작/ }).click();
  await screen('message');
  assert.equal(await tablet.textContent('#m-title'), '바리스타');
  assert.equal(await tablet.textContent('#m-body'), '따뜻한 캐모마일이나 생강차는 어떠세요?');
  assert.equal(await tablet.textContent('#cap-ai'), '따뜻한 캐모마일이나 생강차는 어떠세요?');
  await tablet.screenshot({ path: `${OUT}01-chat.png` });
  // 이어서 듣다가 손님이 조용하면 '못 들었어요'가 아니라 바리스타 대답 화면 그대로
  await tablet.waitForTimeout(1200);
  assert.equal(await tablet.textContent('#m-title'), '바리스타');
  assert.ok(!(await tablet.evaluate(() => window.__spoken.some((t) => t.startsWith('제가 잘 못 들었어요')))));
});

await step('AI 주문: "어제 마신 그 노란 거 하나 주세요" → 따뜻한 유자차 → 매장/포장 → 확인 화면(가격은 서버) → 네 → T001', async () => {
  await tablet.evaluate(() => window.__queue.push('어제 마신 그 노란 거 하나 주세요', '포장이요'));
  await tablet.getByRole('button', { name: '🎤 말로 주문하기' }).click();
  await screen('confirm');
  assert.match(await tablet.textContent('#c-lines'), /따뜻한 유자차/);
  assert.equal(await tablet.textContent('#c-total'), '5,000원');
  await tablet.screenshot({ path: `${OUT}02-confirm.png` });
  await tablet.evaluate(() => window.__queue.push('네'));
  await screen('done');
  assert.match(await tablet.textContent('#d-no'), /^T\d{3}$/); // TEST 주문번호 (번호 순서는 store-smoke에서 검증)
});

await step('AI가 "직원 불러" 의도를 알아들으면 → 직원 도움 버튼을 먼저, 자동으로 다시 듣지 않음', async () => {
  await tablet.getByRole('button', { name: /처음으로/ }).click();
  await tablet.evaluate(() => window.__queue.push('사람 불러 주세요'));
  await tablet.getByRole('button', { name: /주문 시작/ }).click();
  await screen('message');
  const first = await tablet.locator('#m-buttons button').first().textContent();
  assert.match(first, /직원에게 도움 요청/);
  await tablet.waitForTimeout(800);
  assert.ok(await tablet.locator('section[data-screen="message"]').isVisible(), '듣기로 넘어가지 않음');
});

await step('카운터 KPI: AI 대화 횟수가 실제 호출로 보인다', async () => {
  await counter.waitForFunction(() => Number((document.getElementById('kpis').textContent.match(/AI 대화(\d+)회/) || [])[1]) >= 3, null, { timeout: 8000 });
});

await step('페이지 JS 오류 없음', async () => assert.deepEqual(errors, []));

await browser.close();
for (const r of results) console.log(r.join('  '));
if (results.some((r) => r[0] === 'FAIL')) process.exit(1);
