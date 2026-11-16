import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const coverage=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-evidence-coverage-matrix-2026.json','utf8'));
const intake=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-36-school-intake-2026.json','utf8'));
const official=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-city-pta-registrations-2024.json','utf8'));
test('source streams are independently counted and overlap only at four schools',()=>{
 assert.equal(coverage.schools.length,36);
 assert.deepEqual(coverage.statistics,{totalSchools:36,both:4,school_original_only:11,official_registration_only:21,no_individual_source_yet:0,schoolsWithAtLeastOneIndividualSource:36});
 for(const entry of coverage.schools){
  assert.equal(entry.schoolOriginalPdf,!!intake.schoolRecords.find(x=>x.schoolId===entry.id)?.originalPdfVerification);
  assert.equal(entry.officialRegistry,official.entries.some(x=>x.schoolId===entry.id));
  assert.notEqual(entry.status==='no_individual_source_yet',entry.schoolOriginalPdf||entry.officialRegistry);
 }
});
test('registration alone cannot promote a school to original-PDF verified',()=>{
 assert.ok(coverage.schools.filter(s=>s.status==='official_registration_only').every(s=>!s.schoolOriginalPdf&&s.officialRegistry));
 assert.match(coverage.warning,/適法性や実際の実施及び現在の運用を証明しない/);
});
