#!/usr/bin/env node
// Phase 3, site-wide static chrome and article UI normalization.
// All mutations are limited to the shared navigation, search bars, sidebars and read-more controls.
// Quoted primary documents, legal prose, article body, figures, images and public URLs are untouched.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const SKIP=new Set(['.git','_site','node_modules','assets','css','data','js','scripts','tools','tests','docs','.github','partials','ai-system','source-candidates','pta-open-system','starter-kit']);
const hdr=fs.readFileSync(path.join(root,'partials','header.html'),'utf8');
const ftr=fs.readFileSync(path.join(root,'partials','footer.html'),'utf8').trim();
const navRX=/<nav class="global-nav" id="global-nav" aria-label="メインナビゲーション">[\s\S]*?<\/nav>/;
const footerRX=/<footer class="site-footer">[\s\S]*?<\/footer>/;
const searchRX=/<div class="container">\s*<form class="search-panel search-panel-bar"[\s\S]*?<\/form>\s*<\/div>\s*/g;
const canonicalNav=hdr.match(navRX)?.[0];
if(!canonicalNav)throw Error('Canonical navigation source missing');
const curated={
 'guide-parent.html':[['membership.html','任意加入・退会'],['fee-collection.html','PTA会費の徴収'],['privacy.html','学校とPTAの個人情報']],
 'guide-pta.html':[['membership.html','会員管理と入会記録'],['fee-collection.html','PTA会計と会費徴収'],['personnel.html','教職員のPTA事務']],
 'guide-board.html':[['pta-school-processing.html','学校側の所掌事務・権限'],['ppc-points.html','個人情報保護委員会資料'],['submit-to-board.html','教育委員会への照会書式']],
 'guide-research.html':[['research-index.html','根拠資料・調査方法'],['administrative-materials.html','法令・行政資料'],['board-responses.html','教育委員会の回答']]
};
function prefix(rel){return '../'.repeat(rel.split('/').length-1)}
function retarget(s,base){return s.replace(/\bhref="(?!#|\/|https?:|mailto:|tel:)([^"]+)"/g,(_,v)=>'href="'+base+v+'"')}
function attr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}
function sidebar(html,rel){
 const rx=/<aside class="article-side">[\s\S]*?<\/aside>/g;
 return html.replace(rx,old=>{
  let out=old.replace(/<section class="side-box">[\s\S]*?<\/section>/g,block=>{
   if(block.includes('関連する論点'))return '';
   if(!block.includes('関連資料'))return block;
   const ul=block.match(/<ul class="side-links">[\s\S]*?<\/ul>/)?.[0];
   if(!ul)return block;
   const original=[...ul.matchAll(/<li>[\s\S]*?<\/li>/g)].map(m=>m[0]);
   const related=curated[rel] ? curated[rel].map(([href,title])=>'<li><a href="'+prefix(rel)+href+'">'+title+'</a></li>'):original.slice(0,3);
   return related.length?block.replace(ul,'<ul class="side-links">'+related.join('')+'</ul>'):'';
  });
  const ol=out.match(/<ol class="toc-list">[\s\S]*?<\/ol>/)?.[0];
  if(ol){
   const all=[...ol.matchAll(/<li>[\s\S]*?<\/li>/g)].map(m=>m[0]);
   const h2IDs=new Set([...html.matchAll(/<h2\b[^>]*\bid="([^"]+)"/g)].map(m=>m[1]));
   for(const m of html.matchAll(/<section\b[^>]*\bid="([^"]+)"[^>]*>\s*<h2\b/g))h2IDs.add(m[1]);
   const h2Only=all.filter(x=>h2IDs.has((x.match(/href="#([^"]+)"/)||[])[1]));
   // Not all legacy headings have IDs on h2/section; retain unmatchable TOCs intact.
   const entries=(h2Only.length>=3&&h2Only.length>=Math.ceil(all.length*.65))?h2Only:all;
   const shortened=entries.map(item=>item.replace(/<span>([^<>]{42,})<\/span>/g,(_,label)=>{
    return '<span title="'+attr(label)+'">'+[...label].slice(0,34).join('')+'…</span>';
   }));
   out=out.replace(ol,'<ol class="toc-list">'+shortened.join('')+'</ol>');
  }
  return out;
 });
}
function reading(html){
 const pagerRX=/<nav class="pager" aria-label="前後のページ">[\s\S]*?<\/nav>/,readmoreRX=/<section class="readmore">[\s\S]*?<\/section>/;
 const pager=html.match(pagerRX)?.[0]||'',readmore=html.match(readmoreRX)?.[0]||'';
 if(!pager&&!readmore)return html;
 const pLinks=[...pager.matchAll(/<a\b[\s\S]*?<\/a>/g)].map(x=>x[0]);
 const rLinks=[...readmore.matchAll(/<a\b[\s\S]*?<\/a>/g)].map(x=>x[0]);
 const next=pLinks.find(x=>x.includes('次へ'))||pLinks.at(-1)||rLinks[0];
 if(!next)return html;
 const target='<nav class="next-read" aria-label="次に読む"><h2>次に読む</h2>'+next+'</nav>';
 html=pager?html.replace(pagerRX,target):html.replace(readmoreRX,target);
 if(pager&&readmore)html=html.replace(readmoreRX,'');
 return html;
}
function transform(original,rel){
 let html=original;
 if(!html.includes('<!-- chrome:header -->')){
  if(html.includes('<nav class="global-nav" id="global-nav"'))html=html.replace(navRX,retarget(canonicalNav,prefix(rel)));
  if(html.includes('<footer class="site-footer">'))html=html.replace(footerRX,retarget(ftr,prefix(rel)));
 }
 if(rel!=='index.html'&&rel!=='explore.html')html=html.replace(searchRX,'');
 if(html.includes('<aside class="article-side">'))html=sidebar(html,rel);
 if(html.includes('class="pager"')||html.includes('class="readmore"'))html=reading(html);
 // Bust stale CSS and app caches after the shared UI migration, preserving paths.
 html=html.replace(/(href="(?:\.\.\/)*assets\/style\.css)(?:\?v=[^"]*)?"/g,'$1?v=20261113-phase3"');
 html=html.replace(/(src="(?:\.\.\/)*assets\/app\.js)(?:\?v=[^"]*)?"/g,'$1?v=20261113-phase3"');
 return html;
}
function walk(dir=root,out=[]){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const full=path.join(dir,entry.name);
  if(entry.isDirectory()){if(!SKIP.has(entry.name))walk(full,out)}
  else if(entry.isFile()&&entry.name.endsWith('.html')&&entry.name!=='404.html')out.push(full);
 }
 return out;
}
function main(){
 const files=walk(),totals={found:files.length,changed:0,header:0,footer:0,search:0,sidebar:0,reading:0};
 for(const file of files){
  const rel=path.relative(root,file).split(path.sep).join('/'),before=fs.readFileSync(file,'utf8'),after=transform(before,rel);
  if(before===after)continue;
  totals.changed++;
  if(before.match(navRX)?.[0]!==after.match(navRX)?.[0])totals.header++;
  if(before.match(footerRX)?.[0]!==after.match(footerRX)?.[0])totals.footer++;
  if(before.includes('search-panel-bar')&&!after.includes('search-panel-bar'))totals.search++;
  if(before.includes('<aside class="article-side">'))totals.sidebar++;
  if(before.includes('class="pager"')||before.includes('class="readmore"'))totals.reading++;
  fs.writeFileSync(file,after,'utf8');
 }
 console.log('Phase 3 normalization:',JSON.stringify(totals));
}
if(require.main===module)main();
module.exports={transform,prefix,reading,sidebar};
