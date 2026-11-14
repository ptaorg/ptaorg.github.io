import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const page=read('support.html'),css=read('css/pages/support-donation.css');
const main=page.slice(page.indexOf('<main id="main"'),page.indexOf('</main>')+7);
const paypay='https://qr.paypay.ne.jp/p2p01_fwdAWb93QZWdQp8j';

test('support layout is a real donor letter and payment sidebar',()=>{
  assert.match(main,/class="support-columns"/);
  assert.match(main,/class="support-letter"/);
  assert.match(main,/<aside class="support-donate-side"/);
  assert.ok(main.indexOf('class="support-letter"') < main.indexOf('class="support-donate-side"'));
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(320px,360px\)/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.ok(page.includes('css/pages/support-donation.css?v=20261114a'));
  assert.equal((page.match(/<h1\b/g)||[]).length,1);
});
test('preserves real payment destinations and existing source material',()=>{
  assert.equal(page.split(paypay).length-1,2);
  for(const id of ['support-payment','support-payment-title','bank-transfer','sec-2','sec-3','sec-4','sec-5','sec-6','sec-7']){
    assert.ok(page.includes('id="'+id+'"'),id);
  }
  for(const title of ['なぜ支援が必要なのか','これまでの主な成果','主な使途','サポーター制度（月額支援）','活動報告と透明性の約束','活動の内容を確認する']){
    assert.ok(main.includes(title),title);
  }
  assert.ok(main.includes('名義：サトウ ダイ'));
  assert.ok(main.includes('info@ptaorg.com'));
  assert.ok(main.includes('このサイト内では金額入力や決済は行いません'));
});
test('support page no longer loads incompatible legacy prose and duplicate page styles',()=>{
  const links=[...page.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]);
  assert.ok(links.some(x=>x.startsWith('assets/style.css')));
  assert.ok(links.some(x=>x.startsWith('css/site.css')));
  assert.ok(links.some(x=>x.startsWith('css/pages/support-donation.css')));
  for(const bad of ['css/support.css','css/prose.css','assets/legacy-theme.css']){
    assert.ok(!links.some(x=>x.startsWith(bad)),bad);
  }
  assert.ok(css.includes('.support-donate-side{position:sticky;'));
  assert.ok(css.includes('.support-donate-side{order:-1;position:static;'));
});
