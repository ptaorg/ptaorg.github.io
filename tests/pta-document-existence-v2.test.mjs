import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateDocumentExistence} from '../ai-system/report-standards/scripts/validate-document-existence.mjs';
import {validateReport} from '../ai-system/report-standards/scripts/validate-dataset.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=s=>JSON.parse(fs.readFileSync(path.join(root,s),'utf8'));
const where='ai-system/report-standards/pilots/';
const dataset=()=>read(where+'osaki-2026.dataset.json');
const ledger=()=>read(where+'osaki-document-existence-2026-v2.json');
test('Osaki expanded pilot uses 25 schools, 12 fixed axes, verified six-value totals',()=>{
 const d=dataset(),r=validateReport(d);
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(d.schools.length,25);
 assert.equal(d.sources.filter(s=>s.verification==='direct_checked').length,38);
 const a=r.metrics.axes;
 assert.equal(a.reduce((n,x)=>n+x.confirmed_yes,0),17);
 assert.equal(a.reduce((n,x)=>n+x.confirmed_no,0),3);
 assert.equal(a.reduce((n,x)=>n+x.indication,0),12);
 assert.equal(a.reduce((n,x)=>n+x.unknown,0),268);
 assert.equal(a.length,12);
 assert.equal(a.reduce((n,x)=>n+x.denominatorTargetSchools,0),300);
});
test('Separate document ledger validates 25 schools by 10 document types without converting absence to axis no',()=>{
 const d=ledger(),a=dataset(),r=validateDocumentExistence(d,{populationSchoolIds:a.scope.populationSchoolIds});
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.deepEqual([r.summary.schools,r.summary.documentTypes,r.summary.records],[25,10,250]);
 assert.deepEqual(r.summary.statuses,{present_as_standalone_document:14,present_as_provision_only:2,internal_rule_only:17,not_found_in_disclosure:197,not_disclosed:20,formally_determined_nonexistent:0});
 assert.equal(a.schools.filter(s=>Object.values(s.axes).some(x=>x.status==='confirmed_no')).length,3);
 assert.equal(d.schools.filter(s=>s.documents.applicationForm.status==='not_found_in_disclosure').length,23);
});
test('Submitting a document marked not found is rejected',()=>{
 const d=ledger();d.schools[0].documents.applicationForm.submitted=true;
 const r=validateDocumentExistence(d);assert.equal(r.ok,false);assert.ok(r.errors.some(e=>e.code==='NOT_FOUND_IS_SUBMITTED'));
});
test('Formal nonexistence requires an actual decision, date and public holding authority',()=>{
 const d=ledger();const f=d.schools[0].documents.applicationForm;f.status='formally_determined_nonexistent';
 const r=validateDocumentExistence(d);assert.equal(r.ok,false);assert.ok(r.errors.some(e=>e.code==='FORMAL_NONEXISTENCE'));
});
test('Every school must hold all 10 document types and match population IDs',()=>{
 const d=ledger(),ids=dataset().scope.populationSchoolIds;
 delete d.schools[0].documents.withdrawalRule;
 assert.ok(validateDocumentExistence(d).errors.some(e=>e.code==='DOCUMENT_COVERAGE'));
 assert.ok(validateDocumentExistence(ledger(),{populationSchoolIds:ids.slice(1)}).errors.some(e=>e.code==='POPULATION_MISMATCH'));
});
