const fs = require("fs");
const path = require("path");
const {
  ROOT,
  absoluteUrl,
  displayPdfStatus,
  displayStatus,
  escapeHtml,
  gaTag,
  listSchoolData,
  publicPathExists,
  sortSchools,
  statusClassFor,
  validateSchoolRecord,
  visibleTextItems,
  writeFileIfChanged
} = require("./archive-utils");

function renderList(items, fallback) {
  const values = visibleTextItems(items);
  if (!values.length) return `<p class="archive-muted">${escapeHtml(fallback)}</p>`;
  return `<ul>
${values.map((item) => `        <li>${escapeHtml(item)}</li>`).join("\n")}
      </ul>`;
}

function renderParagraphs(items, fallback) {
  const values = visibleTextItems(items);
  if (!values.length) return `<p class="archive-muted">${escapeHtml(fallback)}</p>`;
  return values.map((item) => `      <p>${escapeHtml(item)}</p>`).join("\n");
}

function renderTags(items) {
  const values = Array.isArray(items)
    ? [...new Set(items.filter(Boolean).map(displayStatus))]
    : [];
  if (!values.length) return `<p><span class="archive-tag">未評価</span></p>`;
  return `<p>${values.map((item) => `<span class="archive-tag">${escapeHtml(item)}</span>`).join("\n")}</p>`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isHttpUrl(value) {
  return /^https?:\/\//.test(String(value || ""));
}

function sourcePdfPublicPaths(record) {
  const dir = path.join(ROOT, "source-pdfs", record.citySlug, record.slug);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((fileName) => fileName.toLowerCase().endsWith(".pdf"))
    .sort((a, b) => a.localeCompare(b, "ja"))
    .map((fileName) => `/source-pdfs/${record.citySlug}/${record.slug}/${fileName}`);
}

function sourceImages(record) {
  return asArray(record.materials.sourceImages)
    .filter((image) => image && image.src && publicPathExists(image.src));
}

function sourceLinks(record) {
  const links = [];
  for (const item of asArray(record.sourceLinks)) {
    if (item && item.url && isHttpUrl(item.url)) links.push(item);
  }
  for (const item of asArray(record.materials.sourceLinks)) {
    if (item && item.url && isHttpUrl(item.url)) links.push(item);
  }
  if (record.officialUrl && isHttpUrl(record.officialUrl)) {
    links.push({ label: "一次資料URL", url: record.officialUrl });
  }
  return links;
}

function pdfLinks(record) {
  const links = [];
  const seen = new Set();
  const add = (href, label) => {
    if (!href || seen.has(href)) return;
    const external = isHttpUrl(href);
    if (!external && !publicPathExists(href)) return;
    seen.add(href);
    links.push({ href, label });
  };
  const pdf = record.materials.pdf;
  if (pdf && pdf.src) add(pdf.src, pdf.label || "資料PDF");
  const existingPdf = record.materials.existingPdf;
  if (existingPdf && existingPdf.href) add(existingPdf.href, existingPdf.label || "既存の評価書PDF");
  for (const publicPath of sourcePdfPublicPaths(record)) {
    add(publicPath, path.basename(publicPath));
  }
  return links;
}

function meaningfulDocuments(record) {
  const values = asArray(record.materials.confirmedDocuments)
    .concat(record.materials.documentName ? [record.materials.documentName] : [])
    .map((item) => String(item || "").trim())
    .filter((item) => item && item !== "未確認");
  return [...new Set(values)];
}

function renderSupportStrip() {
  return `<div class="support-strip" role="complementary" aria-label="活動支援のお願い">
  <div class="support-strip-inner">
    <span class="support-strip-label">応援のお願い</span>
    <span class="support-strip-text">資料取得、資料整理、Web公開を続けるため、寄付・カンパでのご支援をお願いします。</span>
    <a class="support-strip-link" href="/support.html">応援ページへ</a>
  </div>
</div>`;
}

function renderSourceChip({ href, label, present }) {
  const cls = present ? "archive-source-chip is-present" : "archive-source-chip is-missing";
  return href
    ? `<a class="${cls}" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`
    : `<span class="${cls}">${escapeHtml(label)}</span>`;
}

function renderSourceEvidence(record) {
  const images = sourceImages(record);
  const pdfs = pdfLinks(record);
  const links = sourceLinks(record);
  const documents = meaningfulDocuments(record);
  const chips = [
    images.length
      ? renderSourceChip({ href: images[0].src, label: `資料画像あり（${images.length}枚）`, present: true })
      : renderSourceChip({ label: "資料画像未掲載", present: false }),
    pdfs.length
      ? renderSourceChip({ href: pdfs[0].href, label: `元PDFあり（${pdfs.length}件）`, present: true })
      : renderSourceChip({ label: "元PDF未掲載", present: false }),
    links.length
      ? renderSourceChip({ href: links[0].url, label: `一次資料URLあり（${links.length}件）`, present: true })
      : renderSourceChip({ label: "一次資料URL未確認", present: false })
  ];
  const listItems = [
    documents.length
      ? `<li><strong>確認資料</strong><span>${documents.map(escapeHtml).join("、")}</span></li>`
      : `<li><strong>確認資料</strong><span>未確認</span></li>`,
    `<li><strong>資料画像</strong><span>${images.length ? `${images.length}枚を掲載` : "未掲載"}</span></li>`,
    `<li><strong>元PDF</strong><span>${pdfs.length ? pdfs.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join("、") : "未掲載"}</span></li>`,
    `<li><strong>一次資料URL</strong><span>${links.length ? links.map((link) => `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label || "一次資料URL")}</a>`).join("、") : "未確認"}</span></li>`
  ];
  return `<div class="archive-source-status">${chips.join("")}</div>
      <ul class="archive-source-list">
        ${listItems.join("\n        ")}
      </ul>`;
}

