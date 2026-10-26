const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { ROOT, listSchoolData } = require('./archive-utils');

// Small validator for the vocabulary used by the checked-in JSON Schema.
// Reference integrity is checked separately below; no network lookup is needed.
function validateSchema(value, schema, at = '$') {
  if (schema.const !== undefined) assert.deepEqual(value, schema.const, at);
  if (schema.enum) assert.ok(schema.enum.includes(value), `${at}: unsupported value`);
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    assert.ok(types.includes(actual), `${at}: expected ${types.join('/')}, got ${actual}`);
  }
  if (typeof value === 'string' && schema.pattern) assert.match(value, new RegExp(schema.pattern), at);
  if (typeof value === 'string' && schema.minLength) assert.ok(value.trim().length >= schema.minLength, `${at}: empty string`);
  if (Array.isArray(value)) {
    if (schema.minItems) assert.ok(value.length >= schema.minItems, `${at}: too few items`);
    if (schema.maxItems) assert.ok(value.length <= schema.maxItems, `${at}: too many items`);
    value.forEach((v, i) => validateSchema(v, schema.items || {}, `${at}[${i}]`));
  }
  if (value && !Array.isArray(value) && typeof value === 'object') {
    for (const key of schema.required || []) assert.ok(Object.hasOwn(value, key), `${at}: missing ${key}`);
    for (const [key, sub] of Object.entries(schema.properties || {})) if (Object.hasOwn(value, key)) validateSchema(value[key], sub, `${at}.${key}`);
  }
}
function checkUrl(url, at) {
  assert.ok(!/drive\.google\.com|docs\.google\.com|file:|[A-Z]:\\|\\\\|\.\./i.test(url), `${at}: private/internal location`);
  assert.ok(url.startsWith('/') || /^https:\/\//.test(url), `${at}: unsafe URL`);
  if (url.startsWith('/')) {
    const file = decodeURI(url.split(/[?#]/)[0]);
    const resolved = path.join(ROOT, file, file.endsWith('/') ? 'index.html' : '');
    assert.ok(fs.existsSync(resolved), `${at}: missing ${url}`);
    const anchor = url.split('#')[1];
    if (anchor && resolved.endsWith('.html')) {
      const html = fs.readFileSync(resolved, 'utf8');
      assert.ok(html.includes(`id="${anchor}"`) || html.includes(`id='${anchor}'`), `${at}: missing anchor ${anchor}`);
    }
  }
}
function validateData(data, checkFiles = true) {
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/schema/research-municipalities.schema.json'), 'utf8'));
  validateSchema(data, schema);
  const ids = new Set();
  const jurisdictions = new Set();
  for (const m of data.municipalities) {
    assert.match(m.id, /^[a-z][a-z0-9-]*$/, `${m.id}: stable ID`);
    assert.ok(!ids.has(m.id), `duplicate ID ${m.id}`); ids.add(m.id);
    const key = `${m.prefecture}|${m.schoolMunicipality}`;
    assert.ok(!jurisdictions.has(key), `duplicate jurisdiction ${key}`); jurisdictions.add(key);
    assert.match(m.prefectureCode, /^(0[1-9]|[1-3][0-9]|4[0-7])$/);
    assert.equal(m.url, `/research/${m.id}.html`);
    assert.ok(m.coordinates.every(Number.isFinite));
    assert.ok(m.coordinates[0] >= 20 && m.coordinates[0] <= 46 && m.coordinates[1] >= 122 && m.coordinates[1] <= 154, `${m.id}: outside Japan representative bounds`);
    assert.match(m.updated, /^\d{4}-\d{2}-\d{2}$/);
    const legalOrder = [/主体/, /事務.*帰属/, /所掌事務|権限/, /61条/, /69条/, /会計|服務/, /総合評価/];
    m.legal.forEach((item, i) => assert.match(item.title, legalOrder[i], `${m.id}: legal analysis order ${i + 1}`));
    const sourceIds = new Set(m.sources.map(s => s.id));
    assert.equal(sourceIds.size, m.sources.length, `${m.id}: duplicate source ID`);
    for (const t of m.timeline) assert.ok(sourceIds.has(t.sourceId), `${m.id}: unknown timeline source ${t.sourceId}`);
    if (checkFiles) {
      checkUrl(m.url, m.id);
      for (const source of [...m.sources, ...m.articles]) checkUrl(source.url, `${m.id}/${source.title}`);
    }
  }
  for (const m of data.municipalities) for (const id of m.comparisons) assert.ok(ids.has(id) && id !== m.id, `${m.id}: invalid comparison ${id}`);
  return data;
}
function main() {
  const data = validateData(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/research-municipalities.json'), 'utf8')));
  const schools = listSchoolData();
  const { buildIndex } = require('./generate-research-map');
  const index = buildIndex(data, schools);
  const indexedSchools = index.municipalities.flatMap(m => m.schools);
  assert.equal(indexedSchools.length, schools.length, 'every existing school must remain indexed');
  assert.equal(new Set(indexedSchools.map(s => s.url)).size, schools.length, 'no duplicate school entries');
  for (const school of schools) {
    const owner = index.municipalities.find(m => m.schools.some(s => s.url === school.basePath));
    assert.equal(owner.prefecture, school.prefecture);
    assert.equal(owner.schoolMunicipality || owner.name, school.municipality, 'school authority must not change');
    const indexed = owner.schools.find(s => s.url === school.basePath);
    if (school.pageMode === 'materials') assert.deepEqual(indexed.documents, school.documents.map(d => ({ title: d.title, status: d.publicationStatus })), 'document titles/publication states must remain unchanged');
    checkUrl(school.basePath, school.schoolName);
  }
  const matched = schools.filter(s => data.municipalities.some(m => s.prefecture === m.prefecture && s.municipality === m.schoolMunicipality));
  assert.equal(new Set(schools.map(s => s.basePath)).size, schools.length, 'school URLs must be unique');
  console.log(`Research schema/references: ${data.municipalities.length} jurisdictions; ${matched.length}/${schools.length} existing school records linked by exact prefecture + governing municipality.`);
}
if (require.main === module) main();
module.exports = { validateSchema, validateData, checkUrl };
