import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const coverage=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-evidence-coverage-matrix-2026.json','utf8'));
const intake=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-36-school-intake-2026.json','utf8'));
const official=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-city-pta-registrations-2024.json','utf8'));
test('source streams are independently counted and preserve the legacy 15-school baseline',()=>{
 assert.equal(coverage.schools.length,36);
 for(const status of ['both','school_original_only','official_registration_only','no_individual_source_yet']){
  assert.equal(coverage.statistics[status],coverage.schools.filter(s=>s.status===status).length);
 }
 assert.equal(coverage.statistics.totalSchools,36);
 assert.equal(coverage.statistics.ptaPdfReviewedAnyTypeSchools,28);
 assert.equal(coverage.statistics.schoolPtaPdfNotYetLocatedSchools,8);
 assert.equal(coverage.schools.filter(s=>s.schoolPdfReviewedAnyType).length,28);
 assert.equal(coverage.schools.filter(s=>s.newOfficialSchoolPdfReview).length,9);
 for(const entry of coverage.schools){
  assert.equal(entry.schoolOriginalPdf,!!intake.schoolRecords.find(x=>x.schoolId===entry.id)?.originalPdfVerification);
  assert.equal(entry.officialRegistry,official.entries.some(x=>x.schoolId===entry.id));
  assert.notEqual(entry.status==='no_individual_source_yet',entry.schoolOriginalPdf||entry.officialRegistry);
 }
});
test('registration alone cannot promote a school to original-PDF verified',()=>{
 assert.ok(coverage.schools.filter(s=>!s.schoolPdfReviewedAnyType).every(s=>!s.schoolOriginalPdf&&s.officialRegistry&&!s.currentSchoolPdfReview));
 assert.match(coverage.warning,/適法性や実際の実施及び現在の運用を証明しない/);
});
