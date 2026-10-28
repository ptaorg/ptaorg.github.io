const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const path=require('path'),ROOT=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(ROOT,'data/board-response-updates.json')));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'data/board-responses.json'))).digest('hex'),data.legacySha256,'legacy 72 response file must remain byte-identical');
assert.equal(JSON.parse(fs.readFileSync(path.join(ROOT,'data/board-responses.json'))).responses.length,72);
const fields=['id','municipality','prefecture','date','receivedDate','department','questionSummary','adminSummary','status','verification','citedLaws','topics','researchIssues','limitations','source','countAsResponse'];
const ids=new Set();
for(const r of data.records){
 assert.deepEqual(Object.keys(r).sort(),fields.slice().sort(),'public field allowlist');assert.ok(!ids.has(r.id));ids.add(r.id);
 assert.match(r.id,/^update-(?:extra-)?\d+$/);assert.match(r.date,/^\d{4}-\d{2}-\d{2}$/);
 for(const key of ['citedLaws','topics','researchIssues','limitations'])assert.ok(Array.isArray(r[key]),key);
 for(const key of ['municipality','prefecture','adminSummary','verification','source','status'])assert.ok(r[key],key);
 const text=JSON.stringify(r);
 assert.ok(!/mail\.google|gmail\.com|link_[a-f0-9]|privateProvenance|messageId|attachment_id|@[a-z]|https?:\/\//i.test(text),'no private provenance, contact details or source tokens');
 assert.ok(!/\b0\d{1,4}[-ー]\d{1,4}[-ー]\d{3,4}\b/.test(text),'no telephone');
 assert.ok(!/[a-f0-9]{16,}/i.test(text),'no internal mail identifiers');
 if(/準備|案内|調査中|未確認/.test(r.status))assert.equal(r.countAsResponse,false,'pending is not a completed substantive response');
}
assert.equal(data.records.filter(r=>r.municipality==='大阪府教育庁'&&r.date>='2026').length,0,'publication hold is respected');
console.log(`Supplement: ${data.records.length} records; ${data.records.filter(r=>r.countAsResponse).length} substantive; preserved legacy 72 and privacy checks passed`);
