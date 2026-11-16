import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const inventory=read('ai-system/report-standards/pilots/atsugi-36-school-intake-2026.json');
const review=read('ai-system/report-standards/pilots/atsugi-first-five-evidence-review-2026.json');

test('five detailed reviews are unique members of the 36-school inventory',()=>{
 assert.equal(review.cases.length,5);
 assert.equal(new Set(review.cases.map(c=>c.id)).size,5);
 const ids=new Set(inventory.schoolRecords.map(r=>r.schoolId));
 for(const c of review.cases)assert.ok(ids.has(c.id),c.id);
});
test('PDF URLs are local archive links, all existing HTML records link to evidence',()=>{
 for(const c of review.cases){
  assert.match(c.sourceUrl,/^\/source-pdfs\/atsugi\//);
  const page=fs.readFileSync('archive/atsugi/'+c.id+'/index.html','utf8');
  const basename=decodeURIComponent(c.sourceUrl.split('/').at(-1));
  assert.ok(page.includes(encodeURIComponent(basename))||page.includes(basename),c.id);
  assert.ok(c.imagePaths.every(x=>x.startsWith('/assets/archive/atsugi/'+c.id+'/')),c.id);
 }
});
test('PDFs inspected but field implementation and lawful authority remain unverified',()=>{
 assert.equal(review.publication.originalPDFRead,true);
 assert.equal(review.publication.originalImagesRead,true);
 assert.equal(review.publication.state,'draft');
 for(const c of review.cases){
  assert.equal(c.currentAxisStatus,'mixed_verified_document_indications_without_legality_finding');
  assert.match(c.sha256,/^[a-f0-9]{64}$/);
  assert.equal(c.originalPdfVerified,true);
  assert.ok(c.neededEvidence.length>=3,c.id);
  assert.ok(c.epistemicLimit.length>15,c.id);
 }
});
test('mislabeled Aikawa elementary complaint is not attributed as school action',()=>{
 const correction=inventory.corrections.find(x=>x.id==='CORR-ATSUGI-001');
 assert.ok(correction);
 const es=inventory.schoolRecords.find(x=>x.schoolId==='aikawa-es');
 assert.equal(es.axes.school_personal_data_for_pta.status,'unknown');
 const jhs=inventory.schoolRecords.find(x=>x.schoolId==='aikawa-jhs');
 assert.equal(jhs.axes.school_personal_data_for_pta.status,'indication');
});
test('Atsugi elementary original form contains an admission-and-withdrawal clause',()=>{
 const school=inventory.schoolRecords.find(x=>x.schoolId==='atsugi-es');
 assert.equal(school.axes.explicit_opt_in.status,'indication');
 assert.match(school.axes.explicit_opt_in.observation,/入会届・退会届/);
});
test('school-specific incidents are not inferred from city-wide report',()=>{
 assert.match(review.cityLevelLinkage.incident,/自動的に同一視しない/);
 assert.match(review.cityLevelLinkage.civilDelegation,/公法上の権限/);
});
