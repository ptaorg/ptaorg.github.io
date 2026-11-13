# フェーズ6C：2026年11月13日 外部リンク再調査・確認済み修復記録

対象：`ptaorg/ptaorg.github.io` 本番 `main` のフェーズ6B検査結果を起点とする。原文・引用・画像・既存IDを保全し、同一資料の公式移転先が確認できたリンクだけ変更する。

## 判定と件数

- フェーズ6BのHTTP 404/410候補：21 URL（原本削除の確定件数ではない）
- 既にフェーズ6Bの後続PR #133で修正：PPC 1 URL
- 今回リンク更新：**4 URL**（当該HTMLでのURL文字列出現箇所は**10箇所**）
- 修正先を確定できず保留：**16 URL**
- HTTP再監査497件は未再実行。したがって全体の最新成功率は主張しない。

## 確認済み修正 4件

- 旧：https://www.courts.go.jp/app/files/hanrei_jp/261/052261_hanrei.pdf
  - 新：https://www.courts.go.jp/assets/hanrei/hanrei-pdf-52261.pdf
  - 確認：裁判所の裁判例結果詳細ページで事件番号・判決日・裁判要旨を照合。詳細ページから新PDFへ到達

- 旧：https://www.courts.go.jp/app/files/hanrei_jp/345/052345_hanrei.pdf
  - 新：https://www.courts.go.jp/assets/hanrei/hanrei-pdf-52345.pdf
  - 確認：裁判所の裁判例結果詳細ページで事件番号・判決日・裁判要旨を照合。詳細ページから新PDFへ到達

- 旧：https://elaws.jp/view/346M50000100033
  - 新：https://laws.e-gov.go.jp/law/346M50000100033
  - 確認：e-Gov法令検索で法令番号346M50000100033が児童手当法施行規則であることを照合

- 旧：https://www.city.funabashi.lg.jp/shisei/keikaku/008/p046969_d/fil/01_kangaekata.pdf
  - 新：https://www.city.funabashi.lg.jp/shisei/keikaku/007/p046969_d/fil/01_kangaekata.pdf
  - 確認：船橋市公式ページP046969の令和元年10月改定PDFと直接リンクを照合

## 未解決16件（2026年11月13日時点）

