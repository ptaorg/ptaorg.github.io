import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const map=fs.readFileSync('research-map.html','utf8');
const city=fs.readFileSync('research/atsugi.html','utf8');
const db=JSON.parse(fs.readFileSync('data/research-municipalities.json','utf8'));
const atsugi=db.municipalities.find(x=>x.id==='atsugi');
const region=map.match(/<article class="research-region" data-region="atsugi">([\s\S]*?)<\/article>/)?.[1];

test('municipality report inherits research-map archive; source scope separated from 48-subject survey',()=>{
 assert.ok(region,'Atsugi archive region absent');
 assert.match(region,/学校資料 36校/);
 assert.equal((region.match(/data-school-url=/g)||[]).length,36);
 assert.ok(region.includes('/research/atsugi.html'));
 const section=map.slice(map.indexOf('id="national-primary-survey"'));
 assert.equal((section.match(/class="research-region survey-record"/g)||[]).length,48);
 assert.ok(!section.match(/class="research-region survey-record"[^>]*>\s*<h3>[^<]*厚木市/));
 assert.ok(atsugi && atsugi.sources.some(x=>x.id==='notice'));
});
test('Atsugi improvement chronology is consistent across map, city page and municipal data',()=>{
 for(const date of ['2026-03-30','2026-04-09','2026-10-26'])
   assert.ok(atsugi.timeline.some(x=>x.date===date),date);
 assert.match(city,/2026年10月26日/);
 assert.match(city,/同意/);
 assert.match(city,/委託契約/);
 assert.match(city,/旧通知の改廃/);
 assert.match(region,/10月26日回答/);
 assert.match(atsugi.summary.join(' '),/36校での実施/);
 assert.ok(atsugi.unknowns.some(x=>x.includes('ガイドライン')));
});
test('existing school archive and map links are preserved',()=>{
 assert.ok(city.includes('id="schools"'));
 assert.equal((city.match(/data-school-url="\/archive\/atsugi\//g)||[]).length,36);
 for(const m of [...region.matchAll(/data-school-url="([^"]+)"/g)]){
   assert.ok(city.includes('data-school-url="'+m[1]+'"'),m[1]);
   assert.ok(fs.existsSync(m[1].replace(/^\//,'')+'index.html'),m[1]);
 }
});
test('publication workflow checks original map primary research before discovery',()=>{
 const publication=fs.readFileSync('ai-system/skills/municipal-web-publishing.md','utf8');
 const v3=fs.readFileSync('ai-system/skills/municipal-assessment-v3.md','utf8');
 assert.match(publication,/national-primary-survey/);
 assert.match(v3,/48主体/);
 assert.match(v3,/校種/);
});
