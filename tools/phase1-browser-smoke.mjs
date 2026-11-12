import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {spawn,spawnSync} from "node:child_process";
const getChrome=()=>["google-chrome","chromium","chromium-browser"].find(x=>spawnSync("which",[x],{stdio:"ignore"}).status===0);
const chromeBin=getChrome();if(!chromeBin)throw Error("Chromium/Chrome executable not installed");
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"pta-phase1-chrome-"));
fs.mkdirSync("phase1-screenshots",{recursive:true});
const server=spawn("python3",["-m","http.server","8765","--bind","127.0.0.1"],{stdio:"ignore"});
const browser=spawn(chromeBin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--disable-background-networking","--remote-allow-origins=*","--remote-debugging-port=9222","--user-data-dir="+tmp,"about:blank"],{stdio:"ignore"});
function sleep(n){return new Promise(r=>setTimeout(r,n));}
async function retry(url,opts){for(let i=0;i<80;i++){try{let r=await fetch(url,opts);if(r.ok)return r.json();}catch{}await sleep(200);}throw Error("Chrome not ready");}
let ws;let pending=new Map();let id=0;
async function command(method,params={}){
  const seq=++id;
  return new Promise((resolve,reject)=>{pending.set(seq,{resolve,reject});ws.send(JSON.stringify({id:seq,method,params}));});
}
async function evalPage(expression){
 const o=await command("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
 if(o.exceptionDetails)throw Error("Browser evaluation exception: "+o.exceptionDetails.text);
 return o.result.result.value;
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
  fs.writeFileSync("phase1-screenshots/"+name,Buffer.from(r.data,"base64"));
}
function requireResult(condition,message){assert.ok(condition,message);}
try{
 await retry("http://127.0.0.1:8765/");
 const target=await retry("http://127.0.0.1:9222/json/new?about:blank",{method:"PUT"});
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((res,rej)=>{ws.addEventListener("open",res,{once:true});ws.addEventListener("error",rej,{once:true});});
 ws.addEventListener("message",event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 await command("Page.enable");await command("Runtime.enable");
 for(const width of [1440,390]){
  await pageAt("/",width,width===390?844:900);
  let v=await evalPage(`(()=>{const q=s=>document.querySelector(s),info=s=>q(s)?.getBoundingClientRect().width;return {button:getComputedStyle(q(".migration-home .hc-button")).display,svg:info(".migration-home .relationship-svg."+(${width}===390?"is-mobile":"is-desktop")),paragraph:info(".migration-home .hc-lead"),logo:getComputedStyle(q(".site-header .brand"),"::before").content,nowrap:getComputedStyle(q(".menu-button")).whiteSpace}})()`);
  requireResult(v.button==="inline-flex","home links not separated "+width+" "+JSON.stringify(v));
  requireResult(v.svg>(width===390?200:350),"home relationship figure too small "+width+" "+JSON.stringify(v));
  requireResult(v.paragraph<750,"reading paragraph too wide "+width+" "+JSON.stringify(v));
  requireResult(v.logo==="none"||v.logo==="normal","duplicate header logo "+width+" "+JSON.stringify(v));
  requireResult(v.nowrap==="nowrap","mobile menu can wrap "+width);
  await snap("home-"+width+".png",".migration-home");
  await pageAt("/audit/",width,width===390?844:900);
  v=await evalPage(`(()=>{const q=s=>document.querySelector(s),images=[...document.querySelectorAll(".mode-card-image img")];return {grid:getComputedStyle(q(".mode-grid")).gridTemplateColumns.split(" ").length,photo:getComputedStyle(q(".mode-card-image")).display,checks:getComputedStyle(q(".mode-check-list")).display,images:images.length,loaded:images.filter(i=>i.complete&&i.naturalWidth>0).length,meta:q(".page-meta")?.innerText}})()`);
  requireResult(v.images===3&&v.loaded===3,"audit photos not loaded "+width+" "+JSON.stringify(v));
  requireResult(v.photo!=="none"&&v.checks!=="none","audit photos/checklist hidden "+width+" "+JSON.stringify(v));
  requireResult(v.grid===(width===390?1:3),"audit card grid not responsive "+width+" "+JSON.stringify(v));
  requireResult(v.meta.includes("5つの確認軸"),"audit metadata still fragment");
  await snap("audit-"+width+".png",".mode-grid");
 }
 // Sample school page generated from source metadata, with the removed duplicate four-card block.
 const root="data/schools";let sample=null;
 for(const city of fs.readdirSync(root)){
  const dir=path.join(root,city);if(!fs.statSync(dir).isDirectory())continue;
  for(const name of fs.readdirSync(dir)){
   if(!name.endsWith(".json"))continue;
   const data=JSON.parse(fs.readFileSync(path.join(dir,name),"utf8"));
   if(data.pageMode==="materials"){sample="/archive/"+city+"/"+data.slug+"/";break;}
  }if(sample)break;
 }
 if(!sample)throw Error("No material-mode school record found");
 await pageAt(sample,390,844);
 const school=await evalPage(`({duplicate:[...document.querySelectorAll("h2")].some(h=>h.textContent.trim()==="このページについて"),materials:[...document.querySelectorAll("h2")].some(h=>h.textContent.trim()==="資料一覧")})`);
 requireResult(!school.duplicate&&school.materials,"school duplicate cards remain or listing missing "+JSON.stringify(school));
 await snap("school-390.png",".archive-hero");
 console.log("Chrome assertions passed at 1440px and 390px. Screenshots are saved.");
}finally{try{ws?.close();}catch{}browser.kill("SIGKILL");server.kill("SIGKILL");fs.rmSync(tmp,{recursive:true,force:true});}
