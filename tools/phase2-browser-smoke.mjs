import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {spawn,spawnSync} from "node:child_process";
const getChrome=()=>["google-chrome","chromium","chromium-browser"].find(x=>spawnSync("which",[x],{stdio:"ignore"}).status===0);
const chromeBin=getChrome();if(!chromeBin)throw Error("Chromium/Chrome executable not installed"); console.log("Chrome binary:",chromeBin);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"pta-phase2-chrome-"));
fs.mkdirSync("phase2-screenshots",{recursive:true});
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
  fs.writeFileSync("phase2-screenshots/"+name,Buffer.from(r.data,"base64"));
}
function requireResult(condition,message){assert.ok(condition,message);}
try{
 for(let i=0;i<120;i++){try{if((await fetch("http://127.0.0.1:8765/")).ok)break;}catch{}await sleep(200);}
 const target=await retry("http://127.0.0.1:9222/json/new?about:blank",{method:"PUT"});
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((res,rej)=>{ws.addEventListener("open",res,{once:true});ws.addEventListener("error",rej,{once:true});});
 ws.addEventListener("message",event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 await command("Page.enable");await command("Runtime.enable");
 for(const width of [1440,390]){
  await pageAt("/",width,width===390?844:900);
  const metrics=await evalPage("(()=>{const q=s=>document.querySelector(s),v=s=>q(s)?.getBoundingClientRect(),main=q('main'),svg=q('.relationship-svg.is-'+(window.innerWidth<600?'mobile':'desktop')),issues=q('.hc-issue-list'),news=q('.news-list'),map=q('[data-japan-map]');return {w:window.innerWidth,mainH2:main.querySelectorAll('h2').length,mainLinks:main.querySelectorAll('a').length,roles:document.querySelectorAll('.audience-entry>a').length,issues:issues?.querySelectorAll('a').length,issueDisplay:getComputedStyle(issues).display,issueColumns:getComputedStyle(issues).gridTemplateColumns,news:news?.querySelectorAll('li').length,stats:[...document.querySelectorAll('.home-source-stats dd strong')].map(x=>x.textContent.trim()),relationshipWidth:svg?.getBoundingClientRect().width,mapDisplay:getComputedStyle(map).display,mapWidth:v('[data-japan-map]')?.width,mapHeight:v('[data-japan-map]')?.height,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,search:q('#home-q')?.getBoundingClientRect().width||0}})()");
  console.log("HOME",JSON.stringify(metrics));
  requireResult(metrics.mainH2<=10,"too many H2 "+JSON.stringify(metrics));
  requireResult(metrics.mainLinks<=30,"too many home links "+JSON.stringify(metrics));
  requireResult(metrics.roles===3&&metrics.issues===5&&metrics.news===3,"home discovery/narrative incomplete "+JSON.stringify(metrics));
  requireResult(metrics.stats.join(",")==="29,569,72,31","source counts disagree "+JSON.stringify(metrics));
  requireResult(metrics.relationshipWidth>(width===390?200:350),"boundary SVG invisible "+JSON.stringify(metrics));
  requireResult(metrics.mapDisplay!=="none"&&metrics.mapWidth>250&&metrics.mapHeight>150,"map is hidden "+JSON.stringify(metrics));
  requireResult(metrics.issueDisplay==="grid","issue list not grid "+JSON.stringify(metrics));
  requireResult(metrics.search>150,"search form missing "+JSON.stringify(metrics));
  requireResult(metrics.scrollWidth<=metrics.clientWidth+12,"mobile horizontal overflow "+JSON.stringify(metrics));
  await snap("home-"+width+".png",".hero");
  await snap("map-"+width+".png","#map");
 }
 await pageAt("/research-index.html",390,844);
 requireResult(await evalPage("!!document.getElementById('top-explanation-archive')"),"research article relocation missing");
 await snap("research-390.png","#top-explanation-archive");
 await pageAt("/about.html",390,844);
 requireResult(await evalPage("!!document.getElementById('top-stance-and-audience')"),"about relocation missing");
 await pageAt("/journal.html",390,844);
 requireResult(await evalPage("!!document.getElementById('past-updates-from-home')"),"journal history relocation missing");
 console.log("Phase 2 Chrome assertions passed at desktop and mobile widths.");
}finally{try{ws?.close();}catch{}browser.kill("SIGKILL");server.kill("SIGKILL");try{fs.rmSync(tmp,{recursive:true,force:true,maxRetries:10,retryDelay:200});}catch(e){console.warn("Chrome profile cleanup deferred:",e.code);}}
