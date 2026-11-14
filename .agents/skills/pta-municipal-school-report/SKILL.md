---
name: pta-municipal-school-report
description: 自治体別PTA総合報告書・学校別評価書・母集団付き割合・出典目録・全国地図用データを、固定評価軸と公開ゲートで制作する。全国資料や学校別資料の評価書を作成するときに使う。
---

# PTA自治体・学校別評価書（Skill導入口）

このプロジェクトにおけるスキル定義の**正本は `ai-system/`** です。重複する別ルールをここには記載しません。実行前に、必ず次のファイルをこの順で読み込んでください。

1. `AGENTS.md`
2. `ai-system/CORE_INSTRUCTIONS.md`、`ai-system/ORCHESTRATION.md`、`ai-system/QUALITY_STANDARD.md`
3. `ai-system/skills/municipal-school-report.md`
4. `ai-system/report-standards/README.md` と同ディレクトリの評価軸・スキーマ・テンプレート

発動後は固定12軸の全校評価、一次資料ポインタ、分母付き集計、法的順序、Senior/humanレビューと公開前検証を省略しない。未確認資料からの推測で割合や違法判定を作らない。
