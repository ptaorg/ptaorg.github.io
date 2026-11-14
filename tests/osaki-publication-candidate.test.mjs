import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const CITY='research/osaki.html',SCHOOL='archive/osaki/tajiri-jhs/index.html';
const method=read('pta-evaluation-method.html');

test('Published Osaki report has indexed canonical, shared site layout and no personal details',()=>{
  const city=read(CITY),school=read(SCHOOL);
  assert.ok(city.includes('<link rel="canonical" href="https://ptaorg.com/research/osaki.html">'));
  assert.ok(school.includes('<link rel="canonical" href="https://ptaorg.com/archive/osaki/tajiri-jhs/">'));
  for(const html of [city,school]){
    assert.match(html,/<meta name="robots" content="index,follow">/);
    assert.match(html,/class="site-header"/);
    assert.match(html,/class="site-footer"/);
    assert.match(html,/class="skip-link"/);
    assert.match(html,/id="main"/);
    assert.doesNotMatch(html,/drive\.google\.com\/file\/d\//);
    assert.doesNotMatch(html,/全国資料\/大崎市/);
    assert.doesNotMatch(html,/実際に違法であることが確定/);
  }
  assert.match(city,/権利・尊厳/);
  assert.match(school,/権利と尊厳/);
  assert.match(city,/教育委員会/);
  assert.match(school,/教育委員会/);
});

test('Osaki 2026 cohort excludes closed school, preserving observed vs unobserved',()=>{
  const city=read(CITY);
  assert.match(city,/25校/);
  assert.match(city,/23校分の資料保有と、23校の固定12軸を判定できることは別/);
  assert.match(city,/古川西小中学校・鹿島台中学校/);
  assert.match(city,/下伊場野小学校は、/);
  assert.match(city,/2026年3月31日に廃止/);
  assert.match(city,/24校/);
  assert.match(city,/2026年6月23日更新/);
  assert.match(city,/大崎市立小中学校徴収金事務取扱規程/);
  assert.match(city,/第19条/);
  assert.match(city,/第20条/);
});

test('School candidate lists exactly 12 fixed axes and published non-claims',()=>{
  const s=read(SCHOOL);
  assert.equal((s.match(/class="m-no"/g)||[]).length,12);
  assert.equal((s.match(/（confirmed_yes）/g)||[]).length,2);
  assert.equal((s.match(/（indication）/g)||[]).length,2);
  assert.equal((s.match(/（unknown）/g)||[]).length,8);
  assert.match(s,/会費1,500円/);
  assert.match(s,/生徒活動援助費2,500円/);
  assert.match(s,/安全互助会負担金620円/);
  assert.match(s,/無償/);
  assert.match(s,/2026年4月18日/);
  assert.match(s,/校長名/);
  assert.match(s,/公法上の権限/);
  assert.match(s,/原本PDFの公開・匿名化は未承認/);
  assert.match(s,/委託契約書 PDF p\.1/);
  assert.match(s,/個々の教職員が勤務時間中に行ったPTA内部事務の実作業記録は未照合/);
  assert.match(s,/学校・PTAの意思決定／事務の混在/);
  for(const label of ['主体分離','誰の事務か','学校側の公法上の権限','情報保護法61条・69条','法的結論と是正先']){
    assert.ok(s.includes(label),'missing '+label);
  }
});

test('Osaki and Tajiri public pages are discoverable via homepage, local search and sitemap',()=>{
  const home=read('index.html'),explore=read('explore.html');
  const index=read('data/site-search-index.js'),sitemap=read('sitemap.xml');
  const method=read('pta-evaluation-method.html');
  for(const file of [home,explore,method]){
    assert.match(file,/research\/osaki\.html/);
    assert.match(file,/archive\/osaki\/tajiri-jhs\//);
  }
  assert.match(index,/research\/osaki\.html/);
  assert.match(index,/archive\/osaki\/tajiri-jhs\//);
  assert.match(sitemap,/<loc>https:\/\/ptaorg\.com\/research\/osaki\.html<\/loc>/);
  assert.match(sitemap,/<loc>https:\/\/ptaorg\.com\/archive\/osaki\/tajiri-jhs\/<\/loc>/);
  assert.doesNotMatch(read(CITY),/noindex,nofollow/);
  assert.doesNotMatch(read(SCHOOL),/noindex,nofollow/);
});

test('Candidate pages link to one another and public method without relative-path errors',()=>{
  const city=read(CITY),school=read(SCHOOL);
  assert.ok(city.includes('href="/archive/osaki/tajiri-jhs/"'));
  assert.ok(school.includes('href="/research/osaki.html"'));
  assert.ok(city.includes('href="/pta-evaluation-method.html"'));
  assert.ok(school.includes('href="/pta-evaluation-method.html"'));
  assert.ok(method.includes('全国PTA実態調査'));
  assert.ok(city.includes('href="/index.html"'));
  assert.ok(school.includes('href="/index.html"'));
});

test('Published old PDF is not silently copied or cited as final checked legal position',()=>{
  const city=read(CITY),school=read(SCHOOL),audit=read('docs/audits/osaki-2026-prepublication-review.md');
  assert.doesNotMatch(city,/個々の職員の名前/);
  assert.doesNotMatch(school,/委託者の氏名/);
  assert.match(audit,/220件・983頁/);
  assert.match(audit,/23校/);
  assert.match(audit,/下伊場野小学校/);
  assert.match(audit,/220行、ページ数計983頁/);
  assert.match(audit,/公開状態/);
});
