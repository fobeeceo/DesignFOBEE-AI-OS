// STORE MODE 브라우저 E2E — 손님 태블릿 + 카운터 화면을 동시에 열어 실제 흐름을 검증한다.
// 실행: 서버를 TEST 모드로 켠 뒤  BASE_URL=http://localhost:3100 node tests/e2e/store-smoke.mjs  (playwright 필요)
import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const OUT = new URL('./screenshots/store/', import.meta.url).pathname;
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
  window.__printed = [];
  window.print = () => window.__printed.push(document.getElementById('print-area').innerHTML);
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const tabletCtx = await browser.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true });
await tabletCtx.addInitScript(MOCK);
const tablet = await tabletCtx.newPage();
const counterCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await counterCtx.addInitScript(MOCK);
const counter = await counterCtx.newPage();
const errors = [];
for (const p of [tablet, counter]) p.on('pageerror', (e) => errors.push(e.message));

const results = [];
async function step(name, fn) {
  try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name, e.message.split('\n')[0]]); }
}
const screen = (p, s) => p.locator(`[data-screen="${s}"]`).waitFor({ state: 'visible', timeout: 8000 });
const card = (no) => counter.locator(`.card:has(.no:text-is("${no}"))`);

await tablet.goto(`${BASE}/store/GBRICK_MAIN`);
await counter.goto(`${BASE}/counter/GBRICK_MAIN`);

await step('태블릿: 서버 연결 🟢 · 테스트 모드 표시', async () => {
  await tablet.waitForFunction(() => document.getElementById('conn').textContent.includes('연결 정상'));
  assert.equal(await tablet.textContent('.demo-tag'), '테스트 모드');
  await tablet.screenshot({ path: `${OUT}01-tablet-start.png` });
});

await step('음성 주문 "아메리카노 한 잔 주세요" → 온도 질문 → "따뜻하게" → 매장/포장 질문 → "포장이요" → 확인 "네" → T001 · 카운터 결제 안내', async () => {
  await tablet.evaluate(() => window.__queue.push('아메리카노 한 잔 주세요.', '따뜻하게요', '포장이요'));
  await tablet.getByRole('button', { name: /주문 시작/ }).click();
  await screen(tablet, 'confirm');
  assert.ok(await tablet.evaluate(() => window.__spoken.includes('매장에서 드시고 가시나요, 포장해 가시나요?')), '매장/포장을 묻는다');
  assert.equal(await tablet.textContent('#c-dining'), '🥡 포장');
  assert.equal(await tablet.textContent('#c-total'), '2,000원');
  assert.match(await tablet.textContent('#c-disc'), /포장 할인 -1,500원 \(정상가 3,500원\)/);
  assert.match(await tablet.evaluate(() => window.__spoken.at(-1)), /따뜻한 아메리카노 한 잔, 포장 맞으실까요\? 포장 할인 적용해서 총 2,000원입니다/);
  assert.ok(await tablet.getByRole('button', { name: '주문 취소' }).isVisible());
  await tablet.screenshot({ path: `${OUT}02-tablet-confirm.png` });
  await tablet.evaluate(() => window.__queue.push('네'));
  await screen(tablet, 'done');
  assert.equal(await tablet.textContent('#d-no'), 'T001');
  assert.equal(await tablet.textContent('#d-pay'), '카운터에서 결제해주세요.');
  assert.ok(await tablet.locator('#d-print').isHidden());
  assert.match(await tablet.evaluate(() => window.__spoken.at(-1)), /주문번호는 T 1번입니다\. 카운터에서 결제해 주세요/);
  await tablet.screenshot({ path: `${OUT}03-tablet-done.png` });
});

await step('카운터: 새 주문 T001 표시 (🥡 포장 · 아메리카노 HOT · 포장 할인 · 2,000원)', async () => {
  await card('T001').waitFor({ timeout: 6000 });
  const text = await card('T001').textContent();
  assert.match(text, /🥡 포장/);
  assert.match(text, /아메리카노HOT/);
  assert.match(text, /포장 할인 -1,500원/);
  assert.match(text, /-1,500원2,000원/);
  assert.match(text, /새 주문/);
  assert.ok(await counter.getByText('TEST 모드 — 연습 주문입니다.', { exact: false }).isVisible());
  await counter.screenshot({ path: `${OUT}04-counter-new.png`, fullPage: true });
});

await step('카운터: 주문 확인 → 주문서 출력(PRINTED) → 제조 시작 → 준비 완료 → 완료', async () => {
  await card('T001').getByRole('button', { name: '주문 확인' }).click();
  await counter.waitForFunction(() => document.querySelector('.card .status')?.textContent === '확인됨');
  await card('T001').getByRole('button', { name: /주문서 출력/ }).click();
  await counter.waitForFunction(() => window.__printed.length === 1);
  const receipt = await counter.evaluate(() => window.__printed[0]);
  for (const s of ['주문번호 T001', '[ 포장 ]', '아메리카노', 'HOT', '정상가 3,500원', '포장 할인 -1,500원', '합계 2,000원', '결제: 카운터', 'TEST 주문']) assert.ok(receipt.includes(s), s);
  await counter.emulateMedia({ media: 'print' });
  await counter.screenshot({ path: `${OUT}05-receipt.png` });
  await counter.emulateMedia({ media: 'screen' });
  await counter.waitForFunction(() => document.querySelector('.card .status')?.textContent === '출력됨');
  for (const [btn, label] of [['제조 시작', '제조 중'], ['준비 완료', '준비 완료']]) {
    await card('T001').getByRole('button', { name: btn }).click();
    await counter.waitForFunction((l) => document.querySelector('.card .status')?.textContent === l, label);
  }
  await card('T001').getByRole('button', { name: '완료' }).click();
  await counter.waitForFunction(() => document.getElementById('done').textContent.includes('T001 포장 완료'));
});

