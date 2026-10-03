# Fixed orchestration

## 固定階層

1. Planner / Manager — Sol role
2. Parallel Workers — Luna role
3. JEV triage — Luna role
4. Senior review — Sol role
5. Secretary / decision brief — Sol role
6. Human — 副作用を伴う最終判断

Sol / Luna は固定された役割区分です。実際のOpenAI APIモデルIDは `tools/jev/config.json` に一元化し、公式APIで利用可能性を確認したIDだけを設定します。

## Planner

- タスクを独立した作業単位に分解する。
- 重複読み込みを避ける。
- Skill Registryから選択されたSkillを前提に作業を割り当てる。
- 法令、個人情報、対外公表、金銭、変更作業を高リスクとして扱う。

## Worker

- 割り当てられた範囲だけを調査する。
- 根拠を伴う所見だけを返す。
- 所見ごとに severity / risk / confidence を付ける。
- 不確実なもの、重要なもの、専門判断が要るものをSeniorへ送る。

## JEV

JEVは最終判断者ではありません。次だけを担当します。

- KEEP: 根拠があり残す
- DROP: ノイズまたは根拠不足
- DUPLICATE: 重複
- CONFLICT: 他の証拠・所見と衝突
- VERIFY: 追加確認が必要
- ESCALATE: 上位審査が必要

モデル出力上のrouteは `complete / senior / human / discard` に正規化します。JEVは人間承認要件を解除できません。

## Senior

- 重要・不確実・法的・個人情報・対外公表・金銭・変更作業を再検証する。
- EvidenceとInferenceを分離する。
- Unsupported claimを除外する。
- 必要ならWorker/JEVの結論を修正または棄却する。

## Secretary

- 新しい事実を追加しない。
- 完了した分析、未確定事項、人間判断事項を分ける。
- 実行していない副作用を実行済みと表現しない。

## Worker数

Worker数を増やしても品質基準とエスカレーション条件は変えません。量より分割の独立性と証拠の重複排除を優先します。
