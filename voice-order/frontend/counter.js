// 카운터 화면 — 2초마다 매장 서버에서 주문·도움 요청을 가져온다.
// 새 주문·도움 요청이 오면 소리와 화면으로 알린다. 직원 키가 필요하면 한 번 물어 이 기기에 기억한다.
import { won } from './core/format.mjs';

const STORE_ID = document.documentElement.dataset.storeId;
const BASE = `/api/store/${STORE_ID}`;
const POLL_MS = 2000;
const KEY_STORE = `gbrick-staff-key-${STORE_ID}`;
const STATUS_LABEL = { NEW: '새 주문', CONFIRMED: '확인됨', PRINTED: '출력됨', PREPARING: '제조 중', READY: '준비 완료', COMPLETED: '완료', CANCELLED: '취소' };
// 상태별로 누를 수 있는 버튼 [라벨, 다음 상태 | 'print', 강조]
const ACTIONS = {
  NEW: [['주문 확인', 'CONFIRMED', true], ['🖨 주문서 출력', 'print']],
  CONFIRMED: [['🖨 주문서 출력', 'print'], ['제조 시작', 'PREPARING', true]],
  PRINTED: [['제조 시작', 'PREPARING', true], ['🖨 재출력', 'print']],
  PREPARING: [['준비 완료', 'READY', true]],
  READY: [['완료', 'COMPLETED', true]],
};
const CANCELABLE = new Set(['NEW', 'CONFIRMED', 'PRINTED', 'PREPARING']);

const $ = (id) => document.getElementById(id);
let staffKey = readKey();
let seenOrders = null; // 처음 불러올 때는 알림을 울리지 않는다
let seenHelp = null;
let audio = null;
let busy = false;
let askedKey = false;

function askKey() {
  askedKey = true;
  const k = prompt('카운터 직원 키를 입력하세요 (STORE_STAFF_KEY)');
  if (k) {
    staffKey = k.trim();
    saveKey(staffKey);
  }
}
$('conn').addEventListener('click', () => {
  if ($('conn').textContent.includes('직원 키')) askKey();
});

function readKey() {
  try {
    return localStorage.getItem(KEY_STORE) || '';
  } catch {
    return '';
  }
}
function saveKey(k) {
  try {
    localStorage.setItem(KEY_STORE, k);
  } catch {
    /* 저장 못 해도 이번 화면에서는 쓴다 */
  }
}

