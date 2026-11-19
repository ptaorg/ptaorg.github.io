import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path,'utf8');

test('responsive audit covers two municipal reports across five practical widths',()=>{
  const script=read('scripts/visual-audit.mjs');
  const smoke=read('.github/workflows/responsive-visual-audit.yml');
  const full=read('.github/workflows/full-responsive-audit.yml');
  for(const width of [1440,1024,768,390,360]) assert.ok(script.includes('width: '+width), 'missing width '+width);
  for(const path of ['yokohama-pta-fee-20261102.html','shimosuwa-pta-20261118.html','research-map.html'])
    assert.ok(smoke.includes('/'+path),path);
  assert.match(smoke,/PTA_VISUAL_AUDIT_VIEWPORTS: desktop,laptop,tablet,mobile,small/);
  assert.match(full,/PTA_VISUAL_AUDIT_VIEWPORTS: desktop,laptop,tablet,mobile,small/);
  assert.match(full,/'assets\/\*\*\/\*\.css'/);
  for(const feature of ['brokenImages','escapedMedia','textClipping','smallTargets','leftMargin','rightMargin'])
    assert.ok(script.includes(feature),'missing visual check '+feature);
  assert.match(script,/parentClass:String\(el\.parentElement\?\.className/);
  assert.match(script,/smallTargetExamples:/);
});

test('published card descriptions remain readable instead of being line-clamped',()=>{
  for(const [file,selector] of [
    ['assets/journal-unified.css','.journal-card__excerpt'],
    ['css/research-map-redesign.css','.research-region-description'],
    ['assets/style.css','.row-body p']
  ]){
    const css=read(file);
    const start=css.indexOf(selector);
    assert.ok(start>=0,file+': missing '+selector);
    const segment=css.slice(start,start+550);
    assert.match(segment,/overflow:visible/);
  }
});

test('municipal research articles expose accessible touch-sized navigation',()=>{
  for(const [file,scope] of [
    ['yokohama-pta-fee-20261102.html','.yf-page'],
    ['shimosuwa-pta-20261118.html','.sf-page']
  ]){
    const html=read(file);
    assert.match(html,/aria-label="パンくず"/,file+': breadcrumb');
    assert.match(html,/aria-label="記事の目次"/,file+': table of contents');
    assert.match(html,/min-height:44px/,file+': touch target');
    assert.match(html,/a:focus-visible/,file+': keyboard focus');
    assert.ok(html.includes(scope),file+': page scope');
  }
});

test('global and legacy navigation links have minimum 44px touch areas',()=>{
  const modern=read('assets/style.css');
  const legacy=read('assets/legacy-theme.css');
  for(const selector of ['.brand{min-height:44px}','.nav-trigger,.nav-search,.nav-cta{min-height:44px}','.nav-panel a{min-height:44px;display:flex;align-items:center}','.site-footer a{min-height:44px}'])
    assert.ok(modern.includes(selector),'modern nav: '+selector);
  for(const selector of ['.legacy .logo{min-height:44px}','.legacy .nav-link{display:inline-flex;align-items:center;min-height:44px}','.legacy .breadcrumb a'])
    assert.ok(legacy.includes(selector),'legacy nav: '+selector);
});

test('archive breadcrumb links provide 44px touch targets',()=>{
  const css=read('assets/style.css');
  assert.match(css,/\.breadcrumb ol\{align-items:center\}/);
  assert.match(css,/\.breadcrumb li\{display:flex;align-items:center\}/);
  assert.match(css,/\.breadcrumb a\{display:inline-flex;align-items:center;min-height:44px/);
  const archive=read('archive/atsugi/aikawa-jhs/index.html');
  assert.match(archive,/<nav class="breadcrumb" aria-label="パンくず">/);
});

test('Ichi-no-miya school archive navigation has 44px touch targets',()=>{
  const css=read('assets/ichinomiya-parent-report.css');
  assert.match(css,/\.bar nav a\{display:inline-flex;align-items:center;min-height:44px/);
  const archive=read('archive/ichinomiya/hagiwara-es/index.html');
  for(const href of ['/research-map.html','/research/ichinomiya.html','/contact.html'])
    assert.ok(archive.includes(href),'missing archive navigation destination '+href);
});
