// 웹 체험판(fobee.co.kr/gbrick-order): 매장 서버 없이 브라우저 안에서 같은 주문 엔진을 돌린다.
// 주문은 이 기기의 브라우저에만 저장되고 매장에는 전달되지 않는다 — 화면에도 그렇게 표시한다.
import { createOrderService } from './backend/orderService.mjs';
import { createMemoryStore } from './backend/memoryStore.mjs';
import { createBrowserPrintProvider } from './backend/print/printService.mjs';
import { route } from './backend/router.mjs';

const STORAGE_KEY = 'gbrick-voice-order-demo';

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-200)));
  } catch {
    /* 저장이 막힌 브라우저(사생활 보호 모드 등)에서도 체험은 된다 */
  }
}

const ready = (async () => {
  const [menu, knowledge] = await Promise.all([
    fetch('data/menu.json').then((r) => r.json()),
    fetch('data/knowledge.json').then((r) => r.json()).catch(() => ({})),
  ]);
  return createOrderService({
    store: createMemoryStore(loadSaved(), save),
    menu,
    printProvider: createBrowserPrintProvider(),
    getKnowledge: () => knowledge,
  });
})();

// app.js보다 먼저 실행되도록 동기적으로 등록한다
window.__voiceOrderApi = async (path, body) => {
  const service = await ready;
  const { pathname } = new URL(path, location.href);
  const out = await route(service, body === undefined ? 'GET' : 'POST', pathname, body || {});
  if (out.status >= 400) throw new Error(out.body?.error || `HTTP ${out.status}`);
  return out.body;
};
