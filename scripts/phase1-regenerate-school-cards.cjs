/* Port-aware school page update for the phase-1 UI repair.
 * Generated archive pages were migrated into a shared layout after original generation.
 * To avoid destroying their TOCs, relative paths, sources and current chrome, transform
 * only the duplicate summary section in the final generated HTML.
 */
const fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"..");
const about=/<section class="archive-section">\s*<h2 id="sec-1">このページについて<\/h2>\s*<div class="archive-grid">[\s\S]*?<\/div>\s*<p>ここでは資料の所在と内容種別だけを整理します。<\/p>\s*<\/section>/;
function transform(src,rel){
  const matches=src.match(new RegExp(about.source,"g"))||[];
  if(matches.length!==1)throw Error(rel+": expected exactly one duplicate information section; found "+matches.length);
  for(const label of ["自治体","学校区分","確認年度","資料件数"])if(!matches[0].includes(label))throw Error(rel+": expected card missing: "+label);
  if(!src.includes('<li><a href="#sec-1">このページについて</a></li>'))throw Error(rel+": TOC anchor not present");
  const r=src.replace(about,'<span id="sec-1" aria-hidden="true"></span>')
    .replaceAll('<li><a href="#sec-1">このページについて</a></li>','')
    .replace(/(このページの目次（)(\d+)(項目）)/,(whole,a,n,b)=>a+(Number(n)-1)+b);
  if(r===src)throw Error(rel+": not changed");
  if((r.match(/id="sec-1"/g)||[]).length!==1)throw Error(rel+": existing anchor id not retained exactly once");
  return r;
}
function getEntries(){
 const root=path.join(ROOT,"data","schools"),out=[];
 for(const city of fs.readdirSync(root).sort()){
  const dir=path.join(root,city);if(!fs.statSync(dir).isDirectory())continue;
  for(const name of fs.readdirSync(dir).filter(s=>s.endsWith(".json")).sort()){
   const data=JSON.parse(fs.readFileSync(path.join(dir,name),"utf8"));
   if(data.pageMode==="materials")out.push("archive/"+city+"/"+data.slug+"/index.html");
  }
 }
 return out;
}
function main(){
 const entries=getEntries();if(!entries.length)throw Error("No material-mode school pages");
 let count=0;
 for(const rel of entries){
  const file=path.join(ROOT,rel),old=fs.readFileSync(file,"utf8");
  // Do not regenerate or modify an already-corrected page.
  if(!old.includes('<h2 id="sec-1">このページについて</h2>'))continue;
  const next=transform(old,rel);
  fs.writeFileSync(file,next,"utf8");count++;
 }
 console.log("Updated "+count+" generated school pages; retained source titles, documents, links, and #sec-1 anchors.");
 if(!entries.every(rel=>!fs.readFileSync(path.join(ROOT,rel),"utf8").includes('<h2 id="sec-1">このページについて</h2>')))throw Error("Duplicate school summary block still present");
}
if(require.main===module)main();
module.exports={transform,getEntries};
