#!/usr/bin/env node
// Ensures no primary-material URLs, asset references or public HTML/JS are touched.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),base='b93984bb957b45a39ea858bf4e574fcb2589e8b8';
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
const files=['assets/style.css','css/site.css','css/editorial.css','css/prose.css','css/journal-article.css','css/shared/editorial-page-common.css'];
const touched=git('diff','--name-only',base).split('\n').filter(Boolean);
if(touched.some(x=>x.endsWith('.html')||(x.startsWith('assets/')&&x.endsWith('.js'))))throw Error('Public content/JS changed unexpectedly');
const assets=s=>[...s.matchAll(/url\s*\(\s*(?:(["'])(.*?)\1|([^)]*))\s*\)/g)].map(x=>(x[2]||x[3]||'').trim()).sort();
for(const file of files){
 const old=git('show',base+':'+file),now=fs.readFileSync(path.join(root,file),'utf8');
 if(JSON.stringify(assets(old))!==JSON.stringify(assets(now)))throw Error('Asset URL modified in '+file);
 if((now.match(/\{/g)||[]).length!==(now.match(/\}/g)||[]).length)throw Error('Unbalanced CSS braces '+file);
}
console.log('Preserved external assets and public HTML/JS for '+files.length+' common CSS files.');
