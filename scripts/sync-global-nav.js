const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SKIP_DIRS = new Set([".git", "_site", "node_modules", "assets", "css", "data", "js", "scripts", "tools", ".claude", ".github", "docs", "source-candidates", "tests", "pta-open-system", "starter-kit"]);
const SKIP_FILES = new Set(["404.html"]);

const PPC_LINK = /(<a\b[^>]*href=["\']\/ppc-points\.html["\'][^>]*>)PPC(<\/a>)/gi;
const DESKTOP = '<a class="nav-link global-ppc-nav" href="/ppc-points.html">PPC</a>';
const DESKTOP_NEXT = '<a class="nav-link global-ppc-nav" href="/ppc-points.html">個人情報</a>';
const MOBILE = '<a class="mobile-link global-ppc-nav" href="/ppc-points.html">PPC</a>';
const MOBILE_NEXT = '<a class="mobile-link global-ppc-nav" href="/ppc-points.html">個人情報</a>';

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith(".html") && !SKIP_FILES.has(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function sync(file, checkOnly) {
  const original = fs.readFileSync(file, "utf8");
  const next = original.replaceAll(DESKTOP, DESKTOP_NEXT).replaceAll(MOBILE, MOBILE_NEXT).replace(PPC_LINK, "$1個人情報$2");
  if (next !== original && !checkOnly) fs.writeFileSync(file, next, "utf8");
  return next !== original;
}

const checkOnly = process.argv.includes("--check");
const files = walk(ROOT);
const changed = files.filter((file) => sync(file, checkOnly));
if (checkOnly && changed.length) {
  console.error("Global navigation still contains the old PPC label:");
  for (const file of changed) console.error("-", path.relative(ROOT, file).replace(/\\/g, "/"));
  process.exit(1);
}
console.log(`${checkOnly ? "Checked" : "Synced"} global navigation in ${files.length} HTML files; ${changed.length} ${checkOnly ? "need changes" : "changed"}.`);
