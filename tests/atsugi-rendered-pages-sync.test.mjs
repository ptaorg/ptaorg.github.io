import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createHash } from 'node:crypto';

test('Reviewed Atsugi school HTML files match their source JSON without altering unreviewed schools',()=>{
 const result=spawnSync(process.execPath,['scripts/generate-atsugi-reviewed-pages.cjs','--check'],{encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
 const summary=JSON.parse(result.stdout);
 assert.equal(summary.reviewed,15);
 assert.equal(summary.changed,0);
 assert.equal(summary.supplemental,13);
 assert.equal(summary.unreviewed,8);
});

test('Aikawa correction, Shimizu dual evaluation and Atsugi Daini additional form reach static HTML',()=>{
 const pairs=[
  ['aikawa-es','相川中学校'],
  ['shimizu-es','学校へのPTA会費集金委託同意'],
  ['atsugi-daini-es','2026年1月26日付']
 ];
 for(const [slug,needle] of pairs){
  const html=fs.readFileSync('archive/atsugi/'+slug+'/index.html','utf8');
  assert.ok(html.includes(needle),slug+': '+needle);
  for(let n=1;n<=10;n++)assert.ok(html.includes('id="sec-'+n+'"'),slug+': sec-'+n);
  assert.ok(html.includes('name="twitter:card"'),slug+': X card');
  assert.ok(html.includes('追加確認が必要'),slug+': review disclaimer');
 }
});


test('new source and crop links reach the corresponding school pages',()=>{
 const coverage=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-evidence-coverage-matrix-2026.json'));
 const ledger=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-school-pdf-evidence-20261116.json'));
 let images=0;
 for(const school of coverage.schools.filter(entry=>entry.currentSchoolPdfReview)){
  const data=JSON.parse(fs.readFileSync('data/schools/atsugi/'+school.id+'.json'));
  const html=fs.readFileSync('archive/atsugi/'+school.id+'/index.html','utf8');
  assert.deepEqual(data.officialPdfReview,ledger.newSchoolDocuments[school.id]);
  assert.ok(html.includes(data.confirmedFacts[0]));
  assert.ok(html.includes('name="twitter:card"')&&html.includes('property="og:image"')&&html.includes('data-map'));
  assert.ok(!html.includes('掲載資料は未確認です'));
  for(let n=1;n<=10;n++)assert.ok(html.includes('id="sec-'+n+'"'));
  for(const doc of data.officialPdfReview.documents){
   assert.match(doc.sha256,/^[a-f0-9]{64}$/);
   assert.ok(html.includes(doc.url));
   for(const crop of doc.crops){
    assert.ok(crop.page>0&&crop.page<=doc.pdfPages);
    assert.ok(html.includes(crop.image));
    assert.equal(createHash('sha256').update(fs.readFileSync(crop.image.slice(1))).digest('hex'),crop.sha256);
    images++;
   }
  }
 }
 assert.equal(images,19);
});
