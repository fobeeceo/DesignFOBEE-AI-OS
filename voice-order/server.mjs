// GBRICK AI VOICE ORDER MVP v0.1 — 독립 실행 서버 (의존성 없음, Node 18+)
// HTTP  : PC 브라우저용 (localhost)
// HTTPS : 휴대폰·태블릿용. 휴대폰 브라우저는 HTTPS에서만 마이크를 허용한다.
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createJsonStore, createJsonDb } from './backend/store.mjs';
import { createStoreOrders, MODES } from './backend/storeOrders.mjs';
import { routeStore, isStaffApi } from './backend/storeRouter.mjs';
import { createOrderService, OrderError } from './backend/orderService.mjs';
import { route } from './backend/router.mjs';
import { createPrintProvider } from './backend/print/printService.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const STATIC = {
  '/core/': path.join(ROOT, 'core'),
  '/': path.join(ROOT, 'frontend'),
};
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

/**
 * knowledge.json을 파일이 바뀔 때마다 다시 읽는다 — 대표가 고치면 재시작 없이 다음 질문부터 반영.
 * 매장 PC의 knowledge.json은 저장소·업데이트 zip에 들어 있지 않다(덮어쓰기 방지).
 * 없으면 knowledge.example.json(빈 틀)을 복사해 만든다.
 */
export function knowledgeLoader(file = path.join(ROOT, 'data', 'knowledge.json')) {
  const example = path.join(path.dirname(file), 'knowledge.example.json');
  if (!fs.existsSync(file) && fs.existsSync(example)) fs.copyFileSync(example, file);
  let cache = {};
  let stamp = 0;
  return () => {
    try {
      const m = fs.statSync(file).mtimeMs;
      if (m !== stamp) {
        cache = JSON.parse(fs.readFileSync(file, 'utf8'));
        stamp = m;
      }
    } catch (e) {
      console.warn(`[경고] knowledge.json을 읽지 못했습니다 (이전 내용 유지): ${e.message}`);
    }
    return cache;
  };
}

export function loadMenu(file = path.join(ROOT, 'data', 'menu.json')) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw new OrderError('요청이 너무 큽니다.', 413);
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new OrderError('JSON 형식이 아닙니다.');
  }
}

/**
 * STORE MODE 화면: /store/GBRICK_MAIN (손님 태블릿), /counter/GBRICK_MAIN (카운터).
 * 같은 index.html에 매장 ID·모드를 심고 <base href="/">로 자원 경로를 맞춘다.
 */
function storePage(res, file, storeId, mode) {
  const html = fs
    .readFileSync(path.join(ROOT, 'frontend', file), 'utf8')
    .replace('<html lang="ko">', `<html lang="ko" data-mode="store" data-store-id="${storeId}" data-order-mode="${mode}">`)
    .replace('<meta charset="utf-8" />', '<meta charset="utf-8" />\n  <base href="/" />');
  return send(res, 200, html, MIME['.html']);
}

function serveStatic(req, res, storeCtx) {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  // 태블릿(아이패드)이 매장 PC의 자체 인증서를 한 번 '신뢰'하도록 내려받는 주소. 공개 인증서라 비밀이 아니다
  if (url === '/certificate.pem') {
    const cert = path.join(ROOT, 'certs', 'cert-v2.pem');
    if (!fs.existsSync(cert)) return send(res, 404, '인증서가 아직 없습니다. HTTPS가 켜진 뒤 다시 시도하세요.', 'text/plain; charset=utf-8');
    return send(res, 200, fs.readFileSync(cert), 'application/x-x509-ca-cert');
  }
  const sm = url.match(/^\/(store|counter)\/([A-Z0-9_]+)\/?$/);
  if (sm) {
    if (!storeCtx || !storeCtx.orders.stores.some((x) => x.store_id === sm[2])) {
      return send(res, 404, '등록되지 않은 매장입니다.', 'text/plain; charset=utf-8');
    }
    return storePage(res, sm[1] === 'store' ? 'index.html' : 'counter.html', sm[2], storeCtx.orders.mode);
  }
  const routes = { '/': '/index.html', '/dashboard': '/dashboard.html' };
  const p = routes[url] || url;
  const prefix = Object.keys(STATIC).find((k) => p.startsWith(k));
  const base = STATIC[prefix];
  const file = path.normalize(path.join(base, p.slice(prefix.length)));
  if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
  }
  send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] || 'application/octet-stream');
}

// 인터넷 공유(npm run share) 때 밖에서 들어온 요청은 대시보드·통계를 키 없이 볼 수 없다.
// Cloudflare 터널을 거친 요청에는 cf-connecting-ip 헤더가 붙는다. 매장 PC·같은 Wi-Fi에서는 그대로 열린다.
const ADMIN_PATHS = new Set(['/dashboard', '/dashboard.html', '/api/stats']);

