import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const registry=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-city-pta-registrations-2024.json','utf8'));
const intake=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-36-school-intake-2026.json','utf8'));

test('twenty-five registry entries are grounded, unique, and linked to known Atsugi schools',()=>{
 assert.equal(registry.entries.length,25);
 const ids=new Set(intake.schoolRecords.map(s=>s.schoolId));
 assert.equal(new Set(registry.entries.map(x=>x.schoolId)).size,25);
 assert.equal(new Set(registry.entries.map(x=>x.registryId)).size,25);
 for(const entry of registry.entries){
  assert.ok(ids.has(entry.schoolId),entry.schoolId);
  assert.ok(entry.documentTextLocation.length > 5);
  assert.ok(['無し','学校教育法施行規則'].includes(entry.registryLegalBasis));
 }
});
test('registration is not confused with school PDF verification or a grant of authority',()=>{
 const previouslyUnknown=registry.entries.filter(x=>!intake.schoolRecords.find(s=>s.schoolId===x.schoolId).originalPdfVerification);
 assert.equal(previouslyUnknown.length,21);
 const detailed=registry.entries.find(x=>x.schoolId==='kamiechi-es');
 assert.equal(detailed.details.recordedPersonalInformationFile,'ＰＴＡ役員名簿');
 assert.deepEqual(detailed.details.recordedFields,['氏名','住所','電話番号']);
 assert.match(registry.caution,/証明ではない/);
 assert.match(registry.caution,/授権/);
 assert.equal(registry.sourceSnapshot,'R6.8.31現在');
 assert.equal(registry.stat.separateFrom15OriginalSchoolPdfs,true);
 assert.equal(registry.stat.detailedPersonalDataFilesConfirmed,9);
});
