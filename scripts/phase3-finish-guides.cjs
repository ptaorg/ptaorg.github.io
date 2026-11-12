#!/usr/bin/env node
// Phase 3 completion. Constrain changes to documented article notices,
// redundant section kickers, and new navigation alongside unchanged prose.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const skip=new Set(['.git','_site','node_modules','assets','css','data','js','scripts','tools','tests','docs','.github','partials','ai-system','source-candidates','pta-open-system','starter-kit']);
const config={
  "guide-board.html": [
    {
      "id": "guide-entry-board-title",
      "title": "学校の事務とPTAの事務",
      "points": [
        "PTA固有の内部事務と公立学校の業務を区別する。",
        "学校が実際に行う行為と、具体的な所掌事務・権限を確認する。",
        "情報を扱う前に、本人同意や委任とは別の公法上の根拠を点検する。"
      ],
      "links": [
        [
          "guide-entry-board-title",
          "学校側の関与"
        ],
        [
          "principal-liability-title",
          "校長の管理責任"
        ],
        [
          "board-executive-brief-title",
          "教育委員会が扱う範囲"
        ],
        [
          "board-jp-guideline-title",
          "分離資料（本文）"
        ]
      ]
    },
    {
      "id": "board-first-reading",
      "title": "所掌事務・施設・服務",
      "points": [
        "学校側が関与する理由と、学校教育法第137条の適用を分ける。",
        "教職員の通常業務、施設利用、学校徴収金の扱いを確認する。",
        "現場で実施されている行為の記録と根拠を対応させる。"
      ],
      "links": [
        [
          "board-first-reading",
          "学校関与を点検する理由"
        ],
        [
          "article137-school-use",
          "施設利用と学校教育法"
        ],
        [
          "workstyle-reform-boundary",
          "学校の業務と働き方改革"
        ],
        [
          "school-involvement-action-plan",
          "関与の実態調査"
        ],
        [
          "board-ed-resource-set",
          "通知・調査資料"
        ]
      ]
    },
    {
      "id": "municipal-voices",
      "title": "自治体の事例と現場点検",
      "points": [
        "自治体や学校の公表内容と、当委員会の評価を区別する。",
        "入会、情報、会費、教職員、施設の各行為を確認する。",
        "原資料を確認し、事実・未確認点・是正方針を分けて記録する。"
      ],
      "links": [
        [
          "municipal-voices",
          "自治体に寄せられた声"
        ],
        [
          "board-checklist",
          "学校が確認する5領域"
        ],
        [
          "board-response-policy",
          "教育委員会の対応"
        ],
        [
          "key-materials",
          "根拠法令・通知"
        ],
        [
          "sec-33",
          "自治体の是正事例"
        ]
      ]
    },
    {
      "id": "sec-34",
      "title": "公私分離の具体的論点",
      "points": [
        "PTA事務と学校業務を分け、教職員の服務を検討する。",
        "学校による情報利用・提供と、PTA自身の直接取得を分ける。",
        "覚書や委任が学校の権限を新たに作るものではないことを確認する。"
      ],
      "links": [
        [
          "sec-34",
          "学校とPTAの役割"
        ],
        [
          "sec-35",
          "渉外業務の範囲"
        ],
        [
          "sec-36",
          "入会と消費者契約"
        ],
        [
          "sec-37",
          "個人情報と利用目的"
        ],
        [
          "sec-38",
          "校長とPTAの覚書"
        ],
        [
          "sec-40",
          "学校による代行の根拠"
        ]
      ]
    },
    {
      "id": "sec-41",
      "title": "点検・停止・是正の順序",
      "points": [
        "教育委員会・校長が確認すべき事務の実態を整理する。",
        "根拠が確認できない運用の停止と是正を優先順位に沿って検討する。",
        "通知、担当部署、実施時期を明記した工程へ落とし込む。"
      ],
      "links": [
        [
          "sec-41",
          "13の点検項目"
        ],
        [
          "sec-42",
          "停止すべき慣行"
        ],
        [
          "sec-43",
          "是正措置の5段階"
        ],
        [
          "sec-44",
          "構造的な問題"
        ],
        [
          "sec-45",
          "年間の工程表"
        ]
      ]
    },
    {
      "id": "sec-46",
      "title": "通知文案・FAQと公開事例",
      "points": [
        "各学校へ通知するときに必要な論点を文書化する。",
        "想定される質問と資料の確認先を明らかにする。",
        "事例で確認した事実と、その後の是正対応を照合する。"
      ],
      "links": [
        [
          "sec-46",
          "学校長宛通知文案"
        ],
        [
          "sec-47",
          "教育委員会向けFAQ"
        ],
        [
          "sec-48",
          "静岡市の公表事例"
        ]
      ]
    }
  ],
  "guide-pta.html": [
    {
      "id": "sec-1",
      "title": "加入・運営の基本",
      "points": [
        "会員資格は学校への在籍ではなく、PTAへの加入関係として確認する。",
        "会則、申込記録、会費、会計の責任主体を明確にする。",
        "学校に代行してもらっている事務を洗い出す。"
      ],
      "links": [
        [
          "sec-1",
          "入会と会員管理"
        ],
        [
          "sec-2",
          "任意団体としての運営"
        ],
        [
          "guide-entry-pta-title",
          "運営点検"
        ],
        [
          "pta-first-check",
          "役員が守るべき原則"
        ]
      ]
    },
    {
      "id": "pta-school-use-article137",
      "title": "学校の施設・職員と分ける",
      "points": [
        "施設利用と職員のPTA事務は異なる論点として確認する。",
        "学校の所掌事務・権限とPTA側の業務分担を区別する。",
        "会員管理、情報取得、集金をPTA自身で担う方法を検討する。"
      ],
      "links": [
        [
          "pta-school-use-article137",
          "学校教育法と施設利用"
        ],
        [
          "pta-workstyle-reform",
          "学校の働き方改革"
        ],
        [
          "first-check",
          "役員が確認する6点"
        ],
        [
          "sec-8",
          "図解による確認（補助資料）"
        ]
      ]
    },
    {
      "id": "sec-9",
      "title": "運用を比較して見直す",
      "points": [
        "従来の実務と任意団体としての運営を項目ごとに比較する。",
        "加入案内や同意欄の表現が、実際の事務に合っているか確かめる。",
        "学校の情報・会計・職員の関与を分けて記録する。"
      ],
      "links": [
        [
          "sec-9",
          "運営の比較"
        ],
        [
          "sec-10",
          "加入案内の書き方"
        ]
      ]
    },
    {
      "id": "sec-11",
      "title": "役員選出と移行計画",
      "points": [
        "役員選出は本人の意思と規約に基づく手続として設計する。",
        "入会・会費・情報の運用を順序立てて見直す。",
        "活動の規模や負担に応じて運営の選択肢を検討する。"
      ],
      "links": [
        [
          "sec-11",
          "役員選出の見直し"
        ],
        [
          "roadmap",
          "適正化の手順"
        ],
        [
          "exit-design",
          "運営形態の選択"
        ]
      ]
    },
    {
      "id": "pdf-officer",
      "title": "付録資料・よくある質問",
      "points": [
        "資料の記載事項と、現在の会則・運用との一致を確かめる。",
        "疑問への回答は、団体自身の事務と学校の業務を分ける。",
        "確認できない運用は記録と根拠資料を追加で求める。"
      ],
      "links": [
        [
          "pdf-officer",
          "PDFと付録書式"
        ],
        [
          "sec-15",
          "PTA役員のFAQ"
        ]
      ]
    },
    {
      "id": "officer-checklist",
      "title": "就任時点検と行政回答",
      "points": [
        "会員管理・会計・情報の確認項目を漏れなく点検する。",
        "教育委員会の回答は回答日・原文・対象範囲を確認する。",
        "必要な是正を議事録・担当・期限に残す。"
      ],
      "links": [
        [
          "officer-checklist",
          "20項目チェック"
        ],
        [
          "sec-17",
          "教育委員会回答の確認"
        ]
      ]
    }
  ]
};
const noticeRX=/<div class="container">\s*(<p class="article-notice">[\s\S]*?本稿は当委員会による研究・検討資料です。[\s\S]*?<\/p>)\s*<\/div>\s*/;
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
function firstTag(html,id){
 const token='id="'+id+'"',at=html.indexOf(token);
 if(at<0||html.indexOf(token,at+1)!==-1)throw Error('Anchor missing/duplicated: '+id);
 const tagStart=html.lastIndexOf('<',at),tag=html.slice(tagStart,html.indexOf('>',at)+1);
 if(!/^<(h2|section|div)\b/.test(tag))throw Error('Anchor is not a safe heading/section: '+id+' '+tag);
 if(!tag.startsWith('<h2')){
  // A section's first nearby h2 is its heading; do not use unrelated anchors.
  const sample=html.slice(tagStart,tagStart+900);
  if(!/<h2\b/.test(sample))throw Error('No heading following anchor '+id);
 }
 return {at:tagStart,tag};
}
function chapterBlock(info,i){
 const lines=info.points.map(t=>'<li>'+esc(t)+'</li>').join('');
 const links=info.links.map(([id,title])=>'<li><a href="#'+id+'">'+esc(title)+'</a></li>').join('');
 return '<section class="phase3-chapter-intro" data-chapter="'+(i+1)+'" aria-label="第'+(i+1)+'章の要点"><p class="phase3-chapter-index">第'+(i+1)+'章 <strong>'+esc(info.title)+'</strong></p><ul class="phase3-chapter-points">'+lines+'</ul><nav aria-label="第'+(i+1)+'章の目次"><p>章内目次</p><ol>'+links+'</ol></nav></section>';
}
function guides(html,rel){
 const chapters=config[rel];if(!chapters)return html;
 if(html.includes('<!-- phase3-guide-map -->'))return html;
 for(const c of chapters){
  if(c.points.length!==3||c.links.length<2)throw Error('Chapter must have three-point summary and links '+rel+' '+c.id);
  firstTag(html,c.id);
  for(const [id] of c.links)firstTag(html,id);
 }
 const summaries=chapters.map((c,i)=>'<li><a href="#'+c.id+'"><span>第'+(i+1)+'章</span><strong>'+esc(c.title)+'</strong></a></li>').join('');
 const overview='<!-- phase3-guide-map --><nav class="phase3-guide-map" aria-label="ガイド全体の章立て"><h2>6章で確認する</h2><ol>'+summaries+'</ol></nav>';
 const open='<div class="article-main">';
 if(!html.includes(open))throw Error('Article body layout missing '+rel);
 html=html.replace(open,open+overview);
 // First chapter summary follows the overview; subsequent summaries precede their original sections/headings.
 html=html.replace(overview,overview+chapterBlock(chapters[0],0));
 for(let i=chapters.length-1;i>=1;i--){
  const c=chapters[i],at=firstTag(html,c.id).at;
  html=html.slice(0,at)+chapterBlock(c,i)+html.slice(at);
 }
 // A long heading's original full text remains at h2; only its repeated decorative labels are removed.
 html=html.replace(/<(p|div) class="(?:section-kicker|lead-kicker)(?: [^"]*)?">([\s\S]*?)<\/\1>\s*/g,(all,tag,body)=>{
  const plain=body.replace(/<[^>]+>/g,'').trim();
  return /(?:一次資料|当委員会の分析)/.test(plain)?all:'';
 });
 // Short labels for both desktop and mobile tables of contents; link/section IDs stay unchanged.
 const toc=(str)=>str.replace(/<a href="#([^"]+)">([\s\S]*?)<\/a>/g,(whole,id,inside)=>{
  if(!str.includes('class="toc-list"'))return whole;
  if(/<span class="toc-no">/.test(inside)){
   const m=inside.match(/<span(?: [^>]*)?>([^<>]+)<\/span>\s*$/);
   if(!m||[...m[1]].length<=36)return whole;
   const shortened=[...m[1]].slice(0,32).join('')+'…';
   return whole.replace(m[0],'<span title="'+esc(m[1])+'">'+shortened+'</span>');
  }
  const text=inside.replace(/<[^>]*>/g,'').trim();
  if([...text].length<=36)return whole;
  return '<a href="#'+id+'" title="'+esc(text)+'">'+esc([...text].slice(0,32).join('')+'…')+'</a>';
 });
 html=html.replace(/<ol class="toc-list">[\s\S]*?<\/ol>/g,toc);
 return html;
}
function notice(html){
 if(html.includes('data-phase3-notice="moved"'))return html;
 const found=html.match(noticeRX);if(!found)return html;
 const start=found.index;
 const firstMain=html.indexOf('<main'),lastMain=html.lastIndexOf('</main>');
 if(firstMain<0||lastMain<0||start<firstMain||start>lastMain)throw Error('Notice outside main');
 const removed=html.replace(noticeRX,'');
 const end=removed.lastIndexOf('</main>');
 const moved='<div class="container phase3-disclaimer" data-phase3-notice="moved">'+found[1]+'</div>\n';
 return removed.slice(0,end)+moved+removed.slice(end);
}
function transform(original,rel){
 let html=notice(original);
 html=guides(html,rel);
 if(original!==html&&!html.includes('phase3-guide-chapters.css')){
  const base='../'.repeat(rel.split('/').length-1);
  const link='<link rel="stylesheet" href="'+base+'css/phase3-guide-chapters.css?v=20261113-final">';
  html=html.replace('</head>',link+'\n</head>');
 }
 return html;
}
function walk(dir=root,out=[]){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name);
  if(e.isDirectory()){if(!skip.has(e.name))walk(p,out)}
  else if(e.isFile()&&e.name.endsWith('.html')&&e.name!=='404.html')out.push(p);
 }
 return out;
}
function main(){
 const check=process.argv.includes('--check'),changed=[],details={notices:0,labels:{},chapters:0,examined:0};
 for(const p of walk()){
  const rel=path.relative(root,p).split(path.sep).join('/'),original=fs.readFileSync(p,'utf8'),next=transform(original,rel);
  details.examined++;
  if(next===original)continue;
  changed.push(rel);
  if(next.includes('data-phase3-notice="moved"')&&!original.includes('data-phase3-notice="moved"'))details.notices++;
  if(config[rel]){details.chapters++;details.labels[rel]=(original.match(/class="(?:section-kicker|lead-kicker)(?: [^"]*)?"/g)||[]).length-(next.match(/class="(?:section-kicker|lead-kicker)(?: [^"]*)?"/g)||[]).length}
  if(!check)fs.writeFileSync(p,next,'utf8');
 }
 console.log('Phase 3 final:',JSON.stringify({...details,changed:changed.length,samples:changed.slice(0,16)}));
 if(check&&changed.length)throw Error('Phase 3 final HTML is stale; run node scripts/phase3-finish-guides.cjs');
}
if(require.main===module)main();
module.exports={transform,guides,notice,firstTag};
