// STORE MODE 주문 서버 — 실제 매장(지브릭 본점) 파일럿용.
// 고객 확인 → ORDER 생성(서버가 주문번호 발급) → 카운터 → 출력 → 제조 → 기존 POS 결제.
// DEMO(기존 /, /gbrick-order)와 데이터가 섞이지 않도록 별도 파일·별도 서비스로 둔다.
//
// 데이터 구조는 향후 GBRICK AI OS(ORDER / ORDER_ITEM / ORDER_EVENT)로 옮기기 쉽게 표준 이름을 쓴다.
// 개인정보(이름·전화·카드·음성 원본)는 받지도 저장하지도 않는다. 음성은 인식된 글자만 남긴다.
import { quote, kstDate, OrderError } from './orderService.mjs';
import { itemLabel } from '../core/format.mjs';

export const MODES = { TEST: 'test', PRODUCTION: 'production' };
export const ORDER_STATUS = ['NEW', 'CONFIRMED', 'PRINTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

// 허용되는 상태 변경. 정의되지 않은 변경은 거절한다.
const TRANSITIONS = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PRINTED', 'PREPARING', 'CANCELLED'],
  PRINTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};
const ACTIVE = new Set(['NEW', 'CONFIRMED', 'PRINTED', 'PREPARING', 'READY']);
const FAIL_KINDS = new Set(['not_found', 'unavailable', 'unclear', 'unanswered']);

