import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'visual-audit-output');
const SHOTS = path.join(OUT, 'screenshots');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });

const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
const localUrls = [...new Set(urls.map((raw) => {
  const u = new URL(raw);
  let pathname = u.pathname || '/';
  if (pathname.endsWith('/')) pathname += 'index.html';
  return { raw, pathname, local: `http://127.0.0.1:4173${pathname}` };
}))];

// On CI, sample representative routes; without this variable the full sitemap is audited.
const requestedPaths = new Set((process.env.PTA_VISUAL_AUDIT_PAGES || '')
  .split(',').map((p) => p.trim()).filter(Boolean));
const allRequested = requestedPaths.size
  ? [...requestedPaths].map((pathname) => ({
      pathname,
      raw: 'https://ptaorg.com' + pathname,
      local: 'http://127.0.0.1:4173' + pathname,
    }))
  : localUrls;
const shardCount = Number(process.env.PTA_VISUAL_AUDIT_SHARD_COUNT || 1);
const shardIndex = Number(process.env.PTA_VISUAL_AUDIT_SHARD_INDEX || 0);
if (!Number.isInteger(shardCount) || shardCount < 1 ||
    !Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardCount) {
  throw new Error('Invalid audit shard count/index');
}
const pagesToAudit = allRequested.filter((item, i) => i % shardCount === shardIndex);
const settleMs = Number(process.env.PTA_VISUAL_AUDIT_SETTLE_MS ?? 450);
const screenshotsOnlyProblems = process.env.PTA_VISUAL_AUDIT_SCREENSHOT_MODE === 'problems';
// Some canonical index/legacy pages intentionally are not listed in the sitemap.
for (const item of pagesToAudit) {
  if (requestedPaths.size && !fs.existsSync(path.join(ROOT, item.pathname.slice(1)))) {
    throw new Error('Responsive audit target not found in checkout: ' + item.pathname);
  }
}

const corePatterns = [
  /^\/index\.html$/,
  /^\/(administrative-materials|audit\/index|board-responses|cases|claim-evidence-ledger|compliance|contact|documents|edu-board-separation|education-board-responsibility|evidence-checklist|facilities|fee-collection|guide-board|guide-parent|guide-pta|guide-research|guideline|index|journal|key-materials|law-map|membership|national-archive|personnel|privacy|proper-management|reality|report|research-index|submission-kit|support|timeline|timeline-issues)\.html$/,
  /^\/journal\/.+\.html$/,
];
const isCore = (pathname) => corePatterns.some((r) => r.test(pathname));

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch({ headless: true });
const results = [];

