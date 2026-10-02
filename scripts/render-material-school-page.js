const fs = require("fs");
const path = require("path");
const {
  ROOT,
  absoluteUrl,
  escapeHtml,
  gaTag
} = require("./archive-utils");

function commonChrome() {
  const source = fs.readFileSync(path.join(ROOT, "national-archive.html"), "utf8");
  const header = source.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0];
  const mobileStart = source.indexOf('<div class="mobile-overlay" id="mobileOverlay">');
  const mainStart = source.indexOf("<main", mobileStart);
  const mobile = mobileStart >= 0 && mainStart > mobileStart ? source.slice(mobileStart, mainStart).trim() : "";
  const footer = source.match(/<footer class="footer">[\s\S]*?<\/footer>/)?.[0];
  if (!header || !mobile || !footer) throw new Error("Common site chrome could not be read");
  return { header, mobile, footer };
}

function renderDocuments(record) {
  const docs = Array.isArray(record.documents) ? record.documents : [];
  if (!docs.length) return '<p class="archive-muted">掲載準備中です。</p>';
  return `<div class="archive-material-list">
${docs.map((doc) => {
    const meta = [doc.year, doc.category].filter(Boolean).map(escapeHtml).join(" ／ ");
    const status = doc.publicationStatus || "公開前確認中";
    const link = doc.href
      ? `<a class="archive-download" href="${escapeHtml(doc.href)}">${escapeHtml(doc.linkLabel || "資料を開く")}</a>`
      : `<span class="archive-muted">${escapeHtml(status)}</span>`;
    return `<article class="archive-material-item">
      <p class="archive-label">${meta}</p>
      <h3>${escapeHtml(doc.title)}</h3>
      ${doc.source ? `<p>出典：${escapeHtml(doc.source)}</p>` : ""}
      <p>${link}</p>
    </article>`;
  }).join("\n")}
</div>`;
}function renderMaterialSchoolPage(record) {
  const required = ["municipality", "prefecture", "schoolName", "schoolType", "slug", "canonical", "documents"];
  const missing = required.filter((key) => record[key] === undefined || record[key] === null);
  if (missing.length) throw new Error(`${record.slug || "material school record"} is missing: ${missing.join(", ")}`);

  const chrome = commonChrome();
  const title = `${record.schoolName} PTA関連資料 | PTA適正化推進委員会`;
  const description = record.description || `${record.schoolName}のPTA関連一次資料を年度・資料種別ごとに整理した学校別アーカイブです。`;
  const ogImage = record.ogImage || "/assets/og-image-popc-en.png";
  const docs = Array.isArray(record.documents) ? record.documents : [];
  const years = [...new Set(docs.map((doc) => doc.year).filter(Boolean))];

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="PTA適正化推進委員会">
  <meta property="og:title" content="${escapeHtml(`${record.schoolName} PTA関連資料`)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(record.canonical)}">
  <meta property="og:image" content="${escapeHtml(absoluteUrl(ogImage))}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${escapeHtml(record.canonical)}">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
  <link rel="stylesheet" href="/css/site.css?v=20260814-3">
  <link rel="stylesheet" href="/css/global-nav.css?v=20260906-2">
  <link rel="stylesheet" href="/css/global-footer.css?v=20260906-2">
  <link rel="stylesheet" href="/css/archive.css?v=20260814-1">
  <link rel="stylesheet" href="/css/interactions.css?v=20260719">
${gaTag()}
</head>
<body class="archive-school-document">
<a class="skip-link" href="#main-content">本文へ移動</a>
${chrome.header}
${chrome.mobile}<nav class="breadcrumb" aria-label="現在地"><div class="wrap"><a href="/">トップ</a><span>›</span><a href="/national-archive.html">全国資料館</a><span>›</span><span aria-current="page">${escapeHtml(record.schoolName)}</span></div></nav>
<main class="archive-school-page" id="main-content">
  <header class="archive-hero">
    <div class="archive-kicker">${escapeHtml(record.municipality)}・${escapeHtml(record.schoolType)}｜学校別一次資料</div>
    <h1>${escapeHtml(record.schoolName)} PTA関連資料</h1>
    <p>${escapeHtml(record.summary || "学校別に確認できるPTA関連資料を、そのまま探せる形で整理しています。")}</p>
  </header>

  <section class="archive-section">
    <h2>このページについて</h2>
    <div class="archive-grid">
      <div class="archive-box"><div class="archive-label">自治体</div><div class="archive-value">${escapeHtml(record.municipality)}</div></div>
      <div class="archive-box"><div class="archive-label">学校区分</div><div class="archive-value">${escapeHtml(record.schoolType)}</div></div>
      <div class="archive-box"><div class="archive-label">確認年度</div><div class="archive-value">${escapeHtml(years.join("・") || "未整理")}</div></div>
      <div class="archive-box"><div class="archive-label">資料件数</div><div class="archive-value">${docs.length}件</div></div>
    </div>
    <p>ここでは資料の所在と内容種別だけを整理します。</p>
  </section>

  <section class="archive-section">
    <h2>資料一覧</h2>
    ${renderDocuments(record)}
  </section>

  <section class="archive-section">
    <h2>出典・整理元</h2>
    <p>${escapeHtml(record.sourceSummary || "公開情報・開示資料・保存資料を学校別に整理しています。")}</p>
    <p class="archive-muted">PDF・画像は、個人情報、印影、口座情報、QRコード等の公開可否を確認したものから順次掲載します。</p>
  </section>
</main>
${chrome.footer}
<script src="/data/site-search-index.js?v=20260809-2"></script>
<script src="/js/site.js?v=97"></script>
</body>
</html>`;
}

module.exports = { renderMaterialSchoolPage };
