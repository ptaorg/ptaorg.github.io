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
test('prior summaries remain unconfirmed until PDF and image originals are independently inspected',()=>{
 assert.equal(review.publication.originalPDFRead,false);
 assert.equal(review.publication.originalImagesRead,false);
 assert.equal(review.publication.state,'draft');
 for(const c of review.cases){
  assert.equal(c.currentAxisStatus,'unknown');
  assert.ok(c.neededEvidence.length>=3,c.id);
  assert.ok(c.epistemicLimit.length>15,c.id);
 }
});
test('school-specific incidents are not inferred from city-wide report',()=>{
 assert.match(review.cityLevelLinkage.incident,/自動的に同一視しない/);
 assert.match(review.cityLevelLinkage.civilDelegation,/公法上の権限/);
});
