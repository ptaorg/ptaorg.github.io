import test from 'node:test';
import assert from 'node:assert/strict';
import {init,validate,sha256} from '../ai-system/report-standards/scripts/municipal-v4.mjs';
const date='2026-11-17';
function fixture(){
 const d=init('検証市',['school-a','school-b'],date);
 d.phases=Object.fromEntries(Object.keys(d.phases).map(x=>[x,'complete']));
 d.targets=[
  {id:'zip-a',description:'Gmail attachment archive',sourceChannel:'gmail',schoolId:null,state:'retrieved'},
  {id:'school-b',description:'school B collection material',sourceChannel:'official',schoolId:'school-b',state:'exhausted',exhaustionReason:'school and city archives checked; school-side internal record not obtained'}
 ];
 d.retrievalAttempts=[
  {id:'try-1',targetId:'zip-a',channel:'gmail',at:date,method:'authorized download',evidenceLocation:'message:A',outcome:'unsupported',reason:'connector returned unsupported archive'},
  {id:'try-2',targetId:'zip-a',channel:'drive',at:date,method:'authorized alternate-account retrieval',evidenceLocation:'drive:A',outcome:'retrieved'},
  {id:'try-3',targetId:'school-b',channel:'official',at:date,method:'official-site PDF search',evidenceLocation:'https://example.org/search',outcome:'not_found',reason:'No internal practice original located'}
 ];
 d.artifacts=[
  {id:'school-a-pdf',targetId:'zip-a',schoolId:'school-a',evidenceClass:'school_internal',verification:'text_verified',title:'PTA collection notice',sourceUrl:'https://example.org/a.pdf',sha256:'a'.repeat(64),locator:'p.2',excerpt:'PTA会費について'},
  {id:'school-b-registry',targetId:'school-b',schoolId:'school-b',evidenceClass:'official_registry',verification:'text_verified',title:'個人情報事務登録簿',providerId:'city-register:22',sha256:'b'.repeat(64),locator:'p.4',excerpt:'PTA役員名簿'}
 ];
 d.clips=[{artifactId:'school-a-pdf',path:'clips/a.webp',sha256:'c'.repeat(64),page:2,crop:[15,20,90,100],decision:'adopted',claim:'会費案内の存在',reason:'該当段落のみ'}];
 const legalSequence={subjectSeparation:'公私分離',taskOwnership:'PTA内部事務',publicAuthority:'学校側の授権は未確認',privacy61:'保有目的は未確認',privacy69:'利用提供は未確認',serviceAndFinance:'実態未確認',contractAndRights:'契約成立未確認'};
 d.schoolAssessments=[
  {schoolId:'school-a',status:'verified',evidenceIds:['school-a-pdf'],finding:'学校からの会費案内掲載',unknowns:'実際の収納主体',legalSequence},
  {schoolId:'school-b',status:'partial',evidenceIds:['school-b-registry'],finding:'市登録簿の名簿項目',unknowns:'現時点の事務処理',legalSequence}
 ];
 d.progress=Object.fromEntries(Object.keys(d.progress).map(x=>[x,true]));
 return d;
}
test('v4 initializes separate phases and keeps all unknowns explicit',()=>{
 const d=init('試験市',['s1'],date);
 assert.equal(d.phases.retrieve,'not_started');
 assert.equal(d.schoolAssessments.length,0);
 assert.equal(validate(d).readyForPublication,false);
});
test('v4 passes structured, audited handoffs with distinct original coverage',()=>{
 const r=validate(fixture());
 assert.deepEqual(r.errors,[]);
 assert.equal(r.metrics.targetSchoolCount,2);
 assert.equal(r.metrics.internalOriginalSchools,1);
 assert.equal(r.metrics.inspectedArtifacts,2);
 assert.equal(r.metrics.adoptedClips,1);
 assert.equal(r.readyForReview,true);
 assert.equal(r.readyForPublication,true);
});
test('v4 refuses a ZIP success without a logged successful retrieval',()=>{
 const d=fixture();d.retrievalAttempts=d.retrievalAttempts.filter(a=>a.id!=='try-2');
 assert.ok(validate(d).errors.some(e=>e.code==='TARGET_UNPROVEN'));
});
test('v4 does not treat a municipal registry as school internal-practice original',()=>{
 const d=fixture();d.artifacts[0].evidenceClass='official_registry';
 assert.equal(validate(d).metrics.internalOriginalSchools,0);
});
test('v4 refuses fabricated adopted crop and ungrounded verified school',()=>{
 const d=fixture();d.clips[0].crop=[10,20,8,100];d.artifacts[0].verification='metadata_only';
 const codes=validate(d).errors.map(e=>e.code);
 assert.ok(codes.includes('CROP_COORDINATES'));
 assert.ok(codes.includes('CLIP_UNVERIFIED_ORIGINAL'));
 assert.ok(codes.includes('ASSESSMENT_UNPROVEN'));
});
test('v4 detects missing school and phase review, keeping review blocked',()=>{
 const d=fixture();d.schoolAssessments.pop();d.phases.inspect='blocked';
 const r=validate(d);
 assert.ok(r.missing.includes('school:school-b'));
 assert.equal(r.readyForReview,false);
});
test('v4 insists on a real failed-retrieval reason and an exhaustion explanation',()=>{
 const d=fixture();d.retrievalAttempts[0].reason='';d.targets[1].exhaustionReason='';
 const codes=validate(d).errors.map(e=>e.code);
 assert.ok(codes.includes('ATTEMPT_REASON'));
 assert.ok(codes.includes('EXHAUSTION_UNPROVEN'));
});
test('v4 SHA256 is reproducible for byte-level evidence checks',()=>{
 assert.equal(sha256(Buffer.from('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
