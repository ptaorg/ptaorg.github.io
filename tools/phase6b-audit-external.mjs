#!/usr/bin/env node
// HTTP status of publicly linked resources on root, journal and research HTML.
// 404 is a candidate, not proof that a source or document has been removed.
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const dirs=['','journal','research'],pages=[];
for(const dir of dirs)for(const n of fs.readdirSync(path.join(root,dir))){
 const p=path.posix.join(dir,n);
 if(n.endsWith('.html')&&fs.statSync(path.join(root,p)).isFile())pages.push(p);
}
const safe=u=>{try{const h=u.hostname.toLowerCase();return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password&&h!=='localhost'&&h!=='::1'&&h!=='0.0.0.0'&&!h.endsWith('.localhost')&&!h.endsWith('.local')&&!h.endsWith('.internal')&&!h.startsWith('127.')&&!h.startsWith('10.')&&!h.startsWith('192.168.')&&!/^172\.(1[6-9]|2\d|3[01])\./.test(h)}catch{return false}};
const redacted=s=>{try{const u=new URL(s);u.hash='';if(u.search)u.search='?query-omitted';return u.href}catch{return s.split('?')[0]}};
const index=new Map();
for(const p of pages){
 const html=fs.readFileSync(path.join(root,p),'utf8');
 for(const m of html.matchAll(/<a\b[^>]*\bhref=(["'])(https?:\/\/[^"']+)\1/gi)){
  const original=m[2].replace(/&amp;/g,'&').split('#')[0];
  let parsed;try{parsed=new URL(original)}catch{continue}
  if(!safe(parsed))continue;
  if(!index.has(original))index.set(original,{original,display:redacted(original),pages:new Set()});
  index.get(original).pages.add(p);
 }
}
async function call(url,method){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4500);
 try{
  const response=await fetch(url,{method,redirect:'manual',signal:controller.signal,headers:{'user-agent':'PTA-reference-audit/1.0','accept':'*/*'}});
  await response.body?.cancel().catch(()=>{});
  return {status:response.status,location:response.headers.get('location')};
 }finally{clearTimeout(timer)}
}
async function inspect(original){
 const visited=new Set(),redirects=[];let url=original;
 try{
  for(let depth=0;depth<5;depth++){
   if(visited.has(url))return {kind:'redirect_cycle',status:0,final:redacted(url),redirects};
   visited.add(url);
   let response=await call(url,'HEAD');
   if([400,403,404,405,501].includes(response.status))try{response=await call(url,'GET')}catch{}
   if(response.status>=300&&response.status<400&&response.location){
    const to=new URL(response.location,url);
    redirects.push({from:redacted(url),to:redacted(to.href),status:response.status});
    if(!safe(to))return {kind:'redirect_unsafe',status:response.status,final:redacted(to.href),redirects};
    url=to.href;continue;
   }
   const status=response.status;
   const kind=status>=200&&status<300?'ok':status===404||status===410?'possible_404':status===401||status===403||status===429?'restricted':status>=500?'server_error':status>=300&&status<400?'redirect_unresolved':'other';
   return {kind,status,final:redacted(url),redirects};
  }
  return {kind:'redirect_limit',status:0,final:redacted(url),redirects};
 }catch(error){return {kind:'network_unverified',status:0,final:redacted(url),redirects,error:String(error?.cause?.code||error?.name||'network-failed').slice(0,80)}}
}
const urls=[...index.values()].sort((a,b)=>a.display.localeCompare(b.display,'en'));
const results=Array(urls.length);let counter=0;
await Promise.all(Array.from({length:12},async()=>{
 while(counter<urls.length){
  const pos=counter++,entry=urls[pos],r=await inspect(entry.original);
  results[pos]={url:entry.display,used_on:[...entry.pages].slice(0,8),occurrences:entry.pages.size,...r};
  if(pos%100===0)console.log('HTTP checked '+(pos+1)+'/'+urls.length);
 }
}));
const byKind=results.reduce((x,r)=>(x[r.kind]=(x[r.kind]||0)+1,x),{});
const outdir=path.join(root,'reports');fs.mkdirSync(outdir,{recursive:true});
const json='phase6b-external-link-status-20261113.json',md='phase6b-external-link-status-20261113.md';
fs.writeFileSync(path.join(outdir,json),JSON.stringify({checked_on:'2026-11-13',scope:dirs,html_pages:pages.length,unique_urls:urls.length,by_kind:byKind,results},null,2)+'\n');
const lines=['# フェーズ6B 外部リンクのHTTP検査結果','','確認日：2026年11月13日（GitHub Actions）。対象はルート・journal・researchのHTML '+pages.length+'ページ。外部リンク '+urls.length+'URL（重複除去後）。','','HTTP 404/410は再確認候補であり、原典が削除されたと断定しません。403・429・通信失敗もリンク切れと認定しません。原典の同一性・内容まで検証するものではありません。URLのクエリ文字列は報告から省略しています。','','## HTTP状況（URL数）',''];
for(const k of Object.keys(byKind).sort())lines.push('- '+k+'：'+byKind[k]);
lines.push('','## 404・410（再確認候補）','');
for(const x of results.filter(x=>x.kind==='possible_404'))lines.push('- '+x.status+' '+x.url+' （掲載：'+x.used_on.slice(0,3).join(', ')+'）');
if(!results.some(x=>x.kind==='possible_404'))lines.push('該当なし');
lines.push('','## リダイレクトと到達先','');
for(const x of results.filter(x=>x.redirects.length))lines.push('- '+x.url+' → '+x.final+' （'+x.kind+' / HTTP '+x.status+'）');
if(!results.some(x=>x.redirects.length))lines.push('該当なし');
lines.push('','## 制限・通信失敗・サーバーエラー','');
for(const x of results.filter(x=>!['ok','possible_404'].includes(x.kind)&&!x.redirects.length))lines.push('- '+x.kind+' '+x.status+' '+x.url+' （掲載：'+x.used_on.slice(0,2).join(', ')+'）');
lines.push('','全URL別結果は '+json+' に保存。JavaScript内の生成URLや学校別アーカイブは今回の検査対象外。');
fs.writeFileSync(path.join(outdir,md),lines.join('\n')+'\n');
console.log('Phase6B external audit:',JSON.stringify({pages:pages.length,unique_urls:urls.length,byKind,files:[md,json]}));
