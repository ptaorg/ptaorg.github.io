import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'visual-audit-output');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'desktop'), { recursive: true });
fs.mkdirSync(path.join(out, 'mobile'), { recursive: true });

function walk(dir, prefix = '') {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'archive', 'schools', 'public', 'visual-audit-output'].includes(entry.name)) continue;
    const rel = path.posix.join(prefix, entry.name);
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full, rel));
    else if (entry.isFile() && entry.name.endsWith('.html')) result.push(rel);
  }
  return result;
}

const all = walk(root).filter((p) => {
  if (!p.includes('/')) return true;
  return p === 'audit/index.html' || p.startsWith('forms/') || p.startsWith('journal/');
});

const priority = new Set([
  'index.html','guideline.html','membership.html','privacy.html','fee-collection.html','personnel.html','facilities.html',
  'guide-parent.html','guide-pta.html','guide-board.html','guide-research.html','proper-management.html','research-index.html',
  'documents.html','submission-kit.html','claim-evidence-ledger.html','board-responses.html','national-archive.html',
  'administrative-materials.html','law-map.html','cases.html','timeline.html','report.html','reality.html','journal.html',
  'education-board-responsibility.html','edu-board-separation.html','support.html','contact.html','audit/index.html'
]);
const pages = [...all].sort((a,b) => (priority.has(a) === priority.has(b)) ? a.localeCompare(b) : (priority.has(a) ? -1 : 1));

const browser = await chromium.launch({ headless: true });
const results = [];
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];

for (const pagePath of pages) {
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
    const url = `http://127.0.0.1:4173/${pagePath}`;
    let error = null;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(800);
      const metrics = await page.evaluate(() => {
        const body = document.body;
        const doc = document.documentElement;
        const main = document.querySelector('main') || body;
        const header = document.querySelector('.site-header, header');
        const rect = main.getBoundingClientRect();
        const textNodes = [...document.querySelectorAll('p,li,td,th,a,button,input,label')]
          .filter((el) => {
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
          });
        const fonts = textNodes.map((el) => parseFloat(getComputedStyle(el).fontSize)).filter(Number.isFinite);
        const overflowEls = [...document.querySelectorAll('body *')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.right > window.innerWidth + 2 || r.left < -2;
          })
          .slice(0, 20)
          .map((el) => ({ tag: el.tagName, cls: el.className || '', right: Math.round(el.getBoundingClientRect().right), left: Math.round(el.getBoundingClientRect().left) }));
        return {
          title: document.title,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          bodyScrollWidth: Math.max(body.scrollWidth, doc.scrollWidth),
          bodyScrollHeight: Math.max(body.scrollHeight, doc.scrollHeight),
          horizontalOverflow: Math.max(body.scrollWidth, doc.scrollWidth) - window.innerWidth,
          mainWidth: Math.round(rect.width),
          mainWidthRatio: +(rect.width / window.innerWidth).toFixed(3),
          headerHeight: header ? Math.round(header.getBoundingClientRect().height) : 0,
          minFontPx: fonts.length ? Math.min(...fonts) : null,
          medianFontPx: fonts.length ? fonts.sort((a,b)=>a-b)[Math.floor(fonts.length/2)] : null,
          overflowElements: overflowEls,
          h1Count: document.querySelectorAll('h1').length,
          h2Count: document.querySelectorAll('h2').length,
          visibleTextLength: (body.innerText || '').trim().length,
        };
      });
      const safe = pagePath.replaceAll('/', '__').replace(/\.html$/, '');
      await page.screenshot({
        path: path.join(out, vp.name, `${safe}.jpg`),
        fullPage: true,
        type: 'jpeg',
        quality: 58,
      });
      results.push({ page: pagePath, viewport: vp.name, ...metrics });
    } catch (e) {
      error = String(e);
      results.push({ page: pagePath, viewport: vp.name, error });
    } finally {
      await page.close();
    }
  }
}

await browser.close();
fs.writeFileSync(path.join(out, 'metrics.json'), JSON.stringify(results, null, 2));
const problems = results.filter((r) => r.error || r.horizontalOverflow > 2 || (r.viewport === 'desktop' && r.mainWidthRatio < 0.5) || (r.minFontPx && r.minFontPx < 11));
fs.writeFileSync(path.join(out, 'problems.json'), JSON.stringify(problems, null, 2));
fs.writeFileSync(path.join(out, 'pages.txt'), pages.join('\n') + '\n');
console.log(`Audited ${pages.length} pages across ${viewports.length} viewports; ${problems.length} flagged records.`);