function renderImages(record) {
  const images = sourceImages(record);
  if (!images.length) return `      <p class="archive-muted">資料画像は未掲載です。資料画像を掲載する場合は、個人情報・印影・口座情報・QRコード等を確認し、必要な伏せ処理を行います。</p>`;
  return images.map((image, index) => `      <figure class="archive-figure">
        <a class="archive-figure-link" href="${escapeHtml(image.src)}">
          <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || `${record.schoolName} 資料画像${index + 1}`)}" loading="lazy" decoding="async">
        </a>
        <figcaption>${escapeHtml(image.caption || `資料画像${index + 1}`)}</figcaption>
      </figure>`).join("\n");
}

function renderPdfLinks(record) {
  const links = pdfLinks(record).map((link) => {
    const label = /を開く$/.test(link.label) ? link.label : `${link.label}を開く`;
    return `<p class="archive-existing-pdf"><a class="archive-download" href="${escapeHtml(link.href)}">${escapeHtml(label)}</a></p>`;
  });
  return links.length ? `\n\n      ${links.join("\n      ")}` : "";
}

function renderReviewScope(record) {
  const reviewStatus = record.humanReviewRequired ? "追加確認が必要" : "確認済み";
  const lastReviewed = record.lastReviewed || "未記録";
  const checkItems = [
    ["入会意思確認", record.materials.applicationFormStatus || record.materials.hasApplicationForm || "未確認"],
    ["入会案内", record.materials.hasMembershipNotice || "未確認"],
    ["学校徴収金・会費徴収", record.materials.hasSchoolCollectionNotice || "未確認"],
    ["学校関与・個人情報", "確認できる事実と資料上確認できない点を分けて整理"]
  ];
  return `<div class="archive-evidence-grid">
        <div class="archive-evidence-card"><div class="archive-label">確認対象</div><div class="archive-value">${escapeHtml(record.prefecture)}${escapeHtml(record.municipality)} ${escapeHtml(record.schoolName)}</div></div>
        <div class="archive-evidence-card"><div class="archive-label">最終確認日</div><div class="archive-value">${escapeHtml(lastReviewed)}</div></div>
        <div class="archive-evidence-card"><div class="archive-label">人による確認</div><div class="archive-value">${escapeHtml(reviewStatus)}</div></div>
      </div>
      <ol class="archive-check-list">
${checkItems.map(([label, value]) => `        <li><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></li>`).join("\n")}
      </ol>`;
}

