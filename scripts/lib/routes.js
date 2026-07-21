// app/ 디렉토리를 걸어 실제 Next.js App Router 라우트 목록을 만든다.
// route group (auth), 동적 세그먼트 [id]/[...slug], catch-all을 처리한다.
const fs = require("fs");
const path = require("path");

const APP_DIR = path.join(process.cwd(), "app");
const PAGE_FILES = new Set(["page.tsx", "page.ts", "page.jsx", "page.js"]);

/** app/ 를 재귀 스캔해 { urlPattern, filePath }[] 를 반환한다. */
function collectRoutes(dir = APP_DIR, segments = []) {
  const routes = [];
  if (!fs.existsSync(dir)) return routes;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name.startsWith("_")) continue; // private folder
      const isGroup = entry.name.startsWith("(") && entry.name.endsWith(")");
      const nextSegments = isGroup ? segments : [...segments, entry.name];
      routes.push(...collectRoutes(path.join(dir, entry.name), nextSegments));
    } else if (PAGE_FILES.has(entry.name)) {
      const urlPath = "/" + segments.join("/");
      routes.push({ urlPath: urlPath === "/" ? "/" : urlPath, filePath: path.join(dir, entry.name) });
    }
  }
  return routes;
}

/** 라우트 세그먼트를 정규식으로 변환 ([id]->동적, [...slug]->캐치올). */
function routeToRegex(urlPath) {
  const escaped = urlPath
    .split("/")
    .map((seg) => {
      if (!seg) return "";
      if (seg.startsWith("[...")) return "[^/]+(?:/[^/]+)*"; // catch-all
      if (seg.startsWith("[") && seg.endsWith("]")) return "[^/]+"; // dynamic
      return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return new RegExp(`^${escaped || "/"}/?$`);
}

function getRouteMatchers() {
  return collectRoutes().map((r) => ({ ...r, regex: routeToRegex(r.urlPath) }));
}

function routeExists(href, matchers) {
  const clean = href.split("?")[0].split("#")[0];
  return matchers.some((m) => m.regex.test(clean));
}

module.exports = { collectRoutes, getRouteMatchers, routeExists };
