import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-school-finance-authority-review-2026.json','utf8'));
const html=fs.readFileSync('research/atsugi.html','utf8');
test('unretrieved mayoral auxiliary-execution provision is explicitly not treated as verified',()=>{
 const r=data.relatedAuthorityInstrument;
 assert.equal(r.promulgation,'昭和53年厚木市訓令第2号');
 assert.equal(r.specificProvision,'第2条第3項第1号');
 assert.match(r.verificationStatus,/unretrieved/);
 assert.match(r.claimLimit,/未取得/);
 assert.match(r.notSameInstrument,/別法令/);
 assert.ok(r.crossReferences.some(x=>x.includes('第19条')));
});
test('public draft discloses unknown article instead of fabricating principal powers',()=>{
 assert.match(html,/現行条文の全文・改正履歴はまだ取得できていません/);
 assert.match(html,/逆方向の別制度/);
 assert.match(html,/校長の専決金額・対象事務を断定していません/);
 assert.doesNotMatch(html,/当然にPTA会費.*権限/);
});
