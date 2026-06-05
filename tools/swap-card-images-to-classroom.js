#!/usr/bin/env node
const fs = require('fs');

const tasks = [
  {
    file: 'index.html',
    from: '<img alt="明るい学校風景" loading="lazy" src="assets/slides/1.jpg"/>',
    to: '<img alt="明るい教室の風景" loading="lazy" src="assets/slides/3.jpg"/>',
    expected: 1
  },
  {
    file: 'index.html',
    from: '<img alt="明るい校舎の風景" loading="lazy" src="assets/slides/1.jpg"/>',
    to: '<img alt="明るい教室の風景" loading="lazy" src="assets/slides/3.jpg"/>',
    expected: 1
  },
  {
    file: 'audit/index.html',
    from: '<img src="../assets/slides/1.jpg" alt="明るい校舎の風景">',
    to: '<img src="../assets/slides/3.jpg" alt="明るい教室の風景">',
    expected: 2
  }
];

for (const task of tasks) {
  const before = fs.readFileSync(task.file, 'utf8');
  const count = before.split(task.from).length - 1;
  if (count !== task.expected) {
    console.error(`${task.file}: expected ${task.expected} match(es), found ${count}`);
    process.exit(1);
  }
  const after = before.split(task.from).join(task.to);
  fs.writeFileSync(task.file, after, 'utf8');
  console.log(`${task.file}: replaced ${count} image reference(s)`);
}
