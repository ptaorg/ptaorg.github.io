const fs = require("fs");
const path = require("path");
const {
  ROOT,
  STATUS_ORDER,
  displayStatus,
  escapeHtml,
  listSchoolData,
  publicPathExists,
  sortSchools,
  statusClassFor,
  writeFileIfChanged
} = require("./archive-utils");

const START = "<!-- ATSUGI_ARCHIVE_START -->";
const END = "<!-- ATSUGI_ARCHIVE_END -->";

function countByStatus(records) {
  const counts = Object.fromEntries(STATUS_ORDER.map((status) => [status, 0]));
  for (const record of records) {
    const key = displayStatus(record.status);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function renderCountCards(records) {
  const counts = countByStatus(records);
  return STATUS_ORDER.map((status) => {
    const cls = statusClassFor(status);
    return `          <div class="archive-count-card ${cls}">
            <span class="archive-count-label">${escapeHtml(status)}</span>
            <strong>${counts[status] || 0}校</strong>
          </div>`;
  }).join("\n");
}

function renderLegend() {
  const items = [
    ["重大リスク", "任意加入、入会意思確認、会費徴収、個人情報、学校関与等について重大な疑義がある状態。"],
    ["問題あり", "掲載資料上、運用上の問題または見直しを要する点が確認される状態。"],
    ["要確認", "一部資料は確認できるが、入会意思確認、会費徴収、学校関与等について追加確認を要する状態。"],
    ["資料不足", "判断に必要な資料が不足しており、追加資料の取得後に評価が変わる可能性がある状態。"],
    ["適正化モデル", "任意加入、会費徴収、個人情報、非会員対応等について改善例として参照できる状態。"],
    ["未評価", "学校別の個別評価は未実施の状態。資料の有無と確認すべき項目を先に示しています。"]
  ];
  return items.map(([status, description]) => `          <span class="eval-badge ${statusClassFor(status)}">${escapeHtml(status)}</span>
          <span>${escapeHtml(description)}</span>`).join("\n");
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

function localPdfPaths(record) {
  const pdfs = [];
  const pdf = record.materials?.pdf;
  if (pdf?.src && !isHttpUrl(pdf.src) && publicPathExists(pdf.src)) {
    pdfs.push(pdf.src);
  }
  pdfs.push(...sourcePdfPublicPaths(record));
  return [...new Set(pdfs)];
}

function sourceImages(record) {
  return asArray(record.materials?.sourceImages)
    .filter((image) => image?.src && publicPathExists(image.src));
}

function sourceLinks(record) {
  const links = [];
  for (const item of asArray(record.sourceLinks)) {
    if (item?.url && isHttpUrl(item.url)) links.push(item);
  }
  for (const item of asArray(record.materials?.sourceLinks)) {
    if (item?.url && isHttpUrl(item.url)) links.push(item);
  }
  if (record.officialUrl && isHttpUrl(record.officialUrl)) {
    links.push({ label: "一次資料URL", url: record.officialUrl });
  }
  return links;
}

function renderSourceChip({ href, label, present }) {
  const cls = present ? "archive-source-chip is-present" : "archive-source-chip is-missing";
  return href
    ? `<a class="${cls}" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`
    : `<span class="${cls}">${escapeHtml(label)}</span>`;
}

function renderEvidence(record) {
  const images = sourceImages(record);
  const pdfs = localPdfPaths(record);
  const links = sourceLinks(record);
  const chips = [
    images.length
      ? renderSourceChip({ href: images[0].src, label: `資料画像あり（${images.length}枚）`, present: true })
      : renderSourceChip({ label: "資料画像未掲載", present: false }),
    pdfs.length
      ? renderSourceChip({ href: pdfs[0], label: `元PDFあり（${pdfs.length}件）`, present: true })
      : renderSourceChip({ label: "元PDF未掲載", present: false }),
    links.length
      ? renderSourceChip({ href: links[0].url, label: `一次資料URLあり（${links.length}件）`, present: true })
      : renderSourceChip({ label: "一次資料URL未確認", present: false })
  ];
  return `<div class="archive-source-status">${chips.join("")}</div>`;
}

function evidenceCounts(records) {
  return {
    images: records.filter((record) => sourceImages(record).length > 0).length,
    pdfs: records.filter((record) => localPdfPaths(record).length > 0).length,
    sourceLinks: records.filter((record) => sourceLinks(record).length > 0).length
  };
}

function renderSchoolCards(records, schoolType) {
  return records
    .filter((record) => record.schoolType === schoolType)
    .sort(sortSchools)
    .map((record) => {
      const pagePath = path.join(ROOT, record.basePath.replace(/^\/+/, ""), "index.html");
      const name = escapeHtml(record.schoolName);
      const nameHtml = fs.existsSync(pagePath)
        ? `<a href="${escapeHtml(record.basePath)}">${name}</a>`
        : `<span>${name}</span>`;
      const status = displayStatus(record.status);
      const documentName = record.materials?.documentName || "未確認";
      return `              <article class="archive-school-card">
                <div class="archive-school-card-main">
                  <div>
                    <h4>${nameHtml}</h4>
                    <p>${escapeHtml(record.schoolType)} ／ 確認資料：${escapeHtml(documentName)}</p>
                  </div>
                  <span class="eval-badge ${statusClassFor(status, record.statusClass)}">${escapeHtml(status)}</span>
                </div>
                <div class="archive-evidence-links" aria-label="${name}の根拠資料の有無">
                  ${renderEvidence(record)}
                </div>
              </article>`;
    })
    .join("\n");
}

function renderAtsugiSection(records) {
  const atsugiRecords = records.filter((record) => record.citySlug === "atsugi").sort(sortSchools);
  if (!atsugiRecords.length) throw new Error("No Atsugi school JSON files found");
  const counts = evidenceCounts(atsugiRecords);
  return `
    <!-- 厚木市 学校一覧 -->
    <section class="atsugi-schools-section" id="atsugi-schools">
      <div class="wrap">
        <div class="section-center atsugi-schools-head">
          <div class="section-kicker">Atsugi City</div>
          <h2 class="section-title">神奈川県厚木市</h2>
          <p class="section-lead">厚木市内の小学校・中学校について、PTA入会案内、PTA入会申込書、学校納入金・会費徴収資料等を学校別に整理しています。評価だけでなく、学校別ページ、資料画像、元PDF、一次資料URLの有無をあわせて確認してください。</p>
        </div>
        <div class="archive-source-overview" aria-label="厚木市資料根拠の掲載状況">
          <div><strong>${atsugiRecords.length}校</strong><span>学校別ページ</span></div>
          <div><strong>${counts.images}校</strong><span>資料画像あり</span></div>
          <div><strong>${counts.pdfs}校</strong><span>元PDFあり</span></div>
          <div><strong>${counts.sourceLinks}校</strong><span>一次資料URLあり</span></div>
        </div>
        <div class="archive-evaluation-summary" aria-label="厚木市の評価別集計">
${renderCountCards(atsugiRecords)}
        </div>
        <div class="archive-legend" aria-label="評価バッジの説明">
${renderLegend()}
        </div>
        <details class="atsugi-school-details">
          <summary>
            <span>厚木市36校の学校別根拠資料</span>
            <small>学校名・評価・資料画像・元PDF・一次資料URLを確認</small>
          </summary>
          <div class="atsugi-school-details-body">
            <div class="atsugi-school-groups" aria-label="厚木市内学校一覧">
              <div class="atsugi-school-group">
                <h3>小学校</h3>
                <div class="archive-school-card-list">
${renderSchoolCards(atsugiRecords, "小学校")}
                </div>
              </div>
              <div class="atsugi-school-group">
                <h3>中学校</h3>
                <div class="archive-school-card-list">
${renderSchoolCards(atsugiRecords, "中学校")}
                </div>
              </div>
            </div>
            <p class="atsugi-schools-note">補足：この一覧は、厚木市内の学校を母集団として整理するための基礎一覧です。未評価の学校は、個別評価を行わず、資料画像・元PDF・一次資料URLの有無を先に示しています。</p>
          </div>
        </details>
      </div>
    </section>
`;
}

function main() {
  const filePath = path.join(ROOT, "national-archive.html");
  const html = fs.readFileSync(filePath, "utf8");
  if (!html.includes(START) || !html.includes(END)) {
    throw new Error("ATSUGI archive markers are missing. Add ATSUGI_ARCHIVE_START and ATSUGI_ARCHIVE_END before running.");
  }
  const records = listSchoolData();
  const replacement = `${START}${renderAtsugiSection(records)}    ${END}`;
  const next = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), replacement);
  const changed = writeFileIfChanged(filePath, next);
  console.log(`Updated national-archive.html (${changed ? "changed" : "unchanged"}).`);
}

if (require.main === module) {
  main();
}