function slugify(pathname) {
  return pathname.replace(/^\//, '').replace(/\/index\.html$/, '/index').replace(/[^a-zA-Z0-9._/-]+/g, '-').replace(/[/.]+/g, '__').slice(0, 180) || 'home';
}

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: 'ja-JP',
    colorScheme: 'light',
  });
  const page = await context.newPage();
  page.on('console', () => {});

  for (let i = 0; i < pagesToAudit.length; i += 1) {
    const item = pagesToAudit[i];
    const record = {
      url: item.raw,
      pathname: item.pathname,
      viewport: viewport.name,
      width: viewport.width,
      height: viewport.height,
      ok: true,
      errors: [],
      warnings: [],
    };
    try {
      const response = await page.goto(item.local, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(settleMs);
      if (!response || response.status() >= 400) {
        record.ok = false;
        record.errors.push(`HTTP ${response ? response.status() : 'no response'}`);
      }

      const metrics = await page.evaluate(() => {
        const visible = (el) => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0 && r.width > 0 && r.height > 0;
        };
        const rectObj = (r) => ({ left: Math.round(r.left * 10) / 10, right: Math.round(r.right * 10) / 10, top: Math.round(r.top * 10) / 10, bottom: Math.round(r.bottom * 10) / 10, width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 });
        const all = [...document.querySelectorAll('body *')].filter(visible);
        const textEls = [...document.querySelectorAll('p,li,td,th,label,button,input,textarea,select,main a,article a')].filter((el) => visible(el) && (el.textContent || el.value || '').trim().length > 0);
        const fontSizes = textEls.map((el) => parseFloat(getComputedStyle(el).fontSize)).filter(Number.isFinite).sort((a, b) => a - b);
        const percentile = (arr, p) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * p))] : null;
        const viewportWidth = document.documentElement.clientWidth;
        const overflowElements = all.filter((el) => {
          const r = el.getBoundingClientRect();
          // The keyboard-only skip link is intentionally positioned off-screen before focus.
          if (el.matches('.skip-link') || el.closest('.skip-link')) return false;
          if (el.tagName === 'SVG' || el.closest('svg')) return false;
          if (getComputedStyle(el).position === 'fixed') return false;
          return r.right > viewportWidth + 2 || r.left < -2;
        }).slice(0, 30).map((el) => ({ tag: el.tagName.toLowerCase(), className: String(el.className || '').slice(0, 120), id: el.id || '', rect: rectObj(el.getBoundingClientRect()) }));
        const textOverflow = all.filter((el) => {
          if (!['PRE','TABLE','CODE'].includes(el.tagName) && !el.matches('.edu-table-wrap,.table-wrap,.responsive-table,.gl-tpl-pre')) return false;
          return el.scrollWidth > el.clientWidth + 2;
        }).slice(0, 20).map((el) => ({ tag: el.tagName.toLowerCase(), className: String(el.className || '').slice(0, 120), id: el.id || '', scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
        const main = document.querySelector('main');
        const article = document.querySelector('main article, article, .gl-wrap, .issue-main, .edu-article, .journal-layout, .support-layout, .wrap-narrow');
        const header = document.querySelector('.site-header');
        const firstContent = document.querySelector('main h1, main h2, main section, main article, main > div');
        const h1s = [...document.querySelectorAll('h1')].filter(visible);
        const sections = [...document.querySelectorAll('main > section, main article > section')].filter(visible);
        return {
          title: document.title,
          bodyFont: parseFloat(getComputedStyle(document.body).fontSize),
          minFont: fontSizes[0] ?? null,
          p10Font: percentile(fontSizes, .10),
          medianFont: percentile(fontSizes, .50),
          docClientWidth: document.documentElement.clientWidth,
          docScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
          overflowElements,
          textOverflow,
          mainRect: main ? rectObj(main.getBoundingClientRect()) : null,
          articleRect: article ? rectObj(article.getBoundingClientRect()) : null,
          headerRect: header ? rectObj(header.getBoundingClientRect()) : null,
          firstContentRect: firstContent ? rectObj(firstContent.getBoundingClientRect()) : null,
          h1Count: h1s.length,
          sectionCount: sections.length,
          bodyBackground: getComputedStyle(document.body).backgroundColor,
          articleBackground: article ? getComputedStyle(article).backgroundColor : null,
        };
      });
      Object.assign(record, metrics);
      if (viewport.name === 'mobile' && item.pathname === '/guide-board.html') {
        record.guideBoardLayout = await page.evaluate(() => {
          const selectors = ['#board-executive-brief', '.gbv-wrap', '.gbv-head',
            '.gbv-head > div', '.gbv-principle', '.legacy-main', '.article-main'];
          return selectors.map((selector) => {
            const el = document.querySelector(selector);
            if (!el) return { selector, found: false };
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            return { selector, x:rect.x, width:rect.width, right:rect.right,
              scrollWidth:el.scrollWidth, clientWidth:el.clientWidth,
              display:style.display, minWidth:style.minWidth, widthStyle:style.width,
              gridTemplateColumns:style.gridTemplateColumns, overflowX:style.overflowX };
          });
        });
        const grid = record.guideBoardLayout.find((part) => part.selector === '.gbv-head');
        const brief = record.guideBoardLayout.find((part) => part.selector === '.gbv-head > div');
        if (!grid || !brief || brief.right > grid.right + 2) {
          record.errors.push('教育委員会ガイド: 概要ブロックが画面外に切れる');
        }
      }
      // The unified contact page must show consultation before the support panel on mobile.
      if (viewport.name === 'mobile' && item.pathname === '/contact.html') {
        const order = await page.evaluate(() => {
          const contact = document.querySelector('.unified-contact-card');
          const support = document.querySelector('.support-donate-side');
          return contact && support ? {
            contactTop: contact.getBoundingClientRect().top,
            supportTop: support.getBoundingClientRect().top,
          } : null;
        });
        if (!order || order.supportTop <= order.contactTop) {
          record.errors.push('統合ページ: モバイルで情報提供より先に寄付案内が表示される');
        }
      }

      if (metrics.horizontalOverflow) record.errors.push(`横スクロール ${metrics.docScrollWidth}px > ${metrics.docClientWidth}px`);
      if (metrics.overflowElements.length) record.warnings.push(`画面外要素 ${metrics.overflowElements.length}件`);
      if (metrics.h1Count !== 1) record.warnings.push(`H1 ${metrics.h1Count}件`);
      if (metrics.p10Font !== null && metrics.p10Font < (viewport.name === 'mobile' ? 13 : 12)) record.warnings.push(`小さい文字 p10=${metrics.p10Font}px`);
      if (viewport.name === 'desktop' && metrics.articleRect && metrics.articleRect.width < 720 && metrics.sectionCount > 2) record.warnings.push(`本文領域が狭い ${metrics.articleRect.width}px`);
      if (metrics.headerRect && metrics.firstContentRect && metrics.firstContentRect.top < metrics.headerRect.bottom - 1 && metrics.firstContentRect.bottom > metrics.headerRect.top) record.warnings.push('固定ヘッダーと本文が重なる可能性');
      if (metrics.textOverflow.length) record.warnings.push(`表・コードの内部横スクロール ${metrics.textOverflow.length}件`);

      const shouldShot = screenshotsOnlyProblems
        ? record.errors.length || record.warnings.length
        : isCore(item.pathname) || record.errors.length || record.warnings.some((w) => w.includes('本文領域') || w.includes('画面外'));
      if (shouldShot) {
        const file = path.join(SHOTS, `${viewport.name}__${slugify(item.pathname)}.png`);
        await page.screenshot({ path: file, fullPage: false });
        record.screenshot = path.relative(OUT, file);
      }
    } catch (error) {
      record.ok = false;
      record.errors.push(String(error && error.message ? error.message : error));
    }
    results.push(record);
    if ((i + 1) % 25 === 0) console.log(`${viewport.name}: ${i + 1}/${pagesToAudit.length}`);
  }
  await context.close();
}

