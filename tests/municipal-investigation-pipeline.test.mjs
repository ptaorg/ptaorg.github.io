import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const pipeline = read('ai-system/skills/municipal-investigation-pipeline.md');
const core = read('ai-system/skills/municipal-school-report.md');
const entry = read('.agents/skills/pta-municipal-school-report/SKILL.md');
const registry = JSON.parse(read('ai-system/SKILL_REGISTRY.json'));

test('municipal evaluation entrypoint loads the evidence pipeline', () => {
  assert.match(entry, /ai-system\/skills\/municipal-investigation-pipeline\.md/);
  assert.ok(registry.skills.some(s => s.id === 'municipal-investigation-pipeline' && s.path === 'skills/municipal-investigation-pipeline.md'));
});
test('Gmail, Drive and municipal enabling rules are mandatory before final municipality assessment', () => {
  for (const term of ['Gmail','Google Drive','全履歴','学校徴収金','委任','同意','公開可否']) {
    assert.ok(pipeline.includes(term), term);
  }
  assert.match(pipeline, /A・Bが未調査/);
});
test('chronology rewards improvement but never equates a guideline plan with implemented correction', () => {
  for (const term of ['時系列の改善評価','2026年3月30日','4月9日','10月26日','策定中','学校実施確認済み','改善の方向性']) {
    assert.ok(pipeline.includes(term), term);
  }
  assert.match(core, /既に実施された改善/);
  assert.match(core, /方針を表明したことと制度が実装されたことを混同しない/);
});
test('legal review order is preserved', () => {
  const framework=JSON.parse(read('ai-system/report-standards/institutional-rights-framework.json'));
  assert.deepEqual(framework.legalOrder.slice(0,5), [
    '主体の分離','PTA固有の事務帰属',
    '自治体・学校の具体的な所掌事務と公法上の権限',
    '個人情報保護法61条の利用目的・保有必要性',
    '個人情報保護法69条の利用・提供制限'
  ]);
});
