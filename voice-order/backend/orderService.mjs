// 주문 흐름의 서버 쪽 규칙: 세션 기록, 분석 기록, 가격 계산, 주문번호, 확정, 출력, 직원 호출, 통계.
// ORDER 필드는 향후 GBRICK AI OS ORDER와 맞춘다:
// order_id, created_at, input_type, raw_transcript, items, total_amount, payment_status, status, help_requested, print_status
import { parseOrder } from '../core/parser.mjs';
import { answerFromKnowledge } from '../core/knowledge.mjs';
import { itemLabel, priceFor } from '../core/format.mjs';

export const STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};
export const PAY_AT_COUNTER = 'PAY_AT_COUNTER';

// 서버(Node 18+)와 브라우저 모두에서 동작하는 고유 id
function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
const MAX_QTY = 20;

export class OrderError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function kstDate(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(date)
    .replaceAll('-', '');
}

/**
 * 가격 계산 — 가격은 오직 MENU_MASTER에서 온다. 클라이언트가 보낸 금액은 받지 않는다.
 * 같은 메뉴·같은 온도는 한 줄로 합친다.
 */
export function quote(rawItems, menu) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw new OrderError('주문할 메뉴가 없습니다.');
  const merged = new Map();
  for (const r of rawItems) {
    const def = menu.items.find((m) => m.menu_id === r?.menu_id);
    if (!def || def.available === false) throw new OrderError(`주문할 수 없는 메뉴입니다: ${r?.menu_id}`);
    const allowed = def.options?.temperature || [];
    const temperature = allowed.length ? r.temperature : null;
    if (allowed.length && !allowed.includes(temperature)) throw new OrderError(`${def.name}의 온도를 선택해야 합니다.`);
    const qty = Number(r.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new OrderError(`수량은 1~${MAX_QTY} 사이여야 합니다.`);
    const key = `${def.menu_id}|${temperature || ''}`;
    const prev = merged.get(key);
    if (prev) prev.quantity += qty;
    else merged.set(key, { def, temperature, quantity: qty });
  }
  const items = [...merged.values()].map(({ def, temperature, quantity }) => {
    const unitPrice = priceFor(def, temperature);
    if (!Number.isInteger(unitPrice)) throw new OrderError(`${def.name}의 가격이 메뉴에 없습니다.`);
    return {
      menu_id: def.menu_id,
      name: def.name,
      display_name: itemLabel(def.name, temperature),
      temperature,
      unit: def.unit,
      quantity,
      unit_price: unitPrice,
      line_total: unitPrice * quantity,
    };
  });
  if (items.some((l) => l.quantity > MAX_QTY)) throw new OrderError(`수량은 ${MAX_QTY}개까지 주문할 수 있습니다.`);
  return { items, total_amount: items.reduce((s, l) => s + l.line_total, 0) };
}

