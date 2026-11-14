#!/usr/bin/env node
// Phase 4 + 4B: refresh only changed stylesheets' cache identifiers in public HTML.
// No research content, file paths, links, anchors or images are modified.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const {TARGETS,CORE}=require('./phase4b-page-styles.cjs');
const changed=new Set([...TARGETS,...CORE]);
const {FILES:maintained}=require('./phase4c-normalize-maintained.cjs');
const phase4c=new Set(maintained);
const baseline=new Set(['assets/style.css','css/site.css','css/editorial.css','css/prose.css','css/journal-article.css','css/shared/editorial-page-common.css']);
const all=new Set([...changed,...baseline,...phase4c]);
const SKIP=new Set(['.git','_site','node_modules','assets','css','data','js','scripts','tools','tests','docs','.github','partials','ai-system','source-candidates','pta-open-system','starter-kit']);
function transform(html){
 return html.replace(/(<link\b[^>]*\bhref=")([^"]+)(")/g,(whole,left,raw,right)=>{
  const pathPart=raw.replace(/^(?:\.\.\/|\.\/|\/)+/,'').split('?')[0];
  if(!all.has(pathPart))return whole;
  // Preserve newer release-specific cache tags (e.g. the 2026-11-14 readability release).
  // Phase 4 is a legacy migration pass; it must never downgrade newer assets.
  const current=raw.match(/[?&]v=(\d{8})(?:[-_a-z0-9]*)/i);
  if(current && current[1]>'20261113')return whole;
  const version=phase4c.has(pathPart)?'20261113-phase4c':changed.has(pathPart)?'20261113-phase4b':'20261113-phase4';
  return left+raw.split('?')[0]+'?v='+version+right;
 });
}
function files(dir=root,out=[]){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){if(!SKIP.has(entry.name))files(file,out)}
  else if(entry.isFile()&&entry.name.endsWith('.html')&&entry.name!=='404.html')out.push(file);
 }return out;
}
function main(){
 const check=process.argv.includes('--check'),list=files();let changedPages=0,modifiedLinks=0;
 for(const file of list){
  const old=fs.readFileSync(file,'utf8'),now=transform(old);
  if(old===now)continue;
  changedPages++;
  modifiedLinks+=[...old.matchAll(/<link\b[^>]*\bhref="[^"]*"/g)].filter(x=>transform(x[0])!==x[0]).length;
  if(!check)fs.writeFileSync(file,now,'utf8');
 }
 console.log('Phase 4B cache refresh:',JSON.stringify({examined:list.length,pages:changedPages,stylesheets:modifiedLinks}));
 if(check&&changedPages)throw Error('Page CSS version references stale on '+changedPages+' pages');
}
if(require.main===module)main();
module.exports={transform,all,changed,phase4c};
