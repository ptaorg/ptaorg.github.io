import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ledger=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-36-school-intake-2026.json','utf8'));
const originals=ledger.originalSources;
const schools=ledger.schoolRecords;

test('fifteen distinct school identities, including differently named original',()=>{
 const verified=schools.filter(x=>x.originalPdfVerification?.status==='direct_checked');
 assert.equal(verified.length,15);
 assert.equal(new Set(verified.map(x=>x.schoolId)).size,15);
 assert.equal(new Set(originals.map(x=>x.id)).size,16); 
 assert.equal(originals.filter(x=>x.schoolId==='atsugi-daini-es').length,2);
 const tsumada=verified.find(x=>x.schoolId==='tsumada-es');
 assert.equal(tsumada.originalPdfVerification.fileName,'麦田小学校_12.pdf');
 assert.equal(tsumada.originalPdfVerification.verifiedSchoolFromContent,'妻田小学校');
 assert.equal(tsumada.originalPdfVerification.filenameSchoolMismatch,true);
 assert.ok(ledger.corrections.some(x=>x.id==='CORR-ATSUGI-002'));
});
test('PDF identity and archival completeness are not inferred from filename',()=>{
 const a=schools.find(x=>x.schoolId==='aikawa-es');
 const b=schools.find(x=>x.schoolId==='aikawa-jhs');
 assert.equal(a.axes.school_personal_data_for_pta.status,'unknown');
 assert.ok(b.axes.school_personal_data_for_pta.sourceRefs.some(x=>x.sourceId==='original-aikawa-es'));
 assert.ok(originals.every(x=>schools.some(s=>s.schoolId===x.schoolId)));
});
test('known PDFs have 64-digit digests and uninspected schools stay unknown',()=>{
 const verified=schools.filter(x=>x.originalPdfVerification);
 for(const s of verified)assert.match(s.originalPdfVerification.sha256,/^[a-f0-9]{64}$/);
 assert.equal(schools.filter(x=>!x.originalPdfVerification).length,21);
 assert.equal(ledger.searchCoverage.unverifiedCount,21);
 for(const s of schools.filter(x=>!x.originalPdfVerification)) {
   assert.ok(Object.values(s.axes).every(a=>a.status==='unknown'),s.schoolId);
 }
});
