import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => JSON.parse(fs.readFileSync(path,'utf8'));
const ledger=read('ai-system/report-standards/pilots/atsugi-36-school-intake-2026.json');
const ids=['atsugi-daini-es','kamiechi-es','koayu-es','mutsuai-jhs','nanmori-es','shimizu-es','tobio-es','toda-es','tomuro-es'];
const school=id=>read('data/schools/atsugi/'+id+'.json');
test('fifteen source PDFs checked, one hash pending; twenty one remain unverified',()=>{
 const verified=ledger.schoolRecords.filter(s=>s.originalPdfVerification);
 assert.equal(verified.length,15);assert.equal(ledger.schoolRecords.length-verified.length,21);
 assert.equal(new Set(verified.map(s=>s.schoolId)).size,15);
 for(const s of verified){assert.equal(s.originalPdfVerification.status,'direct_checked');if(s.schoolId==='aikawa-jhs') {
  assert.equal(s.originalPdfVerification.sha256,null);
  assert.equal(s.originalPdfVerification.hashVerification,'pending_independent_recalculation');
 } else assert.match(s.originalPdfVerification.sha256,/^[a-f0-9]{64}$/);assert.equal(s.publiclyVerified,false);}
 assert.equal(ledger.legacySummary.individualSchoolsReadyForPublication,0);
});
test('nine newly located school originals are listed with document-based limited axes',()=>{
 for(const id of ids){const r=ledger.schoolRecords.find(s=>s.schoolId===id);assert.ok(r.originalPdfVerification,id);assert.ok(Object.values(r.axes).some(a=>a.sourceRefs.length),id);assert.equal(school(id).lastReviewed,'2026-11-16');}
});
test('Shimizu voluntary membership progress and separate school-collection delegation inquiry',()=>{
 const s=school('shimizu-es');
 assert.match(s.confirmedFacts.join(' '),/入会/);
 assert.match(s.confirmedFacts.join(' '),/学校に委託/);
 assert.match(s.evaluation.join(' '),/改善として評価/);
 assert.match(s.evaluation.join(' '),/公法上の所掌事務/);
});
test('Toda PTA fee transfer delegation cannot imply public authority',()=>{
 const s=school('toda-es');
 assert.match(s.confirmedFacts.join(' '),/学校に依頼/);
 assert.match(s.unconfirmedPoints.join(' '),/学校側の会費振替権限/);
 assert.match(s.evaluation.join(' '),/公法/);
});
test('Mutsuai principal consent form is not sufficient authority for PTA use',()=>{
 const s=school('mutsuai-jhs');
 assert.match(s.confirmedFacts.join(' '),/校長名義/);
 assert.match(s.evaluation.join(' '),/61条・69条/);
});
test('unused school records are not marked lawful or completed',()=>{
 for(const s of ledger.schoolRecords.filter(x=>!x.originalPdfVerification)){assert.ok(Object.values(s.axes).every(a=>a.status==='unknown'));assert.equal(s.publiclyVerified,false);}
});
