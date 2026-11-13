# フェーズ6E：原典の取得可否と公式閲覧入口の再整備（2026年11月13日）

## 検証の位置づけ

本調査は前段階フェーズ6Dの未解決13URLから開始した。**検索エンジンが以前取得したPDFの本文を返すことは、現在そのPDFの原本が公開中であることを意味しない**。直接取得／PDF表示で404だったものを「復旧」と計上しない。

## 今回のサイト上の変更（2件の旧リンク差替え）

1. 岐阜県の研究地図（GI02）にある旧URL https://www.pref.gifu.lg.jp/uploaded/attachment/440861.pdf は404。これを **岐阜県監査委員事務局の公式監査一覧** https://www.pref.gifu.lg.jp/page/4096.html へのリンクに変更し、「原本未復旧」と明記。公式一覧の「令和6年度・令和7年3月28日」には https://www.pref.gifu.lg.jp/uploaded/attachment/439432.pdf の別資料が掲載され、PDF自体は閲覧確認した（全3頁）。**旧440861.pdfとの同一性を確認していないため代替原本として扱わない**。
2. 松山市会計論考の「杉並区研究会資料」引用は、元のHTMLリンクが https://www.city.suginami.tokyo.jp/_res/projects/default_project/ で途切れ、残りがタグ外の `page/001/013/583/gz_kenkyukai2_ssr1.pdf` になっていた。推定復元した旧全文URL https://www.city.suginami.tokyo.jp/_res/projects/default_project/_page_/001/013/583/gz_kenkyukai2_ssr1.pdf も404。条文の確認先を **e-Govの地方自治法** https://laws.e-gov.go.jp/law/322AC0000000067 に変更。元の杉並区資料は「原本未取得」と表示し本記録に旧URLを保存する。**杉並区研究会資料の原本を復旧したとは主張しない**。

## 今回の出典状態注記（旧URLのリンク先は維持）

- 松山市 令和3年第4回教育委員会定例会議事録：
  https://www.city.matsuyama.ehime.jp/kurashi/kosodate/kyoikuiinkai/teirei/kaigirokur3/R304teireikai.files/R0304teireikai.pdf
  - 検索索引は旧本文を返すがPDF直接取得は404。市公式の年度横断入口 https://www.city.matsuyama.ehime.jp/kurashi/kosodate/kyoikuiinkai/teirei/index.html は現在も確認できる一方、令和3年度一覧 https://www.city.matsuyama.ehime.jp/kurashi/kosodate/kyoikuiinkai/teirei/kaigirokur3/index.html は404。旧PDFを他年度と誤って差し替えない。
- 松山市 システム調達入札説明書：
  https://www.city.matsuyama.ehime.jp/shisei/denshinyusatsu/gyoumuitaku/info/r3itaku/kounoukinsystem.files/nyusatsusetsumeisyo.pdf
  - PDF直接取得は404、検索索引は令和3年6月の本文を保持。公式調達案件ページ https://www.city.matsuyama.ehime.jp/shisei/denshinyusatsu/gyoumuitaku/info/r3itaku/kounoukinsystem.html は現存（事業内容・落札者・契約日等の確認入口）。契約書原本の代用ではない。
- 松山市 入札質問回答（R30628shitsumonkaitou.pdf）、川口市2015年の審議会資料（270813shingikai01.pdf）も原本直接取得未確認。川口市同日の会議録HTMLは https://www.city.kawaguchi.lg.jp/shiseijoho/fuzokukikanto/5/14/2/9859.html 。会議録での言及と2015年資料PDFの表11を同一視しない。
- 岐阜県旧PDFの検索索引上には県立学校とPTA会計に関する監査措置の記録が存在するが、2026-11-13の直接取得は404。検索インデックスや抜粋は現在公開される原本の証明としない。

## 未解決の旧404候補URL（11件）

