import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {spawn,spawnSync} from "node:child_process";
const getChrome=()=>["google-chrome","chromium","chromium-browser"].find(x=>spawnSync("which",[x],{stdio:"ignore"}).status===0);
const chromeBin=getChrome();if(!chromeBin)throw Error("Chromium/Chrome executable not installed"); console.log("Chrome binary:",chromeBin);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"pta-phase4-chrome-"));
fs.mkdirSync("phase4-screenshots",{recursive:true});
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
  fs.writeFileSync("phase4-screenshots/"+name,Buffer.from(r.data,"base64"));
}
function requireResult(condition,message){assert.ok(condition,message);}
try{
 for(let i=0;i<110;i++){try{if((await fetch("http://127.0.0.1:8765/")).ok)break;}catch{}await sleep(200);}
 const target=await retry("http://127.0.0.1:9222/json/new?about:blank",{method:"PUT"});
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});});
 ws.addEventListener("message",event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 await command("Page.enable");await command("Runtime.enable");
 for(const width of [1440,390]){
  for(const page of ["/","/guide-board.html","/guide-pta.html","/guide-parent.html","/membership.html","/privacy.html","/journal/matsuyama-pta-fee-unification-20261013.html","/archive/ota/school-001-es/"]){
   await pageAt(page,width,width===390?844:900);
   const m=await evalPage("(()=>{const q=s=>document.querySelector(s),h=q('main h1'),main=q('.article-main'),p=main?.querySelector('p:not(.section-kicker)')||q('.page-lead')||q('.hero-lead'),map=q('[data-japan-map]');const sz=e=>e?parseFloat(getComputedStyle(e).fontSize):0;return {width:innerWidth,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,bodyFont:sz(document.body),copyFont:sz(p),h1Font:sz(h),h1Width:h?.getBoundingClientRect().width||0,article:!!main,images:document.images.length,mapVisible:map?map.getBoundingClientRect().width>200:null,nav:!!q('.global-nav'),footer:!!q('.site-footer'),css:[...document.styleSheets].some(x=>(x.href||'').includes('style.css'))}})()");
   console.log("PHASE4",page,width,JSON.stringify(m));
   requireResult(m.nav&&m.footer&&m.h1Width>140,"chrome or title missing "+page);
   requireResult(m.scroll<=m.client+14,"horizontal overflow "+page+" "+JSON.stringify(m));
   requireResult(m.bodyFont>=15.5,"body text below 16px "+page);
   requireResult(m.copyFont>=13.5,"copy below 14px "+page);
   requireResult(m.css,"shared CSS missing "+page);
   if(page==="/")requireResult(m.mapVisible===true,"home map hidden");
   if(page.includes('guide-board')||page.includes('guide-pta'))requireResult(m.images>0,"guide pictures missing "+page);
   if(page==="/"||page.includes('guide-board')||page.includes('guide-parent')||page.includes('privacy')){
    const file=(page==="/"? "home" : page.slice(1).replaceAll("/", "-").replace(".html",""))+"-"+width+".png";
    await snap(file,page==="/"?".hero":".article-hero");
   }
  }
 }
 console.log("Phase 4 Chromium checks passed at 1440px and 390px.");
}finally{try{ws?.close();}catch{}browser.kill("SIGKILL");server.kill("SIGKILL");try{fs.rmSync(tmp,{recursive:true,force:true,maxRetries:10,retryDelay:200});}catch(e){console.warn("Chrome profile cleanup deferred:",e.code);}}
