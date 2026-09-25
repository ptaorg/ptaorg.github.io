// Read-only audit. npm run check:browser -- --report /tmp/audit
// CI additionally passes --site-dir /tmp/site (the actual Pages build).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import YAML from 'yaml';
import robotsParser from 'robots-parser';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

const origin = 'https://ptaorg.com';
const hosts = new Set(['ptaorg.com', 'www.ptaorg.com', 'ptaorg.github.io']);
const isTelemetry = url => (url.hostname === 'analytics.google.com' || /(^|\.)google-analytics\.com$/.test(url.hostname)) && /\/collect$/.test(url.pathname);
const list = value => value == null ? [] : Array.isArray(value) ? value : [value];
// Reviewed against dcb043a1305b53ff1458a85b4bab0d6010d57bf8. Exact findings only,
// one occurrence each. When repaired, a stale entry fails CI until removed.
export const knownIssues = [
  { code: 'sitemap-target', file: 'sitemap-research.xml', detail: 'https://ptaorg.com/research.html: non-indexable target', reason: 'Existing supplementary sitemap still lists the retired research redirect; site fix deferred.' },
  { code: 'fragment', file: 'guide-board-print.html', detail: '/school-pta-separation.html#submit-to-board', reason: 'Existing print toolbar links to a removed section; site fix deferred.' },
];
export function applyKnownIssues(findings, entries = knownIssues) {
  for (const entry of entries) {
    const matches = findings.filter(f => f.code === entry.code && f.file === entry.file && f.detail === entry.detail && f.severity === 'error');
    if (matches.length === 1) Object.assign(matches[0], { severity: 'warning', category: 'known-site-issue', reason: entry.reason });
    else if (!matches.length) findings.push({ code: 'known-issue-stale', file: entry.file, detail: `Remove resolved baseline: ${entry.code}: ${entry.detail}`, severity: 'error' });
    // Multiple occurrences are a regression, never a blanket exemption.
  }
  return findings;
}
function optionalTile(raw) {
  try { const url = new URL(raw); return url.protocol === 'https:' && /^(?:[abc]\.)?tile\.openstreetmap\.org$/.test(url.hostname) && /^\/\d+\/\d+\/\d+\.png$/.test(url.pathname); }
  catch { return false; }
}
export function classifyBrowserFindings(findings, media = []) {
  return findings.map(f => {
    if (f.code === 'request-failed' && f.resourceType === 'media' && f.failure === 'net::ERR_ABORTED'
      && media.some(m => m.url === f.url && m.readyState >= 1 && m.error === null)) {
      return { ...f, severity: 'warning', category: 'browser-media-cancelled', reason: 'Media metadata is loaded without a media error; browser cancelled a preload request.', media: media.find(m => m.url === f.url) };
    }
    const resource = ['http-error', 'request-failed', 'broken-image'].includes(f.code) && f.resourceType === 'image';
    const linkedConsole = f.code === 'console-error' && /^Failed to load resource:/.test(f.detail)
      && findings.some(n => ['http-error', 'request-failed'].includes(n.code) && n.url === f.url && n.resourceType === 'image');
    if (!optionalTile(f.url) || (!resource && !linkedConsole)) return f;
    return { ...f, severity: 'warning', category: f.failure === 'net::ERR_ABORTED' ? 'map-request-cancelled' : 'external-map-dependency',
      reason: f.failure === 'net::ERR_ABORTED' ? 'Tile request cancelled during rendering; not proof of server failure.' : 'Optional map background dependency; first-party resources, map initialization and answer/index content are checked separately.' };
  });
}
export function srcsetUrls(value) {
  const urls = [];
  while (value.trim()) {
    value = value.replace(/^[\s,]+/, '');
    const match = value.match(/^\S+/);
    if (!match) break;
    const token = match[0];
    urls.push(token.replace(/,+$/, ''));
    value = value.slice(token.length);
    if (!token.endsWith(',')) value = value.replace(/^[^,]*(?:,|$)/, '');
  }
  return urls;
}
export function filesAt(root, dir = '', skipDevelopment = true) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    if (skipDevelopment && ['.git', 'node_modules', '_site'].includes(e.name)) return [];
    const file = path.posix.join(dir, e.name);
    return e.isDirectory() ? filesAt(root, file, skipDevelopment) : e.isFile() ? [file] : [];
  });
}
export function pagePath(file) {
  return '/' + file.split('/').map(encodeURIComponent).join('/').replace(/(^|\/)index\.html$/, '$1');
}
export function documentInfo(text) {
  const nodes = [];
  function visit(node) {
    if (node.tagName) nodes.push({ tag: node.tagName, attrs: Object.fromEntries(node.attrs.map(a => [a.name, a.value])), line: node.sourceCodeLocation?.startLine });
    for (const child of node.childNodes || []) visit(child);
    // Inert template contents deliberately do not participate in document IDs.
  }
  visit(parse(text, { sourceCodeLocationInfo: true }));
  const metas = name => nodes.filter(n => n.tag === 'meta' && n.attrs.name?.toLowerCase() === name);
  return { nodes, metas, ids: new Set(nodes.map(n => n.attrs.id).filter(Boolean)),
    canonical: nodes.filter(n => n.tag === 'link' && n.attrs.rel?.toLowerCase().split(/\s+/).includes('canonical')),
    redirect: nodes.some(n => n.tag === 'meta' && n.attrs['http-equiv']?.toLowerCase() === 'refresh'),
    noindex: metas('robots').some(n => /\b(noindex|none)\b/i.test(n.attrs.content || '')) };
}
export function publicationFilter(config) {
  const patterns = (config.exclude || []).map(value => {
    // Jekyll 3.x EntryFilter uses File.fnmatch? without FNM_PATHNAME: * crosses /.
    const escaped = String(value).replace(/\/$/, '').replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*');
    return new RegExp(`^${escaped}(?:/|$)`);
  });
  return file => !file.split('/').some(part => /^[._#~]/.test(part) || part.endsWith('~')) && !patterns.some(re => re.test(file));
}
export function auditStatic(root, siteDir) {
  const read = file => fs.readFileSync(siteDir && fs.existsSync(path.join(siteDir, file)) ? path.join(siteDir, file) : path.join(root, file), 'utf8');
  const all = filesAt(root);
  const publishable = publicationFilter(YAML.parse(read('_config.yml')) || {});
  const sourcePublic = all.filter(publishable);
  const published = siteDir ? filesAt(siteDir, '', false) : sourcePublic;
  const publicSet = new Set(published);
  const html = [...new Set([...all, ...published])].filter(f => /\.html?$/i.test(f));
  const documents = new Map(html.map(f => [f, documentInfo(read(f))]));
  const findings = [];
  const add = (code, file, detail, severity = 'error') => findings.push({ code, file, detail, severity });
  const resolve = url => {
    const file = decodeURIComponent(url.pathname).replace(/^\//, '');
    return publicSet.has(file) ? file : publicSet.has(file + (file.endsWith('/') || !file ? '' : '/') + 'index.html') ? file + (file.endsWith('/') || !file ? '' : '/') + 'index.html' : file;
  };
  const checkRef = (raw, file, base, fragment = false) => {
    if (!raw || /^(data:|blob:|mailto:|tel:|javascript:)/i.test(raw)) return;
    try {
      const url = new URL(raw, base);
      if (!hosts.has(url.hostname)) return;
      const target = resolve(url);
      if (!publicSet.has(target)) return add('internal-reference', file, `${raw} -> unpublished or missing: ${target}`);
      if (fragment && url.hash && /\.html?$/i.test(target)) {
        const id = decodeURIComponent(url.hash.slice(1)).split(':~:text=')[0];
        const doc = documents.get(target);
        const dynamic = target === 'board-responses.html' && /^ans-\d+$/.test(id)
          && JSON.parse(read('data/board-responses.json')).responses.some(r => `ans-${r.no}` === id);
        if (id && doc && !doc.ids.has(id) && !doc.nodes.some(n => n.tag === 'a' && n.attrs.name === id) && !dynamic)
          add('fragment', file, raw);
      }
    } catch (error) { add('invalid-url', file, `${raw}: ${error.message}`); }
  };
  const robotsPath = path.join(siteDir || root, 'robots.txt');
  const robotsText = fs.existsSync(robotsPath) ? fs.readFileSync(robotsPath, 'utf8') : '';
  if (!robotsText) add('robots', 'robots.txt', 'missing or empty');
  const robots = robotsParser(`${origin}/robots.txt`, robotsText);
  const sitemapFiles = new Set(all.filter(f => /^sitemap.*\.xml$/.test(f)));
  for (const url of robots.getSitemaps()) {
    try {
      const parsed = new URL(url);
      if (parsed.origin !== origin || parsed.search || parsed.hash) throw Error('unexpected sitemap URL');
      const file = resolve(parsed);
      if (!publicSet.has(file)) throw Error('missing or unpublished sitemap');
      sitemapFiles.add(file);
    } catch (error) { add('robots-sitemap', 'robots.txt', `${url}: ${error.message}`); }
  }
  if (!robots.getSitemaps().includes(`${origin}/sitemap.xml`)) add('robots-sitemap', 'robots.txt', 'primary sitemap declaration missing');
  const sitemapUrls = new Set();
  for (const file of sitemapFiles) {
    if (!fs.existsSync(path.join(root, file))) continue;
    const xml = read(file);
    if (XMLValidator.validate(xml) !== true) { add('sitemap-xml', file, 'invalid XML'); continue; }
    const tree = new XMLParser().parse(xml);
    if (!tree.urlset) { add('sitemap-xml', file, 'expected urlset'); continue; }
    const seen = new Set();
    for (const item of list(tree.urlset.url)) {
      const loc = String(item.loc || '');
      if (seen.has(loc)) add('sitemap-duplicate', file, loc);
      seen.add(loc);
      sitemapUrls.add(loc);
      try {
        const url = new URL(loc);
        if (url.origin !== origin || url.hash || url.search) throw Error('must be an absolute canonical URL');
        const target = resolve(url);
        if (!publicSet.has(target)) throw Error('missing or unpublished target');
        const doc = documents.get(target);
        if (doc?.noindex || doc?.redirect || target === '404.html') throw Error('non-indexable target');
        if (doc && doc.canonical[0]?.attrs.href !== loc) throw Error('canonical mismatch');
        if (robots.isAllowed(loc, '*') === false) throw Error('blocked by robots.txt');
      } catch (error) { add('sitemap-target', file, `${loc}: ${error.message}`); }
    }
  }
  const ledger = fs.existsSync(path.join(root, 'data/url-ledger.json')) ? JSON.parse(read('data/url-ledger.json')) : {};
  const inventory = [];
  for (const [file, doc] of documents) {
    const isPublic = publicSet.has(file);
    const optionalSEO = doc.noindex || doc.redirect || file === '404.html';
    inventory.push({ file, status: !isPublic ? 'excluded' : doc.redirect ? 'redirect' : doc.noindex ? 'noindex' : 'indexable',
      metadataPolicy: optionalSEO ? 'SEO metadata absence allowed for non-indexable/redirect/error pages; supplied metadata still validated' : 'description and canonical required' });
    // Excluded work HTML is inventoried but not held to public-page SEO rules.
    if (!isPublic) continue;
    const url = origin + pagePath(file);
    const ids = new Set();
    for (const node of doc.nodes) {
      if (node.attrs.id && ids.has(node.attrs.id)) add('duplicate-id', file, `${node.attrs.id} at line ${node.line}`);
      if (node.attrs.id) ids.add(node.attrs.id);
    }
    for (const name of ['description', 'robots']) {
      const tags = doc.metas(name);
      if (tags.length > 1 || (name === 'description' && !tags.length && !optionalSEO)) add(`meta-${name}`, file, `count=${tags.length}`);
      if (tags.some(n => !n.attrs.content?.trim())) add(`meta-${name}`, file, 'empty content');
    }
    const directives = doc.metas('robots').map(n => n.attrs.content || '').join(',').toLowerCase();
    if (/\bindex\b/.test(directives) && /\b(noindex|none)\b/.test(directives) || /\bfollow\b/.test(directives) && /\b(nofollow|none)\b/.test(directives)) add('robots-conflict', file, directives);
    // A missing robots meta is valid: the crawler default is index,follow.
    if (doc.canonical.length > 1 || (!doc.canonical.length && !optionalSEO)) add('canonical', file, `count=${doc.canonical.length}`);
    for (const canonical of doc.canonical) {
      try {
        const target = new URL(canonical.attrs.href);
        if (target.origin !== origin || target.search || (target.hash && !optionalSEO)) throw Error('must use absolute https://ptaorg.com URL without query/fragment');
        if (!publicSet.has(resolve(target))) throw Error('missing or unpublished target');
        if (target.hash) {
          checkRef(target.href, file, url, true);
          add('canonical-fragment', file, `${target.href}: fragment ignored for canonicalization; valid legacy section destination`, 'warning');
        }
        if (!doc.noindex && !doc.redirect && target.href !== url) throw Error(`expected ${url}`);
      } catch (error) { add('canonical', file, error.message); }
    }
    const role = (ledger.entries || []).find(r => r.url === new URL(url).pathname)
      || (ledger.prefix_rules || []).find(r => new URL(url).pathname.startsWith(r.prefix));
    if (!doc.noindex && !doc.redirect && file !== '404.html' && role?.sitemap !== 'exclude' && !sitemapUrls.has(url)) add('sitemap-missing', file, url);
    const baseNode = doc.nodes.find(n => n.tag === 'base' && n.attrs.href);
    let base = url;
    try { if (baseNode) base = new URL(baseNode.attrs.href, url).href; } catch { add('invalid-base', file, baseNode.attrs.href); }
    for (const node of doc.nodes) {
      for (const attr of ['href', 'src', 'poster', 'action', 'data']) {
        if (attr === 'data' && node.tag !== 'object') continue;
        checkRef(node.attrs[attr], file, base, node.tag === 'a');
      }
      if (node.attrs.srcset) for (const candidate of srcsetUrls(node.attrs.srcset)) checkRef(candidate, file, base);
    }
  }
  const workFile = /^(?:tools|scripts|tests|docs|source-candidates|node_modules|work|outputs|playwright-report|test-results)(?:\/|$)|(?:^|\/)(?:(?:AGENTS|README)\.(?:md|html)|package(?:-lock)?\.json)$|\.(?:bak|tmp|log|swp|map|ps1|sh|ya?ml)$|(?:^|\/)(?:draft|scratch|backup)[^/]*$/i;
  for (const file of published) {
    if (!publishable(file) || workFile.test(file)) add('published-work-file', file, siteDir ? 'present in Pages build' : 'not excluded by Pages config');
    if (/\.(pdf|png|jpe?g|gif|webp)$/i.test(file)) {
      const buffer = fs.readFileSync(path.join(siteDir || root, file));
      const ext = path.extname(file).toLowerCase();
      const ok = ext === '.pdf' ? buffer.subarray(0, 5).toString() === '%PDF-' : ext === '.png' ? buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : /jpe?g/.test(ext) ? buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 : ext === '.gif' ? /^GIF8[79]a/.test(buffer.subarray(0,6).toString()) : buffer.subarray(0,4).toString() === 'RIFF' && buffer.subarray(8,12).toString() === 'WEBP';
      if (!ok) add('asset-signature', file, 'extension does not match file signature');
    }
  }
  return { findings, inventory, published, mode: siteDir ? 'pages-build' : 'source-publication-model' };
}

export async function auditBrowser(root, result, reportDir, siteDir) {
  const { chromium } = await import('playwright');
  const publicSet = new Set(result.published);
  const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.pdf':'application/pdf', '.xml':'application/xml', '.woff2':'font/woff2' };
  const server = http.createServer((request, response) => {
    try {
      let file = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1);
      if (!file || file.endsWith('/')) file += 'index.html';
      else if (!publicSet.has(file) && publicSet.has(file + '/index.html')) { response.writeHead(301, { Location: new URL(request.url, 'http://localhost').pathname + '/' }); response.end(); return; }
      if (!publicSet.has(file)) { response.writeHead(404); response.end('Not found'); return; }
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(path.join(siteDir || root, file)).pipe(response);
    } catch { response.writeHead(400); response.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const localOrigin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  result.browser = [];
  result.telemetrySuppressed = 0;
  try {
    browser = await chromium.launch();
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
      // Absolute production URLs must exercise this checkout too.
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        // Do not count audit traffic as real visitors. Keep analytics JS itself live.
        if (isTelemetry(url)) {
          result.telemetrySuppressed++;
          return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
        }
        if (!hosts.has(url.hostname)) return route.continue();
        const response = await context.request.get(localOrigin + url.pathname + url.search);
        return route.fulfill({ response, headers: { ...response.headers(), 'access-control-allow-origin': '*' } });
      });
      const queue = result.inventory.filter(p => p.status !== 'excluded');
      await Promise.all(Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const { file, status } = queue.shift();
        const page = await context.newPage();
        const findings = [];
        const add = (code, detail, evidence = {}) => findings.push({ code, file, width, detail, severity: 'error', ...evidence });
        page.on('pageerror', error => add('javascript-error', error.message));
        page.on('console', msg => { if (msg.type() === 'error') add('console-error', msg.text(), { url: msg.location().url, location: msg.location() }); });
        page.on('response', response => { if (response.status() >= 400) add('http-error', `${response.status()} ${response.url()}`, { url: response.url(), status: response.status(), resourceType: response.request().resourceType() }); });
        page.on('requestfailed', request => {
          if (!isTelemetry(new URL(request.url()))) add('request-failed', `${request.url()} ${request.failure()?.errorText}`, { url: request.url(), resourceType: request.resourceType(), failure: request.failure()?.errorText });
        });
        try {
          const response = await page.goto(localOrigin + pagePath(file), { waitUntil: 'load', timeout: 20000 });
          if (!response) add('navigation', 'no response');
          await page.waitForTimeout(300);
          // Scroll through lazy-loaded assets, with a bound for runaway/infinite pages.
          await page.evaluate(async () => {
            const steps = Math.min(100, Math.ceil(document.documentElement.scrollHeight / 800));
            for (let step = 1; step <= steps; step++) { scrollTo(0, step * 800); await new Promise(resolve => setTimeout(resolve, 20)); }
            scrollTo(0, 0);
          });
          await page.waitForTimeout(200);
          const state = await page.evaluate(() => ({
            viewport: innerWidth, scroll: document.documentElement.scrollWidth,
            broken: [...document.images].filter(i => i.currentSrc && (!i.complete || !i.naturalWidth)).map(i => i.currentSrc),
            overflow: [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).slice(0,8).map(e => `${e.tagName}#${e.id}.${String(e.className).slice(0,80)}`),
            board: document.querySelector('#responseMap') ? {
              initialized: document.querySelector('#responseMap').classList.contains('leaflet-container'),
              markers: document.querySelectorAll('#responseMap .leaflet-marker-icon').length,
              answers: document.querySelectorAll('#responseBodiesContent .response-item').length,
              indexLinks: document.querySelectorAll('#regionIndex .muni-link').length,
              loadedTiles: document.querySelectorAll('#responseMap img.leaflet-tile-loaded').length,
            } : null,
            media: [...document.querySelectorAll('video,audio')].map(m => ({ url: m.currentSrc, readyState: m.readyState, networkState: m.networkState, error: m.error?.code ?? null })),
          }));
          if (file === 'board-responses.html' && (!state.board?.initialized || !state.board.markers || !state.board.answers || !state.board.indexLinks))
            add('board-functionality', `Map initialization or primary answer/index content unavailable: ${JSON.stringify(state.board)}`);
          if (state.scroll > state.viewport + 1) add('horizontal-overflow', JSON.stringify(state));
          for (const image of state.broken) add('broken-image', image, { url: image, resourceType: 'image' });
          const screenshot = `${file.replace(/[^a-zA-Z0-9.-]/g, '_')}-${width}.png`;
          // Store key pages and every failure; all pages have a per-width result.
          if (file === 'index.html' || /^(membership|framework|national-archive|board-responses|documents|guide-board|contact|support|compliance|research-index)\.html$/.test(file) || findings.length)
            await page.screenshot({ path: path.join(reportDir, screenshot), fullPage: false });
          result.browser.push({ file, width, status, finalUrl: page.url(), ...state });
        } catch (error) { add('browser-navigation', error.message); result.browser.push({ file, width, status }); }
        finally {
          // Closing the test tab aborts outstanding beacons; those are not site failures.
          for (const event of ['pageerror', 'console', 'response', 'requestfailed']) page.removeAllListeners(event);
          await page.close();
          const visit = result.browser.find(v => v.file === file && v.width === width);
          const classified = classifyBrowserFindings(findings, visit.media);
          visit.errors = classified.filter(f => f.severity === 'error').length;
          visit.warnings = classified.filter(f => f.severity === 'warning').length;
          result.findings.push(...classified);
        }
        if (result.browser.length % 25 === 0) {
          fs.writeFileSync(path.join(reportDir, 'audit.partial.json'), JSON.stringify(result, null, 2));
          console.log(`Browser audit: ${result.browser.length} visits completed`);
        }
      }
      }));
      await context.close();
    }
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}

