# PTA自治体・学校別評価書スキル 1.0.0 インストール

このZIPを `ptaorg/ptaorg.github.io` のリポジトリルートへ展開してください。

- `.agents/skills/pta-municipal-school-report/SKILL.md` はCodex等のSkill入口です。正本を再定義せず `ai-system/skills/municipal-school-report.md` へ接続します。
- `ai-system/report-standards/` に固定12軸、JSON Schema、入力例、自治体/学校テンプレート、集計/草稿生成プログラム、地図原案を収録。
- `tests/municipal-school-report-skill.test.mjs` は検証規格と不適切な公開の防止を確認。
- 登録表 `ai-system/SKILL_REGISTRY.json` には下記の項目を追加し、versionを4に更新してください（既存の登録を保持）。

```json
{
  "id": "municipal-school-report",
  "path": "skills/municipal-school-report.md",
  "keywords": [
    "自治体別総合報告書", "学校別評価書", "学校別PTA調査", "全国資料の評価",
    "PTA評価書", "学校別評価", "自治体比較", "評価割合", "地図に掲載", "municipal report"
  ]
}
```

### 最初の検査

```bash
npm test
node ai-system/report-standards/scripts/validate-dataset.mjs ai-system/report-standards/fixtures/fictional-city.json --metrics /tmp/pta-metrics.json
node ai-system/report-standards/scripts/render-draft.mjs ai-system/report-standards/fixtures/fictional-city.json /tmp/pta-draft
```

架空データの公開は必ず停止されます。実在自治体の正式報告は資料の直接照合とSenior/humanレビュー後に別途作成します。サイト既存の学校原本JSONは上書きしません。
