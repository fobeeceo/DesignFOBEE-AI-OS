/**
 * sync-voice-order.mjs — 「대화로 주문」 웹 체험판을 홈페이지(fobee.co.kr/gbrick-order)에 싣는다.
 *
 * 원본은 voice-order/ (매장용 음성 주문 MVP) 하나다. 이 스크립트가 빌드 때마다
 * public/gbrick-order/ 로 복사·변환한다. 복사본은 git에 올리지 않는다(.gitignore) — 같은 코드가 두 곳에 있지 않게.
 * next.config.mjs가 불러 실행하므로 `next build`·`next dev` 어느 쪽이든, Vercel 빌드 명령과 상관없이 돈다.
 *
 * 체험판은 매장 서버 없이 브라우저 안에서 같은 주문 엔진을 돌린다(voice-order/frontend/web-demo.js).
 * 주문은 매장에 전달되지 않으므로 화면에 그 사실을 표시한다(CLAUDE.md §0 원칙 1·3).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "voice-order");
const OUT = path.join(ROOT, "public", "gbrick-order");
export const BASE_PATH = "/gbrick-order/";

const FRONTEND = ["index.html", "dashboard.html", "app.js", "api.js", "speech.js", "styles.css", "dashboard.js", "web-demo.js"];
const MODULES = [
  "core/dialog.mjs",
  "core/format.mjs",
  "core/knowledge.mjs",
  "core/parser.mjs",
  "backend/orderService.mjs",
  "backend/memoryStore.mjs",
  "backend/router.mjs",
  "backend/print/printService.mjs",
  "backend/print/receiptTemplate.mjs",
];

// .mjs는 호스팅에 따라 MIME이 달라 모듈 로딩이 막힐 수 있다 → 배포본은 .js로 바꾸고 import 경로도 같이 바꾼다
const toJs = (code) => code.replace(/(\bfrom\s*['"][^'"]+)\.mjs(['"])/g, "$1.js$2").replace(/(\bimport\(\s*['"][^'"]+)\.mjs(['"])/g, "$1.js$2");

function webDemoHtml(html, entry) {
  return html
    .replace("<html lang=\"ko\">", "<html lang=\"ko\" data-mode=\"web-demo\">")
    .replace(
      "<meta charset=\"utf-8\" />",
      `<meta charset="utf-8" />\n  <base href="${BASE_PATH}" />\n  <meta name="robots" content="noindex" />`,
    )
    .replace(
      `<script type="module" src="${entry}"></script>`,
      `<script type="module" src="web-demo.js"></script>\n  <script type="module" src="${entry}"></script>`,
    );
}

function orderPage(html) {
  const out = webDemoHtml(html, "app.js")
    .replace(/<title>[^<]*<\/title>/, "<title>대화로 주문 · GBRICK COFFEE</title>")
    .replace('<span class="demo-tag">DEMO</span>', '<span class="demo-tag">대화로 주문</span>')
    .replace(
      '<p class="lead">말씀만 해주세요.<br />제가 주문을 도와드릴게요.</p>',
      '<p class="lead">말씀만 해주세요.<br />제가 주문을 도와드릴게요.</p>\n        <p class="note">체험판이에요. 여기서 하는 주문은 매장에 전달되지 않아요.</p>',
    );
  for (const must of ['data-mode="web-demo"', "web-demo.js", "체험판이에요", `<base href="${BASE_PATH}"`]) {
    if (!out.includes(must)) throw new Error(`index.html 변환 실패: '${must}' 없음 — voice-order/frontend/index.html 구조가 바뀌었는지 확인`);
  }
  return out;
}

export function syncVoiceOrder({ quiet = false } = {}) {
  if (!fs.existsSync(SRC)) return false;
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, "data"), { recursive: true });

  for (const f of FRONTEND) {
    let code = fs.readFileSync(path.join(SRC, "frontend", f), "utf8");
    if (f === "index.html") code = orderPage(code);
    else if (f === "dashboard.html") code = webDemoHtml(code, "dashboard.js").replace(/<title>[^<]*<\/title>/, "<title>대화로 주문 체험 기록 (이 기기)</title>");
    else if (f.endsWith(".js")) code = toJs(code);
    fs.writeFileSync(path.join(OUT, f), code);
  }
  for (const m of MODULES) {
    const dest = path.join(OUT, m.replace(/\.mjs$/, ".js"));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, toJs(fs.readFileSync(path.join(SRC, m), "utf8")));
  }
  fs.copyFileSync(path.join(SRC, "data", "menu.json"), path.join(OUT, "data", "menu.json"));
  fs.copyFileSync(path.join(SRC, "data", "knowledge.example.json"), path.join(OUT, "data", "knowledge.json"));
  if (!quiet) console.log(`[대화로 주문] voice-order → public/gbrick-order 동기화 완료`);
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) syncVoiceOrder();
