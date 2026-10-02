// 주문 화면 흐름: 시작 → 듣기 → (확인 질문) → 주문 확인 → 완료/출력
// 가격 계산·주문번호는 서버가 한다. 여기서는 화면과 음성만 다룬다.
import {
  nextQuestion, applyAnswer, interpretAnswer, suggestionText, groupSuggestions, categoryText, interpretCategory, CATEGORY_LABEL,
} from '/core/dialog.mjs';
import { parseOrder } from '/core/parser.mjs';
import { won, speakItems, priceLabel } from '/core/format.mjs';
import { createSpeechProvider, Speaker, SpeechFailure } from '/speech.js';

const HOME_AFTER_DONE_SEC = 10;
const IDLE_RESET_SEC = 90;
const MAX_FAILS = 3;
const ANSWER_TRIES = 3; // 대답은 한 번 놓쳐도 다시 듣는다 (어르신은 대답이 늦을 수 있다)
// 스피커에서 나온 안내 음성을 마이크가 다시 들은 것 → 대답으로 치지 않는다
const ECHO_RE = /(말씀하시나요|맞으실까요|드릴까요|보여드릴까요|어떤 걸로|듣고 있습니다|드실 수 있는|주문하실 수 있는|추천 메뉴는|판매 순위는)/;
const EXAMPLES = [
  '아이스 아메리카노 하나',
  '따뜻한 라떼 하나',
  '아이스 아메리카노 두 잔하고 라떼 하나 주세요.',
  '커피 하나 주세요.',
  '커피 말고 따뜻한 거 뭐 있어요?',
  '딸기 아메리카노 하나 주세요.',
];

const $ = (id) => document.getElementById(id);
const stt = createSpeechProvider();
const speaker = new Speaker();
const autoPrint = new URLSearchParams(location.search).get('autoprint') === '1';

let menu = null;
let s = freshState();
let flow = 0; // 처음으로 돌아가면 증가 → 진행 중이던 비동기 흐름은 멈춘다
let idleTimer = null;
let doneTimer = null;

function freshState() {
  return { session: null, mode: null, items: [], unrecognized: [], question: null, failCount: 0, heard: '' };
}

// ---------- 공통 ----------
async function api(path, body) {
  const res = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function show(name) {
  document.querySelectorAll('[data-screen]').forEach((el) => {
    el.hidden = el.dataset.screen !== name;
  });
  $('help-bar').hidden = name === 'help';
  window.scrollTo(0, 0);
  resetIdle(name);
}

function resetIdle(screen) {
  clearTimeout(idleTimer);
  if (screen && screen !== 'start' && screen !== 'done') {
    idleTimer = setTimeout(() => reset(), IDLE_RESET_SEC * 1000);
  }
}

function buttons(container, list) {
  container.replaceChildren(
    ...list.map(([label, cls, fn]) => {
      const b = document.createElement('button');
      b.className = `btn ${cls}`;
      b.textContent = label;
      b.addEventListener('click', fn);
      return b;
    }),
  );
}

function linesHtml(ul, lines) {
  ul.replaceChildren(
    ...lines.map((l) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = l.display_name;
      const qty = document.createElement('span');
      qty.className = 'qty';
      qty.textContent = `${l.quantity}${l.unit}`;
      li.append(name, qty);
      return li;
    }),
  );
}

function say(text) {
  return speaker.speak(text);
}

async function ensureSession(mode) {
  if (s.session && s.mode === mode) return;
  if (s.session) await api(`/api/sessions/${s.session}/cancel`, {}).catch(() => {});
  s = freshState();
  s.mode = mode;
  s.session = (await api('/api/sessions', { input_type: mode })).id;
}

// ---------- 시작 ----------
async function startVoice() {
  speaker.unlock();
  if (!stt.isSupported()) {
    $('voice-unsupported').hidden = false;
    return;
  }
  await ensureSession('VOICE');
  listenOrder();
}

async function startText() {
  speaker.unlock();
  await ensureSession('TEXT');
  show('text');
  $('text-input').value = '';
  $('text-input').focus();
}