// getKnowledge: 매번 최신 knowledge.json을 돌려주는 함수 (파일을 고치면 재시작 없이 반영)
export function createOrderService({ store, menu, printProvider, getKnowledge = () => ({}), now = () => new Date() }) {
  function mustGet(id) {
    const r = store.get(id);
    if (!r) throw new OrderError('주문 기록을 찾을 수 없습니다.', 404);
    return r;
  }
  function mustBeOpen(r) {
    if (r.status !== STATUS.IN_PROGRESS) throw new OrderError('이미 끝난 주문입니다.', 409);
  }

  function nextOrderId() {
    const day = kstDate(now());
    const prefix = `GB-${day}-`;
    const max = store
      .all()
      .filter((r) => r.order_id?.startsWith(prefix))
      .reduce((m, r) => Math.max(m, parseInt(r.order_id.slice(prefix.length), 10)), 0);
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  }

  return {
    menu,

    startSession(inputType, extra = {}) {
      const input_type = inputType === 'TEXT' ? 'TEXT' : inputType === 'VOICE' ? 'VOICE' : 'NONE';
      return store.insert({
        ...extra,
        id: newId(),
        order_id: null,
        created_at: now().toISOString(),
        confirmed_at: null,
        input_type,
        raw_transcript: '',
        transcripts: [],
        items: [],
        total_amount: 0,
        payment_status: PAY_AT_COUNTER,
        status: STATUS.IN_PROGRESS,
        help_requested: false,
        print_status: 'NOT_PRINTED',
        fail_count: 0,
        demo: true,
      });
    },

    parse(sessionId, text) {
      const r = mustGet(sessionId);
      mustBeOpen(r);
      const parsed = parseOrder(text, menu);
      const result = answerFromKnowledge(text, menu, getKnowledge(), parsed) || parsed;
      const failed = ['not_found', 'unavailable', 'unclear', 'unanswered'].includes(result.kind);
      store.update(r.id, {
        raw_transcript: String(text || ''),
        transcripts: [...r.transcripts, { at: now().toISOString(), text: String(text || ''), kind: result.kind, ...(result.topic ? { topic: result.topic } : {}) }],
        fail_count: r.fail_count + (failed ? 1 : 0),
      });
      return { ...result, fail_count: store.get(r.id).fail_count };
    },

    /** 음성 인식 자체가 실패한 경우 (말소리 없음, 마이크 오류 등) */
    recordFailure(sessionId, reason) {
      const r = mustGet(sessionId);
      mustBeOpen(r);
      store.update(r.id, {
        fail_count: r.fail_count + 1,
        transcripts: [...r.transcripts, { at: now().toISOString(), text: '', kind: `fail:${reason || 'unknown'}` }],
      });
      return { fail_count: store.get(r.id).fail_count };
    },

    quote: (items) => quote(items, menu),

    confirm(sessionId, items) {
      const r = mustGet(sessionId);
      mustBeOpen(r);
      const priced = quote(items, menu);
      return store.update(r.id, {
        ...priced,
        order_id: nextOrderId(),
        confirmed_at: now().toISOString(),
        status: STATUS.CONFIRMED,
        payment_status: PAY_AT_COUNTER,
      });
    },

    requestHelp(sessionId) {
      const r = sessionId ? mustGet(sessionId) : this.startSession('NONE');
      return store.update(r.id, { help_requested: true, help_requested_at: now().toISOString() });
    },

    /** 주문 초기화: 확정 전 세션을 닫는다. 실패가 있었으면 FAILED, 아니면 CANCELLED */
    cancel(sessionId) {
      const r = mustGet(sessionId);
      if (r.status !== STATUS.IN_PROGRESS) return r;
      return store.update(r.id, {
        status: r.fail_count > 0 ? STATUS.FAILED : STATUS.CANCELLED,
        ended_at: now().toISOString(),
      });
    },

    async print(orderId) {
      const r = store.findByOrderId(orderId);
      if (!r || r.status !== STATUS.CONFIRMED) throw new OrderError('출력할 주문을 찾을 수 없습니다.', 404);
      try {
        const out = await printProvider.print(r);
        store.update(r.id, { print_status: out.mode === 'browser' ? 'SENT_TO_BROWSER' : 'PRINTED' });
        return { ok: true, ...out, print_status: r.print_status };
      } catch (e) {
        store.update(r.id, { print_status: 'PRINT_FAILED', print_error: e.message });
        return { ok: false, error: e.message, print_status: 'PRINT_FAILED' };
      }
    },

    /** 브라우저가 인쇄 결과를 알려줄 때 */
    reportPrint(orderId, ok) {
      const r = store.findByOrderId(orderId);
      if (!r) throw new OrderError('주문을 찾을 수 없습니다.', 404);
      return store.update(r.id, { print_status: ok ? 'PRINTED' : 'PRINT_FAILED' });
    },

    stats() {
      const today = kstDate(now());
      const todays = store.all().filter((r) => kstDate(new Date(r.created_at)) === today);
      const sessions = todays.filter((r) => r.input_type !== 'NONE');
      const confirmed = todays.filter((r) => r.status === STATUS.CONFIRMED);
      const durations = confirmed.map((r) => new Date(r.confirmed_at) - new Date(r.created_at));
      return {
        demo: true,
        unanswered: unansweredQuestions(store.all(), now()),
        date: today,
        test_sessions: sessions.length,
        completed: confirmed.length,
        voice: sessions.filter((r) => r.input_type === 'VOICE').length,
        text: sessions.filter((r) => r.input_type === 'TEXT').length,
        help_requests: todays.filter((r) => r.help_requested).length,
        failed: todays.filter((r) => r.status === STATUS.FAILED).length,
        avg_seconds: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000) : null,
        recent: [...store.all()].reverse().slice(0, 30),
      };
    },
  };
}

const UNANSWERED_KINDS = { unanswered: '질문에 답 못 함', not_found: '메뉴에서 못 찾음', unclear: '알아듣지 못함', unavailable: '판매 중지 메뉴' };

/**
 * 대시보드 '답 못 한 질문' — 최근 7일, 같은 말끼리 묶어 많이 나온 순.
 * 따로 저장하지 않고 주문 기록(transcripts)에서 계산한다 (같은 데이터를 두 곳에 두지 않는다).
 */
export function unansweredQuestions(records, now, days = 7) {
  const since = now.getTime() - days * 86400000;
  const groups = new Map();
  for (const r of records) {
    for (const t of r.transcripts || []) {
      if (!UNANSWERED_KINDS[t.kind] || !t.text || new Date(t.at).getTime() < since) continue;
      const key = t.text.replace(/[\s.?!~]+/g, ' ').trim();
      const g = groups.get(key) || { text: key, kind: t.kind, label: UNANSWERED_KINDS[t.kind], topic: t.topic || null, count: 0, last_at: t.at };
      g.count += 1;
      if (t.at > g.last_at) g.last_at = t.at;
      groups.set(key, g);
    }
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || (a.last_at < b.last_at ? 1 : -1)).slice(0, 50);
}
