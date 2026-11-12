#!/usr/bin/env node
// Check all touched CSS assets and selectors against published main.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';import path from 'node:path';
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url),{TARGETS,CORE}=req('../scripts/phase4b-page-styles.cjs');
const root=path.resolve(import.meta.dirname,'..'),base='fc66bd9905133af0d42b908fe6140b3f647e8421';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:40*1024*1024});
const urls=s=>[...s.matchAll(/url\s*\(\s*(?:(["'])(.*?)\1|([^)]*))\s*\)/g)].map(m=>(m[2]||m[3]||'').trim()).sort();
const classes=s=>new Set([...s.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(x=>x[1]));
for(const file of [...CORE,...TARGETS]){
 const old=git('show',base+':'+file),now=fs.readFileSync(path.join(root,file),'utf8');
 if(JSON.stringify(urls(old))!==JSON.stringify(urls(now)))throw Error('Image or data URI changed: '+file);
 const a=classes(old),b=classes(now),missing=[...a].filter(x=>!b.has(x));
 if(missing.length)throw Error('CSS class selector removed: '+file+' '+missing.slice(0,15).join(','));
 if((now.match(/\{/g)||[]).length!==(now.match(/\}/g)||[]).length)throw Error('Unbalanced CSS: '+file);
}
console.log('Verified unchanged URLs, images, CSS class selectors and balanced CSS across '+(CORE.length+TARGETS.length)+' files.');
