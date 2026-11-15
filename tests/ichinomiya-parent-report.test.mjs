import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root = p => fs.readFileSync(p, 'utf8');
const data = JSON.parse(root('data/ichinomiya-parent-2026.json'));
const national = JSON.parse(root('data/research-map-index.json'));
const city = national.municipalities.find(x => x.id === 'ichinomiya');
test('Ichinomiya is reachable from national map without treating reports as archive originals',()=>{
 assert.ok(city);
 assert.equal(city.url,'/research/ichinomiya.html');
 assert.equal(city.schoolReportCount,21);
 assert.equal(city.schools.length,0);
 assert.equal(city.schoolReportNames.length,21);
 const map = root('research-map.html');
 assert.match(map,/data-region="ichinomiya"/);
 assert.match(map,/href="\/research\/ichinomiya.html"/);
 assert.match(map,/学校別の調査 21校/);
 const cityHtml=root('research/ichinomiya.html');
 assert.match(cityHtml,/id="schools"/);
 assert.match(cityHtml,/href="\/research-map.html"/);
});
test('all 21 school reports feature the school name as h1 and link to published evidence',()=>{
 assert.equal(data.scope.allSchools,61);
 assert.equal(data.scope.reportSchools,21);
 assert.equal(data.scope.sourcePdfs,42);
 assert.equal(data.scope.findings,50);
 assert.equal(data.schools.length,21);
 assert.equal(new Set(data.schools.map(x=>x.id)).size,21);
 for(const s of data.schools){
   const html=root('.'+s.url+'index.html');
   assert.ok(html.includes('<h1>'+s.name+'</h1>'),s.name);
   assert.ok(html.includes('href="/research/ichinomiya.html#schools"'),s.name);
   assert.ok(html.includes('PTAの加入・退会意思'),s.name);
   assert.ok(html.includes('https://drive.google.com/file/d/'),s.name);
   if(s.firstEvidenceImage){
     assert.ok(html.includes('src="'+s.firstEvidenceImage+'"'),s.name);
     assert.ok(fs.existsSync('.'+s.firstEvidenceImage),'missing evidence: '+s.firstEvidenceImage);
   }
 }
});
test('mobile styling and source limitations are visible',()=>{
 const css=root('assets/ichinomiya-parent-report.css');
 const cityHtml=root('research/ichinomiya.html');
 assert.match(css,/@media\(max-width:750px\)/);
 assert.match(css,/\.hero h1\{font-size:clamp\(3\.1rem/);
 assert.match(cityHtml,/違法認定済みとするものではありません/);
 const osaki=root('assets/osaki-evidence-report.js');
 assert.ok(osaki.includes("\'<h1>\'+esc(s.schoolName)+\'</h1>\'"));
});
