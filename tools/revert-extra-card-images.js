#!/usr/bin/env node
const fs = require('fs');

function replaceNth(text, search, replacement, n) {
  let i = 0;
  return text.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), match => {
    i += 1;
    return i === n ? replacement : match;
  });
}

// index.html: 2枚目だけ元に戻す。1枚目は教室画像のまま残す。
{
  const file = 'index.html';
  const before = fs.readFileSync(file, 'utf8');
  const from = '<img alt="明るい教室の風景" loading="lazy" src="assets/slides/3.jpg"/>';
  const to = '<img alt="明るい校舎の風景" loading="lazy" src="assets/slides/1.jpg"/>';
  const count = before.split(from).length - 1;
  if (count !== 2) {
    console.error(`${file}: expected 2 classroom card images, found ${count}`);
    process.exit(1);
  }
  const after = replaceNth(before, from, to, 2);
  fs.writeFileSync(file, after, 'utf8');
  console.log(`${file}: reverted second card image only`);
}

// audit/index.html: 2枚目だけ元に戻す。1枚目は教室画像のまま残す。
{
  const file = 'audit/index.html';
  const before = fs.readFileSync(file, 'utf8');
  const from = '<img src="../assets/slides/3.jpg" alt="明るい教室の風景">';
  const to = '<img src="../assets/slides/1.jpg" alt="明るい校舎の風景">';
  const count = before.split(from).length - 1;
  if (count !== 2) {
    console.error(`${file}: expected 2 classroom card images, found ${count}`);
    process.exit(1);
  }
  const after = replaceNth(before, from, to, 2);
  fs.writeFileSync(file, after, 'utf8');
  console.log(`${file}: reverted second card image only`);
}
