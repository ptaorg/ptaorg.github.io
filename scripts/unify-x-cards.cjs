#!/usr/bin/env node
// Normalize all public tracked HTML X/OG metadata while retaining page-specific text.
const fs=require('fs'), cp=require('child_process');
const host='https://ptaorg.com', image=host+'/assets/og-image.png';
const files=cp.execFileSync('git',['ls-files','-z','--','*.html'],{encoding:'utf8'}).split('\0').filter(Boolean);
const attr=(tag,key)=>{const m=tag.match(new RegExp('\\b'+key+'\\s*=\\s*(["\\x27])([^"\\x27]*)\\1','i'));return m?m[2]:''};
const meta=(head,kind,name)=>{const tags=head.match(/<meta\b[^>]*>/gi)||[];return (tags.map(t=>({key:attr(t,kind),content:attr(t,'content')})).find(x=>x.key===name)||{}).content||''};
const enc=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
let updated=0,skipped=0;const errors=[];
for(const file of files){
 if(/^(tools|tests|test|fixtures|vendor|node_modules)\//.test(file)){skipped++;continue}
 const src=fs.readFileSync(file,'utf8'), match=src.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i);
 if(!match){skipped++;continue}
 const head=match[1];
 if(/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(head)){skipped++;continue}
 const title=meta(head,'property','og:title')||meta(head,'name','twitter:title')||(head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'PTA適正化推進委員会';
 const desc=meta(head,'name','description')||meta(head,'property','og:description')||'学校とPTAの関係を一次資料に基づいて検証します。';
 const canon=(head.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i)||[])[0];
 let url=canon?attr(canon,'href'):'';
 if(!url)url=host+'/'+(file==='index.html'?'':file.replace(/\/index\.html$/,'/'));
 else if(url.startsWith('/'))url=host+url;
 else if(!/^https?:\/\//.test(url))url=new URL(url,host+'/'+file).href;
 const tags=[
 ['property','og:type',file==='index.html'?'website':'article'],
 ['property','og:site_name','PTA適正化推進委員会'],
 ['property','og:title',title],['property','og:description',desc],
 ['property','og:url',url],['property','og:image',image],
 ['property','og:image:secure_url',image],['property','og:image:width','1200'],
 ['property','og:image:height','630'],['property','og:image:alt','PTA適正化推進委員会'],
 ['name','twitter:card','summary_large_image'],['name','twitter:title',title],
 ['name','twitter:description',desc],['name','twitter:image',image],
 ['name','twitter:image:alt','PTA適正化推進委員会']
 ];
 const clean=head.replace(/<meta\b[^>]*>/gi,t=>/^(og:|twitter:)/.test(attr(t,'property'))||/^twitter:/.test(attr(t,'name'))?'':t);
 const extra=canon?'':'\n<link rel="canonical" href="'+enc(url)+'">';
 const insertion=extra+'\n'+tags.map(t=>'<meta '+t[0]+'="'+t[1]+'" content="'+enc(t[2])+'">').join('\n')+'\n';
 const dst=src.replace(match[0],match[0].replace(head,clean.trimEnd()+insertion));
 if(dst!==src){fs.writeFileSync(file,dst);updated++}
 const newhead=(dst.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)||[])[1]||'';
 for(const name of ['og:title','og:description','og:url','og:image']){
  const n=(newhead.match(new RegExp('property=["\\x27]'+name+'["\\x27]','g'))||[]).length;
  if(n!==1)errors.push(file+':'+name+'='+n);
 }
 if(!newhead.includes('name="twitter:card" content="summary_large_image"'))errors.push(file+':twitter:card');
}
console.log(JSON.stringify({files:files.length,updated,skipped,errors:errors.slice(0,30)},null,2));
if(errors.length)process.exit(1);
