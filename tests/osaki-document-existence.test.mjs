import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=JSON.parse(read('data/osaki-public-2026.json'));
const legacy=JSON.parse(read('data/osaki-document-existence-2026.json'));
const page=read('research/osaki-documents.html');

test('new document existence ledger has 25 schools x 10 kinds = 250 checked records',()=>{
  assert.equal(data.schools.length,25);
  assert.equal(new Set(data.schools.map(s=>s.id)).size,25);
  assert.equal(data.documentTypes.length,10);
  assert.ok(data.schools.every(s=>Object.keys(s.documents).length===10));
  const tally=Object.fromEntries(Object.keys(data.documentStatusDefinitions).map(k=>[
    k,data.schools.reduce((n,s)=>n+Object.values(s.documents).filter(v=>v.status===k).length,0)
  ]));
  assert.deepEqual(tally,{present_as_standalone_document:14,present_as_provision_only:2,
    internal_rule_only:17,not_found_in_disclosure:197,not_disclosed:20,formally_determined_nonexistent:0});
  assert.deepEqual(tally,data.documentStatusCounts);
  assert.equal(Object.values(tally).reduce((a,b)=>a+b,0),250);
  assert.equal(data.scope.documentCount,220);
  assert.equal(data.scope.documentPages,983);
  assert.equal(data.scope.disclosedSchoolDocuments,23);
});

test('document table distinguishes non-submission and formal administrative no-record decision',()=>{
  assert.match(page,/開示資料中に確認できない/);
  assert.match(page,/行政による正式な不存在決定/);
  assert.match(page,/250記録/);
  assert.match(page,/197記録/);
  assert.match(page,/20記録/);
  assert.match(page,/正式な不存在決定は0記録/);
  assert.match(page,/2026年11月15日/);
  assert.match(page,/古川第二小学校/);
  assert.match(page,/田尻中学校/);
  assert.doesNotMatch(page,/学校にもPTAにも絶対に存在しない/);
  assert.equal(page.split('<tr><td class="m-no">').length-1,25);
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/<link rel="canonical" href="https:\/\/ptaorg.com\/research\/osaki-documents.html">/);
});

test('legacy two-column ledger remains identifiable as superseded, not current data',()=>{
  assert.equal(legacy.schools.length,25);
  assert.equal(legacy.archivedVersion,'2026-11-15-initial');
  assert.equal(legacy.supersededBy,'data/osaki-public-2026.json');
  assert.ok(legacy.statusNotice.includes('現行の25校×10種類'));
});

test('document index is linked from all public entry points',()=>{
  for(const p of ['index.html','explore.html','research/osaki.html',
    'archive/osaki/tajiri-jhs/index.html','pta-evaluation-method.html','data/site-search-index.js']){
    assert.ok(read(p).includes('osaki-documents.html'),p);
  }
  assert.ok(read('sitemap.xml').includes('<loc>https://ptaorg.com/research/osaki-documents.html</loc>'));
});

test('private files and identities are absent from public index and data',()=>{
  const contents=page+JSON.stringify(data);
  for(const value of ['全国資料/','drive.google.com/file','伊藤礼子',
    '1w9VpwKJudWk7tv7iSX5sfQ309a0n5FCp','@gmail.com']){
    assert.ok(!contents.includes(value),'private value leaked: '+value);
  }
});
