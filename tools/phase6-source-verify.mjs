#!/usr/bin/env node
// Every modified page must be reconstructible exactly from the unchanged production baseline.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{TARGETS,SOURCES,citations,candidates,patterns}=require('../scripts/phase6-link-sources.cjs');
const base='da107bc6d4149f9edfb93f8dc28ecb04734a1e41',root=path.resolve(import.meta.dirname,'..');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:48*1024*1024});
const urls=s=>[...s.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]);
const origIDs=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
const quotes=s=>[...s.matchAll(/<(blockquote|pre|code|script|style|textarea)\b[^>]*>[\s\S]*?<\/\1>/g)].map(x=>x[0]);
const headings=s=>[...s.matchAll(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/g)].map(x=>x[0]);
let changed=0,inserted=0,reported=[];
for(const rel of TARGETS){
 const before=git('show',base+':'+rel),actual=fs.readFileSync(path.join(root,rel),'utf8'),rendered=citations(before,rel);
 if(rendered.html!==actual)throw Error('Original text, admin response or link changed outside citation generator: '+rel);
 const srcURLs=urls(before);
 const expectedURLs=new Set(SOURCES.map(s=>s.url));
 const newURLs=urls(actual).filter(s=>!srcURLs.includes(s));
 for(const u of newURLs)if(!expectedURLs.has(u)&&!u.startsWith('#phase6-source-')&&!u.endsWith('phase6-sources.css?v=20261113-phase6a'))throw Error('Unexpected new URL: '+rel+' '+u);
 for(const id of origIDs(before))if(!actual.includes('id="'+id+'"'))throw Error('Original anchor removed: '+rel+' '+id);
 const oldQuoted=quotes(before),newQuoted=quotes(actual);
 if(JSON.stringify(oldQuoted)!==JSON.stringify(newQuoted))throw Error('Verbatim material or scripts modified: '+rel);
 // Added heading must be unique; other heading content is left intact.
 const oldHeads=headings(before);let newHeads=headings(actual);
 newHeads=newHeads.filter(h=>!h.includes('出典（法令・行政資料）'));
 if(JSON.stringify(oldHeads)!==JSON.stringify(newHeads))throw Error('Original heading changed: '+rel);
 if(rendered.html!==before)changed++;
 inserted+=rendered.count;
 reported.push({page:rel,refs:rendered.count,paragraphs:rendered.paragraphs||0,sources:rendered.used});
}
const changedHTML=git('diff','--name-only',base).trim().split('\n').filter(s=>s.endsWith('.html'));
if(changedHTML.some(p=>!TARGETS.includes(p)))throw Error('Unexpected public HTML changed: '+changedHTML.filter(p=>!TARGETS.includes(p)).join(','));
if(changed<8||inserted<30)throw Error('Insufficient sources linked: '+changed+' pages, '+inserted+' markers');
console.log('Phase 6A exact-content check: '+JSON.stringify({changedPages:changed,sourceMarkers:inserted,results:reported}));
