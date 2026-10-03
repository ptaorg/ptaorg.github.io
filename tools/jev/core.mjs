import fs from "node:fs/promises";
import path from "node:path";

const SIDE_EFFECT_RULES = [
  ["external_send", /\b(send|email|mail|message|post)\b|送信する|送信して|メール送信|返信する|返信して|投稿する|投稿して|発信する|発信して/i],
  ["publish", /\b(publish|release|go live)\b|公開する|公開して|公開まで|掲載する|掲載して|掲載まで|公表する|公表して/i],
  ["delete", /\b(delete|remove|destroy)\b|削除する|削除して|消去する|消去して|消して/i],
  ["git_push", /\b(git\s+push|push)\b|プッシュ/i],
  ["git_merge", /\b(merge|auto-merge)\b|マージ/i],
  ["deploy", /\b(deploy|deployment)\b|デプロイ/i],
  ["financial_action", /\b(pay|purchase|charge|refund|transfer)\b|支払う|支払って|購入する|購入して|決済する|決済して|返金する|返金して|送金する|送金して/i],
  ["credential_change", /\b(api key|password|secret|credential)\b.*\b(create|rotate|change|delete)\b|APIキー.*(作成|変更|削除)|パスワード.*(変更|削除)/i],
  ["repository_write", /\b(commit|write|modify|edit|update|patch)\b|コミット|書き換え|書き換えて|変更する|変更して|修正する|修正して|編集する|編集して/i]
];

const HIGH_RISK_RULES = [
  ["legal_interpretation", /法令|判例|法律|違法|適法|法的|legal|statute|case law/i],
  ["privacy_personal_data", /個人情報|個人データ|privacy|personal data|PII/i],
  ["public_claim", /断定|公表|声明|public claim|official statement/i],
  ["financial_analysis", /会費|予算|支出|収入|financial|budget|payment/i]
];

export function classifyRisk(text) {
  const match = (rules) => [...new Set(rules.filter(([, re]) => re.test(text)).map(([name]) => name))];
  const sideEffects = match(SIDE_EFFECT_RULES);
  const seniorReview = match(HIGH_RISK_RULES);
  return { sideEffects, seniorReview, requiresHumanApproval: sideEffects.length > 0, requiresSeniorReview: seniorReview.length > 0 || sideEffects.length > 0 };
}


function normalizeMatchText(value) {
  return String(value ?? "").normalize("NFKC").toLowerCase();
}

function matchesSelectionRule(haystack, rule) {
  const match = rule?.match ?? {};
  const allOf = Array.isArray(match.allOf) ? match.allOf : [];
  const anyOf = Array.isArray(match.anyOf) ? match.anyOf : [];
  const noneOf = Array.isArray(match.noneOf) ? match.noneOf : [];
  if (!allOf.length && !anyOf.length) return false;

  const contains = (term) => {
    const needle = normalizeMatchText(term);
    return Boolean(needle) && haystack.includes(needle);
  };
  return allOf.every(contains)
    && (!anyOf.length || anyOf.some(contains))
    && noneOf.every((term) => !contains(term));
}

export function selectSkills(task, registry, maxSkills = 6) {
  const skills = Array.isArray(registry?.skills) ? registry.skills : [];
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const selected = [];
  const seen = new Set();
  const parsedLimit = Number.parseInt(String(maxSkills), 10);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 6;

  function add(skill) {
    if (!skill || seen.has(skill.id) || selected.length >= limit) return;
    seen.add(skill.id);
    selected.push(skill);
  }

  for (const id of registry?.defaultSkills ?? []) add(byId.get(id));

  const haystack = normalizeMatchText(task);
  const rules = (Array.isArray(registry?.selectionRules) ? registry.selectionRules : [])
    .map((rule, index) => ({ rule, index }))
    .filter(({ rule }) => matchesSelectionRule(haystack, rule))
    .sort((a, b) => (Number(b.rule.priority ?? 0) - Number(a.rule.priority ?? 0)) || a.index - b.index);

  for (const { rule } of rules) {
    for (const id of rule.skills ?? []) add(byId.get(id));
  }

  const scored = skills.map((skill, index) => {
    const keywords = Array.isArray(skill.keywords) ? skill.keywords : [];
    const score = keywords.reduce((count, keyword) => {
      const needle = normalizeMatchText(keyword);
      return count + (needle && haystack.includes(needle) ? 1 : 0);
    }, 0);
    return { skill, score, index, priority: Number(skill.priority ?? 0) };
  }).filter((x) => x.score > 0);

  const ordered = scored.filter((x) => !x.skill.fallback)
    .sort((a, b) => b.score - a.score || b.priority - a.priority || a.index - b.index);
  const fallback = scored.filter((x) => x.skill.fallback)
    .sort((a, b) => b.score - a.score || b.priority - a.priority || a.index - b.index);

  for (const { skill } of ordered) add(skill);
  for (const { skill } of fallback) add(skill);
  return selected;
}

