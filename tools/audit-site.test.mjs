import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import generatedChecker from '../scripts/check-generated-files.js';
import { auditStatic, documentInfo, pagePath, publicationFilter, srcsetUrls, auditBrowser, applyKnownIssues, classifyBrowserFindings } from './audit-site.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pta-audit-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, value) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), value); };
  write('_config.yml', 'exclude:\n  - tools/\n  - docs/\n');
  write('robots.txt', 'User-agent: *\nAllow: /\nSitemap: https://ptaorg.com/sitemap.xml\n');
  write('sitemap.xml', '<urlset><url><loc>https://ptaorg.com/</loc></url></urlset>');
  const html = '<!doctype html><html><head><meta name="description" content="Fixture"><link rel="canonical" href="https://ptaorg.com/"></head><body><h1 id="ok">Fixture</h1></body></html>';
  write('index.html', html);
  return { root, write, html };
}
test('valid site passes; URL encoding, exclusions, inert markup and srcset are understood', t => {
  const { root, write } = fixture(t);
  write('docs/notes.html', '<p id="same"></p><p id="same"></p>');
  write('assets/docs/public.pdf', '%PDF-1.7');
  assert.deepEqual(auditStatic(root).findings, []);
  assert.equal(auditStatic(root).inventory.find(p => p.file === 'docs/notes.html').status, 'excluded');
  assert.equal(pagePath('日本/index.html'), '/%E6%97%A5%E6%9C%AC/');
  assert.equal(publicationFilter({ exclude: ['starter-kit/*.md'] })('starter-kit/notes.md'), false);
  assert.equal(publicationFilter({ exclude: ['starter-kit/*.md'] })('starter-kit/assets/README.md'), false);
  assert.equal(publicationFilter({ exclude: ['starter-kit/*.md'] })('starter-kit/assets/image.png'), true);
  assert.deepEqual(srcsetUrls('one.png 1x, two.png 2x'), ['one.png', 'two.png']);
  assert.deepEqual(srcsetUrls('data:image/png;base64,AA 1x, two.png 2x'), ['data:image/png;base64,AA', 'two.png']);
  assert.deepEqual([...documentInfo('<script>"<p id=fake>"</script><!-- <p id=fake> --><template><p id=fake></template><p id=real>').ids], ['real']);
});
test('detects broken links, assets, fragments, case mismatches, duplicate IDs and metadata', t => {
  const { root, write, html } = fixture(t);
  write('index.html', html.replace('</body>', '<a href="//ptaorg.com/missing.pdf">bad</a><a href="#absent">bad</a><img src="Photo.png"><img srcset="missing.png 1x, other.png 2x"><p id="ok"></p></body>').replace('</head>', '<meta name=description content=""></head>'));
  write('photo.png', 'invalid');
  const codes = auditStatic(root).findings.map(f => f.code);
  for (const code of ['internal-reference', 'fragment', 'duplicate-id', 'meta-description', 'asset-signature']) assert.ok(codes.includes(code), code);
});
test('sitemap and robots mismatches fail, including previously unlisted HTML', t => {
  const { root, write, html } = fixture(t);
  write('unlisted.html', html.replace('https://ptaorg.com/', 'https://ptaorg.com/unlisted.html'));
  write('robots.txt', 'User-agent: *\nDisallow: /\nSitemap: https://ptaorg.com/sitemap.xml\n');
  write('sitemap.xml', '<urlset><url><loc>https://ptaorg.com/</loc></url><url><loc>https://ptaorg.com/</loc></url></urlset>');
  const codes = auditStatic(root).findings.map(f => f.code);
  for (const code of ['sitemap-missing', 'sitemap-target', 'sitemap-duplicate']) assert.ok(codes.includes(code), code);
  write('index.html', html.replace('</head>', '<meta name=robots content="index,noindex"></head>'));
  assert.ok(auditStatic(root).findings.some(f => f.code === 'robots-conflict'));
});
test('actual publication detects excluded files and inspects built HTML', t => {
  const { root, write, html } = fixture(t);
  write('build/index.html', html.replace('</body>', '<p id=ok></p></body>'));
  write('build/tools/work.txt', 'work');
  write('build/node_modules/leak.js', 'work');
  write('build/assets/README.html', html);
  const result = auditStatic(root, path.join(root, 'build'));
  assert.ok(result.findings.some(f => f.code === 'duplicate-id' && f.file === 'index.html'));
  assert.equal(result.findings.filter(f => f.code === 'published-work-file').length, 3);
});
test('Chromium detects JS, console, 404, bad images and horizontal overflow at both widths', async t => {
  const { root, write, html } = fixture(t);
  write('index.html', html.replace('</body>', '<div style="width:2000px">wide</div><img src="missing.png"><script>console.error("fixture console");throw Error("fixture exception")</script></body>'));
  const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pta-browser-test-'));
  t.after(() => fs.rmSync(reportDir, { recursive: true, force: true }));
  const result = auditStatic(root);
  await auditBrowser(root, result, reportDir);
  for (const width of [1440, 390]) for (const code of ['javascript-error', 'console-error', 'http-error', 'broken-image', 'horizontal-overflow'])
    assert.ok(result.findings.some(f => f.width === width && f.code === code), `${width}: ${code}`);
});
test('absolute production URLs are served from the checkout without protocol errors', async t => {
  const { root, write, html } = fixture(t);
  write('index.html', html.replace('</body>', '<script src="https://ptaorg.com/local.js"></script></body>'));
  write('local.js', 'console.error("local absolute script executed"); navigator.sendBeacon("https://analytics.google.com/g/collect", "fixture")');
  const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pta-absolute-test-'));
  t.after(() => fs.rmSync(reportDir, { recursive: true, force: true }));
  const result = auditStatic(root);
  await auditBrowser(root, result, reportDir);
  assert.equal(result.findings.filter(f => f.code === 'console-error' && f.detail === 'local absolute script executed').length, 2);
  assert.ok(!result.findings.some(f => ['request-failed', 'browser-navigation', 'http-error'].includes(f.code)));
  assert.equal(result.telemetrySuppressed, 2);
});
test('noindex SEO omissions are valid; malformed supplied metadata and dead canonical sections still fail', t => {
  const { root, write } = fixture(t);
  write('legacy.html', '<meta name=robots content=noindex><p>Download or print document</p>');
  assert.ok(!auditStatic(root).findings.some(f => f.file === 'legacy.html'));
  write('legacy.html', '<meta name=robots content=noindex><link rel=canonical href="https://ptaorg.com/#ok">');
  assert.equal(auditStatic(root).findings.find(f => f.code === 'canonical-fragment').severity, 'warning');
  write('legacy.html', '<meta name=robots content=noindex><link rel=canonical href="https://ptaorg.com/#missing"><meta name=description content=""><meta name=description content=duplicate>');
  const failures = auditStatic(root).findings.filter(f => f.severity === 'error');
  assert.ok(failures.some(f => f.code === 'fragment'));
  assert.ok(failures.some(f => f.code === 'meta-description'));
  write('legacy.html', '<meta name=robots content=noindex><link rel=canonical href="https://ptaorg.com/missing.html">');
  assert.ok(auditStatic(root).findings.some(f => f.code === 'canonical' && f.severity === 'error'));
});
test('known issues match exactly once; new, duplicated and resolved findings cannot silently pass', () => {
  const entry = { code: 'fragment', file: 'old.html', detail: '/target.html#old', reason: 'Reviewed existing issue' };
  const known = { ...entry, severity: 'error' };
  const newer = { ...known, detail: '/target.html#new' };
  const classified = applyKnownIssues([{ ...known }, newer], [entry]);
  assert.equal(classified[0].severity, 'warning');
  assert.equal(classified[1].severity, 'error');
  assert.equal(applyKnownIssues([], [entry])[0].code, 'known-issue-stale');
  assert.ok(applyKnownIssues([{ ...known }, { ...known }], [entry]).every(f => f.severity === 'error'));
});
test('only evidenced optional tile failures are warnings; JS, CDN and first-party failures remain errors', () => {
  const url = 'https://a.tile.openstreetmap.org/4/16/5.png';
  const network = { code: 'http-error', url, resourceType: 'image', status: 400, detail: `400 ${url}`, severity: 'error' };
  const consoleError = { code: 'console-error', url, detail: 'Failed to load resource: the server responded with a status of 400 ()', severity: 'error' };
  assert.ok(classifyBrowserFindings([network, consoleError]).every(f => f.severity === 'warning'));
  assert.equal(classifyBrowserFindings([consoleError])[0].severity, 'error');
  const aborted = classifyBrowserFindings([{ ...network, code: 'request-failed', failure: 'net::ERR_ABORTED' }])[0];
  assert.equal(aborted.category, 'map-request-cancelled');
  const dangerous = [
    { ...network, url: 'http://127.0.0.1/missing.png' },
    { ...network, url: 'https://ptaorg.com/missing.png' },
    { ...network, url: 'https://cdn.example.com/leaflet.js', resourceType: 'script' },
    { ...network, resourceType: 'script' },
    { ...consoleError, detail: 'Application exception' },
    { ...network, code: 'javascript-error' },
  ];
  assert.ok(classifyBrowserFindings(dangerous).every(f => f.severity === 'error'));
});
test('generated text comparison ignores CRLF only, never actual content or whitespace changes', () => {
  const same = generatedChecker.sameGeneratedContent;
  assert.equal(same(Buffer.from('本文\r\nnext\r\n'), Buffer.from('本文\nnext\n')), true);
  assert.equal(same(Buffer.from('本文\n'), Buffer.from('短縮本文\n')), false);
  assert.equal(same(Buffer.from('a  b\n'), Buffer.from('a b\n')), false);
  assert.equal(same(Buffer.from('a\rb'), Buffer.from('a\nb')), false);
});
test('a cancelled media preload is only a warning with healthy loaded metadata evidence', () => {
  const f = { code: 'request-failed', resourceType: 'media', failure: 'net::ERR_ABORTED', url: 'http://127.0.0.1/movie.mp4', severity: 'error' };
  const healthy = [{ url: f.url, readyState: 1, error: null }];
  assert.equal(classifyBrowserFindings([f], healthy)[0].category, 'browser-media-cancelled');
  assert.equal(classifyBrowserFindings([f])[0].severity, 'error');
  assert.equal(classifyBrowserFindings([f], [{ ...healthy[0], error: 3 }])[0].severity, 'error');
  assert.equal(classifyBrowserFindings([{ ...f, failure: 'net::ERR_FAILED' }], healthy)[0].severity, 'error');
});
test('missing board UI remains fatal even when map tiles would be optional', async t => {
  const { root, write } = fixture(t);
  write('board-responses.html', '<meta name=robots content=noindex><div id=responseMap></div>');
  const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pta-board-test-'));
  t.after(() => fs.rmSync(reportDir, { recursive: true, force: true }));
  const result = auditStatic(root);
  await auditBrowser(root, result, reportDir);
  assert.equal(result.findings.filter(f => f.code === 'board-functionality' && f.severity === 'error').length, 2);
});
