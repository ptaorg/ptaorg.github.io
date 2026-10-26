import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const index = JSON.parse(fs.readFileSync(path.join(root, 'data/research-map-index.json'), 'utf8'));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.RESEARCH_BROWSER_PATH ? { executablePath: process.env.RESEARCH_BROWSER_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage'] } : {}) });
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 950 } });
    page.setDefaultTimeout(7000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Deterministic offline fallback; optional local Leaflet package exercises real markers.
    await page.route('**/*', route => {
      const url = route.request().url();
      if (new URL(url).origin === origin) return route.continue();
      if (process.env.RESEARCH_LEAFLET_ROOT && /leaflet@1\.9\.4\/dist\/leaflet\.(js|css)$/.test(url)) {
        const extension = url.endsWith('.js') ? 'js' : 'css';
        return route.fulfill({ path: path.join(process.env.RESEARCH_LEAFLET_ROOT, 'dist', 'leaflet.' + extension), contentType: extension === 'js' ? 'text/javascript' : 'text/css' });
      }
      return route.abort();
    });
    async function readableScreenshot(file) {
      if (process.env.RESEARCH_JAPANESE_FONT) {
        const font = process.env.RESEARCH_JAPANESE_FONT;
        const css = fs.statSync(font).isDirectory()
          ? fs.readFileSync(path.join(font, '400.css'), 'utf8').replace(/url\(\.\/([^)]*)\)/g, (_, file) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(font, file)).toString('base64')})`)
          : `@font-face { font-family: "Noto Sans JP"; src: url(data:font/woff2;base64,${fs.readFileSync(font).toString('base64')}) format('woff2'); }`;
        await page.addStyleTag({ content: css + ' body, body * { font-family: "Noto Sans JP", sans-serif !important; }' });
        await page.evaluate(() => document.fonts.ready);
      }
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: file, fullPage: false });
    }
    await page.goto(origin + '/research-map.html');
    await page.waitForFunction(() => document.querySelector('#research-result-status').textContent.includes('地域 ／'));
    await page.waitForSelector('#national-primary-survey .research-region');
    assert.equal(await page.locator('#national-primary-survey .research-region').count(), 48, 'survey record count');
    await page.locator('.research-survey-filters input').fill('川崎市');
    assert.equal(await page.locator('#national-primary-survey .research-region').count(), 1, 'survey search');
    await page.locator('.research-survey-filters input').fill('');
    await page.locator('.research-survey-filters select').selectOption('原本確認');
    assert.equal(await page.locator('#national-primary-survey .research-region').count(), 39, 'survey evidence filter');
    await page.locator('.research-survey-filters select').selectOption('');
    assert.equal(await page.locator('#national-primary-survey .research-region').count(), 48);
    assert.equal(await page.locator('#national-primary-survey a[href*="mail.google.com"]').count(), 0, 'no private mail links');
    if (process.env.RESEARCH_LEAFLET_ROOT) {
      await page.waitForSelector('.leaflet-interactive');
      const expected = new Set(index.municipalities.filter(m => m.coordinates).map(m => m.coordinates.join(','))).size;
      assert.equal(await page.locator('.leaflet-interactive').count(), expected);
    }
    await readableScreenshot(`/tmp/pta-research-top-${width}${process.env.RESEARCH_JAPANESE_FONT ? "-jp" : ""}.png`);
    if (process.env.RESEARCH_LEAFLET_ROOT) {
      await page.locator('[data-research-map]').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `/tmp/pta-research-map-area-${width}${process.env.RESEARCH_JAPANESE_FONT ? '-jp' : ''}.png` });
    }
    const visible = () => page.locator('[data-region]:visible');
    assert.equal(await visible().count(), index.municipalities.length);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px horizontal overflow`);
    assert.ok(await page.locator('#research-map-message').textContent());

    await page.locator('#research-query').fill('川口市');
    assert.equal(await visible().count(), 1);
    assert.match(await visible().textContent(), /川口市/);
    assert.equal(new URL(page.url()).searchParams.get('query'), '川口市');
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#research-query').value === '川口市');
    assert.equal(await visible().count(), 1);
    await page.locator('button[type=reset]').click();
    await page.waitForFunction(total => document.querySelectorAll('[data-region]:not([hidden])').length === total, index.municipalities.length);
    assert.equal(await visible().count(), index.municipalities.length);

    await page.locator('#research-mode').selectOption('学校別資料');
    assert.equal(await visible().count(), index.municipalities.filter(m => m.schools.length).length);
    assert.equal(await page.locator('[data-region]:visible details:not([open])').count(), 0);
    await page.locator('#research-school').selectOption('中学校');
    assert.equal(await visible().count(), index.municipalities.filter(m => m.schools.some(s => s.type === '中学校')).length);
    assert.equal(await page.locator('[data-region]:visible [data-school-type]:not([hidden])').evaluateAll(items => items.every(li => li.dataset.schoolType === '中学校')), true);
    await page.locator('button[type=reset]').click();
    await page.waitForFunction(total => document.querySelectorAll('[data-region]:not([hidden])').length === total, index.municipalities.length);

    for (const [field, choice, predicate] of [
      ['prefecture', '埼玉県', m => m.prefecture === '埼玉県'],
      ['city', '川口市', m => m.name === '川口市'],
      ['publication', '公開前確認中', m => m.schools.some(s => s.documents.some(d => d.status === '公開前確認中'))],
      ['response', '掲載確認', m => m.flags?.administrativeResponse === 'confirmed' || m.flags?.administrativeResponse === true || m.boardResponses?.length > 0],
      ['audit', '掲載確認', m => m.flags?.audit === 'confirmed' || m.flags?.audit === true],
      ['improvement', '掲載確認', m => m.flags?.improvement === 'confirmed' || m.flags?.improvement === true],
    ]) {
      await page.locator('#research-' + field).selectOption(choice);
      assert.equal(await visible().count(), index.municipalities.filter(predicate).length, field + ' filter');
      await page.locator('#research-' + field).selectOption('');
    }

    const theme = index.themes.find(t => index.municipalities.some(m => m.themes.includes(t)));
    await page.locator('#research-theme').selectOption(theme);
    assert.equal(await visible().count(), index.municipalities.filter(m => m.themes.includes(theme)).length);
    const note = index.municipalities.find(m => m.url && m.themes.includes(theme));
    await page.locator(`[data-region="${note.id}"] h3 a`).click();
    await page.waitForURL(origin + note.url);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px note overflow`);
    await readableScreenshot(`/tmp/pta-research-note-${width}${process.env.RESEARCH_JAPANESE_FONT ? "-jp" : ""}.png`);
    await page.goBack();
    await page.waitForFunction(theme => document.querySelector('#research-theme').value === theme, theme);
    assert.equal(await visible().count(), index.municipalities.filter(m => m.themes.includes(theme)).length);
    await readableScreenshot(`/tmp/pta-research-map-${width}${process.env.RESEARCH_JAPANESE_FONT ? "-jp" : ""}.png`);
    if (process.env.RESEARCH_LEAFLET_ROOT) {
      await page.locator('button[type=reset]').click();
      await page.waitForFunction(total => document.querySelectorAll('[data-region]:not([hidden])').length === total, index.municipalities.length);
      await page.locator('#research-query').fill('川口市');
      await page.locator('#research-mode').selectOption('学校別資料');
      await page.locator('[data-research-map]').scrollIntoViewIfNeeded();
      await page.locator('.leaflet-interactive').click();
      await page.locator('.leaflet-popup-content a').click();
      assert.ok(new URL(page.url()).hash.startsWith('#region-'));
      assert.equal(await page.locator('[data-region="kawaguchi"] details').getAttribute('open'), '');
      await page.locator('#research-mode').selectOption('自治体研究');
      await page.locator('[data-research-map]').scrollIntoViewIfNeeded();
      await page.locator('.leaflet-interactive').click();
      await page.locator('.leaflet-popup-content a').click();
      await page.waitForURL(origin + '/research/kawaguchi.html');
    }

    await page.goto(origin + '/national-archive.html');
    assert.equal(await page.locator('[data-research-map]').count(), 1);
    assert.equal(await page.locator('a[href="/research-map.html"]').count() > 0, true);
    assert.deepEqual(errors, [], `${width}px JavaScript errors`);
    await page.close();
    const noJS = await browser.newPage({ javaScriptEnabled: false, viewport: { width, height: 950 } });
    await noJS.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await noJS.goto(origin + '/research-map.html');
    assert.equal(await noJS.locator('[data-region]').count(), index.municipalities.length);
    assert.equal(await noJS.locator('#national-primary-survey .survey-record').count(), 48, 'static national survey readable without JavaScript');
    await noJS.goto(origin + '/research/osaka.html');
    assert.ok(await noJS.locator('main').textContent());
    assert.equal(await noJS.locator('h2').count() >= 8, true);
    await noJS.close();
    console.log(`${width}px: all filters, search/URL restore, modes, navigation, no-JS content, overflow${process.env.RESEARCH_LEAFLET_ROOT ? ", real Leaflet markers and native popup clicks" : ", CDN failure fallback"} passed`);
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
