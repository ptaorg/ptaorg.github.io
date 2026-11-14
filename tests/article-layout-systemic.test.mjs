import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('the shared article layout always puts the reading column before the right TOC', () => {
  const css = read('assets/style.css');
  assert.doesNotMatch(css, /grid-template-columns:\s*(?:270px|260px|minmax\(210px,250px\))\s+minmax\(0,1fr\)/, 'old sidebar-first article grid survived');
  assert.match(css, /body\[data-page="legacy"\] \.article-layout\{grid-template-columns:minmax\(0,1fr\) minmax\(210px,250px\)/);
  assert.match(css, /\.article-layout>\.article-main\{grid-column:1;grid-row:1\}/);
  assert.match(css, /\.article-layout>\.article-side\{grid-column:2;grid-row:1\}/);
  assert.match(css, /@media\(max-width:1040px\)\{[\s\S]*?body\[data-page="legacy"\] \.article-layout\{grid-template-columns:1fr\}/);
});

test('shared prose rules do not apply a second narrow paragraph column', () => {
  const base = read('assets/style.css');
  const prose = read('css/prose.css');
  assert.doesNotMatch(base, /max-width:40em;overflow-wrap:break-word/);
  assert.doesNotMatch(prose, /max-width:\s*78ch\s*;/);
  assert.doesNotMatch(prose, /:where\(\[class\$="-grid"\]/, 'prose must not flatten every class ending -grid');
  assert.match(prose, /\.legacy\[data-content-mode="prose"\] :where\(\.legacy-main, body > article, section\) > p\s*\{[^}]*max-width:\s*100%/);
});

test('membership article does not create a nested 920px / 76ch column', () => {
  const styles = read('css/pages/membership.css');
  const idx = styles.indexOf('/* 2026-09-20: membership.html current prose layout.');
  assert.ok(idx >= 0);
  const current = styles.slice(idx);
  assert.doesNotMatch(current, /max-width:\s*(?:76ch|920px)\s*;/);
  assert.doesNotMatch(current, /width:\s*min\(calc\(100% - (?:30|48)px\)/);
  assert.match(current, /\.legacy\.membership-editorial \.editorial-main\.prose-page\s*\{\s*width:\s*100%;\s*max-width:\s*none;/);
  const html = read('membership.html');
  assert.ok(html.includes('class="article-layout"'));
  assert.ok(html.includes('class="article-side"'));
  assert.ok(html.includes('class="article-main"'));
  assert.ok(html.includes('id="principle"') && html.includes('id="sec-10"'));
  assert.ok(html.includes('assets/style.css?v=20261114-readable'));
  assert.ok(html.includes('css/pages/membership.css?v=20261114-article-width'));
  assert.ok(html.includes('css/prose.css?v=20261114-preserve-grids'));
});
