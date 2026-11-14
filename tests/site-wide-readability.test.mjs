import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=filename=>fs.readFileSync(path.join(root,filename),'utf8');

test('all site templates share a centered 1200px frame and a narrower article frame',()=>{
  const css=read('assets/style.css');
  const i=css.lastIndexOf('/* Site-wide readable page grid | 2026-11-14 */');
  assert.ok(i>=0,'readability layer exists');
  const layer=css.slice(i);
  for(const token of [
    '--container:1200px','--reading-container:1120px',
    '--reading-rail:248px','--reading-gap:44px',
    '--gutter:clamp(20px,3vw,36px)'
  ])assert.ok(layer.includes(token),token);
  assert.match(layer,/#main \.container:has\(> \.article-layout\)\s*\{\s*max-width:calc\(var\(--reading-container\) \+ var\(--gutter\) \* 2\)/);
  assert.match(layer,/@media\(min-width:1041px\)\s*\{\s*#main \.container:has\(> \.article-layout\) > \.article-layout/);
  assert.match(layer,/@media\(max-width:1040px\)/);
  assert.match(layer,/@media\(max-width:760px\)/);
});

test('shared header keeps the complete organization name on one line',()=>{
  const css=read('assets/style.css');
  const i=css.lastIndexOf('/* Site-wide readable page grid | 2026-11-14 */');
  const layer=css.slice(i);
  assert.match(layer,/\.site-header \.header-inner > \.brand\s*\{[^}]*flex:0 0 auto/);
  assert.match(layer,/\.site-header \.brand-type > strong\s*\{[^}]*white-space:nowrap/);
  assert.match(layer,/@media\(max-width:420px\)/);
  const header=read('partials/header.html');
  assert.ok(header.includes('<strong>PTA適正化推進委員会</strong>'));
});

test('shared reading margins preserve wide tables, figures and paragraphs',()=>{
  const css=read('assets/style.css');
  const layer=css.slice(css.lastIndexOf('/* Site-wide readable page grid | 2026-11-14 */'));
  assert.match(layer,/#main \.article-layout > \.article-main :is\(p,li,dd,blockquote\)\s*\{\s*line-height:1\.9/);
  assert.match(layer, /margin-block:0 1\.22em/);
  assert.match(layer, /#main \.article-layout > \.article-main :is\(table,figure,pre,\.table-scroll,\.diagram-figure\)\s*\{[^}]*max-width:100%/);
  const imported=read('assets/legacy-theme.css');
  assert.ok(imported.includes('/* Shared document reading measure | 2026-11-14 */'));
  assert.ok(imported.includes('var(--reading-container,1120px)'));
  for(const file of [
    'index.html','explore.html','municipality.html','school.html',
    'guide-board.html','membership.html','journal/pta-membership-optin-record.html'
  ]){
    assert.ok(read(file).includes('assets/style.css'),file+' uses the shared stylesheet');
  }
});
