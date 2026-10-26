import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
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
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Deterministic offline test: no external CDN, map tiles, analytics or fonts.
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(origin + '/research-map.html');
    await page.waitForFunction(() => document.querySelector('#research-result-status').textContent.includes('地域 ／'));
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

    const theme = index.themes.find(t => index.municipalities.some(m => m.themes.includes(t)));
    await page.locator('#research-theme').selectOption(theme);
    assert.equal(await visible().count(), index.municipalities.filter(m => m.themes.includes(theme)).length);
    const note = index.municipalities.find(m => m.url && m.themes.includes(theme));
    await page.locator(`[data-region="${note.id}"] h3 a`).click();
    await page.waitForURL(origin + note.url);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px note overflow`);
    await page.screenshot({ path: `/tmp/pta-research-note-${width}.png`, fullPage: false });
    await page.goBack();
    await page.waitForFunction(theme => document.querySelector('#research-theme').value === theme, theme);
    assert.equal(await visible().count(), index.municipalities.filter(m => m.themes.includes(theme)).length);
    await page.screenshot({ path: `/tmp/pta-research-map-${width}.png`, fullPage: false });

    await page.goto(origin + '/national-archive.html');
    assert.equal(await page.locator('[data-research-map]').count(), 1);
    assert.equal(await page.locator('a[href="/research-map.html"]').count() > 0, true);
    assert.deepEqual(errors, [], `${width}px JavaScript errors`);
    await page.close();
    console.log(`${width}px: search, URL restore, modes, school filter, theme, navigation, offline fallback and overflow passed`);
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
