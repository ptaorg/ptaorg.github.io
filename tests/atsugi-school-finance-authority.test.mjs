import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-school-finance-authority-review-2026.json','utf8'));
const page=fs.readFileSync('research/atsugi.html','utf8');
const report=fs.readFileSync('reports/atsugi-36-school-original-review-20261116.md','utf8');
test('finance powers correctly sourced to Atsugi ordinance guideline without claiming completeness',()=>{
 assert.equal(d.primarySource.url,'https://www.city.atsugi.kanagawa.jp/soshiki/kyoikusomuka/16/1568.html');
 assert.deepEqual(d.provisions.map(x=>x.article),[1,3,9,11,20,25]);
 assert.ok(d.provisions.some(x=>x.article===20&&x.verified.includes('私用電話料')));
 assert.ok(d.provisions.some(x=>x.article===25&&x.verified.includes('寄附申出書')));
 assert.match(d.assessment.authority,/他の法令/);
 assert.match(d.assessment.privateDelegation,/創設しない/);
});
test('research note and report retain first-party source and separate legal conclusions',()=>{
 assert.ok(page.includes('id="atsugi-finance-authority"'));
 assert.ok(page.includes(d.primarySource.url));
 assert.match(page,/公法上の権限の代わりにはなりません/);
 assert.match(report,/学校財務事務取扱要綱の個別条文/);
 assert.match(report,/11月30日回答予定/);
});
