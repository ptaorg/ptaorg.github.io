import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
test('PPC administrative sector guideline has a named official HTML link rather than obsolete PDF',()=>{
 const s=fs.readFileSync(path.join(root,'journal/why-pta-membership-freedom-fails.html'),'utf8');
 assert.ok(!s.includes('251212_koutekibumon_guidelines.pdf'));
 assert.match(s,/href="https:\/\/www\.ppc\.go\.jp\/personalinfo\/legal\/guidelines_administrative\/"[^>]*>個人情報保護委員会「ガイドライン（行政機関等編）」公式HTML版<\/a>/);
 assert.match(s,/法令の定める所掌事務・権限/);
});
