# 静的HTMLメタタグ検査レポート

作成日: 2026-06-06
対象: ローカル作業用HTML（`ptaorg_diff_work`）

## 検査対象

- `timeline.html`
- `shizuoka-incident.html`
- `guideline.html`
- `compliance.html`

## 検査結果

| ファイル | サイズ(bytes) | canonical | og:image | twitter:card | twitter:image | twitter:image:alt | h1 | site.js |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `timeline.html` | 30296 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `shizuoka-incident.html` | 34179 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `guideline.html` | 46204 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| `compliance.html` | 67894 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |

## 判断

ローカル作業用HTMLでは、4ファイルともSNSカード用の `twitter:image` / `twitter:image:alt` は追加済みであり、`canonical` の重複もない。

ただし、公開リポジトリへ直接反映するには、GitHubコネクタが部分パッチではなく全文差し替え方式であるため、1ファイルずつPRブランチで差し替えて確認する。

## 次の作業

1. `timeline.html` をPRブランチで差し替える。
2. `node tools/check-static-meta.js` で検査する。
3. 問題がなければ `shizuoka-incident.html`、`guideline.html`、`compliance.html` の順に進める。

## 未実施

- ブラウザ表示確認
- GitHub Pages反映後の目視確認
- ZIP作成
