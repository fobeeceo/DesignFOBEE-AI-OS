// 요구사항 §26 자동 테스트 13항목 + 대답 해석. 실행: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseOrder } from '../core/parser.mjs';
import {
  nextQuestion, applyAnswer, interpretAnswer, suggestionText, groupSuggestions, categoryText, interpretCategory,
} from '../core/dialog.mjs';
import { createOrderService, quote, STATUS, PAY_AT_COUNTER } from '../backend/orderService.mjs';
import { createMemoryStore } from '../backend/store.mjs';
import { createBrowserPrintProvider, createThermalPrintProvider } from '../backend/print/printService.mjs';

const menu = JSON.parse(fs.readFileSync(new URL('../data/menu.json', import.meta.url), 'utf8'));
const brief = (r) => r.items.map((i) => [i.menu_id, i.temperature, i.quantity]);

function service({ printProvider = createBrowserPrintProvider(), clock } = {}) {
  let t = clock || new Date('2026-10-02T01:00:00Z'); // KST 10:00
  return createOrderService({
    store: createMemoryStore(),
    menu,
    printProvider,
    now: () => {
      t = new Date(t.getTime() + 5000); // 호출마다 5초 경과
      return t;
    },
  });
}

/** 질문에 차례로 대답해서 확인 단계까지 간다 */
function resolve(items, answers) {
  let cur = items;
  for (const a of answers) {
    const q = nextQuestion(cur, menu);
    assert.ok(q, `질문이 남아 있어야 함 (대답: ${a})`);
    cur = applyAnswer(cur, q, a, menu);
  }
  assert.equal(nextQuestion(cur, menu), null);
  return cur;
}

test('1. "아이스 아메리카노 하나" → 아메리카노 ICE 1', () => {
  const r = parseOrder('아이스 아메리카노 하나', menu);
  assert.equal(r.kind, 'ok');
  assert.deepEqual(brief(r), [['AMERICANO', 'ICE', 1]]);
});

test('2. "아메리카노 두 잔" → 수량 2, 온도는 추측하지 않고 묻는다', () => {
  const r = parseOrder('아메리카노 두 잔', menu);
  assert.deepEqual(brief(r), [['AMERICANO', null, 2]]);
  assert.equal(r.kind, 'clarify');
  const q = nextQuestion(r.items, menu);
  assert.equal(q.type, 'choose_temperature');
  assert.match(q.text, /아메리카노는 따뜻한 것과 차가운 것/);
  assert.deepEqual(brief({ items: resolve(r.items, ['HOT']) }), [['AMERICANO', 'HOT', 2]]);
});

test('3. "따뜻한 라떼 하나" → 카페라떼 HOT 1', () => {
  const r = parseOrder('따뜻한 라떼 하나', menu);
  assert.equal(r.kind, 'ok');
  assert.deepEqual(brief(r), [['CAFE_LATTE', 'HOT', 1]]);
});

test('4. "아이스 아메리카노 하나하고 라떼 하나" → 두 메뉴, 라떼 온도는 확인', () => {
  const r = parseOrder('아이스 아메리카노 하나하고 라떼 하나', menu);
  assert.deepEqual(brief(r), [['AMERICANO', 'ICE', 1], ['CAFE_LATTE', null, 1]]);
  const items = resolve(r.items, ['ICE']);
  const priced = quote(items, menu);
  assert.equal(priced.total_amount, 3500 + 4400);
});

test('5. "커피 하나" → 확정하지 않고 "아메리카노를 말씀하시나요?"', () => {
  const r = parseOrder('커피 하나 주세요.', menu);
  assert.equal(r.kind, 'clarify');
  const q = nextQuestion(r.items, menu);
  assert.equal(q.type, 'confirm_item');
  assert.equal(q.text, '아메리카노를 말씀하시나요?');
  // "차가운 커피" → "아이스 아메리카노를 말씀하시나요?"
  const cold = parseOrder('차가운 커피 하나 주세요', menu);
  assert.equal(nextQuestion(cold.items, menu).text, '아이스 아메리카노를 말씀하시나요?');
  assert.deepEqual(brief({ items: resolve(cold.items, ['yes']) }), [['AMERICANO', 'ICE', 1]]);
  // "아니요" → 처음부터 다시
  assert.equal(applyAnswer(r.items, q, 'no', menu), null);
});

