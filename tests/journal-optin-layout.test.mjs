import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('journal body occupies broad left column and TOC a narrow right column',()=>{
  const css=read('assets/style.css');
  const mark=css.slice(css.indexOf('/* Repair: article body left / table of contents right (2026-11-14) */'));
  assert.match(mark,/grid-template-columns:minmax\(0,1fr\) minmax\(220px,260px\)/);
  assert.match(mark,/\.article-layout > \.article-main\s*\{\s*grid-column:1/);
  assert.match(mark,/\.article-layout > \.article-side\s*\{\s*grid-column:2/);
});

test('opt-in and opt-out comparison survives prose-mode CSS and collapses on mobile',()=>{
  const css=read('css/pages/journal-pta-membership-optin-record.css');
  const mark=css.slice(css.indexOf('/* Restore side-by-side opt-in vs opt-out diagram'));
  assert.match(mark,/\.legacy\[data-content-mode="prose"\]\.optin-reason-article \.membership-flow-grid/);
  assert.match(mark,/display:grid !important/);
  assert.match(mark,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\) !important/);
  assert.match(mark,/@media \(max-width:760px\)/);
  assert.match(mark,/grid-template-columns:minmax\(0,1fr\) !important/);
  const html=read('journal/pta-membership-optin-record.html');
  assert.equal((html.match(/class="membership-flow membership-flow--optin"/g)||[]).length,1);
  assert.equal((html.match(/class="membership-flow membership-flow--optout"/g)||[]).length,1);
  assert.match(html,/\.css\?v=20261114-optin-layout/);
});
