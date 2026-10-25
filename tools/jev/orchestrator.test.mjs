import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildInventory,
  buildSeniorReviewPacket,
  clampWorkerCount,
  classifyRisk,
  extractOutputText,
  loadConfig,
  loadInstructionBundle,
  normalizeJevIssueRoutes,
  prefilterWorkerResults,
  selectPlannerInventory,
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


test("buildSeniorReviewPacket keeps merged JEV issues compact while inheriting mandatory gates", () => {
  const workers = [
    {
      task_id: "W1",
      findings: [{
        id: "F1",
        finding: "First legal issue",
        evidence: [{ path: "a.html", detail: "A" }],
        severity: 2,
        risk: 2,
        confidence: 0.88,
        recommended_action: "Review A",
        requires_senior_review: true,
        requires_human_approval: false
      }]
    },
    {
      task_id: "W2",
      findings: [{
        id: "F2",
        finding: "Overlapping privacy issue",
        evidence: [{ path: "b.html", detail: "B" }],
        severity: 2,
        risk: 2,
        confidence: 0.86,
        recommended_action: "Review B",
        requires_senior_review: true,
        requires_human_approval: false
      }]
    }
  ];
  const issues = [{
    title: "Merged legal/privacy issue",
    source_task_ids: ["W1", "W2"],
    source_finding_refs: ["W1::F1", "W2::F2"],
    summary: "Merged summary",
    evidence: ["a.html: A", "b.html: B"],
    severity: 2,
    risk: 2,
    confidence: 0.86,
    route: "senior",
    reason: "Merged by JEV",
    recommended_action: "Senior review"
  }];

  const packet = buildSeniorReviewPacket(issues, workers);
  assert.equal(packet.length, 1);
  assert.equal(packet[0].issue_id, "JEV-001");
  assert.deepEqual(packet[0].source_task_ids, ["W1", "W2"]);
  assert.equal(packet[0].gates.human_required, false);
  assert.ok(packet[0].gates.review_reasons.includes("worker_senior"));
});

