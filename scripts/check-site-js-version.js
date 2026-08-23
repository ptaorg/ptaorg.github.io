#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXPECTED_VERSION = process.argv[2] || '93';
const EXPECTED_PATTERN = new RegExp(`site\\.js\\?v=${EXPECTED_VERSION}(?:["'])`);
const SITE_JS_PATTERN = /site\.js\?v=([^"']+)/g;

const SKIP_DIRS = new Set([
  '.git',
  '.claude',
  'assets',
  'css',
  'data',
  'js',
  'node_modules',
  'scripts',
  'tools',
  'ホーム',
]);

const mismatches = [];
const noVersionRefs = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;

    const filePath = path.join(dir, entry.name);
    const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
    const text = fs.readFileSync(filePath, 'utf8');

    if (!text.includes('site.js')) continue;

    SITE_JS_PATTERN.lastIndex = 0;
    const versions = [];
    let match;
    while ((match = SITE_JS_PATTERN.exec(text))) {
      versions.push(match[1]);
    }

    if (versions.length === 0) {
      noVersionRefs.push(rel);
      continue;
    }

    const hasExpected = EXPECTED_PATTERN.test(text);
    const hasUnexpected = versions.some((v) => v !== EXPECTED_VERSION);
    if (!hasExpected || hasUnexpected) {
      mismatches.push({ file: rel, versions: [...new Set(versions)] });
    }
  }
}

walk(ROOT);

if (noVersionRefs.length) {
  console.error('site.js references without ?v= found:');
  for (const file of noVersionRefs) console.error(`- ${file}`);
}

if (mismatches.length) {
  console.error(`site.js version mismatches. Expected v=${EXPECTED_VERSION}:`);
  for (const item of mismatches) {
    console.error(`- ${item.file}: ${item.versions.join(', ')}`);
  }
}

if (noVersionRefs.length || mismatches.length) {
  process.exit(1);
}

console.log(`All site.js references use v=${EXPECTED_VERSION}.`);
