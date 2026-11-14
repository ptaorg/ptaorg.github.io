import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const page='pta-evaluation-method.html';
const url='https://ptaorg.com/'+page;

test('published evaluation methodology is a standalone Japanese canonical page',()=>{
  const html=read(page);
  assert.match(html,/<!doctype html>/i);
  assert.match(html,/<html lang="ja">/);
  assert.ok(html.includes('<link rel="canonical" href="'+url+'">'));
  assert.match(html,/<h1>PTAの適正化は、/);
  assert.match(html,/人の自由と尊厳を守るための調査/);
  assert.match(html,/教育委員会の制度関与/);
  assert.match(html,/学校・校長の実施/);
  assert.match(html,/PTA自身の内部決定/);
  assert.match(html,/個人情報保護法61条・69条/);
  assert.match(html,/法令上の根拠と適用範囲を検証/);
  assert.equal((html.match(/<td class="m-no">/g)||[]).length,12);
  assert.equal((html.match(/class="method-section"/g)||[]).length,7);
  const steps=html.slice(html.indexOf('<ol class="method-steps">'),html.indexOf('</ol>',html.indexOf('<ol class="method-steps">')));
  assert.ok(steps.indexOf('主体の分離')<steps.indexOf('事務の帰属'));
  assert.ok(steps.indexOf('事務の帰属')<steps.indexOf('学校側の具体的な所掌事務・権限'));
  assert.ok(steps.indexOf('学校側の具体的な所掌事務・権限')<steps.indexOf('個人情報の利用・提供'));
  assert.match(html,/技術試験で生成した個別評価書は本ページから公開していません/);
  assert.doesNotMatch(html,/noindex,nofollow/);
});

test('published methodology is reachable from homepage, research search and sitemap',()=>{
  assert.ok(read('index.html').includes('href="'+page+'"'));
  assert.ok(read('explore.html').includes('href="'+page+'"'));
  assert.ok(read('sitemap.xml').includes('<loc>'+url+'</loc>'));
  assert.ok(read('robots.txt').includes('Sitemap: https://ptaorg.com/sitemap.xml'));
});

test('original private pilot data, unapproved source paths and personal info are not copied to the public article',()=>{
  const html=read(page);
  for(const term of [
    '全国資料/大崎市','18R8学校集金案内.pdf','19R8学校集金内訳通知用.pdf',
    '1w9VpwKJudWk7tv7iSX5sfQ309a0n5FCp','1BuFivhNsx32IO0cceeFGIOAGPEDDEqDe',
    'tajiri-collection-r8','"containsPersonalData"'
  ])assert.equal(html.includes(term),false,'unexpected leaked source: '+term);
  assert.match(html,/確認済み事実、解釈、反証、未確認事項/);
});

test('published article has shared site chrome and accessible evidence table',()=>{
  const html=read(page);
  for(const expected of ['class="site-header"','class="site-footer"','class="skip-link"','id="main"','aria-label="固定12評価軸の一覧"','tabindex="0"']){
    assert.ok(html.includes(expected),expected);
  }
});
