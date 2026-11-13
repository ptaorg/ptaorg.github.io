# フェーズ6G：公開外部リンク全量再監査・原本取得状況（2026年11月13日）

## 検査の方法と範囲

- GitHub Actions [実行 #43360393528](https://github.com/ptaorg/ptaorg.github.io/actions/runs/43360393528) で `tools/phase6b-audit-external.mjs` を再実行。
- ルート・`journal`・`research` のHTML **117ページ**にある重複を除いた外部リンク **498 URL**を対象。学校別ページの別アーカイブ・JavaScript生成URLは対象外。
- `HEAD` を優先し、一部の不成功には `GET` で再確認。リダイレクト・HTTPエラー・通信失敗を記録。1リンクにつき4.5秒のタイムアウトを設定。
- **404/410は修復・追調査の候補であり原本の恒久削除を確定しない**。検索索引でヒットするPDFの内容は公開ファイルの現存・版の一致を意味しない。
- 原データ全498 URLは[GitHub Actionsアーティファクト](https://github.com/ptaorg/ptaorg.github.io/actions/runs/43360393528) `phase6g-external-link-results` に収録（ダウンロードはGitHub認証が必要な場合あり）。この報告は要約台帳であり、原データJSONの一部を省略したものではない。

## 検査集計（変更前のブランチで実施）

| HTTP判定 | URL件数 | 解釈 |
|---|---:|---|
| 2xx | 466 | HTTP応答あり。資料内容・引用同一性は別問題 |
| 404/410 | 11 | 再確認候補 |
| アクセス制限 | 11 | 403等。リンク切れと断定できない |
| 通信未確認 | 5 | タイムアウト・TLS等 |
| リダイレクト循環 | 4 | リンク不達を再現したが削除の証拠ではない |
| 5xx | 1 | サーバー側一時障害の可能性 |
| **合計** | **498** | 2xx率 **93.6%**（出典対応率ではない） |

## 当初21件から残る旧リンク10件の再検査結果

| 旧URL | フェーズ6G結果 | 掲載ページ |
|---|---|---|
| http://www.city.shibuya.tokyo.jp/eac/kansa/pdf/gyoseikansa20.pdf | possible_404 / 404 | journal/pta-fee-delegation-origin-local-government-law-20261016.html |
| https://cgi.city.yokohama.lg.jp/shimin/kouchou/search/data/37003565.html | possible_404 / 404 | edu-board-separation.html、guide-board.html |
| https://www.city.anjo.aichi.jp/shisei/jouhou-hassin/2014koe/201404-2.html | redirect_cycle / 0 | edu-board-separation.html、guide-board.html |
| https://www.city.kawaguchi.lg.jp/material/files/group/12/270813shingikai01.pdf | possible_404 / 404 | journal/shinjuku-2020-pta-nonmember-data.html、research/kawaguchi.html |
| https://www.city.matsuyama.ehime.jp/bosyu/RFC_kounoukin.html | possible_404 / 404 | journal/matsuyama-pta-fee-sorting-account-report-20261111.html |
| https://www.city.matsuyama.ehime.jp/kurashi/kosodate/kyoikuiinkai/teirei/kaigirokur3/R304teireikai.files/R0304teireikai.pdf | possible_404 / 404 | journal/matsuyama-pta-fee-unification-20261013.html、research/matsuyama.html |
| https://www.city.matsuyama.ehime.jp/shisei/denshinyusatsu/gyoumuitaku/info/r3itaku/kounoukinsystem.files/nyusatsusetsumeisyo.pdf | possible_404 / 404 | journal/matsuyama-pta-fee-sorting-account-report-20261111.html |
| https://www.city.matsuyama.ehime.jp/shisei/denshinyusatsu/gyoumuitaku/info/r3itaku/kounoukinsystem.files/R30628shitsumonkaitou.pdf | possible_404 / 404 | journal/matsuyama-pta-fee-sorting-account-report-20261111.html |
| https://www.city.osaka.lg.jp/seisakukikakushitsu/page/0000659152.html | possible_404 / 404 | edu-board-separation.html、guide-board.html |
| https://www.mext.go.jp/b_menu/shingi/chukyo/chukyo3/041/siryo/attach/1417145.htm | possible_404 / 404 | journal/pta-fee-delegation-origin-local-government-law-20261016.html |

## 今回の再監査で新たに判明した問題

- **川口市**：過去の修復先 `https://www.city.kawaguchi.lg.jp/shiseijoho/fuzokukikanto/5/14/2/9859.html` がGitHub Actions実行環境から404。別の検索閲覧環境では2015年会議録本文を取得できるため、削除認定せず、新たな利用環境差として扱う。2015年審議会資料PDF `270813shingikai01.pdf` は別物であり未復旧。
- **静岡市**：フェーズ6Dで代替入口とした `https://www.city.shizuoka.lg.jp/s2378/s008206.html` はActions・Web閲覧とも404。2021年4月16日付『静岡市報』公表公告 `https://www.city.shizuoka.lg.jp/documents/8311/000892721.pdf` を別の公式一次資料として確認し出典リンクを変更。公表公告は令和2年度行政監査の実施・報告書公表を示すが、**同年度の監査報告本文の原本ではない**。旧 `https://www.city.shizuoka.lg.jp/documents/8060/000892688.pdf` は未復旧。
- **安城市**：2014年市民の声旧URLが `redirect_cycle`。当初404判定から分類変更したが、原文にアクセスできる移転先は確認できず未解決のまま。
- **愛知県の一部PDF**：リダイレクト循環が発生している。到達したかのように修正・削除しない。

## 全非2xxリンクの状況（32件）

| 種別 | HTTP | URL | 掲載箇所 |
|---|---:|---|---|
| possible_404 | 404 | http://www.city.shibuya.tokyo.jp/eac/kansa/pdf/gyoseikansa20.pdf | journal/pta-fee-delegation-origin-local-government-law-20261016.html |
| network_unverified | 0 | https://blog.pta-school-thinking.org/article/434577930.html | cases.html |
| possible_404 | 404 | https://cgi.city.yokohama.lg.jp/shimin/kouchou/search/data/37003565.html | edu-board-separation.html, guide-board.html |
| network_unverified | 0 | https://chiholog.net/chiholog | administrative-materials.html |
| network_unverified | 0 | https://chiholog.net/yonalog | administrative-materials.html |
| restricted | 403 | https://info.gakko-mall.com/faq-cat/faq-teacher/ | journal/setagaya-pta-information-separation.html |
| restricted | 403 | https://law-lib.jp/subjects/2/provisions/185 | journal/matsuyama-pta-fee-sorting-account-report-20261111.html |
| restricted | 403 | https://news.allabout.co.jp/articles/o/73578/?query-omitted | guide-board.html |
| server_error | 503 | https://tsukuba.repo.nii.ac.jp/record/56033/files/TJLPS_1-1_02.pdf | cases.html |
| redirect_cycle | 0 | https://www.city.anjo.aichi.jp/shisei/jouhou-hassin/2014koe/201404-2.html | edu-board-separation.html, guide-board.html |
| redirect_cycle | 0 | https://www.city.anjo.aichi.jp/shisei/jouhou-hassin/2022koe/0306.html | edu-board-separation.html, guide-board.html |
| possible_404 | 404 | https://www.city.kawaguchi.lg.jp/material/files/group/12/270813shingikai01.pdf | journal/shinjuku-2020-pta-nonmember-data.html, research/kawaguchi.html |
| possible_404 | 404 | https://www.city.kawaguchi.lg.jp/shiseijoho/fuzokukikanto/5/14/2/9859.html | journal/shinjuku-2020-pta-nonmember-data.html, research/kawaguchi.html |
| possible_404 | 404 | https://www.city.matsuyama.ehime.jp/bosyu/RFC_kounoukin.html | journal/matsuyama-pta-fee-sorting-account-report-20261111.html |
| possible_404 | 404 | https://www.city.matsuyama.ehime.jp/kurashi/kosodate/kyoikuiinkai/teirei/kaigirokur3/R304teireikai.files/R0304teireikai.pdf | journal/matsuyama-pta-fee-unification-20261013.html, research/matsuyama.html |
| possible_404 | 404 | https://www.city.matsuyama.ehime.jp/shisei/denshinyusatsu/gyoumuitaku/info/r3itaku/kounoukinsystem.files/nyusatsusetsumeisyo.pdf | journal/matsuyama-pta-fee-sorting-account-report-20261111.html |
| possible_404 | 404 | https://www.city.matsuyama.ehime.jp/shisei/denshinyusatsu/gyoumuitaku/info/r3itaku/kounoukinsystem.files/R30628shitsumonkaitou.pdf | journal/matsuyama-pta-fee-sorting-account-report-20261111.html |
| possible_404 | 404 | https://www.city.osaka.lg.jp/seisakukikakushitsu/page/0000659152.html | edu-board-separation.html, guide-board.html |
| possible_404 | 404 | https://www.city.shizuoka.lg.jp/s2378/s008206.html | journal/pta-fee-delegation-origin-local-government-law-20261016.html |
| possible_404 | 404 | https://www.mext.go.jp/b_menu/shingi/chukyo/chukyo3/041/siryo/attach/1417145.htm | journal/pta-fee-delegation-origin-local-government-law-20261016.html |
| network_unverified | 0 | https://www.ooyasyo.edu.city.ebina.kanagawa.jp/pdf/pta/2025soukai.pdf | journal/why-pta-membership-freedom-fails.html |
| redirect_cycle | 0 | https://www.pref.aichi.jp/uploaded/attachment/38563.pdf | research-map.html |
| redirect_cycle | 0 | https://www.pref.aichi.jp/uploaded/attachment/562448.pdf | pta-school-processing.html, research-map.html |
| restricted | 403 | https://www.pref.nara.jp/secure/118350/26-13-1.pdf | research-map.html |
| network_unverified | 0 | https://www.yakage.okayama-c.ed.jp/new2021/pdf/r8-choshu.pdf?query-omitted | fee-collection.html |
| restricted | 403 | https://www1.g-reiki.net/city.fuchu.tokyo/reiki_honbun/g130RG00000224.html | research-map.html |
| restricted | 403 | https://www1.g-reiki.net/city.minato.tokyo/reiki_honbun/g104RG00000533.html | research-map.html |
| restricted | 403 | https://www1.g-reiki.net/city.mitaka/reiki_honbun/g128RG00000326.html | journal/pta-fee-delegation-origin-local-government-law-20261016.html |
| restricted | 403 | https://www1.g-reiki.net/city.yasugi/reiki_honbun/r072RG00001955.html | research-map.html |
| restricted | 403 | https://www1.g-reiki.net/fuefuki/reiki_honbun/r092RG00000219.html | research-map.html |
| restricted | 403 | https://www1.g-reiki.net/inagawa/reiki_honbun/k324RG00000815.html | journal/pta-fee-delegation-origin-local-government-law-20261016.html |
| restricted | 403 | https://www1.g-reiki.net/town.mitane/reiki_honbun/r240RG00001014.html | research-map.html |

## 今回サイトに反映する修正

- `journal/pta-fee-delegation-origin-local-government-law-20261016.html` の `source-49` の静岡市リンク1件を、市報の公式PDFへ切替え、リンク説明文で監査原本を未取得と明示。元の一般行政監査結果PDFを復旧したとは主張しない。
- 公開サイトの既存引用・画像・アンカー・その他の出典URLは変更しない。
- このフェーズの **498URL・11件404・466件2xx** は上記差替え**前**に取得した検査値。差替え後の改定版について厳密な最新全件計数を主張せず、GitHub Actionsを再実行し別の証跡とする。
- GitHub ActionsのCI結果とデプロイ結果は別途確認する。

## 出典対応率90%以上の評価

- HTTPの2xx割合93.6%と、資料の真正性・版の照合・本文との対応を判定した出典対応率は別の指標。**出典対応率90%以上は現在確認していない**。
- この監査は「学校がPTA会費を徴収できる法的権限」を判定するものではない。主体分離→事務の帰属→公法上の権限→個人情報の用途制限の順序で別途審査する。

## 優先的に取得する原資料

- 松山市：2021年4月教育委員会会議録、システム調達入札説明書・質問回答PDFと同一の公式原本。
- 川口市：2015年審議会添付資料PDFの表11（PDF48ページ相当）の原本。
- 静岡市：令和2年度行政監査（テーマ監査）報告書全文。
- 横浜市・安城市・大阪市：該当市民の声ページの移転先と同一案件かの照合。

