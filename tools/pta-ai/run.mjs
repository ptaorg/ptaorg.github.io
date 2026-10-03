#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../..");
const ORCHESTRATOR = path.join(REPO_ROOT, "tools", "jev", "orchestrator.mjs");

export function parseArgs(argv) {
  const args = {
    workers: 3,
    scope: REPO_ROOT,
    runsDir: process.env.PTA_AI_RUNS_DIR || path.join(os.homedir(), "Documents", "PTA-AI", "runs"),
    check: false,
    help: false,
    taskParts: []
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--workers") args.workers = Number.parseInt(argv[++i], 10);
    else if (arg === "--scope") args.scope = path.resolve(argv[++i]);
    else if (arg === "--runs-dir") args.runsDir = path.resolve(argv[++i]);
    else if (arg === "--check") args.check = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else args.taskParts.push(arg);
  }
  if (!Number.isInteger(args.workers) || args.workers < 1 || args.workers > 50) {
    throw new Error("--workers must be an integer from 1 to 50.");
  }
  args.task = args.taskParts.join(" ").trim();
  return args;
}

function usageText() {
  return [
    "PTA AI launcher",
    "",
    "Usage:",
    "  pta-ai \"松山市の最新状況を整理\"",
    "  pta-ai --workers 3 \"PTA会費の学校徴収を分析\"",
    "  pta-ai --check",
    "",
    "Defaults:",
    "  workers: 3",
    "  runs: %USERPROFILE%\\Documents\\PTA-AI\\runs",
    "",
    "The launcher keeps the JEV pipeline read-only."
  ].join("\n");
}

function runId(now = new Date()) {
  return now.toISOString().replace(/[:.]/g, "-");
}

async function spawnNode(args, options = {}) {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: REPO_ROOT, env: process.env, windowsHide: true, ...options });
    let stdout = "";
    let stderr = "";
    if (child.stdout) child.stdout.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
    if (child.stderr) child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

function safeUsage(usage) {
  return {
    input_tokens: Number(usage?.input_tokens ?? 0),
    output_tokens: Number(usage?.output_tokens ?? 0),
    total_tokens: Number(usage?.total_tokens ?? 0),
    cached_input_tokens: Number(usage?.cached_input_tokens ?? 0),
    reasoning_output_tokens: Number(usage?.reasoning_output_tokens ?? 0)
  };
}

export function buildRunSummary(result, meta = {}) {
  const total = safeUsage(result?.api_usage?.total);
  const selectedNotes = (result?.context_engine?.selected_notes ?? []).map((note) => note.path);
  return {
    run_id: meta.runId ?? null,
    status: meta.status ?? "success",
    started_at: meta.startedAt ?? null,
    finished_at: meta.finishedAt ?? null,
    duration_ms: Number(meta.durationMs ?? 0),
    task: result?.task ?? meta.task ?? "",
    worker_count: Number(result?.worker_count ?? meta.workers ?? 0),
    models: result?.models ?? {},
    selected_notes: selectedNotes,
    api_usage: {
      total,
      planner: safeUsage(result?.api_usage?.planner),
      workers: (result?.api_usage?.workers ?? []).map((entry) => ({ task_id: entry.task_id ?? null, ...safeUsage(entry) })),
      jev: safeUsage(result?.api_usage?.jev),
      senior: safeUsage(result?.api_usage?.senior),
      secretary: safeUsage(result?.api_usage?.secretary)
    },
    jev_issue_count: Number(result?.jev?.issues?.length ?? 0),
    senior_review_count: Number(result?.senior?.reviewed?.length ?? 0),
    human_decision_count: Number(result?.secretary?.needs_human?.length ?? 0),
    result_path: meta.resultPath ?? null,
    summary_path: meta.summaryPath ?? null
  };
}

async function appendJsonl(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, JSON.stringify(value) + "\n", "utf8");
}

async function runCheck() {
  const vault = process.env.PTA_CONTEXT_VAULT;
  const commandArgs = [ORCHESTRATOR, "--check"];
  if (vault) commandArgs.push("--vault", vault);
  const outcome = await spawnNode(commandArgs);
  if (outcome.stdout) process.stdout.write(outcome.stdout);
  if (outcome.stderr) process.stderr.write(outcome.stderr);
  process.exitCode = outcome.code ?? 1;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(usageText()); return; }
  if (args.check) { await runCheck(); return; }
  if (!args.task) throw new Error("Task text is required. Use --help for usage.");
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set.");
  if (!process.env.PTA_CONTEXT_VAULT) throw new Error("PTA_CONTEXT_VAULT is not set.");

  const started = new Date();
  const id = runId(started);
  const runDir = path.join(args.runsDir, id);
  const taskPath = path.join(runDir, "task.txt");
  const resultPath = path.join(runDir, "result.json");
  const summaryPath = path.join(runDir, "summary.json");
  const indexPath = path.join(args.runsDir, "index.jsonl");

  await fs.mkdir(runDir, { recursive: true });
  await fs.writeFile(taskPath, args.task + "\n", "utf8");
  console.log("PTA AI: start (" + args.workers + " workers)");
  console.log("run: " + id);

  const outcome = await spawnNode([
    ORCHESTRATOR, "--task-file", taskPath, "--scope", args.scope,
    "--workers", String(args.workers), "--output", resultPath
  ]);

  if (outcome.code !== 0) {
    const finished = new Date();
    const failure = {
      run_id: id, status: "failed", started_at: started.toISOString(), finished_at: finished.toISOString(),
      duration_ms: finished.getTime() - started.getTime(), task: args.task, worker_count: args.workers,
      result_path: null, error: (outcome.stderr || outcome.stdout || "Unknown error").trim()
    };
    await fs.writeFile(summaryPath, JSON.stringify(failure, null, 2) + "\n", "utf8");
    await appendJsonl(indexPath, failure);
    throw new Error(failure.error);
  }

  const result = JSON.parse(await fs.readFile(resultPath, "utf8"));
  const finished = new Date();
  const summary = buildRunSummary(result, {
    runId: id, status: "success", startedAt: started.toISOString(), finishedAt: finished.toISOString(),
    durationMs: finished.getTime() - started.getTime(), workers: args.workers, task: args.task,
    resultPath, summaryPath
  });
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  await appendJsonl(indexPath, summary);

  const t = summary.api_usage.total;
  console.log("PTA AI: success (" + Math.round(summary.duration_ms / 1000) + "s)");
  console.log("tokens: input=" + t.input_tokens + " output=" + t.output_tokens + " total=" + t.total_tokens);
  console.log("context: " + summary.selected_notes.length + " notes | JEV: " + summary.jev_issue_count + " | Human: " + summary.human_decision_count);
  console.log("result: " + resultPath);
  console.log("summary: " + summaryPath);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error("PTA AI error: " + error.message); process.exitCode = 1; });
}