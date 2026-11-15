import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {STATUS,POSITIVE_CHECKS,REVIEW_ORDER,assessParentSchool,isVerifiedCompliant,PARENT_REPORT_POLICY_VERSION} from '../assets/pta-parent-report-policy.mjs';
const audit=JSON.parse(fs.readFileSync('data/osaki-legal-screening-2026.json','utf8'));
const byId=id=>audit.schools.find(x=>x.schoolId===id);
const clone=x=>JSON.parse(JSON.stringify(x));
test('parent report policy versions and four evidence-governed tones are fixed',()=>{
  assert.equal(PARENT_REPORT_POLICY_VERSION,'1.2.0');
  assert.deepEqual(Object.keys(STATUS),['urgent','review','unknown','verified']);
  assert.ok(REVIEW_ORDER.indexOf('task_authority')<REVIEW_ORDER.indexOf('public_personal_data_purpose'));
  assert.ok(REVIEW_ORDER.indexOf('public_personal_data_purpose')<REVIEW_ORDER.indexOf('public_personal_data_use'));
});
test('Osaki: no school is blue by default or inferred from no observations',()=>{
  assert.equal(audit.schools.length,25);
  for(const school of audit.schools){
    const b=assessParentSchool(school,audit.legalRules);
    assert.notEqual(b.tone,'verified',school.schoolId);
    assert.equal(b.violationEstablished,false);
    if(!school.observations.length && school.feeRoute==='route_unestablished')assert.equal(b.tone,'unknown');
    for(const entry of b.legal){
      assert.equal(entry.reviewStatus,'要件検証中');
      assert.ok(entry.legalTest);
      assert.match(entry.lawUrl,/^https:\/\/laws\.e-gov\.go\.jp\//);
      assert.ok(b.minimum.includes(entry.minimum)||b.legal.indexOf(entry)>=5);
    }
  }
});
test('Osaki: concrete cases show only evidence-triggered laws, with authority before privacy',()=>{
  for(const id of ['tajiri-jhs','naruko-compulsory']){
    const b=assessParentSchool(byId(id),audit.legalRules);
    assert.equal(b.tone,'urgent');
    assert.equal(b.legal[0].id,'task_authority');
    const ids=b.legal.map(x=>x.id);
    assert.ok(ids.indexOf('public_personal_data_purpose')<ids.indexOf('public_personal_data_use'));
    assert.match(b.legalCaution,/違反が確定した法律/);
  }
  const officers=assessParentSchool(byId('furukawa-daini-es'),audit.legalRules);
  assert.deepEqual(officers.legal.map(x=>x.id),['officers']);
  assert.equal(officers.tone,'urgent');
  assert.equal(assessParentSchool(byId('furukawa-daiichi-es'),audit.legalRules).legal.length,0);
});
test('blue requires 8 independent positive findings with primary-source locators and no contradiction',()=>{
  const s=clone(byId('furukawa-daiichi-es'));
  s.feeRoute='pta_direct_collection_documented';
  s.complianceReview={outcome:'verified_compliant',schoolId:s.schoolId,targetYear:'2026',reviewer:'独立検証者',reviewedAt:'2026-11-15',checks:{}};
  for(const k of POSITIVE_CHECKS)s.complianceReview.checks[k]={finding:'verified_compliant',sourceRefs:[{sourceId:'verified-document-'+k,locator:'p.1'}]};
  assert.equal(isVerifiedCompliant(s),true);
  assert.equal(assessParentSchool(s,audit.legalRules).tone,'verified');
  s.complianceReview.checks.personalData.sourceRefs=[];
  assert.equal(assessParentSchool(s,audit.legalRules).tone,'unknown');
  s.complianceReview.checks.personalData.sourceRefs=[{sourceId:'privacy',locator:'p.2'}];
  s.observations.push({axis:'school_collection_of_pta_fee',status:'confirmed_yes'});
  assert.notEqual(assessParentSchool(s,audit.legalRules).tone,'verified');
});
test('school pages embed shared parent report module with a single immutable policy source',()=>{
  const browser=fs.readFileSync('assets/osaki-evidence-report.js','utf8');
  assert.match(browser,/pta-parent-report-policy\.mjs/);
  assert.match(browser,/assessParentSchool/);
  assert.match(browser,/抵触の有無を検討する法律/);
  assert.match(browser,/最低限必要なこと/);
  for(const s of audit.schools){
    const html=fs.readFileSync('archive/osaki/'+s.schoolId+'/index.html','utf8');
    assert.match(html,/type="module" src="\/assets\/osaki-evidence-report\.js/);
  }
});
