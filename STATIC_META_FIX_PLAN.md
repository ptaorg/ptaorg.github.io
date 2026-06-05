# 静的HTMLメタタグ修正計画

作成日: 2026-06-06
ブランチ: `fix/static-meta-20260606`

## 目的

SNSクローラーがJavaScript補修を読まない場合に備え、静的HTML本体に `twitter:image` と `twitter:image:alt` を直接追加する。

## 対象候補

1. `timeline.html`
2. `shizuoka-incident.html`
3. `guideline.html`
4. `compliance.html`

## 方針

- `main` 直更新ではなく、この検証ブランチで1ファイルずつ更新する。
- 本文構造や既存文章は削らない。
- 追加対象は原則として `<head>` 内のメタタグと `css/refine.css` 読み込みのみ。
- カード化、ハブ化、本文短縮は行わない。

## 確認事項

各ファイル更新後に次を確認する。

- `canonical` が1件であること
- `og:image` があること
- `twitter:card` があること
- `twitter:image` があること
- `twitter:image:alt` があること
- `site.js` 読み込みが残っていること
- 本文の主要セクションが欠落していないこと

## 未実施

- ブラウザ表示確認
- GitHub Pages反映後の目視確認
- ZIP作成
