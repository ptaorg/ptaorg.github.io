# 実在自治体への適用試験（未公開）

## 大崎市 2026年度：母集団確定のみ

- 入力: `osaki-2026.dataset.json`
- 母集団: 市立小学校14校、中学校9校、義務教育学校2校の計25校
- 母集団一次資料: 大崎市「大崎市立小学校・中学校・義務教育学校一覧」（2026年6月23日更新）
  https://www.city.osaki.miyagi.jp/shisei/lifescenebetsudesagasu/gakko_kyoiku/7297.html
- 25校すべてを学校IDで固定し、12軸を全校に適用。計300セルはいずれも `unknown`。
- Google Drive「全国資料/大崎市」の田尻中学校・鳴子小中学校で学校徴収金文書の**ファイル名と所在のみ**確認。ただしPDF本文、該当頁、作成主体、収支・会費の記載は未照合のため `metadata_only`。
- これらの資料から「学校がPTA会費を徴収した」等の判断を推測していない。
- 自治体規程・通知、個別学校資料の直接照合、法的レビュー、公開承認は未実施。
- これは母集団漏れ防止・不明の扱いを検証するパイロットであり、自治体の実態評価書ではない。

実行例:

```bash
node ai-system/report-standards/scripts/validate-dataset.mjs ai-system/report-standards/pilots/osaki-2026.dataset.json --metrics /tmp/osaki-metrics.json
node ai-system/report-standards/scripts/render-draft.mjs ai-system/report-standards/pilots/osaki-2026.dataset.json /tmp/osaki-draft
```

※この段階の `confirmedYesOfKnownPct` は全軸 `null`（算定不能）。`0%` と表記しない。出典照合後に学校×軸の状態を更新し、必ず独立レビューを受ける。公開は別工程。
