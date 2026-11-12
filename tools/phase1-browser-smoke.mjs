import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {spawn,spawnSync} from "node:child_process";
const getChrome=()=>["google-chrome","chromium","chromium-browser"].find(x=>spawnSync("which",[x],{stdio:"ignore"}).status===0);
const chromeBin=getChrome();if(!chromeBin)throw Error("Chromium/Chrome executable not installed"); console.log("Chrome binary:",chromeBin);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"pta-phase1-chrome-"));
fs.mkdirSync("phase1-screenshots",{recursive:true});
const server=spawn("python3",["-m","http.server","8765","--bind","127.0.0.1"],{stdio:"ignore"});
const browser=spawn(chromeBin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--disable-background-networking","--remote-allow-origins=*","--remote-debugging-address=127.0.0.1","--remote-debugging-port=9222","--user-data-dir="+tmp,"about:blank"],{stdio:["ignore","ignore","inherit"]});browser.on("exit",(code,signal)=>console.error("Chrome exited:",code,signal));
function sleep(n){return new Promise(r=>setTimeout(r,n));}
async function retry(url,opts){let last="";for(let i=0;i<80;i++){try{let r=await fetch(url,opts);if(r.ok)return r.json();last="HTTP "+r.status+" "+(await r.text()).slice(0,120);}catch(e){last=String(e);}await sleep(200);}throw Error("Chrome not ready: "+url+" / "+last);}
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
  fs.writeFileSync("phase1-screenshots/"+name,Buffer.from(r.data,"base64"));
}
function requireResult(condition,message){assert.ok(condition,message);}
try{
 for(let i=0;i<80;i++){try{if((await fetch("http://127.0.0.1:8765/")).ok)break;}catch{}await sleep(200);}
 const target=await retry("http://127.0.0.1:9222/json/new?about:blank",{method:"PUT"});
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((res,rej)=>{ws.addEventListener("open",res,{once:true});ws.addEventListener("error",rej,{once:true});});
 ws.addEventListener("message",event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 await command("Page.enable");await command("Runtime.enable");
 for(const width of [1440,390]){
  await pageAt("/",width,width===390?844:900);
  let v=await evalPage(`(()=>{const q=s=>document.querySelector(s),info=s=>q(s)?.getBoundingClientRect().width;return {button:getComputedStyle(q(".migration-home .hc-button")).display,svg:info(".migration-home .relationship-svg."+(${width}===390?"is-mobile":"is-desktop")),paragraph:info(".migration-home .hc-lead"),logo:getComputedStyle(q(".site-header .brand"),"::before").content,nowrap:getComputedStyle(q(".menu-button")).whiteSpace}})()`);
  requireResult(v.button==="inline-flex"||v.button==="flex","home links not separated "+width+" "+JSON.stringify(v));
  requireResult(v.svg>(width===390?200:350),"home relationship figure too small "+width+" "+JSON.stringify(v));
  requireResult(v.paragraph<750,"reading paragraph too wide "+width+" "+JSON.stringify(v));
  requireResult(v.logo==="none"||v.logo==="normal","duplicate header logo "+width+" "+JSON.stringify(v));
  requireResult(v.nowrap==="nowrap","mobile menu can wrap "+width);
  await snap("home-"+width+".png",".migration-home");
  await pageAt("/audit/",width,width===390?844:900);
  v=await evalPage(`(()=>{const q=s=>document.querySelector(s),images=[...document.querySelectorAll(".mode-card-image img")];return {grid:getComputedStyle(q(".mode-grid")).gridTemplateColumns.trim().split(/\\s+/).length,gridCSS:getComputedStyle(q(".mode-grid")).gridTemplateColumns,gridDisplay:getComputedStyle(q(".mode-grid")).display,innerWidth:window.innerWidth,clientWidth:document.documentElement.clientWidth,bodyWidth:document.body.clientWidth,deviceScaleFactor:window.devicePixelRatio,photo:getComputedStyle(q(".mode-card-image")).display,checks:getComputedStyle(q(".mode-check-list")).display,images:images.length,loaded:images.filter(i=>i.complete&&i.naturalWidth>0).length,meta:q(".page-meta")?.innerText}})()`);
  console.log("AUDIT GRID DETAILS",width,JSON.stringify(v));
  console.log("AUDIT MODE RULES",JSON.stringify(await evalPage(`(()=>{const sheet=[...document.styleSheets].find(s=>s.href?.includes("audit-index.css"));let out=[];function walk(rules,context=""){for(const r of rules){if(r.cssRules)walk(r.cssRules,context+" / "+r.conditionText);if(r.selectorText?.includes("mode-grid")){out.push({context,sel:r.selectorText,style:r.style?.cssText,elMatches:document.querySelector(".mode-grid").matches(r.selectorText)})}}}walk(sheet.cssRules);return {count:sheet.cssRules.length,matchingRules:out,tail:[...sheet.cssRules].slice(-8).map(r=>({type:r.type,sel:r.selectorText,brief:r.cssText.slice(0,180)}))}})()`)));
  console.log("AUDIT CSS FILE",JSON.stringify(await evalPage(`(async()=>{const el=document.querySelector(".mode-grid");const styles=[...document.styleSheets].map(s=>{let count=0,error=null;try{count=s.cssRules.length}catch(e){error=String(e)}return {href:s.href?.split("/").slice(-4).join("/"),count,error}});const f=await fetch("../css/pages/audit-index.css");const t=await f.text();return {styles,fetchStatus:f.status,mime:f.headers.get("content-type"),bytes:t.length,start:t.slice(0,120),end:t.slice(-380),target:el.outerHTML.slice(0,140),selectorMatches:el.matches(".legacy .audit-shell .mode-grid"),computed:getComputedStyle(el).display}})()`)));
  console.log("AUDIT GRID DIAGNOSTIC",width,JSON.stringify(await evalPage(`(()=>{const el=document.querySelector(".mode-grid");const arr=[];for(const s of document.styleSheets){let rules;try{rules=s.cssRules}catch{continue}const visit=(entries)=>{for(const rule of entries){if(rule.cssRules){visit(rule.cssRules);continue}if(!rule.selectorText)continue;try{if(rule.selectorText.split(",").some(sel=>el.matches(sel.trim()))&&(rule.style.display||rule.style.gridTemplateColumns))arr.push({from:(s.href||"inline").split("/").slice(-2).join("/"),sel:rule.selectorText.slice(0,200),display:rule.style.display,important:rule.style.getPropertyPriority("display"),columns:rule.style.gridTemplateColumns});}catch{}}};visit(rules)}return {matches:arr.slice(-25),legacy:!!el.closest(".legacy"),shell:!!el.closest(".audit-shell"),scoped:!!el.closest(".legacy .audit-shell"),auditCSSLoaded:[...document.styleSheets].some(s=>s.href?.includes("audit-index.css"))}})()`)));
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
