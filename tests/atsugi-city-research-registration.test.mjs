import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page=fs.readFileSync('research/atsugi.html','utf8');
const registry=JSON.parse(fs.readFileSync('ai-system/report-standards/pilots/atsugi-city-pta-registrations-2024.json','utf8'));
test('city research note explains 2024 registries without treating registration as authority',()=>{
 assert.ok(page.includes('id="atsugi-public-pta-registry"'));
 assert.ok(page.includes(registry.sourceUrl));
 assert.match(page,/根拠法令/);
 assert.match(page,/登録簿に該当するのは25校/);
 assert.match(page,/PTA役員名簿/);
 assert.ok(page.includes('https://www.city.atsugi.kanagawa.jp/material/files/group/9/780023zimu2.pdf'));
 assert.match(page,/公法上の具体的権限を確認/);
 assert.match(page,/個人情報保護法61条・69条/);
 assert.match(page,/2024年8月31日現在/);
 assert.match(page,/学校別原本PDF15校/);
});
