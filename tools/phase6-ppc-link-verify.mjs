#!/usr/bin/env node
// Protect every character of the published essay other than one verified PPC source hyperlink.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),file='journal/why-pta-membership-freedom-fails.html',base='4612ee6210f1a40bc7698761b5ed205511699732';
const old=execFileSync('git',['show',base+':'+file],{cwd:root,encoding:'utf8',maxBuffer:30*1024*1024});
const oldLink='https://www.ppc.go.jp/files/pdf/251212_koutekibumon_guidelines.pdf#page=25';
const newLink='https://www.ppc.go.jp/personalinfo/legal/guidelines_administrative/';
const expected=old.replace('href="'+oldLink+'"','href="'+newLink+'"').replace('>'+oldLink+'</a>','>個人情報保護委員会「ガイドライン（行政機関等編）」公式HTML版</a>');
const actual=fs.readFileSync(path.join(root,file),'utf8');
if(expected===old||expected!==actual)throw Error('Changed original argument, quote, image, script, link or ID outside single approved PPC reference');
const list=execFileSync('git',['diff','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n');
if(list.filter(x=>x.endsWith('.html')).join('')!==file)throw Error('Other public HTML unexpectedly modified');
console.log('Single PPC source link fixed; original research content and all other links are byte-identical.');
