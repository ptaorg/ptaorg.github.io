#!/usr/bin/env node
/*
  静的HTMLメタタグ検査スクリプト
  使い方: node tools/check-static-meta.js
*/
const fs = require('fs');
const path = require('path');

const targets = [
  'timeline.html',
  'shizuoka-incident.html',
  'guideline.html',
  'compliance.html',
  'documents.html',
  'contact.html',
  'board-responses.html'
];

function count(re, text){
  const m = text.match(re);
  return m ? m.length : 0;
}

let failed = false;
for (const file of targets) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) {
    console.log(`SKIP ${file}: file not found`);
    continue;
  }
  const html = fs.readFileSync(p, 'utf8');
  const checks = {
    canonical: count(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi, html),
    ogImage: count(/<meta\s+[^>]*property=["']og:image["'][^>]*>/gi, html),
    twitterCard: count(/<meta\s+[^>]*name=["']twitter:card["'][^>]*>/gi, html),
    twitterImage: count(/<meta\s+[^>]*name=["']twitter:image["'][^>]*>/gi, html),
    twitterImageAlt: count(/<meta\s+[^>]*name=["']twitter:image:alt["'][^>]*>/gi, html),
    h1: count(/<h1\b/gi, html),
    siteJs: count(/<script\s+[^>]*src=["'][^"']*js\/site\.js[^"']*["'][^>]*>/gi, html)
  };

  const warnings = [];
  if (checks.canonical !== 1) warnings.push(`canonical=${checks.canonical}`);
  if (checks.ogImage < 1) warnings.push('og:image missing');
  if (checks.twitterCard < 1) warnings.push('twitter:card missing');
  if (checks.twitterImage < 1) warnings.push('twitter:image missing');
  if (checks.twitterImageAlt < 1) warnings.push('twitter:image:alt missing');
  if (checks.h1 < 1) warnings.push('h1 missing');
  if (checks.siteJs < 1) warnings.push('site.js missing');

  if (warnings.length) {
    failed = true;
    console.log(`NG   ${file}: ${warnings.join(', ')}`);
  } else {
    console.log(`OK   ${file}`);
  }
}

if (failed) process.exit(1);