// ---------- 주문 듣기 ----------
async function listenOrder() {
  const my = ++flow;
  $('interim').textContent = '';
  show('listening');
  await say('듣고 있습니다.');
  if (my !== flow) return;
  try {
    const text = await stt.listen((t) => ($('interim').textContent = t));
    if (my !== flow) return;
    await handleText(text);
  } catch (e) {
    if (my !== flow) return;
    await handleHearFail(e instanceof SpeechFailure ? e.code : 'error');
  }
}

async function handleText(text) {
  const my = flow;
  s.heard = text;
  const r = await api(`/api/sessions/${s.session}/parse`, { text });
  if (my !== flow) return;
  s.failCount = r.fail_count;
  if (r.kind === 'ok' || r.kind === 'clarify') {
    s.items = r.items;
    s.unrecognized = r.unrecognized;
    return proceed();
  }
  if (r.kind === 'suggest') return showSuggestions(r);
  if (r.kind === 'info') {
    // 메뉴 지식 문서·메뉴 설명에 있는 사실만 답한다
    return showMessage({
      title: '알려 드릴게요.',
      body: r.answer,
      speak: r.speech || r.answer,
      buttons: [['주문하기', 'primary', retry], ['직원에게 도움 요청', 'secondary', requestHelp]],
    });
  }
  if (r.kind === 'unanswered') {
    // 모르는 건 지어내지 않는다. 대시보드 '답 못 한 질문'에 자동으로 쌓인다
    return showMessage({
      title: '잘 모르겠어요.',
      body: r.answer,
      buttons: [['직원에게 도움 요청', 'primary', requestHelp], ['다른 걸로 말하기', 'secondary', retry]],
    });
  }
  if (r.kind === 'not_found') return showNotFound(r.unknown);
  if (r.kind === 'unavailable') {
    return showMessage({
      title: '죄송합니다.',
      body: `${r.unavailable.join(', ')}는 지금 준비가 어려워요.\n직원에게 도움을 요청하시겠어요?`,
      buttons: helpOrRetry(),
    });
  }
  return showNotHeard(); // unclear
}

function helpOrRetry() {
  const help = ['직원에게 도움 요청', 'primary', requestHelp];
  const again = ['다시 말하기', 'secondary', retry];
  return s.failCount >= MAX_FAILS ? [help, again] : [again, ['직원에게 도움 요청', 'secondary', requestHelp]];
}

async function handleHearFail(code) {
  if (code === 'aborted') return;
  if (code === 'unsupported') return startText();
  const r = await api(`/api/sessions/${s.session}/fail`, { reason: code }).catch(() => null);
  if (r) s.failCount = r.fail_count;
  if (code === 'not-allowed' || code === 'audio-capture') {
    return showMessage({
      title: '마이크를 쓸 수 없어요.',
      body: '마이크 사용을 허용해 주시거나\n직원에게 말씀해 주세요.',
      buttons: [['다시 말하기', 'secondary', retry], ['직원에게 도움 요청', 'primary', requestHelp]],
      speak: '마이크를 쓸 수 없어요. 직원에게 말씀해 주세요.',
    });
  }
  return showNotHeard();
}

function showNotHeard() {
  if (s.failCount >= MAX_FAILS) {
    return showMessage({
      title: '직원이 도와드릴게요.',
      body: '제가 잘 알아듣지 못해 죄송해요.\n직원을 불러 드릴까요?',
      buttons: helpOrRetry(),
    });
  }
  return showMessage({
    title: '제가 잘 못 들었어요.',
    body: '천천히 한 번 더 말씀해 주세요.',
    buttons: helpOrRetry(),
  });
}

function showNotFound(unknown) {
  const what = unknown?.length ? `‘${unknown.join(', ')}’는\n` : '';
  showMessage({
    title: '죄송합니다.',
    body: `${what}현재 주문 가능한 메뉴에서 찾지 못했습니다.\n직원에게 도움을 요청하시겠어요?`,
    buttons: [['직원에게 도움 요청', 'primary', requestHelp], ['다시 말하기', 'secondary', retry]],
  });
}

function showMessage({ title, body, buttons: list, speak }) {
  $('m-title').textContent = title;
  $('m-body').textContent = body;
  $('m-heard').textContent = s.heard ? `들은 말: “${s.heard}”` : '';
  buttons($('m-buttons'), list);
  show('message');
  say(speak || `${title} ${body.replace(/\n/g, ' ')}`);
}

