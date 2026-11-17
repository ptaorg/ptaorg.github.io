---
name: pta-municipal-investigation-v4
description: 全国の公立学校PTA調査を、原本探索→取得・展開→本文と該当箇所→切り抜き証拠→法的審査→市の制度責任→保護者向けページ→公開検証へ統合する。既存v3と12軸・10文書を継承し、証拠を捏造しない再開可能な調査台帳と検査器を使う。
---

# PTA自治体・学校別原本監査・統合実行スキル v4.0.0

制定：2026-11-17。入口：`.agents/skills/pta-municipal-school-report/SKILL.md`。

## 0．上位規程と不変条件

順番に `AGENTS.md`、`ai-system/CORE_INSTRUCTIONS.md`、`ai-system/ORCHESTRATION.md`、`ai-system/QUALITY_STANDARD.md`、`ai-system/skills/municipal-school-report.md`、`ai-system/skills/municipal-assessment-v3.md`、`ai-system/skills/municipal-investigation-pipeline.md`、`ai-system/skills/municipal-web-publishing.md`、`ai-system/report-standards/README.md` を読む。

v4は**原本の取得と検証の実行順序・再開・証拠連鎖**を追加する。既存の固定12軸、10文書、15法令、制度責任・権利分析、v3法的ゲートを置換しない。旧資料・画像・評価は照合を経ずに削除・巻き戻し・上書きしない。自動でメール送信・権限変更・公開・マージをしない。

## 1．起動と資料探索（最優先）

自治体名、対象校種、実在する設置校IDの**全母集団**、基準日、PR/HEAD、既存原本台帳を固定する。新規と引継ぎの差を記録。全36校の一覧があっても、内部事務原本を確認した学校数は別集計とする。

Google Driveの「全国資料」自治体別フォルダ、全アクセス可能なGmailアカウントの送受信・添付・開示回答、学校公式サイト、自治体例規・通知、過年度・Webアーカイブ、既存GitHub調査を探す。ZIP、PDF、画像、番号だけのファイル名、別アカウント、同名重複、ZIP内部の資料まで扱う。検索はページネーション・対象範囲・制限を記録し、ファイル名だけから内容確認済みと認定しない。

**取得制限時の再試行**：接続アカウントの確認→同じ所有者のマイドライブ→認証済みブラウザ操作→元メールの添付取得→既存ローカル／会話資料の有無→公開原本の代替、の順に正規ルートを確認する。権限回避、リンクの憶測、未取得本文の捏造は禁止。各手順で `retrievalAttempts` を残し、403・404・非対応・通信エラーを区別。失敗した1資料だけを理由に他校調査を終了しない。

Google Driveフォルダに「原本はこちら」とリンクがあることは、ファイル本体の本文検証や第三者のアクセス権限を保証しない。ローカルPCから同名フォルダを推測しない。

## 2．取得した原本と画像の検証

ファイル本体を取得した場合のみSHA-256を確定。ZIPは全ファイルを一覧化し、各内部ファイルの名前・サイズ・親ZIP・SHA-256・実在学校・発行者・発行年月・該当原文／画像の文脈を調べる。学校名が不明なときは `schoolId=null` を保ち、勝手に割り当てない。児童氏名や住所等の不要な個人情報を公開用データに複写しない。

原本の証拠分類を固定する：`school_internal`（学校別のPTA内部事務を示す文書）／`official_registry`（行政登録簿）／`supplement`（学校活動・表彰等）／`municipal_rule`（制度通知）／`other`。**登録簿だけで学校のPTA会費収納・役員選出・目的外提供を確認済みにしない。** 同じ行政文書の複製は独立の証拠件数として数えない。

証拠画像は**該当箇所のみ**切り抜く。原本ID、原本ハッシュ、PDFページ、切り抜きの `[x0,y0,x1,y1]`、画像ハッシュ、示す事実、採用・保留・却下と理由を記録。原本の前後文脈を読んで意味を損なわない。紙面全体の機械的な画像化や数合わせは禁止。公開用画像の個人情報の必要性・権利処理は原本保全とは別に検討する。

### 実行コマンド：ZIPと証拠画像

Work等の承認済み作業環境で、取得した**ローカルの実バイト列**に対して実行する。

```bash
python3 ai-system/report-standards/scripts/evidence-tools.py ingest original.zip private/evidence/unpacked
python3 ai-system/report-standards/scripts/evidence-tools.py crop original.pdf private/evidence/clip-p2.png --page 2 --rect 42 96 470 255
node ai-system/report-standards/scripts/municipal-v4.mjs validate private/municipal-v4.json --check-bytes --strict-review
```

`--rect` はレビュー担当者がPDF原文で選定した数値（PDFポイント、左上起点）。この数値は**コマンド例**であり、そのまま実資料に当てはめない。画像入力ではピクセル単位。切り抜きが自動的に事実や違法性を証明するわけではなく、文脈照合後に `clips[].decision` を採用へ変更する。元ZIP・元PDF・生成した画像のハッシュと原資料との一致を保存する。ZIP展開は空の保存先に限定し、パス逸脱・暗号化・重複名・過大容量を拒否する。

