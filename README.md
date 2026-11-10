# PTA適正化推進委員会 — 次世代サイト (v0.2 デザイン改修)

これは **ptaorg.com の置換ではなく、独立した新サイトの検討用プロトタイプ**です。現行 `ptaorg/ptaorg.github.io` に書き込みを行いません。

## v0.2 で変えたこと

- 全4画面を新デザインに作り直し（白ヘッダー＋5区分ドロップダウン、紺の検索パネル、資料種別バー、日本地図、自治体別タブ構成、紺フッター＋応援帯）。
- ヘッダー・フッターは `partials/` が正本。`npm run chrome` で4画面へ反映し、`npm test` が同期を検査する。
- 公開済みデータ（29地域・569校・72回答）と論考索引 `data/journal-index.json` を同梱。件数・最新論考はすべてデータから表示し、手書きの数値は置かない。
- 自治体ページは研究ノートの `summary / system / timeline / legal / unknowns / sources` をそのまま表示。データが無い項目は「未登録」と明示する。
- 日本地図は Geolonia「japanese-prefectures」（GFDL）。`assets/map/` に同梱。
- トップと論考見出しの装飾はCSSで描画しています。

## v0.3 全ページ移植

現行 `ptaorg/ptaorg.github.io` の公開ページを、URL構成を変えずにこのサイトへ移しました。

- 移植したページ：777件（論考・論点・立場別ガイド・教育委員会回答72件・学校別資料569件・研究ノート・書式・キットなど）。転送ページ12件は転送スタブとして置いた。
- 本文は削らない。旧サイトのヘッダー・ナビ・フッター・応援帯・パンくず・「現在地」表示だけを外し、新しいヘッダー・パンくず・フッターで包む。
- 旧CSSは `.legacy` 配下に閉じ込めて（`scripts/port/prefix-css.mjs`）、新しいヘッダー・フッターに影響しないようにした。その上に `assets/legacy-theme.css` で見出し・ヒーロー・書体を新デザインへ揃える。
- 旧サイトのJavaScriptが実行時に差し込んでいた本文（FAQ、注記、図など）は、Chromiumで描画した後の状態を取り込んだ。地図・検索・ビューアなど自分で中身を作るページ（13件）は原本HTMLとそのスクリプトを使う。
- `/…` と `https://ptaorg.com/…` へのリンクはサイト内の相対リンクに書き換えた。旧サイトにも無いファイルへのリンクだけは ptaorg.com のまま残る。
- `canonical` は ptaorg.com 側の各ページを指したまま（切替前の重複評価を避けるため）。
- 移植しなかったもの：旧トップ（新トップに置換）、文字化けファイル名の重複ページ、`ai-system/` `tools/` `scripts/` `source-candidates/` `parts/`（内部用）。`pta-open-system/` のテンプレートは参照されたものだけ原本のままコピー。
- 全文検索：「全国の資料を探す」に「解説・論考ページ」タブを追加（旧サイトの検索索引を使用）。

再生成（旧サイトを更新した後）:

```bash
(cd ../ptaorg.github.io && python3 -m http.server 8800) &
npm i --prefix /tmp/porttools playwright postcss postcss-selector-parser
node scripts/port/capture.mjs ../ptaorg.github.io /tmp/capture
python3 scripts/port/build.py ../ptaorg.github.io /tmp/capture --node-path /tmp/porttools/node_modules
npm test
```

## 画面

| URL | 用途 |
|---|---|
| `/index.html` | 非専門家でも使いやすい入口・目的別導線・検索 |
| `/explore.html` | 学校・自治体・教育委員会回答の統合検索（絞り込み、URL保存、結果タイプ切替） |
| `/municipality.html?id=kawaguchi` | 自治体単位の研究概要、学校一覧、公開回答 |
| `/school.html?url=%2Farchive%2Fkawaguchi%2Fschool-009-es%2F` | 学校別一次資料の所在と公開状況の明示 |

`explore.html?q=安行小学校` はサンプル環境で該当学校のみ表示されます。検索と結果の表示順を統合しました。

## 起動・検証

外部ライブラリやビルド工程は不要です。`file://` では JSON を読み込めないため、HTTP サーバーから開きます。

```bash
cd ptaorg-site-next
python3 -m http.server 8765
# http://localhost:8765/
```

別のターミナルで：

```bash
npm test
```

## 公開済み実データの取り込み

公開済み索引の全件（`research-map-index.json`・`board-responses.json`）と論考索引を同梱しています。全件が無い環境では抜粋 `data/demo.json` で動作します。未公開文書原本や非公表メールは含めません。

公開されている全データ（現行索引では29地域・569校・72回答）を、既存サイトのローカルGitクローンから取り込みます。

```bash
node scripts/sync-public-data.mjs ../ptaorg.github.io
```

これにより **既存で公開済みの** `data/research-map-index.json` と `data/board-responses.json` のみをコピーします。`data/` 以外の資料、PDF・画像・メールの取り込みは行いません。読み込み時はこの2ファイルを優先し、無い場合のみ抜粋データで動作します。

同期後の結果を原本と照合し、公開・非公開区別を確認してください。現行の `ptaorg.com` はあくまで正本です。

## 新規リポジトリへの格納

想定リポジトリ：`ptaorg/ptaorg-site-next`（**この配布だけではGitHub上に未作成**）。
GitHub画面で空のリポジトリを作成してから、以下で追加できます。空リポジトリ作成時はREADME・license・gitignoreの自動追加をオフにしてください。

```bash
cd ptaorg-site-next
git init -b main
git add .
git commit -m "Prototype independent research site with four responsive views"
git remote add origin https://github.com/ptaorg/ptaorg-site-next.git
git push -u origin main
```

GitHub Actionsは `npm test` のみ実施し、**GitHub Pagesへのデプロイやカスタムドメイン指定はしません**。デザイン確定前に `ptaorg.com` のCNAME・DNSを編集しないでください。

## 設計上の原則

- 著者による分析と行政の公開回答、学校文書の登録情報を混同しない。
- `公開前確認中` のPDF本文やダウンロードリンクを追加しない。
- 学校・自治体の既存URLを変更せず、旧ページへの安全な参照リンクを保持する。
- プレビューから本番サイトに書き戻さない。公開済みソースJSONを表示用として読むだけ。
- 一度に全749+ページを作り直さず、4画面→使い勝手の確認→データ全件同期→その他画面の設計へ進む。

## 未実施

- GitHub上での新規リポジトリ作成（現在利用可能なGitHub連携にその操作がないため）
- 現行の全学校別HTML本文、PDF、研究論考の複製・公開
- 本番公開、ドメイン切替、SEO移行、全URLのリダイレクト
- ユーザー調査による使いやすさ検証
