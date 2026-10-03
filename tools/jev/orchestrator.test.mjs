import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildInventory,
  clampWorkerCount,
  classifyRisk,
  extractOutputText,
  loadConfig,
  loadInstructionBundle,
  prefilterWorkerResults,
  selectSkills
} from "./orchestrator.mjs";

const config = {
  limits: { defaultWorkers: 8, maxWorkers: 50, maxInventoryEntries: 100 },
  files: { extensions: [".html", ".md", ".js"], excludeDirectories: ["node_modules", ".git"] }
};

test("classifyRisk keeps repository writes behind human approval", () => {
  const result = classifyRisk("修正してcommitし、pushまでしてください");
  assert.equal(result.requiresHumanApproval, true);
  assert.ok(result.sideEffects.includes("git_push"));
  assert.ok(result.sideEffects.includes("repository_write"));
});

test("classifyRisk escalates legal/privacy analysis to senior", () => {
  const result = classifyRisk("個人情報保護法の適法性を確認する");
  assert.equal(result.requiresSeniorReview, true);
  assert.ok(result.seniorReview.includes("legal_interpretation"));
  assert.ok(result.seniorReview.includes("privacy_personal_data"));
});

test("clampWorkerCount applies defaults and hard cap", () => {
  assert.equal(clampWorkerCount(undefined, config), 8);
  assert.equal(clampWorkerCount("20", config), 20);
  assert.equal(clampWorkerCount("999", config), 50);
  assert.equal(clampWorkerCount("0", config), 8);
});

test("extractOutputText supports top-level and message output", () => {
  assert.equal(extractOutputText({ output_text: "{\"ok\":true}" }), '{"ok":true}');
  assert.equal(extractOutputText({ output: [{ type: "message", content: [{ type: "output_text", text: "hello" }] }] }), "hello");
});

test("prefilterWorkerResults removes exact repeated findings", () => {
  const baseFinding = {
    finding: "Same issue",
    evidence: [{ path: "a.html", detail: "x" }]
  };
  const input = [
    { task_id: "1", findings: [baseFinding] },
    { task_id: "2", findings: [{ ...baseFinding }] }
  ];
  const output = prefilterWorkerResults(input);
  assert.equal(output[0].findings.length, 1);
  assert.equal(output[1].findings.length, 0);
});

test("buildInventory includes text files and skips excluded directories", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "jev-test-"));
  await fs.writeFile(path.join(root, "index.html"), "<h1>x</h1>");
  await fs.writeFile(path.join(root, "image.png"), "binary");
  await fs.mkdir(path.join(root, "node_modules"));
  await fs.writeFile(path.join(root, "node_modules", "hidden.js"), "x");
  await fs.mkdir(path.join(root, "docs"));
  await fs.writeFile(path.join(root, "docs", "note.md"), "hello");
  const inventory = await buildInventory(root, config);
  assert.deepEqual(inventory.map((x) => x.path), ["docs/note.md", "index.html"]);
  await fs.rm(root, { recursive: true, force: true });
});

test("classifyRisk does not treat discussion of public information as a publish action", () => {
  const result = classifyRisk("公開資料の変更点を分析する");
  assert.equal(result.requiresHumanApproval, false);
});




test("selectSkills keeps fact-check baseline and adds deterministic matches", () => {
  const registry = {
    defaultSkills: ["fact-check"],
    skills: [
      { id: "legal-analysis", path: "skills/legal.md", keywords: ["法令", "個人情報"] },
      { id: "website-edit", path: "skills/edit.md", keywords: ["修正", "push"] },
      { id: "fact-check", path: "skills/fact.md", keywords: ["確認"] }
    ]
  };
  const selected = selectSkills("個人情報の法令を確認してサイトを修正", registry, 3);
  assert.deepEqual(selected.map((x) => x.id), ["fact-check", "legal-analysis", "website-edit"]);
});

test("selectSkills applies deterministic bundles before generic fallback skills", () => {
  const registry = {
    defaultSkills: ["fact-check"],
    selectionRules: [
      {
        id: "fee-bundle",
        priority: 100,
        match: { allOf: ["pta", "会費"], anyOf: ["学校が徴収"] },
        skills: ["pta-membership", "school-fee-collection", "school-pta-personal-data", "teacher-pta-involvement"]
      }
    ],
    skills: [
      { id: "fact-check", path: "skills/fact.md", keywords: ["確認"] },
      { id: "pta-membership", path: "skills/membership.md", keywords: ["任意加入"] },
      { id: "school-fee-collection", path: "skills/fees.md", keywords: ["会費"] },
      { id: "school-pta-personal-data", path: "skills/data.md", keywords: ["個人情報"] },
      { id: "teacher-pta-involvement", path: "skills/teacher.md", keywords: ["教職員"] },
      { id: "pta-structure-analysis", path: "skills/pta.md", keywords: ["PTA", "会費"], fallback: true }
    ]
  };
  const selected = selectSkills("ＰＴＡ会費を学校が徴収している", registry, 6);
  assert.deepEqual(selected.map((x) => x.id), [
    "fact-check",
    "pta-membership",
    "school-fee-collection",
    "school-pta-personal-data",
    "teacher-pta-involvement",
    "pta-structure-analysis"
  ]);
});

test("fixed PTA fee collection case activates the required specialist skills together", async () => {
  const fixed = await loadConfig();
  const bundle = await loadInstructionBundle("PTA会費を学校が徴収している", fixed);
  for (const id of [
    "pta-membership",
    "school-fee-collection",
    "school-pta-personal-data",
    "teacher-pta-involvement"
  ]) {
    assert.ok(bundle.selectedSkills.includes(id), `missing selected skill: ${id}`);
  }
  assert.ok(bundle.selectedSkills.length <= fixed.limits.maxSkillCount);
  assert.ok(bundle.seniorReview.includes("legal_interpretation"));
  assert.ok(bundle.seniorReview.includes("privacy_personal_data"));
  assert.ok(bundle.seniorReview.includes("financial_analysis"));
});

test("selected PTA legal skill requires Senior review even without explicit legal wording", async () => {
  const fixed = await loadConfig();
  const bundle = await loadInstructionBundle("PTAは任意加入で、入会申込がない保護者を会員扱いできるか確認する", fixed);
  assert.ok(bundle.selectedSkills.includes("pta-membership"));
  assert.ok(bundle.seniorReview.includes("legal_interpretation"));
});

test("fixed config pins the OpenAI model hierarchy", async () => {
  const fixed = await loadConfig();
  assert.deepEqual(fixed.models, {
    planner: "gpt-6.1-sol",
    worker: "gpt-6-luna",
    jev: "gpt-6-luna",
    senior: "gpt-6.1-sol",
    secretary: "gpt-6.1-sol"
  });
});

test("fixed config keeps runtime read-only and repository writes human-gated", async () => {
  const fixed = await loadConfig();
  assert.equal(fixed.runtime.readOnly, true);
  assert.equal(fixed.runtime.storeResponses, false);
  assert.ok(fixed.approval.alwaysHuman.includes("repository_write"));
  assert.equal(fixed.aiSystem.directory, "ai-system");
  assert.equal(fixed.aiSystem.registry, "SKILL_REGISTRY.json");
  assert.ok(fixed.limits.maxSkillCount >= 1);
  assert.equal(fixed.modelPolicy.roles.planner, "sol");
  assert.equal(fixed.modelPolicy.roles.worker, "luna");
});
