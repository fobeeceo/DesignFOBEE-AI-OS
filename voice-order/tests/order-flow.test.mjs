// 요구사항 §26 자동 테스트 13항목 + 대답 해석. 실행: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseOrder } from '../core/parser.mjs';
import {
  nextQuestion, applyAnswer, interpretAnswer, suggestionText, groupSuggestions, categoryText, interpretCategory, interpretDining,
} from '../core/dialog.mjs';
import { createOrderService, quote, STATUS, PAY_AT_COUNTER } from '../backend/orderService.mjs';
import { createMemoryStore } from '../backend/store.mjs';
import { answerFromKnowledge } from '../core/knowledge.mjs';
import { unansweredQuestions } from '../backend/orderService.mjs';
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
  for (const t of ['딸기 아메리카노 하나 주세요', '고구마 아메리카노 하나', '인절미 빙수 하나', '아인슈페너 하나 주세요', '수박 주스 하나']) {
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
    return svc.confirm(s.id, [{ menu_id: 'ESPRESSO', temperature: 'HOT', quantity: 1 }]).order_id;
  });
  assert.deepEqual(ids, ['GB-20261002-001', 'GB-20261002-002', 'GB-20261002-003']);
  // 한국 시간 자정이 지나면 001부터 (UTC 15:00 = KST 00:00)
  const night = service({ clock: new Date('2026-10-02T14:59:50Z') });
  const a = night.confirm(night.startSession('TEXT').id, [{ menu_id: 'ESPRESSO', temperature: 'HOT', quantity: 1 }]).order_id;
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
  const order = svc.confirm(s.id, [{ menu_id: 'ESPRESSO', temperature: 'HOT', quantity: 1 }]);
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
    '에스프레소 하나': [['ESPRESSO', 'HOT', 1]],
    '아포카토 두 개': [['AFFOGATO', 'ICE', 2]],
    '카푸치노 따뜻하게 한 잔': [['CAPPUCCINO', 'HOT', 1]],
    '헤이즐넛 라떼 아이스로 하나': [['HAZELNUT_LATTE', 'ICE', 1]],
  };
  for (const [t, want] of Object.entries(cases)) assert.deepEqual(brief(parseOrder(t, menu)), want, t);
  // 아이스만 있는 메뉴를 따뜻하게 주문 → 묻는다
  const berry = parseOrder('따뜻한 딸기 라떼 하나', menu);
  assert.equal(nextQuestion(berry.items, menu).text, '딸기 라떼는 아이스만 있어요. 아이스로 드릴까요?');
  // 알아듣지 못한 말
  assert.equal(parseOrder('음', menu).kind, 'unclear');
  assert.equal(parseOrder('', menu).kind, 'unclear');
  assert.deepEqual(parseOrder('아메리카노 하나랑 아인슈페너 하나', menu).unrecognized, ['아인슈페너']);
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
  assert.equal(r.suggestions.find((x) => x.menu_id === 'AMERICANO').price, 3500);
  assert.equal(parseOrder('따뜻한 거 하나 주세요', menu).kind, 'suggest');
  // 없는 메뉴는 여전히 not_found, 메뉴 이름이 있으면 주문으로
  assert.equal(parseOrder('딸기 아메리카노 뭐 있어요', menu).kind, 'not_found');
  assert.equal(parseOrder('아이스 아메리카노 하나', menu).kind, 'ok');
});

