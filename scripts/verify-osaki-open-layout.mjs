import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
fs.mkdirSync('osaki-layout-review',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  for(const viewport of [{name:'desktop',width:1600,height:900},{name:'mobile',width:390,height:844}]){
    const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
    await page.goto('http://127.0.0.1:4173/research/osaki.html',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('body.osaki-readable .osr-municipal',{timeout:20000});
    const o=await page.evaluate(()=>{
      const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();
      const style=s=>getComputedStyle(document.querySelector(s));
      return {w:innerWidth,hero:rect('.osr-hero'),municipal:rect('.osr-municipal'),wrap:rect('article.method-wrap'),header:rect('.method-hero .method-wrap'),border:style('.osr-municipal').borderTopWidth,shadow:style('.osr-municipal').boxShadow,heroShadow:style('.osr-hero').boxShadow,overflow:document.documentElement.scrollWidth-innerWidth};
    });
    assert.ok(o.overflow <= 2,'Horizontal overflow '+JSON.stringify(o));
    assert.equal(o.border,'0px','Municipal outer card border must be removed');
    assert.equal(o.shadow,'none','Municipal outer card shadow must be removed');
    assert.equal(o.heroShadow,'none','Top card shadow must be removed');
    assert.ok(o.wrap.width >= (viewport.name==='desktop'?1200:350),'Content is still narrow: '+JSON.stringify(o));
    assert.ok(o.hero.width >= (viewport.name==='desktop'?1000:320),'Hero is still narrow: '+JSON.stringify(o));
    await page.screenshot({path:'osaki-layout-review/'+viewport.name+'.png',fullPage:false});
    console.log(viewport.name,JSON.stringify(o));
    await page.close();
  }
}finally{await browser.close();}
