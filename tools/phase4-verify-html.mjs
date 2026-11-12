#!/usr/bin/env node
// Diff every public HTML file against the baseline: CSS version query only.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{transform}=require('../scripts/phase4-update-cache.cjs');
const base='b93984bb957b45a39ea858bf4e574fcb2589e8b8',root=path.resolve(import.meta.dirname,'..');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:35*1024*1024});
const pages=git('diff','--name-only',base).split('\n').filter(x=>x.endsWith('.html'));
let edits=0,links=0;
for(const rel of pages){
 const old=git('show',base+':'+rel),newHTML=fs.readFileSync(path.join(root,rel),'utf8');
 if(transform(old)!==newHTML)throw Error('Unexpected change in public HTML (text/anchor/image/source URL): '+rel);
 links+=(newHTML.match(/\?v=20261113-phase4/g)||[]).length-(old.match(/\?v=20261113-phase4/g)||[]).length;edits++;
}
if(edits<100)throw Error('CSS cache refresh reached too few pages: '+edits);
console.log('HTML proven unchanged outside '+links+' CSS query strings across '+edits+' public pages.');
