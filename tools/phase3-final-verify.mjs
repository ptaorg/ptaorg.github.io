#!/usr/bin/env node
// Recalculate every changed HTML file from the original unmodified production revision.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);
const {transform}=req('../scripts/phase3-finish-guides.cjs');
const root=path.resolve(import.meta.dirname,'..');
const baseline='ee5513f46e6b831d9c2474543470e9203dff5bbb';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:30*1024*1024});
const listed=git('diff','--name-only',baseline).trim().split('\n').filter(x=>x.endsWith('.html')&&!x.startsWith('partials/'));
let moved=0,changers=0,anchorCount=0,originalWarnings=0;
for(const rel of listed){
 const before=git('show',baseline+':'+rel),after=fs.readFileSync(path.join(root,rel),'utf8');
 const expected=transform(before,rel);
 if(expected!==after)throw Error('Unexplained changes to article body/quotes/source URLs: '+rel);
 const beforeIDs=[...before.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]).sort();
 const afterIDs=[...after.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]).sort();
 if(JSON.stringify(beforeIDs)!==JSON.stringify(afterIDs))throw Error('Anchor IDs changed: '+rel);
 anchorCount+=beforeIDs.length;
 const ext=(s)=>[...s.matchAll(/\b(?:https?:\/\/)[^"\s<]+/g)].map(x=>x[0]).sort();
 if(JSON.stringify(ext(before))!==JSON.stringify(ext(after)))throw Error('Primary material URL changed: '+rel);
 const headings=s=>[...s.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map(x=>x[1].replace(/<[^>]+>/g,'').trim());
 const original=headings(before),final=headings(after).filter(x=>x!=='6章で確認する');
 if(JSON.stringify(original)!==JSON.stringify(final))throw Error('Original h2 content changed: '+rel);
 const notice=after.includes('data-phase3-notice="moved"');
 if(notice){
  moved++;
  if(after.indexOf('data-phase3-notice="moved"')<after.lastIndexOf('</main>')-9000)originalWarnings++;
 }
 if(after.includes('<!-- phase3-guide-map -->'))changers++;
}
if(originalWarnings)throw Error('Disclaimer was not moved to article end: '+originalWarnings);
if(changers!==2)throw Error('Expected six chapters in two guides, got '+changers);
if(moved<20)throw Error('Insufficient known research notices migrated: '+moved);
console.log('Verified '+listed.length+' transformed HTML pages; '+moved+' notices moved; two guides with six chapters; '+anchorCount+' exact IDs and all external URLs/heading texts retained.');
