# フェーズ6B 外部リンクのHTTP検査結果

確認日：2026年11月13日（GitHub Actions）。対象はルート・journal・researchのHTML 117ページ。外部リンク 497URL（重複除去後）。

HTTP 404/410は再確認候補であり、原典が削除されたと断定しません。403・429・通信失敗もリンク切れと認定しません。原典の同一性・内容まで検証するものではありません。URLのクエリ文字列は報告から省略しています。

## HTTP状況（URL数）

- network_unverified：6
- ok：458
- possible_404：21
- restricted：11
- server_error：1

## 404・410（再確認候補）

- 404 http://www.city.shibuya.tokyo.jp/eac/kansa/pdf/gyoseikansa20.pdf （掲載：journal/pta-fee-delegation-origin-local-government-law-20261016.html）
- 404 https://cgi.city.yokohama.lg.jp/shimin/kouchou/search/data/37003565.html （掲載：edu-board-separation.html, guide-board.html）
- 404 https://elaws.jp/view/346M50000100033 （掲載：journal/matsuyama-pta-fee-sorting-account-report-20261111.html）
- 404 https://www.city.anjo.aichi.jp/shisei/jouhou-hassin/2014koe/201404-2.html （掲載：edu-board-separation.html, guide-board.html）
- 404 https://www.city.funabashi.lg.jp/shisei/keikaku/008/p046969_d/fil/01_kangaekata.pdf （掲載：journal/matsuyama-pta-fee-sorting-account-report-20261111.html）
- 404 https://www.city.kawaguchi.lg.jp/material/files/group/12/270813shingikai01.pdf （掲載：journal/shinjuku-2020-pta-nonmember-data.html, research/kawaguchi.html）
- 404 https://www.city.kawaguchi.lg.jp/soshiki/01030/030/7/h27shinngikekka/2959.html （掲載：journal/shinjuku-2020-pta-nonmember-data.html）
- 404 https://www.city.matsuyama.ehime.jp/bosyu/RFC_kounoukin.html （掲載：journal/matsuyama-pta-fee-sorting-account-report-20261111.html）
- 404 https://www.city.matsuyama.ehime.jp/kurashi/kosodate/kyoikuiinkai/teirei/kaigirokur3/R304teireikai.files/R0304teireikai.pdf （掲載：journal/matsuyama-pta-fee-unification-20261013.html, research/matsuyama.html）
- 404 https://www.city.matsuyama.ehime.jp/shisei/denshinyusatsu/gyoumuitaku/info/r3itaku/kounoukinsystem.files/nyusatsusetsumeisyo.pdf （掲載：journal/matsuyama-pta-fee-sorting-account-report-20261111.html）
- 404 https://www.city.matsuyama.ehime.jp/shisei/denshinyusatsu/gyoumuitaku/info/r3itaku/kounoukinsystem.files/R30628shitsumonkaitou.pdf （掲載：journal/matsuyama-pta-fee-sorting-account-report-20261111.html）
- 404 https://www.city.osaka.lg.jp/seisakukikakushitsu/page/0000659152.html （掲載：edu-board-separation.html, guide-board.html）
- 404 https://www.city.shinagawa.tokyo.jp/PC/kukyoi/kukyoi-kukyoiyori/kukyoi-kukyoiyori-kiroku/r6kaigiroku/240611_7teirei.pdf （掲載：journal/pta-administrative-minutes.html）
- 404 https://www.city.shizuoka.lg.jp/documents/8060/000892688.pdf （掲載：journal/pta-fee-delegation-origin-local-government-law-20261016.html）
- 404 https://www.city.suginami.tokyo.jp/_res/projects/default_project/ （掲載：journal/matsuyama-pta-fee-sorting-account-report-20261111.html）
- 404 https://www.courts.go.jp/app/files/hanrei_jp/261/052261_hanrei.pdf （掲載：journal/matsuyama-pta-fee-sorting-account-report-20261111.html）
- 404 https://www.courts.go.jp/app/files/hanrei_jp/345/052345_hanrei.pdf （掲載：journal/matsuyama-pta-fee-sorting-account-report-20261111.html）
- 404 https://www.mext.go.jp/b_menu/shingi/chukyo/chukyo3/041/siryo/attach/1417145.htm （掲載：journal/pta-fee-delegation-origin-local-government-law-20261016.html）
- 404 https://www.ppc.go.jp/files/pdf/251212_koutekibumon_guidelines.pdf （掲載：journal/why-pta-membership-freedom-fails.html）
- 404 https://www.pref.gifu.lg.jp/uploaded/attachment/440861.pdf （掲載：research-map.html）
- 404 https://www2.osaka-c.ed.jp/kitano/R08/R08_141.pdf （掲載：fee-collection.html）

## リダイレクトと到達先

