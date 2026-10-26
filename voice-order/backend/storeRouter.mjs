// STORE MODE API 경로표 — /api/store/:storeId/...
// 손님 태블릿용(대화·주문·도움 요청)과 직원용(카운터·상태·출력·통계)을 나눈다. 직원용은 server.mjs가 직원 키를 확인한다.
import { OrderError, maskPersonal } from './orderService.mjs';
import { detectDining } from '../core/parser.mjs';
import { renderStoreReceipt } from './print/receiptTemplate.mjs';

const BASE = /^\/api\/store\/([A-Z0-9_]+)(\/.*)?$/;
// 규칙형이 알아듣지 못한 말만 AI 바리스타에게 묻는다 (알아들은 주문은 빠르고 비용 없이 규칙형으로)
const AI_KINDS = new Set(['unclear', 'not_found', 'unanswered']);
const STAFF = [/^\/counter$/, /^\/stats$/, /^\/orders\/[\w-]+\/(status|print)$/, /^\/help\/[\w-]+\/resolve$/];

/** 직원만 쓰는 경로인가 (카운터·상태 변경·출력·통계) */
export function isStaffApi(pathname) {
  const m = pathname.match(BASE);
  return !!m && STAFF.some((re) => re.test(m[2] || ''));
}

/**
 * @param ctx { orders: createStoreOrders(), engine: createOrderService() (매장 대화 세션), sessions: 세션 저장소 }
 * @returns { status, body } | null(이 경로표 밖)
 */
export async function routeStore(ctx, method, pathname, body = {}) {
  const m = pathname.match(BASE);
  if (!m) return null;
  const [, storeId, rest = ''] = m;
  const { orders, engine, sessions } = ctx;
  let x;
  try {
    const store = orders.store(storeId); // 없는 매장이면 404
    const own = (id) => {
      const s = sessions.get(id);
      if (!s || s.store_id !== storeId) throw new OrderError('대화 기록을 찾을 수 없습니다.', 404);
      return s;
    };

    if (method === 'GET') {
      if (rest === '/health') return { status: 200, body: { ok: true, store_id: storeId, mode: orders.mode, server_time: new Date().toISOString() } };
      if (rest === '/config') return { status: 200, body: { store, mode: orders.mode, ai: { enabled: !!ctx.ai?.enabled } } };
      if (rest === '/counter') return { status: 200, body: orders.counter(storeId) };
      if (rest === '/stats') {
        const mine = sessions.all().filter((s) => s.store_id === storeId);
        return { status: 200, body: { ...orders.stats(storeId, mine), ai: ctx.ai?.enabled ? ctx.ai.stats() : null } };
      }
      return { status: 404, body: { error: 'not found' } };
    }
    if (method !== 'POST') return { status: 404, body: { error: 'not found' } };

    // ---- 손님 태블릿 ----
    if (rest === '/sessions') return { status: 201, body: engine.startSession(body.input_type, { store_id: storeId, mode: orders.mode }) };
    if ((x = rest.match(/^\/sessions\/([\w-]+)\/(parse|fail|cancel)$/))) {
      own(x[1]);
      if (x[2] === 'parse') return { status: 200, body: await parseWithAi(ctx, x[1], body) };
      if (x[2] === 'fail') return { status: 200, body: engine.recordFailure(x[1], body.reason) };
      return { status: 200, body: engine.cancel(x[1]) };
    }
    if (rest === '/quote') return { status: 200, body: engine.quote(body.items, body.dining) };
    if (rest === '/orders') {
      const session = body.session_id ? own(body.session_id) : null;
      const order = orders.create({
        store_id: storeId,
        items: body.items,
        dining: body.dining,
        order_source: body.order_source,
        idempotency_key: body.idempotency_key,
        session,
        clarification_count: body.clarification_count,
      });
      if (session && session.status === 'IN_PROGRESS') {
        sessions.update(session.id, { status: 'CONFIRMED', order_id: order.order_id, confirmed_at: order.created_at });
      }
      return { status: order.duplicate ? 200 : 201, body: order };
    }
    if (rest === '/help') {
      if (body.session_id) own(body.session_id);
      return { status: 201, body: orders.requestHelp({ store_id: storeId, session_id: body.session_id || null, order_id: body.order_id || null }) };
    }

    // ---- 직원(카운터) ----
    if ((x = rest.match(/^\/orders\/([\w-]+)\/status$/))) {
      return { status: 200, body: orders.setStatus(storeId, x[1], body.status, body.actor || 'counter') };
    }
    if ((x = rest.match(/^\/orders\/([\w-]+)\/print$/))) {
      const order = orders.markPrinted(storeId, x[1], body.actor || 'counter');
      return { status: 200, body: { order, html: renderStoreReceipt(order, store) } };
    }
    if ((x = rest.match(/^\/help\/([\w-]+)\/resolve$/))) {
      return { status: 200, body: orders.resolveHelp(storeId, x[1], body.actor || 'counter') };
    }
    return { status: 404, body: { error: 'not found' } };
  } catch (e) {
    if (e instanceof OrderError) return { status: e.status, body: { error: e.message } };
    throw e;
  }
}

/**
 * 규칙형 → (못 알아들으면) AI 바리스타. AI가 실패하면 규칙형 결과 그대로.
 * AI가 담은 메뉴는 메뉴판으로 검증된 것만 오고, 손님 화면은 기존 확인 질문·확인 화면을 그대로 거친다.
 */
async function parseWithAi({ engine, sessions, ai }, sessionId, body) {
  const r = engine.parse(sessionId, body.text);
  // "뭐 마시면 좋을까요"처럼 조건 없는 추천은 메뉴 50개를 보여주기보다 AI가 대화로 권한다 (온도·종류 조건이 있으면 기존 보기 그대로)
  const openSuggest = r.kind === 'suggest' && !r.temperature && !r.category && !r.not_coffee;
  if (!ai?.enabled || !(AI_KINDS.has(r.kind) || openSuggest)) return r;
  const sess = sessions.get(sessionId);
  const history = sess.ai_turns || [];
  const out = await ai.reply({ text: body.text, history, cart: Array.isArray(body.cart) ? body.cart.slice(0, 20) : [] });
  if (!out) return r;
  const ordered = out.items.length > 0 && !out.wants_help;
  // AI가 알아들었으면 '실패'로 세지 않는다 (KPI·답 못 한 질문은 실제로 못 한 것만)
  const transcripts = sess.transcripts.map((t, i) => (i === sess.transcripts.length - 1 ? { ...t, kind: ordered ? 'ai_order' : 'ai_chat' } : t));
  const failCount = Math.max(0, sess.fail_count - (AI_KINDS.has(r.kind) ? 1 : 0)); // suggest는 처음부터 실패로 세지 않았다
  sessions.update(sessionId, {
    transcripts,
    fail_count: failCount,
    ai_turns: [...history, { role: 'user', text: maskPersonal(body.text) }, { role: 'model', text: out.say }].slice(-8),
  });
  if (ordered) {
    return {
      kind: out.items.some((i) => !i.temperature) ? 'clarify' : 'ok',
      items: out.items,
      dining: out.dining || detectDining(body.text),
      unknown: [],
      unavailable: [],
      unrecognized: [],
      fail_count: failCount,
      ai: true,
    };
  }
  return { kind: 'chat', say: out.say, wants_help: out.wants_help, items: [], fail_count: failCount, ai: true };
}
