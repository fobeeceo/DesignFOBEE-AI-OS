// 휴대폰에서 '멈춤' 재현 (대표 현장 시험 2026-10-27: PC는 되는데 휴대폰은 다음으로 안 넘어감)
// ① 아이폰 사파리처럼 음성 인식이 끝 신호(onend)를 보내지 않음 ② 휴대폰 인터넷이 걸려 서버 답이 안 옴
// 실행: 가짜 Gemini + AI 켠 매장 서버 (ai-smoke와 같음) → BASE_URL=http://localhost:3100 node tests/e2e/phone-smoke.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:3100';

// 끝 신호를 보내지 않는 음성 인식: 들은 말은 주지만(확정 전 조각), stop()을 불러도 onend가 오지 않는다
const STUCK_MOCK = () => {
  window.__queue = [];
  window.__spoken = [];
  class StuckRecognition {
    start() {
      const next = window.__queue.shift();
      if (next && next !== '__silent__') {
        this.t = setTimeout(() => {
          const res = [{ transcript: next }];
          res.isFinal = false;
          this.onresult?.({ resultIndex: 0, results: [res] });
        }, 50);
      }
    }
    stop() {} // 아무 신호도 보내지 않는다
    abort() { clearTimeout(this.t); }
  }
  window.SpeechRecognition = StuckRecognition;
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  Object.defineProperty(window, 'speechSynthesis', { value: { paused: false, getVoices: () => [], cancel() {}, resume() {}, speak(u) { window.__spoken.push(u.text); setTimeout(() => u.onend?.(), 5); } } });
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await ctx.addInitScript(STUCK_MOCK);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const results = [];
async function step(name, fn) {
  try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name, e.message.split('\n')[0]]); }
}
const screen = (s, timeout = 15000) => page.locator(`section[data-screen="${s}"]`).waitFor({ state: 'visible', timeout });
const fresh = async () => {
  await page.goto(`${BASE}/store/GBRICK_MAIN`);
  await page.waitForFunction(() => document.getElementById('conn').textContent.includes('연결 정상'));
};

await fresh();
await step('음성 인식이 끝 신호를 안 보내도: 조용해지면 들은 말로 넘어간다 (아이스 아메리카노 → 매장/포장 질문)', async () => {
  await page.evaluate(() => window.__queue.push('아이스 아메리카노 하나 주세요'));
  await page.getByRole('button', { name: /주문 시작/ }).click();
  await screen('question');
  assert.match(await page.textContent('#q-text'), /매장에서 드시고 가시나요/);
});

await fresh();
await step('아무 말도 없고 끝 신호도 없으면: 멈추지 않고 "잘 못 들었어요" 하고 다시 듣는다', async () => {
  await page.evaluate(() => window.__queue.push('__silent__', '아이스 아메리카노 하나 주세요'));
  await page.getByRole('button', { name: /주문 시작/ }).click();
  await page.waitForFunction(() => window.__spoken.includes('죄송해요, 제가 잘 못 들었어요. 한 번만 더 말씀해 주시겠어요?'), null, { timeout: 15000 });
  await screen('question');
});

await fresh();
await step('서버 답이 안 오면(휴대폰 인터넷 걸림): 12초 뒤 다시 묻고, 다음엔 정상 진행', async () => {
  let hang = true;
  await page.route('**/parse', async (route) => {
    if (hang) { hang = false; return; } // 첫 요청은 영원히 답하지 않는다
    route.continue();
  });
  await page.evaluate(() => window.__queue.push('아이스 아메리카노 하나 주세요', '아이스 아메리카노 하나 주세요'));
  await page.getByRole('button', { name: /주문 시작/ }).click();
  await page.waitForFunction(() => document.getElementById('interim').textContent.includes('잠시만요'), null, { timeout: 8000 });
  await page.waitForFunction(() => window.__spoken.includes('죄송해요, 제가 잘 못 들었어요. 한 번만 더 말씀해 주시겠어요?'), null, { timeout: 20000 });
  await screen('question', 15000);
  await page.unroute('**/parse');
});

await step('페이지 JS 오류 없음', async () => assert.deepEqual(errors, []));
await browser.close();
for (const r of results) console.log(r.join('  '));
if (results.some((r) => r[0] === 'FAIL')) process.exit(1);
