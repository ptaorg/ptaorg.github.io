import fs from "node:fs";
import cp from "node:child_process";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const {transform}=require("../scripts/phase1-regenerate-school-cards.cjs");
function sh(...args){return cp.execFileSync("git",args,{encoding:"utf8",maxBuffer:20*1024*1024});}
const changed=sh("diff","--name-only").trim().split("\n").filter(Boolean);
const core=new Set(["index.html","explore.html","municipality.html","school.html"]);
let schoolCount=0;
for(const rel of changed){
 if(core.has(rel))continue;
 if(!/^archive\/[^/]+\/[^/]+\/index\.html$/.test(rel))throw Error("Unexpected generated change: "+rel);
 const old=sh("show","HEAD:"+rel);
 const expected=transform(old,rel);
 const actual=fs.readFileSync(rel,"utf8");
 if(expected!==actual)throw Error("School generation changed content beyond approved duplicate section/TOC: "+rel);
 schoolCount++;
}
if(schoolCount<1)throw Error("No school page update detected");
console.log("Validated "+schoolCount+" school pages and "+changed.filter(x=>core.has(x)).length+" shared chrome pages; no unintended file changes.");
