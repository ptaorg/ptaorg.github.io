import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=slug=>JSON.parse(fs.readFileSync('data/schools/atsugi/'+slug+'.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-36-school-intake-2026.json','utf8'));

test('misnamed elementary PDF cannot substantiate school roster allegations',()=>{
 const es=read('aikawa-es');
 assert.equal(es.status,'要確認');
 assert.match(es.evaluation.join(' '),/相川中学校/);
 assert.match(es.confirmedFacts.join(' '),/相川小PTA役員/);
 assert.doesNotMatch(es.evaluation.join(' '),/相川小学校では学校保有名簿を利用した/);
 assert.ok(ledger.corrections.some(x=>x.id==='CORR-ATSUGI-001'));
});
test('school meeting records specifically support JHS raffled selection while completion still unknown',()=>{
 const jhs=read('aikawa-jhs');
 assert.match(jhs.confirmedFacts.join(' '),/くじ引き/);
 assert.match(jhs.unconfirmedPoints.join(' '),/加入意思/);
 assert.match(jhs.evaluation.join(' '),/確定できず/);
});
test('2025 Atsugi ES membership form admits and withdraws',()=>{
 const es=read('atsugi-es');
 assert.match(es.materials.applicationFormStatus,/兼用書式/);
 assert.match(es.confirmedFacts.join(' '),/入会届・退会届/);
 assert.match(es.evaluation.join(' '),/旧評価には修正が必要/);
});
test('original PTA cards do not prove public authority or cash custody',()=>{
 const e=read('echi-es'),k=read('kamiogino-es');
 assert.match(e.evaluation.join(' '),/任意加入の明示は評価/);
 assert.match(k.confirmedFacts.join(' '),/学校の金庫/);
 assert.match(k.evaluation.join(' '),/確定しない/);
});
