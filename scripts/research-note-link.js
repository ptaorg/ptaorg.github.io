const fs = require("fs");
const path = require("path");
const { ROOT, escapeHtml } = require("./archive-utils");

// Municipality identity is exact: prefectural and municipal school authorities
// must never be conflated because they happen to share a map location.
function renderResearchNoteLink(record) {
  const file = path.join(ROOT, "data/research-municipalities.json");
  if (!fs.existsSync(file)) return "";
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const municipalities = Array.isArray(data) ? data : data.municipalities;
  if (!Array.isArray(municipalities)) throw new Error("Research municipalities must be an array");
  const matches = municipalities.filter((item) => item.prefecture === record.prefecture
    && (item.schoolMunicipality || item.name || item.municipality) === record.municipality);
  if (matches.length > 1) throw new Error(`Ambiguous research municipality: ${record.prefecture}${record.municipality}`);
  const item = matches[0];
  if (!item) return "";
  const url = item.url || item.researchUrl || `/research/${item.id}.html`;
  if (!/^\/research\/[a-z0-9-]+\.html$/.test(url)) throw new Error(`Invalid research note URL: ${url}`);
  return `<p class="archive-research-note"><a href="${escapeHtml(url)}">${escapeHtml(record.municipality)}の自治体別研究ノート</a> — 制度・行政対応・学校横断の論点を確認する</p>`;
}

module.exports = { renderResearchNoteLink };
