#!/usr/bin/env node
// Compare against the published unmodified guides; icon-only spans are the sole difference.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{TARGETS,transform}=require('../scripts/phase4d-icons.cjs');
const root=path.resolve(import.meta.dirname,'..'),base='d148ce30fdfd0a0385a77f8e1f5c6b0e2d8bc423';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:40*1024*1024});
const texts=s=>[...s.matchAll(/<(?:blockquote|pre|code|script|style)\b[^>]*>[\s\S]*?<\/(?:blockquote|pre|code|script|style)>/g)].map(x=>x[0]);
const links=s=>[...s.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(x=>x[0]);
const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[0]);
const headings=s=>[...s.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/g)].map(x=>x[0]);
let total=0;
for(const p of TARGETS){
 const old=git('show',base+':'+p),actual=fs.readFileSync(path.join(root,p),'utf8'),expected=transform(old,p);
 if(expected.out!==actual)throw Error('Unapproved change to research prose or markup: '+p);
 if(JSON.stringify(texts(old))!==JSON.stringify(texts(actual)))throw Error('Quoted text/source/code changed: '+p);
 if(JSON.stringify(links(old))!==JSON.stringify(links(actual)))throw Error('Original link, image or script source changed: '+p);
 if(JSON.stringify(ids(old))!==JSON.stringify(ids(actual)))throw Error('Anchor IDs changed: '+p);
 if(JSON.stringify(headings(old))!==JSON.stringify(headings(actual)))throw Error('Original headings altered: '+p);
 total+=expected.count;
}
if(total!==65)throw Error('Unexpected number of changed glyphs '+total);
const names=git('diff','--name-only',base).split('\n').filter(Boolean);
if(names.filter(p=>p.endsWith('.html')).sort().join(',')!==TARGETS.slice().sort().join(','))
 throw Error('Other HTML files were modified: '+names.join(','));
console.log('Verified exactly '+total+' SVG pictograms, no change to original prose, citations, document quotations, scripts, links or IDs.');
