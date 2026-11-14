import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('home legal boundary retains original text, figure and anchors', () => {
  const html = read('index.html');
  const start = html.indexOf('<section class="home-section home-boundary"');
  const end = html.indexOf('<section class="home-section home-practical"', start);
  assert.ok(start >= 0 && end > start, 'legal boundary section must exist');
  const section = html.slice(start, end);
  for (const identifier of ['id="boundary"','id="hc-core-title"','id="school-pta-boundary"','id="membership-in-practice"']) {
    assert.ok(section.includes(identifier),identifier);
  }
  assert.ok(section.includes('relationship-svg is-desktop'));
  assert.ok(section.includes('relationship-svg is-mobile'));
  assert.ok(html.includes('assets/style.css?v=20261114-readable'));
});

test('legal boundary is a full-width responsive editorial grid', () => {
  const css = read('assets/style.css');
  const start = css.lastIndexOf('/* Home boundary: balanced editorial/diagram composition | 2026-11-14 */');
  assert.ok(start >= 0, 'legal boundary styles present');
  const scoped = css.slice(start);
  assert.match(scoped, /#boundary \.migration-home\s*\{[^}]*max-width:1180px/s);
  assert.match(scoped, /#boundary \.hc-core-head > p,\s*body\[data-page="home"\] #boundary \.hc-boundary-prose > p,[\s\S]*?max-width:none/s);
  assert.match(scoped, /@media \(min-width:901px\)[\s\S]*?grid-template-columns:minmax\(0, \.85fr\) minmax\(0, 1\.15fr\)/);
  assert.match(scoped, /#boundary #school-pta-boundary\s*\{[^}]*width:100%;[^}]*max-width:none/s);
  assert.match(scoped, /#boundary #membership-in-practice\s*\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/s);
  assert.match(scoped, /@media \(max-width:900px\)/);
  assert.match(scoped, /@media \(max-width:760px\)[\s\S]*?\.relationship-svg\.is-mobile\s*\{\s*display:block/s);
});
