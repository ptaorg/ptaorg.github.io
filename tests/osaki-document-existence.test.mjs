import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=JSON.parse(read('data/osaki-document-existence-2026.json'));
const page=read('research/osaki-documents.html');
test('25 schools and all requested document categories are tracked separately from 12 observation axes',()=>{
 assert.equal(data.schools.length,25);
 assert.equal(new Set(data.schools.map(s=>s.id)).size,25);
 assert.equal(data.documentTypes.length,10);
 assert.equal(data.schools.filter(s=>s.applicationForm==='not_found_in_disclosure_report').length,6);
 assert.equal(data.schools.filter(s=>s.applicationForm==='not_listed_as_standalone_in_24_disclosed_titles').length,1);
 assert.equal(data.schools.filter(s=>s.applicationForm==='not_assessed').length,18);
 assert.equal(data.schools.every(s=>s.applicationForm===s.withdrawalRule),true);
 assert.equal(data.source.totalDisclosedDocuments,220);
 assert.equal(data.source.totalDisclosedPages,983);
});
test('page accurately limits evidence to non-submission, not universal absence',()=>{
 assert.match(page,/開示資料中に確認できない/);
 assert.match(page,/行政が保有不存在を決定/);
 assert.match(page,/現時点で正式な不存在決定は確認できていません/);
 assert.match(page,/独立した文書名/);
 assert.match(page,/2026年11月15日/);
 assert.match(page,/古川第二小学校/);
 assert.match(page,/田尻中学校/);
 assert.doesNotMatch(page,/25校すべてに入会申込書が存在しない/);
 assert.doesNotMatch(page,/学校にもPTAにも絶対に存在しない/);
 assert.equal(page.split('<tr><td>').length-1,25);
 assert.match(page,/<meta name="robots" content="index,follow">/);
 assert.match(page,/<link rel="canonical" href="https:\/\/ptaorg.com\/research\/osaki-documents.html">/);
});
test('page is reachable via home, explore, city, school, methodology and local search, and listed in sitemap',()=>{
 for(const p of ['index.html','explore.html','research/osaki.html','archive/osaki/tajiri-jhs/index.html','pta-evaluation-method.html','data/site-search-index.js']){
   assert.ok(read(p).includes('osaki-documents.html'),p);
 }
 assert.ok(read('sitemap.xml').includes('<loc>https://ptaorg.com/research/osaki-documents.html</loc>'));
});
test('private document names/paths and personal data are not introduced',()=>{
 assert.ok(!page.includes('drive.google.com/file/d/'));
 assert.ok(!page.includes('全国資料/大崎市'));
 assert.doesNotMatch(page,/1w9VpwKJudWk7tv7iSX5sfQ309a0n5FCp/);
});
