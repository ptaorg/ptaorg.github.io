#!/usr/bin/env node
// Scope-limited content sync: leave the existing site chrome, CSS, images, PDF links,
// map and anchor IDs untouched. The old generic generator uses deprecated chrome.
const fs=require('node:fs');
const path=require('node:path');
const { ROOT, writeFileIfChanged, escapeHtml }=require('./archive-utils');
const intake=JSON.parse(fs.readFileSync(path.join(ROOT,'ai-system/report-standards/pilots/atsugi-36-school-intake-2026.json'),'utf8'));
const verified=intake.schoolRecords.filter(r=>r.originalPdfVerification?.status==='direct_checked');
if(verified.length!==15||new Set(verified.map(x=>x.schoolId)).size!==15)throw Error('Expected exactly 15 distinct reviewed schools');
const coverage=JSON.parse(fs.readFileSync(path.join(ROOT,'ai-system/report-standards/pilots/atsugi-evidence-coverage-matrix-2026.json'),'utf8'));
const supplemental=coverage.schools.filter(s=>s.currentSchoolPdfReview).map(s=>({schoolId:s.id}));
const finalAudit=JSON.parse(fs.readFileSync(path.join(ROOT,'ai-system/report-standards/pilots/atsugi-36-school-final-followup-20261116.json'),'utf8'));
const finalBySchool=new Map(finalAudit.schools.map(s=>[s.id,s]));
const followup=coverage.schools.filter(s=>s.followupEvidence).map(s=>({schoolId:s.id}));
const esc=escapeHtml;
function section(html,id,markup){
 const re=new RegExp('(<section class="archive-section(?: [^"]*)?">\\s*<h2 id="'+id+'">[^<]*<\\/h2>)[\\s\\S]*?(<\\/section>)');
 let count=0;html=html.replace(re,(_all,head,foot)=>{count++;return head+'\n'+markup+'\n'+foot});
 if(count!==1)throw Error('Cannot replace exactly one section '+id);
 return html;
}
const tags=items=>'<p>'+[...new Set(items||[])].map(s=>'<span class="archive-tag">'+esc(s)+'</span>').join(' ')+'</p>';
const listing=items=>'<ul class="archive-check-list">'+(items||[]).map(s=>'<li>'+esc(s)+'</li>').join('\n')+'</ul>';
const prose=items=>(items||[]).map(s=>'<p>'+esc(s)+'</p>').join('\n');
function pdfSources(documents){
 return '<ul class="archive-check-list">'+documents.map(doc=>'<li><a href="'+esc(doc.url+(doc.locationPage?'#page='+doc.locationPage:''))+'">'+esc(doc.title)+'</a> <span>（'+esc(doc.date)+'）</span><p>'+esc(doc.finding)+'</p></li>').join('\n')+'</ul>';
}
function croppedImages(documents){
 return documents.flatMap(doc=>doc.crops.map(crop=>
  '<figure><a href="'+esc('../../..'+crop.image)+'"><img src="'+esc('../../..'+crop.image)+'" alt="'+esc(crop.caption)+'" width="'+crop.width+'" height="'+crop.height+'" loading="lazy" style="max-width:100%;height:auto"></a>'+
  '<figcaption>'+esc(crop.caption)+'。'+esc(doc.title)+'、PDF '+crop.page+'頁。<a href="'+esc(doc.url+(doc.locationPage?'#page='+crop.page:''))+'">原本</a></figcaption></figure>'
 )).join('\n');
}
function auditIntro(html, audit, immediateImages){
 const summary='<div class="archive-assessment-note" id="atsugi-final-audit"><p><strong>確認できたこと</strong> '+esc(audit.finding)+'</p>'+
  '<p><strong>評価</strong> '+esc(audit.assessment)+'</p><p><strong>次に確認する資料</strong> '+esc(audit.request)+'</p>'+
  '<p><a href="#sec-5">証拠箇所</a> ／ <a href="#sec-9">詳しい評価</a></p></div>';
 html=html.replace(/\n<div class="archive-assessment-note" id="atsugi-final-audit">[\s\S]*?<\/div>/,'');
 html=html.replace(/\s*(<section class="archive-section">\s*<h2 id="sec-1">)/,(_match,sectionStart)=>'\n'+summary+'\n'+sectionStart);
 if(immediateImages){
  const evidence=/<section class="archive-section(?: [^"]*)?">\s*<h2 id="sec-5">[^<]*<\/h2>[\s\S]*?<\/section>/;
  const match=html.match(evidence);
  if(!match)throw Error('Missing evidence section '+audit.id);
  html=html.replace(evidence,'').replace(summary,()=>summary+'\n'+match[0]).replace(/\n{3,}/g,'\n\n');
 }
 return html;
}
const check=process.argv.includes('--check');
let changed=0;
for(const record of [...verified,...supplemental,...followup]){
 const slug=record.schoolId;
 const data=JSON.parse(fs.readFileSync(path.join(ROOT,'data','schools','atsugi',slug+'.json'),'utf8'));
 const audit=finalBySchool.get(slug);
 if(!audit)throw Error('Missing final audit '+slug);
 const focused=Boolean(audit.documents.length);
 if(data.slug!==slug||data.municipality!=='厚木市'||data.humanReviewRequired!==true)throw Error('Unreviewed/invalid record '+slug);
 const target=path.join(ROOT,'archive','atsugi',slug,'index.html');
 if(!fs.existsSync(target))throw Error('Missing original HTML '+target);
 const old=fs.readFileSync(target,'utf8');
 if(!old.includes('<h2 id="sec-9">当委員会の評価</h2>'))throw Error('Unexpected page template '+slug);
 let html=old;
 const desc=esc(data.ogDescription||data.description||'');
 const descRe=/(<meta name="description" content=")[^"]*(")/;
 const ogRe=/(<meta property="og:description" content=")[^"]*(")/;
 if(!descRe.test(html)||!ogRe.test(html))throw Error('Missing metadata '+slug);
 html=html.replace(descRe,(_m,a,b)=>a+desc+b).replace(ogRe,(_m,a,b)=>a+desc+b);
 if(!html.includes('name="twitter:card"'))html=html.replace('</head>','  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="'+esc(data.schoolName+' PTA関連資料・評価')+'">\n  <meta name="twitter:description" content="'+desc+'">\n</head>');
 if(data.officialPdfReview||focused)html=html.replace(/(<meta name="twitter:description" content=")[^"]*(")/,(_m,a,b)=>a+desc+b);
 html=html.replace(/"dateModified": "2026-07-19"/g,'"dateModified": "'+esc(data.lastReviewed)+'"');
 const originalLd=old.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
 if(originalLd){
  const oldDescription=originalLd.match(/"description": "([^"]*)"/)?.[1];
  if(oldDescription){const begin=html.indexOf('<script type="application/ld+json">'),end=html.indexOf('</script>',begin);if(begin>=0&&end>begin){let segment=html.slice(begin,end);segment=segment.replaceAll('"description": "'+oldDescription+'"','"description": '+JSON.stringify(data.ogDescription||data.description||''));html=html.slice(0,begin)+segment+html.slice(end);}}
 }
 html=html.replace(/data-reviewed="[^"]*"/,'data-reviewed="'+esc(data.lastReviewed)+'"');
 html=html.replace(/改訂 2026-07-19/,'改訂 '+esc(data.lastReviewed));
 const docs=[...new Set((data.materials?.confirmedDocuments||[]).filter(Boolean))].join('、')||'未確認';
 const form=esc(data.materials?.applicationFormStatus||data.materials?.hasApplicationForm||'未確認');
 const countSources=(old.match(/class="archive-existing-pdf"/g)||[]).length;
 const grid='<div class="archive-grid">'+
 '<div class="archive-box"><div class="archive-label">自治体</div><div class="archive-value">厚木市</div></div>'+
 '<div class="archive-box"><div class="archive-label">学校区分</div><div class="archive-value">'+esc(data.schoolType)+'</div></div>'+
 '<div class="archive-box archive-status-card '+esc(data.statusClass)+'"><div class="archive-label">評価状況</div><div class="archive-value">'+esc(data.status)+'</div></div>'+
 '<div class="archive-box"><div class="archive-label">確認資料</div><div class="archive-value">'+esc(docs)+'</div></div>'+
 '<div class="archive-box"><div class="archive-label">入会申込書</div><div class="archive-value">'+form+'</div></div>'+
 '<div class="archive-box"><div class="archive-label">PDF</div><div class="archive-value">'+(focused?'照合した登録・補足PDF '+audit.documents.length+'件':'元PDF '+(data.officialPdfReview?.documents.length??countSources)+'件')+'</div></div></div>';
 html=section(html,'sec-1',grid);
 html=section(html,'sec-3','<div class="archive-evidence-grid"><div class="archive-evidence-card"><div class="archive-label">確認対象</div><div class="archive-value">神奈川県厚木市 '+esc(data.schoolName)+'</div></div><div class="archive-evidence-card"><div class="archive-label">最終確認日</div><div class="archive-value">'+esc(data.lastReviewed)+'</div></div><div class="archive-evidence-card"><div class="archive-label">人による確認</div><div class="archive-value">追加確認が必要</div></div></div><p>原本の文言は照合済みですが、学校での実施・制度の適法性・是正状況を確定したものではありません。</p>');
 html=section(html,'sec-4','<div class="archive-assessment-note"><p>学校がPTA固有事務を担うには、公法上の具体的な事務権限を独立に検討する必要があります。PTAからの委任や保護者の同意は、それだけで学校の権限を創設しません。</p><p>資料に記載された制度、実際に行われた行為、まだ確認できない点、改善を評価すべき点を分けています。個人情報保護法61条・69条の審査は学校の事務権限を確認した後に行います。</p></div>');
 html=section(html,'sec-6',listing(data.confirmedFacts));
 html=section(html,'sec-7',listing(data.unconfirmedPoints));
 html=section(html,'sec-8',tags(data.riskFlags));
 html=section(html,'sec-9',prose(data.evaluation));
 if(data.officialPdfReview){
  const {finding,documents}=data.officialPdfReview;
  html=html.replace(/(<div class="archive-print-actions archive-print-top">[\s\S]*?<\/div>\s*)<p>[^<]*<\/p>/,
   (_match,lead)=>lead+'<p>'+esc(finding)+'</p>');
  html=section(html,'sec-2',pdfSources(documents));
  html=section(html,'sec-5',croppedImages(documents));
  html=html.replace(/(<dt>評価状況<\/dt><dd>)[^<]*(<\/dd><dt>確認資料<\/dt><dd>)[^<]*(<\/dd><dt>入会申込書<\/dt><dd>[^<]*<\/dd><dt>PDF<\/dt><dd>)[^<]*(<\/dd>)/,
   (_match,a,b,c,d)=>a+esc(data.status)+b+esc(docs)+c+'公式原本 '+documents.length+'件'+d);
 }
 if(focused){
  html=html.replace(/(<div class="archive-print-actions archive-print-top">[\s\S]*?<\/div>\s*)<p>[^<]*<\/p>/,
   (_match,lead)=>lead+'<p>市の登録簿と学校別の補足資料を照合しました。規約・加入・会費等の現行運用書類は未取得です。</p>');
  html=section(html,'sec-2',pdfSources(audit.documents)+(audit.archived?'<p><a href="'+esc(audit.archived.url)+'">旧PTAページ（公開アーカイブ）</a> '+esc(audit.archived.finding)+'</p>':''));
  html=section(html,'sec-5',croppedImages(audit.documents));
  html=html.replace(/(<dt>評価状況<\/dt><dd>)[^<]*(<\/dd><dt>確認資料<\/dt><dd>)[^<]*(<\/dd><dt>入会申込書<\/dt><dd>[^<]*<\/dd><dt>PDF<\/dt><dd>)[^<]*(<\/dd>)/,
   (_match,a,b,c,d)=>a+esc(data.status)+b+esc(docs)+c+'登録・補足原本 '+audit.documents.length+'件'+d);
 }
 html=auditIntro(html,audit,focused||Boolean(data.officialPdfReview?.documents.some(doc=>doc.crops.length)));
 // Preserve all original section anchors, source-image links, PDF links, map, nav and footer.
 const links=x=>[...x.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]).filter(v=>v.includes('/source-pdfs/atsugi/')||v.includes('/assets/archive/atsugi/'));
 const originalLinks=links(old),newLinks=links(html);
 const originalEvidence=link=>!(/\/assets\/archive\/atsugi\/(?:review|final-audit)-20261116\//.test(link));
 if(originalLinks.filter(originalEvidence).join('\n')!==newLinks.filter(originalEvidence).join('\n'))throw Error('Original evidence links modified '+slug);
 for(let i=1;i<=10;i++)if(!html.includes('id="sec-'+i+'"'))throw Error('Section anchor lost '+slug+':'+i);
 if(!html.includes('twitter:card')||!html.includes('og:image')||!html.includes('追加確認が必要'))throw Error('Metadata or reviewer status lost '+slug);
 if(html!==old){changed++;if(!check)writeFileIfChanged(target,html);}
}
console.log(JSON.stringify({municipality:'厚木市',reviewed:verified.length,supplemental:supplemental.length,changed,unreviewed:coverage.schools.length-verified.length-supplemental.length,mode:check?'check':'draft-write'}));
if(check&&changed)process.exitCode=2;
