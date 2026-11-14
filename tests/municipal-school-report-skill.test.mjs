import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateReport} from '../ai-system/report-standards/scripts/validate-dataset.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=p=>fs.readFileSync(path.join(root,p),'utf8');
const raw=file('ai-system/report-standards/fixtures/fictional-city.json');
const fresh=()=>JSON.parse(raw);
const axis=key=>fresh().schools[0].axes[key];
const codes=result=>new Set(result.errors.map(e=>e.code));
const getMetric=(result,id)=>result.metrics.axes.find(a=>a.id===id);

test('fixed 12 axes, their order, and the single source of truth are present',()=>{
  const axes=JSON.parse(file('ai-system/report-standards/evaluation-axes.json'));
  assert.equal(axes.version,'1.0.0');
  assert.equal(axes.axes.length,12);
  assert.equal(new Set(axes.axes.map(a=>a.id)).size,12);
  assert.equal(axes.axes[0].id,'voluntary_membership_notice');
  assert.equal(axes.axes[6].id,'school_personal_data_for_pta');
  assert.equal(axes.axes[11].id,'school_pta_governance_overlap');
  assert.match(file('ai-system/skills/municipal-school-report.md'),/個人情報保護法第61条/);
  assert.match(file('.agents/skills/pta-municipal-school-report/SKILL.md'),/ai-system\/skills\/municipal-school-report\.md/);
});

test('fictional draft is structurally valid, but cannot be published',()=>{
  assert.equal(validateReport(fresh()).ok,true);
  const published=validateReport(fresh(),{publish:true});
  assert.equal(published.ok,false);
  assert.ok(codes(published).has('PUBLICATION_GATE'));
  assert.ok(codes(published).has('FICTIONAL_EXAMPLE'));
});

test('unknown sources never become confirmed no or an invented 0% observed prevalence',()=>{
  const result=validateReport(fresh());
  const unknown=getMetric(result,'voluntary_membership_notice');
  assert.equal(unknown.unknown,2);
  assert.equal(unknown.confirmedKnownDenominator,0);
  assert.equal(unknown.confirmedYesOfKnownPct,null);
  assert.equal(unknown.confirmedCoveragePct,0);
  const optin=getMetric(result,'explicit_opt_in');
  assert.equal(optin.confirmed_yes,1);
  assert.equal(optin.unknown,1);
  assert.equal(optin.confirmedYesOfTargetPct,50);
  assert.equal(optin.confirmedYesOfKnownPct,100);
  assert.equal(optin.confirmedCoveragePct,50);
});

test('an explicit negative is different from no documents',()=>{
  const positive=getMetric(validateReport(fresh()),'school_collection_of_pta_fee');
  assert.equal(positive.confirmed_no,1);
  assert.equal(positive.unknown,1);
  assert.equal(positive.confirmedYesOfKnownPct,0);
  const d=fresh();
  d.schools[1].axes.school_collection_of_pta_fee.explicitNegative=false;
  assert.ok(codes(validateReport(d)).has('NEGATIVE_NOT_EXPLICIT'));
});

test('a claim of confirmed yes requires contemporaneous directly-inspected primary evidence',()=>{
  const d=fresh();
  d.sources.find(s=>s.id==='demo-optin').verification='metadata_only';
  assert.ok(codes(validateReport(d)).has('NO_PRIMARY_CONFIRMATION'));
  d.sources.find(s=>s.id==='demo-optin').verification='direct_checked';
  d.sources.find(s=>s.id==='demo-optin').targetYear='2025';
  assert.ok(codes(validateReport(d)).has('SOURCE_YEAR_MISMATCH'));
});

test('all target schools and 12 axes must be represented without silent omission',()=>{
  const d=fresh();
  delete d.schools[0].axes.withdrawal_procedure;
  assert.ok(codes(validateReport(d)).has('MISSING_AXIS'));
  d.schools.pop();
  assert.ok(codes(validateReport(d)).has('CENSUS_MISSING'));
});

test('source citations must resolve and contain exact locators',()=>{
  const d=fresh();
  d.schools[0].axes.explicit_opt_in.sourceRefs[0].sourceId='nonexistent';
  assert.ok(codes(validateReport(d)).has('UNKNOWN_SOURCE'));
  d.schools[0].axes.explicit_opt_in.sourceRefs[0].sourceId='demo-optin';
  d.schools[0].axes.explicit_opt_in.sourceRefs[0].locator='';
  assert.ok(codes(validateReport(d)).has('REFERENCE_LOCATOR'));
});

test('legal assessment cannot exist without a five-stage review record',()=>{
  const d=fresh();
  d.narrativeClaims.push({id:'legal-claim-1',kind:'legal_assessment',text:'仮の評価。',schoolId:'demo-school-1',sourceRefs:[]});
  assert.ok(codes(validateReport(d)).has('LEGAL_REVIEW_MISSING'));
  d.legalReviews.push({claimId:'legal-claim-1',subjectSeparation:'公的主体と私的団体を分離',taskOwnership:'PTAの会費事務',publicAuthority:'未確認',privacyAnalysis:'所掌検証後に確認',applicationAndConclusion:'断定しない',counterInterpretation:'例外的根拠は未確認',seniorReviewed:false});
  assert.equal(validateReport(d).ok,true);
});

