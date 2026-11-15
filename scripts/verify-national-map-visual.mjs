import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const base = process.env.PTA_VISUAL_BASE_URL || "http://127.0.0.1:4173";
const out = "visual-map-output";
fs.mkdirSync(out,{recursive:true});
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{name:"desktop",width:1440,height:900},{name:"mobile",width:390,height:844}]) {
    const page = await browser.newPage({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1});
    try {
      await page.goto(base+"/research-map.html",{waitUntil:"domcontentloaded",timeout:30000});
      await page.waitForSelector(".pta-map-marker",{timeout:25000});
      const result = await page.evaluate(() => {
        const map=document.querySelector(".research-map-pane .research-map");
        const card=document.querySelector(".research-map-feature");
        const desc=document.querySelector(".research-feature-desc");
        const title=document.querySelector("#research-feature-title");
        const pins=[...document.querySelectorAll(".pta-map-marker")];
        const tile=document.querySelector(".leaflet-tile-pane img.leaflet-tile");
        const button=document.querySelector(".pta-map-reset button");
        return {map:map.getBoundingClientRect().toJSON(),
          card:card.getBoundingClientRect().toJSON(),
          descColor:getComputedStyle(desc).color,
          titleColor:getComputedStyle(title).color,
          cardBg:getComputedStyle(card).backgroundImage,
          pinCount:pins.length,
          namedPins:pins.filter(p=>p.getAttribute("title")).length,
          tileUrl:tile?.src||"",
          allJapanButton:button?.textContent||"",
          overflow:document.documentElement.scrollWidth-window.innerWidth};
      });
      assert.ok(result.map.height >= (viewport.name==="desktop"?680:460),JSON.stringify(result));
      assert.ok(result.map.width >= (viewport.name==="desktop"?650:300),JSON.stringify(result));
      assert.ok(result.pinCount >= 3,"Visible pins missing: "+JSON.stringify(result));
      assert.equal(result.allJapanButton,"日本全体");
      assert.equal(result.titleColor,"rgb(255, 255, 255)");
      assert.equal(result.descColor,"rgb(242, 248, 250)");
      assert.ok(result.overflow <= 2,"Horizontal overflow: "+result.overflow);
      await page.screenshot({path:out+"/"+viewport.name+"-research-map.png",fullPage:false});
      await page.locator(".pta-map-reset button").click();
      await page.waitForTimeout(250);
      assert.ok(await page.locator(".pta-map-marker").count()>=3,"Pins disappeared after all-Japan zoom");
      console.log(viewport.name,JSON.stringify(result));
    }finally{await page.close();}
  }
}finally{await browser.close();}
