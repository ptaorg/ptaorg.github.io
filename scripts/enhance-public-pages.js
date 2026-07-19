const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://ptaorg.com";
const REVIEW_DATE = "2026-07-19";
const ROBOTS_VALUE = "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1";
const SKIP_DIRS = new Set([
  ".git",
  ".claude",
  "_site",
  "node_modules",
  "#U30db#U30fc#U30e0",
  "assets",
  "css",
  "data",
  "js",
  "scripts",
  "tools",
  "ホーム"
]);
const SKIP_FILES = new Set([
  "404.html",
  "PTA#U904b#U55b6#U9069#U6b63#U5316#U30ac#U30a4#U30c9#U30d6#U30c3#U30af_#U7b2c4#U7248_#U6539#U8a02#U672c#U6587.html"
]);

const SECTION_BREADCRUMBS = {
  archive: { name: "全国資料館", url: `${SITE_ORIGIN}/national-archive.html` },
  audit: { name: "運営チェック", url: `${SITE_ORIGIN}/audit/` },
  "board-responses": { name: "教育委員会の回答", url: `${SITE_ORIGIN}/board-responses.html` },
  forms: { name: "提出文書・文例", url: `${SITE_ORIGIN}/documents.html` },
  journal: { name: "論考・調査報告", url: `${SITE_ORIGIN}/journal.html` }
};

const MANUAL_DESCRIPTIONS = {
  "administrative-materials.html": "PTA運営の適正化に必要な法令、個人情報保護委員会資料、文部科学省資料、教育委員会通知を、論点と使いどころが分かる形で整理した一次資料案内です。",
  "documents.html": "PTAの非加入、退会、情報提供停止、教育委員会への照会などに使える文例を、提出先と確認事項ごとにまとめています。",
  "edu-board-separation.html": "教育委員会と学校が、PTA内部の自治と学校管理上の責任を混同せず、情報・会費・職員・施設の関与を点検するための解説です。",
  "education-board-responsibility.html": "PTAに関する教育委員会の責任範囲を、学校管理、個人情報、徴収、服務、施設利用の観点から整理します。",
  "framework.html": "PTAの任意加入、個人情報、会費徴収、教職員関与、施設利用を、主体・根拠・記録の順に点検する共通フレームワークです。",
  "guide-board.html": "教育委員会・学校がPTAとの関係を点検し、任意加入、個人情報、会費徴収、職員関与、施設利用を適正化するための実務ガイドです。",
  "guide-pta.html": "PTA役員が、加入申込み、会員名簿、会費、役員選出、個人情報、安全管理を学校から分離して運営するための実務ガイドです。",
  "journal.html": "PTAの任意加入、個人情報、会費徴収、学校関与に関する論考、一次資料検証、制度分析をまとめた調査報告索引です。",
  "PTA運営適正化ガイドブック_第4版_改訂本文.html": "PTA運営の任意加入、会員管理、会費、個人情報、学校・教育委員会との関係を体系的に整理した適正化ガイドブックです。",
  "journal/pta-final-point-ptf.html": "PTA問題を、加入意思、個人情報、会費、学校関与の記録から検証し、適正な運用へ移行するための論考です。",
  "pta-open-system/apps-script/Index.functional.html": "PTAの加入申込み、会員確定、会員名簿を分離して管理するGoogle Apps Script向け管理画面の実装例です。"
};

function walkHtml(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkHtml(path.join(dir, entry.name), files);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      const filePath = path.join(dir, entry.name);
      const rel = relativePath(filePath);
      if (!SKIP_FILES.has(rel)) files.push(filePath);
    }
  }
  return files;
}

function relativePath(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function isPublishable(html) {
  return !/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)
    && !/http-equiv=["']refresh["']/i.test(html);
}

function pageUrl(rel) {
  if (rel === "index.html") return `${SITE_ORIGIN}/`;
  const clean = rel.endsWith("/index.html")
    ? rel.slice(0, -"index.html".length)
    : rel;
  return encodeURI(`${SITE_ORIGIN}/${clean}`);
}

function decodeEntities(value) {
  const entities = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " "
  };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match);
}

