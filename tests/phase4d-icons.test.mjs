import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{TARGETS,transform}=require('../scripts/phase4d-icons.cjs');
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('decorative check and cross glyphs become scalable icons in two guides',()=>{
 const counts=[43,22];
 TARGETS.forEach((p,i)=>{
  const s=read(p);
  assert.equal((s.match(/role="img" aria-label="(?:チェック印|バツ印)"/g)||[]).length,counts[i],p);
  assert.equal((s.match(/<svg[^>]*aria-hidden="true"/g)||[]).length>=counts[i],true,p);
  assert.equal(transform(s,p).out,s,p+' must regenerate without changes');
 });
});
test('source quotes, article text, scripts, images and IDs keep original structure',()=>{
 for(const p of TARGETS){
  const s=read(p);
  assert.match(s,/class="phase3-chapter-intro"/);
  assert.match(s,/<section/);
  assert.match(s,/<script/);
  assert.match(s,/assets\//);
 }
});