/**
 * @param storeCtx  STORE MODE 주문 서버 { orders, engine, sessions } — 없으면 /store·/counter는 404
 * @param staffKey  카운터(직원용 API) 키. 설정되면 X-Staff-Key 헤더가 맞아야 한다.
 *                  설정이 없어도 인터넷 공유(터널)로 들어온 직원용 요청은 막는다.
 */
export function createHandler(service, { shareKey = process.env.SHARE_KEY || '', storeCtx = null, staffKey = process.env.STORE_STAFF_KEY || '' } = {}) {
  return async function handler(req, res) {
    const { pathname, searchParams } = new URL(req.url, 'http://x');
    const external = !!req.headers['cf-connecting-ip'];
    if (external && ADMIN_PATHS.has(pathname) && (!shareKey || searchParams.get('key') !== shareKey)) {
      return send(res, 403, '대시보드는 매장 PC 또는 키가 들어 있는 주소로만 열 수 있습니다.', 'text/plain; charset=utf-8');
    }
    if (isStaffApi(pathname)) {
      const given = req.headers['x-staff-key'] || '';
      const expected = staffKey || (external ? shareKey : '');
      if ((expected && given !== expected) || (external && !expected)) {
        return send(res, 401, { error: '직원 키가 필요합니다.' });
      }
    }
    try {
      if (!pathname.startsWith('/api/')) return serveStatic(req, res, storeCtx);
      const body = req.method === 'POST' ? await readJson(req) : {};
      const storeOut = storeCtx ? await routeStore(storeCtx, req.method, pathname, body) : null;
      if (storeOut) return send(res, storeOut.status, storeOut.body);
      const out = await route(service, req.method, pathname, body);
      return send(res, out.status, out.body);
    } catch (e) {
      if (e instanceof OrderError) return send(res, e.status, { error: e.message });
      console.error(e);
      return send(res, 500, { error: '서버 오류가 발생했습니다.' });
    }
  };
}

export function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal)
    .map((a) => a.address);
}

// Windows는 Git for Windows를 깔아도 openssl이 PATH에 없다 → 설치 경로도 찾아본다
function findOpenssl() {
  const candidates = [
    'C:\\Program Files\\Git\\usr\\bin\\openssl.exe',
    'C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe',
    'C:\\Program Files (x86)\\Git\\usr\\bin\\openssl.exe',
  ];
  return candidates.find((p) => fs.existsSync(p)) || 'openssl';
}

/** 자체 서명 인증서 (openssl 필요). 없으면 HTTPS 없이 HTTP만 연다. */
function ensureCert(dir, ips) {
  // v2: 아이폰·아이패드가 신뢰할 수 있도록 serverAuth 용도를 넣은 인증서. 예전 cert.pem은 쓰지 않고 새로 만든다
  const key = path.join(dir, 'key-v2.pem');
  const cert = path.join(dir, 'cert-v2.pem');
  if (!fs.existsSync(key) || !fs.existsSync(cert)) {
    fs.mkdirSync(dir, { recursive: true });
    const san = ['DNS:localhost', 'IP:127.0.0.1', ...ips.map((ip) => `IP:${ip}`)].join(',');
    execFileSync(findOpenssl(), [
      'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '825',
      '-keyout', key, '-out', cert, '-subj', '/CN=GBRICK Voice Order (Store PC)', '-addext', `subjectAltName=${san}`, '-addext', 'extendedKeyUsage=serverAuth',
    ], { stdio: 'ignore' });
  }
  return { key: fs.readFileSync(key), cert: fs.readFileSync(cert) };
}

/**
 * STORE MODE 준비. 기본은 TEST. PRODUCTION은 VOICE_ORDER_MODE=production 과 STORE_STAFF_KEY(직원 키)가 모두 있어야 켜진다.
 * 모드마다 파일을 따로 써서 테스트 주문이 실제 주문·통계에 섞이지 않는다.
 */
export function createStoreContext({ menu, getKnowledge, dir = path.join(ROOT, 'data'), env = process.env } = {}) {
  const wanted = String(env.VOICE_ORDER_MODE || MODES.TEST).toLowerCase();
  if (wanted !== MODES.TEST && wanted !== MODES.PRODUCTION) {
    throw new Error(`VOICE_ORDER_MODE는 test 또는 production 이어야 합니다 (지금: ${env.VOICE_ORDER_MODE})`);
  }
  if (wanted === MODES.PRODUCTION && !env.STORE_STAFF_KEY) {
    throw new Error('PRODUCTION 모드는 STORE_STAFF_KEY(카운터 직원 키)를 함께 설정해야 켜집니다.');
  }
  const stores = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'stores.json'), 'utf8')).stores;
  const sessions = createJsonStore(path.join(dir, `store-sessions.${wanted}.json`));
  return {
    mode: wanted,
    sessions,
    engine: createOrderService({ store: sessions, menu, getKnowledge, printProvider: createPrintProvider('browser') }),
    orders: createStoreOrders({ db: createJsonDb(path.join(dir, `store-orders.${wanted}.json`)), menu, stores, mode: wanted }),
  };
}