async function api(path, body) {
  const res = await fetch(BASE + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Staff-Key': staffKey },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  if (res.status === 401) {
    // 키는 한 번만 묻는다 (2초마다 창이 뜨지 않게). 다시 넣으려면 '직원 키 입력' 버튼
    if (!askedKey) askKey();
    $('conn').textContent = '🔒 직원 키 필요';
    $('conn').className = 'conn bad';
    throw new Error('staff key');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function time(iso) {
  return new Date(iso).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ---------- 알림 소리 (브라우저는 한 번 눌러야 소리를 허용한다) ----------
function beep(times = 2) {
  if (!audio) return;
  for (let i = 0; i < times; i++) {
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = 880;
    g.gain.value = 0.25;
    o.connect(g).connect(audio.destination);
    const t = audio.currentTime + i * 0.35;
    o.start(t);
    o.stop(t + 0.2);
  }
}
$('sound-btn').addEventListener('click', () => {
  audio ||= new (window.AudioContext || window.webkitAudioContext)();
  audio.resume();
  $('sound-btn').textContent = '🔊 알림 소리 켜짐';
  beep(1);
});

// ---------- 그리기 ----------
function renderHelp(help) {
  $('help-area').replaceChildren(
    ...help.map((h) => {
      const box = el('div', `help-alert${seenHelp && !seenHelp.has(h.request_id) ? ' flash' : ''}`);
      box.append(el('span', '', `🔔 고객 도움이 필요합니다 · ${time(h.timestamp)}`));
      const b = el('button', 'mini', '확인');
      b.addEventListener('click', () => act(() => api(`/help/${h.request_id}/resolve`, { actor: 'counter' })));
      box.append(b);
      return box;
    }),
  );
}

function card(o) {
  const c = el('article', `card ${o.status}`);
  c.dataset.orderId = o.order_id;
  c.append(el('div', 'no', o.order_number));
  const meta = el('div', 'meta');
  meta.append(el('span', '', time(o.created_at)), el('span', '', o.order_source === 'VOICE' ? '🎤 음성' : '⌨ 글자'));
  c.append(meta, el('span', `status ${o.status}`, STATUS_LABEL[o.status]));
  const ul = el('ul');
  for (const it of o.items) {
    const li = el('li');
    const name = el('span', '', it.menu_name);
    const t = it.options?.temperature;
    if (t) name.append(el('span', `opt ${t}`, t));
    li.append(name, el('span', '', `× ${it.quantity}`));
    ul.append(li);
  }
  c.append(ul, el('div', 'sum', won(o.total_amount)));
  const acts = el('div', 'acts');
  for (const [label, next, strong] of ACTIONS[o.status] || []) {
    const b = el('button', strong ? 'go' : '', label);
    b.addEventListener('click', () => (next === 'print' ? printOrder(o) : act(() => api(`/orders/${o.order_id}/status`, { status: next, actor: 'counter' }))));
    acts.append(b);
  }
  if (CANCELABLE.has(o.status)) {
    const b = el('button', 'cancel', '주문 취소');
    b.addEventListener('click', () => {
      if (confirm(`${o.order_number} 주문을 취소할까요?`)) act(() => api(`/orders/${o.order_id}/status`, { status: 'CANCELLED', actor: 'counter' }));
    });
    acts.append(b);
  }
  c.append(acts);
  return c;
}

function renderKpis(st) {
  const v = (x, unit = '') => (x === null || x === undefined ? '-' : `${x}${unit}`);
  const rows = [
    ['총 주문', v(st.total_orders)],
    ['음성 주문', v(st.voice_orders)],
    ['완료', v(st.completed)],
    ['취소', v(st.cancelled)],
    ['직원 도움 요청', v(st.help_requests)],
    ['대화 수', v(st.conversations)],
    ['주문 완료율', v(st.order_completion_rate, '%')],
    ['음성 인식 실패', v(st.stt_failures)],
    ['메뉴 인식 실패', v(st.menu_failures)],
    ['평균 주문시간', v(st.avg_order_seconds, '초')],
    ['평균 확인 질문', v(st.avg_clarifications, '회')],
  ];
  $('kpis').replaceChildren(
    ...rows.map(([k, val]) => {
      const d = el('div', 'kpi');
      d.append(el('div', 'k', k), el('div', 'v', val));
      return d;
    }),
  );
}

function setConn(ok) {
  $('conn').textContent = ok ? '🟢 서버 연결 정상' : '🔴 서버 연결 끊김';
  $('conn').className = `conn ${ok ? 'ok' : 'bad'}`;
}

async function load() {
  if (busy) return;
  try {
    const v = await api('/counter');
    setConn(true);
    $('store-name').textContent = v.store.name;
    const prod = v.mode === 'production';
    $('mode-tag').hidden = false;
    $('mode-tag').textContent = prod ? 'PRODUCTION · 실제 주문' : 'TEST 모드';
    $('mode-tag').className = `mode-tag${prod ? ' prod' : ''}`;
    $('test-banner').hidden = prod;

    const ids = new Set(v.active.map((o) => o.order_id));
    const helpIds = new Set(v.help.map((h) => h.request_id));
    const newOrder = seenOrders && [...ids].some((id) => !seenOrders.has(id));
    const newHelp = seenHelp && [...helpIds].some((id) => !seenHelp.has(id));
    renderHelp(v.help);
    $('active-count').textContent = `(${v.active.length})`;
    $('active').replaceChildren(...(v.active.length ? v.active.map(card) : [el('p', 'c-empty', '진행 중인 주문이 없습니다.')]));
    $('done').replaceChildren(...v.done_today.map((o) => el('span', o.status, `${o.order_number} ${STATUS_LABEL[o.status]}`)));
    if (newHelp) beep(4);
    else if (newOrder) beep(2);
    if (newOrder || newHelp) document.title = `🔔 ${newHelp ? '도움 요청' : '새 주문'} · 카운터`;
    seenOrders = ids;
    seenHelp = helpIds;
    renderKpis(await api('/stats'));
  } catch (e) {
    if (e.message !== 'staff key') setConn(false);
  }
}

async function act(fn) {
  busy = true;
  try {
    await fn();
  } catch (e) {
    if (e.message !== 'staff key') alert(`처리하지 못했습니다: ${e.message}`);
  } finally {
    busy = false;
    document.title = '카운터 · GBRICK 음성 주문';
    load();
  }
}

/** 주문서 출력: 서버가 상태를 PRINTED로 기록하고 주문서 HTML을 준다 → 브라우저 인쇄 창 */
function printOrder(o) {
  act(async () => {
    const r = await api(`/orders/${o.order_id}/print`, { actor: 'counter' });
    $('print-area').innerHTML = r.html;
    window.print();
  });
}

load();
setInterval(load, POLL_MS);
window.__counter = { load };
