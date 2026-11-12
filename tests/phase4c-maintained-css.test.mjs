import test from 'node:test';import assert from 'node:assert/strict';
import path from 'node:path';import fs from 'node:fs';import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);
const {FILES,EXCLUDED,transform}=req('../scripts/phase4c-normalize-maintained.cjs');
const root=path.resolve(import.meta.dirname,'..'),load=p=>fs.readFileSync(path.join(root,p),'utf8');
test('all maintained CSS files are reproducible and use core design tokens',()=>{
 assert.ok(FILES.length>=25);
 for(const p of FILES){
  const src=load(p);assert.equal(transform(src,p),src,p+' not idempotent');
  const literals=new Set([...src.matchAll(/#[\da-fA-F]{3,8}\b/g)].map(x=>x[0]));
  assert.ok(literals.size<=8,p+' retains '+literals.size+' literal colors');
 }
});
test('risks, port-generated styles and original picture layers are excluded',()=>{
 for(const p of EXCLUDED)assert.throws(()=>transform(load(p),p),/Generated or status-sensitive/);
 const port=load('css/legacy-inline/f0ccba41375b.css');
 assert.throws(()=>transform(port,'css/legacy-inline/f0ccba41375b.css'));
 assert.match(port,/--essay-accent/);
 assert.match(load('css/pages/audit-index.css'),/--risk-4/);
 assert.match(load('css/inline-utilities.css'),/u-00625d1adf/);
});
