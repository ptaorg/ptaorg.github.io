# URL役割台帳（第1段階：任意加入系）

この台帳は、URLを「現行入口」「詳細解説」「研究記録」「旧版・保存版」「立場別入口」に分け、同じ論点のページが複数あること自体を問題にせず、**役割の重複をなくす**ためのものです。

## 役割の定義

| 区分 | 意味 |
|---|---|
| current-canonical | 現行の実務入口。利用者が最初に読むページ |
| audience-guide | 保護者・PTA役員・教育委員会・学校など、立場別の短い入口 |
| research-record | 個別の調査・論考・検証記録 |
| source-archive | 原資料・行政資料・実物資料の保存場所 |
| old/reference | 過去版・旧スターターキット。引用価値を残すが現行入口にはしない |
| internal/development | 公開サイトの入口にしない内部作業用資料 |

## 任意加入系の優先台帳

| URL | 区分 | 役割 | 後継・正本 | 検索 | 備考 |
|---|---|---|---|---|---|
| `/membership.html` | current-canonical | 任意加入・入会手続の実務入口 | — | index | 現行の総合解説。会費・個人情報・学校との関係まで接続する |
| `/pta-membership-optin.html` | research-record | オプトイン、申込み、意思表示の詳細解説 | `/membership.html` | index | 独立した詳細説明として保持。入口ではなく深掘り用 |
| `/journal/pta-membership-optin-record.html` | research-record | 任意加入の研究・記録ページ | `/membership.html` | index | 引用・検証のための記録。自動リダイレクトしない |
| `/starter-kit/*` | old/reference | PTA運営スターターキットの旧版・参照資料 | `/membership.html` | reference | `data/url-ledger.json` の prefix rule で旧版として扱い、通常検索・sitemapから除外 |
| `/guide-parent.html` | audience-guide | 保護者が最初に確認するための入口 | `/membership.html` | index | 任意加入の判断・確認から総合解説へ接続 |
| `/guide-pta.html` | audience-guide | PTA役員が運営を点検する入口 | `/membership.html` | index | 会員名簿・会費・個人情報・学校依存の確認へ接続 |
| `/guide-board.html` | audience-guide | 教育委員会・学校が学校関与を点検する入口 | `/membership.html` | index | 入会・名簿・徴収・学校事務の確認へ接続 |

## 機械可読台帳

`data/url-ledger.json` が検索・sitemap生成時の役割判定を担います。個別URLは `entries`、ディレクトリ単位の旧版は `prefix_rules` で管理します。Markdown版は人間向けの運用説明です。

## 運用ルール

1. 新しい「任意加入の総合入口」を増やさない。
2. 詳細解説は現行入口から明示的にリンクする。
3. 研究記録は引用価値がある限り保存し、現行ページと同じ役割を名乗らない。
4. 旧版を削除・自動リダイレクトする前に、引用・外部リンク・検索流入への影響を確認する。
5. sitemap、サイト内検索、`llms.txt` に掲載するURLは、現行・研究・資料・旧版の役割を区別して扱う。
6. 台帳の次段階では、個人情報、会費徴収、教職員関与、学校施設、教育委員会回答、全国資料館へ同じ分類を拡張する。

最終更新: 2026-09-20
