#!/usr/bin/env node
// Phase 4: revise only the cache query on the six changed CSS assets in public HTML.
// The exact transform is independently checked against the old production commit.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const skip=new Set(['.git','_site','node_modules','assets','css','data','js','scripts','tools','tests','docs','.github','partials','ai-system','source-candidates','pta-open-system','starter-kit']);
const names=new Set(['assets/style.css','css/site.css','css/editorial.css','css/prose.css','css/journal-article.css','css/shared/editorial-page-common.css']);
function transform(html){
 return html.replace(/(<link\b[^>]*\bhref=")((?:\.\/|\.\.\/|\/)*)(assets\/style\.css|css\/site\.css|css\/editorial\.css|css\/prose\.css|css\/journal-article\.css|css\/shared\/editorial-page-common\.css)(?:\?v=[^"]*)?(")/g,(raw,a,prefix,asset,close)=>{
  if(!names.has(asset))return raw;
  return a+prefix+asset+'?v=20261113-phase4'+close;
 });
}
function walk(dir=root,out=[]){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,e.name);
  if(e.isDirectory()){if(!skip.has(e.name))walk(file,out)}
  else if(e.isFile()&&e.name.endsWith('.html')&&e.name!=='404.html')out.push(file);
 }
 return out;
}
function main(){
 const check=process.argv.includes('--check');
 let changed=0,examined=0,styles=0;
 for(const file of walk()){
  const before=fs.readFileSync(file,'utf8'),after=transform(before);
  examined++;
  if(after===before)continue;
  changed++;styles+=(after.match(/\?v=20261113-phase4/g)||[]).length-(before.match(/\?v=20261113-phase4/g)||[]).length;
  if(!check)fs.writeFileSync(file,after,'utf8');
 }
 console.log('Phase 4 versioned CSS:',JSON.stringify({examined,changed,linksUpdated:styles}));
 if(check&&changed)throw Error('CSS cache references are stale on '+changed+' pages');
}
if(require.main===module)main();
module.exports={transform};
