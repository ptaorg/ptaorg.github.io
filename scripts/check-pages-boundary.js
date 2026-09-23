#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const errors = [];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const config = read("_config.yml");
const excludes = new Set(
  config.split(/\r?\n/)
    .map((line) => line.match(/^\s*-\s+(.+?)\s*$/)?.[1])
    .filter(Boolean)
);

const requiredExcludes = [
  "docs/",
  "source-candidates/",
  "scripts/",
  "tests/",
  "tools/",
  "node_modules/",
  "package-lock.json",
  "package.json",
  "README.md",
  "AGENTS.md",
  "SITE_STRUCTURE.md",
  "URL_LEDGER.md",
  "コミット手順.md",
  "shorts/",
  "parts/",
  ".claude/",
  ".github/",
  "pta-open-system/"
];

for (const item of requiredExcludes) {
  if (!excludes.has(item)) errors.push(`_config.yml exclude missing: ${item}`);
}

const forbiddenCatalogPrefixes = [
  "/pta-open-system/",
  "/shorts/",
  "/parts/",
  "/scripts/",
  "/tools/",
  "/docs/",
  "/source-candidates/",
  "/tests/",
  "/.github/",
  "/.claude/"
];

const sitemap = read("sitemap.xml");
const locs = [...sitemap.matchAll(/<loc>https:\/\/ptaorg\.com([^<]*)<\/loc>/g)]
  .map((match) => match[1] || "/");

for (const url of locs) {
  if (forbiddenCatalogPrefixes.some((prefix) => url.startsWith(prefix))) {
    errors.push(`sitemap contains non-public path: ${url}`);
  }
}

const searchRaw = read("data/site-search-index.js").trim();
const prefix = "window.PTA_SITE_SEARCH_INDEX = ";
if (!searchRaw.startsWith(prefix)) {
  errors.push("site search index header is invalid");
} else {
  try {
    const json = searchRaw.slice(prefix.length, searchRaw.endsWith(";") ? -1 : undefined);
    const records = JSON.parse(json);
    for (const record of records) {
      const url = String(record?.[1] || "");
      if (forbiddenCatalogPrefixes.some((p) => url.startsWith(p))) {
        errors.push(`site search contains non-public path: ${url}`);
      }
    }
  } catch (error) {
    errors.push(`site search index JSON is invalid: ${error.message}`);
  }
}

const starterDir = path.join(ROOT, "starter-kit");
if (fs.existsSync(starterDir)) {
  for (const name of fs.readdirSync(starterDir)) {
    if (!name.endsWith(".html")) continue;
    const rel = `starter-kit/${name}`;
    const html = read(rel);
    const robots = html.match(/<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["']([^"']*)["'])[^>]*>/i);
    if (!robots || !robots[1].toLowerCase().includes("noindex")) {
      errors.push(`legacy starter-kit page must be noindex: ${rel}`);
    }
  }
}

function sourceFileForUrl(urlPath) {
  let rel = decodeURIComponent(urlPath || "/").replace(/^\/+/, "");
  if (!rel) return "index.html";
  if (rel.endsWith("/")) rel += "index.html";
  return rel;
}

for (const url of locs) {
  const rel = sourceFileForUrl(url);
  if (!fs.existsSync(path.join(ROOT, rel))) {
    errors.push(`sitemap source file missing: ${url} -> ${rel}`);
  }
}

const singletonPatterns = [
  ["description", /<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/gi],
  ["robots", /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/gi],
  ["canonical", /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi],
  ["og:title", /<meta\b(?=[^>]*\bproperty=["']og:title["'])[^>]*>/gi],
  ["og:description", /<meta\b(?=[^>]*\bproperty=["']og:description["'])[^>]*>/gi],
  ["og:url", /<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>/gi]
];

for (const url of locs) {
  const rel = sourceFileForUrl(url);
  if (!rel.endsWith(".html") || !fs.existsSync(path.join(ROOT, rel))) continue;
  const html = read(rel);
  for (const [label, pattern] of singletonPatterns) {
    pattern.lastIndex = 0;
    const count = [...html.matchAll(pattern)].length;
    if (count > 1) errors.push(`duplicate ${label} metadata: ${rel} (${count})`);
  }
}

if (errors.length) {
  console.error("Pages boundary check failed:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}

console.log(`Pages boundary check passed: ${locs.length} sitemap URLs, required excludes present, legacy pages noindex.`);