function main() {
  const port = Number(process.env.PORT || 3100);
  const httpsPort = Number(process.env.HTTPS_PORT || 3443);
  const dataFile = process.env.VOICE_ORDER_DATA || path.join(ROOT, 'data', 'orders.json');
  const menu = loadMenu();
  const getKnowledge = knowledgeLoader();
  const service = createOrderService({
    store: createJsonStore(dataFile),
    menu,
    getKnowledge,
    printProvider: createPrintProvider(),
  });
  let storeCtx;
  try {
    storeCtx = createStoreContext({ menu, getKnowledge, dir: process.env.VOICE_ORDER_STORE_DIR || undefined });
  } catch (e) {
    console.error(`\n[중단] ${e.message}\n`);
    process.exit(1);
  }
  const handler = createHandler(service, { storeCtx });
  const ips = lanAddresses();

  http.createServer(handler).listen(port, '0.0.0.0');
  let httpsOk = false;
  try {
    https.createServer(ensureCert(path.join(ROOT, 'certs'), ips), handler).listen(httpsPort, '0.0.0.0');
    httpsOk = true;
  } catch (e) {
    console.warn(`[경고] HTTPS를 열지 못했습니다 (openssl 필요): ${e.message}`);
    console.warn('       아이폰 음성 주문을 쓰려면 Git for Windows(https://git-scm.com)를 설치한 뒤 다시 npm start 하세요.');
  }

  const line = '='.repeat(56);
  console.log(`\n${line}\n GBRICK AI VOICE ORDER  MVP v0.1  (DEMO / TEST DATA)\n${line}`);
  console.log(` PC 주문 화면   : http://localhost:${port}`);
  console.log(` PC 대시보드    : http://localhost:${port}/dashboard`);
  if (httpsOk) {
    for (const ip of ips) console.log(` 휴대폰·태블릿  : https://${ip}:${httpsPort}   (음성 가능)`);
  }
  for (const ip of ips) console.log(` 같은 Wi-Fi(HTTP): http://${ip}:${port}   (텍스트만)`);
  if (!ips.length) console.log(' (네트워크 IP를 찾지 못했습니다. Wi-Fi 연결을 확인하세요)');
  console.log(` 주문 기록 파일 : ${dataFile}`);
  console.log(` 메뉴 지식 문서 : ${path.join(ROOT, 'data', 'knowledge.json')}  (고치면 바로 반영)`);
  const modeLabel = storeCtx.mode === MODES.PRODUCTION ? 'PRODUCTION (실제 주문)' : 'TEST (연습 주문 · 실제 매출 아님)';
  console.log(`${line}\n STORE MODE : ${modeLabel}`);
  const td = menu.takeout_discount;
  if (td) {
    // 이 줄이 안 보이면 예전 버전이 켜져 있는 것이다
    const nameOf = (id) => menu.items.find((m) => m.menu_id === id)?.name || id;
    const special = Object.entries(td.by_menu || {}).map(([id, w]) => `${nameOf(id)} ${w.toLocaleString('ko-KR')}원`);
    console.log(` 포장 할인 : ${[...special, `그 밖의 음료 ${td.default.toLocaleString('ko-KR')}원`].join(' · ')} (할인 없음: ${(td.exclude || []).map(nameOf).join(', ')}, 디저트)`);
  }
  for (const st of storeCtx.orders.stores) {
    const host = ips[0] || 'localhost';
    console.log(` ${st.name} 손님 태블릿 : https://${host}:${httpsPort}/store/${st.store_id}`);
    console.log(` ${st.name} 카운터 화면 : http://localhost:${port}/counter/${st.store_id}`);
    console.log(` 이 컴퓨터에서 손님 화면 시험 : http://localhost:${port}/store/${st.store_id}`);
  }
  if (ips[0]) console.log(` 아이패드 인증서(처음 한 번) : http://${ips[0]}:${port}/certificate.pem`);
  if (!process.env.STORE_STAFF_KEY) console.log(' (직원 키 STORE_STAFF_KEY 미설정 — 같은 Wi-Fi 안에서는 카운터가 키 없이 열립니다)');
  console.log(`${line}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