// ---------- 확인 질문 ----------
function proceed() {
  const q = nextQuestion(s.items, menu);
  if (q) return askQuestion(q);
  return showConfirm();
}

async function askQuestion(q) {
  const my = ++flow;
  s.question = q;
  $('q-heard').textContent = s.heard ? `들은 말: “${s.heard}”` : '';
  $('q-text').textContent = q.text;
  resetAnswerUi('q');
  const answer = (a) => () => onAnswer(a);
  buttons(
    $('q-choices'),
    q.type === 'choose_temperature'
      ? [
          ['☕ 따뜻하게', 'primary warm', answer('HOT')],
          ['🧊 차갑게 (아이스)', 'primary cool', answer('ICE')],
          ['다시 말할게요', 'secondary', retry],
        ]
      : [
          ['네, 맞아요', 'primary', answer('yes')],
          ['아니요, 다시 말할게요', 'secondary', answer('no')],
        ],
  );
  show('question');
  await say(q.text);
  if (my === flow && s.mode === 'VOICE') {
    const prompt = q.type === 'choose_temperature' ? '“따뜻하게” 또는 “아이스”라고 말씀해 주세요.' : '“네” 또는 “아니요”라고 말씀해 주세요.';
    listenAnswer(my, 'q', onAnswer, prompt);
  }
}

function resetAnswerUi(prefix) {
  $(`${prefix}-status`).textContent = '';
  $(`${prefix}-listen`).hidden = true;
}

/** 대답 듣기: 못 들었거나 모르는 말이면 ANSWER_TRIES번까지 다시 듣는다. handler가 false면 처리 못 한 대답 */
async function listenAnswer(my, prefix, handler, prompt, interpret = interpretAnswer) {
  s.answer = { prefix, handler, prompt, interpret };
  const status = $(`${prefix}-status`);
  $(`${prefix}-listen`).hidden = true;
  for (let i = 0; i < ANSWER_TRIES; i++) {
    if (my !== flow) return;
    status.textContent = `🎤 듣고 있어요. ${prompt}`;
    await new Promise((r) => setTimeout(r, 300)); // 안내 음성 끝자락이 마이크에 들어가지 않게
    let text;
    try {
      text = await stt.listen((t) => (status.textContent = `🎤 “${t}”`));
    } catch (e) {
      if (my !== flow) return;
      if (['not-allowed', 'audio-capture', 'unsupported'].includes(e.code)) break;
      continue; // 말소리 없음 → 다시 듣기
    }
    if (my !== flow) return;
    if (ECHO_RE.test(text)) continue;
    s.heard = text;
    const a = interpret(text);
    if (a && handler(a) !== false) return;
  }
  if (my === flow) {
    status.textContent = '버튼을 눌러 주셔도 돼요.';
    $(`${prefix}-listen`).hidden = false;
  }
}

function onAnswer(a) {
  stt.cancel();
  const next = applyAnswer(s.items, s.question, a, menu);
  if (next === null) return retry();
  if (next === s.items) return false;
  s.items = next;
  proceed();
}

// ---------- 메뉴 추천 (메뉴 이름을 모를 때) ----------
const SUGGEST_TITLE = { HOT: '따뜻한', ICE: '시원한' };

/** "따뜻한 거 뭐 있어요?" → 메뉴판에 있는 것만 보기로 보여주고 고르게 한다. 대신 골라 담지 않는다.
 *  보기가 많으면(커피·차·라떼 섞임) 먼저 종류를 고르게 한다. */
