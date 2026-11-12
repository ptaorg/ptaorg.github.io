import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {spawn,spawnSync} from "node:child_process";
const getChrome=()=>["google-chrome","chromium","chromium-browser"].find(x=>spawnSync("which",[x],{stdio:"ignore"}).status===0);
const chromeBin=getChrome();if(!chromeBin)throw Error("Chromium/Chrome executable not installed"); console.log("Chrome binary:",chromeBin);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"pta-phase4d-chrome-"));
fs.mkdirSync("phase4d-screenshots",{recursive:true});
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
  fs.writeFileSync("phase4d-screenshots/"+name,Buffer.from(r.data,"base64"));
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
  for(const page of ["/guide-board.html","/guide-pta.html"]){
   await pageAt(page,width,width===390?844:900);
   await evalPage("(()=>{const icon=document.querySelector('[role=\"img\"][aria-label] svg');let el=icon?.closest('details');while(el){el.open=true;el=el.parentElement?.closest('details')}})()");
   const metrics=await evalPage("(()=>{const q=s=>document.querySelector(s),icons=[...document.querySelectorAll('[role=\"img\"][aria-label] svg')],first=icons[0],r=first?.getBoundingClientRect(),visible=icons.filter(x=>{const v=x.getBoundingClientRect(),s=getComputedStyle(x);return v.width>=12&&v.height>=12&&s.display!=='none'&&s.visibility!=='hidden'}).length;return {width:innerWidth,total:icons.length,visible,firstWidth:r?.width||0,firstHeight:r?.height||0,labels:[...new Set(icons.map(x=>x.parentElement.getAttribute('aria-label')))],images:document.images.length,links:document.querySelectorAll('a[href]').length,chapterCount:document.querySelectorAll('.phase3-chapter-intro').length,nav:!!q('.global-nav'),footer:!!q('.site-footer'),scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}})()");
   console.log('PHASE4D',page,width,JSON.stringify(metrics));
   requireResult(metrics.total===(page.includes('guide-board')?43:22),"Not all icons rendered "+page);
   requireResult(metrics.visible>0&&metrics.firstWidth>=14&&metrics.firstHeight>=14,"SVG icon drawing missing "+page);
   requireResult(metrics.labels.includes('チェック印')&&metrics.labels.includes('バツ印'),"Accessible labels missing "+page);
   requireResult(metrics.nav&&metrics.footer&&metrics.chapterCount===6,"Original guide structure lost "+page);
   requireResult(metrics.scroll<=metrics.client+14,"Horizontal overflow "+page+" "+JSON.stringify(metrics));
   requireResult(metrics.images>5,"Guide images disappeared "+page);
   await snap(page.slice(1).replace('.html','')+"-"+width+".png",page.includes('guide-board')?'.scope-grid':'.compare-wrap');
  }
 }
 console.log("Phase 4D SVGs, accessible labels, prose structure and responsive layout confirmed.");
}finally{try{ws?.close();}catch{}browser.kill("SIGKILL");server.kill("SIGKILL");try{fs.rmSync(tmp,{recursive:true,force:true,maxRetries:10,retryDelay:200});}catch(e){console.warn("Chrome profile cleanup deferred:",e.code);}}
