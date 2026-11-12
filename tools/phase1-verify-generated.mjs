import fs from "node:fs";
import cp from "node:child_process";
function sh(...args){return cp.execFileSync("git",args,{encoding:"utf8",maxBuffer:20*1024*1024});}
const changed=sh("diff","--name-only").trim().split("\n").filter(Boolean);
const core=new Set(["index.html","explore.html","municipality.html","school.html"]);
const about=/  <section class="archive-section">\n    <h2>このページについて<\/h2>[\s\S]*?\n  <\/section>\n\n/;
let schoolCount=0;
for(const f of changed){
  if(core.has(f))continue;
  if(!/^archive\/[^/]+\/[^/]+\/index\.html$/.test(f))throw Error("unexpected generated change: "+f);
  const old=sh("show","HEAD:"+f);
  if(!about.test(old))throw Error("School page changed without expected duplicate block: "+f);
  const expected=old.replace(about,"");
  const actual=fs.readFileSync(f,"utf8");
  if(expected!==actual)throw Error("School generation changed text beyond duplicate metadata block: "+f);
  schoolCount++;
}
if(schoolCount<1)throw Error("No school page update detected");
console.log("Generated change safety verified: "+schoolCount+" school pages, "+changed.filter(x=>core.has(x)).length+" shared-chrome pages; no unexpected file changes.");
