import test from "node:test";
import assert from "node:assert/strict";
import { buildRunSummary, parseArgs } from "./run.mjs";

test("parseArgs defaults to three workers", () => {
  const args = parseArgs(["松山市の最新状況を整理"]);
  assert.equal(args.workers, 3);
  assert.equal(args.task, "松山市の最新状況を整理");
});

test("parseArgs accepts worker override and preserves task", () => {
  const args = parseArgs(["--workers", "5", "PTA会費", "を分析"]);
  assert.equal(args.workers, 5);
  assert.equal(args.task, "PTA会費 を分析");
});

test("buildRunSummary records usage and context without pricing", () => {
  const result = {
    task: "test", worker_count: 3, models: { planner: "gpt-6.1-sol" },
    context_engine: { selected_notes: [{ path: "01_CORE/基本原則.md" }] },
    api_usage: {
      planner: { input_tokens: 10, output_tokens: 2, total_tokens: 12 },
      workers: [{ task_id: "a", input_tokens: 20, output_tokens: 4, total_tokens: 24 }],
      jev: { input_tokens: 5, output_tokens: 1, total_tokens: 6 },
      senior: { input_tokens: 7, output_tokens: 2, total_tokens: 9 },
      secretary: { input_tokens: 3, output_tokens: 1, total_tokens: 4 },
      total: { input_tokens: 45, output_tokens: 10, total_tokens: 55 }
    },
    jev: { issues: [{}, {}] }, senior: { reviewed: [{}] }, secretary: { needs_human: [{}, {}, {}] }
  };
  const summary = buildRunSummary(result, { runId: "r", resultPath: "x", summaryPath: "y" });
  assert.equal(summary.api_usage.total.total_tokens, 55);
  assert.deepEqual(summary.selected_notes, ["01_CORE/基本原則.md"]);
  assert.equal(summary.human_decision_count, 3);
  assert.equal(Object.hasOwn(summary.api_usage, "cost"), false);
});