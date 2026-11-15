import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='ai-system/report-standards/';
const rule=JSON.parse(fs.readFileSync(root+'legal-screening.json','utf8'));
const axes=JSON.parse(fs.readFileSync(root+'evaluation-axes.json','utf8'));
const ids=new Set(axes.axes.map(a=>a.id));
test('fixed evaluation axes stay unchanged while legal layer is separately versioned',()=>{
 assert.equal(rule.version,'1.1.0');
 assert.equal(rule.evaluationAxesVersion,'1.0.0');
 assert.equal(axes.axes.length,12);
 assert.ok(rule.rules.length>=14);
 for(const x of rule.rules){
   assert.ok(x.id&&x.title&&x.law&&x.legalTest&&x.noAutomaticConclusion&&x.primaryLawUrl);
   assert.ok(x.triggerAxes.length);
   for(const a of x.triggerAxes)assert.ok(ids.has(a),'unknown axis '+a);
 }
});
test('the legal inquiry begins with subjects, ownership, public authority then privacy',()=>{
 assert.match(rule.reviewOrder[0],/主体/);
 assert.match(rule.reviewOrder[1],/事務/);
 assert.match(rule.reviewOrder[2],/公法上の権限/);
 assert.match(rule.reviewOrder[3],/61条/);
 assert.match(rule.reviewOrder[4],/69条/);
});
test('opt-in does not require nonmember data or infer contract absence from missing paper',()=>{
 assert.match(rule.membershipCaution,/非会員名簿.*要求しない/);
 assert.match(rule.membershipCaution,/契約不存在の証明ではない/);
});
test('fee route is recorded only from positive evidence and leaves unestablished separate',()=>{
 assert.deepEqual(rule.feeRouteStatuses,[
 'school_collection_documented','pta_direct_collection_documented',
 'no_fee_documented','route_unestablished'
 ]);
 assert.match(rule.feeRouteCaution,/未確認≠不存在/);
});
test('statutory traps are explicitly guarded',()=>{
 const c=rule.rules.map(r=>r.noAutomaticConclusion).join('\n');
 assert.match(c,/232条の2/);
 assert.match(c,/地方自治法/);
 assert.match(c,/非会員名簿/);
 assert.match(c,/刑事/);
 assert.match(c,/本人同意/);
});
