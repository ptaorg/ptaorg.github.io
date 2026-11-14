import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('small-screen A4 brief is readable without changing print rules',()=>{
 const html=read('board-brief.html');
 assert.match(html,/@media print\s*\{/);
 assert.match(html,/@media screen and \(max-width:850px\)/);
 assert.match(html,/\.legacy \.page\.compact p[\s\S]{0,250}font-size:14px/);
});
test('only scrollable legacy tables receive semantic scroll instructions',()=>{
 const js=read('assets/legacy.js');
 const css=read('assets/legacy-theme.css');
 assert.match(js,/table\.scrollWidth > table\.clientWidth \+ 4/);
 assert.match(js,/table\.before\(el\)/);
 assert.match(js,/aria-describedby/);
 assert.match(js,/tabindex/);
 assert.match(css,/\.table-scroll-hint/);
 assert.match(css,/@media print\{#main \.legacy-body \.table-scroll-hint\{display:none!important\}\}/);
});
test('mobile labels stay at least 14px',()=>{
 const chain=read('css/shared/shared-0b6c0a9953c5.css');
 const ppc=read('css/ppc-school-pta.css');
 const contact=read('css/pages/contact-unified.css');
 assert.match(chain,/\.legacy \.step-num \{[\s\S]{0,170}font-size: 0\.875rem/);
 assert.match(ppc,/\.legacy \.ppc-section-label \{[\s\S]{0,160}font-size: 0\.875rem/);
 assert.match(contact,/\.support-payment-card \.support-copy-btn \{min-height:44px/);
});

test('the evidence-ledger mobile labels meet the 14px floor',()=>{
 const css=read('assets/legacy-theme.css');
 assert.match(css,/body\[data-page="legacy"\]:has\(\.case-wrap\)[\s\S]{0,150}\.section-label,\.case-wrap a,\.case-wrap \.evidence-boundary,table th/);
 assert.match(css,/font-size:\.875rem!important;line-height:1\.7/);
});
