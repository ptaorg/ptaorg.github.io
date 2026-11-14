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
  assert.match(page,/css\/pages\/guide-board-reading-layout\.css\?v=20261114[a-z0-9-]+/);
  assert.ok(page.includes('assets/style.css?v=20261114-readable'));
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(238px,270px\)/);
  assert.match(css,/\.legacy\.guide-board-text-first :is\([\s\S]*?\)\s*\{[\s\S]*?width:100% !important;[\s\S]*?max-width:none !important;/);
  assert.match(css,/\.guide-toc-details > \.toc-list\s*\{\s*max-height:min\(46vh,440px\)/);
  assert.match(css,/@media\(max-width:1040px\)/);
  assert.match(css,/@media\(max-width:600px\)/);
});


test('school-information block is a balanced two-panel layout with full-width caution',()=>{
  const start=page.indexOf('<section aria-labelledby="principal-liability-title" id="principal-liability">');
  const end=page.indexOf('</section>',start);
  assert.ok(start>=0&&end>start);
  const block=page.slice(start,end+10);
  assert.ok(block.includes('class="principal-liability-grid"'));
  assert.ok(block.includes('class="principal-liability-text"'));
  assert.ok(block.includes('class="principal-liability-checks"'));
  assert.ok(block.includes('id="principal-liability-checks-title"'));
  assert.equal((block.match(/<li>/g)||[]).length,6);
  assert.ok(block.indexOf('class="principal-liability-caution"')>block.indexOf('</aside>'),'caution spans both columns');
  assert.ok(block.includes('学校保有情報の扱いは、校長の管理責任に直結する'));
  assert.ok(block.includes('学校連絡アプリ、学校メール、児童経由配布'));
  const marker='/* School-information section: explanation + checklist as one balanced composition. */';
  assert.ok(css.includes(marker));
  const scoped=css.slice(css.lastIndexOf(marker));
  assert.ok(scoped.includes('grid-template-columns:repeat(auto-fit,minmax(min(100%,390px),1fr))'));
  assert.ok(scoped.includes('@media(max-width:760px)'));
  assert.ok(scoped.includes('.principal-liability-caution'));
});

test('mobile executive brief does not expand to its 781px min-content width',()=>{
  assert.match(css, /@media\(max-width:1040px\)[\s\S]*?\.gbv-head\s*\{\s*grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /\.gbv-head > \*\s*\{\s*min-width:0;/);
});