function renderAssessmentPremise(record) {
  const pendingNote = displayStatus(record.status) === "未評価"
    ? "学校別の個別評価は未実施です。現時点では、掲載資料の有無と確認すべき項目だけを示します。"
    : "評価状況は、掲載資料から確認できる運用上の疑義の強さを示すものです。特定の学校・PTAについて法令違反を断定するものではありません。";
  return `<p>${escapeHtml(pendingNote)}</p>
      <p>表示内容は、資料に書かれている事実、資料だけでは確認できない点、当委員会の評価を分けています。未掲載資料、口頭説明、後日是正済みの運用までは反映できていない場合があります。</p>`;
}

function renderSummary(record) {
  const summary = record.summary || "PTA関連資料の確認状況を整理しています。";
  if (!sourceImages(record).length && !pdfLinks(record).length && !meaningfulDocuments(record).length) {
    return "掲載資料は未確認です。資料の有無と次に確認すべき項目を整理しており、個別評価はまだ行っていません。";
  }
  return summary.replace(/^このページでは、/, "").replace(
    "画像とPDFは、個人情報・印影・口座情報・QRコード等の確認が完了するまで掲載しません。",
    "資料画像とPDFは、個人情報・印影・口座情報・QRコード等の確認が完了したものだけを掲載します。"
  );
}

