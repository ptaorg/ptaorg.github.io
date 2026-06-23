const fs = require("fs");
const path = require("path");
const { ROOT, SITE_ORIGIN, listSchoolData, writeFileIfChanged } = require("./archive-utils");

const SKIP_DIRS = new Set([".git", ".claude", "#U30db#U30fc#U30e0", "assets", "css", "data", "js", "scripts", "tools", "ホーム"]);
const SKIP_FILES = new Set(["404.html", "PTA#U904b#U55b6#U9069#U6b63#U5316#U30ac#U30a4#U30c9#U30d6#U30c3#U30af_#U7b2c4#U7248_#U6539#U8a02#U672c#U6587.html"]);
const LASTMOD = new Date().toISOString().slice(0, 10);

function isPublishableHtml(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  return !/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)
    && !/http-equiv=["']refresh["']/i.test(html);
}

function walkHtml(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkHtml(path.join(dir, entry.name), files);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      const rel = path.relative(ROOT, path.join(dir, entry.name)).replace(/\\/g, "/");
      if (SKIP_FILES.has(rel)) continue;
      if (!isPublishableHtml(path.join(dir, entry.name))) continue;
      files.push(path.join(dir, entry.name));
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

function main() {
  const urls = new Set(walkHtml(ROOT).map(htmlFileToUrl));

  for (const record of listSchoolData()) {
    const pagePath = path.join(ROOT, record.basePath.replace(/^\/+/, ""), "index.html");
    if (fs.existsSync(pagePath)) urls.add(record.canonical);
  }

  const sorted = Array.from(urls).sort((a, b) => {
    if (a === `${SITE_ORIGIN}/`) return -1;
    if (b === `${SITE_ORIGIN}/`) return 1;
    return a.localeCompare(b);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sorted.map((url) => `  <url>
    <loc>${xmlEscape(url)}</loc>
    <lastmod>${LASTMOD}</lastmod>
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
