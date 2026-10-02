// 브라우저 E2E 스모크 테스트 (Playwright 필요: 저장소 루트 npm install 후 사용 가능)
// 실행: 서버를 켠 뒤  BASE_URL=http://localhost:3100 npm run test:e2e
// 음성 인식은 가짜(SpeechRecognition 모의 객체)로 대신한다 — 실제 마이크·구글 음성 서버는 사람이 기기에서 확인해야 한다.
import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const OUT = new URL('./screenshots/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });

const MOCK = () => {
  window.__queue = [];
  window.__spoken = [];
  window.__printed = null;
  class FakeRecognition {
    start() {
      this.t = setTimeout(() => {
        const next = window.__queue.shift();
        if (next === undefined || next === '__nospeech__') {
          this.onerror?.({ error: 'no-speech' });
        } else {
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
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      getVoices: () => [],
      cancel() {},
      speak(u) { window.__spoken.push(u.text); setTimeout(() => u.onend?.(), 5); },
    },
  });
  window.print = () => { window.__printed = document.getElementById('print-area').innerHTML; };
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const iphone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push(['PASS', name]);
  } catch (e) {
    results.push(['FAIL', name, e.message.split('\n')[0]]);
  }
}

const ctx = await browser.newContext(iphone);
await ctx.addInitScript(MOCK);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const visible = (screen) => page.locator(`[data-screen="${screen}"]`).waitFor({ state: 'visible', timeout: 5000 });

await page.goto(BASE);
await step('시작 화면 표시', async () => {
  await visible('start');
  assert.ok(await page.getByText('말씀만 해주세요.').isVisible());
  assert.ok(await page.getByRole('button', { name: /주문 시작/ }).isVisible());
  assert.ok(await page.getByRole('button', { name: /직원에게 도움 요청/ }).isVisible());
  await page.screenshot({ path: `${OUT}01-start.png` });
});

await step('텍스트 주문: 두 메뉴 + 온도 확인 → 주문 확인 11,400원', async () => {
  await page.getByRole('button', { name: '텍스트로 테스트' }).click();
  await visible('text');
  await page.fill('#text-input', '아이스 아메리카노 두 잔하고 라떼 하나 주세요.');
  await page.screenshot({ path: `${OUT}02-text.png` });
  await page.getByRole('button', { name: '주문 분석' }).click();
  await visible('question');
  assert.equal(await page.textContent('#q-text'), '카페라떼는 따뜻한 것과 차가운 것 중 어떤 걸로 드릴까요?');
  await page.screenshot({ path: `${OUT}03-question-temp.png` });
  await page.getByRole('button', { name: /따뜻하게/ }).click();
  await visible('confirm');
  assert.equal(await page.textContent('#c-total'), '11,400원');
  await page.screenshot({ path: `${OUT}04-confirm.png` });
});

await step('주문 확정 → 주문번호·카운터 결제 안내', async () => {
  await page.getByRole('button', { name: '네, 맞아요' }).click();
  await visible('done');
  assert.match(await page.textContent('#d-id'), /^GB-\d{8}-\d{3}$/);
  assert.ok(await page.getByText('결제는 카운터에서 해주세요.').isVisible());
  const spoken = await page.evaluate(() => window.__spoken.at(-1));
  assert.match(spoken, /주문이 완료되었습니다\. 주문번호는 \d+번입니다\. 카운터에서 결제해 주세요\./);
  await page.screenshot({ path: `${OUT}05-done.png` });
});

await step('주문서 출력 (브라우저 인쇄)', async () => {
  await page.getByRole('button', { name: /주문서 출력/ }).click();
  await page.waitForFunction(() => window.__printed);
  const html = await page.evaluate(() => window.__printed);
  assert.ok(html.includes('합계: 11,400원') && html.includes('결제: 카운터'));
  await page.emulateMedia({ media: 'print' });
  await page.screenshot({ path: `${OUT}06-receipt-print.png` });
  await page.pdf({ path: `${OUT}06-receipt.pdf`, width: '80mm', height: '160mm' }).catch(() => {});
  await page.emulateMedia({ media: 'screen' });
});

await step('완료 후 자동으로 시작 화면 복귀 (10초)', async () => {
  await page.locator('[data-screen="start"]').waitFor({ state: 'visible', timeout: 13000 });
});

await step('음성 주문: "커피 하나" → 확인 질문 → 네 → 아이스 → 맞아요 → 완료', async () => {
  await page.evaluate(() => window.__queue.push('커피 하나 주세요', '네', '아이스요', '맞아요'));
  await page.getByRole('button', { name: /주문 시작/ }).click();
  await visible('done');
  const spoken = await page.evaluate(() => window.__spoken);
  assert.ok(spoken.includes('듣고 있습니다.'));
  assert.ok(spoken.includes('아메리카노를 말씀하시나요?'));
  assert.ok(spoken.some((t) => t.startsWith('아이스 아메리카노 한 잔 맞으실까요? 총 3,500원입니다.')));
  await page.getByRole('button', { name: /처음으로/ }).click();
});

await step('음성 대답: 처음엔 못 듣고, 안내 음성 메아리는 무시하고, 다시 들어서 "네" 처리', async () => {
  await page.evaluate(() => window.__queue.push(
    '따뜻한 커피 한잔 주문할게', '__nospeech__', '따뜻한 아메리카노를 말씀하시나요', '네',
    '__nospeech__', '맞아요',
  ));
  await page.getByRole('button', { name: /주문 시작/ }).click();
  await visible('done');
  assert.match(await page.textContent('#d-lines'), /따뜻한 아메리카노/);
  await page.getByRole('button', { name: /처음으로/ }).click();
});

await step('음성 대답 3번 못 들음 → 버튼 안내 + "말로 다시 대답하기"', async () => {
  await page.evaluate(() => window.__queue.push('아이스 라떼 하나', '__nospeech__', '__nospeech__', '__nospeech__'));
  await page.getByRole('button', { name: /주문 시작/ }).click();
  await visible('confirm');
  await page.locator('#c-listen').waitFor({ state: 'visible', timeout: 5000 });
  assert.equal(await page.textContent('#c-status'), '버튼을 눌러 주셔도 돼요.');
  await page.screenshot({ path: `${OUT}06b-answer-fallback.png` });
  await page.evaluate(() => window.__queue.push('네'));
  await page.locator('#c-listen').click();
  await visible('done');
  await page.getByRole('button', { name: /처음으로/ }).click();
});

await step('음성: "따뜻한 음료 뭐 먹으면 될까" → 메뉴 보기 → "라떼요" → 따뜻한 카페라떼', async () => {
  await page.evaluate(() => window.__queue.push('따뜻한 음료수 먹고 싶은데 어떤 걸 먹으면 될까', '커피요', '라떼요', '네'));
  await page.getByRole('button', { name: /주문 시작/ }).click();
  await page.waitForFunction(() => document.getElementById('q-text').textContent.startsWith('따뜻한 메뉴예요.'));
  await page.screenshot({ path: `${OUT}06c-suggest.png` });
  await visible('done');
  assert.match(await page.textContent('#d-lines'), /따뜻한 카페라떼/);
  await page.getByRole('button', { name: /처음으로/ }).click();
});

await step('텍스트: 메뉴 보기에서 버튼으로 고르기', async () => {
  await page.getByRole('button', { name: '텍스트로 테스트' }).click();
  await page.fill('#text-input', '시원한 거 뭐 있어요');
  await page.getByRole('button', { name: '주문 분석' }).click();
  await page.locator('#q-choices').getByRole('button', { name: /^커피\s+\(/ }).click();
  await page.getByRole('button', { name: /^아포카토\s+5,400원/ }).click();
  await visible('confirm');
  assert.equal(await page.textContent('#c-total'), '5,400원');
  await page.getByRole('button', { name: /다시 말할게요/ }).click();
  await page.getByRole('button', { name: /처음으로/ }).click();
});

await step('음성: "따뜻한 음료 중에 커피 아닌 거" → 종류 → "차요" → "유자차요" → 따뜻한 유자차 6,000원', async () => {
  await page.evaluate(() => window.__queue.push('따뜻한 음료 중에 커피 아닌 거 추천해 줘', '차요', '유자차요'));
  await page.getByRole('button', { name: /주문 시작/ }).click();
  await page.waitForFunction(() => document.getElementById('q-text').textContent.startsWith('따뜻한 커피 아닌 메뉴예요.'));
  const cats = await page.locator('#q-choices button').allTextContents();
  assert.ok(!cats.some((t) => t.startsWith('커피')), '커피가 보기 안에 있음');
  await page.screenshot({ path: `${OUT}06d-not-coffee.png` });
  await page.waitForFunction(() => document.getElementById('q-text').textContent.startsWith('따뜻한 차예요.'));
  await page.screenshot({ path: `${OUT}06e-tea-list.png` });
  await visible('confirm');
  assert.match(await page.textContent('#c-lines'), /따뜻한 유자차/);
  assert.equal(await page.textContent('#c-total'), '6,000원');
  await page.reload(); // 음성 모드의 '다시 말할게요'는 바로 듣기로 넘어가므로 새로고침으로 처음부터
  await visible('start');
});

await step('음성: 없는 메뉴 "딸기 아메리카노" → 찾지 못했다는 안내', async () => {
  await page.evaluate(() => window.__queue.push('딸기 아메리카노 하나 주세요'));
  await page.getByRole('button', { name: /주문 시작/ }).click();
  await visible('message');
  assert.match(await page.textContent('#m-body'), /딸기 아메리카노.*\n?현재 주문 가능한 메뉴에서 찾지 못했습니다/s);
  await page.screenshot({ path: `${OUT}07-not-found.png` });
});

await step('음성 인식 실패 3회 → 직원 도움 권유', async () => {
  await page.getByRole('button', { name: /처음으로|다시 말하기/ }).first().click();
  // 위에서 이미 1회 실패(없는 메뉴). 2회 더 못 들음
  await page.evaluate(() => window.__queue.push('__nospeech__'));
  await visible('message');
  assert.equal(await page.textContent('#m-title'), '제가 잘 못 들었어요.');
  await page.screenshot({ path: `${OUT}08-not-heard.png` });
  await page.evaluate(() => window.__queue.push('__nospeech__'));
  await page.getByRole('button', { name: '다시 말하기' }).click();
  await page.waitForFunction(() => document.getElementById('m-title').textContent === '직원이 도와드릴게요.');
  await page.screenshot({ path: `${OUT}09-three-fails.png` });
});

await step('직원 도움 요청 → "직원을 호출했습니다."', async () => {
  await page.getByRole('button', { name: /직원에게 도움 요청/ }).first().click();
  await visible('help');
  await page.screenshot({ path: `${OUT}10-help.png` });
});

await step('대시보드: DEMO / TEST DATA + 집계', async () => {
  const d = await ctx.newPage();
  await d.goto(`${BASE}/dashboard`);
  await d.getByText('DEMO / TEST DATA').waitFor();
  await d.waitForSelector('#rows tr');
  const kpi = await d.locator('.kpi').allTextContents();
  assert.ok(kpi.some((t) => t.startsWith('완료 주문')));
  await d.setViewportSize({ width: 1100, height: 900 });
  await d.screenshot({ path: `${OUT}11-dashboard.png`, fullPage: true });
});

await step('가로 스크롤 없음 (390px)', async () => {
  const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(over, false);
});

await step('태블릿 세로 (820x1180) 시작 화면', async () => {
  const t = await browser.newPage({ viewport: { width: 820, height: 1180 } });
  await t.goto(BASE);
  await t.screenshot({ path: `${OUT}12-tablet.png` });
  await t.close();
});

await step('자바스크립트 꺼도 시작 화면 글자가 보임', async () => {
  const noJs = await browser.newContext({ ...iphone, javaScriptEnabled: false });
  const p = await noJs.newPage();
  await p.goto(BASE);
  assert.ok(await p.getByText('말씀만 해주세요.').isVisible());
  await noJs.close();
});

await step('페이지 JS 오류 없음', async () => assert.deepEqual(errors, []));

await browser.close();
for (const r of results) console.log(r.join('  '));
console.log(`\n스크린샷: ${OUT}`);
if (results.some((r) => r[0] === 'FAIL')) process.exit(1);
