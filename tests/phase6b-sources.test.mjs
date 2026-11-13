import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url),{TARGETS,generate}=req('../scripts/phase6b-add-sources.cjs');
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('new official sources are anchored and HTML-parseable in explanatory articles',()=>{
 let total=0,pages=0;
 for(const file of TARGETS){
  const html=read(file),result=generate(html,file);
  assert.equal(result.html,html,'Not idempotent: '+file);
  const notes=[...html.matchAll(/<sup class="phase6-ref"><a href="#phase6-source-([^"]+)"[^>]*>注(\d+)<\/a><\/sup>/g)];
  if(notes.length){pages++;total+=notes.length;assert.ok(html.includes('<!-- phase6-sources -->'),file);
   const ids=[...html.matchAll(/<li id="phase6-source-([^"]+)">/g)].map(x=>x[1]);
   for(const m of notes){const n=ids.indexOf(m[1]);assert.ok(n>=0,file+' missing '+m[1]);assert.equal(Number(m[2]),n+1,file+' note index');}
   assert.equal((html.match(/<sup class="phase6-ref">/g)||[]).length,notes.length,file+' malformed notes');
  }
  assert.doesNotMatch(html,/\bclass=\s*<sup\b/,file+' invalid HTML insertion');
 }
 assert.ok(pages>=3,'Expected at least three annotated pages, found '+pages);
 assert.ok(total>=7,'Expected at least 7 source notes, found '+total);
});
test('old e-Gov law display URL has been replaced with the confirmed Constitution law ID',()=>{
 const law=read('js/law-data.js');
 assert.ok(!law.includes('elaws.e-gov.go.jp'),'Obsolete e-Gov domain remains in rendered JS');
 assert.ok(law.includes('https://laws.e-gov.go.jp/law/321CONSTITUTION'),'Confirmed Constitution link missing');
});
