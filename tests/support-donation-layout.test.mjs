import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const page=read('contact.html');
const legacy=read('support.html');
const css=read('css/pages/support-donation.css');
const layout=read('css/pages/contact-unified.css');
const main=page.slice(page.indexOf('<main id="main"'),page.indexOf('</main>')+7);
const paypay='https://qr.paypay.ne.jp/p2p01_fwdAWb93QZWdQp8j';

test('unified contact layout keeps information provision first and payment alongside it',()=>{
  assert.match(main,/class="unified-grid"/);
  assert.match(main,/class="unified-contact-card"/);
  assert.match(main,/class="support-letter"/);
  assert.match(main,/<aside class="support-donate-side"/);
  assert.ok(main.indexOf('class="unified-contact-card"')<main.indexOf('class="support-donate-side"'));
  assert.match(layout,/grid-template-columns:minmax\(0,1fr\) minmax\(330px,380px\)/);
  assert.match(layout,/@media\(max-width:760px\)/);
  assert.match(layout,/\.unified-grid \{ display:flex; flex-direction:column/);
  assert.match(page,/css\/pages\/support-donation\.css\?v=20261114-[^"]+/);
  assert.match(legacy,/css\/pages\/support-donation\.css\?v=20261114-[^"]+/);
  assert.ok(page.includes('css/pages/contact-unified.css?v=20261114'));
  assert.equal((page.match(/<h1\b/g)||[]).length,1);
});

test('unified page preserves payment destinations, reference material and free consultation',()=>{
  assert.equal(page.split(paypay).length-1,2);
  for(const id of ['support-payment','support-payment-title','bank-transfer','sec-2','sec-3','sec-4','sec-5','sec-6','sec-7']){
    assert.ok(page.includes('id="'+id+'"'),id);
  }
  for(const title of ['なぜ支援が必要なのか','これまでの主な成果','主な使途','サポーター制度（月額支援）','活動報告と透明性の約束','活動の内容を確認する']){
    assert.ok(main.includes(title),title);
  }
  assert.ok(main.includes('名義：サトウ ダイ'));
  assert.ok(main.includes('info@ptaorg.com'));
  assert.match(main,/相談や資料の提供に寄付は必要ありません/);
  assert.ok((page.match(/data-copy-value="/g)||[]).length>=9);
  assert.match(legacy,/window\.location\.replace/);
});

test('new contact page loads its own layout without incompatible prose styles',()=>{
  const links=[...page.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]);
  for(const required of ['assets/style.css','css/site.css','css/pages/support-donation.css','css/pages/contact-unified.css']){
    assert.ok(links.some(x=>x.startsWith(required)),required);
  }
  for(const bad of ['css/support.css','css/prose.css','assets/legacy-theme.css']){
    assert.ok(!links.some(x=>x.startsWith(bad)),bad);
  }
  assert.ok(css.includes('.support-donate-side{position:sticky;'));
  assert.match(layout,/#main\.unified-page \.support-donate-side/);
});
