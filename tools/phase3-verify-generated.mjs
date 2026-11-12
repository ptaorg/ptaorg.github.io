#!/usr/bin/env node
// Compare the current HTML with an in-memory rendering from the ORIGINAL approved baseline.
// This rejects any unexplained change to legal text, public source URLs, figures, images or IDs.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {render} from '../scripts/render-chrome.mjs';
const require=createRequire(import.meta.url);
const {transform}=require('../scripts/phase3-sync-shared.cjs');
const root=path.resolve(import.meta.dirname,'..');
const base='9e9f35dd10f07f0a0b9c63f4c893adb177c9d33e';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:24*1024*1024});
const files=git('diff','--name-only',base,'HEAD').trim().split('\n').filter(x=>x.endsWith('.html'));
let n=0,removedSearch=0;
for(const rel of files){
 const initial=git('show',base+':'+rel);
 const actual=fs.readFileSync(path.join(root,rel),'utf8');
 const expected=transform(initial.includes('<!-- chrome:header -->')?render(initial):initial,rel);
 if(expected!==actual)throw Error('Unexplained change outside approved shared chrome/navigation blocks: '+rel);
 const allIDs=[...initial.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 const newIDs=new Set([...actual.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
 const missing=allIDs.filter(id=>id!=='site-q'&&!newIDs.has(id));
 if(missing.length)throw Error('Content anchor lost: '+rel+' '+missing.slice(0,10).join(','));
 if(initial.includes('search-panel-bar')&&!actual.includes('search-panel-bar'))removedSearch++;
 n++;
}
if(n<50)throw Error('Too few UI pages updated: '+n);
console.log('Phase 3 safely updated '+n+' HTML pages; '+removedSearch+' article search bars removed; all article anchors and exact protected text preserved.');
