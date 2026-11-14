#!/usr/bin/env node
/**
 * Cross-branch real-city integration. All 25 HTML pages stay in runner temp.
 * PTA_REPORT_SKILL_DIR must point to a local copy of PR #180.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildEvaluationPreview, assertOutsideRepo} from '../scripts/render-evaluation-preview.mjs';

const skillRoot=process.env.PTA_REPORT_SKILL_DIR;
if(!skillRoot)throw Error('PTA_REPORT_SKILL_DIR is required: real-city data was not loaded');
const base=path.join(skillRoot,'ai-system','report-standards');
const read=p=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8'));
const d=read('pilots/osaki-2026.dataset.json');
const axes=read('evaluation-axes.json');
const validator=await import(pathToFileURL(path.join(base,'scripts','validate-dataset.mjs')));
const validation=validator.validateReport(d);
assert.equal(validation.ok,true,JSON.stringify(validation.errors));
assert.equal(axes.version,d.schemaVersion);

const files=buildEvaluationPreview(d,axes);
assert.equal(d.municipality.id,'osaki');
assert.equal(d.scope.totalPublicSchools,25);
assert.equal(d.schools.length,25);
assert.equal(Object.keys(files).length,27,'municipality + metrics + 25 school HTML files');

const metrics=JSON.parse(files['metrics.json']).counts;
assert.equal(metrics.length,12);
const fee=metrics.find(x=>x.id==='school_collection_of_pta_fee');
assert.deepEqual(
  [fee.confirmed_yes,fee.confirmed_no,fee.indication,fee.unknown,fee.yesOfTargetPct,fee.yesOfKnownPct,fee.knownCoveragePct],
  [1,0,0,24,4,100,4]
);
const account=metrics.find(x=>x.id==='school_account_or_payment_system');
assert.deepEqual([account.indication,account.unknown,account.yesOfKnownPct],[1,24,null]);
const governance=metrics.find(x=>x.id==='school_pta_governance_overlap');
assert.deepEqual([governance.confirmed_yes,governance.unknown,governance.yesOfKnownPct],[1,24,100]);
const teacher=metrics.find(x=>x.id==='teacher_internal_pta_admin');
assert.deepEqual([teacher.indication,teacher.unknown,teacher.yesOfKnownPct],[1,24,null]);
assert.equal(metrics.reduce((n,m)=>n+m.confirmed_yes,0),2);
assert.equal(metrics.reduce((n,m)=>n+m.indication,0),2);
assert.equal(metrics.reduce((n,m)=>n+m.unknown,0),296);
const candidatePath=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..','archive','osaki','tajiri-jhs','index.html');
if(fs.existsSync(candidatePath)){
  const candidate=fs.readFileSync(candidatePath,'utf8');
  const tajiriSource=d.schools.find(s=>s.id==='tajiri-jhs');
  for(const a of axes.axes){
    const pos=candidate.indexOf('<th scope="row">'+a.label+'</th>');
    assert.ok(pos>=0,'missing report axis: '+a.id);
    const row=candidate.slice(pos,candidate.indexOf('</tr>',pos));
    assert.ok(row.includes('（'+tajiriSource.axes[a.id].status+'）'),'report/source mismatch: '+a.id);
  }
  assert.equal((candidate.match(/class="m-no"/g)||[]).length,12);
  console.log('STATIC_CANDIDATE_SYNC_OK: Tajiri 12 statuses match skill source dataset');
}

const city=files['index.html'];
const tajiri=files['schools/tajiri-jhs.html'];
assert.match(city,/大崎市/);
assert.match(city,/田尻中学校/);
assert.match(city,/算定不能/);
assert.match(tajiri,/会費/);
assert.match(tajiri,/資料に記載あり/);
assert.match(tajiri,/教育委員会/);
assert.match(tajiri,/原本リンク非掲載/);
assert.match(tajiri,/権利・尊厳への影響/);
assert.match(tajiri,/個別の権利影響レビューは未実施/);
assert.match(tajiri,/5\. 根拠・適用・法的結論と反証/);
assert.match(tajiri,/noindex,nofollow,noarchive/);
const output=Object.values(files).filter(x=>typeof x==='string').join('\n');
for(const s of d.sources){
  if(s.filePath)assert.ok(!output.includes(s.filePath),'private file path leaked: '+s.id);
  if(s.url&&(!s.publicationLinkChecked||(s.containsPersonalData&&!s.redactionChecked)))
    assert.ok(!output.includes(s.url),'unapproved source URL leaked: '+s.id);
}

const dir=assertOutsideRepo(fs.mkdtempSync(path.join(os.tmpdir(),'pta-osaki-preview-')));
try{
  for(const [name,body] of Object.entries(files)){
    const out=path.join(dir,name);
    fs.mkdirSync(path.dirname(out),{recursive:true});
    fs.writeFileSync(out,body);
  }
  const {chromium}=await import('playwright');
  const browser=await chromium.launch({headless:true});
  try{
    for(const width of [1280,390,320]){
      const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});
      for(const rel of ['index.html','schools/tajiri-jhs.html','schools/naruko-compulsory.html']){
        await page.goto(pathToFileURL(path.join(dir,rel)).href,{waitUntil:'load'});
        const audit=await page.evaluate(()=>{
          const root=document.documentElement;
          const h1=document.querySelector('h1');
          const table=document.querySelector('.table-wrap');
          return {
            title:h1?.innerText||'',
            width:root.clientWidth,
            overflow:Math.max(root.scrollWidth,document.body.scrollWidth)-root.clientWidth,
            headings:document.querySelectorAll('h2').length,
            rows:document.querySelectorAll('table tbody tr').length,
            tableOverflow:table?table.scrollWidth>table.clientWidth:false,
            disclaimer:!!document.querySelector('.draft'),
            noindex:document.querySelector('meta[name="robots"]')?.content||''
          };
        });
        assert.ok(audit.title,'missing H1: '+rel);
        assert.ok(audit.headings>=5,'missing sections: '+rel);
        assert.ok(audit.disclaimer,'missing unpublished banner: '+rel);
        assert.match(audit.noindex,/noindex/);
        assert.ok(audit.overflow<=1,'document overflow '+audit.overflow+'px at '+width+'px on '+rel);
        assert.ok(audit.rows>=12,'missing axis rows: '+rel);
        console.log(JSON.stringify({viewport:width,page:rel,sections:audit.headings,tableRows:audit.rows,horizontalDocumentOverflowPx:audit.overflow,tableHasOwnScroll:audit.tableOverflow}));
      }
      // Navigation is exercised through real clicks, not only direct page.goto.
      await page.goto(pathToFileURL(path.join(dir,'index.html')).href,{waitUntil:'load'});
      await page.locator('a[href="schools/tajiri-jhs.html"]').click();
      assert.match(page.url(),/schools\/tajiri-jhs\.html$/);
      assert.match(await page.locator('h1').innerText(),/田尻中学校/);
      await page.locator('a[href="../index.html"]').click();
      assert.match(page.url(),/\/index\.html$/);
      assert.match(await page.locator('h1').innerText(),/大崎市/);
      await page.close();
    }
  }finally{await browser.close();}
  console.log('OSAKI_INTEGRATION_OK: 25 schools, 12 axes, 300 observations, private source paths withheld, desktop/mobile pages checked.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
