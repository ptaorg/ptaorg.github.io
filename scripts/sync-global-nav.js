const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SKIP_DIRS = new Set([".git", "_site", "node_modules", "assets", "css", "data", "js", "scripts", "tools", ".claude", ".github", "docs", "source-candidates", "tests", "pta-open-system", "starter-kit"]);
const SKIP_FILES = new Set(["404.html"]);
const CORE_NAV_FILES = [
  "index.html",
  "membership.html",
  "framework.html",
  "guide-parent.html",
  "guide-pta.html",
  "guide-board.html",
  "guide-research.html",
  "privacy.html",
  "fee-collection.html",
  "personnel.html",
  "facilities.html",
  "board-responses.html",
  "national-archive.html",
  "journal.html",
  "research-index.html"
];
const CORE_NAV_MARKERS = [
  "global-nav-v102",
  "global-membership-nav",
  "global-ppc-nav",
  'data-global-nav-group="audience"',
  'data-global-nav-group="school"',
  'data-global-nav-group="research"',
  'data-global-nav-group="reading"',
  "global-board-nav",
  "global-submit-nav",
  'class="hamburger"',
  'class="mobile-overlay"'
];

const PPC_LINK = /(<a\b[^>]*href=["\']\/ppc-points\.html["\'][^>]*>)(?:PPC|個人情報)(<\/a>)/gi;
const MEMBERSHIP_DESKTOP = /(<a class="nav-link(?: global-membership-nav)?") href="\/pta-membership-optin\.html"/g;
const MEMBERSHIP_MOBILE = /(<a class="mobile-link(?: global-membership-nav)?") href="\/pta-membership-optin\.html"/g;
const DESKTOP = '<a class="nav-link global-ppc-nav" href="/ppc-points.html">PPC</a>';
const DESKTOP_NEXT = DESKTOP;
const MOBILE = '<a class="mobile-link global-ppc-nav" href="/ppc-points.html">PPC</a>';
const MOBILE_NEXT = MOBILE;

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
  const next = original
    .replaceAll(DESKTOP, DESKTOP_NEXT)
    .replaceAll(MOBILE, MOBILE_NEXT)
    .replace(PPC_LINK, "$1PPC$2")
    .replace(MEMBERSHIP_DESKTOP, "$1 href=\"/membership.html\"")
    .replace(MEMBERSHIP_MOBILE, "$1 href=\"/membership.html\"");
  if (next !== original && !checkOnly) fs.writeFileSync(file, next, "utf8");
  return next !== original;
}

function checkCoreNavigation() {
  const errors = [];
  for (const rel of CORE_NAV_FILES) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) {
      errors.push(`${rel}: file missing`);
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    const missing = CORE_NAV_MARKERS.filter((marker) => !html.includes(marker));
    if (missing.length) errors.push(`${rel}: missing ${missing.join(", ")}`);
  }
  return errors;
}

const checkOnly = process.argv.includes("--check");
const files = walk(ROOT);
const changed = files.filter((file) => sync(file, checkOnly));
if (checkOnly && changed.length) {
  console.error("Global navigation is out of sync (PPC label or membership entry):");
  for (const file of changed) console.error("-", path.relative(ROOT, file).replace(/\\/g, "/"));
  process.exit(1);
}
if (checkOnly) {
  const coreErrors = checkCoreNavigation();
  if (coreErrors.length) {
    console.error("Core pages do not share the current global navigation:");
    for (const error of coreErrors) console.error("-", error);
    process.exit(1);
  }
}
console.log(`${checkOnly ? "Checked" : "Synced"} global navigation in ${files.length} HTML files; ${changed.length} ${checkOnly ? "need changes" : "changed"}.`);
