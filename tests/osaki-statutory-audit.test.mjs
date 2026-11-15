import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const load=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(load(p));
const pub=json('data/osaki-public-2026.json');
const aud=json('data/osaki-legal-screening-2026.json');
const membership=json('data/osaki-membership-causation-2026.json');
test('the 25-school legal assessment preserves the cohort and separates fee routes',()=>{
 assert.equal(aud.schools.length,25);
 assert.equal(new Set(aud.schools.map(s=>s.schoolId)).size,25);
 assert.equal(aud.scope.schoolFeeDocumented,5);
 assert.equal(aud.scope.feeRouteUnestablished,20);
 assert.equal(aud.schools.filter(s=>s.documentDisclosure==='学校別資料未開示').length,2);
 assert.equal(membership.counts.membership_record_not_found_fee_route_unestablished,18);
 assert.equal(membership.counts.not_assessed_disclosure_missing,2);
 assert.equal(membership.counts.presumed_automatic_membership_with_fee_notice,5);
 assert.ok(!('presumed_automatic_membership_record_not_supplied' in membership.counts));
});
test('the recalculated 25x12 observable states match legal review and the city page',()=>{
 const c={confirmed_yes:0,confirmed_no:0,indication:0,unknown:0};
 pub.schools.forEach(s=>Object.values(s.axes).forEach(x=>{c[x.status]++}));
 assert.deepEqual(c,{confirmed_yes:15,confirmed_no:1,indication:14,unknown:270});
 for(const m of pub.axisMetrics)for(const st of Object.keys(c))assert.equal(m[st],pub.schools.filter(s=>s.axes[m.id].status===st).length);
 const city=load('research/osaki.html');
 assert.match(city,/観察YESは15、明示的な反対記載は1、示唆は14、未確認は270/);
 assert.match(city,/徴収経路未立証/);
});
test('all school pages carry a legal section with grounded case-specific source text',()=>{
 for(const s of aud.schools){
   const h=load('archive/osaki/'+s.schoolId+'/index.html');
   assert.equal((h.match(/id="statutory-review"/g)||[]).length,1,s.schoolId);
   assert.ok(h.includes('href="/research/osaki-legal-review.html"'),s.schoolId);
   assert.match(h,/非会員名簿.*不要/,s.schoolId);
   assert.match(h,/公法上の権限/,s.schoolId);
   assert.match(h,/(?:個情法|個人情報保護法)61条→69条/,s.schoolId);
   for(const x of s.observations){
     assert.ok(h.includes(x.label),s.schoolId+':'+x.axis);
   }
   if(s.feeRoute!=='school_collection_documented')assert.match(h,/徴収経路.*未立証/,s.schoolId);
 }
});
test('legal matrix has explicit links, distinction of scope, and a public discoverable article',()=>{
 assert.equal(aud.legalRules.length,15);
 assert.match(aud.method,/未立証/);
 assert.ok(aud.legalRules.some(r=>r.id==='public_cash_custody'));
 assert.ok(aud.legalRules.some(r=>r.id==='consumer_contract'));
 const page=load('research/osaki-legal-review.html');
 assert.match(page,/25校のPTA運営を、法令の要件から検証/);
 assert.match(page,/原本983頁すべて/);
 assert.match(page,/非会員名簿/);
 for(const s of aud.schools)assert.ok(page.includes('/archive/osaki/'+s.schoolId+'/'),s.schoolId);
 assert.ok(load('sitemap.xml').includes('<loc>https://ptaorg.com/research/osaki-legal-review.html</loc>'));
 assert.ok(load('data/site-search-index.js').includes('research/osaki-legal-review.html'));
 assert.ok(load('pta-evaluation-method.html').includes('research/osaki-legal-review.html'));
 assert.match(page,/個人情報保護委員会/);
});
