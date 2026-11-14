import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('phase 4 core stylesheet has semantic colors and six-step type',()=>{
 const css=read('assets/style.css'),rootTokens=css.match(/:root\s*\{[\s\S]*?\}/)?.[0]||'';
 assert.match(css,/\/\* Phase 4 design system start \*\//);
 for(const k of ['--fs-micro','--fs-small','--fs-body','--fs-h3','--fs-h2','--fs-h1','--navy','--gold','--paper','--line','--c-caution','--radius-sm','--radius-md'])assert.ok(rootTokens.includes(k+':'),k);
 const palette=new Set([...css.matchAll(/#[\da-fA-F]{3,8}\b/g)].map(m=>m[0].toLowerCase()));
 const sizes=new Set([...css.matchAll(/font-size\s*:\s*([^;}]+)/g)].map(m=>m[1].trim()));
 assert.ok(palette.size<=25,'Too many literal colors: '+palette.size);
 assert.ok(sizes.size<=30,'Too many size variants: '+sizes.size);
});
test('article typography and image-bearing selectors survive normalization',()=>{
 const css=read('assets/style.css');
 for(const term of ['.hero-photo','.map-layout','.japan-map','.article-visual','.global-nav','text-wrap:balance','--reading-container:1120px','/assets/slides/1.jpg','/assets/img/research-book.webp'])assert.ok(css.includes(term),term);
});
