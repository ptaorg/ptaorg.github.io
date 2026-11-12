#!/usr/bin/env node
// Phase 4C: normalize maintained editorial CSS only, not port-generated legacy CSS.
// Running this stage after the original port and Phase 4A/4B is deterministic.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {normalizeFile}=require('./phase4b-page-styles.cjs');
const {stats}=require('./phase4-normalize-design.cjs');
const FILES=[
 'css/interactions.css','css/global-footer.css','css/support.css',
 'css/archive.css','css/document.css','css/archive-school.css',
 'css/home-enhance.css','css/submission-kit.css','css/form.css',
 'css/research-pathways.css','css/global-nav.css','css/scroll-top.css',
 'css/pages/edu-board-separation.css',
 'css/pages/education-board-responsibility--1.css',
 'css/pages/proper-management.css','css/pages/reality.css',
 'css/pages/law-map.css','css/pages/report.css',
 'css/pages/case-reading.css','css/pages/timeline-issues.css',
 'css/pages/evidence-checklist.css','css/pages/administrative-materials.css',
 'css/pages/about.css','css/pages/guide-research.css',
 'css/pages/documents.css','css/pages/cases.css',
 'css/pages/key-materials.css','css/pages/timeline.css',
 'css/pages/framework.css','css/pages/research-map.css',
 'css/pages/contact.css'
];
const EXCLUDED=[
 'assets/legacy-theme.css','css/inline-utilities.css',
 'css/pages/audit-index.css','css/pages/compliance.css',
 'css/ppc-school-pta.css','css/editorial-system.css'
];
function transform(src,file){
 if(EXCLUDED.includes(file)||file.startsWith('css/legacy-inline/')||/^css\/shared\/shared-[a-f0-9]+\.css$/.test(file))
  throw Error('Generated or status-sensitive CSS must not be normalized automatically: '+file);
 return normalizeFile(src,file);
}
function run(){
 const check=process.argv.includes('--check');
 let touched=[],summary=[];
 for(const file of FILES){
  const target=path.join(root,file),src=fs.readFileSync(target,'utf8'),out=transform(src,file);
  if(src!==out){
   touched.push(file);
   summary.push({file,before:stats(src),after:stats(out)});
   if(!check)fs.writeFileSync(target,out,'utf8');
  }
 }
 console.log('Phase 4C maintained CSS:',JSON.stringify({examined:FILES.length,changed:touched.length,report:summary}));
 if(check&&touched.length)throw Error('Maintained CSS files are stale: '+touched.join(', '));
}
if(require.main===module)run();
module.exports={FILES,EXCLUDED,transform};
