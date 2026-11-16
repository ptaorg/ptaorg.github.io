import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluate} from '../ai-system/report-standards/scripts/validate-municipal-v3.mjs';
import fs from 'node:fs';

const policy=JSON.parse(fs.readFileSync('ai-system/report-standards/municipal-v3-gates.json','utf8'));
const fill=fields=>Object.fromEntries(fields.map(k=>[k,true]));
const sample=()=>({
 municipality:'架空市',asOf:'2026-11-16',
 evidence:fill(policy.evidenceRequired),
 legal:fill(policy.legalRequired),
 progress:fill(policy.progressRequired),
 publication:fill(policy.publicationRequired),
 delegation:{...fill(policy.delegationRequired),status:'identified',contracts:[
 {id:'c1',direction:'pta_to_school',sourceRef:'s1',privateEffect:'費用・報告等の契約内容',publicAuthorityAssessment:'independent_authority_unverified'}
 ]},
 sources:[{id:'s1',title:'契約の写し',locator:'1頁'}],
 events:[{id:'e1',date:'2026-03-30',stage:'policy_changed',sourceRef:'s1'}],
 assertions:{}
});

test('complete fictional fixture structurally passes, without proving legal correctness',()=>{
 const r=evaluate(sample());assert.equal(r.readyForPublication,true);
});
test('incomplete Gmail / Drive or source research blocks final status',()=>{
 const d=sample();d.evidence.gmailSearchComplete=false;
 assert.equal(evaluate(d).readyForFinal,false);
 assert.ok(evaluate(d).missing.evidence.includes('gmailSearchComplete'));
});
test('private delegation agreement never creates public authority by itself',()=>{
 const d=sample();d.delegation.contracts[0].publicAuthorityAssessment='contract_alone_sufficient';
 assert.equal(evaluate(d).readyForPublication,false);
 assert.ok(evaluate(d).errors.some(x=>x.startsWith('DELEGATION_AUTHORITY_CONFLATED')));
 d.delegation.contracts[0].publicAuthorityAssessment='unverified';d.assertions.schoolCollectionAuthorizedByDelegation=true;
 assert.ok(evaluate(d).errors.includes('UNSUPPORTED_DELEGATION_AUTHORITY_CLAIM'));
});
test('contract directions are mandatory and independent',()=>{
 const d=sample();delete d.delegation.contracts[0].direction;
 assert.ok(evaluate(d).errors.some(x=>x.startsWith('DELEGATION_CONTRACT_INCOMPLETE')));
});
test('announcing policy change is not proof of school implementation',()=>{
 const d=sample();d.events.push({id:'e2',date:'2026-10-26',stage:'implemented_at_schools',sourceRef:'s1'});
 assert.ok(evaluate(d).errors.includes('IMPLEMENTATION_EVIDENCE_REQUIRED:e2'));
 d.events[1]={id:'e2',date:'2026-10-26',stage:'policy_changed',sourceRef:'s1'};
 d.assertions.reformCompletedFromPolicyAnnouncement=true;
 assert.ok(evaluate(d).errors.includes('POLICY_IS_NOT_IMPLEMENTATION'));
});
test('no delegation found requires documented search scope',()=>{
 const d=sample();d.delegation={...fill(policy.delegationRequired),status:'none_found_after_search',contracts:[]};
 assert.ok(evaluate(d).errors.includes('DELEGATION_NEGATIVE_SCOPE_REQUIRED'));
});
test('sources must link to each progress event and contract',()=>{
 const d=sample();d.events[0].sourceRef='unknown';
 assert.ok(evaluate(d).errors.includes('EVENT_SOURCE_UNRESOLVED:e1'));
});
test('machine gate distinguishes final evidence completion from publication verification',()=>{
 const d=sample();d.publication.xCardActuallyChecked=false;
 const r=evaluate(d);assert.equal(r.readyForFinal,true);assert.equal(r.readyForPublication,false);
});
test('regression: registry and entry must load v3, old fixed standards preserved',()=>{
 const entry=fs.readFileSync('.agents/skills/pta-municipal-school-report/SKILL.md','utf8');
 const registry=JSON.parse(fs.readFileSync('ai-system/SKILL_REGISTRY.json','utf8'));
 assert.match(entry,/municipal-assessment-v3\.md/);
 assert.ok(registry.skills.some(x=>x.id==='municipal-assessment-v3'));
 const axes=JSON.parse(fs.readFileSync('ai-system/report-standards/evaluation-axes.json','utf8'));
 assert.equal(axes.axes.length,12);
});
