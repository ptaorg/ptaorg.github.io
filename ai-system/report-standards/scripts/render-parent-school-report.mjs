#!/usr/bin/env node
/* PTA保護者向け報告書: 全国共通・未公開HTML草稿の決定的生成。公開や既存HTML上書きなし。 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assessParentSchool} from '../../../assets/pta-parent-report-policy.mjs';
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const allowedId=v=>/^[a-z0-9][a-z0-9-]*$/.test(v);
const lawItem=r=>'<li><strong><a href="'+E(r.lawUrl)+'">'+E(r.law)+'</a></strong><span>'+E(r.issue)+'</span><small>要件検証中</small></li>';
const ol=a=>'<ol>'+a.map(v=>'<li>'+E(v)+'</li>').join('')+'</ol>';
export function buildParentReportDraft(input) {
  if(!input||!Array.isArray(input.schools)||!Array.isArray(input.legalRules)
      ||typeof input.municipality!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.asOf||''))
    throw Error('required: municipality, asOf, schools[], legalRules[]');
  const unique=new Set();
  const files={},manifest=[];
  for(const s of input.schools){
    if(!s||!allowedId(s.schoolId)||unique.has(s.schoolId)||typeof s.schoolName!=='string')throw Error('invalid or duplicate schoolId');
    unique.add(s.schoolId);
    const b=assessParentSchool(s,input.legalRules);
    const facts=s.observations.filter(o=>o.status==='confirmed_yes'||o.status==='indication'||o.status==='conflicting');
    const evidence=facts.length?facts.map(o=>'<div class="os2-paper-row"><span class="os2-paper-key">'+E(o.label)+'</span><strong class="os2-paper-value">'+E(o.evidenceNote||'資料記載の再確認を要する')+'</strong><span class="os2-pointer">資料記載</span></div>').join(''):
      '<p>この学校で個別の観察事実を確認できていません。問題なしという意味ではありません。</p>';
    const laws=b.legal.length?'<ul class="os2-law-summary">'+b.legal.slice(0,5).map(lawItem).join('')+'</ul>':'<p>適用条文を特定するための学校別資料が不足しています。</p>';
    const cards=[
      '<div class="os2-side-card os2-side--fact"><h2>確認されたこと</h2><p>'+E(facts.length?facts.map(x=>x.evidenceNote).join(' ').slice(0,270):'今回の確認範囲では具体的な行為が未確認です。')+'</p></div>',
      '<div class="os2-side-card os2-side--issue"><h2>何が問題か</h2><p>PTAは学校とは独立した任意団体。学校がPTA固有の事務を行う場合、まず具体的な公法上の権限が必要です。</p></div>',
      '<div class="os2-side-card os2-side--law"><h2>'+E(b.lawReviewTitle)+'</h2>'+laws+'<p class="os2-law-caution">'+E(b.legalCaution)+'</p></div>',
      '<div class="os2-side-card os2-side--minimum"><h2>適正化に最低限必要なこと</h2>'+ol(b.minimum)+'</div>'
    ].join('');
    const details='<details class="os2-minidetail"><summary>12評価軸・法令別検証・資料出典</summary><div class="os2-acc-body">'+
      b.legal.map(r=>'<p><strong>'+E(r.law)+'</strong>：'+E(r.legalTest)+'／'+E(r.reviewStatus)+'</p>').join('')+
      s.observations.map(x=>'<p>'+E(x.label)+'：'+E(x.status)+'／'+E(x.evidenceNote||'未確認')+'</p>').join('')+'</div></details>';
    const html='<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<title>'+E(s.schoolName)+' PTA調査レポート（未公開草稿）</title><link rel="stylesheet" href="/assets/style.css">'+
      '<link rel="stylesheet" href="/assets/osaki-evidence-report.css"></head>'+
      '<body class="osaki-case-v2"><main class="method"><header class="os2-hero os2--'+E(b.tone)+'"><div class="os2-shell">'+
      '<nav class="os2-breadcrumb">'+E(input.municipality)+'／'+E(input.asOf)+'／未公開草稿</nav>'+
      '<div class="os2-hero-ribbon"><span class="os2-school-chip">'+E(s.schoolName)+'</span><span class="os2-alert">'+E(b.status.label)+'</span></div>'+
      '<h1>'+E(s.schoolName)+'：学校とPTAの事務の境界を調べる</h1><p>'+E(b.status.description)+'</p></div></header>'+
      '<div class="os2-schoolbody"><div class="os2-shell"><div class="os2-columns"><section class="os2-evidence">'+
      '<h2>確認された資料の記載（文字による再構成）</h2><div class="os2-paper"><div class="os2-paper-table">'+evidence+'</div>'+
      '<p class="os2-paper-foot">原資料の画像ではありません。公開用の画像は別途匿名化・出典の検証後に差し込んでください。</p></div></section>'+
      '<aside class="os2-aside">'+cards+'</aside></div><div class="os2-research"><h2>詳細な法令・資料一覧</h2>'+details+'</div></div></div></main></body></html>';
    files['schools/'+s.schoolId+'.html']=html;
    manifest.push({schoolId:s.schoolId,schoolName:s.schoolName,tone:b.tone,legalTopics:b.legal.map(x=>x.id),legalViolationEstablished:false,sourceReview:'not independently validated by this renderer'});
  }
  files['index.json']=JSON.stringify({skillVersion:'1.2.0',municipality:input.municipality,asOf:input.asOf,publicationStatus:'draft',totalSchools:manifest.length,schools:manifest},null,2)+'\n';
  return files;
}
const direct=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(direct){
  const src=process.argv[2],out=process.argv[3];
  if(!src||!out){console.error('Usage: node render-parent-school-report.mjs <legal-screening.json> <output-dir>');process.exitCode=2}
  else try{
    const files=buildParentReportDraft(JSON.parse(fs.readFileSync(src,'utf8')));
    fs.mkdirSync(out,{recursive:true});
    for(const [name,content] of Object.entries(files)){
      const target=path.join(out,name);fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.writeFileSync(target,content,'utf8');
    }
    console.log('Created unpublished drafts: '+Object.keys(files).length+' files');
  }catch(err){console.error(err.message);process.exitCode=1}
}
