import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const errors = [];
const warnings = [];

const siteOrigin = "https://ptaorg.com";
const internalHosts = new Set(["ptaorg.com", "www.ptaorg.com", "ptaorg.github.io"]);
const requiredFiles = [
  "index.html",
  "documents.html",
  "national-archive.html",
  "board-responses.html",
  "guide-board.html",
  "contact.html",
  "support.html",
  "sitemap.xml",
  "assets/diagrams/site-three-pillars.svg"
];
const requiredSitemapUrls = [
  "https://ptaorg.com/",
  "https://ptaorg.com/board-responses.html",
  "https://ptaorg.com/national-archive.html",
  "https://ptaorg.com/documents.html",
  "https://ptaorg.com/contact.html",
  "https://ptaorg.com/support.html",
  "https://ptaorg.com/education-board-responsibility.html",
  "https://ptaorg.com/compliance.html",
  "https://ptaorg.com/research-index.html"
];

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function walk(dir = ".", out = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if ([".git", "_site", "node_modules"].includes(entry.name)) continue;
    const rel = dir === "." ? entry.name : `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel, out);
    else out.push(rel.replaceAll("\\", "/"));
  }
  return out;
}

function trackedFiles() {
  const raw = execSync("git -c core.quotePath=false ls-files -z", { cwd: root });
  const files = raw.toString("utf8").split("\0").filter(Boolean).map((file) => file.replaceAll("\\", "/"));
  for (const file of walk()) files.push(file);
  return new Set(files);
}

function stripUrl(url) {
  return url.split("#")[0].split("?")[0];
}

function normalizeInternalRef(raw, baseFile) {
  if (!raw || raw.includes("${")) return null;
  if (/^(mailto:|tel:|javascript:|data:|blob:|#)/i.test(raw)) return null;

  let ref = raw.trim();
  if (/^https?:\/\//i.test(ref)) {
    let url;
    try {
      url = new URL(ref);
    } catch {
      return null;
    }
    if (!internalHosts.has(url.hostname)) return null;
    ref = `${url.pathname}${url.search}${url.hash}`;
  }
  if (ref.startsWith("//")) return null;

  ref = stripUrl(ref);
  if (!ref || ref === "/") return "index.html";

  try {
    ref = decodeURI(ref);
  } catch {
    // Keep the original string when it is not valid URI encoding.
  }

  if (ref.startsWith("/")) ref = ref.slice(1);
  else ref = path.posix.normalize(path.posix.join(path.posix.dirname(baseFile), ref));
  ref = ref.replace(/^\.\//, "");
  if (ref.endsWith("/")) ref += "index.html";
  return ref;
}

function checkRequiredFiles() {
  for (const file of requiredFiles) {
    if (!exists(file)) errors.push(`${file} が見つかりません。`);
  }
}

function checkSitemap() {
  if (!exists("sitemap.xml")) return;

  const sitemap = read("sitemap.xml");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const locSet = new Set(locs);
  const duplicates = locs.filter((url, index) => locs.indexOf(url) !== index);
  const malformed = locs.filter((url) => /\/\//.test(url.replace(/^https?:\/\//, "")));

  if (duplicates.length) warnings.push(`sitemap.xml に重複URLがあります: ${[...new Set(duplicates)].join(", ")}`);
  if (malformed.length) errors.push(`sitemap.xml に二重スラッシュURLがあります: ${malformed.join(", ")}`);

  for (const url of requiredSitemapUrls) {
    if (!locSet.has(url)) errors.push(`sitemap.xml に ${url} がありません。`);
  }
  if (locs.some((url) => /#U30db|%23U30db|%E3%83%9B%E3%83%BC%E3%83%A0|\/donate\//i.test(url))) {
    errors.push("sitemap.xml に重複ホーム又はリダイレクト専用ページが含まれています。");
  }
}

function attributeValue(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return match ? match[2].trim() : "";
}

function lineNumber(text, index) {
  return text.slice(0, index).split("\n").length;
}

function publicHtmlFiles() {
  if (!exists("sitemap.xml")) return [];
  const files = [];
  for (const match of read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const url = new URL(match[1]);
      if (!internalHosts.has(url.hostname)) continue;
      let file = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      if (!file || file.endsWith("/")) file += "index.html";
      if (file.endsWith(".html") && exists(file)) files.push(file);
    } catch {
      // URL validity is reported by the sitemap and internal-reference checks.
    }
  }
  return [...new Set(files)];
}

function htmlFileFromUrl(url) {
  let file = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (!file || file.endsWith("/")) file += "index.html";
  return file;
}

function dynamicFragmentExists(file, fragment) {
  const answer = file === "board-responses.html" && fragment.match(/^ans-(\d+)$/);
  if (!answer || !exists("data/board-responses.json")) return false;
  const data = JSON.parse(read("data/board-responses.json"));
  return Array.isArray(data.responses)
    && data.responses.some((response) => String(response.no) === answer[1]);
}

function checkPublicHtmlBasics() {
  for (const file of publicHtmlFiles()) {
    const html = read(file);
    if (!/<html\b[^>]*\blang\s*=\s*["'][^"']+["']/i.test(html)) {
      errors.push(`公開ページの言語指定がありません: ${file}`);
    }
    if (!/<meta\b[^>]*\bname\s*=\s*["']viewport["'][^>]*>/i.test(html)) {
      errors.push(`公開ページのviewport指定がありません: ${file}`);
    }

    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      if (!/\balt\s*=\s*["'][^"']*["']/i.test(match[0])) {
        errors.push(`画像の代替テキスト属性がありません: ${file}:${lineNumber(html, match.index)}`);
      }
    }

    const labelRanges = [...html.matchAll(/<label\b[^>]*>[\s\S]*?<\/label>/gi)]
      .map((match) => [match.index, match.index + match[0].length]);
    const labelledIds = new Set(
      [...html.matchAll(/<label\b[^>]*\bfor\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1])
    );
    for (const match of html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)) {
      const tag = match[0];
      if (attributeValue(tag, "type").toLowerCase() === "hidden") continue;
      const id = attributeValue(tag, "id");
      const wrapped = labelRanges.some(([start, end]) => start < match.index && match.index < end);
      const named = Boolean(
        attributeValue(tag, "aria-label")
        || attributeValue(tag, "aria-labelledby")
        || attributeValue(tag, "title")
        || (id && labelledIds.has(id))
        || wrapped
      );
      if (!named) {
        errors.push(`入力欄の読み上げ名がありません: ${file}:${lineNumber(html, match.index)}`);
      }
    }

    for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
      const tag = match[0];
      if (attributeValue(tag, "target").toLowerCase() !== "_blank") continue;
      const rel = attributeValue(tag, "rel").toLowerCase().split(/\s+/);
      if (!rel.includes("noopener")) {
        errors.push(`別タブリンクにnoopenerがありません: ${file}:${lineNumber(html, match.index)}`);
      }
    }
  }
}

function maskNonContentMarkup(html) {
  const preserveLines = (block) => block.replace(/[^\n]/g, " ");
  return html
    .replace(/<!--[\s\S]*?-->/g, preserveLines)
    .replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, preserveLines);
}

function checkHeadingHierarchy() {
  for (const file of publicHtmlFiles()) {
    const html = maskNonContentMarkup(read(file));
    const headings = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map((match) => ({
      level: Number(match[1]),
      line: lineNumber(html, match.index),
    }));
    const h1Count = headings.filter((heading) => heading.level === 1).length;
    if (h1Count !== 1) {
      errors.push(`公開ページのH1は1個でなければなりません: ${file} (${h1Count}個)`);
    }
    for (let index = 1; index < headings.length; index += 1) {
      const previous = headings[index - 1];
      const current = headings[index];
      if (current.level > previous.level + 1) {
        errors.push(
          `見出しレベルが飛んでいます: ${file}:${current.line} (h${previous.level}→h${current.level})`
        );
      }
    }
  }
}

function checkInternalFragments() {
  for (const file of publicHtmlFiles()) {
    const html = read(file);
    const pageUrl = file === "index.html" ? `${siteOrigin}/` : new URL(file, `${siteOrigin}/`).href;
    for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
      const href = attributeValue(match[0], "href");
      if (!href.includes("#") || /^(?:mailto:|tel:|javascript:|data:)/i.test(href)) continue;

      let targetUrl;
      try {
        targetUrl = new URL(href, pageUrl);
      } catch {
        continue;
      }
      if (!internalHosts.has(targetUrl.hostname) || !targetUrl.hash) continue;

      let fragment;
      let targetFile;
      try {
        fragment = decodeURIComponent(targetUrl.hash.slice(1));
        targetFile = htmlFileFromUrl(targetUrl);
      } catch {
        errors.push(`内部リンクのフラグメントを解釈できません: ${file}:${lineNumber(html, match.index)} (${href})`);
        continue;
      }
      if (!fragment || fragment.startsWith(":~:text=") || !exists(targetFile)) continue;

      const targetHtml = read(targetFile);
      const targetIds = new Set(
        [...targetHtml.matchAll(/\b(?:id|name)\s*=\s*["']([^"']+)["']/gi)].map((idMatch) => idMatch[1])
      );
      if (!targetIds.has(fragment) && !dynamicFragmentExists(targetFile, fragment)) {
        errors.push(`内部リンクの移動先IDが見つかりません: ${file}:${lineNumber(html, match.index)} (${href})`);
      }
    }
  }
}

function checkInternalRefs() {
  const tracked = trackedFiles();
  const trackedLower = new Map([...tracked].map((file) => [file.toLowerCase(), file]));
  const scanFiles = walk().filter((file) => {
    if (!/\.(html|css|js|xml|json|webmanifest)$/i.test(file)) return false;
    if (/^(scripts|tools)\//.test(file)) return false;
    if (file === "js/site-v48-original.js") return false;
    return true;
  });
  const patterns = [
    /\b(?:href|src|action|poster)\s*=\s*["']([^"']+)["']/gi,
    /(?<![\w-])url\(\s*["']?([^"')]+)["']?\s*\)/gi,
    /<loc>([^<]+)<\/loc>/gi
  ];
  const missing = new Map();
  const caseMismatches = new Map();

  for (const file of scanFiles) {
    const text = read(file);
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text))) {
        // JavaScript URL constructors are not CSS url() references.
        if (pattern === patterns[1] && /\.js$/i.test(file) && /\bnew\s+$/i.test(text.slice(0, match.index))) continue;
        const ref = normalizeInternalRef(match[1], file);
        if (!ref) continue;
        if (tracked.has(ref) || tracked.has(`${ref}/index.html`)) continue;
        const exact = trackedLower.get(ref.toLowerCase());
        const bucket = exact ? caseMismatches : missing;
        const key = exact ? `${ref} -> ${exact}` : ref;
        if (!bucket.has(key)) bucket.set(key, new Set());
        bucket.get(key).add(file);
      }
    }
  }

  for (const [ref, files] of missing) {
    errors.push(`内部参照先が見つかりません: ${ref} (${[...files].slice(0, 4).join(", ")})`);
  }
  for (const [ref, files] of caseMismatches) {
    errors.push(`内部参照の大文字小文字が一致しません: ${ref} (${[...files].slice(0, 4).join(", ")})`);
  }
}

function looksLikePng(buf) {
  return buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}

function looksLikeJpeg(buf) {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function looksLikePdf(buf) {
  return buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "%PDF";
}

function checkAssetSignatures() {
  for (const file of walk()) {
    if (!/\.(png|jpe?g|pdf)$/i.test(file)) continue;
    const buf = fs.readFileSync(path.join(root, file));
    const lower = file.toLowerCase();
    if (lower.endsWith(".png") && !looksLikePng(buf)) warnings.push(`PNG拡張子ですがPNG実体ではありません: ${file}`);
    if ((lower.endsWith(".jpg") || lower.endsWith(".jpeg")) && !looksLikeJpeg(buf)) warnings.push(`JPEG拡張子ですがJPEG実体ではありません: ${file}`);
    if (lower.endsWith(".pdf") && !looksLikePdf(buf)) warnings.push(`PDF拡張子ですがPDF実体ではありません: ${file}`);
  }
}

function checkGoogleSitesLinks() {
  const publicFiles = walk().filter((file) => /\.(html|js)$/i.test(file) && !file.startsWith("data/"));
  const offenders = publicFiles.filter((file) => /sites\.google\.com|script\.google\.com\/macros\/s\//i.test(read(file)));
  if (offenders.length) {
    errors.push(`Googleサイト又はGAS公開URLと思われるリンクがあります: ${offenders.join(", ")}`);
  }
}

checkRequiredFiles();
checkSitemap();
checkPublicHtmlBasics();
checkHeadingHierarchy();
checkInternalFragments();
checkInternalRefs();
checkAssetSignatures();
checkGoogleSitesLinks();

if (warnings.length) {
  console.warn("WARNINGS");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error("ERRORS");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("site check passed");