- http://www.city.shibuya.tokyo.jp/eac/kansa/pdf/gyoseikansa20.pdf → https://www.city.shibuya.tokyo.jp/eac/kansa/pdf/gyoseikansa20.pdf （possible_404 / HTTP 404）
- https://drive.google.com/drive/u/0/folders/1o6hQ5aXFkw-B6vI9FS0K7qfzOWktWvqu → https://accounts.google.com/v3/signin/identifier?query-omitted （ok / HTTP 200）
- https://kvoice.pref.fukuoka.lg.jp/voices/detail/?query-omitted → https://kvoice.pref.fukuoka.lg.jp/voices/search/ （ok / HTTP 200）
- https://smtrc.jp/useful/glossary/detail/n/4248 → https://smtrc.jp/useful/glossary/detail?query-omitted （ok / HTTP 200）
- https://warp.da.ndl.go.jp/ → https://warp.ndl.go.jp/ （ok / HTTP 200）
- https://www.kansa.metro.tokyo.lg.jp/PDF/02gyosei/21gyousei.pdf → https://www.kansa.metro.tokyo.lg.jp/documents/d/kansa/21gyousei （ok / HTTP 200）
- https://www.oita-press.co.jp/1010000000/2021/06/26/JD0060372709 → https://www.oita-press.co.jp/error404?query-omitted （ok / HTTP 200）
- https://www.ppc.go.jp/all_faq_index/faq7-q3-3-10 → https://www.ppc.go.jp/all_faq_index/faq7-q3-3-10/ （ok / HTTP 200）
- https://www.pref.osaka.lg.jp/chikikyoiku/michisirube/index.html → https://www.pref.osaka.lg.jp/o180090/chikikyoiku/michisirube/index.html （ok / HTTP 200）
- https://www.pref.shiga.lg.jp/kensei/kenseiunei/kansa/302723.html → https://www.pref.shiga.lg.jp/lc00/8874.html （ok / HTTP 200）
- https://www3.e-reikinet.jp/mizumaki/d1w_reiki/420902200003000000MH/420902200003000000MH/420902200003000000MH.html → https://e-reikinet.jp/comparison-service/subscrecommendation/ （ok / HTTP 200）

## 制限・通信失敗・サーバーエラー

- network_unverified 0 https://blog.pta-school-thinking.org/article/434577930.html （掲載：cases.html）
- network_unverified 0 https://chiholog.net/chiholog （掲載：administrative-materials.html）
- network_unverified 0 https://chiholog.net/yonalog （掲載：administrative-materials.html）
- restricted 403 https://info.gakko-mall.com/faq-cat/faq-teacher/ （掲載：journal/setagaya-pta-information-separation.html）
- restricted 403 https://law-lib.jp/subjects/2/provisions/185 （掲載：journal/matsuyama-pta-fee-sorting-account-report-20261111.html）
- restricted 403 https://news.allabout.co.jp/articles/o/73578/?query-omitted （掲載：guide-board.html）
- server_error 503 https://tsukuba.repo.nii.ac.jp/record/56033/files/TJLPS_1-1_02.pdf （掲載：cases.html）
- network_unverified 0 https://www.mext.go.jp/b_menu/boshu/mext_00077.html （掲載：journal/school-pta-fee-public-duty-mic-mext-ppc-20261016.html）
- network_unverified 0 https://www.ooyasyo.edu.city.ebina.kanagawa.jp/pdf/pta/2025soukai.pdf （掲載：journal/why-pta-membership-freedom-fails.html）
- restricted 403 https://www.pref.nara.jp/secure/118350/26-13-1.pdf （掲載：research-map.html）
- network_unverified 0 https://www.yakage.okayama-c.ed.jp/new2021/pdf/r8-choshu.pdf?query-omitted （掲載：fee-collection.html）
- restricted 403 https://www1.g-reiki.net/city.fuchu.tokyo/reiki_honbun/g130RG00000224.html （掲載：research-map.html）
- restricted 403 https://www1.g-reiki.net/city.minato.tokyo/reiki_honbun/g104RG00000533.html （掲載：research-map.html）
- restricted 403 https://www1.g-reiki.net/city.mitaka/reiki_honbun/g128RG00000326.html （掲載：journal/pta-fee-delegation-origin-local-government-law-20261016.html）
- restricted 403 https://www1.g-reiki.net/city.yasugi/reiki_honbun/r072RG00001955.html （掲載：research-map.html）
- restricted 403 https://www1.g-reiki.net/fuefuki/reiki_honbun/r092RG00000219.html （掲載：research-map.html）
- restricted 403 https://www1.g-reiki.net/inagawa/reiki_honbun/k324RG00000815.html （掲載：journal/pta-fee-delegation-origin-local-government-law-20261016.html）
- restricted 403 https://www1.g-reiki.net/town.mitane/reiki_honbun/r240RG00001014.html （掲載：research-map.html）

全URL別結果は phase6b-external-link-status-20261113.json に保存。JavaScript内の生成URLや学校別アーカイブは今回の検査対象外。
