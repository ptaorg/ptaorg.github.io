#!/usr/bin/env node
// Phase 4B: page-level visual tokens. This does not edit HTML, original documents or assets.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {normalize,stats}=require('./phase4-normalize-design.cjs');
const TARGETS=[
 'css/pages/guide-board.css','css/pages/guide-pta.css',
 'css/pages/guide-parent.css','css/pages/membership.css',
 'css/pages/fee-collection.css','css/pages/privacy.css',
 'css/pages/personnel.css','css/pages/facilities.css',
 'css/pages/guideline.css','css/pages/ppc-points.css',
 'css/pages/board-responses.css','css/pages/national-archive.css',
 'css/pages/journal.css','css/pages/research-index.css',
 'css/reading-diagrams.css','css/optin.css',
 'css/home.css','css/home-entrance.css'
];
const CORE=['css/site.css','css/editorial.css'];
const CANONICAL=new Set(['navy','navy-deep','navy-mid','paper','paper-alt','gold','gold-line','ink','ink-sub','ink-faint','line','line-strong','link','tint','tint-strong','radius','shadow','accent']);
function removeLocalOverrides(css){
 // Remove only shadowing definitions that duplicate a root-level design token.
 // The canonical definitions remain in assets/style.css.
 return css.replace(/(?:^|(?<=[;{}]))(\s*)--([\w-]+)(\s*:\s*)([^;{}]+);/gm,(whole,lead,key,_colon,value)=>{
   return CANONICAL.has(key)?lead:whole;
 });
}
function repairCoreAliases(css,file){
 let result=removeLocalOverrides(css);
 if(file==='css/editorial.css'){
  result=result.replace(/(--color-accent\s*:\s*)var\(--navy-deep\)/g,'$1var(--gold)');
  result=result.replace(/(--color-warning\s*:\s*)var\(--navy\)/g,'$1var(--c-caution)');
  result=result.replace(/(--color-danger\s*:\s*)var\(--navy\)/g,'$1var(--c-caution)');
 }
 return result;
}
function normalizeFile(css,file){
 if(CORE.includes(file))return repairCoreAliases(css,file).replace(/[ \t]+(?=\r?$)/gm,'');
 const rendered=normalize(css,file).text;
 return removeLocalOverrides(rendered).replace(/[ \t]+(?=\r?$)/gm,'');
}
function main(){
 const check=process.argv.includes('--check'),touched=[];
 for(const file of [...CORE,...TARGETS]){
  const absolute=path.join(root,file),before=fs.readFileSync(absolute,'utf8');
  const after=normalizeFile(before,file);
  if(before!==after){
   touched.push({file,before:stats(before),after:stats(after)});
   if(!check)fs.writeFileSync(absolute,after,'utf8');
  }
 }
 console.log('Phase 4B page CSS:',JSON.stringify({target:TARGETS.length,coreFixes:CORE.length,changed:touched.length,files:touched}));
 if(check&&touched.length)throw Error('Phase 4B CSS out of date: '+touched.map(x=>x.file).join(', '));
 const site=fs.readFileSync(path.join(root,'css/site.css'),'utf8');
 const edit=fs.readFileSync(path.join(root,'css/editorial.css'),'utf8');
 if(/--paper\s*:\s*var\(--paper\)/.test(site)||/--line\s*:\s*var\(--color-border\)/.test(edit))throw Error('Circular theme alias still present');
}
if(require.main===module)main();
module.exports={TARGETS,CORE,normalizeFile,removeLocalOverrides};