export async function runAudit({ root = process.cwd(), browser = false, siteDir, reportDir } = {}) {
  reportDir ||= fs.mkdtempSync(path.join(os.tmpdir(), 'pta-site-audit-'));
  fs.mkdirSync(reportDir, { recursive: true });
  const result = auditStatic(root, siteDir);
  applyKnownIssues(result.findings);
  try { if (browser) await auditBrowser(root, result, reportDir, siteDir); }
  catch (error) { result.findings.push({ code: 'browser-harness', file: '', detail: error.stack, severity: 'error' }); }
  const counts = result.findings.reduce((groups, item) => { (groups[item.code] ||= []).push(item); return groups; }, {});
  result.summary = { errors: result.findings.filter(f => f.severity === 'error').length, warnings: result.findings.filter(f => f.severity === 'warning').length };
  fs.writeFileSync(path.join(reportDir, 'audit.json'), JSON.stringify(result, null, 2));
  console.log(`Audit (${result.mode}): ${result.inventory.length} HTML, ${result.inventory.filter(p => p.status !== 'excluded').length} public, ${result.browser?.length || 0} browser visits; ${result.summary.errors} errors, ${result.summary.warnings} warnings. Report: ${reportDir}`);
  for (const [code, items] of Object.entries(counts)) console.log(`  ${code}: ${items.length}`);
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1]; };
  const result = await runAudit({ browser: process.argv.includes('--browser'), siteDir: arg('--site-dir'), reportDir: arg('--report') });
  if (result.findings.some(f => f.severity === 'error')) process.exitCode = 1;
}
