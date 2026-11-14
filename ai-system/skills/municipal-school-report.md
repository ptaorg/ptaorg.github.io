# Skill: municipal-school-report（自治体・学校PTA調査評価書）

## 目的と必須出力

同一の一次資料評価・法的検証・集計基準で、自治体ごとの総合報告書、学校別評価書、出典目録、全国地図用レコードを継続的に制作する。**内容が異なるから評価が異なることは許されるが、評価尺度・根拠要件・分母・欠測処理が自治体ごとに変わることは許されない。**

必ずこのSkillのバージョン、入力資料の基準日、母集団、採用した評価軸のバージョン、レビュー・承認状況を成果物に表示する。

参照する正本：

- `ai-system/CORE_INSTRUCTIONS.md`、`ORCHESTRATION.md`、`QUALITY_STANDARD.md`
- `ai-system/report-standards/README.md`（作業契約・判定・公開ゲート）
- `ai-system/report-standards/evaluation-axes.json`（評価軸の固定定義）
- `ai-system/report-standards/report-dataset.schema.json`（構造化入力・出力契約）
- `ai-system/report-standards/templates/municipality-report.md`
- `ai-system/report-standards/templates/school-report.md`
- `ai-system/report-standards/templates/map-record.json`
- `ai-system/report-standards/scripts/validate-dataset.mjs`

## 発動条件

「全国資料」「自治体別報告書」「学校別PTA評価書」「自治体比較」「学校単位の法的評価」「地図へ掲載」「評価の割合」等の依頼で発動する。単なるサイトレイアウト修正では発動しない。

## 必須の順序（省略・逆順禁止）

1. **原資料の所在と真正性**：Google Driveの原本、自治体公開資料、既存サイト写し、添付PDFを識別。資料ID・作成者・発行日・対象年度・ページ・URLまたは格納位置・閲覧確認日・原本/複製・欠落・矛盾を台帳化。PDFの該当ページと記載内容を直接確認する。検索結果やファイル名だけで存在・内容を断定しない。児童・保護者の氏名や機微情報は公開用記録に入れない。
2. **母集団と調査範囲の固定**：対象となる全公立学校数と学校一覧の根拠を確認し、資料確認校・未確認校・未収集学校を分ける。同一校/旧名称/統廃合/年度違いを重複集計しない。自治体通知の対象範囲を学校ごとに勝手に一般化しない。
3. **12評価軸を全校に適用**：`evaluation-axes.json` に従い、各校×各軸を `confirmed_yes` / `confirmed_no` / `indication` / `unknown` / `not_applicable` / `conflicting` のいずれかに分類。資料不掲載・未取得を `confirmed_no` としてはならない。「確認できない」と「存在しない」を分離する。異なる年度の文書を無断で同時点として扱わない。
4. **法的レビューの固定順序**：①学校・教育委員会（公的主体）とPTA（任意加入の私的団体）の分離→②当該行為が誰の事務か（PTAの入退会/会費/未納/役員/会計は原則PTA内部事務）→③学校の具体的な所掌事務・公法上の権限と例外根拠の検証→④その後に個人情報保護法第61条の利用目的・保有必要性、第69条の利用・提供制限等の適用検討→⑤条文の存在、当該事務への適用、個別行為の適法性を区別し、反対解釈・未確認を明示。委任、本人同意、校長裁量、校務分掌、学校徴収金規則、職専免、慣行を公法上の権限創設の代替にしない。主体が異なるという理由だけで即違法と断定しない。
5. **統計の自動算出**：手計算の百分率を正本にしない。各軸について全対象校数、直接確認されたYES/NO、示唆、未知、該当外、矛盾の各数と、全対象校に占める確認YES率、判定可能校に占めるYES率、判定可能率を出す。必ず分母と確認率を併記し、判定可能校0なら率は `null`（0%にしない）。率をもって直ちに違法学校率と表現しない。
6. **自治体総括から学校別へ**：自治体の概要と制度・教育委員会通知/回答の評価→各軸の割合と特色→制度面の法的評価→学校別評価の順に、本文の論証として書く。行政の主張は引用元と区別。学校別の個別根拠URL・ページ番号・未確認事項を公開用に示す。
7. **地図・公開判定**：既存`national-archive.html`、`research-map.html`、`data/research-municipalities.json`、`data/map-pins.json`、`data/schools/`、`archive/`と衝突しないURL/IDを設計。地図位置は検証可能な自治体代表座標（学校所在地ではない旨明記）のみ使用。未確認自治体を「適正/違法」の色で評価しない。公開前にSenior review・人間承認を得て、その後にPR・ブラウザ・リンク・表示検査を実施する。ユーザーが公開を明示しない限り外部公開しない。

## リンクする既存Skill

- 原本収集 → `drive-investigation`、`pdf-analysis`、`primary-source-research`
- 法令の確認 → `pta-structure-analysis`、`legal-analysis`、`municipal-response-analysis`
- 反証・照合 → `fact-check`
- サイト制作・公開 → `website-article`、`website-edit`、`publish-verification`

## 納品単位と合否

納品: `dataset.json`（全校・全評価軸・資料台帳）、`metrics.json`（検証器が算出）、自治体報告書、学校別評価書、地図用レコード、証拠URL一覧、検証ログ、レビュー記録。資料未取得校も `unknown` で登録する。途中段階は「暫定」と明記し「完成版」としない。

実行: `node ai-system/report-standards/scripts/validate-dataset.mjs path/to/dataset.json --metrics path/to/metrics.json`。公開候補には `--publish` を追加。**必須ゲートに失敗したら成果物を公開しない。** 合格は内容の真正性を自動保証しないため、実資料のSenior/human検証を別途必須とする。
