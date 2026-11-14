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
