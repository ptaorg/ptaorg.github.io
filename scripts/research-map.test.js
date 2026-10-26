const test = require('node:test');
const assert = require('node:assert/strict');
const { buildIndex } = require('./generate-research-map');
const { validateSchema } = require('./check-research-map');

test('same-name schools retain separate prefectural and municipal governing bodies', () => {
  const municipality = (id, prefecture, name) => ({ id, prefecture, name, schoolMunicipality: name, themes: [], flags: {} });
  const data = { updated: '2026-10-26', municipalities: [municipality('hiroshima', '広島県', '広島市'), municipality('hiroshima-pref', '広島県', '広島県'), municipality('sendai', '宮城県', '仙台市')] };
  const school = (prefecture, municipality, url) => ({ prefecture, municipality, schoolName: '広瀬小学校', schoolType: '小学校', basePath: url, citySlug: 'fixture', materials: {} });
  const index = buildIndex(data, [school('広島県', '広島市', '/archive/hiroshima/hirose/'), school('宮城県', '仙台市', '/archive/sendai/hirose/'), school('広島県', '広島県', '/archive/pref/hirose/')]);
  assert.deepEqual(index.municipalities.map(m => m.schools.map(s => s.url)), [['/archive/hiroshima/hirose/'], ['/archive/pref/hirose/'], ['/archive/sendai/hirose/']]);
});

test('school-only jurisdiction without coordinates remains listed', () => {
  const index = buildIndex({ updated: '2026-10-26', municipalities: [] }, [{ prefecture: '北海道', municipality: '未登録市', schoolName: '第一小学校', schoolType: '小学校', basePath: '/archive/example/first/', citySlug: 'unknown', materials: {} }]);
  assert.equal(index.municipalities.length, 1);
  assert.equal(index.municipalities[0].coordinates, null);
  assert.equal(index.municipalities[0].schools[0].url, '/archive/example/first/');
  assert.equal(index.municipalities[0].url, null);
});

test('schema rejects unknown status flags rather than accepting truthy strings', () => {
  assert.throws(() => validateSchema('false', { enum: ['confirmed', 'unconfirmed'] }));
});

test('legacy prefecture-prefixed municipality groups all schools under one authority', () => {
  const school = (slug) => ({ prefecture: '滋賀県', municipality: '滋賀県甲賀市', schoolName: slug, schoolType: '小学校', basePath: `/archive/koka/${slug}/`, citySlug: 'koka', materials: {} });
  const index = buildIndex({ updated: '2026-10-26', municipalities: [] }, [school('first'), school('second')]);
  assert.equal(index.municipalities.length, 1);
  assert.equal(index.municipalities[0].schoolMunicipality, '滋賀県甲賀市');
  assert.equal(index.municipalities[0].schools.length, 2);
});

test('legacy catalog-only regions remain accessible without duplicate research region', () => {
  const region = {id:'example',prefecture:'神奈川県',name:'横浜市',schoolMunicipality:'横浜市',themes:[],flags:{}};
  const legacy = [{...region,id:'catalog-example',catalogUrl:'/national-archive.html#national-list'}, {id:'catalog-sendai',prefecture:'宮城県',name:'仙台市',schoolMunicipality:'仙台市',themes:[],flags:{},schools:[],catalogUrl:'/national-archive.html#national-list'}];
  const index=buildIndex({updated:'2026-10-26',municipalities:[region]},[],legacy);
  assert.equal(index.municipalities.length,2);
  assert.equal(index.municipalities[0].id,'example');
  assert.equal(index.municipalities[1].catalogUrl,'/national-archive.html#national-list');
  assert.equal(index.municipalities[1].prefectureCode,'04');
});
