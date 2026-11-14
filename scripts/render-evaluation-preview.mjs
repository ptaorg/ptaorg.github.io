#!/usr/bin/env node
/**
 * Read-only, privacy-aware HTML preview for the 12-axis municipal/school report skill.
 * This is NOT the public publishing pipeline. Output must stay outside the site repo.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ALLOWED=new Set(['confirmed_yes','confirmed_no','indication','unknown','not_applicable','conflicting']);
const LABELS={confirmed_yes:'資料に記載あり',confirmed_no:'資料で明示的に記載なし',indication:'示唆・追加確認',unknown:'未確認',not_applicable:'非該当',conflicting:'資料間矛盾'};
const LEGAL=[
  ['subjectSeparation','1. 主体の分離：学校・教育委員会とPTA'],
  ['taskOwnership','2. 事務の帰属：誰の事務なのか'],
  ['publicAuthority','3. 学校側の所掌事務・公法上の権限'],
  ['privacy','4. 個人情報保護法61条・69条'],
  ['conclusion','5. 根拠・適用・法的結論と反証']
];
const ESC={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const e=x=>String(x??'').replace(/[&<>"']/g,m=>ESC[m]);
const pct=(n,d)=>d?((100*n)/d).toFixed(1)+'%':'算定不能';
const asArray=x=>Array.isArray(x)?x:[];
function checkedUrl(s){
  if(!s||!s.publicationLinkChecked||!s.url)return null;
  if(s.containsPersonalData&&!s.redactionChecked)return null;
  try{const u=new URL(s.url);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}
}
function verify(d,axes){
  if(!d||!d.municipality||!d.scope||!Array.isArray(d.schools)||!Array.isArray(d.sources))throw Error('MISSING_REPORT_STRUCTURE');
  if(!axes||!Array.isArray(axes.axes)||axes.axes.length!==12)throw Error('EXACTLY_12_AXES_REQUIRED');
  const ids=axes.axes.map(a=>a.id);
  if(new Set(ids).size!==12||ids.some(id=>!(/^[a-z][a-z0-9_]*$/.test(id))))throw Error('INVALID_AXIS_IDS');
  if(!d.schools.length||!Number.isInteger(d.scope.totalPublicSchools)||d.scope.totalPublicSchools<d.schools.length)throw Error('INVALID_SCHOOL_POPULATION');
  const src=new Map(d.sources.map(s=>[s.id,s]));
  const seen=new Set();
  for(const s of d.schools){
    if(!/^[a-z0-9-]+$/.test(s.id)||seen.has(s.id))throw Error('INVALID_OR_DUPLICATED_SCHOOL_ID');
    seen.add(s.id);
    if(!s.axes||Object.keys(s.axes).length!==12||ids.some(id=>!Object.hasOwn(s.axes,id)))throw Error('SCHOOL_MUST_HAVE_ALL_12_AXES: '+s.id);
    for(const a of ids){
      const v=s.axes[a];
      if(!v||!ALLOWED.has(v.status))throw Error('BAD_AXIS_STATUS: '+s.id+' '+a);
      for(const r of asArray(v.sourceRefs)){
        if(!src.has(r.sourceId)||!r.locator||!String(r.locator).trim())throw Error('INVALID_SOURCE_REF: '+s.id+' '+a);
      }
    }
  }
  if(d.scope.sampling==='census'&&d.schools.length!==d.scope.totalPublicSchools)throw Error('INCOMPLETE_CENSUS');
  return {ids,src};
}
const css=[
  ':root{color-scheme:light;--ink:#172d36;--muted:#52656e;--line:#d8e1e4;--bg:#f6f8f8;--teal:#176874;}',
  '*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.8 system-ui,-apple-system,"Noto Sans JP",sans-serif}',
  'main{max-width:1060px;margin:0 auto;padding:32px 24px 100px}.hero{background:#fff;border:1px solid var(--line);border-radius:12px;padding:28px 32px;margin-bottom:20px}',
  'h1{font-size:clamp(1.5rem,3vw,2.15rem);line-height:1.45;margin:8px 0}h2{font-size:1.32rem;margin:0 0 16px}h3{font-size:1.08rem;margin:20px 0 8px}',
  'p{margin:8px 0}a{color:#135c71;text-underline-offset:3px}.eyebrow{font-size:.8rem;letter-spacing:.04em;color:var(--teal);font-weight:750}',
  '.draft{background:#fff2db;color:#6b4214;border-left:5px solid #b17c29;padding:12px 16px;margin-bottom:20px;font-weight:650}',
  '.section{background:#fff;border:1px solid var(--line);border-radius:12px;margin:20px 0;padding:24px 30px}',
  '.lede{font-size:1.02rem}.muted,.note{color:var(--muted);font-size:.9rem}.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:20px}',
  '.metric{background:#f3f7f7;border:1px solid var(--line);border-radius:10px;padding:14px}.metric strong{display:block;font-size:1.75rem;line-height:1.4}.metric span{font-size:.83rem}',
  '.table-wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:620px;font-size:.91rem}th,td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}',
  'th{background:#edf4f5;font-weight:700}td small{display:block;color:var(--muted)}ol,ul{padding-left:1.4em}.list>li{padding:8px 0;border-bottom:1px solid var(--line)}',
  '.tag{display:inline-block;font-size:.75rem;padding:2px 9px;border-radius:4px;background:#edf1f1;color:#395862;font-weight:700;white-space:nowrap}',
  '.yes{background:#dcefed;color:#145b58}.unknown{background:#edf1f1;color:#52616b}.hint{background:#fff2dc;color:#82561a}',
  '.alert{border-left:3px solid #8c9da4;padding:4px 14px;margin-top:14px}.evidence{font-size:.83rem;color:var(--muted)}',
  '.crumb{font-size:.86rem;margin:0 0 14px}.steps>li{margin-bottom:14px}.footer{margin-top:36px;color:var(--muted);font-size:.84rem}',
  '@media(max-width:620px){main{padding:16px 12px 64px}.hero,.section{padding:18px}.metrics{grid-template-columns:1fr 1fr}body{font-size:15px}}'
].join('\n');

function page(title,main){
  return '<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta name="robots" content="noindex,nofollow,noarchive"><title>'+e(title)+'｜PTA適正化推進委員会・未公開プレビュー</title>'+
    '<style>'+css+'</style></head><body><main><div class="draft">未公開の作業プレビューです。自動生成結果は公開承認・法的結論を意味しません。</div>'+
    main+'<div class="footer">権利・尊厳への影響、事実の認定、公法上の権限、法令適用、是正責任を区別して検証するための表示試作です。</div></main></body></html>\n';
}
function section(title,html,id=''){return '<section class="section"'+(id?' id="'+e(id)+'"':'')+'><h2>'+e(title)+'</h2>'+html+'</section>';}
function tags(st){
  const cls=st==='confirmed_yes'?'yes':st==='unknown'?'unknown':st==='indication'||st==='conflicting'?'hint':'';
  return '<span class="tag '+cls+'">'+e(LABELS[st]||st)+'</span>';
}
function evidence(refs,src){
  const r=asArray(refs);
  return r.length?r.map(x=>{
    const s=src.get(x.sourceId);
    return e(x.sourceId)+'（'+e(x.locator)+'）'+(checkedUrl(s)?' <a rel="noopener noreferrer" href="'+e(checkedUrl(s))+'">公開原本</a>':' <small>原本リンク非公開</small>');
  }).join('、'):'資料位置は未確認';
}
function rights(s,annotations,src){
  const values=asArray(annotations?.rights?.[s.id]);
  const intro='<p>自由な加入・非加入、役員就任に関する自己決定、家庭事情のプライバシー、子どもの公平な取扱いを検証します。<strong>該当事実が確認されない限り、人権侵害と断定しません。</strong></p>';
  if(!values.length)return intro+'<p class="alert">個別の権利影響レビューは未実施です。権利侵害が存在しないという意味ではありません。</p>';
  return intro+'<ul class="list">'+values.map(v=>'<li><strong>'+e(v.interest||'権利・尊厳への影響')+'</strong> / '+e(v.status||'未確認')+
    '<p>'+e(v.observation||'具体的な確認事実は未記述')+'</p><p class="muted">'+e(v.impact||'法的評価は未了')+'</p><p class="evidence">'+evidence(v.sourceRefs,src)+'</p></li>').join('')+'</ul>';
}
function responsibility(s,annotations){
  const values=annotations?.responsibility?.[s.id]||{};
  const entries=[['educationBoard','教育委員会：制度設計・指示・監督'],['school','学校・校長：実施・管理'],['pta','PTA：団体内部の意思決定・事務']];
  return '<p>規程を作った主体と現場で実施した主体を分けます。要綱・委任・同意の存在だけで公務上の権限が生じたとは評価しません。</p>'+
    '<div class="table-wrap"><table><thead><tr><th>責任主体</th><th>調査状況</th><th>根拠・未確認事項</th></tr></thead><tbody>'+
    entries.map(([k,label])=>{const x=values[k]||{};return '<tr><th>'+e(label)+'</th><td>'+e(x.status||'未確認')+'</td><td>'+e(x.basis||'制定者・指示系統・実施の証拠を未確認')+'</td></tr>';}).join('')+
    '</tbody></table></div>';
}
function legal(s,annotations){
  const v=annotations?.legal?.[s.id]||{};
  return '<p>以下の順番を守り、規則の存在・適用可能性・個別の適法性を混同しません。</p><ol class="steps">'+
    LEGAL.map(([k,title])=>'<li><strong>'+e(title)+'</strong><p>'+e(v[k]||'未審査。根拠資料と反対解釈を検討する。')+'</p></li>').join('')+'</ol>';
}
function sourceList(ids,src){
  return ids.length?'<ul class="list">'+ids.map(id=>{const s=src.get(id);if(!s)return '<li>'+e(id)+'：参照先なし</li>';return '<li><strong>'+e(s.title)+'</strong><p class="muted">'+e(s.issuer||'発行主体未確認')+' ／ '+e(s.documentDate||'日付未確認')+' ／ '+e(s.verification||'照合未確認')+'</p>'+
    (checkedUrl(s)?'<p><a href="'+e(checkedUrl(s))+'" rel="noopener noreferrer">公開原本を確認</a></p>':'<p class="note">原本リンク非掲載（公開可否・匿名化・接続確認を別途審査）</p>')+'</li>';}).join('')+'</ul>':'<p>個別校の原資料は未登録です。不存在を意味しません。</p>';
}
function renderSchool(d,s,axes,annotations,src){
  const rows=axes.axes.map(a=>{
    const v=s.axes[a.id];
    return '<tr><th>'+e(a.label)+'</th><td>'+tags(v.status)+'</td><td>'+e(v.observation||'記述なし')+'<small>'+evidence(v.sourceRefs,src)+'</small></td></tr>';
  }).join('');
  const main='<nav class="crumb"><a href="../index.html">自治体総合評価へ戻る</a> / '+e(s.name)+'</nav>'+
    '<header class="hero"><div class="eyebrow">'+e(d.municipality.prefecture)+' '+e(d.municipality.name)+' / '+e(s.schoolType)+' / '+e(s.analysisYear)+'年度</div>'+
    '<h1>'+e(s.name)+'｜PTA制度・運用評価書</h1><p class="lede">調査の目的は、保護者と子どもの権利・自由・尊厳を守ることです。観察事実と権利への影響、責任主体、法的評価を分けて記載します。</p>'+
    '<p class="muted">資料に記載ありは行為の存在に関する確認であり、適法・違法という判定ではありません。</p></header>'+
    section('1. 権利・尊厳への影響',rights(s,annotations,src),'rights')+
    section('2. 一次資料による固定12軸の確認','<div class="table-wrap"><table><thead><tr><th>固定評価軸</th><th>観察状態</th><th>資料上の記載・該当箇所</th></tr></thead><tbody>'+rows+'</tbody></table></div>')+
    section('3. 制度設計と実施の責任主体',responsibility(s,annotations))+
    section('4. 法的検討：誰の事務か、なぜ学校ができるのか',legal(s,annotations))+
    section('5. 原資料の確認状態',sourceList(s.sourceIds||[],src))+
    section('6. 調査上の限界と是正事項','<p>未確認の項目は問題なしと評価しません。教育委員会が制度を設けている場合と、学校が独自に運用している場合を区別し、各主体の説明と原資料を確認したうえで是正主体を判断します。</p>');
  return page(s.name+'・個別評価',main);
}
function metric(d,axes){
  return axes.axes.map(a=>{
    const counts=Object.fromEntries([...ALLOWED].map(s=>[s,0]));
    for(const s of d.schools)counts[s.axes[a.id].status]++;
    const known=counts.confirmed_yes+counts.confirmed_no;
    return {id:a.id,label:a.label,...counts,all:d.schools.length,known,yesOfTargetPct:d.schools.length?Number((100*counts.confirmed_yes/d.schools.length).toFixed(1)):null,
      yesOfKnownPct:known?Number((100*counts.confirmed_yes/known).toFixed(1)):null,knownCoveragePct:d.schools.length?Number((100*known/d.schools.length).toFixed(1)):null};
  });
}
function renderMunicipality(d,axes,annotations,metrics){
  const city=d.municipality;
  const fee=metrics.find(m=>m.id==='school_collection_of_pta_fee');
  const stats='<div class="metrics"><div class="metric"><span>自治体の公立学校数（母集団）</span><strong>'+e(d.scope.totalPublicSchools)+'</strong><span>根拠：'+e(d.scope.populationSourceId||'未確認')+'</span></div>'+
    '<div class="metric"><span>今回の調査対象校</span><strong>'+e(d.schools.length)+'</strong><span>'+pct(d.schools.length,d.scope.totalPublicSchools)+'を登録</span></div>'+
    '<div class="metric"><span>会費徴収軸の判定可能率</span><strong>'+e(pct(fee?.known||0,d.schools.length))+'</strong><span>未確認は問題なしに含めない</span></div></div>';
  const rows=metrics.map(m=>'<tr><th>'+e(m.label)+'</th><td>'+m.confirmed_yes+'</td><td>'+m.confirmed_no+'</td><td>'+m.indication+'</td><td>'+m.unknown+'</td><td>'+e(pct(m.confirmed_yes,m.all))+'</td><td>'+e(pct(m.confirmed_yes,m.known))+'</td><td>'+e(pct(m.known,m.all))+'</td></tr>').join('');
  const schoolRows=d.schools.map(s=>{
    const yes=Object.values(s.axes).filter(v=>v.status==='confirmed_yes').length;
    return '<li><a href="schools/'+e(s.id)+'.html">'+e(s.name)+'</a> <span class="muted">'+e(s.schoolType)+' ／ 観察YES '+yes+'軸 ／ 個別の法的判断は未了</span></li>';
  }).join('');
  return page(city.name+'・自治体総合評価',
    '<nav class="crumb">全国PTA実態調査 / 自治体別報告書プレビュー</nav><header class="hero"><div class="eyebrow">'+e(city.prefecture)+' / '+e(d.asOf)+'時点</div>'+
    '<h1>'+e(city.name)+'｜公立学校PTA制度・運用調査</h1><p class="lede">保護者と子どもの権利・自由・尊厳を守ることを目的とし、資料で確認できた行為と、教育委員会・学校・PTAそれぞれの責任を検証します。</p>'+stats+'</header>'+
    section('1. 人権・尊厳を起点とする調査','<p>加入しない自由、役員を引き受けない自由、病気・妊娠・介護・家庭事情のプライバシー、非会員の子どもへの公平な取扱いを基本的な検証対象とします。</p>'+
      '<p>個別の人権侵害の事実認定は、学校別の資料と申出、反証を区別して行います。制度・行為の存在自体から直ちに法令違反を認定しません。</p>')+
    section('2. 自治体調査範囲・母集団','<p>'+e(d.scope.scopeNote||'調査範囲の説明未登録')+'</p><p class="note">母集団は公立学校数、集計対象は登録済み学校数です。抽出調査の場合、全市の有病率・違反率のように一般化できません。</p>')+
    section('3. 教育委員会の制度責任と学校の実施責任','<p>教育委員会の要綱・規程・通知の制定者と適用範囲、学校側の個別運用、PTAの内部事務を切り分けます。</p>'+
      '<p><strong>教育委員会の制度関与：</strong> '+(d.municipalDocuments?.length?'文書 '+d.municipalDocuments.length+'件を登録。各文書の具体的適用・権限の検証は別途必要。':'自治体資料の照合は未完了。制度が存在しないとの認定ではありません。')+'</p>')+
    section('4. 固定12軸・観察状態の集計','<div class="table-wrap"><table><thead><tr><th>評価軸</th><th>YES</th><th>NO</th><th>示唆</th><th>未確認</th><th>YES/対象校</th><th>YES/判定可能校</th><th>判定可能率</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      '<p class="note">YESは対象の記載・実施を資料で確認した意味です。YES/判定可能校は判定可能校がゼロの場合「算定不能」です。違法率でも全国推計値でもありません。</p>')+
    section('5. 学校別評価書へ進む','<ol class="list">'+schoolRows+'</ol>')+
    section('6. 法的検証と次の確認','<p>①学校・教育委員会とPTAの主体分離、②事務の帰属、③学校側の具体的な所掌事務・公法上の権限、④個人情報保護法61条・69条等、⑤法令の存在・適用・行為の適法性を区別した結論、の順番で検証します。</p>'+
      '<p>行政の内部規程、PTAからの委任、本人同意、職務専念義務免除は、それだけで新たな公法上の権限を創設するものとして扱いません。</p>'));
}
export function buildEvaluationPreview(d,axes,annotations={}){
  const {src}=verify(d,axes);
  const metrics=metric(d,axes);
  const files={'index.html':renderMunicipality(d,axes,annotations,metrics),'metrics.json':JSON.stringify({asOf:d.asOf,municipalityId:d.municipality.id,counts:metrics},null,2)+'\n'};
  for(const s of d.schools)files['schools/'+s.id+'.html']=renderSchool(d,s,axes,annotations,src);
  return files;
}
export function assertOutsideRepo(out){
  const target=path.resolve(out);
  if(target===ROOT||target.startsWith(ROOT+path.sep))throw Error('SITE_REPOSITORY_OUTPUT_FORBIDDEN: preview must stay outside the repository');
  return target;
}
const direct=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(direct){
  const [datasetPath,axesPath,outPath,annotationsPath]=process.argv.slice(2);
  if(!datasetPath||!axesPath||!outPath){
    console.error('Usage: node scripts/render-evaluation-preview.mjs <dataset.json> <evaluation-axes.json> <outside-repo-output-dir> [review-annotations.json]');
    process.exitCode=2;
  }else try{
    const dataset=JSON.parse(fs.readFileSync(datasetPath,'utf8'));
    const axes=JSON.parse(fs.readFileSync(axesPath,'utf8'));
    const annotations=annotationsPath?JSON.parse(fs.readFileSync(annotationsPath,'utf8')):{};
    const out=assertOutsideRepo(outPath);
    const files=buildEvaluationPreview(dataset,axes,annotations);
    for(const [name,body] of Object.entries(files)){
      const f=path.join(out,name);
      fs.mkdirSync(path.dirname(f),{recursive:true});
      fs.writeFileSync(f,body,'utf8');
    }
    console.log('Generated '+Object.keys(files).length+' files in '+out+' (NOT PUBLISHED)');
  }catch(err){console.error(err.message);process.exitCode=1;}
}
