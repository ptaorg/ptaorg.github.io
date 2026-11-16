import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const intake=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-36-school-intake-2026.json','utf8'));
const screening=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-15-school-legal-screening-2026.json','utf8'));
const standard=JSON.parse(fs.readFileSync('ai-system/report-standards/legal-screening.json','utf8'));
test('all 15 evidenced schools have 15 separately pending legal tests',()=>{
 assert.equal(screening.schools.length,15);
 assert.equal(screening.unreviewedSchoolCount,21);
 assert.deepEqual(screening.reviewOrder,standard.reviewOrder);
 const reviewed=new Set(intake.schoolRecords.filter(x=>x.originalPdfVerification?.status==='direct_checked').map(x=>x.schoolId));
 assert.deepEqual(new Set(screening.schools.map(x=>x.id)),reviewed);
 for(const school of screening.schools){
  assert.equal(school.lawReview.length,15);
  assert.ok(school.lawReview.every(x=>x.status==='legal_applicability_pending'));
  assert.equal(school.reviews.length,7);
  assert.ok(school.reviews.every(x=>x.authorityFound==='not_demonstrated_in_reviewed_materials'));
 }
});
test('all cited school evidence locators come from the original intake, no invented pages',()=>{
 for(const school of screening.schools){
  const original=intake.schoolRecords.find(x=>x.schoolId===school.id);
  for(const review of school.reviews)for(const ref of review.evidence){
   const originalAxis=original.axes[ref.axis];
   assert.ok(originalAxis,school.id+':'+ref.axis);
   assert.deepEqual(ref.locators,originalAxis.sourceRefs);
   assert.equal(ref.observation,originalAxis.observation);
  }
 }
});
test('city guidance, administrative progress, lawful authority and privacy are separated',()=>{
 assert.deepEqual(screening.administrativeChronology.map(x=>x.date),['2026-03-30','2026-04-09','2026-10-26','2026-11-30']);
 assert.equal(screening.schools.filter(x=>x.disclosureStatus==='draft_do_not_publish_as_legal_violation').length,15);
 assert.ok(screening.actionMatrix.some(x=>/会費|徴収|集金/.test(x.request)));
 assert.ok(screening.actionMatrix.some(x=>x.request.includes('61条')));
});
