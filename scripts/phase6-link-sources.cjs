#!/usr/bin/env node
// Phase 6A: cite only legally identified and independently verified official sources.
// Existing article language, reproduced evidence, URLs, images and heading text remain byte-identical.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const TARGETS=[
  "guide-board.html",
  "guide-pta.html",
  "guideline.html",
  "framework.html",
  "pta-school-processing.html",
  "journal/pta-legal-structure-education-administration.html",
  "journal/matsuyama-pta-fee-unification-20261013.html",
  "journal/shiga-pta-audit-circular-reasoning-20261013.html",
  "journal/ichinomiya-pta-settlements-20261108.html",
  "membership.html",
  "privacy.html",
  "fee-collection.html",
  "personnel.html",
  "facilities.html"
];
const SOURCES=[
  {
    "key": "school",
    "name": "学校教育法",
    "number": "昭和22年法律第26号",
    "date": "1947-03-31",
    "url": "https://laws.e-gov.go.jp/law/322AC0000000026",
    "pattern": "学校教育法"
  },
  {
    "key": "local",
    "name": "地方自治法",
    "number": "昭和22年法律第67号",
    "date": "1947-04-17",
    "url": "https://laws.e-gov.go.jp/law/322AC0000000067",
    "pattern": "地方自治法"
  },
  {
    "key": "staff",
    "name": "地方公務員法",
    "number": "昭和25年法律第261号",
    "date": "1950年公布",
    "url": "https://laws.e-gov.go.jp/law/325AC0000000261",
    "pattern": "(?:地方公務員法|地公法)"
  },
  {
    "key": "privacy",
    "name": "個人情報の保護に関する法律",
    "number": "平成15年法律第57号",
    "date": "2003-05-30",
    "url": "https://laws.e-gov.go.jp/law/415AC0000000057",
    "pattern": "(?:個人情報の保護に関する法律|個人情報保護法|個情法)"
  },
  {
    "key": "social",
    "name": "社会教育法",
    "number": "昭和24年法律第207号",
    "date": "1949-06-10",
    "url": "https://laws.e-gov.go.jp/law/324AC0000000207",
    "pattern": "社会教育法"
  },
  {
    "key": "civil",
    "name": "民法",
    "number": "明治29年法律第89号",
    "date": "1896-04-27",
    "url": "https://laws.e-gov.go.jp/law/129AC0000000089",
    "pattern": "民法"
  },
  {
    "key": "consumer",
    "name": "消費者契約法",
    "number": "平成12年法律第61号",
    "date": "2000-05-12",
    "url": "https://laws.e-gov.go.jp/law/412AC0000000061",
    "pattern": "消費者契約法"
  },
  {
    "key": "finance",
    "name": "地方財政法",
    "number": "昭和23年法律第109号",
    "date": "1948-07-07",
    "url": "https://laws.e-gov.go.jp/law/323AC0000000109",
    "pattern": "地方財政法"
  },
  {
    "key": "constitution",
    "name": "日本国憲法",
    "number": "昭和21年憲法",
    "date": "1946-11-03",
    "url": "https://laws.e-gov.go.jp/law/321CONSTITUTION",
    "pattern": "(?:日本国憲法|憲法)"
  },
  {
    "key": "ppc",
    "name": "公立学校とPTAの間で個人情報のやり取りをするためのポイント",
    "number": "令和8年3月公表",
    "date": "2026-03",
    "agency": "個人情報保護委員会",
    "url": "https://www.ppc.go.jp/files/pdf/202603_school_pta_pd_point.pdf",
    "pattern": "(?:公立学校と(?:ＰＴＡ|PTA)の間で個人情報のやり[取と]りをするためのポイント|個人情報保護委員会が2026年3月に公表した)"
  },
  {
    "key": "mext",
    "name": "学校徴収金の公会計化等の取組の一層の推進について（通知）",
    "number": "7初財務第3号",
    "date": "2025-04-30",
    "agency": "文部科学省",
    "url": "https://www.mext.go.jp/content/20250616-mxt_zaimu-100002245_2.pdf",
    "pattern": "学校徴収金の公会計化等の取組の一層の推進について"
  }
];
const patterns=new Map(SOURCES.map(s=>[s.key,new RegExp(s.pattern+(s.key==='ppc'||s.key==='mext'?'':'\\s*第[一二三四五六七八九十百千万〇零\\d０-９]+条(?:の[一二三四五六七八九十\\d０-９]+)?'),"gu")]));
const q=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const ignored=/(?:^|[\s_-])(?:quote|quotation|verbatim|transcript|original|reprint|email|mail|reply|source-quote|official-text|document-body|raw-text|quoted-text)(?:$|[\s_-])/i;
const forbiddenTags=new Set(['blockquote','pre','code','script','style','textarea','q','cite']);
const voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
function candidates(src){
 // A small structural scan. Skip script bodies entirely, so inline HTML literals in JavaScript are not mistaken for document content.
 const out=[],stack=[];const tags=/<\/?([a-z][\w:-]*)\b[^>]*>/gi;let m;
 while((m=tags.exec(src))){
  const tag=m[1].toLowerCase(),raw=m[0],closing=raw.startsWith('</');
  if(closing){const i=stack.map(x=>x.tag).lastIndexOf(tag);if(i>=0)stack.splice(i);continue}
  const a=(raw.match(/\bclass="([^"]*)"/)||[])[1]||'';
  const protective=forbiddenTags.has(tag)||ignored.test(a)||/\b(?:data-reprint|data-original|data-transcript)\b/.test(raw);
  if(tag==='p' || tag==='li'){
   if(!stack.some(x=>x.protective)&&!protective){
    const endTag='</'+tag+'>',end=src.indexOf(endTag,tags.lastIndex);
    if(end>=0){
     const content=src.slice(tags.lastIndex,end);
     if(tag==='p'||!/<li\b/i.test(content))out.push({tag,start:m.index,openEnd:tags.lastIndex,end,closeEnd:end+endTag.length,body:content});
    }
   }
  }
  if(tag==='script'||tag==='style'){const closingTag='</'+tag+'>';const end=src.toLowerCase().indexOf(closingTag,tags.lastIndex);if(end>=0){tags.lastIndex=end+closingTag.length;continue}}
  if(!voidTags.has(tag)&&!raw.endsWith('/>'))stack.push({tag,protective});
 }
 return out;
}
function sourceInParagraph(body){
 const stripped=body.replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|thinsp);/g,' ');
 const found=[];
 for(const source of SOURCES){const re=patterns.get(source.key);re.lastIndex=0;if(re.test(stripped))found.push(source);}
 // Existing direct links within the paragraph already establish the source.
 return found.filter(s=>!body.includes('href="'+s.url+'"'));
}
function citations(src,base){
 if(src.includes('<!-- phase6-sources -->'))return {html:src,count:0,used:[]};
 const articleStart=src.indexOf('<div class="article-main">'),mainEnd=src.lastIndexOf('</main>');
 if(articleStart<0||mainEnd<=articleStart)throw Error('Article container not found: '+base);
 const section=src.slice(articleStart,mainEnd),paragraphs=candidates(section),used=new Map();
 const changes=[];
 for(const p of paragraphs){
  const sources=sourceInParagraph(p.body);
  if(!sources.length)continue;
  // Do not add notes to navigation, link descriptions or reproduced text.
  const near=p.body.replace(/<[^>]*>/g,' ').trim();
  if(near.length>2500||/<(?:blockquote|pre|code|script|style|textarea)\b/i.test(p.body))continue;
  for(const source of sources)if(!used.has(source.key))used.set(source.key,source);
  const tags=sources.map(s=>'<sup class="phase6-ref"><a href="#phase6-source-'+s.key+'" aria-label="'+q(s.name)+'の出典へ">注__'+s.key+'__</a></sup>').join('');
  // Add after a paragraph or list item's original text, without modifying even a single original character.
  changes.push({at:articleStart+p.end,html:' '+tags,count:sources.length});
 }
 if(!changes.length)return {html:src,count:0,used:[]};
 let updated=src;
 for(const c of changes.slice().sort((a,b)=>b.at-a.at)){updated=updated.slice(0,c.at)+c.html+updated.slice(c.at)}
 const ordered=SOURCES.filter(s=>used.has(s.key));
 ordered.forEach((s,i)=>updated=updated.replaceAll('注__'+s.key+'__','注'+(i+1)));
 const refList=ordered.map(s=>{
  const agency=s.agency||'国（法令原文：e-Gov法令検索）',issued=s.date.includes('年')?s.date:s.date;
  return '<li id="phase6-source-'+s.key+'"><strong>'+q(s.name)+'</strong> <span class="phase6-source-meta">発行・掲載：'+q(agency)+'／日付：'+q(issued)+'／資料番号：'+q(s.number)+'／最終確認：2026-11-13</span> <a href="'+s.url+'" target="_blank" rel="noopener noreferrer">公式原文（'+q(s.agency||'e-Gov')+'）</a></li>';
 }).join('\n');
 const block='\n<!-- phase6-sources --><section class="container phase6-sources" id="phase6-sources" aria-label="出典（法令・行政資料）"><h2>出典（法令・行政資料）</h2><p>本文中の注記から参照する公式資料です。法令は現行法令のページを示しています。条文を引用した箇所と、その解釈・評価は区別してお読みください。</p><ol>'+refList+'</ol></section>\n';
 const anchor=updated.indexOf('<div class="container phase3-disclaimer"',articleStart);
 const insertion=anchor>=0&&anchor<updated.lastIndexOf('</main>')?anchor:updated.lastIndexOf('</main>');
 updated=updated.slice(0,insertion)+block+updated.slice(insertion);
 const basePath='../'.repeat(base.split('/').length-1);
 const css='<link rel="stylesheet" href="'+basePath+'css/phase6-sources.css?v=20261113-phase6a">';
 if(!updated.includes('css/phase6-sources.css'))updated=updated.replace('</head>',css+'\n</head>');
 return {html:updated,count:changes.reduce((a,c)=>a+c.count,0),used:ordered.map(x=>x.key),paragraphs:changes.length};
}
function main(){
 const check=process.argv.includes('--check'),report=[];
 for(const rel of TARGETS){
  const file=path.join(root,rel),old=fs.readFileSync(file,'utf8'),r=citations(old,rel);
  report.push({file:rel,sourceRefs:r.count,paragraphs:r.paragraphs||0,sources:r.used,changed:r.html!==old});
  if(!check&&r.html!==old)fs.writeFileSync(file,r.html);
 }
 console.log('Phase 6A verified source links:',JSON.stringify(report));
 if(check&&report.some(x=>x.changed))throw Error('Phase 6A source notes stale: '+report.filter(x=>x.changed).map(x=>x.file).join(','));
}
if(require.main===module)main();
module.exports={TARGETS,SOURCES,citations,candidates,patterns};
