// 주문 확인 화면에서 손님이 하는 "고쳐 주세요" 말과 화면 버튼을 주문 내용에 반영한다.
// 가격은 여기서 다루지 않는다 — 바뀐 주문은 다시 서버 quote()로 가격을 받는다.
// 확실하지 않으면 바꾸지 않고 되묻는다 (어떤 메뉴인지 모르면 ask_which).
import { parseOrder, detectTemperature } from './parser.mjs';
import { josa, qtyWord } from './format.mjs';

export const MAX_EDIT_QTY = 20; // 서버 quote()의 MAX_QTY와 같다

const CANCEL_RE = /주문.{0,6}취소|취소\s*(?:하고\s*싶|할래|할게|해\s*주|해줘|해요)|다\s*취소|전부\s*취소|(?:안|그만)\s*(?:살래|먹을래|마실래|할래|할게)|주문\s*안\s*(?:할|해)/;
const SHOW_RE = /보여\s*주|보여줘|다시\s*(?:말해|읽어|알려)|뭐\s*(?:시켰|주문했)|주문(?:한|했던)\s*(?:거|것|메뉴)|주문\s*내역|확인해\s*주/;
const REMOVE_RE = /빼|없애|지워|취소/;
const ADD_RE = /더\s*(?:주|추가|넣|시킬|할|요|$)|추가/;
const NUM_WORDS = { 한: 1, 하나: 1, 두: 2, 둘: 2, 세: 3, 셋: 3, 석: 3, 네: 4, 넷: 4, 다섯: 5 };
const QTY_RE = /(\d{1,2}|한|두|세|석|네|하나|둘|셋|넷|다섯)\s*(?:잔|개|컵)?\s*(?:더|추가|빼|만)/;

const sameLine = (a, b) => a.menu_id === b.menu_id && (a.temperature || null) === (b.temperature || null);
const allowedTemps = (menu, id) => menu.items.find((m) => m.menu_id === id)?.options?.temperature || [];

/** 같은 메뉴·같은 온도는 한 줄로 (서버 quote()와 같은 규칙) */
export function mergeItems(items) {
  const out = [];
  for (const it of items) {
    const prev = out.find((o) => sameLine(o, it));
    if (prev) prev.quantity += it.quantity;
    else out.push({ ...it });
  }
  return out;
}

function qtyIn(text) {
  const m = QTY_RE.exec(text);
  if (!m) return 1;
  return /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : NUM_WORDS[m[1]] || 1;
}

/**
 * 확인 화면에서 들은 말 → 수정 명령. 수정 말이 아니면 null (→ 네/아니요로 해석)
 * 명령: cancel_order | show | change_qty | remove | set_temp | add_items | ask_which | temp_unavailable | unknown_menu | unclear
 */
export function interpretEdit(text, items, menu) {
  const t = String(text || '').trim();
  if (!t) return null;
  const lines = mergeItems(items);
  const parsed = parseOrder(t, menu);
  const named = parsed.items; // 말 속의 메뉴 (온도·수량 포함)
  const inOrder = named.map((n) => lines.find((l) => l.menu_id === n.menu_id)).filter(Boolean);

  if (!named.length && CANCEL_RE.test(t)) return { type: 'cancel_order' };
  if (SHOW_RE.test(t)) return { type: 'show' };

  // 빼기: "아메리카노 빼 주세요" / "라떼 한 잔 빼 주세요"
  if (REMOVE_RE.test(t) && !ADD_RE.test(t)) {
    const target = inOrder.length === 1 ? inOrder[0] : !named.length && lines.length === 1 ? lines[0] : null;
    if (!target) return named.length || lines.length > 1 ? { type: 'ask_which', action: 'remove' } : null;
    const n = QTY_RE.test(t) ? qtyIn(t) : null;
    return n ? { type: 'change_qty', menu_id: target.menu_id, temperature: target.temperature, delta: -n } : { type: 'remove', menu_id: target.menu_id, temperature: target.temperature };
  }

  // 더하기: "한 잔 더 추가해 주세요" / "라떼도 하나 추가해 주세요"
  if (ADD_RE.test(t)) {
    if (named.length) {
      const fresh = named.filter((n) => !lines.some((l) => l.menu_id === n.menu_id && (!n.temperature || l.temperature === n.temperature)));
      if (!fresh.length && inOrder.length === 1) {
        const l = lines.find((x) => x.menu_id === named[0].menu_id && (!named[0].temperature || x.temperature === named[0].temperature));
        return { type: 'change_qty', menu_id: l.menu_id, temperature: l.temperature, delta: qtyIn(t) };
      }
      return { type: 'add_items', items: named };
    }
    if (parsed.unknown.length) return { type: 'unknown_menu', unknown: parsed.unknown }; // 없는 메뉴 → 만들어 넣지 않는다
    if (lines.length === 1) return { type: 'change_qty', menu_id: lines[0].menu_id, temperature: lines[0].temperature, delta: qtyIn(t) };
    return { type: 'ask_which', action: 'add' };
  }

  // 온도 바꾸기: "아이스로 바꿔 주세요" / "라떼는 따뜻하게요"
  const to = detectTemperature(t);
  if (to) {
    const pool = inOrder.length ? inOrder : lines;
    const changeable = pool.filter((l) => l.temperature !== to && allowedTemps(menu, l.menu_id).length > 1);
    if (changeable.length === 1) {
      const l = changeable[0];
      if (!allowedTemps(menu, l.menu_id).includes(to)) return { type: 'temp_unavailable', menu_id: l.menu_id, to };
      return { type: 'set_temp', menu_id: l.menu_id, temperature: l.temperature, to };
    }
    if (!changeable.length) {
      const only = pool.find((l) => !allowedTemps(menu, l.menu_id).includes(to));
      if (only) return { type: 'temp_unavailable', menu_id: only.menu_id, to };
      return null; // 이미 그 온도 → "네, 아이스로요" 같은 확인 대답
    }
    return { type: 'ask_which', action: 'set_temp' };
  }
  // 메뉴 이름·없는 메뉴·고치는 말이 들어 있으면 '네'(주문 확정)로 받지 않는다 — "라떼 주세요"를 확정으로 착각하지 않게
  if (parsed.unknown.length) return { type: 'unknown_menu', unknown: parsed.unknown };
  if (named.length || REMOVE_RE.test(t)) return { type: 'unclear' };
  return null;
}

