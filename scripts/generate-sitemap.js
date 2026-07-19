const fs = require("fs");
const path = require("path");
const { ROOT, SITE_ORIGIN, listSchoolData, writeFileIfChanged } = require("./archive-utils");

const SKIP_DIRS = new Set([".git", ".claude", "_site", "node_modules", "#U30db#U30fc#U30e0", "assets", "css", "data", "js", "scripts", "tools", "ホーム"]);
const SKIP_FILES = new Set(["404.html", "PTA#U904b#U55b6#U9069#U6b63#U5316#U30ac#U30a4#U30c9#U30d6#U30c3#U30af_#U7b2c4#U7248_#U6539#U8a02#U672c#U6587.html"]);

function isPublishableHtml(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  return !/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)
    && !/http-equiv=["']refresh["']/i.test(html);
}

function toIsoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function fileLastmod(filePath) {
  return toIsoDate(fs.statSync(filePath).mtime);
}

function walkHtml(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkHtml(path.join(dir, entry.name), files);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      const filePath = path.join(dir, entry.name);
      const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
      if (SKIP_FILES.has(rel)) continue;
      if (!isPublishableHtml(filePath)) continue;
      files.push(filePath);
    }
  }
  return files;
}

function htmlFileToUrl(filePath) {
  let rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  if (rel === "index.html") return `${SITE_ORIGIN}/`;
  if (rel.endsWith("/index.html")) rel = rel.slice(0, -"index.html".length);
  return encodeURI(`${SITE_ORIGIN}/${rel}`);
}

function priorityFor(url) {
  if (url === `${SITE_ORIGIN}/`) return "1.0";
  if (url.endsWith("/national-archive.html") || url.endsWith("/compliance.html")) return "0.9";
  if (url.includes("/archive/atsugi/")) return "0.7";
  return "0.8";
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function upsertUrl(urls, url, lastmod) {
  const current = urls.get(url);
  if (!current || lastmod > current.lastmod) urls.set(url, { url, lastmod });
}

function main() {
  const urls = new Map();

  for (const filePath of walkHtml(ROOT)) {
    upsertUrl(urls, htmlFileToUrl(filePath), fileLastmod(filePath));
  }

  for (const record of listSchoolData()) {
    const pagePath = path.join(ROOT, record.basePath.replace(/^\/+/, ""), "index.html");
    if (fs.existsSync(pagePath)) upsertUrl(urls, record.canonical, fileLastmod(pagePath));
  }

  const sorted = Array.from(urls.values()).sort((a, b) => {
    if (a.url === `${SITE_ORIGIN}/`) return -1;
    if (b.url === `${SITE_ORIGIN}/`) return 1;
    return a.url.localeCompare(b.url);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sorted.map(({ url, lastmod }) => `  <url>
    <loc>${xmlEscape(url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priorityFor(url)}</priority>
  </url>`).join("\n")}
</urlset>`;

  const changed = writeFileIfChanged(path.join(ROOT, "sitemap.xml"), xml);
  console.log(`Generated sitemap.xml with ${sorted.length} URLs (${changed ? "changed" : "unchanged"}).`);
}

if (require.main === module) {
  main();
}
