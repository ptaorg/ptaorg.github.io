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
        const outsideElements = all.filter((el) => {
          const r = el.getBoundingClientRect();
          // The keyboard-only skip link is intentionally positioned off-screen before focus.
          if (el.matches('.skip-link') || el.closest('.skip-link')) return false;
          if (el.tagName === 'SVG' || el.closest('svg')) return false;
          if (getComputedStyle(el).position === 'fixed') return false;
          return r.right > viewportWidth + 2 || r.left < -2;
        });
        const overflowElements = outsideElements.slice(0, 30).map((el) => ({
          tag: el.tagName.toLowerCase(), className: String(el.className || '').slice(0, 120),
          id: el.id || '', rect: rectObj(el.getBoundingClientRect())
        }));
        // Report raw out-of-viewport geometry, but distinguish the legitimate
        // clipped map tiles and horizontally scrollable original documents.
        // No content is hidden and no warning is silently removed.
        const outsideBreakdown = {
          total: outsideElements.length,
          mapTiles: 0,
          containedInScroller: 0,
          uncontained: 0,
          uncontainedExamples: []
        };
        const offscreenKind = (el) => {
          if (el.matches('.leaflet-tile') || el.closest('.leaflet-tile-container')) {
            return 'mapTiles';
          }
          for (let ancestor = el.parentElement; ancestor && ancestor !== document.body;
               ancestor = ancestor.parentElement) {
            const cs = getComputedStyle(ancestor);
            if ((cs.overflowX === 'scroll' || cs.overflowX === 'auto') &&
                ancestor.scrollWidth > ancestor.clientWidth + 2) {
              const bounds = ancestor.getBoundingClientRect();
              if (bounds.left >= -2 && bounds.right <= viewportWidth + 2) {
                return 'containedInScroller';
              }
            }
          }
          return 'uncontained';
        };
        for (const element of outsideElements) {
          const kind = offscreenKind(element);
          outsideBreakdown[kind]++;
          if (kind === 'uncontained' && outsideBreakdown.uncontainedExamples.length < 10) {
            outsideBreakdown.uncontainedExamples.push({
              tag:element.tagName.toLowerCase(),
              cls:String(element.className || '').slice(0,90),
              parent:String(element.parentElement?.className || '').slice(0,90),
              rect:rectObj(element.getBoundingClientRect())
            });
          }
        }
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
          tinyTextExamples: textEls.filter(el => parseFloat(getComputedStyle(el).fontSize) < 14)
            .slice(0, 20).map(el => ({
              tag:el.tagName.toLowerCase(),
              cls:String(el.className || '').slice(0,90),
              parent:String(el.parentElement?.className || '').slice(0,90),
              font:parseFloat(getComputedStyle(el).fontSize),
              text:(el.textContent || '').trim().slice(0,65)
            })),

          medianFont: percentile(fontSizes, .50),
          docClientWidth: document.documentElement.clientWidth,
          docScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
          overflowElements,
          outsideBreakdown,
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
      if (viewport.name === 'mobile' &&
          ['/key-materials.html', '/guide-board.html', '/law-map.html', '/national-archive.html'].includes(item.pathname)) {
        record.contentScrollDiagnostics = await page.evaluate(() => {
          const sels = ['.km-wrap','.km-list','.km-source','.km-source-index','.km-source-body',
            '.km-source-body > p','.km-source-body > ul','.diagram-scroll','.diagram-scroll img',
            '.law-table-wrap','.law-table','.archive-jump .wrap','.archive-jump a'];
          return sels.map(selector => {
            const e = document.querySelector('#main .legacy-body ' + selector);
            if (!e) return null;
            const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
            return {selector,left:Math.round(r.left),right:Math.round(r.right),
              width:Math.round(r.width),clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,
              overflowX:cs.overflowX,minWidth:cs.minWidth,
              gridColumns:cs.gridTemplateColumns,display:cs.display};
          }).filter(Boolean);
        });
        if (item.pathname === '/key-materials.html' &&
            record.contentScrollDiagnostics.some(x =>
              x.selector.startsWith('.km-source') && (x.left < -2 || x.right > viewport.width + 2))) {
          record.errors.push('重要資料の本文ブロックがスマートフォンの画面外に切れる');
        }
      }
      if (item.pathname === '/board-brief.html' && viewport.name === 'desktop') {
        const screen = await page.evaluate(() => {
          const p = document.querySelector('.legacy .document > .page p');
          const pageEl = document.querySelector('.legacy .document > .page');
          const qr = pageEl?.querySelector('.qr-strip');
          return {
            font: p ? parseFloat(getComputedStyle(p).fontSize) : 0,
            overflow: pageEl ? getComputedStyle(pageEl).overflow : '',
            height: pageEl ? Math.round(pageEl.getBoundingClientRect().height) : 0,
            qrPosition: qr ? getComputedStyle(qr).position : ''
          };
        });
        if (screen.font < 15.5 || screen.overflow === 'hidden' || screen.qrPosition === 'absolute') {
          record.errors.push('A4提出要旨のPC閲覧文字・内容の見切れを検出');
        }
        if (!screenshotsOnlyProblems) {
          const first = page.locator('.legacy .document > .page').first();
          await first.screenshot({path:path.join(SHOTS, 'desktop__board-brief__reading-page-1.png')});
        }
        await page.emulateMedia({media:'print'});
        const print = await page.evaluate(() => {
          const p = document.querySelector('.legacy .document > .page');
          const qr = p?.querySelector('.qr-strip');
          const r = p?.getBoundingClientRect();
          return {
            width:r?.width ?? 0,height:r?.height ?? 0,
            pages:document.querySelectorAll('.legacy .document > .page').length,
            qrPosition:qr ? getComputedStyle(qr).position : ''
          };
        });
        await page.emulateMedia({media:'screen'});
        record.a4Screen = screen;
        record.a4Print = print;
        if (print.pages !== 5 || Math.abs(print.width - 793.7) > 8 ||
            Math.abs(print.height - 1122.5) > 10 || print.qrPosition !== 'absolute') {
          record.errors.push('A4印刷の5ページ固定版面が維持されていない');
        }
      }
      const readableMobilePages = new Set([
        '/board-brief.html', '/contact.html', '/pta-application-chain.html',
        '/board-pta-chain.html', '/pta-officer-chain.html',
        '/ppc-school-pta-personal-data.html', '/compliance.html',
        '/journal/pta-fee-delegation-origin-local-government-law-20261016.html'
      ]);
      if (viewport.name === 'mobile' && readableMobilePages.has(item.pathname) &&
          (metrics.p10Font === null || metrics.p10Font < 13)) {
        record.errors.push('重要資料ページの下位文字サイズが13px未満');
      }
      if (viewport.name === 'desktop' &&
          item.pathname === '/journal/yokohama-notice-1965.html' &&
          metrics.overflowElements.some(el => el.className.includes('journal-document-set-wide'))) {
        record.errors.push('横浜市原本画像コンテナが画面の外へはみ出す');
      }
      if (viewport.name === 'mobile' &&
          ['/administrative-materials.html', '/ppc-school-pta-personal-data.html'].includes(item.pathname)) {
        const tableChecks = await page.evaluate(() => [...document.querySelectorAll('#main .legacy-body table')]
          .filter(t => t.scrollWidth > t.clientWidth + 4 && /^(auto|scroll)$/.test(getComputedStyle(t).overflowX))
          .map(t => ({
            hint: !!t.previousElementSibling?.matches('.table-scroll-hint'),
            focusable: t.tabIndex === 0,
            described: !!t.dataset.scrollHintId &&
              (t.getAttribute('aria-describedby') || '').split(/\s+/).includes(t.dataset.scrollHintId),
            buttons: t.previousElementSibling?.querySelectorAll('.table-scroll-actions button').length === 2
          })));
        record.scrollableTables = tableChecks.length;
        if (!tableChecks.length || tableChecks.some(t => !t.hint || !t.focusable || !t.described || !t.buttons)) {
          record.errors.push('横スクロールできる原資料表の案内・キーボード操作が不足');
        }
        if (tableChecks.length) {
          const target = page.locator('#main .legacy-body table[data-scroll-hint-id]').first();
          const before = await target.evaluate(t => t.scrollLeft);
          await page.locator('#main .legacy-body .table-scroll-hint [data-table-scroll="forward"]').first().click();
          await page.waitForTimeout(300);
          const after = await target.evaluate(t => t.scrollLeft);
          record.tableControlMoved = after - before;
          if (after <= before + 3) record.errors.push('表の「右の列を見る」が動作しない');
          await page.locator('#main .legacy-body .table-scroll-hint [data-table-scroll="back"]').first().click();
          await page.waitForTimeout(300);
          const returned = await target.evaluate(t => t.scrollLeft);
          record.tableControlReturned = after - returned;
          if (returned >= after - 3) record.errors.push('表の「左の列を見る」が動作しない');
        }
      }
      if (viewport.name === 'mobile' && item.pathname === '/guide-board.html') {
        const diagrams = await page.evaluate(() => [...document.querySelectorAll(
          '#main .legacy-body.guide-board-direct-fixed .diagram-scroll'
        )].filter(e => {
          const r=e.getBoundingClientRect(), cs=getComputedStyle(e);
          return r.width > 0 && r.height > 0 && cs.visibility === 'visible' &&
            !e.closest('[hidden],[aria-hidden="true"]') &&
            e.scrollWidth > e.clientWidth + 4;
        }).map(e => ({
          hint: !!e.previousElementSibling?.matches('.diagram-scroll-hint'),
          buttons: e.previousElementSibling?.querySelectorAll(
            '.table-scroll-actions button'
          ).length === 2,
          focusable: e.tabIndex === 0,
          described: !!e.dataset.diagramScrollHintId &&
            (e.getAttribute('aria-describedby') || '').split(/\s+/)
              .includes(e.dataset.diagramScrollHintId)
        })));
        record.scrollableDiagrams = diagrams.length;
        if (!diagrams.length || diagrams.some(d =>
          !d.hint || !d.buttons || !d.focusable || !d.described)) {
          record.errors.push('横長の原本図に視覚的案内・左右操作・キーボード案内が不足');
        }
        if (diagrams.length) {
          const target = page.locator(
            '#main .legacy-body.guide-board-direct-fixed .diagram-scroll[data-diagram-scroll-hint-id]:visible'
          ).first();
          const forward = page.locator(
            '#main .legacy-body.guide-board-direct-fixed .diagram-scroll-hint:visible [data-diagram-scroll="forward"]'
          ).first();
          const back = page.locator(
            '#main .legacy-body.guide-board-direct-fixed .diagram-scroll-hint:visible [data-diagram-scroll="back"]'
          ).first();
          await forward.click();
          await page.waitForTimeout(350);
          const right = await target.evaluate(e => e.scrollLeft);
          await back.click();
          await page.waitForTimeout(350);
          const left = await target.evaluate(e => e.scrollLeft);
          record.diagramMoveRight = right;
          record.diagramMoveBack = right - left;
          if (right <= 3 || left >= right - 3)
            record.errors.push('図の左右ボタンが実際にスクロールしない');
        }
      }
      if (viewport.name === 'mobile' && item.pathname === '/guide-board.html') {
        const stages = await page.evaluate(() => {
          const root = document.querySelector('.legacy .roadmap-grid');
          if (!root) return null;
          return {
            columns: getComputedStyle(root).gridTemplateColumns,
            cards: [...root.children].map(e => {
              const r=e.getBoundingClientRect();
              return {left:Math.round(r.left),right:Math.round(r.right)};
            })
          };
        });
        record.roadmapLayout=stages;
        if (!stages || stages.cards.length !== 4 ||
            stages.cards.some(c => c.left < -2 || c.right > viewport.width + 2)) {
          record.errors.push('4段階工程表のカードがスマートフォンの画面からはみ出す');
        }
      }
      // A few archived school pages had a 100vw hero inside a narrow column,
      // making the print control invisible even though document scrolling was zero.
      if (item.pathname.startsWith('/archive/')) {
        const archiveHero = await page.evaluate(() => {
          const root = document.querySelector('.archive-school-page');
          const hero = root?.querySelector(':scope > .archive-hero');
          if (!root || !hero) return null;
          const r = root.getBoundingClientRect(), h = hero.getBoundingClientRect();
          return { rootLeft:r.left, rootRight:r.right, heroLeft:h.left, heroRight:h.right };
        });
        if (archiveHero && (archiveHero.heroLeft < archiveHero.rootLeft - 2 ||
            archiveHero.heroRight > archiveHero.rootRight + 2)) {
          record.errors.push('学校別資料の見出しとPDF保存操作が本文の外へはみ出す');
        }
      }
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