test('6. 존재하지 않는 메뉴 → not_found, 메뉴를 만들어내지 않는다', () => {
  for (const t of ['딸기 아메리카노 하나 주세요', '고구마 아메리카노 하나', '인절미 빙수 하나', '카푸치노 하나 주세요', '수박 주스 하나']) {
    const r = parseOrder(t, menu);
    assert.equal(r.kind, 'not_found', t);
    assert.equal(r.items.length, 0, t);
  }
  assert.deepEqual(parseOrder('딸기 아메리카노 하나 주세요', menu).unknown, ['딸기 아메리카노']);
  // 서버도 메뉴에 없는 menu_id·임의 가격을 받지 않는다
  assert.throws(() => quote([{ menu_id: 'STRAWBERRY_LATTE', quantity: 1 }], menu));
  const priced = quote([{ menu_id: 'AMERICANO', temperature: 'ICE', quantity: 1, unit_price: 1 }], menu);
  assert.equal(priced.total_amount, 3500);
});

test('7. 직원 도움 요청 → help_requested = true 기록', () => {
  const svc = service();
  const s = svc.startSession('VOICE');
  svc.requestHelp(s.id);
  assert.equal(svc.stats().recent[0].help_requested, true);
  // 시작 화면에서(주문 전) 눌러도 기록된다
  const r = svc.requestHelp(null);
  assert.equal(r.help_requested, true);
  assert.equal(svc.stats().help_requests, 2);
});

test('8. 주문 확정 → CONFIRMED, PAY_AT_COUNTER', () => {
  const svc = service();
  const s = svc.startSession('TEXT');
  const r = svc.parse(s.id, '아이스 아메리카노 하나');
  const order = svc.confirm(s.id, r.items);
  assert.equal(order.status, STATUS.CONFIRMED);
  assert.equal(order.payment_status, PAY_AT_COUNTER);
  assert.equal(order.raw_transcript, '아이스 아메리카노 하나');
  assert.throws(() => svc.confirm(s.id, r.items), /이미 끝난 주문/);
});

test('9. 주문번호 → GB-YYYYMMDD-001부터 하루 단위로 증가', () => {
  const svc = service();
  const ids = [1, 2, 3].map(() => {
    const s = svc.startSession('TEXT');
    return svc.confirm(s.id, [{ menu_id: 'PATBINGSU', quantity: 1 }]).order_id;
  });
  assert.deepEqual(ids, ['GB-20261002-001', 'GB-20261002-002', 'GB-20261002-003']);
  // 한국 시간 자정이 지나면 001부터 (UTC 15:00 = KST 00:00)
  const night = service({ clock: new Date('2026-10-02T14:59:50Z') });
  const a = night.confirm(night.startSession('TEXT').id, [{ menu_id: 'PATBINGSU', quantity: 1 }]).order_id;
  assert.equal(a, 'GB-20261003-001');
});

test('10. 주문 금액 계산 — 가격은 MENU_MASTER에서만, 같은 메뉴는 합친다', () => {
  const r = parseOrder('아이스 아메리카노 두 잔하고 라떼 하나 주세요.', menu);
  const items = resolve(r.items, ['HOT']);
  const p = quote(items, menu);
  assert.deepEqual(p.items.map((l) => [l.display_name, l.quantity, l.line_total]), [
    ['아이스 아메리카노', 2, 7000],
    ['따뜻한 카페라떼', 1, 4400],
  ]);
  assert.equal(p.total_amount, 11400);
  const merged = quote([
    { menu_id: 'AMERICANO', temperature: 'ICE', quantity: 1 },
    { menu_id: 'AMERICANO', temperature: 'ICE', quantity: 2 },
  ], menu);
  assert.equal(merged.items.length, 1);
  assert.equal(merged.total_amount, 10500);
  assert.throws(() => quote([{ menu_id: 'AMERICANO', quantity: 1 }], menu), /온도/);
  assert.throws(() => quote([{ menu_id: 'AMERICANO', temperature: 'ICE', quantity: 0 }], menu), /수량/);
});