/** 명령을 반영한 새 주문 목록 (원본은 바꾸지 않는다) */
export function applyEdit(items, cmd, menu) {
  let lines = mergeItems(items);
  const hit = (l) => l.menu_id === cmd.menu_id && (l.temperature || null) === (cmd.temperature || null);
  if (cmd.type === 'change_qty') {
    lines = lines
      .map((l) => (hit(l) ? { ...l, quantity: Math.min(MAX_EDIT_QTY, l.quantity + cmd.delta) } : l))
      .filter((l) => l.quantity > 0);
  } else if (cmd.type === 'remove') {
    lines = lines.filter((l) => !hit(l));
  } else if (cmd.type === 'set_temp') {
    if (!allowedTemps(menu, cmd.menu_id).includes(cmd.to)) return lines;
    lines = mergeItems(lines.map((l) => (hit(l) ? { ...l, temperature: cmd.to, temperature_unavailable: null } : l)));
  } else if (cmd.type === 'add_items') {
    lines = [...lines, ...cmd.items.map((n) => ({ ...n }))];
  }
  return lines;
}

/** 바꾼 뒤 손님에게 먼저 들려줄 한 마디 */
export function editMessage(cmd, menu) {
  const def = menu.items.find((m) => m.menu_id === cmd.menu_id);
  const name = def?.name || '';
  const unit = def?.unit || '잔';
  if (cmd.type === 'change_qty') return cmd.delta > 0 ? `${name} ${qtyWord(cmd.delta)} ${unit} 더 넣었어요.` : `${name} ${qtyWord(-cmd.delta)} ${unit} 뺐어요.`;
  if (cmd.type === 'remove') return `${josa(name, '을', '를')} 뺐어요.`;
  if (cmd.type === 'set_temp') return `${josa(name, '을', '를')} ${cmd.to === 'ICE' ? '아이스로' : '따뜻하게'} 바꿨어요.`;
  if (cmd.type === 'add_items') return '메뉴를 더 넣었어요.';
  if (cmd.type === 'temp_unavailable') return `${josa(name, '은', '는')} ${cmd.to === 'ICE' ? '아이스가' : '따뜻한 것이'} 없어요.`;
  if (cmd.type === 'unknown_menu') return `‘${cmd.unknown.join(', ')}’는 메뉴에서 찾지 못했어요. 주문은 그대로예요.`;
  if (cmd.type === 'unclear') return '주문을 바꾸시려면 “한 잔 더”, “빼 주세요”, “아이스로 바꿔 주세요”처럼 말씀해 주세요. 이대로 주문하시려면 “네”라고 해 주세요.';
  if (cmd.type === 'ask_which') return '어떤 메뉴인지 메뉴 이름과 함께 말씀해 주세요. 예를 들면 “라떼 아이스로 바꿔 주세요.”';
  return '';
}
