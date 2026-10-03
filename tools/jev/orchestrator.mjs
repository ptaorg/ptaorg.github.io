#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { plannerSchema, workerSchema, jevSchema, seniorSchema, secretarySchema } from "./schemas.mjs";
import {
  buildInventory, callOpenAI, clampWorkerCount, classifyRisk, extractOutputText,
  mapLimit, prefilterWorkerResults, readContext
} from "./core.mjs";

export { buildInventory, clampWorkerCount, classifyRisk, extractOutputText, prefilterWorkerResults } from "./core.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(HERE, "config.json");

export async function loadConfig(configPath = CONFIG_PATH) {
  return JSON.parse(await fs.readFile(configPath, "utf8"));
}

function parseArgs(argv) {
  const args = { scope: ".", workers: null, task: null, check: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--check") args.check = true;
    else if (arg === "--task") args.task = argv[++i];
    else if (arg === "--scope") args.scope = argv[++i];
    else if (arg === "--workers") args.workers = argv[++i];
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function usage() {
  return `JEV fixed orchestration (read-only)\n\nUsage:\n  node tools/jev/orchestrator.mjs --check\n  node tools/jev/orchestrator.mjs --task "<task>" [--scope .] [--workers 8]\n\nEnvironment:\n  OPENAI_API_KEY  Required for an actual run.\n\nThe orchestrator never writes to the repository, pushes, merges, sends, publishes, deletes, deploys, or performs financial/credential actions. It only produces analysis and approval queues.`;
}

async function runPipeline({ task, scope, workers, config, apiKey }) {
  const inventory = await buildInventory(scope, config);
  const taskRisk = classifyRisk(task);
  const inventoryText = inventory.map((x) => `${x.path}\t${x.bytes}`).join("\n");

  const planner = await callOpenAI({
    apiKey, model: config.models.planner, reasoning: config.reasoning.planner,
    instructions: [
      "You are the planning manager for a read-only multi-agent workflow.",
      `Create at most ${workers} independent work items.`,
      "Use only exact repository paths from the supplied inventory; use an empty paths array when files are unnecessary.",
      "Do not perform or authorize side effects. Any write/send/publish/delete/push/merge/deploy/payment/credential request must be marked requires_human_approval=true.",
      "Prefer partitioning that reduces duplicated reading while still allowing independent verification."
    ].join(" "),
    input: `TASK:\n${task}\n\nDETERMINISTIC RISK FLAGS:\n${JSON.stringify(taskRisk)}\n\nFILE INVENTORY (path<TAB>bytes):\n${inventoryText}`,
    schema: plannerSchema, schemaName: "jev_plan", maxOutputTokens: config.limits.maxPlannerOutputTokens, store: config.runtime.storeResponses
  });

  const validPaths = new Set(inventory.map((x) => x.path));
  const workItems = planner.data.work_items.slice(0, workers).map((item) => ({
    ...item,
    paths: item.paths.filter((p) => validPaths.has(p)),
    requires_human_approval: item.requires_human_approval || classifyRisk(item.objective).requiresHumanApproval
  }));

  const workerCalls = await mapLimit(workItems, workers, async (item) => {
    const context = await readContext(scope, item.paths, config.limits.maxContextCharsPerWorker);
    const deterministicRisk = classifyRisk(`${task}\n${item.objective}`);
    const response = await callOpenAI({
      apiKey, model: config.models.worker, reasoning: config.reasoning.worker,
      instructions: [
        "You are a focused AI worker. Inspect only the assigned objective and supplied file contents.",
        "Report concrete evidence, not impressions. Do not invent URLs, files, laws, facts, or test results.",
        "severity: 0 informational, 1 minor, 2 material, 3 critical. risk: 0 low, 1 limited, 2 significant, 3 high-impact.",
        "If legal/privacy/public-claim/financial interpretation is involved, set requires_senior_review=true.",
        "If any action would write, send, publish, delete, push, merge, deploy, pay, or change credentials, set requires_human_approval=true.",
        "This worker is read-only and must never claim that a change was executed."
      ].join(" "),
      input: `GLOBAL TASK:\n${task}\n\nWORK ITEM:\n${JSON.stringify(item)}\n\nDETERMINISTIC RISK FLAGS:\n${JSON.stringify(deterministicRisk)}\n\nCONTEXT:${context || "\n(no file context)"}`,
      schema: workerSchema, schemaName: "jev_worker_result", maxOutputTokens: config.limits.maxWorkerOutputTokens, store: config.runtime.storeResponses
    });
    response.data.task_id = item.id;
    for (const finding of response.data.findings) {
      const risk = classifyRisk(`${finding.finding}\n${finding.recommended_action}`);
      finding.requires_human_approval ||= risk.requiresHumanApproval || item.requires_human_approval;
      finding.requires_senior_review ||= risk.requiresSeniorReview || item.risk === "high";
    }
    return response.data;
  });

  const compactWorkers = prefilterWorkerResults(workerCalls);
  const jev = await callOpenAI({
    apiKey, model: config.models.jev, reasoning: config.reasoning.jev,
    instructions: [
      "You are JEV, the fixed triage and compression layer. You are not the final expert.",
      "Deduplicate overlapping findings, merge evidence, discard unsupported/noise findings, and route only meaningful issues upward.",
      "Route to senior when confidence < 0.90, risk >= 2, severity >= 2, or specialist judgment is required.",
      "Route to human whenever a side effect is proposed or a worker requires human approval.",
      "Never downgrade a human-approval requirement. Never claim an action was executed."
    ].join(" "),
    input: `GLOBAL TASK:\n${task}\n\nWORKER RESULTS:\n${JSON.stringify(compactWorkers)}`,
    schema: jevSchema, schemaName: "jev_triage", maxOutputTokens: config.limits.maxJevOutputTokens, store: config.runtime.storeResponses
  });

  const humanSourceTasks = new Set();
  const seniorSourceTasks = new Set();
  for (const result of compactWorkers) for (const finding of result.findings ?? []) {
    if (finding.requires_human_approval) humanSourceTasks.add(result.task_id);
    if (finding.requires_senior_review) seniorSourceTasks.add(result.task_id);
  }
  for (const issue of jev.data.issues) {
    const risk = classifyRisk(`${issue.title}\n${issue.summary}\n${issue.recommended_action}`);
    const inheritedHuman = issue.source_task_ids.some((id) => humanSourceTasks.has(id));
    const inheritedSenior = issue.source_task_ids.some((id) => seniorSourceTasks.has(id));
    if (risk.requiresHumanApproval || inheritedHuman) issue.route = "human";
    else if ((risk.requiresSeniorReview || inheritedSenior || issue.confidence < 0.9 || issue.risk >= 2 || issue.severity >= 2) && issue.route === "complete") issue.route = "senior";
  }

  const seniorInput = jev.data.issues.filter((x) => x.route === "senior" || x.route === "human");
  let senior = { data: { summary: "No senior review required.", reviewed: [] } };
  if (seniorInput.length) senior = await callOpenAI({
    apiKey, model: config.models.senior, reasoning: config.reasoning.senior,
    instructions: [
      "You are the senior reviewer. Validate material, uncertain, legal, privacy, public-claim, financial, or side-effect issues.",
      "Be conservative about unsupported claims and distinguish evidence from inference.",
      "Any external send, publication, deletion, repository write/push/merge, deployment, payment, or credential change must remain a human decision.",
      "You may accept, revise, discard, or escalate to human. You do not execute actions."
    ].join(" "),
    input: `GLOBAL TASK:\n${task}\n\nJEV ESCALATIONS:\n${JSON.stringify(seniorInput)}`,
    schema: seniorSchema, schemaName: "jev_senior_review", maxOutputTokens: config.limits.maxSeniorOutputTokens, store: config.runtime.storeResponses
  });

  const forcedHumanTitles = new Set(jev.data.issues.filter((x) => x.route === "human").map((x) => x.title));
  for (const review of senior.data.reviewed ?? []) if (forcedHumanTitles.has(review.title)) review.decision = "human";

  const secretary = await callOpenAI({
    apiKey, model: config.models.secretary, reasoning: config.reasoning.secretary,
    instructions: [
      "You are the secretary layer. Produce a concise decision brief from the completed pipeline.",
      "Do not add new factual claims. Clearly separate completed analysis from items requiring human decision.",
      "The runtime is read-only, so never say a file, email, publication, push, merge, deployment, payment, or credential change was executed."
    ].join(" "),
    input: `GLOBAL TASK:\n${task}\n\nPLAN:\n${JSON.stringify(planner.data)}\n\nJEV:\n${JSON.stringify(jev.data)}\n\nSENIOR:\n${JSON.stringify(senior.data)}\n\nRUNTIME POLICY:\n${JSON.stringify(config.runtime)}`,
    schema: secretarySchema, schemaName: "jev_secretary_brief", maxOutputTokens: config.limits.maxSecretaryOutputTokens, store: config.runtime.storeResponses
  });

  const secretaryHumanTitles = new Set(secretary.data.needs_human.map((x) => x.title));
  for (const issue of jev.data.issues.filter((x) => x.route === "human")) if (!secretaryHumanTitles.has(issue.title)) {
    secretary.data.needs_human.push({ title: issue.title, decision_needed: issue.recommended_action, reason: `Fixed approval gate: ${issue.reason}` });
  }

  return {
    policy: config.policyName, version: config.version, runtime: config.runtime, task, scope: path.resolve(scope), models: config.models,
    worker_count: workItems.length, inventory_count: inventory.length, plan: planner.data, worker_results: compactWorkers,
    jev: jev.data, senior: senior.data, secretary: secretary.data
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return console.log(usage());
  const config = await loadConfig();
  if (args.check) {
    return console.log(JSON.stringify({ ok: true, policy: config.policyName, version: config.version, readOnly: config.runtime.readOnly,
      models: config.models, defaultWorkers: clampWorkerCount(config.limits.defaultWorkers, config), maxWorkers: config.limits.maxWorkers }, null, 2));
  }
  if (!args.task) throw new Error("--task is required. Use --help for usage.");
  if (!config.runtime.readOnly) throw new Error("Refusing to run: fixed policy requires runtime.readOnly=true.");
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for an actual run. No key is stored in the repository.");
  const result = await runPipeline({ task: args.task, scope: args.scope, workers: clampWorkerCount(args.workers, config), config, apiKey });
  const json = JSON.stringify(result, null, 2);
  console.log(json);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(`JEV orchestrator error: ${error.message}`); process.exitCode = 1; });
}
