// 주문 확인 화면에서 고치기 E2E — 말로 고치기 / 버튼으로 고치기 / 메뉴 더 추가 / 전체 취소 (SENIOR VOICE ORDER 지시서 v1.0)
// 실행: 서버를 켠 뒤  BASE_URL=http://localhost:3100 node tests/e2e/edit-smoke.mjs  (playwright 필요)
// 음성 인식·합성은 가짜(모의 객체) — 실제 마이크·스피커는 사람이 기기에서 확인한다.
import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const OUT = new URL('./screenshots/edit/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });

const MOCK = () => {
  window.__queue = [];
  window.__spoken = [];
  class FakeRecognition {
    start() {
      this.t = setTimeout(() => {
        const next = window.__queue.shift();
        if (next === '__denied__') this.onerror?.({ error: 'not-allowed' }); // 마이크 권한 거부
        else if (next === undefined || next === '__nospeech__') this.onerror?.({ error: 'no-speech' });
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
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(MOCK);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const results = [];
async function step(name, fn) {
  try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name, e.message.split('\n')[0]]); }
}
const visible = (s) => page.locator(`[data-screen="${s}"]`).waitFor({ state: 'visible', timeout: 8000 });
const text = (sel) => page.textContent(sel);
const waitText = (sel, re) => page.waitForFunction(([s, r]) => new RegExp(r).test(document.querySelector(s)?.textContent || ''), [sel, re.source], { timeout: 8000 });
/** 확인 화면에서 말하기 — 듣기가 끝나 있으면 '말로 다시 대답하기'로 다시 듣게 한다 */
async function sayAtConfirm(t) {
  await page.evaluate((x) => window.__queue.push(x), t);
  await page.waitForTimeout(80);
  if (await page.locator('#c-listen').isVisible()) await page.locator('#c-listen').click();
}
const lines = () => page.$$eval('#c-lines li .line-head span:first-child', (els) => els.map((e) => e.textContent));
const home = async () => {
  await page.goto(BASE);
  await visible('start');
};

await home();

await step('말로: "아이스 아메리카노 한 잔 주세요" → 매장 → 확인 화면에 메뉴별 가격 · 합계 3,500원', async () => {
  await page.evaluate(() => window.__queue.push('아이스 아메리카노 한 잔 주세요.', '매장이요'));
  await page.getByRole('button', { name: /주문 시작/ }).click();
  await visible('confirm');
  assert.deepEqual(await lines(), ['아이스 아메리카노']);
  assert.equal(await text('#c-lines .line-price'), '3,500원');
  assert.equal(await text('#c-total'), '3,500원');
});

await step('말로: "한 잔 더 추가해 주세요" → 2잔 · 7,000원 · "아메리카노 한 잔 더 넣었어요"', async () => {
  await sayAtConfirm('한 잔 더 추가해 주세요.');
  await waitText('#c-total', /^7,000원$/);
  assert.equal(await text('#c-lead'), '아메리카노 한 잔 더 넣었어요.');
  assert.equal(await text('#c-lines .qty'), '2잔');
  assert.ok((await page.evaluate(() => window.__spoken.at(-1))).startsWith('아메리카노 한 잔 더 넣었어요. 아이스 아메리카노 두 잔, 매장 맞으실까요?'));
});

await step('말로: "따뜻하게 바꿔 주세요" → 따뜻한 아메리카노 2잔', async () => {
  await sayAtConfirm('따뜻하게 바꿔 주세요');
  await waitText('#c-lead', /따뜻하게 바꿨어요/);
  assert.deepEqual(await lines(), ['따뜻한 아메리카노']);
  assert.equal(await text('#c-total'), '7,000원');
});

await step('말로: "주문한 메뉴 보여 주세요" → 다시 읽어 줌', async () => {
  await sayAtConfirm('주문한 메뉴 보여 주세요');
  await waitText('#c-lead', /다시 알려 드릴게요/);
  assert.match(await page.evaluate(() => window.__spoken.at(-1)), /따뜻한 아메리카노 두 잔, 매장 맞으실까요\? 총 7,000원/);
});

await step('말로: "라떼도 하나 추가해 주세요" → 온도 질문 → "아이스요" → 두 메뉴 11,400원', async () => {
  await sayAtConfirm('라떼도 하나 추가해 주세요');
  await page.evaluate(() => window.__queue.push('아이스요'));
  await waitText('#c-total', /^11,400원$/);
  assert.deepEqual(await lines(), ['따뜻한 아메리카노', '아이스 카페라떼']);
  await page.screenshot({ path: `${OUT}01-confirm-two-lines.png`, fullPage: true });
});

await step('안전: "라떼 주세요"는 주문 확정이 아니다 → 안내만, 주문 그대로', async () => {
  await sayAtConfirm('라떼 주세요');
  await waitText('#c-lead', /이대로 주문하시려면/);
  assert.ok(await page.locator('[data-screen="confirm"]').isVisible());
  assert.equal(await text('#c-total'), '11,400원');
});

await step('안전: 없는 메뉴 "딸기 아메리카노 추가해 주세요" → 찾지 못했다고 안내, 주문 그대로', async () => {
  await sayAtConfirm('딸기 아메리카노 추가해 주세요');
  await waitText('#c-lead', /찾지 못했어요/);
  assert.equal(await text('#c-total'), '11,400원');
});

await step('말로: "주문을 취소하고 싶어요" → "주문을 모두 취소할까요?" → "네" → 취소 안내 → 처음 화면 (주문 안 만들어짐)', async () => {
  await sayAtConfirm('주문을 취소하고 싶어요');
  await visible('question');
  assert.equal(await text('#q-text'), '주문을 모두 취소할까요?');
  await page.evaluate(() => window.__queue.push('네'));
  await visible('message');
  assert.equal(await text('#m-title'), '주문을 취소했어요.');
  // 잘못 눌렀으면 되돌릴 수 있다 → 원래 주문 그대로
  await page.getByRole('button', { name: /취소 되돌리기/ }).click();
  await visible('confirm');
  assert.equal(await text('#c-lead'), '취소를 되돌렸어요.');
  assert.equal(await text('#c-total'), '11,400원');
  // 다시 취소하고 이번엔 처음으로
  await sayAtConfirm('주문을 취소하고 싶어요');
  await visible('question');
  await page.getByRole('button', { name: '네, 주문을 취소할게요' }).click();
  await visible('message');
  await page.locator('#m-buttons').getByRole('button', { name: '처음으로' }).click();
  await visible('start');
  assert.ok(!(await page.evaluate(() => window.__spoken.some((t) => t.startsWith('주문이 완료')))), '주문 완료가 나오면 안 됨');
});

await step('버튼으로: ＋ → 2잔 · 온도 바꾸기 → 따뜻한 · 빼기 → "주문할 메뉴가 없어요"', async () => {
  await page.getByRole('button', { name: '텍스트로 테스트' }).click();
  await page.fill('#text-input', '아이스 아메리카노 하나');
  await page.getByRole('button', { name: '주문 분석' }).click();
  await page.getByRole('button', { name: /매장에서 먹어요/ }).click();
  await visible('confirm');
  await page.getByRole('button', { name: '아이스 아메리카노 한 개 더' }).click();
  await waitText('#c-total', /^7,000원$/);
  await page.getByRole('button', { name: '아이스 아메리카노 따뜻하게 바꾸기' }).click();
  await waitText('#c-lines', /따뜻한 아메리카노/);
  await page.getByRole('button', { name: '따뜻한 아메리카노 한 개 빼기' }).click();
  await waitText('#c-total', /^3,500원$/);
  await page.screenshot({ path: `${OUT}02-buttons.png`, fullPage: true });
  await page.getByRole('button', { name: '따뜻한 아메리카노 빼기', exact: true }).click();
  await visible('message');
  assert.equal(await text('#m-title'), '주문할 메뉴가 없어요.');
});

await step('버튼으로: "＋ 메뉴 더 추가하기" → 유자차 → 매장/포장 다시 안 묻고 두 메뉴 → 주문 완료', async () => {
  await home();
  await page.getByRole('button', { name: '텍스트로 테스트' }).click();
  await page.fill('#text-input', '아이스 아메리카노 하나 포장이요');
  await page.getByRole('button', { name: '주문 분석' }).click();
  await visible('confirm');
  await page.getByRole('button', { name: /메뉴 더 추가하기/ }).click();
  await visible('text');
  await page.fill('#text-input', '따뜻한 유자차 하나');
  await page.getByRole('button', { name: '주문 분석' }).click();
  await visible('confirm');
  assert.deepEqual(await lines(), ['아이스 아메리카노', '따뜻한 유자차']);
  assert.equal(await text('#c-total'), '7,000원'); // 포장: 2,000 + 5,000
  await page.getByRole('button', { name: '네, 맞아요' }).click();
  await visible('done');
  assert.match(await text('#d-lines'), /아이스 아메리카노.*따뜻한 유자차/);
});

await step('메뉴 추가 중 "주문 취소할래요" → "아니요, 계속" → 원래 주문으로 돌아옴', async () => {
  await home();
  await page.getByRole('button', { name: '텍스트로 테스트' }).click();
  await page.fill('#text-input', '아이스 아메리카노 하나 매장이요');
  await page.getByRole('button', { name: '주문 분석' }).click();
  await visible('confirm');
  await page.getByRole('button', { name: /메뉴 더 추가하기/ }).click();
  await page.fill('#text-input', '주문 취소할래요');
  await page.getByRole('button', { name: '주문 분석' }).click();
  await visible('question');
  await page.getByRole('button', { name: '아니요, 계속 주문할게요' }).click();
  await visible('confirm');
  assert.deepEqual(await lines(), ['아이스 아메리카노']);
});

await step('어르신 접근성: 고치기 버튼 56px 이상 · 본문 15px 이상 · 가로 스크롤 없음 (390px)', async () => {
  await home();
  await page.getByRole('button', { name: '텍스트로 테스트' }).click();
  await page.fill('#text-input', '아이스 아메리카노 두 잔하고 따뜻한 라떼 하나 매장이요');
  await page.getByRole('button', { name: '주문 분석' }).click();
  await visible('confirm');
  const sizes = await page.$$eval('#c-lines .ctl', (bs) => bs.map((b) => [b.getBoundingClientRect().height, b.getBoundingClientRect().width]));
  assert.ok(sizes.length >= 8 && sizes.every(([h, w]) => h >= 56 && w >= 56), JSON.stringify(sizes));
  const minFont = await page.$$eval('[data-screen="confirm"] *', (els) => Math.min(...els.filter((e) => e.offsetParent && e.textContent.trim() && !e.children.length).map((e) => parseFloat(getComputedStyle(e).fontSize))));
  assert.ok(minFont >= 15, `가장 작은 글씨 ${minFont}px`);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), '가로 스크롤 생김');
  await page.screenshot({ path: `${OUT}03-a11y.png`, fullPage: true });
});

await step('마이크 권한 거부 → "마이크를 쓸 수 없어요" + 직원 도움 · 다시 말하기 (글자 주문은 그대로 가능)', async () => {
  await home();
  await page.evaluate(() => window.__queue.push('__denied__'));
  await page.getByRole('button', { name: /주문 시작/ }).click();
  await visible('message');
  assert.equal(await text('#m-title'), '마이크를 쓸 수 없어요.');
  assert.ok(await page.getByRole('button', { name: '직원에게 도움 요청' }).first().isVisible());
  await home();
  assert.ok(await page.getByRole('button', { name: '텍스트로 테스트' }).isVisible(), '마이크 없이 주문할 다른 방법');
});

await step('태블릿 세로(820×1180): 두 메뉴 확인 화면 — 버튼·합계가 한눈에, 가로 스크롤 없음', async () => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await home();
  await page.getByRole('button', { name: '텍스트로 테스트' }).click();
  await page.fill('#text-input', '아이스 아메리카노 두 잔하고 따뜻한 라떼 하나 매장이요');
  await page.getByRole('button', { name: '주문 분석' }).click();
  await visible('confirm');
  const box = await page.locator('[data-action="confirm-yes"]').boundingBox();
  assert.ok(box.y + box.height <= 1180, `'네, 맞아요' 버튼이 화면 아래로 밀림 (${Math.round(box.y)}px)`);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: `${OUT}04-tablet.png` });
  await page.setViewportSize({ width: 390, height: 844 });
});

await step('마이크 미지원 브라우저: 주문 시작 → "음성 주문이 안 돼요" 안내 + 글자로 주문 가능', async () => {
  const c2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await c2.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; });
  const p2 = await c2.newPage();
  p2.on('pageerror', (e) => errors.push(e.message));
  await p2.goto(BASE);
  await p2.getByRole('button', { name: /주문 시작/ }).click();
  await p2.locator('#voice-unsupported').waitFor({ state: 'visible', timeout: 5000 });
  assert.match(await p2.textContent('#voice-unsupported'), /음성 주문이 안 돼요/);
  await p2.getByRole('button', { name: '텍스트로 테스트' }).click();
  await p2.fill('#text-input', '아이스 아메리카노 하나 매장이요');
  await p2.getByRole('button', { name: '주문 분석' }).click();
  await p2.locator('[data-screen="confirm"]').waitFor({ state: 'visible', timeout: 8000 });
  await c2.close();
});

await step('페이지 JS 오류 없음', async () => assert.deepEqual(errors, []));

await browser.close();
for (const r of results) console.log(r.join('  '));
console.log(`\n스크린샷: ${OUT}`);
if (results.some((r) => r[0] === 'FAIL')) process.exit(1);