function plainText(value) {
  return decodeEntities(String(value || ""))
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extract(html, pattern) {
  const match = html.match(pattern);
  return match ? plainText(match[1]) : "";
}

function titleFor(html) {
  return extract(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i) || "PTA適正化推進委員会";
}

function pageName(html) {
  return extract(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
    || titleFor(html).split(/[|｜]/)[0].trim();
}

function existingDescription(html) {
  const meta = html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
    || html.match(/<meta\s+content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i)
    || html.match(/<meta\s+property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  return meta ? plainText(meta[1]) : "";
}

function firstMeaningfulParagraph(html) {
  const main = html.match(/<(?:main|article)\b[^>]*>([\s\S]*?)<\/(?:main|article)>/i)?.[1] || html;
  const visible = main
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ");
  for (const match of visible.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = plainText(match[1]);
    if (text.length >= 45 && !/^(トップ|ホーム|応援のお願い|最終更新)/.test(text)) return text;
  }
  return "";
}

function descriptionFor(rel, html) {
  const existing = existingDescription(html);
  if (existing) return existing;
  const manual = MANUAL_DESCRIPTIONS[rel];
  if (manual) return manual;
  const paragraph = firstMeaningfulParagraph(html);
  if (paragraph) return paragraph.slice(0, 155);
  const name = pageName(html);
  return `${name}について、PTA適正化推進委員会が公開情報と確認資料に基づいて整理したページです。`;
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function addHeadMarkup(html, markup) {
  return html.replace(/<\/head>/i, `${markup}\n</head>`);
}

function upsertDescription(html, description) {
  if (/<meta\s+name=["']description["']/i.test(html)) return html;
  return addHeadMarkup(html, `<meta name="description" content="${escapeAttribute(description)}">`);
}

function upsertRobots(html) {
  const robots = /<meta\s+name=["']robots["'][^>]*>/i;
  if (robots.test(html)) {
    return html.replace(robots, `<meta name="robots" content="${ROBOTS_VALUE}">`);
  }
  return addHeadMarkup(html, `<meta name="robots" content="${ROBOTS_VALUE}">`);
}

function upsertCanonical(html, url) {
  if (/<link\s+rel=["']canonical["']/i.test(html)) return html;
  return addHeadMarkup(html, `<link rel="canonical" href="${escapeAttribute(url)}">`);
}

function upsertDiscoveryMetadata(html) {
  let next = html;
  if (!/<meta\s+name=["']author["']/i.test(next)) {
    next = addHeadMarkup(next, '<meta name="author" content="PTA適正化推進委員会">');
  }
  if (!/<link\s+rel=["']alternate["'][^>]*href=["']\/llms\.txt["']/i.test(next)) {
    next = addHeadMarkup(next, '<link rel="alternate" type="text/plain" href="/llms.txt" title="AI向けサイト案内">');
  }
  if (!/<link\s+rel=["']stylesheet["'][^>]*href=["']\/css\/prose\.css/i.test(next)) {
    next = addHeadMarkup(next, '<link rel="stylesheet" href="/css/prose.css?v=20260719">');
  }
  return next;
}

function addMetaProperty(html, property, content) {
  const pattern = new RegExp(`<meta\\s+property=["']${property}["']`, "i");
  if (pattern.test(html)) return html;
  return addHeadMarkup(html, `<meta property="${property}" content="${escapeAttribute(content)}">`);
}

function upsertOpenGraph(html, rel, url, title, description) {
  let next = html;
  next = addMetaProperty(next, "og:site_name", "PTA適正化推進委員会");
  next = addMetaProperty(next, "og:locale", "ja_JP");
  next = addMetaProperty(next, "og:type", schemaType(rel) === "Article" ? "article" : "website");
  next = addMetaProperty(next, "og:title", title);
  next = addMetaProperty(next, "og:description", description);
  next = addMetaProperty(next, "og:url", url);
  if (/<meta\s+property=["']og:type["'][^>]*content=["']article["']/i.test(next)) {
    next = addMetaProperty(next, "article:modified_time", REVIEW_DATE);
  }
  return next;
}

function normalizeJsonLdDates(html) {
  return html.replace(
    /<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
    (block) => block.replace(/"dateModified"\s*:\s*"[^"]+"/g, `"dateModified": "${REVIEW_DATE}"`)
  );
}

function breadcrumbItems(rel, name, url) {
  const items = [
    { "@type": "ListItem", position: 1, name: "トップ", item: `${SITE_ORIGIN}/` }
  ];
  const first = rel.includes("/") ? rel.split("/")[0] : "";
  const section = SECTION_BREADCRUMBS[first];
  if (section && section.url !== url) {
    items.push({ "@type": "ListItem", position: items.length + 1, name: section.name, item: section.url });
  }
  if (url !== `${SITE_ORIGIN}/`) {
    items.push({ "@type": "ListItem", position: items.length + 1, name, item: url });
  }
  return items;
}

function schemaType(rel) {
  if (rel.startsWith("journal/") || rel.startsWith("archive/")) return "Article";
  if (["journal.html", "national-archive.html", "board-responses.html", "research-index.html", "key-materials.html"].includes(rel)) {
    return "CollectionPage";
  }
  return "WebPage";
}

function addJsonLd(html, rel, url, name, description) {
  if (/application\/ld\+json/i.test(html)) return html;
  const type = schemaType(rel);
  const page = {
    "@type": type,
    "@id": `${url}#page`,
    url,
    name,
    description,
    inLanguage: "ja",
    dateModified: REVIEW_DATE,
    isPartOf: { "@type": "WebSite", "@id": `${SITE_ORIGIN}/#website`, name: "PTA適正化推進委員会", url: `${SITE_ORIGIN}/` },
    publisher: { "@type": "Organization", name: "PTA適正化推進委員会", url: `${SITE_ORIGIN}/about.html` }
  };
  if (type === "Article") {
    page.headline = name;
    page.author = { "@type": "Organization", name: "PTA適正化推進委員会", url: `${SITE_ORIGIN}/about.html` };
    page.mainEntityOfPage = { "@type": "WebPage", "@id": url };
  }
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      page,
      { "@type": "BreadcrumbList", itemListElement: breadcrumbItems(rel, name, url) }
    ]
  };
  const json = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
  return addHeadMarkup(html, `<script type="application/ld+json">\n${json}\n</script>`);
}

function markProseMode(html) {
  if (/<body\b[^>]*data-content-mode=/i.test(html)) return html;
  return html.replace(/<body\b([^>]*)>/i, '<body data-content-mode="prose" data-reviewed="2026-07-19"$1>');
}

function enhance(filePath, checkOnly) {
  const rel = relativePath(filePath);
  const original = fs.readFileSync(filePath, "utf8");
  if (!isPublishable(original)) return { rel, skipped: true, changed: false };

  const url = pageUrl(rel);
  const name = pageName(original);
  const description = descriptionFor(rel, original);
  let html = original;
  html = upsertDescription(html, description);
  html = upsertRobots(html);
  html = upsertCanonical(html, url);
  html = upsertDiscoveryMetadata(html);
  html = addJsonLd(html, rel, url, name, description);
  html = normalizeJsonLdDates(html);
  html = upsertOpenGraph(html, rel, url, titleFor(original), description);
  html = markProseMode(html);

  const changed = html !== original;
  if (changed && !checkOnly) fs.writeFileSync(filePath, html, "utf8");
  return { rel, skipped: false, changed };
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const results = walkHtml(ROOT).map((filePath) => enhance(filePath, checkOnly));
  const publishable = results.filter((result) => !result.skipped);
  const changed = publishable.filter((result) => result.changed);
  if (checkOnly && changed.length) {
    console.error(`Public page metadata is out of date on ${changed.length} page(s):`);
    for (const result of changed) console.error(`- ${result.rel}`);
    process.exit(1);
  }
  console.log(`${checkOnly ? "Checked" : "Enhanced"} ${publishable.length} public HTML pages; ${changed.length} ${checkOnly ? "need changes" : "changed"}.`);
}

if (require.main === module) main();