| 旧URL | 掲載ページ | 確認状況・判断 |
|---|---|---|
| http://www.city.shibuya.tokyo.jp/eac/kansa/pdf/gyoseikansa20.pdf | `journal/pta-fee-delegation-origin-local-government-law-20261016.html` | 旧監査PDFの原本移転先未確認。旧URLを推測で変更しない |
| https://cgi.city.yokohama.lg.jp/shimin/kouchou/search/data/37003565.html | `edu-board-separation.html`<br>`guide-board.html` | 市民の声の公式記事番号が残っているか継続確認 |
| https://www.city.anjo.aichi.jp/shisei/jouhou-hassin/2014koe/201404-2.html | `edu-board-separation.html`<br>`guide-board.html` | 市民の声2014年記事の新URL未確定 |
| https://www.city.kawaguchi.lg.jp/material/files/group/12/270813shingikai01.pdf | `journal/shinjuku-2020-pta-nonmember-data.html`<br>`research/kawaguchi.html` | 公式審議会ページには2015年の記録・資料案内が残るがPDF実取得は404。検索キャッシュと混同しない |
| https://www.city.kawaguchi.lg.jp/soshiki/01030/030/7/h27shinngikekka/2959.html | `journal/shinjuku-2020-pta-nonmember-data.html` | 2015年会議結果の公式掲載先として別の現存URL（/shiseijoho/fuzokukikanto/5/14/2/9859.html）を確認。ただし閲覧環境差があるため追加検証 |
| https://www.city.matsuyama.ehime.jp/bosyu/RFC_kounoukin.html | `journal/matsuyama-pta-fee-sorting-account-report-20261111.html` | 旧RFCの原文の同一版未確定 |
| https://www.city.matsuyama.ehime.jp/kurashi/kosodate/kyoikuiinkai/teirei/kaigirokur3/R304teireikai.files/R0304teireikai.pdf | `journal/matsuyama-pta-fee-unification-20261013.html`<br>`research/matsuyama.html` | 令和3年会議録目録の掲載はあるが、対象PDFの実取得が404。原本未確認 |
| https://www.city.matsuyama.ehime.jp/shisei/denshinyusatsu/gyoumuitaku/info/r3itaku/kounoukinsystem.files/nyusatsusetsumeisyo.pdf | `journal/matsuyama-pta-fee-sorting-account-report-20261111.html` | 公式入札結果ページ自体にはリンク掲載あり。添付PDFの実取得が404で原本閲覧不能。入札説明書の配布は当時メール方式 |
| https://www.city.matsuyama.ehime.jp/shisei/denshinyusatsu/gyoumuitaku/info/r3itaku/kounoukinsystem.files/R30628shitsumonkaitou.pdf | `journal/matsuyama-pta-fee-sorting-account-report-20261111.html` | 公式入札結果ページ自体にはリンク掲載あり。添付PDFの実取得が404で原本閲覧不能。入札説明書の配布は当時メール方式 |
| https://www.city.osaka.lg.jp/seisakukikakushitsu/page/0000659152.html | `edu-board-separation.html`<br>`guide-board.html` | 市民の声の該当記事の現行掲載先未確定 |
| https://www.city.shinagawa.tokyo.jp/PC/kukyoi/kukyoi-kukyoiyori/kukyoi-kukyoiyori-kiroku/r6kaigiroku/240611_7teirei.pdf | `journal/pta-administrative-minutes.html` | 検索索引で2024年会議録本文確認。ただしPDF実取得は404であるため移転先調査継続 |
| https://www.city.shizuoka.lg.jp/documents/8060/000892688.pdf | `journal/pta-fee-delegation-origin-local-government-law-20261016.html` | 2020年度監査資料の同一版未確認 |
| https://www.city.suginami.tokyo.jp/_res/projects/default_project/ | `journal/matsuyama-pta-fee-sorting-account-report-20261111.html` | HTML href がPDFのディレクトリ部分のみ。元ページに残る <em>page</em> 以降を復元・同一資料確認する必要 |
| https://www.mext.go.jp/b_menu/shingi/chukyo/chukyo3/041/siryo/attach/1417145.htm | `journal/pta-fee-delegation-origin-local-government-law-20261016.html` | 既存記事にWayback保存版URLあり。公式原本の現行移転先は未確認 |
| https://www.pref.gifu.lg.jp/uploaded/attachment/440861.pdf | `research-map.html` | 検索索引で原資料本文を確認したがPDF実取得が404。移転先未確定 |
| https://www2.osaka-c.ed.jp/kitano/R08/R08_141.pdf | `fee-collection.html` | 北野高校2026年対象PDFの現行公開先を未特定。他高校の資料で代替しない |

## 補助的に確認した公式入口

- 松山市校納金徴収管理システム構築事業の入札情報：https://www.city.matsuyama.ehime.jp/shisei/denshinyusatsu/gyoumuitaku/info/r3itaku/kounoukinsystem.html
- 松山市教育委員会の年度別会議録目録：https://www.city.matsuyama.ehime.jp/kurashi/kosodate/kyoikuiinkai/teirei/index.html
- 川口市平成27年度第1回第1部審議会結果：https://www.city.kawaguchi.lg.jp/shiseijoho/fuzokukikanto/5/14/2/9859.html
- 品川区2024年6月11日会議録（検索索引で存在確認、実ファイルの現時点取得は不可）：https://www.city.shinagawa.tokyo.jp/PC/kukyoi/kukyoi-kukyoiyori/kukyoi-kukyoiyori-kiroku/r6kaigiroku/240611_7teirei.pdf

## 継続時のルール

1. 検索キャッシュに全文があることと、公開ファイルの実取得可否は分ける。
2. 同じテーマであっても別年度・別学校・別案件の資料で原典URLを置換しない。
3. 学校・自治体・PTAの主体を区別し、引用元の出典と法的評価の混同を避ける。
4. 原文・画像・アンカーは変更せず、引用先の一致が確認できたURLだけ変更する。
5. 既存のフェーズ6BのJSONは実行当時の監査履歴であり、今回の変更で改変しない。
