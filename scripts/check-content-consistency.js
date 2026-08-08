const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const forbidden = [
  { text: 'https://ptaorg.github.io/donate/', label: '旧寄付URL' },
  { text: '運営チェックアプリ', label: '旧運営チェック名称' },
];

const ignoredDirs = new Set(['.git', 'node_modules']);
const findings = [];
const COLLECTION_SCOPE = '76自治体・111件';
const SCOPE_PAGES = [
  'board-responses.html',
  'documents.html',
  'framework.html',
  'index.html',
  'support.html',
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.isFile() || path.extname(entry.name) !== '.html') continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const rule of forbidden) {
      if (text.includes(rule.text)) {
        findings.push(`${path.relative(root, full)}: ${rule.label} (${rule.text})`);
      }
    }
  }
}

walk(root);

const boardDataPath = path.join(root, 'data', 'board-responses.json');
const boardData = JSON.parse(fs.readFileSync(boardDataPath, 'utf8'));
const responses = Array.isArray(boardData.responses) ? boardData.responses : [];
const publishedScope = `${boardData.totalMunicipalities}自治体・${boardData.totalResponses}件`;

if (responses.length !== boardData.totalResponses) {
  findings.push(`data/board-responses.json: totalResponses=${boardData.totalResponses} と responses=${responses.length} が一致しません`);
}

for (const rel of SCOPE_PAGES) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!html.includes(COLLECTION_SCOPE)) {
    findings.push(`${rel}: 収集・分類総数 (${COLLECTION_SCOPE}) の表示がありません`);
  }
  if (!html.includes(publishedScope)) {
    findings.push(`${rel}: 本文公開版 (${publishedScope}) の表示がありません`);
  }
}

const boardHtml = fs.readFileSync(path.join(root, 'board-responses.html'), 'utf8');
const generatedDateParts = String(boardData.generatedAt || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
const generatedDate = generatedDateParts
  ? `${generatedDateParts[1]}年${Number(generatedDateParts[2])}月${Number(generatedDateParts[3])}日`
  : '';
if (!generatedDate || !boardHtml.includes(generatedDate)) {
  findings.push(`board-responses.html: データ生成日 (${boardData.generatedAt || '未設定'}) の表示がありません`);
}

if (findings.length) {
  console.error('Content consistency check failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Content consistency check passed.');
