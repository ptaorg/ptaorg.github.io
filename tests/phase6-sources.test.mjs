import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const req=createRequire(import.meta.url),{TARGETS,SOURCES,citations}=req('../scripts/phase6-link-sources.cjs');
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('verified official source notes are reproducible and every note resolves on its page',()=>{
 let total=0,pages=0;
 for(const rel of TARGETS){
  const page=read(rel),r=citations(page,rel);assert.equal(r.html,page,'Non-repeatable source edits: '+rel);
  const refs=[...page.matchAll(/<sup class="phase6-ref"><a href="#phase6-source-([^"]+)"[^>]*>注(\d+)<\/a><\/sup>/g)];
  if(!refs.length)continue;
  pages++;total+=refs.length;
  const sources=[...page.matchAll(/<li id="phase6-source-([^"]+)">/g)].map(x=>x[1]);
  assert.ok(page.includes('<!-- phase6-sources -->'),rel+' source list missing');
  assert.ok(page.includes('css/phase6-sources.css'),rel+' CSS missing');
  assert.equal(sources.length,new Set(sources).size,'Source appears more than once on '+rel);
  for(const m of refs){
   assert.ok(sources.includes(m[1]),rel+' footnote target missing: '+m[1]);
   const index=sources.indexOf(m[1]);assert.equal(Number(m[2]),index+1,'Footnote numbering inconsistent '+rel);
  }
 }
 assert.ok(pages>=8,'Too few researched articles linked: '+pages);
 assert.ok(total>=30,'Too few confirmed source references: '+total);
});
test('the official source registry contains only researched e-Gov and public-agency URLs',()=>{
 const urls=new Set();
 for(const s of SOURCES){
  assert.ok(!urls.has(s.url),'Duplicated official source '+s.url);urls.add(s.url);
  assert.match(s.url,/^https:\/\/(?:laws\.e-gov\.go\.jp|www\.ppc\.go\.jp|www\.mext\.go\.jp)\//);
  assert.match(s.date,/^(?:\d{4}(?:-\d{2}){0,2}|\d{4}年公布)$/);
  assert.ok(s.number.length>5);
 }
});
