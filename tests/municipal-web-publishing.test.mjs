import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkPage,checkManifest} from '../scripts/validate-municipal-web.mjs';

const okHtml=`<!doctype html><html lang="ja"><head>
<title>厚木市のPTA総評</title>
<meta name="description" content="厚木市の制度について">
<link rel="canonical" href="https://ptaorg.com/research/atsugi.html">
<meta property="og:title" content="厚木市のPTA総評">
<meta property="og:description" content="厚木市の制度について">
<meta property="og:image" content="https://ptaorg.com/assets/og-image.png?card=latest">
<meta name="twitter:card" content="summary_large_image">
</head><body><section id="overview"><a href="#overview">総評</a></section></body></html>`;
const completeManifest=()=>({
 municipality:'厚木市',page:'research/atsugi.html',status:'verified',
 checks:Object.fromEntries(['v3LegalReview','originalContentPreserved','sourceReview','mapAndSchoolLinks','staticChecks','desktopBrowser','mobileBrowser','liveUrl','ogImageHttp','xPreview','humanApproval'].map(x=>[x,true])),
 evidence:{desktopBrowser:'screenshot desktop',mobileBrowser:'screenshot mobile',liveUrl:'observed response 200',ogImageHttp:'image HTTP 200',xPreview:'observed X card screenshot'}
});
test('valid static meta and local anchors',()=>{
 assert.equal(checkPage(okHtml).ok,true);
});
test('X meta set to summary_large_image with absolute HTTPS image',()=>{
 const bad=okHtml.replace('summary_large_image','summary');
 assert.ok(checkPage(bad).errors.some(e=>e.type==='TWITTER_CARD_INVALID'));
 const relative=okHtml.replace('https://ptaorg.com/assets/og-image.png?card=latest','/assets/og-image.png');
 assert.ok(checkPage(relative).errors.some(e=>e.type==='OG_IMAGE_NOT_ABSOLUTE'));
});
test('duplicate meta and duplicate anchors are hard failures',()=>{
 const bad=okHtml.replace('<meta name="twitter:card"', '<meta property="og:image" content="/bad.png"><meta name="twitter:card"');
 assert.ok(checkPage(bad).errors.some(e=>e.type==='META_CARDINALITY'));
 const duplicate=okHtml.replace('</section>','<b id="overview">重複</b></section>');
 assert.ok(checkPage(duplicate).errors.some(e=>e.type==='DUPLICATE_ANCHOR'));
});
test('broken in-page anchor detected and not silently ignored',()=>{
 const bad=okHtml.replace('href="#overview"','href="#missing"');
 assert.ok(checkPage(bad).warnings.some(e=>e.type==='BROKEN_INPAGE_ANCHOR'));
});
test('publication cannot be verified just because GitHub commit succeeded',()=>{
 const m=completeManifest();m.checks.liveUrl=false;m.evidence.liveUrl='';
 const r=checkManifest(m);assert.equal(r.ok,false);
 assert.ok(r.errors.includes('NOT_VERIFIED:liveUrl'));
 assert.ok(r.errors.includes('FALSE_VERIFIED_STATUS'));
});
test('X card metadata alone is not live X preview verification',()=>{
 const m=completeManifest();m.evidence.xPreview='';
 assert.ok(checkManifest(m).errors.includes('MISSING_EVIDENCE:xPreview'));
});
test('v3 legal gate, source conservation and browser QA are mandatory',()=>{
 const m=completeManifest();
 for(const key of ['v3LegalReview','originalContentPreserved','sourceReview','desktopBrowser','mobileBrowser','mapAndSchoolLinks']){
  const n=structuredClone(m);n.checks[key]=false;
  assert.ok(checkManifest(n).errors.includes('NOT_VERIFIED:'+key),key);
 }
});
test('workflow references v3 and real visual/root cause checks',()=>{
 const skill=fs.readFileSync('ai-system/skills/municipal-web-publishing.md','utf8');
 for(const phrase of ['municipal-assessment-v3.md','Computed Style','Xの投稿画面','生成元','学校名','320px','1440px','!important','デプロイ後'])assert.ok(skill.includes(phrase),phrase);
 const entry=fs.readFileSync('.agents/skills/pta-municipal-school-report/SKILL.md','utf8');
 assert.match(entry,/municipal-web-publishing\.md/);
 const registry=JSON.parse(fs.readFileSync('ai-system/SKILL_REGISTRY.json','utf8'));
 assert.ok(registry.skills.some(s=>s.id==='municipal-web-publishing'));
});
