#!/usr/bin/env node
// Every changed article is fully reproduced by adding references to original published text.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
const req=createRequire(import.meta.url),{TARGETS,generate}=req('../scripts/phase6b-add-sources.cjs'),{SOURCES}=req('../scripts/phase6-link-sources.cjs');
const root=path.resolve(import.meta.dirname,'..'),base='527ab815a625bcace152c3120d5f6019ba0b8a19';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:45*1024*1024});
const quotation=s=>[...s.matchAll(/<(blockquote|pre|code|script|style|textarea)\b[^>]*>[\s\S]*?<\/\1>/g)].map(x=>x[0]);
const links=s=>[...s.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(x=>x[1]);
const allIDs=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
const headers=s=>[...s.matchAll(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/g)].map(x=>x[0]).filter(x=>!x.includes('出典（法令・行政資料）'));
let total=0,changed=0;
for(const file of TARGETS){
 const original=git('show',base+':'+file),now=fs.readFileSync(path.join(root,file),'utf8'),r=generate(original,file);
 if(r.html!==now)throw Error('Unexpected changes in original article: '+file);
 if(JSON.stringify(quotation(original))!==JSON.stringify(quotation(now)))throw Error('Original quotation changed: '+file);
 if(JSON.stringify(headers(original))!==JSON.stringify(headers(now)))throw Error('Original headings changed: '+file);
 for(const id of allIDs(original))if(!now.includes('id="'+id+'"'))throw Error('Original anchor removed '+file+' '+id);
 for(const link of links(original))if(!now.includes('"'+link+'"'))throw Error('Original link/image changed '+file+' '+link);
 const allowed=new Set([...SOURCES.map(x=>x.url),'css/phase6-sources.css?v=20261113-phase6a']);
 for(const u of links(now)){
  if(links(original).includes(u)||u.startsWith('#phase6-source-')||[...allowed].some(x=>u.endsWith(x)))continue;
  throw Error('Unverified new link '+file+' '+u);
 }
 if(r.count){total+=r.count;changed++;}
}
const original=git('show',base+':js/law-data.js'),modified=fs.readFileSync(path.join(root,'js/law-data.js'),'utf8');
if(original.replace('https://elaws.e-gov.go.jp/document?lawid=321CONSTITUTION','https://laws.e-gov.go.jp/law/321CONSTITUTION')!==modified)
 throw Error('JS was modified beyond the single verified Constitution link');
const delta=git('diff','--name-only',base).split('\n').filter(Boolean);
if(delta.some(x=>x.endsWith('.html')&&!TARGETS.includes(x)))throw Error('Other public article HTML unexpectedly touched');
console.log('Phase6B preserved all original prose, citations, image paths and anchors: '+JSON.stringify({pages:changed,notes:total}));