test('11. 주문 출력 → 주문번호·메뉴·합계·카운터 결제가 들어간 주문서', async () => {
  const svc = service();
  const s = svc.startSession('VOICE');
  const order = svc.confirm(s.id, [
    { menu_id: 'AMERICANO', temperature: 'ICE', quantity: 1 },
    { menu_id: 'CAFE_LATTE', temperature: 'ICE', quantity: 1 },
  ]);
  const out = await svc.print(order.order_id);
  assert.equal(out.ok, true);
  for (const s2 of ['GBRICK COFFEE', 'AI VOICE ORDER', order.order_id, '아이스 아메리카노', '아이스 카페라떼', '합계: 7,900원', '결제: 카운터']) {
    assert.ok(out.html.includes(s2), `주문서에 "${s2}" 없음`);
  }
  assert.equal(svc.reportPrint(order.order_id, true).print_status, 'PRINTED');
});

test('12. 출력 실패 → PRINT_FAILED 기록, 주문은 그대로 유지', async () => {
  const svc = service({ printProvider: createThermalPrintProvider() });
  const s = svc.startSession('VOICE');
  const order = svc.confirm(s.id, [{ menu_id: 'PATBINGSU', quantity: 1 }]);
  const out = await svc.print(order.order_id);
  assert.equal(out.ok, false);
  assert.equal(out.print_status, 'PRINT_FAILED');
  const saved = svc.stats().recent[0];
  assert.equal(saved.status, STATUS.CONFIRMED);
  assert.equal(saved.print_status, 'PRINT_FAILED');
  await assert.rejects(svc.print('GB-20261002-999'), /찾을 수 없/);
});

test('13. 주문 초기화 → 진행 중 주문을 닫는다 (실패가 있었으면 FAILED)', () => {
  const svc = service();
  const a = svc.startSession('VOICE');
  svc.parse(a.id, '아이스 아메리카노 하나');
  assert.equal(svc.cancel(a.id).status, STATUS.CANCELLED);
  assert.throws(() => svc.parse(a.id, '라떼 하나'), /이미 끝난/);

  const b = svc.startSession('VOICE');
  svc.parse(b.id, '딸기 아메리카노 하나');
  svc.recordFailure(b.id, 'no-speech');
  assert.equal(svc.stats().recent[0].fail_count, 2);
  assert.equal(svc.cancel(b.id).status, STATUS.FAILED);

  const st = svc.stats();
  assert.equal(st.test_sessions, 2);
  assert.equal(st.failed, 1);
  assert.equal(st.completed, 0);
});

test('대답 해석: 네/맞아요/응 → yes, 아니요/다시 → no, 온도 말하기', () => {
  for (const t of ['네', '네 맞아요', '맞아요', '맞습니다', '응', '예', '네, 그렇게 해 주세요']) assert.equal(interpretAnswer(t), 'yes', t);
  for (const t of ['아니요', '아뇨', '아니 다시 할게요', '다시 말할게요']) assert.equal(interpretAnswer(t), 'no', t);
  assert.equal(interpretAnswer('따뜻한 걸로요'), 'HOT');
  assert.equal(interpretAnswer('아이스요'), 'ICE');
  assert.equal(interpretAnswer('차갑게 주세요'), 'ICE');
  assert.equal(interpretAnswer(''), null);
  assert.equal(interpretAnswer('음'), null);
});

