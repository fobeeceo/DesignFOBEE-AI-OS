// API 경로표 — 매장 서버(server.mjs)와 웹 체험판(브라우저, frontend/web-demo.js)이 같은 표를 쓴다.
// 반환: { status, body }. 주문 규칙 오류(OrderError)는 상태 코드로 바꾼다.
import { OrderError } from './orderService.mjs';

export async function route(service, method, pathname, body = {}) {
  const m = (re) => pathname.match(re);
  let match;
  try {
    if (method === 'GET') {
      if (pathname === '/api/health') return { status: 200, body: { ok: true } };
      if (pathname === '/api/menu') return { status: 200, body: service.menu };
      if (pathname === '/api/stats') return { status: 200, body: service.stats() };
      return { status: 404, body: { error: 'not found' } };
    }
    if (method !== 'POST') return { status: 404, body: { error: 'not found' } };
    if (pathname === '/api/sessions') return { status: 201, body: service.startSession(body.input_type) };
    if (pathname === '/api/quote') return { status: 200, body: service.quote(body.items, body.dining) };
    if (pathname === '/api/help') return { status: 200, body: service.requestHelp(body.session_id || null) };
    if ((match = m(/^\/api\/sessions\/([\w-]+)\/(parse|fail|confirm|cancel)$/))) {
      const [, id, action] = match;
      if (action === 'parse') return { status: 200, body: service.parse(id, body.text) };
      if (action === 'fail') return { status: 200, body: service.recordFailure(id, body.reason) };
      if (action === 'confirm') return { status: 200, body: service.confirm(id, body.items, body.dining) };
      if (action === 'cancel') return { status: 200, body: service.cancel(id) };
    }
    if ((match = m(/^\/api\/orders\/(GB-\d{8}-\d{3,})\/print$/))) return { status: 200, body: await service.print(match[1]) };
    if ((match = m(/^\/api\/orders\/(GB-\d{8}-\d{3,})\/print-result$/))) {
      return { status: 200, body: service.reportPrint(match[1], body.ok === true) };
    }
    return { status: 404, body: { error: 'not found' } };
  } catch (e) {
    if (e instanceof OrderError) return { status: e.status, body: { error: e.message } };
    throw e;
  }
}
