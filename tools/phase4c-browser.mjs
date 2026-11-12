import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {spawn,spawnSync} from "node:child_process";
const getChrome=()=>["google-chrome","chromium","chromium-browser"].find(x=>spawnSync("which",[x],{stdio:"ignore"}).status===0);
const chromeBin=getChrome();if(!chromeBin)throw Error("Chromium/Chrome executable not installed"); console.log("Chrome binary:",chromeBin);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"pta-phase4c-chrome-"));
fs.mkdirSync("phase4c-screenshots",{recursive:true});
const server=spawn("python3",["-m","http.server","8765","--bind","127.0.0.1"],{stdio:"ignore"});
const browser=spawn(chromeBin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--disable-background-networking","--remote-allow-origins=*","--remote-debugging-address=127.0.0.1","--remote-debugging-port=9222","--user-data-dir="+tmp,"about:blank"],{stdio:["ignore","ignore","inherit"]});browser.on("exit",(code,signal)=>console.error("Chrome exited:",code,signal));
function sleep(n){return new Promise(r=>setTimeout(r,n));}
async function retry(url,opts){let last="";for(let i=0;i<400;i++){try{let r=await fetch(url,opts);if(r.ok)return r.json();last="HTTP "+r.status+" "+(await r.text()).slice(0,120);}catch(e){last=String(e);}await sleep(200);}throw Error("Chrome not ready: "+url+" / "+last);}
let ws;let pending=new Map();let id=0;
async function command(method,params={}){
  const seq=++id;
  return new Promise((resolve,reject)=>{pending.set(seq,{resolve,reject});ws.send(JSON.stringify({id:seq,method,params}));});
}
async function evalPage(expression){
 const o=await command("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
 if(o.exceptionDetails)throw Error("Browser evaluation exception: "+o.exceptionDetails.text);
 return o.result.value;
}
async function pageAt(url,width,height){
  await command("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<600});
  await command("Page.navigate",{url:"http://127.0.0.1:8765"+url});
  let ready=false;
  for(let i=0;i<80;i++){ready=await evalPage("document.readyState==='complete'");if(ready)break;await sleep(100);}
  if(!ready)throw Error("Page failed to load: "+url);
  await sleep(600);
}
async function snap(name,selector){
  await evalPage(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:"start"})`);
  await sleep(200);
  const r=await command("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  fs.writeFileSync("phase4c-screenshots/"+name,Buffer.from(r.data,"base64"));
}
function requireResult(condition,message){assert.ok(condition,message);}
const PAGES=["/","/guide-board.html","/guide-pta.html","/guide-parent.html","/membership.html","/privacy.html","/fee-collection.html","/personnel.html","/facilities.html","/guideline.html","/ppc-points.html","/board-responses.html","/national-archive.html","/audit/","/about.html","/edu-board-separation.html","/education-board-responsibility.html","/law-map.html","/administrative-materials.html","/documents.html","/cases.html","/research-index.html","/archive/ota/school-001-es/"];
try{
 for(let i=0;i<110;i++){try{if((await fetch("http://127.0.0.1:8765/")).ok)break;}catch{}await sleep(200);}
 const target=await retry("http://127.0.0.1:9222/json/new?about:blank",{method:"PUT"});
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});});
 ws.addEventListener("message",event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 await command("Page.enable");await command("Runtime.enable");
 for(const width of [1440,390]){
  for(const page of PAGES){
   await pageAt(page,width,width===390?844:900);
   const m=await evalPage("(()=>{const q=s=>document.querySelector(s),main=q('main'),h=main?.querySelector('h1'),legacy=q('.legacy')||document.body,p=main?.querySelector('p:not(.section-kicker)')||q('.page-lead')||q('.hero-lead'),map=q('[data-japan-map]');const sz=e=>e?parseFloat(getComputedStyle(e).fontSize):0,computed=getComputedStyle(legacy);return {width:innerWidth,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,bodyFont:sz(document.body),paragraph:sz(p),h1Width:h?.getBoundingClientRect().width||0,photos:document.images.length,main:!!main,map:map?map.getBoundingClientRect().width:0,nav:!!q('.global-nav'),footer:!!q('.site-footer'),navy:computed.getPropertyValue('--navy').trim(),gold:computed.getPropertyValue('--gold').trim(),paper:computed.getPropertyValue('--paper').trim(),line:computed.getPropertyValue('--line').trim(),auditModes:q('.mode-grid')?.children.length||0}})()");
   console.log("PHASE4C",page,width,JSON.stringify(m));
   requireResult(m.nav&&m.footer&&m.main&&m.h1Width>125,"missing page chrome or title "+page);
   requireResult(m.scroll<=m.client+14,"horizontal page overflow "+page+" "+JSON.stringify(m));
   requireResult(m.bodyFont>=15.5&&m.paragraph>=13.5,"small body/paragraph "+page+" "+JSON.stringify(m));
   if(page!=="/"){
    for(const c of ["navy","gold","paper","line"])requireResult(m[c].length>0,"unresolved theme token "+c+" "+page);
   }else requireResult(m.map>200,"national map hidden");
   if(page==="/guide-board.html"||page==="/guide-pta.html")requireResult(m.photos>0,"guide imagery missing");
   if(page==="/audit/")requireResult(m.auditModes===3,"audit three role cards missing");
   if(["/","/guide-board.html","/about.html","/law-map.html","/audit/"].includes(page)){
     const f=(page==="/"? "home":page.replaceAll("/","-"))+"-"+width+".png";
     await snap(f,page==="/"?".hero":page==="/audit/"?".mode-grid":".article-hero");
   }
  }
 }
 console.log("Phase 4C Chromium QA passed at 1440px and 390px.");
}finally{try{ws?.close();}catch{}browser.kill("SIGKILL");server.kill("SIGKILL");try{fs.rmSync(tmp,{recursive:true,force:true,maxRetries:10,retryDelay:200});}catch(e){console.warn("Chrome profile cleanup deferred:",e.code);}}