test('자연어 표현 (요구사항 §9)', () => {
  const cases = {
    '아이스 아메리카노 하나': [['AMERICANO', 'ICE', 1]],
    '따뜻한 아메리카노 한 잔': [['AMERICANO', 'HOT', 1]],
    '라떼 하나': [['CAFE_LATTE', null, 1]],
    '아이스 라떼 하나': [['CAFE_LATTE', 'ICE', 1]],
    '바닐라라떼 두 잔': [['VANILLA_LATTE', null, 2]],
    '바닐라 라떼 세 잔이요': [['VANILLA_LATTE', null, 3]],
    '아이스아메리카노2잔': [['AMERICANO', 'ICE', 2]],
    '아메리카노 아이스로 하나 라떼 따뜻하게 두 잔': [['AMERICANO', 'ICE', 1], ['CAFE_LATTE', 'HOT', 2]],
    '여기요 아이스 아메리카노 한 잔 주세요': [['AMERICANO', 'ICE', 1]],
    '레몬 아메리카노 하나': [['LEMON_AMERICANO', 'ICE', 1]],
    '오렌지 아메리카노 두 개': [['ORANGE_AMERICANO', 'ICE', 2]],
    '팥빙수 하나': [['PATBINGSU', null, 1]],
  };
  for (const [t, want] of Object.entries(cases)) assert.deepEqual(brief(parseOrder(t, menu)), want, t);
  // 아이스만 있는 메뉴를 따뜻하게 주문 → 묻는다
  const lemon = parseOrder('따뜻한 레몬 아메리카노 하나', menu);
  assert.equal(nextQuestion(lemon.items, menu).text, '레몬 아메리카노는 아이스만 있어요. 아이스로 드릴까요?');
  // 알아듣지 못한 말
  assert.equal(parseOrder('음', menu).kind, 'unclear');
  assert.equal(parseOrder('', menu).kind, 'unclear');
  assert.deepEqual(parseOrder('아메리카노 하나랑 카푸치노 하나', menu).unrecognized, ['카푸치노']);
});

test('메뉴를 모를 때: "따뜻한 음료 뭐 먹으면 될까" → 메뉴판의 보기만 제시 (대신 골라 담지 않음)', () => {
  const r = parseOrder('따뜻한 음료수 먹고 싶은데 어떤 걸 먹으면 될까', menu);
  assert.equal(r.kind, 'suggest');
  assert.equal(r.items.length, 0);
  // 보기는 메뉴판에 있고, 판매 중이고, 따뜻하게 되는 것만
  for (const x of r.suggestions) {
    const def = menu.items.find((m) => m.menu_id === x.menu_id);
    assert.ok(def.available !== false && def.options.temperature.includes('HOT'), x.name);
  }
  assert.ok(!r.suggestions.some((x) => x.menu_id === 'VIN_CHAUD'), '판매 중지(동절기) 메뉴는 보기에서 뺀다');
  // 커피·차·라떼가 섞여 많으면 종류부터 고르게 한다
  const groups = groupSuggestions(r.suggestions);
  assert.deepEqual(groups.map((g) => g.label), ['커피', '라떼·음료', '차']);
  assert.equal(categoryText(r, groups), '따뜻하게 드실 수 있는 메뉴는 커피, 라떼·음료, 차 종류가 있어요. 어떤 종류로 보여드릴까요?');
  // 가격은 MENU_MASTER 그대로
  assert.equal(r.suggestions[0].price, 3500);
  assert.equal(parseOrder('따뜻한 거 하나 주세요', menu).kind, 'suggest');
  // 없는 메뉴는 여전히 not_found, 메뉴 이름이 있으면 주문으로
  assert.equal(parseOrder('딸기 아메리카노 뭐 있어요', menu).kind, 'not_found');
  assert.equal(parseOrder('아이스 아메리카노 하나', menu).kind, 'ok');
});

