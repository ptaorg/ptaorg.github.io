#!/usr/bin/env node
// Scope-limited generator for the Atsugi original-document review. No deployment.
const fs = require('node:fs');
const path = require('node:path');
const { renderSchoolPage } = require('./generate-school-pages');
const { ROOT, writeFileIfChanged } = require('./archive-utils');
const intake = JSON.parse(fs.readFileSync(path.join(ROOT,'ai-system/report-standards/pilots/atsugi-36-school-intake-2026.json'),'utf8'));
const verified = intake.schoolRecords.filter(r=>r.originalPdfVerification?.status==='direct_checked');
if (verified.length!==15 || new Set(verified.map(x=>x.schoolId)).size!==15) throw new Error('Expected exactly 15 verified Atsugi schools');
if (!verified.every(r=>r.publiclyVerified===false)) throw new Error('Review flag must remain unverified until live visual review');
const check = process.argv.includes('--check');
let changed=0;
for (const item of verified) {
  const filepath=path.join(ROOT,'data','schools','atsugi',item.schoolId+'.json');
  const data=JSON.parse(fs.readFileSync(filepath,'utf8'));
  if (data.slug!==item.schoolId || data.municipality!=='厚木市') throw new Error('School identity mismatch: '+item.schoolId);
  const html=renderSchoolPage({...data,citySlug:'atsugi',sourceFile:filepath});
  const dst=path.join(ROOT,'archive','atsugi',item.schoolId,'index.html');
  if(!fs.existsSync(dst))throw new Error('No existing HTML to preserve: '+dst);
  const old=fs.readFileSync(dst,'utf8');
  const before=new Set([...old.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  const after=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  const disappeared=[...before].filter(x=>!after.has(x));
  if(disappeared.length)throw new Error('Anchor loss '+item.schoolId+': '+disappeared.join(','));
  if(!html.includes('twitter:card')||!html.includes('og:image'))throw new Error('OG metadata missing: '+item.schoolId);
  if(!html.includes('追加確認が必要'))throw new Error('Human review flag disappeared: '+item.schoolId);
  if(old.trimEnd()!==html.trimEnd()){
    changed++;
    if(!check)writeFileIfChanged(dst,html);
  }
}
console.log(JSON.stringify({municipality:'厚木市',scopedSchools:verified.length,changed,mode:check?'check':'write',uninspectedSchools:21}));
if(check&&changed)process.exitCode=2;
