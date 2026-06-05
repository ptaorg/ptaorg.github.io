#!/usr/bin/env node
const fs = require('fs');
const file = 'PTA運営適正化ガイドブック_第4版_改訂本文.html';
const before = fs.readFileSync(file, 'utf8');
const from = '<div class="cover-title">公立学校における<br>PTA運営の適正化に関する<br>ガイドブック</div>';
const to = '<h1 class="cover-title">公立学校における<br>PTA運営の適正化に関する<br>ガイドブック</h1>';
const count = before.split(from).length - 1;
if (count !== 1) {
  console.error(`Expected exactly 1 cover title div, found ${count}`);
  process.exit(1);
}
const after = before.replace(from, to);
fs.writeFileSync(file, after, 'utf8');
console.log('Converted guidebook cover title to h1');
