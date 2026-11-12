#!/usr/bin/env node
// Render homepage statistics and recent articles from canonical publication datasets.
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const get=name=>JSON.parse(fs.readFileSync(path.join(root,'data',name),'utf8'));
const map=get('research-map-index.json'),responses=get('board-responses.json'),journal=get('journal-index.json');
const counts=[map.municipalities.length,new Set(map.municipalities.flatMap(m=>(m.schools||[]).map(s=>s.url)).filter(Boolean)).size,responses.responses.length,journal.articles.length];
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const statNames=['自治体・地域別の調査索引','学校別資料の登録目録','教育委員会の公開回答','論考・分析の登録'];
const units=['地域','校','件','本'];
const statHTML='<dl class="home-source-stats">\n'+statNames.map((label,i)=>'<div><dt>'+label+'</dt><dd><strong>'+counts[i]+'</strong><span>'+units[i]+'</span></dd></div>').join('\n')+'\n</dl><p class="home-source-note">2026年11月13日確認時点の公開索引の登録数。学校別目録には原本未掲載のページを含み、原本を閲覧できる件数ではありません。</p>';
const newest=[...journal.articles].sort((a,b)=>(b.modified||b.published||'').localeCompare(a.modified||a.published||'')).slice(0,3);
const newsHTML=newest.map(a=>{
 const date=a.modified||a.published,href=String(a.url||'').replace(/^https:\/\/ptaorg\.com\//,'');
 if(!/^journal\/[\w./-]+\.html$/.test(href))throw Error('Unexpected journal URL: '+href);
 const kind=(a.published&&a.modified&&a.modified>a.published)?'更新':'新規公開';
 return '<li><div class="update-meta"><span class="label label-analysis">当委員会の論考</span><span class="update-kind">'+kind+'</span><time datetime="'+date+'">'+date+'</time></div><h3><a href="'+esc(href)+'">'+esc(a.title)+'</a></h3>'+(a.description?'<p>'+esc(a.description)+'</p>':'')+'</li>';
}).join('\n');
const file=path.join(root,'index.html'),original=fs.readFileSync(file,'utf8');
let html=original;
for(const [key,value] of [['stats',statHTML],['news',newsHTML]]){
 const start='<!-- phase2:'+key+':start -->',end='<!-- phase2:'+key+':end -->',a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 if(a<0||b<0)throw Error('Missing digest marker '+key);
 html=html.slice(0,a+start.length)+'\n'+value+'\n'+html.slice(b);
}
if(process.argv.includes('--check')){if(html!==original)throw Error('Home digest is out of date; run node scripts/render-home-digest.mjs');console.log('Home digest current: '+counts.join('/'));}
else{if(html!==original)fs.writeFileSync(file,html);console.log('Home digest regenerated: '+counts.join('/'));}