test("buildSeniorReviewPacket adds one compressed fallback per task only when JEV omits mandatory findings", () => {
  const workers = [{
    task_id: "W1",
    findings: [
      {
        id: "F1",
        finding: "Human-gated write",
        evidence: [{ path: "a.html", detail: "A" }],
        severity: 3,
        risk: 3,
        confidence: 0.95,
        recommended_action: "Ask human",
        requires_senior_review: true,
        requires_human_approval: true
      },
      {
        id: "F2",
        finding: "Legal review",
        evidence: [{ path: "b.html", detail: "B" }],
        severity: 2,
        risk: 2,
        confidence: 0.8,
        recommended_action: "Review law",
        requires_senior_review: true,
        requires_human_approval: false
      }
    ]
  }];

  const packet = buildSeniorReviewPacket([], workers);
  assert.equal(packet.length, 1);
  assert.equal(packet[0].issue_id, "FALLBACK-001");
  assert.deepEqual(packet[0].source_task_ids, ["W1"]);
  assert.equal(packet[0].gates.human_required, true);
  assert.match(packet[0].summary, /Human-gated write/);
  assert.match(packet[0].summary, /Legal review/);
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


test("selectPlannerInventory caps planner input and preserves evidence spine", () => {
  const inventory = [
    { path: "cases.html", bytes: 100 },
    { path: "data/board-responses.json", bytes: 100 },
    { path: "privacy.html", bytes: 100 },
    { path: "ppc-school-pta-personal-data.html", bytes: 100 },
    { path: "fee-collection.html", bytes: 100 },
    ...Array.from({ length: 500 }, (_, i) => ({ path: `schools/unrelated-${i}.html`, bytes: 100 }))
  ];
  const selected = selectPlannerInventory(
    inventory,
    "松山市の学校徴収と個人情報を整理する",
    ["fact-check", "legal-analysis", "municipal-response-analysis", "pta-structure-analysis"],
    50
  );
  const paths = selected.map((x) => x.path);
  assert.equal(selected.length, 50);
  assert.ok(paths.includes("cases.html"));
  assert.ok(paths.includes("data/board-responses.json"));
  assert.ok(paths.includes("privacy.html"));
  assert.ok(paths.includes("ppc-school-pta-personal-data.html"));
  assert.ok(paths.includes("fee-collection.html"));
});

test("administrative negotiation tasks load the legal escort skill", async () => {
  const fixed = await loadConfig();
  const bundle = await loadInstructionBundle(
    "教育委員会への再照会文を作成し、根拠資料が示されない場合は情報公開請求へ切り替える",
    fixed
  );
  assert.ok(bundle.selectedSkills.includes("administrative-legal-escort"));
  assert.ok(bundle.selectedSkills.includes("fact-check"));
});

test("fixed config caps planner inventory before API use", async () => {
  const fixed = await loadConfig();
  assert.equal(fixed.limits.maxPlannerInventoryEntries, 320);
});


test("Senior compact instruction bundle keeps core quality rules and omits orchestration repetition", async () => {
  const fixed = await loadConfig();
  const bundle = await loadInstructionBundle(
    "個人情報の適法性を再検証する",
    fixed,
    undefined,
    {
      requiredDocs: fixed.seniorContext.requiredDocs,
      maxSkillCount: fixed.seniorContext.maxSkillCount
    }
  );
  assert.match(bundle.text, /CORE_INSTRUCTIONS\.md/);
  assert.match(bundle.text, /QUALITY_STANDARD\.md/);
  assert.doesNotMatch(bundle.text, /ORCHESTRATION\.md/);
  assert.doesNotMatch(bundle.text, /CONTEXT_ENGINE\.md/);
  assert.ok(bundle.selectedSkills.includes("legal-analysis"));
  assert.ok(bundle.selectedSkills.length <= fixed.seniorContext.maxSkillCount);
});

test("fixed config caps Senior Vault context", async () => {
  const fixed = await loadConfig();
  assert.deepEqual(fixed.seniorContext.requiredDocs, ["CORE_INSTRUCTIONS.md", "QUALITY_STANDARD.md"]);
  assert.equal(fixed.seniorContext.maxSkillCount, 3);
  assert.equal(fixed.seniorContext.maxVaultNotes, 6);
  assert.equal(fixed.seniorContext.maxVaultChars, 8000);
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

function mandatoryWorkerFinding(overrides = {}) {
  return {
    id: "F1",
    finding: "Required original finding",
    evidence: [{ path: "original.html", detail: "Original supporting evidence" }],
    severity: 3,
    risk: 2,
    confidence: 0.72,
    recommended_action: "Review the original source",
    requires_senior_review: true,
    requires_human_approval: false,
    ...overrides
  };
}

function normalizedJevIssue(overrides = {}) {
  return {
    title: "Unrelated cosmetic note",
    source_task_ids: ["W9"],
    source_finding_refs: ["W1::F1"],
    summary: "Only styling was discussed",
    evidence: ["style.css: Cosmetic evidence"],
    severity: 0,
    risk: 0,
    confidence: 0.99,
    route: "complete",
    reason: "No review considered necessary by JEV",
    recommended_action: "Leave styling unchanged",
    ...overrides
  };
}

function assertFindingContentInPacket(issue, finding) {
  assert.ok(issue.summary.includes(finding.finding), "Original mandatory finding must reach Senior");
  for (const evidence of finding.evidence) {
    assert.ok(issue.evidence.includes(`${evidence.path}: ${evidence.detail}`), "Original evidence must reach Senior");
  }
  assert.ok(issue.recommended_action.includes(finding.recommended_action), "Original recommended action must reach Senior");
}

test("normalizeJevIssueRoutes preserves an existing Human route with a Senior-only source", () => {
  const issue = normalizedJevIssue({ route: "human" });
  const mandatory = new Map([["W1::F1", { human_required: false, senior_required: true }]]);
  normalizeJevIssueRoutes([issue], mandatory);
  assert.equal(issue.route, "human");
  const packet = buildSeniorReviewPacket([issue], [{ task_id: "W1", findings: [mandatoryWorkerFinding()] }]);
  assert.equal(packet[0].gates.human_required, true);
});

test("normalizeJevIssueRoutes inherits a paraphrased Human action by finding identity only", () => {
  const human = normalizedJevIssue({
    recommended_action: "Make this material available on the live site.",
    source_task_ids: ["W1"]
  });
  const ordinary = normalizedJevIssue({ source_task_ids: ["W1"], source_finding_refs: ["W1::F2"] });
  assert.equal(classifyRisk(human.recommended_action).requiresHumanApproval, false);
  const mandatory = new Map([["W1::F1", { human_required: true, senior_required: true }]]);
  normalizeJevIssueRoutes([human, ordinary], mandatory);
  assert.equal(human.route, "human");
  assert.equal(ordinary.route, "complete");
});

test("normalizeJevIssueRoutes retains mandatory Senior review and the existing confidence threshold", () => {
  const mandatoryIssue = normalizedJevIssue({ route: "discard" });
  const uncertain = normalizedJevIssue({ source_finding_refs: [], confidence: 0.89 });
  const mandatory = new Map([["W1::F1", { human_required: false, senior_required: true }]]);
  normalizeJevIssueRoutes([mandatoryIssue, uncertain], mandatory);
  assert.equal(mandatoryIssue.route, "senior");
  assert.equal(uncertain.route, "senior");
});

test("regression: a referenced Senior finding retains original content, scores and source task", () => {
  const finding = mandatoryWorkerFinding();
  const workers = [{ task_id: "W1", summary: "Worker report", findings: [finding] }];
  const issues = [normalizedJevIssue()];
  const inputs = structuredClone({ workers, issues });
  const packet = buildSeniorReviewPacket(issues, workers);
  assert.equal(packet.length, 1);
  assertFindingContentInPacket(packet[0], finding);
  assert.equal(packet[0].severity, finding.severity);
  assert.equal(packet[0].risk, finding.risk);
  assert.equal(packet[0].confidence, finding.confidence);
  assert.ok(packet[0].source_task_ids.includes("W1"));
  assert.ok(packet[0].gates.review_reasons.includes("high_risk"));
  assert.ok(packet[0].gates.review_reasons.includes("low_confidence"));
  assert.deepEqual({ workers, issues }, inputs, "Packet building must not mutate inputs");
});

test("regression: a Human finding remains visible even when JEV returns complete with unrelated content", () => {
  const finding = mandatoryWorkerFinding({ requires_human_approval: true });
  const packet = buildSeniorReviewPacket([normalizedJevIssue()], [{ task_id: "W1", findings: [finding] }]);
  assert.equal(packet.length, 1);
  assertFindingContentInPacket(packet[0], finding);
  assert.equal(packet[0].gates.human_required, true);
  assert.ok(packet[0].gates.review_reasons.includes("worker_human"));
});

test("regression: a partial JEV merge retains both mandatory findings in one packet item", () => {
  const first = mandatoryWorkerFinding();
  const second = mandatoryWorkerFinding({
    id: "F2",
    finding: "Second required privacy finding",
    evidence: [{ path: "second.html", detail: "Second supporting evidence" }],
    recommended_action: "Review the second source",
    requires_human_approval: true
  });
  const issue = normalizedJevIssue({
    source_task_ids: ["W1"],
    source_finding_refs: ["W1::F1", "W2::F2"],
    summary: first.finding,
    evidence: first.evidence.map((entry) => `${entry.path}: ${entry.detail}`),
    recommended_action: first.recommended_action,
    route: "senior"
  });
  const packet = buildSeniorReviewPacket([issue], [
    { task_id: "W1", findings: [first] },
    { task_id: "W2", findings: [second] }
  ]);
  assert.equal(packet.length, 1);
  assertFindingContentInPacket(packet[0], first);
  assertFindingContentInPacket(packet[0], second);
  assert.deepEqual(packet[0].source_task_ids, ["W1", "W2"]);
  assert.equal(packet[0].gates.human_required, true);
  assert.equal(packet[0].evidence.filter((entry) => entry === "original.html: Original supporting evidence").length, 1);
});

test("regression: omitted or unknown refs retain all mandatory findings in the existing task fallback", () => {
  const first = mandatoryWorkerFinding({ requires_human_approval: true });
  const second = mandatoryWorkerFinding({
    id: "F2",
    finding: "Another required finding",
    evidence: [{ path: "another.html", detail: "Additional evidence" }],
    recommended_action: "Check the additional source"
  });
  for (const source_finding_refs of [[], ["UNKNOWN::F1"]]) {
    const packet = buildSeniorReviewPacket([normalizedJevIssue({ source_finding_refs })], [
      { task_id: "W1", findings: [first, second] }
    ]);
    assert.equal(packet.length, 1);
    assert.equal(packet[0].issue_id, "FALLBACK-001");
    assertFindingContentInPacket(packet[0], first);
    assertFindingContentInPacket(packet[0], second);
    assert.equal(packet[0].gates.human_required, true);
  }
});

test("regression: matching content and repeated refs stay compact with exact content deduplication", () => {
  const finding = mandatoryWorkerFinding();
  const issue = normalizedJevIssue({
    source_task_ids: ["W1"],
    source_finding_refs: ["W1::F1", "W1::F1"],
    summary: finding.finding,
    evidence: ["original.html: Original supporting evidence"],
    recommended_action: finding.recommended_action,
    route: "senior"
  });
  const packet = buildSeniorReviewPacket([issue], [{ task_id: "W1", findings: [finding] }]);
  assert.equal(packet.length, 1);
  assert.equal(packet[0].issue_id, "JEV-001");
  assert.equal(packet[0].summary, finding.finding);
  assert.deepEqual(packet[0].evidence, ["original.html: Original supporting evidence"]);
  assert.equal(packet[0].recommended_action, finding.recommended_action);
});

test("regression: another finding in the same task does not inherit an unrelated Human gate", () => {
  const human = mandatoryWorkerFinding({ requires_human_approval: true });
  const ordinary = mandatoryWorkerFinding({
    id: "F2", finding: "Independent cosmetic finding",
    requires_senior_review: false, requires_human_approval: false,
    severity: 0, risk: 0, confidence: 0.99
  });
  const workers = [{ task_id: "W1", findings: [human, ordinary] }];
  const issue = normalizedJevIssue({
    source_task_ids: ["W1"], source_finding_refs: ["W1::F2"], route: "senior"
  });
  const packet = buildSeniorReviewPacket([issue], workers);
  assert.equal(packet.length, 2);
  assert.equal(packet[0].gates.human_required, false);
  assert.equal(packet[1].gates.human_required, true);
  assert.equal(packet[1].issue_id, "FALLBACK-001");
  assertFindingContentInPacket(packet[1], human);
  assert.ok(!packet[0].summary.includes(human.finding));
  const completePacket = buildSeniorReviewPacket([{ ...issue, route: "complete" }], workers);
  assert.equal(completePacket.length, 1);
  assert.equal(completePacket[0].issue_id, "FALLBACK-001");
});

test("regression: colliding finding refs fail closed instead of replacing a mandatory finding", () => {
  const human = mandatoryWorkerFinding({ requires_human_approval: true });
  const other = mandatoryWorkerFinding({
    finding: "Different finding using the same ID",
    evidence: [{ path: "different.html", detail: "Different evidence" }]
  });
  for (const issues of [[], [normalizedJevIssue()]]) {
    assert.throws(
      () => buildSeniorReviewPacket(issues, [{ task_id: "W1", findings: [human, other] }]),
      /Duplicate worker finding reference/
    );
    assert.throws(
      () => buildSeniorReviewPacket(issues, [{ task_id: "W1", findings: [
        human, { ...other, requires_senior_review: false, requires_human_approval: false }
      ] }]),
      /Duplicate worker finding reference/
    );
  }
});

test("regression: finding IDs may repeat across distinct tasks and ordinary routing is preserved", () => {
  const first = mandatoryWorkerFinding();
  const second = mandatoryWorkerFinding({
    finding: "A second task with F1",
    evidence: [{ path: "other-task.html", detail: "Other task evidence" }],
    recommended_action: "Review the other task"
  });
  const packet = buildSeniorReviewPacket([
    normalizedJevIssue({ source_finding_refs: ["W1::F1", "W2::F1"], route: "senior" })
  ], [{ task_id: "W1", findings: [first] }, { task_id: "W2", findings: [second] }]);
  assert.equal(packet.length, 1);
  assertFindingContentInPacket(packet[0], first);
  assertFindingContentInPacket(packet[0], second);
  const ordinary = normalizedJevIssue({ source_finding_refs: [], route: "senior" });
  const unmodified = buildSeniorReviewPacket([ordinary], []);
  assert.equal(unmodified[0].summary, ordinary.summary);
  assert.deepEqual(unmodified[0].evidence, ordinary.evidence);
  assert.equal(unmodified[0].gates.human_required, false);
  assert.deepEqual(buildSeniorReviewPacket([{ ...ordinary, route: "complete" }], []), []);
  assert.deepEqual(buildSeniorReviewPacket([{ ...ordinary, route: "discard" }], []), []);
});
