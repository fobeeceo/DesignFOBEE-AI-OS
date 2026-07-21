const fs = require("fs");
const path = require("path");

const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", "content-automation-agent", "out", "build"]);

/** root 아래 확장자가 exts인 파일을 재귀 수집 (IGNORE_DIRS 제외). */
function walk(root, exts, out = []) {
  if (!fs.existsSync(root)) return out;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(path.join(root, entry.name), exts, out);
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      out.push(path.join(root, entry.name));
    }
  }
  return out;
}

function readFile(p) {
  return fs.readFileSync(p, "utf8");
}

function rel(p) {
  return path.relative(process.cwd(), p).replace(/\\/g, "/");
}

module.exports = { walk, readFile, rel };
