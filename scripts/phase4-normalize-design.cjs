#!/usr/bin/env node
// Phase 4, normalizes shared CSS declarations; no HTML, copy, imagery, or URL changes.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const FILES=['assets/style.css','css/site.css','css/editorial.css','css/prose.css','css/journal-article.css','css/shared/editorial-page-common.css'];
const PALETTE={
 paper:'#FFFFFF','paper-alt':'#F6F5F1',tint:'#EEF2F5','tint-strong':'#DEE6ED',
 ink:'#1A2433','ink-sub':'#4A5568','ink-faint':'#637181',
 navy:'#1A365D','navy-deep':'#0F2742','navy-mid':'#274C72',link:'#1A4E86',
 gold:'#B8912A','gold-line':'#D3B35F',line:'#D9DEE5','line-strong':'#B9C3CF',
 'c-caution':'#9A5B00','c-caution-bg':'#FFF6E5'
};
const ROOT=[
':root{',
'/* Six-step type scale (12 metadata / 14 / 16 / 18 / 24 / 34 px) */',
'--fs-micro:.75rem;--fs-small:.875rem;--fs-body:1rem;--fs-h3:1.125rem;--fs-h2:1.5rem;--fs-h1:2.125rem;',
'--paper:#FFFFFF;--paper-alt:#F6F5F1;--tint:#EEF2F5;--tint-strong:#DEE6ED;',
'--ink:#1A2433;--ink-sub:#4A5568;--ink-faint:#637181;',
'--navy:#1A365D;--navy-deep:#0F2742;--navy-mid:#274C72;--link:#1A4E86;',
'--gold:#B8912A;--gold-line:#D3B35F;--line:#D9DEE5;--line-strong:#B9C3CF;',
'--k-primary:var(--navy);--k-response:var(--navy);--k-school:var(--navy);--k-analysis:var(--ink-sub);--k-region:var(--navy);',
'--c-caution:#9A5B00;--c-caution-bg:#FFF6E5;--c-unknown:var(--ink-sub);--c-unknown-bg:var(--paper-alt);',
'--accent:var(--navy);--accent-ink:var(--paper);',
'--map-off:var(--tint-strong);--map-on:var(--navy-mid);--map-on-hover:var(--navy-deep);',
'--serif:"Noto Serif JP","Hiragino Mincho ProN","Yu Mincho",serif;',
'--sans:"Noto Sans JP","Hiragino Sans","Yu Gothic UI","Meiryo",system-ui,sans-serif;',
'--radius-sm:4px;--radius-md:8px;--radius:var(--radius-sm);',
'--shadow:0 6px 18px color-mix(in srgb,var(--navy-deep) 10%,transparent);',
'--container:1200px;--gutter:clamp(16px,3vw,32px);--header-h:72px;',
'}'
].join('\n');
function hexColor(raw){
 let s=raw.slice(1).toLowerCase();
 if(s.length===3||s.length===4)s=[...s].map(x=>x+x).join('');
 if(![6,8].includes(s.length))return null;
 return {r:parseInt(s.slice(0,2),16),g:parseInt(s.slice(2,4),16),b:parseInt(s.slice(4,6),16),a:s.length===8?parseInt(s.slice(6,8),16)/255:1};
}
function token(rgb,prop,selector){
 const r=rgb.r,g=rgb.g,b=rgb.b,avg=(r+g+b)/3,sat=Math.max(r,g,b)-Math.min(r,g,b);
 const text=/^(?:color|fill|stroke|outline-color|text-decoration-color|caret-color)$/.test(prop);
 const border=/border|outline|rule/.test(prop);
 const warn=/warning|alert|caution|error|danger|invalid|risk|critical/i.test(selector);
 const official=/source|primary|label-primary|citation|reference/i.test(selector);
 const analysis=/analysis|label-analysis/i.test(selector);
 const warm=r>g*1.15&&g>b*1.1;
 if(warn)return avg>155?'c-caution-bg':'c-caution';
 if(official&&text)return 'navy';
 if(analysis&&text)return 'ink-sub';
 if(sat>48&&r>g*1.4&&g<140)return text?'c-caution':'navy';
 if(warm&&sat>32&&avg<185)return text||border?'gold':'navy-deep';
 if(avg>246)return 'paper';
 if(avg>220)return warm&&sat>18&&r>228?'c-caution-bg':border?'line':'paper-alt';
 if(avg>183)return border?'line-strong':'tint-strong';
 if(avg>143)return text?'ink-sub':'line-strong';
 if(avg>97)return text?'ink-sub':'navy-mid';
 if(sat<24)return text?'ink':'navy-deep';
 return avg<110?'navy-deep':'navy';
}
function color(rgb,prop,selector){
 const t=token(rgb,prop,selector);
 if(rgb.a>=.995)return 'var(--'+t+')';
 if(rgb.a<=0)return 'transparent';
 return 'color-mix(in srgb,var(--'+t+') '+Math.round(rgb.a*1000)/10+'%,transparent)';
}
function recolor(v,prop,selector){
 if(prop==='content'||/url\s*\(/i.test(v))return v;
 return v.replace(/#[a-f0-9]{3,8}\b/gi,x=>{const c=hexColor(x);return c?color(c,prop,selector):x})
 .replace(/\brgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(0?\.\d+|0|1(?:\.0+)?))?\s*\)/gi,(_m,r,g,b,a)=>color({r:+r,g:+g,b:+b,a:a===undefined?1:+a},prop,selector));
}
function typeValue(v){
 if(/^\s*(?:inherit|initial|unset|revert|smaller|larger|medium|small|large)\b/.test(v))return v;
 return v.replace(/(^|[\s,(])(\d*\.?\d+)(rem|px|em)(?=$|[\s,)!])/g,(whole,pre,n,u)=>{
  let x=Number(n);if(u==='px')x/=16;if(x===0)return whole;
  return pre+'var(--'+(x<.81?'fs-small':x<1.055?'fs-body':x<1.31?'fs-h3':x<1.8?'fs-h2':'fs-h1')+')';
 });
}
function spacing(v){return v.replace(/(?<![\w.#])(-?\d+(?:\.\d+)?)px\b/g,(whole,n)=>{
 const x=+n;if(Math.abs(x)<3||Math.abs(x)>300)return whole;
 return Math.round(x/4)*4+'px';
});}
function declaration(s,selector,file,count){
 const m=s.match(/^((?:\s|\/\*[\s\S]*?\*\/)*)([-a-zA-Z][\w-]*)(\s*:\s*)([\s\S]*?)(;\s*)$/);
 if(!m)return s;
 const [,pad,key,col,raw,end]=m;let v=raw;const custom=key.startsWith('--');
 if(key==='font-size')v=typeValue(v);
 else if(/^(?:margin(?:-.*)?|padding(?:-.*)?|gap|row-gap|column-gap)$/i.test(key))v=spacing(v);
 else if(key==='border-radius')v=v.replace(/\b(\d+)px\b/g,(x,n)=>+n===0?'0':+n>6?'var(--radius-md)':'var(--radius-sm)');
 else if(key==='box-shadow'&&!/\binset\b/.test(v))v=/nav-panel|popover|dropdown|modal|menu-panel/.test(selector)?'var(--shadow)':'none';
 const gradient=/\b(?:linear|radial|repeating-linear|repeating-radial)-gradient\s*\(/i.test(v);
 if(!custom&&/^(?:background|background-image)$/i.test(key)&&gradient&&!/hero|banner|photo|ornament/i.test(selector)&&!/url\s*\(/i.test(v)){
  const dark=/--navy|#0[a-f0-9]{5}|#1[a-f0-9]{5}|bluebar|support-strip|site-header|toc-title|statement|btn-|cta/i.test(v+' '+selector);
  v=key==='background-image'?'none':dark?'var(--navy-deep)':'var(--paper-alt)';
 }
 // Keep source root palette as literal values; all other colors go through tokens.
 if(!(file==='assets/style.css'&&custom))v=recolor(v,key,selector);
 if(v!==raw)count.replaced++;
 return pad+key+col+v+end;
}
function normalize(css,file){
 if(file==='assets/style.css'){
  const rootMatch=css.match(/:root\s*\{[\s\S]*?\}/);
  if(!rootMatch)throw Error('Missing root tokens');
  css=css.replace(rootMatch[0],ROOT);
 }
 let out='',start=0,paren=0,quote='',esc=false,comment=false,stack=[],count={replaced:0};
 for(let i=0;i<css.length;i++){
  const ch=css[i],next=css[i+1]||'';
  if(comment){if(ch==='*'&&next==='/'){comment=false;i++}continue}
  if(quote){if(esc){esc=false;continue}if(ch==='\\'){esc=true;continue}if(ch===quote)quote='';continue}
  if(ch==='/'&&next==='*'){comment=true;i++;continue}
  if(ch==='"'||ch==="'"){quote=ch;continue}
  if(ch==='('){paren++;continue}if(ch===')'&&paren){paren--;continue}
  if(paren)continue;
  if(ch==='{'){out+=css.slice(start,i+1);stack.push(css.slice(start,i).split('}').at(-1).trim());start=i+1}
  else if(ch===';'){out+=declaration(css.slice(start,i+1),stack.join(' '),file,count);start=i+1}
  else if(ch==='}'){
   let pending=css.slice(start,i);
   if(/:\s*[^;{}]+$/.test(pending))pending=declaration(pending+';',stack.join(' '),file,count).replace(/;$/,'');
   out+=pending+'}';start=i+1;stack.pop();
  }
 }
 out+=css.slice(start);
 if(file==='assets/style.css'){
  const rules=fs.readFileSync(path.join(root,'css','phase4-editorial-rules.css'),'utf8').trim();
  const marker='/* Phase 4 design system start */',end='/* Phase 4 design system end */';
  out=out.split(marker)[0].trimEnd()+'\n\n'+marker+'\n'+rules+'\n'+end+'\n';
 }
 return {text:out,...count};
}
function stats(s){return {bytes:s.length,colors:new Set([...s.matchAll(/#[a-f0-9]{3,8}\b/gi)].map(m=>m[0].toLowerCase())).size,type:new Set([...s.matchAll(/font-size\s*:\s*([^;}]+)/g)].map(m=>m[1].trim())).size,gradients:(s.match(/\b(?:linear|radial|repeating-linear)-gradient\(/g)||[]).length}}
function main(){
 const check=process.argv.includes('--check'),summaries=[];
 for(const f of FILES){
  const pathName=path.join(root,f),old=fs.readFileSync(pathName,'utf8');
  if(check){summaries.push({file:f,...stats(old)});continue}
  const changed=normalize(old,f);
  if(old!==changed.text)fs.writeFileSync(pathName,changed.text);
  summaries.push({file:f,before:stats(old),after:stats(changed.text),replaced:changed.replaced});
 }
 console.log('Phase 4 CSS:',JSON.stringify(summaries));
 if(check){
  const main=fs.readFileSync(path.join(root,'assets/style.css'),'utf8');
  if(!main.includes('/* Phase 4 design system start */'))throw Error('Phase 4 editorial rules missing');
  if(summaries[0].colors>25)throw Error('Too many core CSS literal colors: '+summaries[0].colors);
  if(summaries[0].type>30)throw Error('Too many core font sizes: '+summaries[0].type);
 }
}
if(require.main===module)main();
module.exports={normalize,stats};
