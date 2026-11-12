import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('five canonical dropdown groups have no more than five entries',()=>{
 const h=read('partials/header.html');
 assert.match(h,/教育委員会に照会する書式/);
 assert.ok((h.match(/<a\b/g)||[]).length<=24);
 const groups=[...h.matchAll(/<ul class="nav-panel" data-panel="[^"]+">([\s\S]*?)<\/ul>/g)];
 assert.equal(groups.length,5);
 for(const [,part] of groups)assert.ok((part.match(/<li>/g)||[]).length<=5);
});
test('footer has one informational column, not duplicated role/topic panels',()=>{
 const f=read('partials/footer.html');
 assert.ok(!f.includes('aria-label="立場別"'));
 assert.ok(!f.includes('aria-label="論点"'));
 assert.ok(!f.includes('support-band'));
 assert.ok((f.match(/<a\b/g)||[]).length<=11);
});
test('six representative pages have no top search bar, generic chips, or repeated readmore list',()=>{
 for(const p of ['guide-parent.html','guide-board.html','privacy.html','membership.html','journal/matsuyama-pta-fee-unification-20261013.html','archive/ota/school-001-es/index.html']){
  const html=read(p);
  assert.doesNotMatch(html,/<form class="search-panel search-panel-bar"/,p);
  assert.match(html,/教育委員会に照会する書式/);
  if(html.includes('<aside class="article-side">')){
   const aside=html.match(/<aside class="article-side">[\s\S]*?<\/aside>/)?.[0]||'';
   assert.ok(!aside.includes('関連する論点'),p);
   const sections=[...aside.matchAll(/<section class="side-box">[\s\S]*?<\/section>/g)].map(x=>x[0]);
   for(const sec of sections)if(sec.includes('関連資料'))assert.ok((sec.match(/<li>/g)||[]).length<=3,p);
  }
  if(html.includes('class="next-read"'))assert.ok(!html.includes('<section class="readmore">'),p);
 }
 assert.match(read('index.html'),/class="search-panel"/);
 assert.match(read('explore.html'),/class="search-panel search-panel-compact"/);
});
