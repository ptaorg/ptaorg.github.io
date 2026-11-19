import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const badPublicationPhrases = [
  '資料画像を掲載する場合は',
  '学校別の個別評価は未実施です。現時点では',
  '確認済み資料に基づき順次更新します。',
  '公開可否を確認したものから順次掲載します。',
  '掲載準備中です。',
  '10月19日通知の原本画像は現在の記事では未収録',
  'スクリーンショットではなく、受信メール本文',
  '原資料の収集・公開前の確認後に追加する予定',
  '自治体の評価は現在準備中です。'
];

function schoolHtmls(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? schoolHtmls(target) : entry.name.endsWith('.html') ? [target] : [];
  });
}

test('published school archives contain no editorial production notes', () => {
  const pages = schoolHtmls(path.join(root, 'archive'));
  assert.ok(pages.length >= 500, 'archive inventory unexpectedly small');
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    for (const phrase of badPublicationPhrases) {
      assert.ok(!html.includes(phrase), path.relative(root, file) + ': ' + phrase);
    }
  }
});

test('featured municipal reports and the map contain no publishing schedule notes', () => {
  for (const name of ['yokohama-pta-fee-20261102.html', 'shimosuwa-pta-20261118.html', 'research-map.html']) {
    const html = fs.readFileSync(path.join(root, name), 'utf8');
    for (const phrase of badPublicationPhrases) {
      assert.ok(!html.includes(phrase), name + ': ' + phrase);
    }
  }
});
