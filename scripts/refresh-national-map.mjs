#!/usr/bin/env node
/**
 * Rebuild the nationwide map's editorial content from the current index while
 * preserving the site's existing shared header/footer and the 48-subject survey.
 * Usage: node scripts/refresh-national-map.mjs [--check]
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const {renderPrimaryMap}=require("./research-map-layout.cjs");
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const input=path.join(root,"data/research-map-index.json");
const target=path.join(root,"research-map.html");
const index=JSON.parse(fs.readFileSync(input,"utf8"));
const html=fs.readFileSync(target,"utf8");
const marker='<div class="legacy-main research-main wrap" id="main-content">';
const at=html.indexOf(marker);
if(at<0)throw new Error("Editorial map host missing: "+marker);
const start=at+marker.length;
const sectionId=html.indexOf('id="national-primary-survey"',start);
if(sectionId<0)throw new Error("National primary survey must be preserved");
const sectionStart=html.lastIndexOf("<section",sectionId);
const sectionEnd=html.indexOf("</section>",sectionId)+"</section>".length;
if(sectionStart<start||sectionEnd<sectionId)throw new Error("Survey section incomplete");
const survey=html.slice(sectionStart,sectionEnd);
if(!survey.includes("research-survey-disclosure")||!survey.includes("research-survey-list"))
  throw new Error("The research survey must remain preserved and expandable");
const updated=html.slice(0,start)+"\n"+renderPrimaryMap(index,survey)+"\n"+html.slice(sectionEnd);
if(process.argv.includes("--check")){
  if(updated!==html){console.error("Research map body is stale: node scripts/refresh-national-map.mjs");process.exitCode=1;}
  else console.log("Research map matches source index: "+index.municipalities.length+" regions");
}else{
  if(updated!==html)fs.writeFileSync(target,updated,"utf8");
  console.log("Updated research map: "+index.municipalities.length+" regions, shared navigation retained");
}
