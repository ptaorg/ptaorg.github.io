import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const base = path.resolve(import.meta.dirname, '..');
const read = name => fs.readFileSync(path.join(base,name),'utf8');

test('important source cards fit the mobile article column', () => {
  const css = read('css/pages/key-materials.css');
  assert.match(css,/\.legacy-body\.km-page \.km-source \{/);
  assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css,/\.km-source-body \{[\s\S]{0,80}overflow-wrap:anywhere/);
});

test('original diagrams remain scrollable with semantic bidirectional controls', () => {
  const js=read('assets/legacy.js');
  const css=read('css/pages/guide-board-reading-layout.css');
  const html=read('guide-board.html');
  assert.match(js,/function markWideDiagrams\(/);
  assert.match(js,/scrollWidth > scroller\.clientWidth \+ 4/);
  assert.match(js,/図は左右にスクロールできます/);
  assert.match(js,/diagramScrollHintId/);
  assert.match(js,/scroller\.scrollBy\(/);
  assert.match(css,/\.diagram-scroll\[data-diagram-scroll-hint-id\]/);
  assert.match(html,/assets\/legacy\.js\?v=20261114-diagrams/);
});

test('four stage roadmap is one readable mobile column',()=>{
 const css=read('css/pages/guide-board-reading-layout.css');
 const html=read('guide-board.html');
 assert.match(css,/\.legacy \.roadmap-grid \{/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)!important/);
 assert.match(css,/\.legacy \.roadmap-grid > \*/);
 assert.equal((html.match(/<span class="u-989ac421e5">/g)||[]).length,4);
});

test('officer guide exit links stay within mobile viewport',()=>{
 const css=read('css/pages/guide-pta.css');
 const html=read('guide-pta.html');
 assert.match(css,/\.legacy \.u-55aeffdf70 > a \{/);
 assert.match(css,/width:100%!important/);
 assert.match(css,/white-space:normal!important/);
 assert.match(html,/guide-pta\.css\?v=20261114-readable/);
});

test('diagram controls are activated only after details disclosure opens',()=>{
 const js=read('assets/legacy.js');
 const audit=read('scripts/visual-audit.mjs');
 assert.match(js,/details:not\(\[open\]\)/);
 assert.match(js,/addEventListener\('toggle'/);
 assert.match(audit,/diagramDisclosuresOpened/);
 assert.match(audit,/node\.open=true/);
});

test('all genuine overflow is a test failure while scroll/map notes remain recorded',()=>{
 const script=read('scripts/visual-audit.mjs');
 const html=read('key-materials.html');
 assert.match(script,/outsideBreakdown\.uncontained > 0/);
 assert.match(script,/uncontainedOverflowScreens/);
 assert.match(script,/rawOutOfViewportScreens/);
 assert.match(script,/managedScrollScreens/);
 assert.match(script,/\.filter\(el => !el\.managed\)/);
 assert.match(html,/key-materials\.css\?v=20261114-mobile-fit/);
});
