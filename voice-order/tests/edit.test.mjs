// 주문 확인 화면의 "고쳐 주세요" — SENIOR VOICE ORDER 지시서 v1.0 §7 예문과 안전 규칙
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseOrder } from '../core/parser.mjs';
import { interpretEdit, applyEdit, editMessage, mergeItems } from '../core/edit.mjs';
import { quote } from '../backend/orderService.mjs';

const menu = JSON.parse(fs.readFileSync(new URL('../data/menu.json', import.meta.url), 'utf8'));
const items = (text) => parseOrder(text, menu).items;
const brief = (list) => list.map((i) => [i.menu_id, i.temperature, i.quantity]);
const run = (text, base) => {
  const cmd = interpretEdit(text, base, menu);
  return { cmd, after: cmd ? applyEdit(base, cmd, menu) : base };
};

test('지시서 예문: 주문 말 3가지는 바로 알아듣는다', () => {
  assert.deepEqual(brief(items('아이스 아메리카노 한 잔 주세요.')), [['AMERICANO', 'ICE', 1]]);
  assert.deepEqual(brief(items('따뜻한 카페라떼 두 잔 주세요.')), [['CAFE_LATTE', 'HOT', 2]]);
  assert.deepEqual(brief(items('바닐라라떼 하나 주세요.')), [['VANILLA_LATTE', null, 1]]); // 온도는 추측하지 않고 묻는다
});

test('지시서 예문: "아이스로 바꿔 주세요" · "한 잔 더 추가해 주세요" · "주문한 메뉴 보여 주세요" · "주문을 취소하고 싶어요"', () => {
  const base = items('따뜻한 아메리카노 한 잔');
  let r = run('아이스로 바꿔 주세요.', base);
  assert.equal(r.cmd.type, 'set_temp');
  assert.deepEqual(brief(r.after), [['AMERICANO', 'ICE', 1]]);
  assert.equal(editMessage(r.cmd, menu), '아메리카노를 아이스로 바꿨어요.');

  r = run('한 잔 더 추가해 주세요.', base);
  assert.deepEqual(brief(r.after), [['AMERICANO', 'HOT', 2]]);
  assert.equal(editMessage(r.cmd, menu), '아메리카노 한 잔 더 넣었어요.');

  assert.equal(interpretEdit('주문한 메뉴 보여 주세요.', base, menu).type, 'show');
  assert.equal(interpretEdit('주문을 취소하고 싶어요.', base, menu).type, 'cancel_order');
});

test('여러 메뉴: 어떤 메뉴인지 말하면 그 메뉴만 바꾸고, 모르면 되묻는다', () => {
  const base = items('따뜻한 아메리카노 한 잔하고 아이스 라떼 두 잔');
  assert.deepEqual(brief(run('라떼 따뜻하게 바꿔 주세요', base).after), [['AMERICANO', 'HOT', 1], ['CAFE_LATTE', 'HOT', 2]]);
  assert.deepEqual(brief(run('라떼 한 잔 빼 주세요', base).after), [['AMERICANO', 'HOT', 1], ['CAFE_LATTE', 'ICE', 1]]);
  assert.deepEqual(brief(run('라떼 빼 주세요', base).after), [['AMERICANO', 'HOT', 1]]);
  assert.deepEqual(brief(run('아메리카노 하나 더 주세요', base).after), [['AMERICANO', 'HOT', 2], ['CAFE_LATTE', 'ICE', 2]]);
  // 메뉴 이름 없이 "한 잔 더" → 어느 쪽인지 모르니 바꾸지 않고 묻는다
  assert.equal(interpretEdit('한 잔 더 추가해 주세요', base, menu).type, 'ask_which');
  // 아이스로 바꿀 수 있는 건 아메리카노 하나뿐 → 그것만
  assert.deepEqual(brief(run('아이스로 바꿔 주세요', base).after), [['AMERICANO', 'ICE', 1], ['CAFE_LATTE', 'ICE', 2]]);
});

test('메뉴 추가: 없던 메뉴는 새 줄로 (온도는 다시 묻게 null), 같은 메뉴는 수량만', () => {
  const base = items('따뜻한 아메리카노 한 잔');
  const add = run('라떼도 하나 추가해 주세요', base);
  assert.equal(add.cmd.type, 'add_items');
  assert.deepEqual(brief(add.after), [['AMERICANO', 'HOT', 1], ['CAFE_LATTE', null, 1]]);
  assert.deepEqual(brief(run('아이스 아메리카노 하나 더 주세요', base).after), [['AMERICANO', 'HOT', 1], ['AMERICANO', 'ICE', 1]]);
  assert.deepEqual(brief(run('두 잔 더 주세요', base).after), [['AMERICANO', 'HOT', 3]]);
});

test('안전: 없는 메뉴·메뉴 이름만 말한 것은 주문 확정("네")으로 받지 않고 주문도 바꾸지 않는다', () => {
  const base = items('따뜻한 아메리카노 한 잔');
  const unknown = interpretEdit('딸기 아메리카노 추가해 주세요', base, menu);
  assert.equal(unknown.type, 'unknown_menu');
  assert.deepEqual(brief(applyEdit(base, unknown, menu)), brief(base));
  assert.equal(interpretEdit('라떼 주세요', base, menu).type, 'unclear'); // "주세요"가 있어도 확정 아님
  for (const yes of ['네', '네 맞아요', '아니요', '맞아요 주문할게요']) assert.equal(interpretEdit(yes, base, menu), null, yes);
});

test('안전: 없는 온도로는 바꾸지 않는다 · 수량은 20잔까지 · 0이 되면 빠진다', () => {
  const lemon = items('레몬 에이드 하나');
  const t = interpretEdit('따뜻하게 바꿔 주세요', lemon, menu);
  assert.ok(!t || t.type === 'temp_unavailable', JSON.stringify(t));
  assert.deepEqual(brief(applyEdit(lemon, { type: 'set_temp', menu_id: lemon[0].menu_id, temperature: lemon[0].temperature, to: 'HOT' }, menu)), brief(lemon));
  const base = items('따뜻한 아메리카노 한 잔');
  assert.equal(applyEdit(base, { type: 'change_qty', menu_id: 'AMERICANO', temperature: 'HOT', delta: 50 }, menu)[0].quantity, 20);
  assert.deepEqual(applyEdit(base, { type: 'change_qty', menu_id: 'AMERICANO', temperature: 'HOT', delta: -1 }, menu), []);
});

test('고친 주문의 가격은 메뉴판(서버 quote)에서 다시 계산된다', () => {
  const base = items('따뜻한 아메리카노 한 잔하고 아이스 라떼 한 잔');
  const after = run('아메리카노 하나 더 주세요', base).after;
  assert.equal(quote(after, menu).total_amount, 3500 * 2 + 4400);
  assert.equal(quote(after, menu, 'TAKEOUT').total_amount, 2000 * 2 + 3400);
  // 같은 메뉴가 두 줄로 나뉘어 있어도 한 줄로 합쳐 다룬다
  assert.deepEqual(brief(mergeItems([...base, ...items('따뜻한 아메리카노 한 잔')])), [['AMERICANO', 'HOT', 2], ['CAFE_LATTE', 'ICE', 1]]);
});

test('가격 데이터가 없으면 가격을 만들지 않고 주문을 막는다', () => {
  const broken = { ...menu, items: menu.items.map((m) => (m.menu_id === 'AMERICANO' ? { ...m, price: undefined } : m)) };
  assert.throws(() => quote(items('아이스 아메리카노 하나'), broken), /가격이 메뉴에 없습니다/);
});