async function showSuggestions(r) {
  const groups = r.source ? null : groupSuggestions(r.suggestions); // 지식 문서 답(태그·추천)은 바로 보기로
  if (!groups) return showSuggestionList(r);
  const my = ++flow;
  const text = categoryText(r, groups);
  const choose = (category) => {
    stt.cancel();
    showSuggestionList({ ...r, suggestions: r.suggestions.filter((x) => x.category === category) });
  };
  const kind = `${SUGGEST_TITLE[r.temperature] ? `${SUGGEST_TITLE[r.temperature]} ` : ''}${r.not_coffee ? '커피 아닌 ' : ''}메뉴`;
  $('q-heard').textContent = s.heard ? `들은 말: “${s.heard}”` : '';
  $('q-text').textContent = `${kind}예요.\n어떤 종류로 보여드릴까요?`;
  resetAnswerUi('q');
  buttons($('q-choices'), [
    ...groups.map((g) => [`${g.label}  (${g.count}가지)`, 'secondary', () => choose(g.category)]),
    ['다시 말할게요', 'link', retry],
  ]);
  show('question');
  await say(text);
  if (my !== flow || s.mode !== 'VOICE') return;
  listenAnswer(my, 'q', (category) => {
    if (!groups.some((g) => g.category === category)) return false;
    choose(category);
  }, `${groups.map((g) => `“${g.label}”`).join(', ')} 중에 말씀해 주세요.`, interpretCategory);
}

async function showSuggestionList(r) {
  const my = ++flow;
  const text = r.speech || suggestionText(r);
  const pick = (menuId, temperature) => {
    stt.cancel();
    const def = menu.items.find((m) => m.menu_id === menuId);
    const allowed = def.options?.temperature || [];
    s.items = [{
      menu_id: def.menu_id, name: def.name, unit: def.unit, quantity: 1, needs_confirm: false,
      temperature: allowed.includes(temperature) ? temperature : allowed.length === 1 ? allowed[0] : null,
      temperature_unavailable: null,
    }];
    s.unrecognized = [];
    proceed();
  };
  const cats = [...new Set(r.suggestions.map((x) => x.category))];
  const kind = cats.length === 1 && CATEGORY_LABEL[cats[0]] ? CATEGORY_LABEL[cats[0]] : '메뉴';
  $('q-heard').textContent = s.heard ? `들은 말: “${s.heard}”` : '';
  // 화면은 짧게, 메뉴 목록 전체는 음성으로 읽어 준다
  $('q-text').textContent = r.title || `${SUGGEST_TITLE[r.temperature] ? `${SUGGEST_TITLE[r.temperature]} ` : ''}${kind}예요.\n어떤 걸로 드릴까요?`;
  resetAnswerUi('q');
  buttons($('q-choices'), [
    ...r.suggestions.map((x) => {
      const def = menu.items.find((m) => m.menu_id === x.menu_id);
      return [`${x.name}  ${priceLabel(def, r.temperature)}`, 'secondary', () => pick(x.menu_id, r.temperature)];
    }),
    ['다시 말할게요', 'link', retry],
  ]);
  show('question');
  await say(text);
  if (my !== flow || s.mode !== 'VOICE') return;
  listenAnswer(my, 'q', (said) => {
    const p = parseOrder(said, menu);
    if (!p.items.length || (p.kind !== 'ok' && p.kind !== 'clarify')) return false;
    s.items = p.items.map((it) => {
      const allowed = menu.items.find((m) => m.menu_id === it.menu_id)?.options?.temperature || [];
      return !it.temperature && allowed.includes(r.temperature) ? { ...it, temperature: r.temperature } : it;
    });
    s.unrecognized = p.unrecognized;
    stt.cancel();
    proceed();
  }, '드시고 싶은 메뉴를 말씀하시거나 눌러 주세요.', (said) => said);
}

// ---------- 주문 확인 ----------
async function showConfirm() {
  const my = ++flow;
  let priced;
  try {
    priced = await api('/api/quote', { items: s.items });
  } catch {
    return showNotHeard();
  }
  if (my !== flow) return;
  s.priced = priced;
  linesHtml($('c-lines'), priced.items);
  $('c-total').textContent = won(priced.total_amount);
  const spoken = speakItems(priced.items);
  $('c-ask').textContent = `“${spoken} 맞으실까요?”`;
  $('c-note').hidden = !s.unrecognized.length;
  $('c-note').textContent = s.unrecognized.length
    ? `‘${s.unrecognized.join(', ')}’는 알아듣지 못해 빠졌어요. 필요하시면 ‘다시 말할게요’를 눌러 주세요.`
    : '';
  resetAnswerUi('c');
  show('confirm');
  await say(`${spoken} 맞으실까요? 총 ${won(priced.total_amount)}입니다.`);
  if (my === flow && s.mode === 'VOICE') {
    listenAnswer(my, 'c', (a) => {
      if (a === 'yes') return confirmOrder();
      if (a === 'no') return retry();
      return false;
    }, '“네” 또는 “아니요”라고 말씀해 주세요.');
  }
}

