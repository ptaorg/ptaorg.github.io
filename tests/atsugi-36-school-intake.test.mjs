import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const ledger=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-36-school-intake-2026.json','utf8'));
const axes=JSON.parse(fs.readFileSync('ai-system/report-standards/evaluation-axes.json','utf8')).axes.map(a=>a.id);
const records=ledger.schoolRecords;
test('Atsugi intake covers 36 distinct schools and correct school types',()=>{
 assert.equal(records.length,36);
 assert.equal(new Set(records.map(r=>r.schoolId)).size,36);
 assert.equal(records.filter(r=>r.schoolType==='小学校').length,23);
 assert.equal(records.filter(r=>r.schoolType==='中学校').length,13);
});
test('all school archives and JSON records exist and match names',()=>{
 for(const r of records){
  assert.ok(fs.existsSync(r.existingSiteRecord),r.schoolId);
  assert.ok(fs.existsSync('archive/atsugi/'+r.schoolId+'/index.html'),r.schoolId);
  const d=JSON.parse(fs.readFileSync(r.existingSiteRecord,'utf8'));
  assert.equal(d.schoolName,r.schoolName);
  assert.equal(d.schoolType,r.schoolType);
  assert.equal(d.slug,r.schoolId);
 }
});
test('only original-verified five schools gain grounded limited axes, remaining schools stay unknown',()=>{
 for(const r of records){
  assert.deepEqual(Object.keys(r.axes),axes);
  for(const ax of axes){
   if(!r.originalPdfVerification) {
    assert.equal(r.axes[ax].status,'unknown');
    assert.deepEqual(r.axes[ax].sourceRefs,[]);
   } else if (r.axes[ax].status!=='unknown') {
    assert.ok(['indication','confirmed_yes'].includes(r.axes[ax].status),r.schoolId+':'+ax);
    assert.ok(r.axes[ax].sourceRefs.length>0,r.schoolId+':'+ax);
   }
  }
  assert.equal(r.publiclyVerified,false);
  if(!r.originalPdfVerification) assert.match(r.sourceReview,/未照合/);
 }
 assert.equal(records.filter(r=>r.priorFinding!==null).length,5);
 assert.equal(ledger.legacySummary.individualSchoolsReadyForPublication,0);
 assert.equal(records.filter(r=>r.originalPdfVerification).length,14);
 assert.equal(records.filter(r=>!r.originalPdfVerification).length,22);
});
test('municipality incident numbers cannot be automatically attributed to these schools',()=>{
 assert.equal(records.some(r=>r.confirmedWithoutConsent===true),false);
 assert.equal(records.some(r=>r.correctedIn2026===true),false);
});
