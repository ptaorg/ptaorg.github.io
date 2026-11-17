import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const base = process.env.PTA_VISUAL_BASE_URL || "http://127.0.0.1:4173";
const out = "visual-pta-fee-output";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
let failures = [];
try {
  for (const vp of [
    {name:"desktop",width:1440,height:900},
    {name:"mobile",width:390,height:844}
  ]) {
    const page = await browser.newPage({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    try {
      const response=await page.goto(base+"/pta-fee-collection.html",{waitUntil:"domcontentloaded",timeout:30000});
      assert.equal(response?.status(),200, "Page failed to load");
      await page.waitForFunction(()=>{
        const o=document.querySelector("#pfc-map-object");
        return !!(o && o.contentDocument?.querySelectorAll(".prefecture[data-code]").length===47);
      },null,{timeout:20000});
      const before=await page.evaluate(()=>{
        const hero=document.querySelector(".pfc-hero h1"),header=document.querySelector(".site-header"),footer=document.querySelector(".site-footer");
        const style=[...document.styleSheets].some(s=>s.href?.includes("/assets/style.css"));
        const map=document.querySelector("#pfc-map-object").getBoundingClientRect();
        return {
          cssLoaded:style,
          headerHeight:header.getBoundingClientRect().height,
          headerDisplay:getComputedStyle(header).display,
          footerDisplay:getComputedStyle(footer).display,
          headingColor:getComputedStyle(hero).color,
          font:getComputedStyle(document.body).fontFamily,
          mapWidth:map.width,
          mapHeight:map.height,
          count:document.querySelectorAll(".pfc-entry").length,
          mapRegions:document.querySelector("#pfc-map-object").contentDocument.querySelectorAll(".prefecture[data-code]").length,
          horizontalOverflow:document.documentElement.scrollWidth-window.innerWidth,
          strayNewline:document.body.textContent.includes(String.raw`\n`)
        };
      });
      assert.ok(before.cssLoaded,"Shared CSS is not loaded");
      assert.ok(before.headerHeight>=50,"Shared header too small, CSS may be overridden");
      assert.equal(before.headerDisplay,"block");
      assert.equal(before.footerDisplay,"block");
      assert.equal(before.headingColor,"rgb(255, 255, 255)");
      assert.ok(before.mapWidth >= (vp.name==="desktop"?550:290),"Map width collapsed");
      assert.ok(before.mapHeight >= 350,"Map height collapsed");
      assert.equal(before.mapRegions,47);
      assert.equal(before.count,79);
      assert.ok(before.horizontalOverflow<=3,"Horizontal overflow: "+JSON.stringify(before));
      assert.equal(before.strayNewline,false,"Literal backslash-n displayed in body");
      assert.deepEqual(errors,[],"JavaScript exceptions: "+JSON.stringify(errors));

      // Interaction: dropdown must filter map + list
      await page.locator("#pfc-pref").selectOption("神奈川県");
      await page.waitForFunction(()=>document.querySelector("#pfc-region-title").textContent.includes("11団体"));
      assert.equal(await page.locator(".pfc-entry:visible").count(),11);
      const mapSelection=await page.evaluate(()=>{
        const doc=document.querySelector("#pfc-map-object").contentDocument;
        const selected=doc.querySelector(".prefecture[data-code='14']");
        return {color:selected.style.fill,role:selected.getAttribute("role"),choice:document.querySelector("#pfc-pref").value};
      });
      assert.equal(mapSelection.color,"rgb(212, 156, 50)");
      assert.equal(mapSelection.role,"button");
      assert.equal(mapSelection.choice,"神奈川県");

      await page.locator("#pfc-map-clear").click();
      assert.equal(await page.locator(".pfc-entry:visible").count(),79);
      // Interaction: region SVG click
      await page.evaluate(()=>{
        const node=document.querySelector("#pfc-map-object").contentDocument.querySelector(".prefecture[data-code='27']");
        node.dispatchEvent(new MouseEvent("click",{bubbles:true}));
      });
      await page.waitForFunction(()=>document.querySelector("#pfc-pref").value==="大阪府");
      assert.equal(await page.locator(".pfc-entry:visible").count(),6);
      await page.locator("#search").fill("門真");
      assert.equal(await page.locator(".pfc-entry:visible").count(),1);
      await page.locator("#search").fill("");
      await page.locator("#pfc-map-clear").click();
      await page.locator("#japan-map").screenshot({path:out+"/"+vp.name+"-fee-map.png"});
      await page.screenshot({path:out+"/"+vp.name+"-fee-page.png",fullPage:true});
      console.log(vp.name,JSON.stringify(before),"interactions PASS");
    } catch(e) {
      failures.push(vp.name+": "+e.stack);
      await page.screenshot({path:out+"/"+vp.name+"-failed.png",fullPage:true}).catch(()=>{});
    } finally {await page.close();}
  }
} finally {await browser.close();}
if(failures.length){for(const error of failures)console.error(error);process.exit(1);}
console.log("National PTA fee map responsive and shared CSS checks passed.");
