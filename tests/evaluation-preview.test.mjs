import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildEvaluationPreview,assertOutsideRepo} from '../scripts/render-evaluation-preview.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const IDS=[
  'voluntary_membership_notice','explicit_opt_in','withdrawal_procedure','nonmember_equal_treatment',
  'school_collection_of_pta_fee','school_account_or_payment_system','school_personal_data_for_pta',
  'officer_selection_pressure','sensitive_exemption_questions','teacher_internal_pta_admin',
  'pta_spending_on_school_costs','school_pta_governance_overlap'
];
const axes={version:'1.0.0',axes:IDS.map((id,n)=>({id,label:'架空の評価軸 '+(n+1)}))};
const axis=()=>Object.fromEntries(IDS.map(id=>[id,{status:'unknown',observation:'現段階で未確認。',sourceRefs:[]}]));
const sample=()=>{
  const a=axis();
  a.school_collection_of_pta_fee={status:'confirmed_yes',observation:'架空の学校徴収資料にPTA会費を記載。',sourceRefs:[{sourceId:'nonpublic',locator:'p.1 該当欄'}]};
  a.school_account_or_payment_system={status:'indication',observation:'口座名義は未確認。',sourceRefs:[{sourceId:'nonpublic',locator:'p.1'}]};
  return {
    schemaVersion:'1.0.0',asOf:'2026-11-15',municipality:{id:'fictional',prefecture:'架空県',name:'架空市'},
    scope:{totalPublicSchools:2,populationSourceId:'official',scopeNote:'架空の学校2校を母集団として試験。',sampling:'census'},
    sources:[
      {id:'official',title:'架空の学校一覧',issuer:'架空市',documentDate:'2026-01-01',url:'https://example.org/official',publicationLinkChecked:true,containsPersonalData:false,verification:'direct_checked'},
      {id:'nonpublic',title:'架空の学校集金案内',issuer:'架空第一中学校',documentDate:'2026-01-10',
        url:'https://example.org/confidential.pdf',filePath:'私有の元資料/個人名.pdf',publicationLinkChecked:false,containsPersonalData:true,redactionChecked:false,verification:'direct_checked'}
    ],
    municipalDocuments:[],publication:{status:'draft'},
    schools:[
      {id:'sample-jhs',name:'架空第一中学校',schoolType:'中学校',analysisYear:'2026',sourceIds:['nonpublic'],axes:a},
      {id:'sample-es',name:'架空第二小学校',schoolType:'小学校',analysisYear:'2026',sourceIds:[],axes:axis()}
    ]
  };
};
const notes={rights:{'sample-jhs':[{
  interest:'プライバシー・人格的尊厳',status:'検証課題',
  observation:'これは架空の例であり、被害を認定したものではない。',
  impact:'本人の意思や申告事情を確認する必要がある。',
  sourceRefs:[{sourceId:'nonpublic',locator:'p.1'}]
}]},responsibility:{'sample-jhs':{
  educationBoard:{status:'未確認',basis:'教育委員会の規程・指示が確認されていない。'},
  school:{status:'架空例',basis:'学校案内が存在すると仮定する。'},
  pta:{status:'未確認',basis:'PTAの意思決定文書はない。'}
}},legal:{'sample-jhs':{subjectSeparation:'公的な学校と私的なPTAは別主体。',
  taskOwnership:'会費は原則としてPTAの内部事務。',publicAuthority:'学校が代理徴収できる公法上の権限は未確認。',
  privacy:'先に所掌事務を調べ、次に61条と69条を分析する。',conclusion:'規程の存在と適法性を混同しない。'}}};

test('a 12-axis municipality and school render as isolated static nonpublic HTML',()=>{
  const out=buildEvaluationPreview(sample(),axes,notes);
  assert.deepEqual(Object.keys(out).sort(),['index.html','metrics.json','schools/sample-es.html','schools/sample-jhs.html'].sort());
  assert.match(out['index.html'],/権利・自由・尊厳を守る/);
  assert.match(out['index.html'],/教育委員会の制度責任と学校の実施責任/);
  assert.match(out['schools/sample-jhs.html'],/1\. 主体の分離/);
  assert.match(out['schools/sample-jhs.html'],/5\. 根拠・適用・法的結論と反証/);
  assert.match(out['schools/sample-jhs.html'],/プライバシー・人格的尊厳/);
  assert.match(out['schools/sample-jhs.html'],/教育委員会の規程・指示が確認されていない/);
  assert.match(out['schools/sample-jhs.html'],/noindex,nofollow,noarchive/);
  assert.equal((out['schools/sample-jhs.html'].match(/架空の評価軸 /g)||[]).length,12);
  assert.match(out['index.html'],/学校別評価書へ進む/);
});

