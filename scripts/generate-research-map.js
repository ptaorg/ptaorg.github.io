const fs = require("fs");
const path = require("path");
const {
  ROOT,
  listSchoolData,
  escapeHtml: e,
  writeFileIfChanged: write,
} = require("./archive-utils");
const load = () =>
  JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "data/research-municipalities.json"),
      "utf8",
    ),
  );
const catalogCoordinates = {
  atsugi: [35.4431, 139.3622],
  daito: [34.7139, 135.6231],
  hikone: [35.2744, 136.2597],
  hiroshima: [34.3853, 132.4553],
  imizu: [36.7299, 137.052],
  iwaki: [37.0504, 140.8877],
  kameoka: [35.0356, 135.5739],
  kawaguchi: [35.8079, 139.7238],
  koka: [34.9656, 136.1692],
  kuki: [36.0621, 139.6672],
  ota: [35.5614, 139.7161],
  sagamihara: [35.5714, 139.3736],
  toyohashi: [34.7692, 137.3914],
};
const themes = [
  "PTA任意加入",
  "入会申込書・加入意思確認",
  "PTA会費の学校徴収",
  "学校保有個人情報の利用・提供",
  "委任契約による公務化",
  "学校管理規則・要綱による校務化",
  "教職員のPTA事務従事",
  "職務専念義務免除・兼職承認",
  "地方自治法235条の4",
  "住民監査請求",
  "情報公開・審査請求",
  "PTA自己徴収化",
  "制度是正・改善事例",
];
function buildIndex(data = load(), schools = listSchoolData(), legacy = []) {
  const responses = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data/board-responses.json"), "utf8"),
  ).responses;
  const regions = data.municipalities.map((m) => ({
    ...m,
    schools: [],
    boardResponses: responses
      .filter((r) => r.prefecture === m.prefecture && r.municipality === m.name)
      .map((r) => ({
        title: r.municipality + " 教育委員会回答",
        url: r.url,
        date: r.date || "日付未登録",
      })),
  }));
  for (const s of schools) {
    let m = regions.find(
      (m) =>
        m.prefecture === s.prefecture &&
        (m.schoolMunicipality || m.name) === s.municipality,
    );
    if (!m) {
      m = {
        id: "archive-" + s.citySlug,
        schoolMunicipality: s.municipality,
        prefecture: s.prefecture,
        name: s.citySlug === "sagamihara" ? "相模原市" : s.municipality.replace(s.prefecture, ""),
        url: null,
        themes: [],
        status: "source-catalog",
        coordinates: catalogCoordinates[s.citySlug] || null,
        coordinateNote:
          "既存全国資料館の自治体概略座標を継承。学校位置ではありません。座標未登録の自治体も一覧に収録。",
        flags: {},
        schools: [],
      };
      regions.push(m);
    }
    m.schools.push({
      prefecture: s.prefecture,
      municipality: s.municipality,
      name: s.schoolName,
      type: s.schoolType,
      url: s.basePath,
      documents:
        s.pageMode === "materials"
          ? (s.documents || []).map((d) => ({
              title: d.title,
              status: d.publicationStatus,
            }))
          : [
              {
                title: s.materials?.documentName || "学校別資料",
                status: "既存学校ページで確認",
              },
            ],
    });
  }
  for (const m of legacy) {
    if (!regions.some(r => r.prefecture === m.prefecture && r.name === m.name)) regions.push(m);
  }
  const codes = {"宮城県":"04","福島県":"07","埼玉県":"11","東京都":"13","神奈川県":"14","富山県":"16","静岡県":"22","愛知県":"23","滋賀県":"25","京都府":"26","大阪府":"27","兵庫県":"28","広島県":"34","愛媛県":"38","鹿児島県":"46"};
  for (const m of regions) {
    m.prefectureCode ||= codes[m.prefecture] || null;
    m.type ||= m.name === m.prefecture ? "都道府県" : m.name.endsWith("区") ? "特別区" : m.name.endsWith("町") ? "町" : "市";
    m.updated ||= data.updated;
    m.boardResponses = responses.filter(r => r.prefecture === m.prefecture && r.municipality === m.name).map(r => ({title:r.municipality + " 教育委員会回答",url:r.url,date:r.date || "日付未登録"}));
  }
  return {
    version: 1,
    updated: data.updated,
    themes: [...new Set([...themes, ...regions.flatMap((m) => m.themes)])],
    municipalities: regions,
  };
}
function chrome() {
  let h = fs.readFileSync(path.join(ROOT, "national-archive.html"), "utf8");
  return {
    header: h.match(/<header class="site-header">[\s\S]*?<\/header>/)[0],
    mobile: h
      .slice(h.indexOf('<div class="mobile-overlay"'), h.indexOf("<main"))
      .trim(),
    footer: h.match(/<footer class="footer">[\s\S]*?<\/footer>/)[0],
  };
}
function page(title, url, body, map = false) {
  const c = chrome();
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)} | PTA適正化推進委員会</title><meta name="description" content="${e(title)}。確認事実・資料の所在・行政説明・法的分析・未解明事項を区別して読む全国PTA研究アーカイブ。"><link rel="canonical" href="https://ptaorg.com${url}"><link rel="stylesheet" href="/css/site.css?v=20260814-3"><link rel="stylesheet" href="/css/global-nav.css?v=20260906-2"><link rel="stylesheet" href="/css/editorial.css?v=20260719"><link rel="stylesheet" href="/css/pages/research-map.css?v=1">${map ? '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">' : ""}</head><body data-reviewed="${e(load().updated)}">${c.header}${c.mobile}<main id="main-content" class="research-main wrap"><p class="research-breadcrumb"><a href="/research-index.html">根拠資料・調査方法</a> / <a href="/research-map.html">全国PTA研究マップ</a></p><h1>${e(title)}</h1>${body}</main>${c.footer}${map ? '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script src="/js/research-map.js?v=1" defer></script>' : ""}<script src="/data/site-search-index.js?v=20260809-2"></script><script src="/js/site.js?v=97"></script></body></html>\n`;
}
const paras = (a) => (a || []).map((t) => `<p>${e(t)}</p>`).join("\n");
const links = (a) =>
  `<ul>${a.map((x) => `<li><a href="${e(x.url)}">${e(x.title || x.name)}</a></li>`).join("")}</ul>`;
function schoolList(m) {
  return m.schools.length
    ? `<ul>${m.schools.map((s) => `<li data-school-url="${e(s.url)}" data-school-type="${e(s.type)}"><a href="${e(s.url)}">${e(s.name)}</a>（${e(s.type)}）</li>`).join("")}</ul>`
    : "<p>既存mainの学校別アーカイブに、この設置主体に一致する登録はありません。資料不存在を意味しません。</p>";
}
function renderRegion(m, index) {
  return page(
    m.name + " PTA制度・運用研究ノート",
    m.url,
    `<p>${e(m.prefecture)} ／ ${e(m.type)} ／ 更新 ${e(m.updated)}</p><p>研究テーマ：${m.themes.map(e).join("、")}</p><p class="research-notice">資料目録と法的評価を分離しています。以下の検証状況は資料ごとに表示し、既存記事での確認と原本の独立再検証を区別します。</p><section><h2>研究要約</h2>${paras(m.summary)}</section><section><h2>制度・運用の概要</h2>${paras(m.system)}</section><section><h2>調査・行政対応の時系列</h2><ol>${m.timeline.map((t) => `<li><strong>${e(t.date)} ${e(t.title)}</strong><p>${e(t.text)}</p>${t.sourceId ? `<a href="#source-${e(t.sourceId)}">根拠資料</a>` : ""}</li>`).join("")}</ol></section><section><h2>一次資料・確認状況</h2>${m.sources.map((s) => `<article id="source-${e(s.id)}"><h3><a href="${e(s.url)}">${e(s.title)}</a></h3><p>${e(s.publisher)} ／ ${e(s.date || "日付未確認")} ／ ${e(s.kind)}</p><p>確認状況：${e(s.verification)}</p></article>`).join("")}</section><section><h2>当委員会の法的分析</h2>${m.legal.map((s) => `<h3>${e(s.title)}</h3><p>${e(s.text)}</p>`).join("")}</section><section id="schools"><h2>関連学校別一次資料アーカイブ（${m.schools.length}校）</h2><p>各校の資料・評価・公開状態は既存ページで確認してください。学校本文や未公開原本を複製しません。</p>${schoolList(m)}</section><section><h2>研究ノート・行政回答への導線</h2>${links([...m.articles, ...(m.boardResponses || [])])}</section><section><h2>未解明事項</h2><ul>${m.unknowns.map((t) => `<li>${e(t)}</li>`).join("")}</ul></section><section><h2>関連自治体比較・全国横断研究</h2>${links(
      (m.comparisons || [])
        .map((id) => index.municipalities.find((x) => x.id === id))
        .filter(Boolean)
        .map((x) => ({ url: x.url, title: x.name })),
    )}<ul>${m.themes.map((t) => `<li><a href="/research-map.html?theme=${encodeURIComponent(t)}">${e(t)}で比較する</a></li>`).join("")}</ul><p><a href="/pta-school-processing.html">学校によるPTA事務処理の横断研究</a> ／ <a href="/board-responses.html">教育委員会回答</a> ／ <a href="/journal.html">論考一覧</a></p></section>`,
  );
}
function renderMap(index) {
  const opts = (id, label, values) =>
    `<label>${label}<select id="${id}"><option value="">すべて</option>${values.map((v) => `<option>${e(v)}</option>`).join("")}</select></label>`;
  return page(
    "全国PTA制度・運用研究マップ",
    "/research-map.html",
    `<p class="research-intro">どの自治体で、何が行われ、どの資料で確認でき、行政がどう説明しているのか。自治体研究から既存の学校別資料、行政回答、全国横断研究へ進む入口です。</p><p class="research-notice">ピンは研究・資料の所在を示す概略位置です。問題件数・違法性・重大度を示しません。研究テーマは検討対象であり、その制度の採用確認を意味しません。青緑は研究ノートあり、灰青は学校別資料目録のみを示します。都道府県の研究は県立学校等を対象とし、市立学校と統合しません。地図が表示されなくても下の一覧を利用できます。</p><form id="research-filters" role="search"><label>自治体・学校・文書・論点を検索<input id="research-query" type="search" placeholder="川口市、入会申込書、委任…"></label>${opts("research-mode", "表示", ["自治体研究", "学校別資料"])}${opts("research-prefecture", "都道府県", [...new Set(index.municipalities.map((m) => m.prefecture))])}${opts(
      "research-city",
      "自治体",
      index.municipalities.map((m) => m.name),
    )}${opts("research-theme", "研究テーマ", index.themes)}${opts("research-school", "学校種別", [...new Set(index.municipalities.flatMap((m) => m.schools.map((s) => s.type)))])}${opts("research-publication", "資料公開状況", [...new Set(index.municipalities.flatMap((m) => m.schools.flatMap((s) => s.documents.map((d) => d.status))))])}${opts("research-response", "行政回答", ["掲載確認", "未確認"])}${opts("research-audit", "監査・審査請求", ["掲載確認", "未確認"])}${opts("research-improvement", "改善措置", ["掲載確認", "未確認"])}<button type="reset">条件を解除</button></form><p id="research-result-status" role="status">${index.municipalities.length}地域。すべての地域を下に掲載しています。</p><div data-research-map class="research-map" aria-label="全国PTA研究地図"></div><p id="research-map-message">地図は補助機能です。表示できない場合は自治体一覧をご利用ください。</p><section id="research-results"><h2>自治体一覧・学校別資料</h2>${index.municipalities.map((m) => `<article class="research-region" data-region="${e(m.id)}"><h3>${m.url ? `<a href="${e(m.url)}">${e(m.prefecture)} ${e(m.name)}</a>` : e(m.prefecture + " " + m.name)}</h3><p>${m.url ? "自治体研究ノートあり" : m.catalogUrl ? "既存資料館に所在掲載" : "学校別資料目録"} ／ ${m.schools.length}校 ／ ${e(m.updated || index.updated)}</p>${paras(m.summary?.slice(0, 1))}${m.catalogUrl ? `<p><a href="${e(m.catalogUrl)}">既存全国資料館の資料所在一覧へ</a></p>` : ""}<p>${m.themes.map(e).join(" ／ ")}</p><details><summary>学校別一次資料（${m.schools.length}校）</summary>${schoolList(m)}</details></article>`).join("")}</section>`,
    true,
  );
}
function main() {
  const data = load(),
    index = buildIndex(data, listSchoolData(), JSON.parse(fs.readFileSync(path.join(ROOT, 'data/research-catalog-regions.json'), 'utf8')));
  write(
    path.join(ROOT, "data/research-map-index.json"),
    JSON.stringify(index, null, 2),
  );
  write(path.join(ROOT, "research-map.html"), renderMap(index));
  for (const m of index.municipalities.filter((m) => m.url))
    write(path.join(ROOT, m.url.slice(1)), renderRegion(m, index));
  console.log(
    `Research map: ${index.municipalities.length} regions / ${index.municipalities.reduce((n, m) => n + m.schools.length, 0)} schools`,
  );
}
if (require.main === module) main();
module.exports = { buildIndex };
