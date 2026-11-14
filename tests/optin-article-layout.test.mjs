import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = filename => fs.readFileSync(path.join(root, filename), 'utf8');

test('opt-in essay loads its width/diagram fix after the old styles', () => {
  const html = read('journal/pta-membership-optin-record.html');
  const stylesheet = '../css/pages/journal-pta-membership-optin-record-layout-fix.css?v=20261114c';
  assert.ok(html.includes(stylesheet));
  assert.ok(html.indexOf(stylesheet) > html.indexOf('phase3-guide-chapters.css'));
  assert.ok(html.includes('class="article-main"'));
  assert.ok(html.includes('class="membership-chain"'));
  assert.ok(html.includes('class="membership-flow-grid"'));
});

test('opt-in essay fills its column and its six-step diagram uses it', () => {
  const css = read('css/pages/journal-pta-membership-optin-record-layout-fix.css');
  assert.match(css, /journal-article-body :is\(p,li,dd,blockquote\)\s*\{\s*max-width: 100% !important/);
  assert.match(css, /membership-chain\s*\{[^}]*width: 100% !important;[^}]*max-width: none !important;[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) !important/s);
  assert.match(css, /@media \(max-width: 1100px\)[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\) !important/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*?grid-template-columns: minmax\(0, 1fr\) !important/);
  assert.match(css, /membership-chain > li::after\s*\{\s*display: none !important/);
});
