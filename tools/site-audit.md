# サイト自動監査

本文や生成物を書き換えずに検査する。依存関係は `npm ci` で導入する。

```sh
npm test
npx playwright install chromium
npm run test:audit
npm run check:browser -- --report /absolute/path/outside-checkout/audit
```

`tools/check-site.mjs` は既存検査に `audit-site.mjs` の静的監査を追加する。
全HTMLを列挙し、公開除外HTMLはレポートの `inventory` に理由となる区分を記録する。
公開対象はsitemap掲載の有無にかかわらず、内部参照、フラグメント、srcset、
画像・PDFのシグネチャ、description、canonical、robots、重複IDを検査する。
コメント・script文字列・template内のIDは実文書のIDとみなさない。
画像のデコード失敗はブラウザでも検出する。PDF本文の意味や全ページの破損検査はしない。

robots meta省略は標準のindex,followとして許容する。
noindex・転送・404ページのdescription/canonical省略は正常な構造として許容する。
ただし指定済みタグの重複、空値、不正URL、参照先欠損は引き続き失敗。
旧ページのcanonicalが実在する節を指す場合は改善提案の警告とし、節欠損なら失敗。
noindex・転送ページのsitemap混入、robots.txtによる遮断、重複URL、
canonical不一致、公開ページのsitemap漏れを検出する。
URL台帳のsitemap除外指定を尊重する。サイト内の `sitemap*.xml` と
robots.txtが宣言するsitemapを対象とし、このサイトのurlset形式を検証する。
サイトマップインデックス形式に移行した場合は検査側の対応も必要。

ブラウザ検査はChromiumで全公開HTMLを1440×900と390×900で表示する。
4ページずつ独立したタブで巡回し、JavaScript例外、console.error、HTTP 4xx/5xx、
失敗リクエスト、画像読み込み失敗、1pxを超える横スクロールを記録する。
遅延読み込み用にページをスクロールする（最大100ステップ）。
主要ページおよびエラー発生ページの先頭画面をPNGに保存する。
絶対URLの内部通信も検査中のローカル配信に向ける。
外部サービスは実通信する。OpenStreetMapの既知ホストの数値タイルPNGに限り、
画像リソースのHTTP/通信/デコード失敗は理由付き警告として残す。
console.errorは発生URLが同じタイルで、対応する画像通信失敗も記録されている
ブラウザの「Failed to load resource」メッセージだけを警告にする。
同時刻の別のconsole.error、発生元不明、JavaScript例外、外部ライブラリの欠損、
自サイトの画像障害は失敗のまま。ERR_ABORTEDは地図再描画等のキャンセルとして区別する。
board-responses.htmlの地図初期化・ピン・回答本文・自治体索引が欠ける場合は失敗。
背景地図が一部欠けても回答本文と索引が正常なら、背景タイル障害でCI全体を停止しない。
動画・音声のpreload中断は、同じURLのメディアがmetadata取得済みでerrorなしの場合だけ
ブラウザ動作として警告化する。未読込、デコードエラー、その他の通信失敗は免除しない。
本文資料の外部画像404は、地図タイルとは異なり失敗を維持する。
ただしGoogle Analyticsのcollect送信のみ204応答で抑止し、実アクセス数に監査を混入させない。
抑止件数を `telemetrySuppressed` に記録する。計測用JavaScript自体は実行する。
検査終了時のタブ閉鎖が起こすリクエスト中断は検査対象外。
クリックで初めて起動する機能や長時間経過後のエラーまでは網羅しない。

ローカル実行は `_config.yml` の除外とJekyllの非公開パス規則をモデル化する。
Jekyll 3.xのFile.fnmatch?に合わせ、excludeの * は / をまたぐ。
根拠: https://github.com/jekyll/jekyll/blob/v3.10.0/lib/jekyll/entry_filter.rb
実際のJekyll処理結果との同一性を保証するものではない。
CIでは `actions/jekyll-build-pages` の成果物を対象に次を実行する。

```sh
npm run check:browser -- --site-dir _site --report /tmp/site-audit
```

公開物中の除外ファイルと既知の作業ファイル名・拡張子を検査する。
任意の名前を付けた作業資料まで内容から判別するものではない。
ビルド後HTMLの検査も行う。公開設定はこの監査では変更しない。

レポートは `audit.json`。各問題にコード、ファイル、詳細、ブラウザ幅を含める。
公開除外HTMLの件数とブラウザ訪問記録も保存する。
エラーがあれば終了コード1、警告のみなら0。summaryと各ブラウザ訪問に両件数を分けて記録する。
既存サイトの未修正問題はaudit-site.mjsのknownIssuesに2件だけ明示している。
確認元はdcb043a1305b53ff1458a85b4bab0d6010d57bf8。
対象はsitemap-research.xmlの旧research.html掲載と、guide-board-print.htmlの古いアンカー。
コード・ファイル・詳細が完全一致し1件だけの場合に限り、理由付き警告にする。
別のリンクや新たな問題、件数増加は失敗。解決して登録だけ残った場合も失敗とし、
同じ変更で不要な登録を削除する。分類単位・ページ単位の包括的な免除は行わない。
原始検出はauditStatic、既知問題の適用はapplyKnownIssuesに分離し、両方を回帰テストする。
本文・生成物の自動修正は行わない。
生成物比較はCRLFとLFのみ同一視し、その他の空白や本文変更は失敗させる。
既存の `npm test` が失敗してもCIは後続監査とartifact保存を実行し、ジョブは失敗を維持する。
レポートとスクリーンショットは公開物に混入しないよう、チェックアウト外に保存する。