await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  pages: pagesToAudit.length,
  totalListed: allRequested.length,
  shardIndex,
  shardCount,
  checks: results.length,
  errorRecords: results.filter((r) => r.errors.length).length,
  warningRecords: results.filter((r) => r.warnings.length).length,
  horizontalOverflow: results.filter((r) => r.horizontalOverflow).length,
  narrowDesktop: results.filter((r) => r.viewport === 'desktop' && r.warnings.some((w) => w.includes('本文領域が狭い'))).length,
  smallText: results.filter((r) => r.warnings.some((w) => w.includes('小さい文字'))).length,
};
fs.writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify({ summary, results }, null, 2));

const problemRows = results
  .filter((r) => r.errors.length || r.warnings.length)
  .sort((a, b) => (b.errors.length * 10 + b.warnings.length) - (a.errors.length * 10 + a.warnings.length));
const md = [
  '# PTAサイト 実ブラウザ全体監査',
  '',
  `- 生成日時: ${summary.generatedAt}`,
  `- 監査対象: ${summary.pages}／全${summary.totalListed}ページ（シャード${summary.shardIndex+1}/${summary.shardCount}）`,
  `- デスクトップ・スマートフォン合計チェック: ${summary.checks}`,
  `- エラーのある表示: ${summary.errorRecords}`,
  `- 警告のある表示: ${summary.warningRecords}`,
  `- 横スクロール: ${summary.horizontalOverflow}`,
  `- デスクトップ本文幅720px未満: ${summary.narrowDesktop}`,
  `- 小さい文字: ${summary.smallText}`,
  '',
  '## 問題一覧',
  '',
  '|画面|URL|エラー・警告|本文幅|p10文字サイズ|',
  '|---|---|---|---:|---:|',
  ...problemRows.map((r) => `|${r.viewport}|${r.pathname}|${[...r.errors, ...r.warnings].join(' / ').replaceAll('|','\\|')}|${r.articleRect?.width ?? ''}|${r.p10Font ?? ''}|`),
  '',
].join('\n');
fs.writeFileSync(path.join(OUT, 'summary.md'), md);
console.log(JSON.stringify(summary, null, 2));
