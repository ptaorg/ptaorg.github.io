import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {createRequire} from "node:module";
import {spawnSync} from "node:child_process";
const require=createRequire(import.meta.url);
const {renderPrimaryMap}=require("../scripts/research-map-layout.cjs");
const text=p=>fs.readFileSync(p,"utf8");
const index=JSON.parse(text("data/research-map-index.json"));
test("national map front has a single, simple search and working advanced filters",()=>{
 const html=text("research-map.html");
 assert.match(html,/<body class="research-map-page"/);
 assert.match(html,/気になる地域を、地図から選ぶ。/);
 assert.match(html,/id="research-filters"/);
 assert.match(html,/class="research-search-simple"/);
 for(const id of ["research-query","research-prefecture","research-city","research-mode","research-theme","research-school","research-publication","research-response","research-audit","research-improvement"]){
   assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 assert.ok(html.indexOf('id="research-advanced"')<html.indexOf('id="research-map-message"'));
 assert.match(html,/id="research-more-regions"/);
 assert.match(html,/class="research-survey-disclosure"/);
 assert.match(html,/id="national-primary-survey"/);
});
test("every indexed region remains accessible with six prominent municipalities",()=>{
 const html=text("research-map.html");
 const all=[...html.matchAll(/class="research-region" data-region="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(all.length,index.municipalities.length);
 assert.equal(new Set(all).size,all.length);
 for(const m of index.municipalities){
   assert.ok(all.includes(m.id),m.id);
   if(m.url)assert.ok(html.includes('href="'+m.url+'"')||html.includes('href="'+m.url.slice(1)+'"'),m.id);
 }
 assert.equal((html.match(/class="research-region" data-region="/g)||[]).length,30);
 assert.match(html,/id="research-feature-title">宮城県 大崎市/);
 assert.match(html,/href="\/research\/osaki\.html"/);
 assert.match(html,/class="research-region-grid research-region-featured"/);
 assert.match(html,/class="research-region-grid research-region-remaining"/);
});
test("reusable renderer is deterministic and protects survey content",()=>{
 const first=renderPrimaryMap(index,'<section id="national-primary-survey">RETAIN SURVEY</section>');
 const second=renderPrimaryMap(index,'<section id="national-primary-survey">RETAIN SURVEY</section>');
 assert.equal(first,second);
 assert.match(first,/RETAIN SURVEY/);
 assert.match(first,/市の総合評価 → 学校ごとの調査 → 根拠資料/);
 const proc=spawnSync(process.execPath,["scripts/refresh-national-map.mjs","--check"],{encoding:"utf8"});
 assert.equal(proc.status,0,proc.stderr+proc.stdout);
});
test("national map interactions support nested results and clear count",()=>{
 const js=text("js/research-map.js");
 const css=text("css/research-map-redesign.css");
 assert.match(js,/moreRegions\.open=true/);
 assert.match(js,/wrapper\.open = true/);
 assert.match(js,/schoolReportCount/);
 assert.match(js,/advancedControls\.open=true/);
 assert.match(css,/research-map-layout/);
 assert.match(css,/research-region-grid/);
 assert.match(css,/research-search-simple/);
 assert.match(text("scripts/generate-research-map.js"),/renderPrimaryMap\(index,renderNationalSurvey\(index\)\)/);
});
