import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const unified=read('contact.html');
const legacy=read('support.html');
const ids=[...unified.matchAll(/\\bid="([^"]+)"/g)].map(m=>m[1]);

test('the unified page has both contact and donation components',()=>{
  for(const value of ['info@ptaorg.com','メールで送る','XのDMで送る','資料の取扱いについて','ことら送金','PayPay','通常の銀行振込']){
    assert.ok(unified.includes(value),value);
  }
  for(const value of ['information','sec-1','sec-2','sec-3','sec-4','support-payment','cotra-transfer','paypay-transfer','bank-transfer']){
    assert.ok(ids.includes(value),value);
  }
  assert.equal(new Set(ids).size,ids.length,'duplicate HTML IDs');
});

test('all internal anchors on unified page exist',()=>{
  const localLinks=[...unified.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);
  for(const target of localLinks)assert.ok(ids.includes(target),'unresolved anchor '+target);
});

test('legacy support deep links redirect and retain query parameters',()=>{
  assert.match(legacy,/window\\.location\\.hash/);
  assert.match(legacy,/window\\.location\\.search/);
  assert.match(legacy,/window\\.location\\.replace/);
  assert.match(legacy,/#support-payment/);
  assert.match(legacy,/#support-needs/);
});

test('payment copy controls are not lost',()=>{
  const values=[...unified.matchAll(/data-copy-value="([^"]+)"/g)].map(m=>m[1]);
  assert.ok(values.length>=9,'nine or more bank and payment copy buttons');
  assert.match(unified,/data-copy-status/);
  assert.match(unified,/data-copy-value/);
});

test('main paths and shared footer lead to the unified page',()=>{
  const routes=['index.html','guide-parent.html','guide-pta.html','guide-board.html','guide-research.html','board-responses.html','national-archive.html','journal.html','report.html','research-index.html','about.html'];
  for(const file of routes){
    const html=read(file);
    assert.match(html,/id="participation-pathway-title"/,file);
    assert.match(html,/href="contact\\.html(?:#information)?"/,file);
  }
  assert.match(read('partials/footer.html'),/お問い合わせ・情報提供・活動支援/);
});