test('schema requires the same 12 axes and review gates',()=>{
  const schema=JSON.parse(file('ai-system/report-standards/report-dataset.schema.json'));
  const axes=JSON.parse(file('ai-system/report-standards/evaluation-axes.json'));
  const defs=schema.properties.schools.items.properties.axes;
  assert.deepEqual(defs.required,axes.axes.map(x=>x.id));
  assert.equal(defs.additionalProperties,false);
  assert.equal(schema.properties.publication.additionalProperties,false);
  assert.ok(schema.properties.scope.required.includes('populationSchoolIds'));
  assert.equal(schema.properties.scope.properties.populationSchoolIds.uniqueItems,true);
  assert.ok(schema.properties.schoolData===undefined);
});

import {buildDraft} from '../ai-system/report-standards/scripts/render-draft.mjs';
test('standardized report skeletons are deterministic and include 12 metrics and school-level sources',()=>{
  const first=buildDraft(fresh()),second=buildDraft(fresh());
  assert.deepEqual(first,second);
  assert.equal(Object.keys(first).length,6); // city, metrics, sources, map, two schools
  const md=first['municipality-report.md'];
  assert.match(md,/自治体全体の特色/);
  assert.match(md,/学校別評価書/);
  assert.match(md,/50\.0%/);
  assert.match(md,/算定不能/);
  assert.match(md,/判定可能校YES率/);
  assert.match(first['schools/demo-school-1.md'],/主体の分離/);
  assert.match(first['schools/demo-school-2.md'],/一次資料で明示的に記載なし/);
  const map=JSON.parse(first['map-record.json']);
  assert.equal(map.publicationStatus,'draft');
  assert.equal(map.coordinates,null);
  assert.equal(map.reportUrl,null);
});


test('publishing requires named, dated independent review and a sourced legal conclusion',()=>{
  const d=fresh();
  d.publication.status='approved';
  for(const k of ['sourceChecked','linksChecked','citationsChecked','redactionsChecked','legalReviewCompleted','seniorApproved','humanApproved'])d.publication[k]=true;
  for(const s of d.sources)s.publicationLinkChecked=true;
  const result=validateReport(d,{publish:true});
  assert.ok(codes(result).has('REVIEW_SIGNATURE'));
  assert.ok(codes(result).has('MISSING_REPORT_ASSESSMENT'));
  d.publication.reviewRecord={seniorReviewer:'reviewer-role',seniorReviewedAt:'2026-11-14',humanApprover:'approver-role',humanApprovedAt:'2026-11-14'};
  const r2=validateReport(d,{publish:true});
  assert.equal(codes(r2).has('REVIEW_SIGNATURE'),false);
  assert.equal(codes(r2).has('MISSING_REPORT_ASSESSMENT'),true);
});


test('not-applicable status requires direct contemporaneous primary evidence',()=>{
  const d=fresh();
  const v=d.schools[0].axes.withdrawal_procedure;
  v.status='not_applicable';
  v.observation='試験データ上の適用対象外という仮定';
  v.sourceRefs=[{sourceId:'demo-optin',locator:'p.1'}];
  assert.equal(validateReport(d).ok,true);
  d.sources.find(s=>s.id==='demo-optin').verification='metadata_only';
  assert.ok(codes(validateReport(d)).has('NA_NOT_VERIFIED'));
});

test('conflicting status requires two distinct directly checked primary sources',()=>{
  const d=fresh();
  d.schools[0].sourceIds.push('demo-list');
  const v=d.schools[0].axes.withdrawal_procedure;
  v.status='conflicting';
  v.observation='試験データで相反する文書を仮定';
  v.sourceRefs=[{sourceId:'demo-optin',locator:'p.1'},{sourceId:'demo-list',locator:'p.2'}];
  assert.equal(validateReport(d).ok,true);
  d.sources.find(s=>s.id==='demo-list').verification='metadata_only';
  assert.ok(codes(validateReport(d)).has('CONFLICT_NOT_VERIFIED'));
  d.sources.find(s=>s.id==='demo-list').verification='direct_checked';
  d.sources.find(s=>s.id==='demo-list').targetYear='2025';
  assert.ok(codes(validateReport(d)).has('CONFLICT_NOT_VERIFIED'));
});

