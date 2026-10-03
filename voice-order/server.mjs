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
import { createJsonStore } from './backend/store.mjs';
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

function serveStatic(req, res) {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
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

export function createHandler(service, { shareKey = process.env.SHARE_KEY || '' } = {}) {
  return async function handler(req, res) {
    const { pathname, searchParams } = new URL(req.url, 'http://x');
    if (req.headers['cf-connecting-ip'] && ADMIN_PATHS.has(pathname) && (!shareKey || searchParams.get('key') !== shareKey)) {
      return send(res, 403, '대시보드는 매장 PC 또는 키가 들어 있는 주소로만 열 수 있습니다.', 'text/plain; charset=utf-8');
    }
    try {
      if (!pathname.startsWith('/api/')) return serveStatic(req, res);
      const body = req.method === 'POST' ? await readJson(req) : {};
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
  const key = path.join(dir, 'key.pem');
  const cert = path.join(dir, 'cert.pem');
  if (!fs.existsSync(key) || !fs.existsSync(cert)) {
    fs.mkdirSync(dir, { recursive: true });
    const san = ['DNS:localhost', 'IP:127.0.0.1', ...ips.map((ip) => `IP:${ip}`)].join(',');
    execFileSync(findOpenssl(), [
      'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '825',
      '-keyout', key, '-out', cert, '-subj', '/CN=GBRICK Voice Order (DEMO)', '-addext', `subjectAltName=${san}`,
    ], { stdio: 'ignore' });
  }
  return { key: fs.readFileSync(key), cert: fs.readFileSync(cert) };
}

function main() {
  const port = Number(process.env.PORT || 3100);
  const httpsPort = Number(process.env.HTTPS_PORT || 3443);
  const dataFile = process.env.VOICE_ORDER_DATA || path.join(ROOT, 'data', 'orders.json');
  const service = createOrderService({
    store: createJsonStore(dataFile),
    menu: loadMenu(),
    getKnowledge: knowledgeLoader(),
    printProvider: createPrintProvider(),
  });
  const handler = createHandler(service);
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
  console.log(` 메뉴 지식 문서 : ${path.join(ROOT, 'data', 'knowledge.json')}  (고치면 바로 반영)\n${line}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
