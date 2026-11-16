---
name: pta-municipal-school-report
description: 自治体別PTA総合報告書・学校別評価書・母集団付き割合・出典目録・全国地図用データを、固定評価軸と公開ゲートで制作する。全国資料や学校別資料の評価書を作成するときに使う。
---

# PTA自治体・学校別評価書（Skill導入口）

このプロジェクトにおけるスキル定義の**正本は `ai-system/`** です。重複する別ルールをここには記載しません。実行前に、必ず次のファイルをこの順で読み込んでください。

1. `AGENTS.md`
2. `ai-system/CORE_INSTRUCTIONS.md`、`ai-system/ORCHESTRATION.md`、`ai-system/QUALITY_STANDARD.md`
3. `ai-system/skills/municipal-assessment-v3.md`（自治体総評の全工程・委任の私法上の限界・是正進捗の評価）
4. `ai-system/skills/municipal-school-report.md`
5. `ai-system/skills/municipal-investigation-pipeline.md`（全履歴・自治体規程・時系列の是正評価・公開工程）
6. `ai-system/skills/municipal-web-publishing.md`（サイト制作・公開・表示・Xカードの実検証）
7. `ai-system/report-standards/README.md` と同ディレクトリの評価軸・スキーマ・テンプレート

**自治体総評の事前必須ゲート：** 最初にGmail・Google Driveの当該自治体との送受信・添付・開示資料を横断確認し、続いてウェブ・例規・教育委員会通知・会計手引等から、PTA会費の学校徴収を「委任」「同意」「団体費」等で制度化する規定を探索する。実施方法・未確認時の停止条件は `ai-system/skills/municipal-school-report.md` v2.1.0に従う。

法的審査の正本は `ai-system/report-standards/legal-screening.json`。発動後は固定12軸の全校評価、一次資料ポインタ、分母付き集計、法的順序、Senior/humanレビューと公開前検証を省略しない。未確認資料からの推測で割合や違法判定を作らない。

**v3.0公開ゲート：** `ai-system/report-standards/municipal-v3-gates.json` に従い `node ai-system/report-standards/scripts/validate-municipal-v3.mjs <非公開入力JSON>` を実行する。委任契約は民法上の私法関係であり公法上の所掌・権限を当然には創設しない。通知や回答が是正へ向かう変化は積極的に評価するが、改訂・実装・効果検証まで区別する。

**Web公開は独立ゲート：** `node scripts/validate-municipal-web.mjs research/<slug>.html --manifest <非公開チェック記録>` を実行し、画像取得・実ブラウザ・地図導線・Xカードの実表示を個別確認する。GitHubへのコミットは公開確認を意味しない。表示崩れはCSSの末尾に上書きを重ねず根本のcomputed styleから直す。
