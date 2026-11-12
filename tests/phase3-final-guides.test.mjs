import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
test('Both long guides have a static overview, six chapters, and exact anchor targets',()=>{
 for(const p of ['guide-board.html','guide-pta.html']){
  const s=read(p),overview=s.match(/<nav class="phase3-guide-map"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(overview,p+' no overview');
  assert.equal((overview.match(/<li>/g)||[]).length,6,p);
  assert.equal((s.match(/class="phase3-chapter-intro"/g)||[]).length,6,p);
  for(const id of [...overview.matchAll(/href="#([^"]+)"/g)].map(x=>x[1]))assert.ok(s.includes('id="'+id+'"'),p+': '+id);
  for(const b of s.matchAll(/<section class="phase3-chapter-intro"[\s\S]*?<\/section>/g))assert.equal((b[0].match(/class="phase3-chapter-points"/g)||[]).length,1,p);
 }
});
test('source and editorial section labels survive, redundant guide kickers disappear',()=>{
 const board=read('guide-board.html'),pta=read('guide-pta.html'),parent=read('guide-parent.html');
 assert.match(board,/class="section-kicker"[^>]*>一次資料/);
 for(const s of [board,pta,parent])assert.ok(!s.includes('class="section-kicker">このページの使い方'),"duplicate instructional label");
});
test('common fixed research notice is relocated after article content',()=>{
 for(const p of ['membership.html','privacy.html','journal/matsuyama-pta-fee-unification-20261013.html']){
  const s=read(p),at=s.indexOf('data-phase3-notice="moved"');
  assert.ok(at>s.indexOf('class="next-read"')&&at<s.lastIndexOf('</main>'),p+' note not at the end');
  assert.ok(s.includes('本稿は当委員会による研究・検討資料です。'),p);
 }
});