| 旧URL | 掲載ページ | 判定・保留理由 |
|---|---|---|
| http://www.city.shibuya.tokyo.jp/eac/kansa/pdf/gyoseikansa20.pdf | `journal/pta-fee-delegation-origin-local-government-law-20261016.html` | 旧監査PDFの原本移転先未確認。旧URLを推測で変更しない |
| https://cgi.city.yokohama.lg.jp/shimin/kouchou/search/data/37003565.html | `edu-board-separation.html`<br>`guide-board.html` | 市民の声の公式記事番号が残っているか継続確認 |
| https://www.city.anjo.aichi.jp/shisei/jouhou-hassin/2014koe/201404-2.html | `edu-board-separation.html`<br>`guide-board.html` | 市民の声2014年記事の新URL未確定 |
| https://www.city.kawaguchi.lg.jp/material/files/group/12/270813shingikai01.pdf | `journal/shinjuku-2020-pta-nonmember-data.html`<br>`research/kawaguchi.html` | 公式審議会ページには2015年の記録・資料案内が残るがPDF実取得は404。検索キャッシュと混同しない |
| https://www.city.matsuyama.ehime.jp/bosyu/RFC_kounoukin.html | `journal/matsuyama-pta-fee-sorting-account-report-20261111.html` | 旧RFCの原文の同一版未確定 |
| https://www.city.matsuyama.ehime.jp/kurashi/kosodate/kyoikuiinkai/teirei/kaigirokur3/R304teireikai.files/R0304teireikai.pdf | `journal/matsuyama-pta-fee-unification-20261013.html`<br>`research/matsuyama.html` | 令和3年会議録目録の掲載はあるが、対象PDFの実取得が404。原本未確認 |
| https://www.city.matsuyama.ehime.jp/shisei/denshinyusatsu/gyoumuitaku/info/r3itaku/kounoukinsystem.files/nyusatsusetsumeisyo.pdf | `journal/matsuyama-pta-fee-sorting-account-report-20261111.html` | 公式入札結果ページ自体にはリンク掲載あり。添付PDFの実取得が404で原本閲覧不能。入札説明書の配布は当時メール方式 |
| https://www.city.matsuyama.ehime.jp/shisei/denshinyusatsu/gyoumuitaku/info/r3itaku/kounoukinsystem.files/R30628shitsumonkaitou.pdf | `journal/matsuyama-pta-fee-sorting-account-report-20261111.html` | 公式入札結果ページ自体にはリンク掲載あり。添付PDFの実取得が404で原本閲覧不能。入札説明書の配布は当時メール方式 |
| https://www.city.osaka.lg.jp/seisakukikakushitsu/page/0000659152.html | `edu-board-separation.html`<br>`guide-board.html` | 市民の声の該当記事の現行掲載先未確定 |
| https://www.mext.go.jp/b_menu/shingi/chukyo/chukyo3/041/siryo/attach/1417145.htm | `journal/pta-fee-delegation-origin-local-government-law-20261016.html` | 既存記事にWayback保存版URLあり。公式原本の現行移転先は未確認 |
| https://www2.osaka-c.ed.jp/kitano/R08/R08_141.pdf | `fee-collection.html` | 北野高校2026年対象PDFの現行公開先を未特定。他高校の資料で代替しない |

## 数え方

- 旧フェーズ6Bの404/410候補：21 URL。
- フェーズ6Cと6Dにおいて旧URLを差替え済み：PPC 1件＋判例等4件＋会議録等3件＝8件。フェーズ6D時点で旧リンクが残るのは13件。
- 本フェーズ6Eは2つの旧リンクを公式の閲覧入口または正式法令検索へ変更。**元資料を復旧したものは0件**。
- 当初の旧404候補21件のうち、サイトのリンクとして残るのは**11件**（今回の作業対象が当初の21URLに限定されることに注意）。これを新たな全サイト404件数と解釈しない。
- フェーズ6B全497URLのHTTP検査を再実行していない。原文・引用・画像・既存アンカーは変更せず、出典URL・該当出典文言・確認状況注記のみ更新した。
- フェーズ6全体の出典対応率90%以上は算定していない。

## 次の検証先

- 松山市の令和3年4月教育委員会会議録と入札仕様書・業務機能要件書を、旧資料と同一版で取得できるか再確認する。
- 川口市2015年資料のPDF48頁を、公式原本または自治体保管の開示原本で確認する。
- 岐阜県440861.pdfの更新履歴・同一版の保管場所を県に照会する。
- 404と確認したURLを掲載する場合は、アクセス可能な補助資料と区別して表記する。
