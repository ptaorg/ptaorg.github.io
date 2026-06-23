import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const errors = [];
const warnings = [];

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
  "https://ptaorg.com/reality.html"
];

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function walk(dir = ".", out = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (entry.name === ".git") continue;
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
    /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
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