export function collectSeniorReviewFlags(selectedSkills) {
  return [...new Set((selectedSkills ?? []).flatMap((skill) =>
    Array.isArray(skill?.seniorReview) ? skill.seniorReview : []
  ))];
}

export function clampWorkerCount(value, config) {
  const parsed = Number.parseInt(String(value ?? config.limits.defaultWorkers), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return config.limits.defaultWorkers;
  return Math.min(parsed, config.limits.maxWorkers);
}

export async function buildInventory(root, config) {
  const out = [];
  const excluded = new Set(config.files.excludeDirectories);
  const allowed = new Set(config.files.extensions);
  async function walk(abs, rel) {
    const entries = await fs.readdir(abs, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (out.length >= config.limits.maxInventoryEntries) return;
      if (entry.isDirectory() && excluded.has(entry.name)) continue;
      const childAbs = path.join(abs, entry.name);
      const childRel = rel ? path.posix.join(rel, entry.name) : entry.name;
      if (entry.isDirectory()) await walk(childAbs, childRel);
      else if (entry.isFile() && allowed.has(path.extname(entry.name).toLowerCase())) {
        const stat = await fs.stat(childAbs);
        out.push({ path: childRel.replaceAll("\\", "/"), bytes: stat.size });
      }
    }
  }
  await walk(path.resolve(root), "");
  return out;
}

export function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text;
  const parts = [];
  for (const item of payload?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const content of item.content ?? []) if (content?.type === "output_text" && typeof content.text === "string") parts.push(content.text);
  }
  return parts.join("\n");
}

export function prefilterWorkerResults(workerResults) {
  const seen = new Set();
  return workerResults.map((result) => ({
    ...result,
    findings: (result.findings ?? []).filter((finding) => {
      const evidence = (finding.evidence ?? []).map((x) => x.path).sort().join("|");
      const key = `${finding.finding.trim().toLowerCase()}::${evidence}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
  }));
}

export async function readContext(root, paths, maxChars) {
  let used = 0;
  const blocks = [];
  const rootResolved = path.resolve(root);
  for (const rel of paths) {
    if (used >= maxChars) break;
    const safe = String(rel).replaceAll("\\", "/");
    if (safe.startsWith("../") || path.isAbsolute(safe)) continue;
    const abs = path.resolve(root, safe);
    if (abs !== rootResolved && !abs.startsWith(rootResolved + path.sep)) continue;
    try {
      const content = await fs.readFile(abs, "utf8");
      const slice = content.slice(0, maxChars - used);
      used += slice.length;
      blocks.push(`\n--- FILE: ${safe} ---\n${slice}`);
    } catch { blocks.push(`\n--- FILE: ${safe} ---\n[unreadable or missing]`); }
  }
  return blocks.join("\n");
}

export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runner() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return results;
}

export async function callOpenAI({ apiKey, model, reasoning, instructions, input, schema, schemaName, maxOutputTokens, store }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, instructions, input, reasoning: { effort: reasoning }, max_output_tokens: maxOutputTokens, store,
      text: { format: { type: "json_schema", name: schemaName, strict: true, schema } } })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message ?? `OpenAI API request failed (${response.status})`);
  const text = extractOutputText(payload);
  if (!text) throw new Error(`No structured output returned by ${model}`);
  return { data: JSON.parse(text), usage: payload.usage ?? null, responseId: payload.id ?? null };
}
