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



const aiSystemFiles = [
  "ai-system/README.md",
  "ai-system/CORE_INSTRUCTIONS.md",
  "ai-system/ORCHESTRATION.md",
  "ai-system/QUALITY_STANDARD.md",
  "ai-system/SKILL_REGISTRY.json",
];
for (const rel of aiSystemFiles) read(rel);

let skillRegistry = {};
try {
  skillRegistry = JSON.parse(read("ai-system/SKILL_REGISTRY.json") || "{}");
} catch (error) {
  errors.push(`ai-system/SKILL_REGISTRY.json: invalid JSON: ${error.message}`);
}
let jevConfig = {};
try {
  jevConfig = JSON.parse(read("tools/jev/config.json") || "{}");
} catch (error) {
  errors.push(`tools/jev/config.json: invalid JSON: ${error.message}`);
}

if (Number(skillRegistry.version || 0) < 3) {
  errors.push("ai-system/SKILL_REGISTRY.json: registry version must be at least 3");
}

const skills = Array.isArray(skillRegistry.skills) ? skillRegistry.skills : [];
const skillIds = new Set();
for (const skill of skills) {
  if (!skill.id) {
    errors.push("ai-system/SKILL_REGISTRY.json: skill without id");
    continue;
  }
  if (skillIds.has(skill.id)) errors.push(`ai-system/SKILL_REGISTRY.json: duplicate skill id "${skill.id}"`);
  skillIds.add(skill.id);
}

for (const requiredSkill of [
  "primary-source-research",
  "legal-analysis",
  "municipal-response-analysis",
  "pta-structure-analysis",
  "pta-membership",
  "school-pta-personal-data",
  "school-fee-collection",
  "teacher-pta-involvement",
  "school-facility-public-private",
  "social-education-pta",
  "administrative-oversight",
  "pta-officer-selection",
  "pta-bylaws-membership-rules",
  "school-pta-delegation-contract",
  "administrative-inquiry-drafting",
  "personal-data-purpose-ledger",
  "public-private-funds",
  "pta-dissolution-restructuring",
  "website-article",
  "website-edit",
  "publish-verification",
  "fact-check",
  "email-investigation",
  "drive-investigation",
  "pdf-analysis",
  "github-review",
]) {
  if (!skillIds.has(requiredSkill)) errors.push(`ai-system/SKILL_REGISTRY.json: missing required skill "${requiredSkill}"`);
}

for (const id of skillRegistry.defaultSkills || []) {
  if (!skillIds.has(id)) errors.push(`ai-system/SKILL_REGISTRY.json: unknown default skill "${id}"`);
}

const allowedSeniorReview = new Set(jevConfig?.approval?.seniorReview || []);
const requiredPtaHeadings = [
  "## 目的",
  "## 発火条件",
  "## 確認すべき事実",
  "## 優先する一次資料",
  "## 法的確認ポイント",
  "## よくある誤り",
  "## 出力形式",
  "## Seniorへエスカレーションする条件",
];

for (const skill of skills) {
  if (!skill.path) {
    errors.push(`ai-system/SKILL_REGISTRY.json: skill "${skill.id || "(unknown)"}" has no path`);
    continue;
  }
  const skillText = read(path.posix.join("ai-system", skill.path));
  if (skill.domain === "pta") {
    for (const heading of requiredPtaHeadings) {
      if (!skillText.includes(heading)) errors.push(`${skill.path}: PTA skill missing required heading "${heading}"`);
    }
  }
  for (const review of skill.seniorReview || []) {
    if (!allowedSeniorReview.has(review)) {
      errors.push(`ai-system/SKILL_REGISTRY.json: skill "${skill.id}" uses unknown seniorReview flag "${review}"`);
    }
  }
}

const ruleIds = new Set();
const maxSkillCount = Number(jevConfig?.limits?.maxSkillCount || 0);
for (const rule of skillRegistry.selectionRules || []) {
  if (!rule.id) {
    errors.push("ai-system/SKILL_REGISTRY.json: selection rule without id");
  } else if (ruleIds.has(rule.id)) {
    errors.push(`ai-system/SKILL_REGISTRY.json: duplicate selection rule id "${rule.id}"`);
  } else {
    ruleIds.add(rule.id);
  }

  const allOf = Array.isArray(rule?.match?.allOf) ? rule.match.allOf : [];
  const anyOf = Array.isArray(rule?.match?.anyOf) ? rule.match.anyOf : [];
  if (!allOf.length && !anyOf.length) {
    errors.push(`ai-system/SKILL_REGISTRY.json: selection rule "${rule.id || "(unknown)"}" has no positive match terms`);
  }

  if (!Array.isArray(rule.skills) || !rule.skills.length) {
    errors.push(`ai-system/SKILL_REGISTRY.json: selection rule "${rule.id || "(unknown)"}" has no skills`);
    continue;
  }
  for (const id of rule.skills) {
    if (!skillIds.has(id)) errors.push(`ai-system/SKILL_REGISTRY.json: selection rule "${rule.id}" references unknown skill "${id}"`);
  }
  if (maxSkillCount > 0 && new Set([...(skillRegistry.defaultSkills || []), ...rule.skills]).size > maxSkillCount) {
    errors.push(`ai-system/SKILL_REGISTRY.json: selection rule "${rule.id}" cannot fit with default skills inside maxSkillCount=${maxSkillCount}`);
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