function newId(prefix) {
  const u = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${u}` : u;
}

function emptyDb() {
  return { orders: [], events: [], voice_logs: [], help_requests: [], seq: {} };
}

/**
 * @param db        { load(): object|null, save(data) } — JSON 파일 또는 메모리
 * @param stores    [{ store_id, name, order_prefix }]
 * @param mode      'test' | 'production'  (test면 주문번호 앞에 T, 통계·파일 분리)
 */
export function createStoreOrders({ db, menu, stores, mode = MODES.TEST, now = () => new Date() }) {
  const data = { ...emptyDb(), ...(db.load() || {}) };
  const save = () => db.save(data);

  function mustStore(storeId) {
    const s = stores.find((x) => x.store_id === storeId);
    if (!s) throw new OrderError('등록되지 않은 매장입니다.', 404);
    return s;
  }
  function mustOrder(storeId, orderId) {
    const o = data.orders.find((x) => x.order_id === orderId && x.store_id === storeId);
    if (!o) throw new OrderError('주문을 찾을 수 없습니다.', 404);
    return o;
  }
  function logEvent(order, status, actor, metadata = {}) {
    data.events.push({ order_id: order.order_id, status, timestamp: now().toISOString(), actor, metadata });
  }

  // 주문번호: 매장·영업일(한국시간)·모드별로 001부터. 이 함수는 동기(한 번에 하나)라 동시 주문에도 겹치지 않는다.
  function nextNumber(store) {
    const day = kstDate(now());
    const key = `${store.store_id}|${day}`;
    data.seq[key] = (data.seq[key] || 0) + 1;
    const prefix = mode === MODES.PRODUCTION ? store.order_prefix || 'A' : 'T';
    return { business_date: day, order_number: `${prefix}${String(data.seq[key]).padStart(3, '0')}` };
  }

  return {
    mode,
    stores,
    store: mustStore,

    /**
     * 고객이 "네"라고 최종 확인한 주문을 만든다.
     * idempotency_key가 같으면 새로 만들지 않고 처음 주문을 그대로 돌려준다(재전송·두 번 누름 방지).
     */
    create({ store_id, items, dining, order_source, idempotency_key, session = null, clarification_count = 0 }) {
      const store = mustStore(store_id);
      if (typeof idempotency_key !== 'string' || !/^[\w-]{8,64}$/.test(idempotency_key)) {
        throw new OrderError('주문 확인 키가 올바르지 않습니다.');
      }
      const dup = data.orders.find((o) => o.store_id === store_id && o.idempotency_key === idempotency_key);
      if (dup) return { ...dup, duplicate: true };

      // 매장/포장에 따라 가격이 달라지므로 반드시 손님이 고른 값이 있어야 한다 (추측 금지)
      if (dining !== 'DINE_IN' && dining !== 'TAKEOUT') throw new OrderError('매장에서 드실지 포장하실지 선택해야 합니다.');
      const priced = quote(items, menu, dining); // 가격은 menu.json에서만. 클라이언트 금액은 받지 않는다
      const at = now().toISOString();
      const order = {
        order_id: newId('ord'),
        store_id,
        ...nextNumber(store),
        mode,
        status: 'NEW',
        order_source: order_source === 'TEXT' ? 'TEXT' : 'VOICE',
        payment_status: 'PAY_AT_COUNTER',
        idempotency_key,
        session_id: session?.id || null,
        session_started_at: session?.created_at || null,
        created_at: at,
        customer_confirmed_at: at,
        confirmed_at: null,
        completed_at: null,
        cancelled_at: null,
        print_count: 0,
        clarification_count: Number.isInteger(clarification_count) ? clarification_count : 0,
        dining,
        list_amount: priced.list_amount,
        discount_amount: priced.discount_amount,
        total_amount: priced.total_amount,
        items: priced.items.map((l) => ({
          menu_id: l.menu_id,
          menu_name: l.name,
          display_name: l.display_name,
          quantity: l.quantity,
          options: l.temperature ? { temperature: l.temperature } : {},
          list_price: l.list_price,
          discount: l.discount,
          unit_price: l.unit_price,
          amount: l.line_total,
          unit: l.unit,
        })),
      };
      data.orders.push(order);
      logEvent(order, 'NEW', 'customer', { source: order.order_source });

      // VOICE_LOG: 인식된 글자만 (음성 원본 저장 안 함)
      for (const t of session?.transcripts || []) {
        data.voice_logs.push({
          order_id: order.order_id,
          store_id,
          session_id: session.id,
          recognized_text: t.text || '',
          confidence: typeof t.confidence === 'number' ? t.confidence : null,
          timestamp: t.at,
          clarification_count: order.clarification_count,
          error_type: t.kind?.startsWith('fail:') ? t.kind.slice(5) : FAIL_KINDS.has(t.kind) ? t.kind : null,
        });
      }
      save();
      return order;
    },

    setStatus(store_id, order_id, status, actor = 'staff') {
      const order = mustOrder(store_id, order_id);
      if (!ORDER_STATUS.includes(status)) throw new OrderError('알 수 없는 주문 상태입니다.');
      if (!TRANSITIONS[order.status].includes(status)) {
        throw new OrderError(`${order.order_number}: ${order.status}에서 ${status}(으)로 바꿀 수 없습니다.`, 409);
      }
      const at = now().toISOString();
      order.status = status;
      if (status === 'CONFIRMED') order.confirmed_at = at;
      if (status === 'COMPLETED') order.completed_at = at;
      if (status === 'CANCELLED') order.cancelled_at = at;
      logEvent(order, status, actor);
      save();
      return order;
    },

    /** 주문서 출력 요청. NEW면 직원이 본 것이므로 CONFIRMED를 거쳐 PRINTED로, 이후는 재출력만 기록 */
    markPrinted(store_id, order_id, actor = 'staff') {
      const order = mustOrder(store_id, order_id);
      if (order.status === 'CANCELLED') throw new OrderError('취소된 주문은 출력하지 않습니다.', 409);
      const at = now().toISOString();
      if (order.status === 'NEW') {
        order.status = 'CONFIRMED';
        order.confirmed_at = at;
        logEvent(order, 'CONFIRMED', actor, { via: 'print' });
      }
      order.print_count += 1;
      if (order.status === 'CONFIRMED') {
        order.status = 'PRINTED';
        logEvent(order, 'PRINTED', actor, { print_count: order.print_count });
      } else {
        logEvent(order, order.status, actor, { action: 'reprint', print_count: order.print_count });
      }
      save();
      return order;
    },

    requestHelp({ store_id, session_id = null, order_id = null }) {
      mustStore(store_id);
      const open = data.help_requests.find((h) => h.store_id === store_id && h.status === 'OPEN' && session_id && h.session_id === session_id);
      if (open) return open; // 같은 손님이 여러 번 눌러도 알림은 하나
      const req = {
        request_id: newId('help'),
        store_id,
        session_id,
        order_id,
        timestamp: now().toISOString(),
        status: 'OPEN',
        resolved_by: null,
        resolved_at: null,
      };
      data.help_requests.push(req);
      save();
      return req;
    },

    resolveHelp(store_id, request_id, actor = 'staff') {
      const req = data.help_requests.find((h) => h.request_id === request_id && h.store_id === store_id);
      if (!req) throw new OrderError('도움 요청을 찾을 수 없습니다.', 404);
      if (req.status !== 'RESOLVED') {
        req.status = 'RESOLVED';
        req.resolved_by = actor;
        req.resolved_at = now().toISOString();
        save();
      }
      return req;
    },

    /** 카운터 화면: 진행 중 주문 + 열린 도움 요청 + 오늘 끝난 주문 몇 건 */
    counter(store_id) {
      const store = mustStore(store_id);
      const today = kstDate(now());
      const mine = data.orders.filter((o) => o.store_id === store_id);
      return {
        store,
        mode,
        server_time: now().toISOString(),
        active: mine.filter((o) => ACTIVE.has(o.status)).sort((a, b) => a.created_at.localeCompare(b.created_at)),
        done_today: mine
          .filter((o) => !ACTIVE.has(o.status) && o.business_date === today)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .slice(0, 10),
        help: data.help_requests.filter((h) => h.store_id === store_id && h.status === 'OPEN'),
      };
    },

    events: (order_id) => data.events.filter((e) => e.order_id === order_id),
    voiceLogs: (order_id) => data.voice_logs.filter((v) => v.order_id === order_id),
    all: () => data,

    /**
     * 오늘 KPI — 실제 기록에서만 계산한다. 기록이 없으면 null(화면에는 '-').
     * @param sessions 같은 매장·모드의 대화 세션(주문 전 단계 포함)
     */
    stats(store_id, sessions = []) {
      mustStore(store_id);
      const today = kstDate(now());
      const orders = data.orders.filter((o) => o.store_id === store_id && o.business_date === today);
      const todaysSessions = sessions.filter((s) => kstDate(new Date(s.created_at)) === today && s.input_type !== 'NONE');
      const transcripts = todaysSessions.flatMap((s) => s.transcripts || []);
      const durations = orders.filter((o) => o.session_started_at).map((o) => new Date(o.created_at) - new Date(o.session_started_at));
      const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
      const help = data.help_requests.filter((h) => h.store_id === store_id && kstDate(new Date(h.timestamp)) === today);
      return {
        mode,
        date: today,
        total_orders: orders.length,
        voice_orders: orders.filter((o) => o.order_source === 'VOICE').length,
        completed: orders.filter((o) => o.status === 'COMPLETED').length,
        cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
        help_requests: help.length,
        conversations: todaysSessions.length,
        order_completion_rate: todaysSessions.length ? Math.round((orders.length / todaysSessions.length) * 100) : null,
        order_errors: todaysSessions.filter((s) => s.status === 'FAILED').length,
        stt_failures: transcripts.filter((t) => t.kind?.startsWith('fail:')).length,
        menu_failures: transcripts.filter((t) => FAIL_KINDS.has(t.kind)).length,
        avg_order_seconds: durations.length ? Math.round(avg(durations) / 1000) : null,
        avg_clarifications: orders.length ? Math.round(avg(orders.map((o) => o.clarification_count)) * 10) / 10 : null,
      };
    },
  };
}

/** 주문서 한 줄 표기 (영수증·카운터 공용) */
export function lineLabel(item) {
  return itemLabel(item.menu_name, item.options?.temperature || null);
}
