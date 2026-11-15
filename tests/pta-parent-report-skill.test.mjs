import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {STATUS,POSITIVE_CHECKS,REVIEW_ORDER,assessParentSchool,isVerifiedCompliant,PARENT_REPORT_POLICY_VERSION} from '../assets/pta-parent-report-policy.mjs';
import {buildParentReportDraft} from '../ai-system/report-standards/scripts/render-parent-school-report.mjs';
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
  for(const k of POSITIVE_CHECKS)s.complianceReview.checks[k]={finding:'verified_compliant',verification:'direct_checked',sourceRefs:[{sourceId:'verified-document-'+k,locator:'p.1'}]};
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
  assert.match(fs.readFileSync('assets/pta-parent-report-policy.mjs','utf8'),/抵触の有無を検討する法律/);
  assert.match(browser,/最低限必要なこと/);
  for(const s of audit.schools){
    const html=fs.readFileSync('archive/osaki/'+s.schoolId+'/index.html','utf8');
    assert.match(html,/type="module" src="\/assets\/osaki-evidence-report\.js/);
  }
});

test('nationwide draft generator produces deterministic, escaped, unpublished school HTML and manifest',()=>{
  const one=buildParentReportDraft(audit);
  const two=buildParentReportDraft(audit);
  assert.deepEqual(one,two);
  assert.equal(Object.keys(one).length,26);
  const manifest=JSON.parse(one['index.json']);
  assert.equal(manifest.publicationStatus,'draft');
  assert.equal(manifest.totalSchools,25);
  assert.equal(manifest.schools.filter(x=>x.tone==='verified').length,0);
  const naruko=one['schools/naruko-compulsory.html'];
  assert.match(naruko,/個人情報保護法61条/);
  assert.match(naruko,/適正化に最低限必要なこと/);
  assert.match(naruko,/詳細な法令・資料一覧/);
  assert.match(naruko,/原資料の画像ではありません/);
  assert.throws(()=>buildParentReportDraft({...audit,schools:[audit.schools[0],audit.schools[0]]}),/duplicate schoolId/);
  const corrupt=structuredClone(audit);
  corrupt.schools=[{...corrupt.schools[0],schoolName:'<script>alert(1)</script>'}];
  assert.ok(buildParentReportDraft(corrupt)['schools/furukawa-daiichi-es.html'].includes('&lt;script&gt;'));
});

test('all 25 Osaki overview narratives align with the same school and evidence axes',()=>{
  const d=JSON.parse(fs.readFileSync('data/osaki-school-overviews-2026.json','utf8'));
  assert.equal(d.schools.length,25);
  assert.equal(new Set(d.schools.map(x=>x.schoolId)).size,25);
  for(const s of audit.schools){
    const overview=d.schools.find(x=>x.schoolId===s.schoolId);
    assert.ok(overview,s.schoolId);
    assert.equal(overview.schoolName,s.schoolName);
    assert.ok(overview.title.length>=15,s.schoolId);
    assert.ok(overview.paragraphs.length>=3,s.schoolId);
    assert.ok(overview.paragraphs.every(p=>typeof p==='string'&&p.length>=95),s.schoolId);
    assert.deepEqual(overview.linkedObservationAxes,s.observations.map(x=>x.axis));
    if(s.documentDisclosure==='学校別資料未開示')assert.match(overview.paragraphs.join(''),/未開示|開示資料が|開示資料がない/);
    if(!s.observations.length && !['furukawa-kita-es','numabe-es'].includes(s.schoolId))
      assert.match(overview.paragraphs[0],/未登録|未開示|確定でき|確認でき|そろっておらず/);
  }
});
test('the school report paints the school-specific overview underneath evidence and before the topic row',()=>{
  const js=fs.readFileSync('assets/osaki-evidence-report.js','utf8');
  assert.match(js,/osaki-school-overviews-2026\.json/);
  assert.match(js,/renderSchoolOverview/);
  assert.ok(js.indexOf("evidenceHTML(s,c)")<js.indexOf("renderSchoolOverview(s,overview,level)"));
  assert.ok(js.indexOf("renderSchoolOverview(s,overview,level)")<js.indexOf("os2-topic-row"));
  const css=fs.readFileSync('assets/osaki-evidence-report.css','utf8');
  for(const tone of ['urgent','review','unknown','verified'])assert.match(css,new RegExp('os2-overview--'+tone));
});

test('nationwide HTML draft inserts optional school-specific summary without inventing evidence',()=>{
  const overviews=JSON.parse(fs.readFileSync('data/osaki-school-overviews-2026.json','utf8'));
  const drafts=buildParentReportDraft(audit,overviews);
  const report=drafts['schools/naruko-compulsory.html'];
  assert.match(report,/PTAの会計処理に、学校の決裁ルートが組み込まれている/);
  assert.match(report,/学校別総評/);
  assert.ok(report.indexOf('学校別総評')<report.indexOf('os2-side-card'));
  assert.match(buildParentReportDraft(audit)['schools/naruko-compulsory.html'],/確認・編集が未了/);
});
