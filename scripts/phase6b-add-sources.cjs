#!/usr/bin/env node
// Phase 6B: add official e-Gov sources only when the law's NAME and article occur in the same prose paragraph.
// Preserves all original quotes and any existing source links exactly.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const {citations}=require('./phase6-link-sources.cjs');
const TARGETS=[
  "reality.html",
  "guide-parent.html",
  "ppc-points.html",
  "ppc-school-pta-personal-data.html",
  "education-board-responsibility.html",
  "journal/school-pta-fee-public-duty-mic-mext-ppc-20261016.html"
];
function generate(before,rel){if(!TARGETS.includes(rel))throw Error('Unreviewed source page '+rel);return citations(before,rel,{allowNoDai:true});}
function main(){
 const check=process.argv.includes('--check');let total=0;
 const report=[];
 for(const file of TARGETS){
  const pathname=path.join(root,file),before=fs.readFileSync(pathname,'utf8'),result=generate(before,file);
  total+=result.count;
  report.push({file,count:result.count,paragraphs:result.paragraphs||0,sources:result.used,changed:before!==result.html});
  if(!check&&before!==result.html)fs.writeFileSync(pathname,result.html,'utf8');
 }
 console.log('Phase 6B source audit:',JSON.stringify({total,report}));
 if(check&&report.some(x=>x.changed))throw Error('Phase 6B generated source notes are stale');
}
if(require.main===module)main();
module.exports={TARGETS,generate};