async function confirmOrder() {
  stt.cancel();
  const my = ++flow;
  try {
    const order = await api(`/api/sessions/${s.session}/confirm`, { items: s.items });
    if (my !== flow) return;
    showDone(order);
  } catch {
    showMessage({
      title: '주문을 저장하지 못했어요.',
      body: '죄송합니다. 직원에게 말씀해 주세요.',
      buttons: [['직원에게 도움 요청', 'primary', requestHelp], ['처음으로', 'secondary', reset]],
    });
  }
}

// ---------- 완료 ----------
function showDone(order) {
  const shortNo = String(parseInt(order.order_id.slice(-3), 10));
  $('d-no').textContent = shortNo;
  $('d-id').textContent = order.order_id;
  linesHtml($('d-lines'), order.items);
  $('d-total').textContent = won(order.total_amount);
  $('d-print-msg').hidden = true;
  s.lastOrder = order;
  s.session = null; // 확정된 세션은 닫힘
  show('done');
  say(`주문이 완료되었습니다. 주문번호는 ${shortNo}번입니다. 카운터에서 결제해 주세요.`);
  if (autoPrint) printOrder(order.order_id);
  let left = HOME_AFTER_DONE_SEC;
  $('d-count').textContent = left;
  clearInterval(doneTimer);
  doneTimer = setInterval(() => {
    left -= 1;
    $('d-count').textContent = left;
    if (left <= 0) reset();
  }, 1000);
}

export async function printOrder(orderId) {
  const msg = $('d-print-msg');
  try {
    const r = await api(`/api/orders/${orderId}/print`, {});
    if (!r.ok) throw new Error(r.error);
    $('print-area').innerHTML = r.html;
    window.print();
    await api(`/api/orders/${orderId}/print-result`, { ok: true });
  } catch {
    await api(`/api/orders/${orderId}/print-result`, { ok: false }).catch(() => {});
    if (msg) {
      msg.textContent = '주문서가 출력되지 않았어요. 주문번호를 직원에게 말씀해 주세요.';
      msg.hidden = false;
    }
  }
}

// ---------- 직원 호출 · 초기화 ----------
async function requestHelp() {
  stt.cancel();
  ++flow;
  await api('/api/help', { session_id: s.session }).catch(() => {});
  show('help');
  say('직원을 호출했습니다. 잠시만 기다려 주세요.');
}

function retry() {
  stt.cancel();
  s.items = [];
  s.question = null;
  if (s.mode === 'VOICE') return listenOrder();
  ++flow;
  show('text');
  $('text-input').focus();
}

async function reset() {
  ++flow;
  stt.cancel();
  speaker.cancel();
  clearInterval(doneTimer);
  if (s.session) await api(`/api/sessions/${s.session}/cancel`, {}).catch(() => {});
  s = freshState();
  show('start');
}

// ---------- 연결 ----------
const ACTIONS = {
  'start-voice': startVoice,
  'start-text': startText,
  'confirm-yes': confirmOrder,
  retry,
  reset,
  help: requestHelp,
  print: () => s.lastOrder && printOrder(s.lastOrder.order_id),
  'listen-answer': () => s.answer && listenAnswer(flow, s.answer.prefix, s.answer.handler, s.answer.prompt, s.answer.interpret),
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (el && ACTIONS[el.dataset.action]) ACTIONS[el.dataset.action]();
  const current = document.querySelector('[data-screen]:not([hidden])');
  resetIdle(current?.dataset.screen);
});

$('text-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('text-input').value.trim();
  if (text) handleText(text);
});

buttons(
  $('examples'),
  EXAMPLES.map((t) => [t, 'chip', () => ($('text-input').value = t)]),
);

menu = await api('/api/menu');
if (!stt.isSupported()) $('voice-unsupported').hidden = false;
window.__voiceOrder = { printOrder }; // 대시보드 재출력·자동 테스트용
