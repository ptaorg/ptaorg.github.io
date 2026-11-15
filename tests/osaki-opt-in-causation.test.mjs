import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const d=JSON.parse(read('data/osaki-membership-causation-2026.json'));
const raw=JSON.parse(read('data/osaki-public-2026.json'));
const url='https://ptaorg.com/research/osaki-membership-causation.html';
const page=read('research/osaki-membership-causation.html');
test('opt-in membership needs only joining records, not a nonmember roster',()=>{
 assert.match(d.optInPrinciple,/非会員名簿/);
 assert.match(d.coreQuestion,/加入した人だけ/);
 assert.ok(d.prohibitedInferences.some(x=>x.includes('非会員の名簿')));
 assert.ok(!d.operationalChecks.some(x=>x.key==='nonmemberRoster'));
 assert.match(page,/非会員名簿.*作成は必要ありません/);
 assert.match(page,/学校の児童・保護者名簿を取得して全保護者を登録/);
 assert.match(page,/本人の加入意思/);
});
test('automatic membership remains a review inference, not a legal nonexistence finding',()=>{
 assert.equal(d.schools.length,25);
 assert.equal(d.schools.length,raw.schools.length);
 assert.deepEqual(d.counts,{membership_record_not_found_fee_route_unestablished:18,
   presumed_automatic_membership_with_fee_notice:5,not_assessed_disclosure_missing:2});
 assert.equal(d.schools.filter(s=>s.feeCollectionEvidenceStatus==='confirmed_yes').length,5);
 for(const s of d.schools){
   assert.ok(raw.schools.find(x=>x.id===s.schoolId&&x.name===s.schoolName),s.schoolId);
   assert.ok(['not_found_in_disclosure','not_disclosed'].includes(s.applicationFormStatus));
 }
 assert.match(page,/個別契約の不存在/);
 assert.match(page,/徴収経路未立証/);
 assert.match(page,/法的に自動加入と確定/);
 assert.match(page,/PTAが別途保有する記録/);
});
test('public 25 school pages and discovery all link to the opt-in causation review',()=>{
 for(const s of raw.schools){
   const html=read('archive/osaki/'+s.id+'/index.html');
   assert.match(html,/id="membership-and-claim"/,s.id);
   assert.match(html,/非会員名簿の作成は必要ありません/,s.id);
   assert.ok(html.includes('href="/research/osaki-membership-causation.html"'),s.id);
 }
 for(const p of ['index.html','explore.html','pta-evaluation-method.html',
   'research/osaki.html','research/osaki-documents.html','data/site-search-index.js']){
   assert.ok(read(p).includes('osaki-membership-causation.html'),p);
 }
 assert.ok(read('sitemap.xml').includes('<loc>'+url+'</loc>'));
 assert.ok(page.includes('<link rel="canonical" href="'+url+'">'));
 assert.ok(page.includes('content="index,follow"'));
 assert.equal((page.match(/class="m-no"/g)||[]).length,25);
});
test('legal ordering and privacy safeguards are explicit',()=>{
 const s=page.indexOf('学校の権限：'),p=page.indexOf('個人情報：');
 assert.ok(s>=0&&p>s);
 assert.match(page,/個人情報保護法61条・69条/);
 assert.match(page,/民法709条/);
 assert.match(page,/独立再監査/);
 for(const secret of ['全国資料/','drive.google.com/file','伊藤礼子']){
   assert.ok(!page.includes(secret),secret);
   assert.ok(!JSON.stringify(d).includes(secret),secret);
 }
});
