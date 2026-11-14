import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const page=read('guide-board.html');
const css=read('css/pages/guide-board-reading-layout.css');

test('guide-board retains both the original detailed TOC and six readable chapter shortcuts',()=>{
  const start=page.indexOf('<nav class="side-box side-toc guide-sidebar-toc"');
  const end=page.indexOf('</nav>',start);
  assert.ok(start>=0&&end>start,'sidebar TOC exists');
  const toc=page.slice(start,end+6);
  assert.match(toc,/<ol class="guide-chapter-links">/);
  assert.match(toc,/<details class="guide-toc-details">/);
  assert.match(toc,/<ol class="toc-list">/);
  assert.equal((toc.match(/class="chapter-no"/g)||[]).length,6);
  assert.equal((toc.match(/class="toc-no"/g)||[]).length,38);
  for(const anchor of ['guide-entry-board-title','board-first-reading','municipal-voices','sec-34','sec-41','sec-46']){
    assert.ok(toc.includes('href="#'+anchor+'"'),anchor);
    assert.ok(page.includes('id="'+anchor+'"'),anchor+' target');
  }
  assert.match(toc,/全38項目の詳細目次を表示/);
});
test('reading column is wide and sidebar is narrow, with tablet and mobile fallbacks',()=>{
  assert.ok(page.includes('css/pages/guide-board-reading-layout.css?v=20261114a'));
  assert.ok(page.includes('assets/style.css?v=20261114-guide'));
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(238px,270px\)/);
  assert.match(css,/\.legacy\.guide-board-text-first :is\([\s\S]*?\)\s*\{[\s\S]*?width:100% !important;[\s\S]*?max-width:none !important;/);
  assert.match(css,/\.guide-toc-details > \.toc-list\s*\{\s*max-height:min\(46vh,440px\)/);
  assert.match(css,/@media\(max-width:1040px\)/);
  assert.match(css,/@media\(max-width:600px\)/);
});