await step('직원 도움 요청: 태블릿 버튼 → 카운터 🔔 알림 → 확인하면 사라짐', async () => {
  await tablet.getByRole('button', { name: /처음으로/ }).click();
  await tablet.getByRole('button', { name: /직원에게 도움 요청/ }).click();
  await screen(tablet, 'help');
  assert.equal(await tablet.textContent('#h-title'), '직원을 호출했습니다.');
  await counter.locator('.help-alert').waitFor({ timeout: 6000 });
  assert.match(await counter.textContent('.help-alert'), /고객 도움이 필요합니다/);
  await counter.screenshot({ path: `${OUT}06-counter-help.png` });
  await counter.locator('.help-alert').getByRole('button', { name: '확인' }).click();
  await counter.locator('.help-alert').waitFor({ state: 'detached', timeout: 6000 });
});

await step('네트워크 오류: 주문 전송 실패 → "아직 접수되지 않았습니다" → 다시 보내기 → 주문 하나만 (T002)', async () => {
  await tablet.goto(`${BASE}/store/GBRICK_MAIN`);
  await tablet.waitForFunction(() => document.getElementById('conn').textContent.includes('연결 정상'));
  await tablet.route('**/api/store/GBRICK_MAIN/orders', (r) => r.abort());
  await tablet.getByRole('button', { name: '텍스트로 테스트' }).click();
  await tablet.fill('#text-input', '아이스 아메리카노 하나');
  await tablet.getByRole('button', { name: '주문 분석' }).click();
  await screen(tablet, 'question');
  await tablet.getByRole('button', { name: /매장에서 먹어요/ }).click();
  await screen(tablet, 'confirm');
  assert.equal(await tablet.textContent('#c-total'), '3,500원', '매장은 정상가');
  assert.ok(await tablet.locator('#c-disc').isHidden());
  await tablet.getByRole('button', { name: '네, 맞아요' }).click();
  await screen(tablet, 'message');
  assert.equal(await tablet.textContent('#m-title'), '주문이 아직 접수되지 않았습니다.');
  await tablet.screenshot({ path: `${OUT}07-tablet-send-failed.png` });
  await tablet.unroute('**/api/store/GBRICK_MAIN/orders');
  await tablet.getByRole('button', { name: '다시 보내기' }).click();
  await screen(tablet, 'done');
  assert.equal(await tablet.textContent('#d-no'), 'T002');
  await card('T002').waitFor({ timeout: 6000 });
  assert.equal(await counter.locator('.card').count(), 1);
});

await step('두 번 눌러도 주문은 하나 (T003만 생김)', async () => {
  await tablet.getByRole('button', { name: /처음으로/ }).click();
  await tablet.getByRole('button', { name: '텍스트로 테스트' }).click();
  await tablet.fill('#text-input', '따뜻한 유자차 하나 포장이요');
  await tablet.getByRole('button', { name: '주문 분석' }).click();
  await screen(tablet, 'confirm'); // 주문 말에 '포장'이 있으면 다시 묻지 않는다
  assert.equal(await tablet.textContent('#c-total'), '5,000원');
  await tablet.evaluate(() => { const b = document.querySelector('[data-action="confirm-yes"]'); b.click(); b.click(); b.click(); });
  await screen(tablet, 'done');
  assert.equal(await tablet.textContent('#d-no'), 'T003');
  await card('T003').waitFor({ timeout: 6000 });
  await counter.waitForTimeout(2500);
  assert.equal(await counter.locator('.card').count(), 2, 'T002, T003만 진행 중');
});

await step('없는 메뉴: "아인슈페너 주세요" → 메뉴 없음 안내 + 직원 도움', async () => {
  await tablet.getByRole('button', { name: /처음으로/ }).click();
  await tablet.evaluate(() => window.__queue.push('아인슈페너 주세요.'));
  await tablet.getByRole('button', { name: /주문 시작/ }).click();
  await screen(tablet, 'message');
  assert.match(await tablet.textContent('#m-body'), /현재 주문 가능한 메뉴에서 찾지 못했습니다/);
});

await step('서버 연결 끊김: 🔴 표시 · 주문 시작 버튼 잠김 · 안내 문구', async () => {
  await tablet.goto(`${BASE}/store/GBRICK_MAIN`);
  await tablet.route('**/api/store/GBRICK_MAIN/health', (r) => r.abort());
  await tablet.reload();
  await tablet.waitForFunction(() => document.getElementById('conn').textContent.includes('연결 끊김'));
  assert.ok(await tablet.getByRole('button', { name: /주문 시작/ }).isDisabled());
  assert.ok(await tablet.getByText('지금은 주문을 받을 수 없어요.', { exact: false }).isVisible());
  await tablet.screenshot({ path: `${OUT}08-tablet-offline.png` });
  await tablet.unroute('**/api/store/GBRICK_MAIN/health');
});

await step('카운터 KPI: 실제 기록으로 계산 (총 주문 3)', async () => {
  await counter.waitForFunction(() => document.getElementById('kpis').textContent.includes('총 주문3'));
  await counter.screenshot({ path: `${OUT}09-counter-kpi.png`, fullPage: true });
});

await step('페이지 JS 오류 없음', async () => assert.deepEqual(errors, []));

await browser.close();
for (const r of results) console.log(r.join('  '));
console.log(`\n스크린샷: ${OUT}`);
if (results.some((r) => r[0] === 'FAIL')) process.exit(1);