test('대표 지적 2026-10-03: "따뜻한 음료 중 커피 아닌 것" → 커피를 빼고 차·라떼 종류를 보여준다', () => {
  for (const t of ['따뜻한 음료 중에 커피 아닌 거 추천해 줘', '커피 말고 따뜻한 거 뭐 있어요', '커피 아닌 따뜻한 거 있어요?']) {
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

test('대표 지시 2026-10-03: 가격은 실제 메뉴판(10/1 승인) 기준', () => {
  const price = (id, t) => quote([{ menu_id: id, temperature: t, quantity: 1 }], menu).total_amount;
  assert.equal(price('AMERICANO', 'HOT'), 3500);
  assert.equal(price('CAFE_LATTE', 'ICE'), 4400);
  assert.equal(price('VANILLA_LATTE', 'HOT'), 4900); // 지시서 4,800 → 메뉴판 4,900
  assert.equal(price('HAND_DRIP', 'HOT'), 5000);
  assert.equal(price('HAND_DRIP', 'ICE'), 6000);
  // 메뉴판에 없는 레몬·오렌지 아메리카노는 없다
  assert.ok(!menu.items.some((m) => /LEMON_AMERICANO|ORANGE_AMERICANO/.test(m.menu_id)));
  // 팥빙수는 12,000원, 하절기 한정 → 지금은 주문 불가
  const bingsu = menu.items.find((m) => m.menu_id === 'PATBINGSU');
  assert.equal(bingsu.price, 12000);
  assert.equal(parseOrder('팥빙수 하나', menu).kind, 'unavailable');
  // "바닐라라떼"라고 해도 메뉴판 이름(바닐라빈 라떼)으로 받는다
  assert.deepEqual(brief(parseOrder('아이스 바닐라라떼 하나', menu)), [['VANILLA_LATTE', 'ICE', 1]]);
  // 차·에이드 둘 다 있는 "오미자"는 바로 담지 않고 묻는다
  const omija = parseOrder('오미자 하나', menu);
  assert.equal(nextQuestion(omija.items, menu).text, '오미자차를 말씀하시나요?');
});

test('보기가 많으면 음성은 몇 가지만 읽는다 (따뜻한 커피 16가지)', () => {
  const r = parseOrder('따뜻한 커피 뭐 있어요', menu);
  assert.equal(r.kind, 'suggest');
  assert.ok(r.suggestions.every((x) => x.category === 'COFFEE'));
  assert.equal(suggestionText(r), `따뜻하게 드실 수 있는 메뉴는 에스프레소, 더블 에스프레소, 스윗 에스프레소, 코코아 에스프레소 등 ${r.suggestions.length}가지가 있어요. 화면에서 골라 주시거나 메뉴 이름을 말씀해 주세요.`);
  // 메뉴판에서 빠진 레몬 아메리카노는 아메리카노로 바꿔 담지 않는다
  assert.deepEqual(parseOrder('레몬 아메리카노 하나', menu).unknown, ['레몬 아메리카노']);
});

// ---------- 메뉴 지식 문서 (1단계) ----------
const knowledge = JSON.parse(fs.readFileSync(new URL('../data/knowledge.example.json', import.meta.url), 'utf8'));
const ask = (t, k = knowledge) => answerFromKnowledge(t, menu, k, parseOrder(t, menu));

test('지식 문서가 비어 있으면 지어내지 않고 "잘 몰라요" (얼음 갈리는 음료, 많이 팔리는 메뉴, 카페인)', () => {
  for (const t of ['얼음 갈리는 음료는 어떤 거야?', '어떤 게 많이 팔려요?', '인기 메뉴 뭐예요', '카페인 없는 따뜻한 거 있어요?']) {
    const r = ask(t);
    assert.equal(r?.kind, 'unanswered', t);
    assert.match(r.answer, /직원에게 물어봐/);
  }
  // 그냥 "추천해 주세요"는 추천 메뉴가 없으면 메뉴 보기로 넘어간다 (막지 않음)
  assert.equal(ask('추천해 주세요'), null);
  // 주문은 지식 문서가 가로채지 않는다
  assert.equal(ask('아이스 아메리카노 하나'), null);
});

test('대표가 지식 문서를 채우면 그 내용으로만 답한다', () => {
  const filled = structuredClone(knowledge);
  filled.tags.find((x) => x.id === 'BLENDED').menu_ids = ['JAVA_CHIP_FRAPPE', 'COOKIE_CREAM_FRAPPE', 'NO_SUCH_ID'];
  filled.recommended.menu_ids = ['AMERICANO', 'YUZU_TEA'];
  filled.faq = [{ match: ['덜 달게'], answer: '네, 직원에게 덜 달게 해 달라고 말씀해 주세요.' }];

  const blended = ask('얼음 갈리는 음료는 어떤 거야?', filled);
  assert.equal(blended.kind, 'suggest');
  assert.deepEqual(blended.suggestions.map((x) => x.menu_id), ['JAVA_CHIP_FRAPPE', 'COOKIE_CREAM_FRAPPE'], '없는 id는 무시');

  const popular = ask('어떤 게 많이 팔려요?', filled);
  assert.equal(popular.kind, 'suggest');
  assert.match(popular.speech, /^판매 순위는 아직 모으지 않았어요\. 대신 저희 매장 추천 메뉴는 아메리카노, 유자차예요/, '판매 순위를 지어내지 않는다');
  assert.equal(ask('추천해 주세요', filled).source, 'recommended');

  assert.equal(ask('덜 달게 해 주실 수 있어요?', filled).answer, '네, 직원에게 덜 달게 해 달라고 말씀해 주세요.');
});

test('메뉴 설명은 메뉴판 원문(description)으로 답한다', () => {
  const r = ask('프라페가 뭐예요?');
  assert.equal(r.kind, 'info');
  assert.equal(r.answer, '자바칩 프라페: 파우더 + 소스 + 우유 + 얼음\n쿠키앤크림 프라페: 파우더 + 소스 + 우유 + 얼음');
  assert.match(ask('라씨는 뭐 들어가요?').answer, /요거트 플레인 라씨: 요거트 \+ 우유 \+ 얼음/);
  // 설명이 없는 메뉴는 모른다고 한다
  assert.equal(ask('유자차는 뭐 들어가요?').kind, 'unanswered');
});

test('답 못 한 질문은 주문 기록에서 자동 집계된다 (같은 말 묶음, 많이 나온 순)', () => {
  const svc = createOrderService({ store: createMemoryStore(), menu, printProvider: createBrowserPrintProvider(), getKnowledge: () => knowledge });
  for (const t of ['얼음 갈리는 음료는 어떤 거야?', '얼음 갈리는 음료는 어떤 거야', '아인슈페너 하나', '아이스 아메리카노 하나']) {
    svc.parse(svc.startSession('VOICE').id, t);
  }
  const ua = svc.stats().unanswered;
  assert.deepEqual(ua.map((q) => [q.text, q.count, q.label]), [
    ['얼음 갈리는 음료는 어떤 거야', 2, '질문에 답 못 함'],
    ['아인슈페너 하나', 1, '메뉴에서 못 찾음'],
  ]);
  // 7일 지난 기록은 빠진다
  assert.equal(unansweredQuestions(svc.stats().recent, new Date(Date.now() + 8 * 86400000)).length, 0);
});

test('BUG-01: 수량 뒤에 말한 온도도 알아듣는다 (TEST A~H)', () => {
  const cases = [
    ['A', '아메리카노 한 잔 차갑게 주세요', [['AMERICANO', 'ICE', 1]]],
    ['B', '아메리카노 한 잔 따뜻하게 주세요', [['AMERICANO', 'HOT', 1]]],
    ['C', '유자차 한 잔 따뜻하게 주세요', [['YUZU_TEA', 'HOT', 1]]],
    ['D', '아메리카노 차갑게 한 잔 주세요', [['AMERICANO', 'ICE', 1]]],
    ['E', '따뜻한 아메리카노 한 잔 주세요', [['AMERICANO', 'HOT', 1]]],
    ['F', '아이스 아메리카노 하나 주세요', [['AMERICANO', 'ICE', 1]]],
    ['H', '아메리카노 한 잔 차갑게 하고 라떼 한 잔 따뜻하게 주세요', [['AMERICANO', 'ICE', 1], ['CAFE_LATTE', 'HOT', 1]]],
    ['H-그리고', '아메리카노 한 잔 차갑게 그리고 라떼 한 잔 따뜻하게 주세요', [['AMERICANO', 'ICE', 1], ['CAFE_LATTE', 'HOT', 1]]],
    ['H-랑', '아메리카노 한 잔 차갑게랑 라떼 한 잔 따뜻하게요', [['AMERICANO', 'ICE', 1], ['CAFE_LATTE', 'HOT', 1]]],
  ];
  for (const [id, text, want] of cases) {
    const r = parseOrder(text, menu);
    assert.equal(r.kind, 'ok', `TEST ${id}: ${text}`);
    assert.deepEqual(brief(r), want, `TEST ${id}: ${text}`);
  }
  // TEST G: 온도를 말하지 않으면 추측하지 않고 묻는다
  const g = parseOrder('라떼 한 잔 주세요', menu);
  assert.deepEqual(brief(g), [['CAFE_LATTE', null, 1]]);
  assert.equal(nextQuestion(g.items, menu).type, 'choose_temperature');
  // 앞 메뉴의 온도가 다음 메뉴로 넘어가지 않는다
  assert.deepEqual(brief(parseOrder('아이스 아메리카노 한 잔 하고 라떼 한 잔', menu)), [['AMERICANO', 'ICE', 1], ['CAFE_LATTE', null, 1]]);
  // 모순된 말은 묻는다
  assert.deepEqual(brief(parseOrder('아메리카노 한 잔 따뜻하게 차갑게', menu)), [['AMERICANO', null, 1]]);
});

test('포장 할인 (대표 지시 2026-10-07): 아메리카노 -1,500원, 그 밖의 음료 -1,000원 (잔당), 핸드드립·뱅쇼·빙수는 할인 없음', () => {
  const items = [
    { menu_id: 'AMERICANO', temperature: 'ICE', quantity: 2 }, // 3,500 → 2,000
    { menu_id: 'CAFE_LATTE', temperature: 'HOT', quantity: 1 }, // 4,400 → 3,400
    { menu_id: 'HAND_DRIP', temperature: 'ICE', quantity: 1 }, // 핸드드립은 할인 안 함 (대표 지시)
    { menu_id: 'YUZU_TEA', temperature: 'HOT', quantity: 1 }, // 차 6,000 → 5,000
  ];
  const take = quote(items, menu, 'TAKEOUT');
  assert.deepEqual(take.items.map((l) => [l.menu_id, l.list_price, l.discount, l.unit_price, l.line_total]), [
    ['AMERICANO', 3500, 1500, 2000, 4000],
    ['CAFE_LATTE', 4400, 1000, 3400, 3400],
    ['HAND_DRIP', 6000, 0, 6000, 6000],
    ['YUZU_TEA', 6000, 1000, 5000, 5000],
  ]);
  assert.equal(take.list_amount, 3500 * 2 + 4400 + 6000 + 6000);
  assert.equal(take.discount_amount, 1500 * 2 + 1000 * 2);
  assert.equal(take.total_amount, take.list_amount - take.discount_amount);
  assert.equal(take.dining, 'TAKEOUT');
  // 매장 / 선택 전에는 정상가
  for (const dining of ['DINE_IN', undefined]) {
    const r = quote(items, menu, dining);
    assert.equal(r.discount_amount, 0);
    assert.equal(r.total_amount, r.list_amount);
  }
  assert.throws(() => quote(items, menu, 'DELIVERY'), /매장\/포장/);
  // 뱅쇼·빙수(디저트)도 할인 안 함 — 판매 시작(available=true)해도 마찬가지
  const seasonal = { ...menu, items: menu.items.map((m) => ({ ...m, available: true })) };
  const s2 = quote([{ menu_id: 'VIN_CHAUD', temperature: 'HOT', quantity: 1 }, { menu_id: 'PATBINGSU', quantity: 1 }, { menu_id: 'MANGO_BINGSU', quantity: 1 }], seasonal, 'TAKEOUT');
  assert.equal(s2.discount_amount, 0);
});

test('매장/포장 말하기: "포장이요"·"가져갈게요" → TAKEOUT, "먹고 갈게요"·"매장에서" → DINE_IN, 말 안 하면 null', () => {
  const cases = [
    ['아이스 아메리카노 하나 포장이요', 'TAKEOUT'],
    ['아메리카노 한 잔 가져갈게요', 'TAKEOUT'],
    ['라떼 두 잔 테이크아웃', 'TAKEOUT'],
    ['따뜻한 라떼 한 잔 먹고 갈게요', 'DINE_IN'],
    ['매장에서 마실게요 아메리카노 차갑게 한 잔', 'DINE_IN'],
    ['아이스 아메리카노 하나', null],
  ];
  for (const [text, want] of cases) {
    const r = parseOrder(text, menu);
    assert.equal(r.dining, want, text);
    assert.deepEqual(r.unrecognized, [], `${text}: 매장/포장 말이 '못 알아들은 말'로 남지 않는다`);
  }
  assert.equal(parseOrder('매장 말고 포장이요', menu).dining, null); // 둘 다 말하면 추측하지 않고 묻는다
  assert.equal(interpretDining('포장해 주세요'), 'TAKEOUT');
  assert.equal(interpretDining('여기서 먹을게요'), 'DINE_IN');
  assert.equal(interpretDining('네'), null);
});
