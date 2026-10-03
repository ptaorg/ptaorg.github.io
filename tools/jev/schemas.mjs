const str = { type: "string" };
const bool = { type: "boolean" };
const score = { type: "integer", minimum: 0, maximum: 3 };
const conf = { type: "number", minimum: 0, maximum: 1 };
const arr = (items) => ({ type: "array", items });
const obj = (properties, required = Object.keys(properties)) => ({ type: "object", properties, required, additionalProperties: false });

export const plannerSchema = obj({
  summary: str,
  work_items: arr(obj({
    id: str,
    objective: str,
    paths: arr(str),
    risk: { type: "string", enum: ["low", "medium", "high"] },
    requires_human_approval: bool
  }))
});

const evidence = obj({ path: str, detail: str });
export const workerSchema = obj({
  task_id: str,
  summary: str,
  findings: arr(obj({
    id: str,
    finding: str,
    evidence: arr(evidence),
    severity: score,
    risk: score,
    confidence: conf,
    recommended_action: str,
    requires_senior_review: bool,
    requires_human_approval: bool
  }))
});

export const jevSchema = obj({
  summary: str,
  issues: arr(obj({
    title: str,
    source_task_ids: arr(str),
    summary: str,
    evidence: arr(str),
    severity: score,
    risk: score,
    confidence: conf,
    route: { type: "string", enum: ["complete", "senior", "human", "discard"] },
    reason: str,
    recommended_action: str
  }))
});

export const seniorSchema = obj({
  summary: str,
  reviewed: arr(obj({
    title: str,
    decision: { type: "string", enum: ["accept", "revise", "human", "discard"] },
    rationale: str,
    final_action: str,
    confidence: conf
  }))
});

export const secretarySchema = obj({
  executive_summary: str,
  completed: arr(str),
  needs_human: arr(obj({ title: str, decision_needed: str, reason: str })),
  discarded_count: { type: "integer", minimum: 0 },
  notes: arr(str)
});
