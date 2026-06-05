#!/usr/bin/env node
const fs = require('fs');
const file = 'index.html';
const before = fs.readFileSync(file, 'utf8');
const target = '<section class="entry-section">\n</section>\n';
const count = before.split(target).length - 1;
if (count !== 1) {
  console.error(`Expected exactly 1 empty entry-section, found ${count}`);
  process.exit(1);
}
const after = before.replace(target, '');
fs.writeFileSync(file, after, 'utf8');
console.log('Removed empty entry-section from index.html');
