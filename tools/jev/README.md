# JEV fixed orchestration

This directory fixes the OpenAI-only multi-agent workflow used for PTA work. **JEV is a role, not a model name.** The role is the low-cost triage/compression layer between parallel workers and the senior reviewer.

## Fixed hierarchy

1. Planner / manager — `gpt-5.6-sol`
2. Parallel workers — `gpt-5.6-luna`
3. JEV triage — `gpt-5.6-luna`
4. Senior review — `gpt-5.6-sol`
5. Secretary / decision brief — `gpt-5.6-sol`
6. Human — final approval for side effects

The defaults are stored in `config.json`. The worker count defaults to 8 and is hard-capped at 50. Increasing the number of workers does not change the escalation policy.

## Safety boundary

The current runtime is intentionally **read-only**. It can inspect local text files and produce findings, but it cannot edit files, send mail, publish, delete, push, merge, deploy, make payments, or change credentials.

Those operations are always returned as human-decision items. Legal/privacy/public-claim/financial issues are routed through senior review before the final brief. JEV may compress or discard noise, but may not downgrade a human-approval requirement.

This is deliberate: first stabilize the routing and compression quality, then add narrowly scoped execution adapters behind the same approval gate.

## Use

Validate the fixed policy without calling the API:

```bash
npm run jev:check
npm run test:jev
```

Run an actual read-only job from the repository root:

```bash
OPENAI_API_KEY="..." npm run jev:run -- \
  --task "サイト全体を品質監査し、重複・矛盾・根拠不足を整理する" \
  --scope . \
  --workers 8
```

On PowerShell:

```powershell
$env:OPENAI_API_KEY="..."
npm run jev:run -- --task "サイト全体を品質監査する" --scope . --workers 8
```

Results are written to standard output only; the read-only runtime does not create result files. The API key is read only from `OPENAI_API_KEY` and must never be committed.

## Data flow

```text
request
  -> Planner (Sol)
  -> parallel Workers (Luna)
  -> deterministic exact-deduplication
  -> JEV (Luna): merge / discard / route
  -> Senior (Sol): material or uncertain issues
  -> Secretary (Sol): concise decision brief
  -> Human: side-effect decisions only
```

Workers return structured findings with severity, risk, confidence, evidence, recommended action, senior-review flag, and human-approval flag. The JEV layer applies additional deterministic routing after the model response: confidence below 0.90, severity/risk 2 or more, and defined high-risk domains cannot silently complete at the low-cost layer.

## OpenAI API

The implementation uses the Responses API with Structured Outputs and `store: false`. Model IDs are centralized in `config.json`; do not scatter model names across scripts.