2件のZIPがそれぞれ10枚・5枚と確認できた場合、`targets[].expectedEntries` に各々の内部ファイル数を記録できる。ZIPのダウンロードに成功しても、該当数の画像本文を確認するまで `ARCHIVE_NOT_FULLY_VERIFIED` により完了を拒否する。ファイル数は実際のZIP目録と突き合わせ、推定値を記入しない。

## 3．法令審査と市の責任

法的評価は**①学校／教委とPTAの主体分離 → ②事務帰属 → ③学校側の具体的な公法上の所掌・権限と例外 → ④個情法61条 → ⑤同69条 → ⑥地公法服務・資金保管 → ⑦民事契約・人権・公平・救済**を固定する。私人間委任・同意・校長裁量を公法授権の代用にしない。学校とPTAが別団体であることだけから違法と断じない。制定規程の存在、学校適用、行為実施、要件充足、適法性を区分する。

学校別の12観察軸と10文書の存否を既存スキーマで検証する。文書未取得＝不存在、登録簿の記録項目＝現実の名簿使用、徴収日程の掲載＝学校による実収納、学校のPTA規約＝職員の公務上の従事、をいずれも混同しない。

自治体の通知、受任契約や徴収金要綱、収納システム、旧方針、回答、是正の実施状況を時系列で整理し、**市の制定・指示・監督責任**と学校個別実務を分離。方針転換を肯定評価しつつ、通知改廃・学校実施・効果検証を別判定する。

## 4．再開可能な作業台帳と品質ゲート

入力JSONは**非公開作業領域**に保管し、メール本文や児童氏名をGitHubへ書き込まない。

```bash
node ai-system/report-standards/scripts/municipal-v4.mjs init 厚木市 roster.json private/atsugi-v4.json 2026-11-17
node ai-system/report-standards/scripts/municipal-v4.mjs validate private/atsugi-v4.json
node ai-system/report-standards/scripts/municipal-v4.mjs validate private/atsugi-v4.json --check-bytes --strict-review
```

`roster.json` は実在学校ID配列。最初のコマンドは**既存ファイルを上書きしない**。`targets[]` は原本取得対象で、`retrievalAttempts[]` には各接続先・結果・根拠を時系列で残す。`artifacts[]` は原本ハッシュと照合レベル、`clips[]` は切り抜き台帳、`schoolAssessments[]` は全対象校・7つの法的順序を持つ。`progress` は既存の12軸検証・10文書検証・v3法的審査・レビュー・Web実測の通過を記録する。**チェックをtrueにするのは独立の検証結果があるときだけ**。

`--check-bytes` はローカルの原本・画像実バイト列をSHA-256と比較する。出力の `readyForReview` と `readyForPublication` は異なる。途中・障害で `blocked` を残しても他作業は続行するが、完了と公称しない。`exhausted` とは正規の探索経路と残る取得不能理由を記録した状態であり「文書不存在」の認定ではない。

`validate-municipal-v3.mjs`、`validate-dataset.mjs`、`validate-document-existence.mjs`、`validate-municipal-web.mjs` は従来どおり実行する。本スクリプトの合格だけで元資料の真正性や法的評価が承認されたことにはならない。

## 5．原本が不足する場合の収束と再開

各学校について、入会、会費、委任、役員、名簿、収納口座、教職員の関与について何を取得し何が未立証かを出す。資料の所在不明と情報公開制度での正式不存在決定を区別する。取得不能の時は具体的な追加開示請求事項を整理する。

中間報告は成果・証拠・障害だけを簡潔に示す。原本探索を15校／28校など途中で打ち切り、Web総評に先行移行しない。既存ページのデータが更新されたときは生成元とHTMLの整合を検証する。

## 6．公開と納品

一般保護者向けは **何が確認されたか → 問題／改善 → 根拠画像 → 法的理由 → 必要な是正**。専門家向けは各原本ID／URL／該当ページ／引用／反証／法令要件を残す。全国地図→自治体→学校→原本リンクを維持し、Xカード・PC・スマホ実表示を確認する。

既存PRを継承し、`npm test` と必要な検証器、`git diff --check`、ブラウザテストを実施。追加公開やマージはユーザーの明示的指示に従う。成果の報告は、**全母集団、学校別内部事務原本確認数、市登録簿確認数、補足資料数、ZIP内画像数、切り抜き採用／保留、検査実行状況、PRコミット、残る取得不能資料**を別々に明示する。

**このv4は調査実行時の品質ゲートであり、Gmail／Driveにログインして原本を自動入手するロボットではない。接続済みツールで取得できる原本の処理を規格化し、取得制限と完成状態を偽らない。**
