#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const errors = [];

function read(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    errors.push(`${rel}: required file is missing`);
    return "";
  }
  return fs.readFileSync(full, "utf8");
}

const packageJson = JSON.parse(read("package.json") || "{}");
const scripts = packageJson.scripts || {};

const requiredScripts = [
  "test",
  "check:harness",
  "check:site",
  "check:metadata",
  "check:content",
  "check:generated",
  "check:site-js-version",
  "check:url-ledger",
  "check:nav",
  "check:all",
  "generate:all",
];

for (const name of requiredScripts) {
  if (!scripts[name]) errors.push(`package.json: missing script "${name}"`);
}

if (scripts.test !== "npm run check:all") {
  errors.push('package.json: "test" must remain an alias of "npm run check:all"');
}

if (!String(scripts["check:all"] || "").includes("npm run check:harness")) {
  errors.push('package.json: "check:all" must include "npm run check:harness"');
}

const workflow = read(".github/workflows/site-check.yml");
const testIndex = workflow.indexOf("run: npm test");
if (testIndex < 0) {
  errors.push(".github/workflows/site-check.yml: npm test step is missing");
} else {
  const beforeTest = workflow.slice(0, testIndex);
  const mutatingCommands = [
    "node scripts/generate-school-pages.js",
    "node scripts/sync-global-nav.js",
    "node scripts/generate-national-archive.js",
    "node scripts/enhance-public-pages.js",
    "node scripts/generate-sitemap.js",
    "node scripts/generate-search-index.js",
  ];
  for (const command of mutatingCommands) {
    if (beforeTest.includes(command)) {
      errors.push(`.github/workflows/site-check.yml: mutating command runs before npm test: ${command}`);
    }
  }
}

if (!workflow.includes("git diff --exit-code")) {
  errors.push(".github/workflows/site-check.yml: clean-checkout assertion is missing");
}

const agents = read("AGENTS.md");
for (const marker of [
  "カード型ポータル化",
  "既存の文章を、明示的な依頼なしに勝手に短くしません",
  "必要最小限のファイル",
  "ブラウザ確認",
]) {
  if (!agents.includes(marker)) {
    errors.push(`AGENTS.md: required editorial guardrail is missing: ${marker}`);
  }
}

read("SITE_STRUCTURE.md");
read("docs/maintenance.md");

if (errors.length) {
  console.error("Harness policy check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Harness policy check passed.");