test('대표 지적 2026-10-03: "따뜻한 음료 중 커피 아닌 것" → 커피를 빼고 차·라떼 종류를 보여준다', () => {
  for (const t of ['따뜻한 음료 중에 커피 아닌 거 추천해 줘', '커피 말고 따뜻한 거 뭐 있어요', '카페인 없는 따뜻한 거 있어요?']) {
    const r = parseOrder(t, menu);
    assert.equal(r.kind, 'suggest', t);
    assert.equal(r.not_coffee, true, t);
    assert.ok(!r.suggestions.some((x) => x.category === 'COFFEE'), `${t} → 커피가 섞임`);
    assert.deepEqual(groupSuggestions(r.suggestions).map((g) => g.category), ['DRINK', 'TEA'], t);
  }
  const tea = parseOrder('따뜻한 차 뭐 있어요', menu);
  assert.ok(tea.suggestions.every((x) => x.category === 'TEA'));
  assert.equal(suggestionText(tea), '따뜻하게 드실 수 있는 메뉴는 캐모마일, 페퍼민트, 녹차, 보이차, 자몽차, 오미자차, 레몬차, 유자차, 생강차가 있어요. 어떤 걸로 드릴까요?');
  assert.equal(parseOrder('차가운 거 뭐 있어요', menu).category, null, '"차가운"의 차는 차(茶)가 아니다');
  assert.equal(interpretCategory('차요'), 'TEA');
  assert.equal(interpretCategory('라떼 종류요'), 'DRINK');
  assert.equal(interpretCategory('차가운 거'), null);
  // 커피 말고 + 메뉴 이름이 있으면 그 메뉴로 주문
  assert.deepEqual(brief(parseOrder('커피 말고 유자차 따뜻하게 주세요', menu)), [['YUZU_TEA', 'HOT', 1]]);
});

test('음료·차 주문과 온도별 가격 (메뉴판 public/gbrick-menu.html 기준)', () => {
  const cases = {
    '유자차 따뜻하게 하나': [['YUZU_TEA', 'HOT', 1]],
    '말차라떼 아이스 하나': [['MATCHA_LATTE', 'ICE', 1]],
    '핫초코 하나': [['CHOCO_LATTE', 'HOT', 1]],
    '딸기라떼 하나 주세요': [['STRAWBERRY_LATTE', 'ICE', 1]],
    '보이차 두 잔': [['PUER_TEA', 'HOT', 2]],
    '12곡 라떼 따뜻하게': [['GRAIN_LATTE', 'HOT', 1]],
    '아이스 아메리카노 하나하고 따뜻한 생강차 하나': [['AMERICANO', 'ICE', 1], ['GINGER_TEA', 'HOT', 1]],
  };
  for (const [t, want] of Object.entries(cases)) assert.deepEqual(brief(parseOrder(t, menu)), want, t);
  // 같은 메뉴라도 온도별 가격이 다르다: 말차 라떼 따뜻 4,900 / 아이스 5,500
  assert.equal(quote([{ menu_id: 'MATCHA_LATTE', temperature: 'HOT', quantity: 1 }], menu).total_amount, 4900);
  assert.equal(quote([{ menu_id: 'MATCHA_LATTE', temperature: 'ICE', quantity: 2 }], menu).total_amount, 11000);
  // 동절기 한정(판매 중지)은 주문되지 않는다
  assert.equal(parseOrder('밀크티 하나', menu).kind, 'unavailable');
  assert.throws(() => quote([{ menu_id: 'VIN_CHAUD', temperature: 'HOT', quantity: 1 }], menu));
  // 모든 메뉴는 고를 수 있는 온도마다 가격이 있어야 한다
  for (const m of menu.items) {
    for (const t of m.options.temperature || [null]) {
      const p = typeof m.price === 'number' ? m.price : m.price[t];
      assert.ok(Number.isInteger(p) && p > 0, `${m.name} ${t} 가격 없음`);
    }
  }
});
