# PTA AI system

このディレクトリは、PTA適正化推進委員会のAI作業で使用する固定指示・Skill・品質基準の正本です。

## 読み込み順

1. `CORE_INSTRUCTIONS.md`
2. `ORCHESTRATION.md`
3. `QUALITY_STANDARD.md`
4. `SKILL_REGISTRY.json` で選択された `skills/*.md`
5. 個別タスクの指示

上位のプラットフォーム安全要件、ツール権限、ユーザーの明示指示は、このリポジトリ文書より優先します。

## 原則

- 巨大な万能プロンプトに統合しない。
- 共通原則と個別Skillを分離する。
- Skillはタスクの語句と `selectionRules` から決定的に選択し、選択結果を実行結果へ残す。
- 複合PTA案件は、単一の万能Skillへ寄せず、必要な専門Skillを最大6個まで併用する。
- 選択順は default Skill → 複合 `selectionRules` → 通常keyword一致 → fallback Skill とする。
- 専門Skillの `seniorReview` は、タスク本文の語句に依存せず上位審査要件へ合成する。
- JEVは結論を決める役ではなく、重複排除・圧縮・選別・エスカレーションを行う。
- 法令、個人情報、対外公表、金銭、リポジトリ書換えは低コスト層だけで完結させない。
- AI運用ルールの変更は小さい差分で行い、CIで固定条件を検査する。

## バージョン管理

運用ルールを変更するときは、`SKILL_REGISTRY.json` または `tools/jev/config.json` のバージョンを更新し、変更理由をPRに残します。
