#!/usr/bin/env node
/*
  静的HTMLへ Xカード用画像メタタグと refine.css 読み込みを追加するスクリプト。

  使い方:
    node tools/apply-static-meta-fix.js
    node tools/check-static-meta.js

  方針:
    - 本文は削らない。
    - <head> 内だけを最小限で補正する。
    - twitter:image / twitter:image:alt が既にあれば重複追加しない。
    - refine.css が既にあれば重複追加しない。
*/
const fs = require('fs');
const path = require('path');

const targets = [
  'timeline.html',
  'shizuoka-incident.html',
  'guideline.html',
  'compliance.html'
];

const TWITTER_IMAGE = 'https://ptaorg.com/assets/og-image-popc-en.png';
const TWITTER_ALT = 'PTA適正化推進委員会';

function insertBeforeHeadClose(html, fragment) {
  if (!/<\/head>/i.test(html)) throw new Error('missing </head>');
  return html.replace(/<\/head>/i, `${fragment}\n</head>`);
}

function normalizeCanonical(html, file) {
  const canonicalHref = `https://ptaorg.com/${file}`;
  const canonicalRe = /<link\s+[^>]*rel=["']canonical["'][^>]*>\s*/gi;
  const canonical = `<link rel="canonical" href="${canonicalHref}">`;
  const found = html.match(canonicalRe) || [];
  if (found.length === 0) {
    return html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, m => `${m}\n  ${canonical}`);
  }
  let first = true;
  return html.replace(canonicalRe, () => {
    if (first) { first = false; return `  ${canonical}\n`; }
    return '';
  });
}

function ensureTwitterImage(html) {
  let out = html;
  if (!/<meta\s+[^>]*name=["']twitter:image["'][^>]*>/i.test(out)) {
    const line = `  <meta name="twitter:image" content="${TWITTER_IMAGE}">`;
    if (/<meta\s+[^>]*name=["']twitter:card["'][^>]*>/i.test(out)) {
      out = out.replace(/<meta\s+[^>]*name=["']twitter:card["'][^>]*>/i, m => `${m}\n${line}`);
    } else {
      out = insertBeforeHeadClose(out, line);
    }
  }
  if (!/<meta\s+[^>]*name=["']twitter:image:alt["'][^>]*>/i.test(out)) {
    const line = `  <meta name="twitter:image:alt" content="${TWITTER_ALT}">`;
    if (/<meta\s+[^>]*name=["']twitter:image["'][^>]*>/i.test(out)) {
      out = out.replace(/<meta\s+[^>]*name=["']twitter:image["'][^>]*>/i, m => `${m}\n${line}`);
    } else {
      out = insertBeforeHeadClose(out, line);
    }
  }
  return out;
}

function ensureRefineCss(html) {
  if (/href=["'][^"']*css\/refine\.css[^"']*["']/i.test(html)) return html;
  const line = '  <link href="css/refine.css?v=refine1" rel="stylesheet">';
  if (/<link\s+[^>]*href=["'][^"']*css\/style\.css[^"']*["'][^>]*>/i.test(html)) {
    return html.replace(/<link\s+[^>]*href=["'][^"']*css\/style\.css[^"']*["'][^>]*>/i, m => `${m}\n${line}`);
  }
  return insertBeforeHeadClose(html, line);
}

function ensureOgImage(html) {
  if (/<meta\s+[^>]*property=["']og:image["'][^>]*>/i.test(html)) return html;
  const line = `  <meta property="og:image" content="${TWITTER_IMAGE}">`;
  if (/<meta\s+[^>]*property=["']og:url["'][^>]*>/i.test(html)) {
    return html.replace(/<meta\s+[^>]*property=["']og:url["'][^>]*>/i, m => `${m}\n${line}`);
  }
  return insertBeforeHeadClose(html, line);
}

for (const file of targets) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) {
    console.log(`SKIP ${file}: not found`);
    continue;
  }
  const before = fs.readFileSync(p, 'utf8');
  let after = before;
  after = normalizeCanonical(after, file);
  after = ensureOgImage(after);
  after = ensureTwitterImage(after);
  after = ensureRefineCss(after);

  if (after !== before) {
    fs.writeFileSync(p, after, 'utf8');
    console.log(`UPDATED ${file}`);
  } else {
    console.log(`OK ${file}: no changes`);
  }
}