test('YES/target, YES/known, and known-coverage have separate denominators',()=>{
  const stats=JSON.parse(buildEvaluationPreview(sample(),axes)['metrics.json']).counts;
  const fee=stats.find(x=>x.id==='school_collection_of_pta_fee');
  assert.equal(fee.confirmed_yes,1);
  assert.equal(fee.unknown,1);
  assert.equal(fee.yesOfTargetPct,50);
  assert.equal(fee.yesOfKnownPct,100);
  assert.equal(fee.knownCoveragePct,50);
  const unobserved=stats.find(x=>x.id==='explicit_opt_in');
  assert.equal(unobserved.unknown,2);
  assert.equal(unobserved.yesOfKnownPct,null);
  assert.match(buildEvaluationPreview(sample(),axes)['index.html'],/算定不能/);
});

test('unapproved or privacy-sensitive source URLs and private file paths never appear',()=>{
  const html=Object.values(buildEvaluationPreview(sample(),axes,notes)).join('\n');
  assert.doesNotMatch(html,/example\.org\/confidential\.pdf/);
  assert.doesNotMatch(html,/私有の元資料/);
  assert.doesNotMatch(html,/個人名\.pdf/);
  assert.match(html,/原本リンク非掲載/);
  const d=sample();
  d.sources[1].publicationLinkChecked=true;
  assert.doesNotMatch(Object.values(buildEvaluationPreview(d,axes)).join('\n'),/example\.org\/confidential\.pdf/);
  d.sources[1].redactionChecked=true;
  assert.match(Object.values(buildEvaluationPreview(d,axes)).join('\n'),/example\.org\/confidential\.pdf/);
});

test('unsafe URLs, school IDs and HTML markup do not become code',()=>{
  const d=sample();d.municipality.name='<img src=x onerror=alert(1)>';
  d.sources[1].url='javascript:alert(1)';d.sources[1].publicationLinkChecked=true;d.sources[1].redactionChecked=true;
  const html=Object.values(buildEvaluationPreview(d,axes)).join('\n');
  assert.doesNotMatch(html,/<img src=x onerror/);
  assert.doesNotMatch(html,/href="javascript:/);
  assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
  d.schools[0].id='../escape';
  assert.throws(()=>buildEvaluationPreview(d,axes),/INVALID_OR_DUPLICATED_SCHOOL_ID/);
});

test('missing axis and invalid source references are rejected, not interpreted as no problem',()=>{
  const d=sample();delete d.schools[0].axes.explicit_opt_in;
  assert.throws(()=>buildEvaluationPreview(d,axes),/SCHOOL_MUST_HAVE_ALL_12_AXES/);
  d.schools[0].axes.explicit_opt_in=axis().explicit_opt_in;
  d.schools[0].axes.explicit_opt_in.sourceRefs=[{sourceId:'missing',locator:'p.1'}];
  assert.throws(()=>buildEvaluationPreview(d,axes),/INVALID_SOURCE_REF/);
  const badAxes={version:'1.0',axes:axes.axes.slice(0,11)};
  assert.throws(()=>buildEvaluationPreview(sample(),badAxes),/EXACTLY_12_AXES_REQUIRED/);
});

test('the CLI refuses to write previews inside the public site repository',()=>{
  assert.throws(()=>assertOutsideRepo(path.join(ROOT,'research','demo')),/SITE_REPOSITORY_OUTPUT_FORBIDDEN/);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pta-report-preview-test-'));
  try{
    const d=path.join(dir,'dataset.json'),a=path.join(dir,'axes.json'),out=path.join(dir,'rendered');
    fs.writeFileSync(d,JSON.stringify(sample()));
    fs.writeFileSync(a,JSON.stringify(axes));
    const run=spawnSync(process.execPath,[path.join(ROOT,'scripts/render-evaluation-preview.mjs'),d,a,out],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    assert.ok(fs.existsSync(path.join(out,'index.html')));
    assert.ok(fs.existsSync(path.join(out,'schools','sample-jhs.html')));
    assert.match(run.stdout,/NOT PUBLISHED/);
    const reject=spawnSync(process.execPath,[path.join(ROOT,'scripts/render-evaluation-preview.mjs'),d,a,path.join(ROOT,'archive','preview')],{encoding:'utf8'});
    assert.equal(reject.status,1);
    assert.match(reject.stderr,/SITE_REPOSITORY_OUTPUT_FORBIDDEN/);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('unreviewed rights and responsibility explicitly remain unreviewed',()=>{
  const html=buildEvaluationPreview(sample(),axes)['schools/sample-es.html'];
  assert.match(html,/個別の権利影響レビューは未実施/);
  assert.match(html,/制度設計と実施の責任主体/);
  assert.match(html,/制定者・指示系統・実施の証拠を未確認/);
  assert.doesNotMatch(html,/人権侵害が確定/);
});
