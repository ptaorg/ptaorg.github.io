#!/usr/bin/env node
const fs = require('fs');
const file = 'PTA運営適正化ガイドブック_第4版_改訂本文.html';
const before = fs.readFileSync(file, 'utf8');

const replacements = [
  [
    '学校・PTAの癒着を断ち切り、法令が示す本来の関係を取り戻すために',
    '学校とPTAの境界を明確にし、法令が示す本来の関係を確認するために'
  ],
  ['学校とPTAの癒着構造', '学校とPTAの公私混同構造'],
  ['学校とPTAの癒着', '学校とPTAの公私混同'],
  ['癒着構造', '公私混同構造'],
  ['癒着問題', '公私混同問題'],
  ['癒着', '公私混同']
];

let after = before;
for (const [from, to] of replacements) {
  after = after.split(from).join(to);
}

const beforeCount = (before.match(/癒着/g) || []).length;
const afterCount = (after.match(/癒着/g) || []).length;
if (beforeCount < 1) {
  console.error('No target wording found.');
  process.exit(1);
}
if (afterCount !== 0) {
  console.error(`Wording still remains after replacement: ${afterCount}`);
  process.exit(1);
}

fs.writeFileSync(file, after, 'utf8');
console.log(`Replaced ${beforeCount} occurrence(s) of strong wording in guidebook.`);
