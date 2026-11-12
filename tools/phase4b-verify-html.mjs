#!/usr/bin/env node
// Exact HTML reconstruction from last deployed main commit; CSS query strings only.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url),{transform}=req('../scripts/phase4-update-cache.cjs');
const base='fc66bd9905133af0d42b908fe6140b3f647e8421',root=path.resolve(import.meta.dirname,'..');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:40*1024*1024});
const html=git('diff','--name-only',base).split('\n').filter(x=>x.endsWith('.html')&&!x.startsWith('partials/'));
let count=0;
for(const rel of html){
 const before=git('show',base+':'+rel),after=fs.readFileSync(path.join(root,rel),'utf8');
 if(transform(before)!==after)throw Error('Unexpected modification to visible HTML, image, quotation, link or ID: '+rel);
 count++;
}
if(count<100)throw Error('Too few version-refresh HTML files: '+count);
console.log('Preserved exact HTML except CSS version references in '+count+' pages.');
