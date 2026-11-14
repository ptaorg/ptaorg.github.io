import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {TARGETS,CORE,normalizeFile}=require('../scripts/phase4b-page-styles.cjs');
const base=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
test('shared legacy CSS does not introduce circular or nonsemantic core variables',()=>{
 const site=read('css/site.css'),edit=read('css/editorial.css');
 assert.doesNotMatch(site,/--paper\s*:\s*var\(--paper\)/);
 assert.doesNotMatch(edit,/--line\s*:\s*var\(--color-border\)/);
 assert.doesNotMatch(site,/--gold\s*:\s*var\(--navy-deep\)/);
 assert.match(edit,/--color-accent\s*:\s*var\(--gold\)/);
 for(const file of [...CORE,...TARGETS]){
  const css=read(file);
  const normalized=normalizeFile(css,file);
  if(normalized!==css){
    let offset=0;
    while(offset<css.length && offset<normalized.length && css[offset]===normalized[offset])offset++;
    console.error('CSS_NORMALIZATION_DRIFT',file,'offset',offset,
      'source',JSON.stringify(css.slice(Math.max(0,offset-100),offset+200)),
      'normalized',JSON.stringify(normalized.slice(Math.max(0,offset-100),offset+200)));
  }
  assert.equal(normalized,css,file+' is not normalized');
 }
});
test('major page CSS use shared tokens without accidental self-reference',()=>{
 for(const file of TARGETS){
  const css=read(file),self=[...css.matchAll(/(--[\w-]+)\s*:\s*var\(\s*(--[\w-]+)/g)].filter(x=>x[1]===x[2]);
  assert.equal(self.length,0,file+' has self-referencing custom properties');
  const colors=new Set([...css.matchAll(/#[\da-fA-F]{3,8}\b/g)].map(x=>x[0]));
  assert.ok(colors.size<=8,file+' has '+colors.size+' local hex values');
 }
});
