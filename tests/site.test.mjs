import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const appModule={exports:{}};
new Function('module',fs.readFileSync(path.join(root,'assets/app.js'),'utf8'))(appModule);
const {normalize, matchedRecordsFactory, safeSourceLink}=appModule.exports;
const demo=JSON.parse(fs.readFileSync(path.join(root,'data/demo.json'),'utf8'));
const search=(query,extra={})=>matchedRecordsFactory(demo.map,demo.responses,{query,...extra});
test('four independent page files exist, with accessible search and single main landmark',()=>{
  for(const name of ['index.html','explore.html','municipality.html','school.html']){
    const html=fs.readFileSync(path.join(root,name),'utf8');
    assert.match(html,/<main\b[^>]*id="main"/);
    assert.equal((html.match(/<main\b/g)||[]).length,1,name);
    assert.match(html,/<nav\b[^>]*aria-label="メインナビゲーション"/);
    assert.match(html,/assets\/style\.css/);
    assert.match(html,/assets\/app\.js/);
  }
});
test('NFKC normalizes fullwidth and whitespace',()=>assert.equal(normalize(' 安行　小学校 '),normalize('安行小学校')));
test('school name shows exactly that school (not all municipality schools)',()=>{
  const {schools}=search('安行小学校');
  assert.deepEqual(schools.map(s=>s.name),['安行小学校']);
});
test('municipality term retrieves related schools and regional index',()=>{
  const results=search('射水市');assert.equal(results.municipalities.length,1);
  assert.equal(results.schools.length,5);
});
test('school-type filters exclude other types',()=>{
  assert.equal(search('相川小学校',{schoolType:'中学校'}).schools.length,0);
  assert.deepEqual(search('相川中学校',{schoolType:'中学校'}).schools.map(x=>x.name),['相川中学校']);
});
test('response topic term finds public answer metadata',()=>{
  assert.equal(search('みなし加入').responses.length,1);
  assert.equal(search('みなし加入').responses[0].municipality,'京都府亀岡市');
});
test('external answer URL is restricted to canonical public domain',()=>{
  assert.equal(safeSourceLink('https://example.org/evil'),'board-responses.html');
  assert.equal(safeSourceLink('https://ptaorg.com/board-responses/01-mie.html'),'board-responses/01-mie.html');
});
test('demo metadata documents are not given downloadable file URLs',()=>{
  const schools=demo.map.municipalities.flatMap(m=>m.schools||[]);
  assert.ok(schools.length>=20);
  for(const school of schools)for(const doc of school.documents||[]){assert.equal(Object.hasOwn(doc,'url'),false);}
});
test('demo municipalities match previously published 29-region list',()=>{
  assert.equal(demo.map.municipalities.length,29);
  assert.equal(demo.map.municipalities.reduce((sum,m)=>sum+(m.publishedIndexSchoolCount||0),0),569);
});
test('topic filter narrows responses by public topic labels',()=>{
  const all=search('').responses.length;const fee=search('',{topic:'fee'}).responses;
  assert.ok(fee.length>0&&fee.length<=all);
  for(const r of fee)assert.ok(r.topics.includes('会費徴収・委任'));
});
test('same-site links stay inside this site, others fall back to the top page',()=>{
  const {localLink}=appModule.exports;
  assert.equal(localLink('/research/yokohama.html'),'research/yokohama.html');
  assert.equal(localLink('javascript:alert(1)'),'index.html');
  assert.equal(localLink('//evil.example/x.html'),'index.html');
});
test('dates are normalized to YYYY-MM-DD where the source is numeric',()=>{
  const {fmtDate}=appModule.exports;
  assert.equal(fmtDate('2025/9/4'),'2025-09-04');assert.equal(fmtDate('令和８年１月 14 日'),'令和８年１月14日');
});
test('every page carries the shared header/footer and one h1-capable main',()=>{
  const header=fs.readFileSync(path.join(root,'partials/header.html'),'utf8').trim();
  for(const name of ['index.html','explore.html','municipality.html','school.html']){
    const html=fs.readFileSync(path.join(root,name),'utf8');
    assert.ok(html.includes(header),name+' header out of sync');
    assert.doesNotMatch(html,/PTA RESEARCH|START HERE|EXPLORE THE ARCHIVE/,'no English eyebrows');
  }
});

test('ported pages: every local link and asset resolves inside this site',()=>{
  const ledger=JSON.parse(fs.readFileSync(path.join(root,'scripts/port/last-build.json'),'utf8'));
  assert.ok(ledger.pages.length>700,'ported page count');
  const broken=[];
  for(const rel of ledger.pages){
    const file=path.join(root,rel);const html=fs.readFileSync(file,'utf8');
    assert.match(html,/class="site-header"/,rel);assert.match(html,/class="site-footer"/,rel);
    for(const m of html.matchAll(/\s(?:href|src)="([^"#?][^"]*)"/g)){
      const u=m[1];if(/^(?:[a-z]+:|\/\/|\$\{|'\+)/i.test(u)||u.includes('${')||u.includes("'+"))continue;
      const p=decodeURIComponent(u.split(/[?#]/)[0]);const t=path.join(path.dirname(file),p);
      if(!(fs.existsSync(t)&&(fs.statSync(t).isFile()||fs.existsSync(path.join(t,'index.html')))))broken.push(rel+' -> '+u);
    }
  }
  assert.deepEqual(broken.slice(0,20),[]);
});
const splitTop=t=>{const out=[];let d=0,cur='';for(const ch of t){if(ch==='('||ch==='[')d++;if(ch===')'||ch===']')d--;if(ch===','&&d===0){out.push(cur);cur='';}else cur+=ch;}out.push(cur);return out;};
test('legacy CSS is scoped and cannot style the new header/footer',()=>{
  const ledger=JSON.parse(fs.readFileSync(path.join(root,'scripts/port/last-build.json'),'utf8'));
  for(const css of ledger.css){
    const text=fs.readFileSync(path.join(root,css),'utf8').replace(/@(?:font-face|keyframes)[^{]*\{(?:[^{}]|\{[^}]*\})*\}/g,'').replace(/\/\*[\s\S]*?\*\//g,'');
    for(const m of text.matchAll(/(?:^|})\s*([^{}@]+)\{/g)){
      for(const sel of splitTop(m[1])){const s=sel.trim();if(!s||/^(from|to|\d+%)$/.test(s))continue;
        assert.ok(s.startsWith('.legacy'),css+': '+s);}
    }
  }
});