test('invalid dataset cannot produce trusted metrics via CLI',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pta-invalid-metrics-'));
  try{
    const d=fresh();
    delete d.schools[0].axes.withdrawal_procedure;
    const input=path.join(dir,'invalid.json'),out=path.join(dir,'metrics.json');
    fs.writeFileSync(input,JSON.stringify(d));
    const script=path.join(root,'ai-system/report-standards/scripts/validate-dataset.mjs');
    const run=spawnSync(process.execPath,[script,input,'--metrics',out],{encoding:'utf8'});
    assert.equal(run.status,1);
    assert.equal(fs.existsSync(out),false);
    assert.match(run.stderr,/METRICS_NOT_WRITTEN/);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});


test('census roster catches a substituted school even when the school count remains unchanged',()=>{
  const d=fresh();
  d.schools[1].id='unlisted-school';
  const result=validateReport(d);
  assert.ok(codes(result).has('SCHOOL_NOT_IN_ROSTER'));
  assert.ok(codes(result).has('ROSTER_SCHOOL_MISSING'));
});

test('a selected school must still be part of the official complete school roster',()=>{
  const d=fresh();
  d.scope.sampling='selected';
  d.schools.pop();
  assert.equal(validateReport(d).ok,true);
  d.schools[0].id='unlisted-school';
  assert.ok(codes(validateReport(d)).has('SCHOOL_NOT_IN_ROSTER'));
});

test('school population roster must be complete and unique',()=>{
  const d=fresh();
  d.scope.populationSchoolIds=['demo-school-1','demo-school-1'];
  assert.ok(codes(validateReport(d)).has('POPULATION_ROSTER'));
});

test('the checked-in JSON Schema is enforced at runtime, not only documented',()=>{
  const d=fresh();
  d.publication.unreviewedBypass=true;
  assert.ok(codes(validateReport(d)).has('SCHEMA_EXTRA'));
  delete d.publication.unreviewedBypass;
  d.schools[0].axes.explicit_opt_in.observation=42;
  assert.ok(codes(validateReport(d)).has('SCHEMA_TYPE'));
  d.schools[0].axes.explicit_opt_in.observation='checked';
  d.asOf='2026-11-31';
  assert.ok(codes(validateReport(d)).has('SCHEMA_DATE'));
});


test('Osaki real-city pilot locks 25 official school IDs but does not invent PTA findings',()=>{
  const d=JSON.parse(file('ai-system/report-standards/pilots/osaki-2026.dataset.json'));
  assert.equal(d.scope.totalPublicSchools,25);
  assert.equal(d.schools.length,25);
  assert.equal(d.schools.filter(s=>s.schoolType==='小学校').length,14);
  assert.equal(d.schools.filter(s=>s.schoolType==='中学校').length,9);
  assert.equal(d.schools.filter(s=>s.schoolType==='義務教育学校').length,2);
  const checked=validateReport(d);
  assert.equal(checked.ok,true,JSON.stringify(checked.errors));
  const fee=checked.metrics.axes.find(a=>a.id==='school_collection_of_pta_fee');
  assert.equal(fee.confirmed_yes,1);
  assert.equal(fee.unknown,24);
  assert.equal(fee.confirmedYesOfTargetPct,4);
  assert.equal(fee.confirmedYesOfKnownPct,100);
  assert.equal(fee.confirmedCoveragePct,4);
  const account=checked.metrics.axes.find(a=>a.id==='school_account_or_payment_system');
  assert.equal(account.indication,1);
  assert.equal(account.unknown,24);
  assert.equal(account.confirmedYesOfKnownPct,null);
  assert.ok(checked.metrics.axes.filter(a=>!['school_collection_of_pta_fee','school_account_or_payment_system'].includes(a.id))
    .every(a=>a.unknown===25 && a.confirmedYesOfKnownPct===null));
  const tajiri=d.schools.find(s=>s.id==='tajiri-jhs');
  assert.equal(tajiri.axes.school_collection_of_pta_fee.sourceRefs.length,2);
  assert.equal(tajiri.axes.school_account_or_payment_system.status,'indication');
  const attempt=validateReport(d,{publish:true});
  assert.equal(attempt.ok,false);
  assert.ok(codes(attempt).has('PUBLICATION_APPROVAL'));
});


test('Osaki pipeline renders 25 school drafts plus municipality, metrics, sources and map without publishing',()=>{
  const d=JSON.parse(file('ai-system/report-standards/pilots/osaki-2026.dataset.json'));
  const artifacts=buildDraft(d);
  assert.equal(Object.keys(artifacts).length,29);
  assert.match(artifacts['municipality-report.md'],/田尻中学校/);
  assert.match(artifacts['municipality-report.md'],/4\\.0%/);
  assert.match(artifacts['schools/tajiri-jhs.md'],/PTA会費1,500円/);
  assert.match(artifacts['schools/tajiri-jhs.md'],/事務室まで直接納入/);
  assert.match(artifacts['schools/naruko-compulsory.md'],/未確認/);
  const map=JSON.parse(artifacts['map-record.json']);
  assert.equal(map.reportUrl,null);
  assert.equal(map.publishedSchoolReports,0);
  assert.equal(map.publicationStatus,'draft');
});
