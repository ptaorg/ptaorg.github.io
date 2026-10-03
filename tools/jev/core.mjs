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


export function selectSkills(task, registry, maxSkills = 6) {
  const skills = Array.isArray(registry?.skills) ? registry.skills : [];
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const selected = [];
  const seen = new Set();

  function add(skill) {
    if (!skill || seen.has(skill.id) || selected.length >= maxSkills) return;
    seen.add(skill.id);
    selected.push(skill);
  }

  for (const id of registry?.defaultSkills ?? []) add(byId.get(id));

  const haystack = String(task ?? "").toLowerCase();
  const scored = skills.map((skill, index) => {
    const keywords = Array.isArray(skill.keywords) ? skill.keywords : [];
    const score = keywords.reduce((count, keyword) => {
      const needle = String(keyword).toLowerCase();
      return count + (needle && haystack.includes(needle) ? 1 : 0);
    }, 0);
    return { skill, score, index };
  }).filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  for (const { skill } of scored) add(skill);
  return selected;
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

const PLANNER_EVIDENCE_PATHS = new Set([
  "cases.html",
  "report.html",
  "timeline-issues.html",
  "claim-evidence-ledger.html",
  "administrative-materials.html",
  "data/board-responses.json",
  "data/site-search-index.js",
  "js/document-data.js"
]);

const SKILL_PATH_ALIASES = {
  "fact-check": ["claim", "evidence", "timeline", "report", "source", "data"],
  "primary-source-research": ["administrative", "materials", "document", "source", "data", "board-responses"],
  "legal-analysis": ["legal", "privacy", "ppc", "law", "civil", "autonomy", "social-education", "school-education"],
  "municipal-response-analysis": ["cases", "board-responses", "response", "municipal", "education", "administrative"],
  "pta-structure-analysis": ["pta", "membership", "fee", "collection", "personnel", "facilities", "school"],
  "website-article": ["journal", "article", "html"],
  "website-edit": ["site", "github", "scripts", "tools", "html", "js"],
  "publish-verification": ["audit", "site", "pages", "browser"],
  "github-review": ["github", "workflow", "actions", "tools", "scripts"]
};

const TASK_PATH_ALIAS_RULES = [
  [/個人情報|privacy|personal data/i, ["privacy", "ppc", "personal-data", "third-party", "nonmember"]],
  [/会費|学校徴収|徴収|fee|collection/i, ["fee", "collection", "dues", "school-fee"]],
  [/任意加入|入会|退会|membership|opt.?in/i, ["membership", "optin", "join", "withdraw"]],
  [/教職員|職員|teacher|staff/i, ["personnel", "teacher", "staff"]],
  [/学校施設|施設|facility/i, ["facilities", "facility"]],
  [/社会教育|social education/i, ["social-education"]],
  [/情報公開|開示|disclosure/i, ["disclosure", "information-request"]],
  [/住民監査|監査|audit/i, ["audit", "resident-audit"]],
  [/松山|自治体|教育委員会|市教委|県教委|行政回答|回答書/i, ["cases", "board-responses", "response", "municipal", "timeline", "claim-evidence", "administrative"]],
  [/JEV|Context Engine|文脈エンジン|AI運用/i, ["jev", "context-engine", "ai-system", "orchestration", "model-routing"]],
  [/サイト|GitHub|記事|論考|HTML|PR\b/i, ["journal", "site", "github", "html"]]
];

function plannerInventoryTerms(task, selectedSkills = []) {
  const terms = new Set(contextTerms(task));
  for (const skill of selectedSkills) {
    for (const alias of SKILL_PATH_ALIASES[skill] ?? []) terms.add(alias);
  }
  for (const [pattern, aliases] of TASK_PATH_ALIAS_RULES) {
    if (!pattern.test(String(task ?? ""))) continue;
    for (const alias of aliases) terms.add(alias);
  }
  return [...terms].map((term) => String(term).normalize("NFKC").toLowerCase()).filter(Boolean);
}

export function selectPlannerInventory(inventory, task, selectedSkills = [], maxEntries = 320) {
  if (!Array.isArray(inventory) || inventory.length <= maxEntries) return [...(inventory ?? [])];
  const terms = plannerInventoryTerms(task, selectedSkills);
  const scored = inventory.map((entry) => {
    const normalized = String(entry.path ?? "").normalize("NFKC").toLowerCase();
    let score = PLANNER_EVIDENCE_PATHS.has(entry.path) ? 1000 : 0;
    for (const term of terms) {
      if (!term || !normalized.includes(term)) continue;
      score += 20 + Math.min(term.length, 20);
    }
    if (!normalized.includes("/")) score += 2;
    return { entry, score };
  });

  const selected = scored.filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.path.localeCompare(b.entry.path))
    .slice(0, maxEntries);
  const seen = new Set(selected.map((item) => item.entry.path));

  if (selected.length < maxEntries) {
    const groups = new Map();
    for (const item of scored) {
      if (seen.has(item.entry.path)) continue;
      const top = item.entry.path.includes("/") ? item.entry.path.split("/")[0] : "(root)";
      if (!groups.has(top)) groups.set(top, []);
      groups.get(top).push(item);
    }
    for (const group of groups.values()) group.sort((a, b) => a.entry.path.localeCompare(b.entry.path));
    const names = [...groups.keys()].sort();
    let progressed = true;
    while (selected.length < maxEntries && progressed) {
      progressed = false;
      for (const name of names) {
        const next = groups.get(name)?.shift();
        if (!next) continue;
        selected.push(next);
        seen.add(next.entry.path);
        progressed = true;
        if (selected.length >= maxEntries) break;
      }
    }
  }
  return selected.map((item) => item.entry);
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

function contextTerms(query) {
  const text = String(query ?? "").normalize("NFKC").toLowerCase();
  if (!text.trim()) return [];
  const stop = new Set(["について", "として", "する", "した", "して", "から", "まで", "また", "その", "この", "ため", "既存", "確認", "整理", "外部"]);
  const out = new Set();
  const segmenter = new Intl.Segmenter("ja", { granularity: "word" });
  for (const part of segmenter.segment(text)) {
    const term = part.segment.trim();
    if (!part.isWordLike || term.length < 2 || stop.has(term)) continue;
    out.add(term);
  }
  return [...out].sort((a, b) => b.length - a.length).slice(0, 32);
}

function focusedSlice(content, budget, query) {
  if (content.length <= budget) return content;
  const terms = contextTerms(query);
  const chunkSize = Math.min(Math.max(budget, 1200), 6000);
  const step = Math.max(800, chunkSize - 500);
  const chunks = [];
  for (let start = 0; start < content.length; start += step) {
    const text = content.slice(start, Math.min(content.length, start + chunkSize));
    let score = 0;
    const normalized = text.normalize("NFKC").toLowerCase();
    for (const term of terms) {
      let pos = normalized.indexOf(term);
      while (pos !== -1) {
        score += Math.min(term.length, 8);
        pos = normalized.indexOf(term, pos + term.length);
      }
    }
    chunks.push({ start, text, score });
    if (start + chunkSize >= content.length) break;
  }
  chunks.sort((a, b) => b.score - a.score || a.start - b.start);
  return (chunks[0]?.text ?? content.slice(0, budget)).slice(0, budget);
}

export async function readContext(root, paths, maxChars, query = "") {
  let used = 0;
  const blocks = [];
  const rootResolved = path.resolve(root);
  const safePaths = paths.map((rel) => String(rel).replaceAll("\\", "/"))
    .filter((safe) => !safe.startsWith("../") && !path.isAbsolute(safe));
  for (let index = 0; index < safePaths.length; index += 1) {
    if (used >= maxChars) break;
    const safe = safePaths[index];
    const abs = path.resolve(root, safe);
    if (abs !== rootResolved && !abs.startsWith(rootResolved + path.sep)) continue;
    try {
      const content = await fs.readFile(abs, "utf8");
      const remainingFiles = Math.max(1, safePaths.length - index);
      const perFileBudget = Math.max(1000, Math.floor((maxChars - used) / remainingFiles));
      const slice = focusedSlice(content, perFileBudget, query);
      used += slice.length;
      blocks.push(`\n--- FILE: ${safe} ---\n${slice}`);
    } catch {
      blocks.push(`\n--- FILE: ${safe} ---\n[unreadable or missing]`);
    }
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(response, payload, attempt) {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = Number.parseFloat(header);
    if (Number.isFinite(seconds)) return Math.max(1000, Math.ceil(seconds * 1000) + 500);
    const when = Date.parse(header);
    if (Number.isFinite(when)) return Math.max(1000, when - Date.now() + 500);
  }
  const message = String(payload?.error?.message ?? "");
  const match = message.match(/try again in\s+([\d.]+)s/i);
  if (match) return Math.max(1000, Math.ceil(Number.parseFloat(match[1]) * 1000) + 500);
  return Math.min(60000, 2000 * (2 ** attempt));
}

export async function callOpenAI({ apiKey, model, reasoning, instructions, input, schema, schemaName, maxOutputTokens, store }) {
  const maxAttempts = 4;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, instructions, input, reasoning: { effort: reasoning }, max_output_tokens: maxOutputTokens, store,
        text: { format: { type: "json_schema", name: schemaName, strict: true, schema } } })
    });
    const payload = await response.json();
    if (response.ok) {
      const text = extractOutputText(payload);
      if (!text) throw new Error(`No structured output returned by ${model}`);
      return { data: JSON.parse(text), usage: payload.usage ?? null, responseId: payload.id ?? null };
    }

    const retryable = response.status === 429 || response.status === 500 || response.status === 502 || response.status === 503 || response.status === 504;
    if (!retryable || attempt === maxAttempts - 1) {
      throw new Error(payload?.error?.message ?? `OpenAI API request failed (${response.status})`);
    }
    await sleep(retryDelayMs(response, payload, attempt));
  }
  throw new Error(`OpenAI API request failed after retries for ${model}`);
}