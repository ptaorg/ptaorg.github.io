const fs = require("fs");
const path = require("path");
const { ROOT, writeFileIfChanged } = require("./archive-utils");

const SKIP_DIRS = new Set([".git", ".claude", "_site", "assets", "css", "data", "js", "scripts", "tools", "node_modules", "ホーム"]);
const SKIP_FILES = new Set(["404.html"]);

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function stripTags(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeBasicEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function cleanTitle(title) {
  return decodeBasicEntities(stripTags(title))
    .replace(/\s*[｜|]\s*PTA適正化推進委員会\s*$/u, "")
    .replace(/\s*-\s*PTA適正化推進委員会\s*$/u, "")
    .trim();
}

function matchFirst(html, regex) {
  const matched = html.match(regex);
  return matched ? matched[1] : "";
}

function extractMetaDescription(html) {
  const direct = matchFirst(html, /<meta\s+name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (direct) return decodeBasicEntities(direct);
  const reversed = matchFirst(html, /<meta\s+content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
  return decodeBasicEntities(reversed);
}

function isPublishableHtml(html) {
  return !/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)
    && !/http-equiv=["']refresh["']/i.test(html);
}

function htmlPathToUrl(filePath) {
  let rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  if (rel === "index.html") return "/index.html";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  return `/${rel}`;
}

function collectHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectHtmlFiles(path.join(dir, entry.name), files);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      const filePath = path.join(dir, entry.name);
      const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
      if (SKIP_FILES.has(rel)) continue;
      files.push(filePath);
    }
  }
  return files;
}

function pageRecord(filePath) {
  const html = read(filePath);
  if (!isPublishableHtml(html)) return null;

  const title = cleanTitle(matchFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i))
    || cleanTitle(matchFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i));
  if (!title) return null;

  const description = extractMetaDescription(html)
    || decodeBasicEntities(stripTags(matchFirst(html, /<p[^>]*class=["'][^"']*(?:hero-lead|section-lead|lead)[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)))
    || title;

  return [title, htmlPathToUrl(filePath), description.replace(/\s+/g, " ").slice(0, 160)];
}

function main() {
  const records = collectHtmlFiles(ROOT)
    .map(pageRecord)
    .filter(Boolean)
    .sort((a, b) => {
      if (a[1] === "/index.html") return -1;
      if (b[1] === "/index.html") return 1;
      return a[1].localeCompare(b[1]);
    });

  const output = `window.PTA_SITE_SEARCH_INDEX = ${JSON.stringify(records, null, 2)};\n`;
  const target = path.join(ROOT, "data", "site-search-index.js");
  const changed = writeFileIfChanged(target, output);
  console.log(`Generated data/site-search-index.js with ${records.length} pages (${changed ? "changed" : "unchanged"}).`);
}

if (require.main === module) {
  main();
}
