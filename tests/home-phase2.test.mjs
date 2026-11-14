import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
test('approved home visual sequence is intact and source content remains',()=>{
 const html=read('index.html'),main=html.split('data-home-phase="2"')[1]?.split('</main>')[0]||'';
 assert.ok(main.length>5000,'home content missing');
 assert.equal((main.match(/<h1\b/g)||[]).length,1);
 for(const id of ['hero-search-shell','home-resource-nav','home-feature-layout','home-issues','id="map"','home-updates','home-boundary','home-practical','id="roles"'])assert.ok(main.includes(id),id);
 const order=['hero-search-shell','home-resource-nav','home-feature-layout','home-issues','id="map"','home-updates','home-boundary','home-practical'];
 for(let i=1;i<order.length;i++)assert.ok(main.indexOf(order[i-1])<main.indexOf(order[i]),order[i]);
 assert.equal((main.match(/class="home-search"/g)||[]).length,1,'one global homepage search');
 assert.equal((main.match(/class="[^"]*\bhome-resource-nav\b[^"]*"/g)||[]).length,1,'one five-way resource entrance');
 assert.equal((main.match(/class="[^"]*\bhome-feature-layout\b[^"]*"/g)||[]).length,1);
 assert.doesNotMatch(main,/読み込み中…|data-journal-list|data-region-list|data-stat="/);
});
test('approved layout applies to all primary page families',()=>{
 const css=read('assets/style.css');
 assert.ok(css.includes('/* Approved archive design restoration | 2026-11-14 | shared across all pages */'));
 for(const selector of ['body[data-page="home"] .hero-search-shell','body[data-page="home"] .home-resource-nav','body[data-page="home"] .home-issues .hc-issue-list','body[data-page="explore"] .archive-filter-rail','body[data-page="municipality"] .stat-tiles','body[data-page="school"] .page-hero','body[data-page="legacy"] .article-layout'])assert.ok(css.includes(selector),selector);
 for(const page of ['index.html','explore.html','municipality.html','school.html','about.html','journal.html','membership.html'])assert.ok(read(page).includes('assets/style.css'),page);
 const explorer=read('explore.html');
 assert.ok(explorer.indexOf('archive-filter-rail')>explorer.indexOf('explore-grid'));
 assert.ok(explorer.includes('data-explore-map'),'map remains visible');
});
test('statistics and latest essays render statically from the source datasets',()=>{
 const m=JSON.parse(read('data/research-map-index.json')).municipalities;
 const r=JSON.parse(read('data/board-responses.json')).responses;
 const j=JSON.parse(read('data/journal-index.json')).articles;
 const expected=[m.length,new Set(m.flatMap(x=>(x.schools||[]).map(s=>s.url)).filter(Boolean)).size,r.length,j.length];
 assert.deepEqual([...read('index.html').matchAll(/<dd><strong>(\d+)<\/strong>/g)].map(x=>Number(x[1])),expected);
 const titles=[...j].sort((a,b)=>(b.modified||b.published||'').localeCompare(a.modified||a.published||'')).slice(0,3);
 for(const item of titles)assert.ok(read('index.html').includes(item.title.replaceAll('&','&amp;')),item.title);
});
test('migrated explanations and past entries remain in existing research/about/journal pages',()=>{
 const research=read('research-index.html'),about=read('about.html'),journal=read('journal.html'),home=read('index.html');
 for(const s of ['PTA内部事務を、学校はどこまで処理できるのか','原文・原資料を確認する','PTAは、なぜこうなったのか','調査・資料'])assert.ok(research.includes(s),s);
 for(const s of ['立場が違っても、確認する基準は同じです','PTA問題の根源は、学校とPTAの境界'])assert.ok(about.includes(s),s);
 for(const s of ['掲載済みの更新記録','2026.09.10'])assert.ok(journal.includes(s),s);
 for(const s of ['PTA加入はなぜ「オプトイン」なのか','id="school-pta-boundary"','id="membership-in-practice"'])assert.ok(home.includes(s),s);
});
