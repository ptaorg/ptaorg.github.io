import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=JSON.parse(read('data/osaki-public-2026.json'));
const labels={confirmed_yes:'記載あり',confirmed_no:'明示的な反対記載',
  indication:'示唆・要追加確認',unknown:'未確認',not_applicable:'非該当',conflicting:'資料間矛盾'};
const stateList=['confirmed_yes','confirmed_no','indication','unknown','not_applicable','conflicting'];
const schoolPath=s=>'archive/osaki/'+s.id+'/index.html';
const canonical=s=>'https://ptaorg.com/archive/osaki/'+s.id+'/';

test('25 schools are in the public release and every one has 12 axes plus 10 documents',()=>{
  assert.equal(data.version,'2026-11-15-public-v2');
  assert.equal(data.schools.length,25);
  assert.equal(data.axes.length,12);
  assert.equal(data.documentTypes.length,10);
  assert.equal(new Set(data.schools.map(s=>s.id)).size,25);
  const census=new Map(data.schools.map(s=>[s.id,s.name]));
  assert.equal(census.get('tajiri-jhs'),'田尻中学校');
  for(const s of data.schools){
    assert.equal(Object.keys(s.axes).length,12,s.id);
    assert.equal(Object.keys(s.documents).length,10,s.id);
    assert.ok(fs.existsSync(path.join(root,schoolPath(s))),s.id);
    const html=read(schoolPath(s));
    assert.ok(html.includes('<link rel="canonical" href="'+canonical(s)+'">'),s.id);
    assert.ok(html.includes('<meta name="robots" content="index,follow">'),s.id);
    assert.ok(html.includes('class="site-header"'),s.id);
    assert.ok(html.includes('class="site-footer"'),s.id);
    assert.ok(html.includes('id="main"'),s.id);
    assert.ok(html.includes('href="/research/osaki.html'),s.id);
    assert.ok(html.includes('href="/research/osaki-documents.html'),s.id);
    assert.equal((html.match(/class="m-no"/g)||[]).length,22,s.id);
  }
});

test('the exact 300 observation cells preserve denominators and 6 categories',()=>{
  const tally=Object.fromEntries(stateList.map(k=>[k,0]));
  for(const s of data.schools)for(const a of data.axes){
    const x=s.axes[a.id]; assert.ok(x,'missing axis '+s.id+':'+a.id);
    assert.ok(stateList.includes(x.status),x.status);
    tally[x.status]++;
  }
  assert.deepEqual(tally,{confirmed_yes:17,confirmed_no:3,indication:12,
    unknown:268,not_applicable:0,conflicting:0});
  for(const a of data.axisMetrics){
    assert.equal(a.confirmed_yes, data.schools.filter(s=>s.axes[a.id].status==='confirmed_yes').length);
    assert.equal(a.confirmed_no, data.schools.filter(s=>s.axes[a.id].status==='confirmed_no').length);
    const known=a.confirmed_yes+a.confirmed_no;
    assert.equal(a.yesOfKnownPct,known?Math.round(a.confirmed_yes*1000/known)/10:null);
    assert.equal(a.yesOfTargetPct,Math.round(a.confirmed_yes*1000/25)/10);
  }
});

test('generated school reports retain each axis status and source facts',()=>{
  for(const s of data.schools.filter(s=>s.id!=='tajiri-jhs')){
    const html=read(schoolPath(s));
    const axisSection=html.split('id="axes"')[1]?.split('</section>')[0]||'';
    const docSection=html.split('id="document-existence"')[1]?.split('</section>')[0]||'';
    for(const a of data.axes){
      const x=s.axes[a.id]; const label=labels[x.status];
      const row=axisSection.split('<th scope="row">'+a.label+'</th>')[1]?.split('</tr>')[0];
      assert.ok(row,'axis missing from school table '+s.id+':'+a.id);
      assert.ok(row.includes('<strong>'+label+'</strong>'), 'axis status mismatch '+s.id+':'+a.id);
      if(x.note)assert.ok(row.includes(x.note.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')),'note missing '+s.id+':'+a.id);
    }
    for(const t of data.documentTypes){
      assert.ok(docSection.includes('<th scope="row">'+t.label+'</th>'),'missing document type '+s.id+':'+t.id);
    }
    const legal=html.split('id="responsibility"')[1]?.split('</section>')[0]||'';
    assert.ok(legal.indexOf('主体と事務の分離')<legal.indexOf('教育委員会・学校側の権限'));
    assert.ok(legal.indexOf('教育委員会・学校側の権限')<legal.indexOf('個人情報の利用・提供'));
  }
});

test('all 25 school URLs are discoverable through city index, search and sitemap',()=>{
  const city=read('research/osaki.html'),sitemap=read('sitemap.xml'),
  search=read('data/site-search-index.js');
  assert.ok(city.includes('全25校'), 'city list must show 25');
  assert.ok(city.includes('観察YESは17、明示的な反対記載は3、示唆は12、未確認は268'));
  for(const s of data.schools){
    const local='/archive/osaki/'+s.id+'/';
    assert.ok(city.includes('href="'+local+'"'),s.id+' missing city URL');
    assert.ok(sitemap.includes('<loc>https://ptaorg.com'+local+'</loc>'),s.id+' missing sitemap');
    assert.ok(search.includes('archive/osaki/'+s.id+'/'),s.id+' missing site search');
  }
  assert.ok(read('index.html').includes('全25校'));
  assert.ok(read('explore.html').includes('全25校'));
});

test('no private source paths or identified staff names are placed in public pages/data',()=>{
  let all=JSON.stringify(data)+read('research/osaki.html')+read('research/osaki-documents.html');
  for(const s of data.schools)all+=read(schoolPath(s));
  for(const bad of ['全国資料/','drive.google.com/file','伊藤礼子',
    '1w9VpwKJudWk7tv7iSX5sfQ309a0n5FCp']){
    assert.ok(!all.includes(bad),'sensitive evidence leaked: '+bad);
  }
  assert.match(read('research/osaki.html'),/公法上の権限/);
  assert.match(read('research/osaki-documents.html'),/正式な不存在決定は0記録/);
  assert.match(data.sourceReviewStatus,/独立再監査/);
});
