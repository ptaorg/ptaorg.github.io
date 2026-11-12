#!/usr/bin/env node
// Compare the CSS-only changes against the last published production commit.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url),{FILES,transform}=req('../scripts/phase4c-normalize-maintained.cjs');
const root=path.resolve(import.meta.dirname,'..'),base='dc213c430db6614ed2b7d039618fe2f0970f0416';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:45*1024*1024});
const urls=s=>[...s.matchAll(/url\s*\(\s*(?:(["'])(.*?)\1|([^)]*))\s*\)/g)].map(m=>(m[2]||m[3]||'').trim()).sort();
const selectors=s=>new Set([...s.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(m=>m[1]));
const imports=s=>[...s.matchAll(/@import\s+[^;]+;/g)].map(m=>m[0]).sort();
for(const file of FILES){
 const before=git('show',base+':'+file),after=fs.readFileSync(path.join(root,file),'utf8');
 if(transform(before,file)!==after)throw Error('Unexpected CSS modifications beyond normalizer: '+file);
 if(JSON.stringify(urls(before))!==JSON.stringify(urls(after)))throw Error('Picture, font, or other URL changed: '+file);
 if(JSON.stringify(imports(before))!==JSON.stringify(imports(after)))throw Error('CSS import changed: '+file);
 const old=selectors(before),latest=selectors(after),lost=[...old].filter(x=>!latest.has(x));
 if(lost.length)throw Error('Existing CSS selector removed: '+file+' '+lost.slice(0,8).join(','));
 if((after.match(/\{/g)||[]).length!==(after.match(/\}/g)||[]).length)throw Error('CSS braces unbalanced: '+file);
}
const changed=git('diff','--name-only',base).split('\n').filter(Boolean);
if(changed.some(p=>p.startsWith('css/legacy-inline/')||p==='css/inline-utilities.css'||p==='assets/legacy-theme.css'||p==='css/pages/audit-index.css'))
 throw Error('Protected generated/audit CSS was modified');
console.log('Phase 4C confirmed '+FILES.length+' maintained CSS files and no generated/risk CSS changed.');
