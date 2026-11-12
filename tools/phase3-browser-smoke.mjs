import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {spawn,spawnSync} from "node:child_process";
const getChrome=()=>["google-chrome","chromium","chromium-browser"].find(x=>spawnSync("which",[x],{stdio:"ignore"}).status===0);
const chromeBin=getChrome();if(!chromeBin)throw Error("Chromium/Chrome executable not installed"); console.log("Chrome binary:",chromeBin);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"pta-phase3-chrome-"));
fs.mkdirSync("phase3-screenshots",{recursive:true});
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
  fs.writeFileSync("phase3-screenshots/"+name,Buffer.from(r.data,"base64"));
}
function requireResult(condition,message){assert.ok(condition,message);}
try{
 for(let i=0;i<100;i++){try{if((await fetch("http://127.0.0.1:8765/")).ok)break;}catch{}await sleep(200);}
 const target=await retry("http://127.0.0.1:9222/json/new?about:blank",{method:"PUT"});
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((res,rej)=>{ws.addEventListener("open",res,{once:true});ws.addEventListener("error",rej,{once:true});});
 ws.addEventListener("message",event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 await command("Page.enable");await command("Runtime.enable");
 for(const width of [1440,390]){
  const height=width===390?844:900;
  for(const page of ["/","/guide-parent.html","/privacy.html","/journal/matsuyama-pta-fee-unification-20261013.html","/archive/ota/school-001-es/"]){
   await pageAt(page,width,height);
   const v=await evalPage("(()=>{const q=s=>document.querySelector(s),nav=q('.global-nav'),side=q('.article-side'),ft=q('.site-footer'),header=q('.site-header');return {width:window.innerWidth,menu:window.innerWidth<600?getComputedStyle(q('.menu-button')).display:'desktop',navigation:!!nav,panels:nav?.querySelectorAll('[data-panel]').length,footer:!!ft,footerColumns:ft?.querySelectorAll('.footer-col').length,footerLinks:ft?.querySelectorAll('a').length,search:q('.search-panel-bar')?.getBoundingClientRect().height||0,hero:q('main h1')?.textContent.length||0,side:!!side,relatedCount:side?.querySelectorAll('.side-links li').length||0,chips:side?.textContent.includes('関連する論点')||false,readmore:!!q('section.readmore'),nextCount:q('.next-read')?.querySelectorAll('a').length||0,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}})()");
   console.log("PAGE",page,width,JSON.stringify(v));
   requireResult(v.navigation&&v.panels===5,"global nav incomplete "+JSON.stringify(v));
   requireResult(v.footer&&v.footerColumns===1&&v.footerLinks<=11,"footer not reduced "+JSON.stringify(v));
   requireResult(v.hero>3,"page hero missing "+JSON.stringify(v));
   requireResult(v.scroll<=v.client+10,"horizontal overflow "+page+" "+JSON.stringify(v));
   if(page!=="/"){
    requireResult(v.search===0,"article search bar still visible "+page);
    requireResult(!v.chips&&v.relatedCount<=3,"redundant sidebar links "+page);
    requireResult(!v.readmore&&v.nextCount<=1,"duplicate reading routes "+page);
   }else{
    requireResult(v.search===0,"unexpected site search bar on home");
   }
   if(width===390)requireResult(v.menu!=="none","mobile menu button hidden "+page);
   if(page==="/guide-parent.html"||page==="/")await snap((page==="/ "?"home":page==="/ "?"index":page.replaceAll("/","-"))+"-"+width+".png",page==="/"?".hero":".article-hero");
  }
 }
 console.log("Phase 3 visual QA passed at 1440px and 390px for home, guides, journal and school.");
}finally{try{ws?.close();}catch{}browser.kill("SIGKILL");server.kill("SIGKILL");try{fs.rmSync(tmp,{recursive:true,force:true,maxRetries:10,retryDelay:200});}catch(e){console.warn("Chrome profile cleanup deferred:",e.code);}}
