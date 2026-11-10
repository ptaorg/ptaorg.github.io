#!/usr/bin/env node
/** Capture legacy ptaorg.github.io pages for porting.
 *  Serves nothing itself: run `python3 -m http.server 8800` in the legacy checkout first.
 *  Usage: node scripts/port/capture.mjs <legacy-checkout> <out-dir> [baseUrl]
 *  For each page: loads it in Chromium so the legacy runtime scripts add their content,
 *  then keeps only the page content (legacy header/nav/footer/support strip/breadcrumbs removed).
 *  Pages whose own scripts generate content are captured from source instead, and keep their scripts.
 */
import fs from 'node:fs';import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const [src,out,base='http://localhost:8800']=process.argv.slice(2);
if(!src||!out){console.error('usage: capture.mjs <legacy> <out> [base]');process.exit(2);}
const SKIP_DIRS=/^(ai-system|tools|scripts|source-candidates|parts|node_modules|\.github|pta-open-system)\//;
const SKIP_FILES=new Set(['index.html','PTA#U904b#U55b6#U9069#U6b63#U5316#U30ac#U30a4#U30c9#U30d6#U30c3#U30af_#U7b2c4#U7248_#U6539#U8a02#U672c#U6587.html']);
// pages whose own scripts build content: take source DOM and keep their scripts
export const RAW=new Set(['national-archive.html','archive/kuki/index.html','documents.html','board-pta-chain.html','pta-application-chain.html','pta-officer-chain.html','research-map.html','board-responses.html','document.html','audit/index.html','law-map.html','guide-board-print.html','proper-management.html']);
function walk(dir,rel=''){let r=[];for(const e of fs.readdirSync(path.join(dir,rel),{withFileTypes:true})){const p=rel?`${rel}/${e.name}`:e.name;if(e.name==='.git')continue;if(e.isDirectory())r=r.concat(walk(dir,p));else if(e.name.endsWith('.html'))r.push(p);}return r;}
const pages=walk(src).filter(p=>!SKIP_DIRS.test(p+'/')&&!SKIP_DIRS.test(p)&&!SKIP_FILES.has(p)).sort();
fs.mkdirSync(out,{recursive:true});

const FILTER=`(doc,isLive)=>{
  const REMOVE=['header.site-header','.mobile-overlay','#mobileOverlay','.support-strip','.skip-link','nav.breadcrumb','.breadcrumb','.breadcrumbs','.breadcrumb-bar','nav.current-location-breadcrumb','[class*="current-location"]','.scroll-top-button','footer.footer','footer.site-foot','footer.site-footer','footer.document-site-footer','footer.submit-footer','footer.essay-footer','header.submit-header','.mobile-menu','.search-results-dropdown','.header-search','.desktop-nav','.global-nav-v102','.global-footer','noscript','link','meta'];
  const body=doc.body;
  const scripts=[];const styles=[];
  for(const s of [...doc.querySelectorAll('script')]){const t=s.getAttribute('type')||'';
    if(t==='application/ld+json'){s.remove();continue;}
    scripts.push(s.src?{src:s.getAttribute('src')}:{text:s.textContent});s.remove();}
  for(const s of [...doc.querySelectorAll('style')]){styles.push({text:s.textContent,inBody:body.contains(s)});s.remove();}
  for(const sel of REMOVE){for(const e of [...body.querySelectorAll(sel)])e.remove();}
  for(const f of [...body.querySelectorAll(':scope > footer')]){if(!f.className)f.remove();}
  // English-only eyebrows/kickers
  const JP=/[\\u3040-\\u30ff\\u3400-\\u9fff]/;
  for(const e of [...body.querySelectorAll('[class]')]){const c=e.getAttribute('class')||'';
    if(!/(kicker|eyebrow|overline|section-label|label-en|en-label|journal-tag|hero-label)/i.test(c))continue;
    const t=(e.textContent||'').trim();
    if(!t)continue;
    if(!JP.test(t)&&/[A-Za-z]{3}/.test(t)&&t.length<60){e.remove();continue;}
    if(JP.test(t)&&e.children.length===0){const m=t.match(/^[A-Za-z0-9 ,.&'’\\-]+\\s*[·・|｜／/:：]\\s*/);if(m)e.textContent=t.slice(m[0].length);}
  }
  const kids=[...body.children].map(e=>e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).join('.'):'')+(e.id?'#'+e.id:''));
  return {html:body.innerHTML,kids,scripts,styles,bodyClass:body.getAttribute('class')||'',bodyAttrs:[...body.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])};
}`;

const HEAD=`(doc)=>{
  const q=s=>doc.querySelector(s);
  return {title:(q('title')||{}).textContent||'',description:(q('meta[name="description"]')||{content:''}).getAttribute?.('content')||'',
    ogImage:(q('meta[property="og:image"]')||{getAttribute:()=>''}).getAttribute('content')||'',
    canonical:(q('link[rel="canonical"]')||{getAttribute:()=>''}).getAttribute('href')||'',
    refresh:(q('meta[http-equiv="refresh" i]')||{getAttribute:()=>''}).getAttribute('content')||'',
    robots:(q('meta[name="robots"]')||{getAttribute:()=>''}).getAttribute('content')||'',
    jsonld:[...doc.querySelectorAll('script[type="application/ld+json"]')].map(s=>s.textContent),
    css:[...doc.querySelectorAll('link[rel~="stylesheet"]')].map(l=>l.getAttribute('href'))};
}`;

const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:1366,height:900}});
await ctx.route('**/*',r=>{const u=r.request().url();if(/googletagmanager|google-analytics|youtube\.com|ytimg|doubleclick/.test(u))return r.abort();return r.continue();});
let i=0;const N=6;const t0=Date.now();const failures=[];
async function worker(){const page=await ctx.newPage();page.on('dialog',d=>d.dismiss());
  while(i<pages.length){const rel=pages[i++];const url=`${base}/${rel.split('/').map(encodeURIComponent).join('/')}`;
    try{
      const source=fs.readFileSync(path.join(src,rel),'utf8');
      let result;
      if(RAW.has(rel)){
        await page.goto('about:blank');
        result=await page.evaluate(([html,F,H])=>{const doc=new DOMParser().parseFromString(html,'text/html');const head=eval(H)(doc);const body=eval(F)(doc,false);return {...head,...body};},[source,FILTER,HEAD]);
        result.raw=true;
      }else{
        await page.goto(url,{waitUntil:'load',timeout:30000});
        await page.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});
        await page.waitForTimeout(250);
        result=await page.evaluate(([F,H])=>{const head=eval(H)(document);const dyn=[...document.querySelectorAll('link[rel~="stylesheet"]')].map(l=>l.getAttribute('href'));const body=eval(F)(document,true);return {...head,css:dyn,...body};},[FILTER,HEAD]);
        // keep the page's own inline scripts (event handlers only, content already rendered)
        result.raw=false;
      }
      // source-level inline scripts in body for re-run on baked pages
      result.path=rel;
      fs.writeFileSync(path.join(out,rel.replace(/\//g,'__')+'.json'),JSON.stringify(result));
    }catch(e){failures.push([rel,String(e).slice(0,200)]);}
    if(i%50===0)console.log(`${i}/${pages.length} ${(Date.now()-t0)/1000|0}s`);
  }
  await page.close();}
await Promise.all(Array.from({length:N},worker));
await browser.close();
console.log('captured',pages.length-failures.length,'failed',failures.length);for(const f of failures)console.log(' ',...f);