function renderSchoolPage(record) {
  validateSchoolRecord(record);
  const statusClass = statusClassFor(record.status, record.statusClass);
  const ogImage = record.ogImage && publicPathExists(record.ogImage) ? record.ogImage : "/assets/ogp/atsugi/default.png";
  const title = `${record.schoolName} PTA関連資料・評価 | PTA適正化推進委員会`;
  const fallbackDescription = `${record.schoolName}のPTA関連資料について、確認できる事実、資料上確認できない点、当委員会の評価を整理したページです。`;
  const description = record.ogDescription || record.description || renderSummary(record) || fallbackDescription;
  const ogDescription = record.ogDescription || description;
  const documentName = meaningfulDocuments(record).join("、") || "確認資料なし";
  const applicationStatus = record.materials.applicationFormStatus || record.materials.hasApplicationForm || "未確認";
  const pdfCount = pdfLinks(record).length;
  const pdfStatus = displayPdfStatus(record.materials.pdfStatus, pdfCount);
  const statusLabel = displayStatus(record.status);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="PTA適正化推進委員会">
  <meta property="og:title" content="${escapeHtml(`${record.schoolName} PTA関連資料・評価`)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:url" content="${escapeHtml(record.canonical)}">
  <meta property="og:image" content="${escapeHtml(absoluteUrl(ogImage))}">
  <meta property="og:image:secure_url" content="${escapeHtml(absoluteUrl(ogImage))}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(`${record.schoolName} PTA関連資料・評価`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(`${record.schoolName} PTA関連資料・評価`)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  <meta name="twitter:image" content="${escapeHtml(absoluteUrl(ogImage))}">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
  <link rel="canonical" href="${escapeHtml(record.canonical)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css?v=20260719">
  <link rel="stylesheet" href="/css/archive.css">

${gaTag()}
  <link rel="stylesheet" href="/css/interactions.css?v=20260719">
</head>
<body>
${renderSupportStrip()}
  <main class="archive-school-page">
    <p><a class="archive-back" href="/national-archive.html">全国資料館へ戻る</a></p>

    <section class="archive-hero">
      <div class="archive-kicker">ATSUGI ${escapeHtml(record.schoolType)}</div>
      <h1>${escapeHtml(record.schoolName)} PTA関連資料・評価</h1>
      <p class="archive-school-author">作成主体：PTA適正化推進委員会</p>
      <div class="archive-print-actions archive-print-top">
        <button class="archive-print-button" type="button" onclick="window.print()">このページをPDF保存</button>
      </div>
      <p>${escapeHtml(renderSummary(record))}</p>
    </section>

    <section class="archive-section">
      <h2>資料確認状況</h2>
      <div class="archive-grid">
        <div class="archive-box"><div class="archive-label">自治体</div><div class="archive-value">${escapeHtml(record.municipality)}</div></div>
        <div class="archive-box"><div class="archive-label">学校区分</div><div class="archive-value">${escapeHtml(record.schoolType)}</div></div>
        <div class="archive-box archive-status-card ${escapeHtml(statusClass)}"><div class="archive-label">評価状況</div><div class="archive-value">${escapeHtml(statusLabel)}</div></div>
        <div class="archive-box"><div class="archive-label">確認資料</div><div class="archive-value">${escapeHtml(documentName)}</div></div>
        <div class="archive-box"><div class="archive-label">入会申込書</div><div class="archive-value">${escapeHtml(applicationStatus)}</div></div>
        <div class="archive-box"><div class="archive-label">PDF</div><div class="archive-value">${escapeHtml(pdfStatus)}</div></div>
      </div>
    </section>

    <section class="archive-section">
      <h2>確認対象と根拠資料</h2>
      <p class="archive-section-lead">掲載資料と学校別データに記録した確認事項に基づき、PTA入会意思確認、会費徴収、個人情報、学校関与の観点から整理しています。</p>
      ${renderSourceEvidence(record)}
    </section>

    <section class="archive-section">
      <h2>確認範囲</h2>
      ${renderReviewScope(record)}
    </section>

    <section class="archive-section">
      <h2>評価の前提</h2>
      <div class="archive-assessment-note">
        ${renderAssessmentPremise(record)}
      </div>
    </section>

    <section class="archive-section">
      <h2>資料画像</h2>
${renderImages(record)}
    </section>

    <section class="archive-section">
      <h2>確認できる事実</h2>
      ${renderList(record.confirmedFacts, "現時点で掲載資料から断定できる個別事実はありません。")}
    </section>

    <section class="archive-section">
      <h2>資料上確認できない点</h2>
      ${renderList(record.unconfirmedPoints, "入会案内、入会申込書、会費徴収、個人情報、学校関与の資料が必要です。")}
    </section>

    <section class="archive-section">
      <h2>疑義フラグ</h2>
      ${renderTags(record.riskFlags)}
    </section>

    <section class="archive-section">
      <h2>当委員会の評価</h2>
${renderParagraphs(record.evaluation, "個別評価は未実施です。掲載資料が確認できる場合は、資料名と確認事実を分けて評価します。")}
    </section>

    <section class="archive-section archive-print-save-section">
      <h2>このページをPDF保存</h2>
      <p class="archive-print-note">このボタンを押すと、資料画像・確認できる事実・疑義フラグ・当委員会評価を含めた学校別ページ全体をPDFとして保存できます。ブラウザの印刷画面で「PDFに保存」を選択してください。</p>
      <button class="archive-print-button" type="button" onclick="window.print()">このページをPDF保存</button>${renderPdfLinks(record)}
    </section>
  </main>
</body>
</html>`;
}

function main() {
  const records = listSchoolData().sort(sortSchools);
  if (!records.length) throw new Error("No school JSON files found under data/schools");
  let changed = 0;
  for (const record of records) {
    const outputDir = path.join(ROOT, "archive", record.citySlug, record.slug);
    const outputFile = path.join(outputDir, "index.html");
    const html = renderSchoolPage(record);
    if (writeFileIfChanged(outputFile, html)) changed += 1;
  }
  console.log(`Generated ${records.length} school pages (${changed} changed).`);
}

if (require.main === module) {
  main();
}

module.exports = { renderSchoolPage };
