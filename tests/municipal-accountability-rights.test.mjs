import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = p => fs.readFileSync(p,"utf8");
const framework=JSON.parse(read("ai-system/report-standards/institutional-rights-framework.json"));
const axes=JSON.parse(read("ai-system/report-standards/evaluation-axes.json"));
const all=JSON.parse(read("data/research-municipalities.json")).municipalities;
test("three independent responsibility layers preserve twelve observation axes",()=>{
 assert.equal(framework.version,"2.0.0");
 assert.deepEqual(framework.threeLayers.map(x=>x.id),["municipal_institutional","school_observation","rights_and_remedies"]);
 assert.equal(framework.schoolObservationAxesVersion,axes.version);
 assert.equal(axes.axes.length,12);
 assert.match(framework.legalOrder[0],/主体/);
 assert.match(framework.legalOrder[1],/事務/);
 assert.match(framework.legalOrder[2],/公法上の権限/);
 assert.match(framework.legalOrder[3],/61条/);
 assert.match(framework.legalOrder[4],/69条/);
});
test("constitutional rights are specific but not automatic infringement findings",()=>{
 for(const [id,ref] of [["individual_dignity","13条"],["association","21条"],["property","29条"],["privacy","61"],["equality_education","14"],["conscience","19"]]){
  const x=framework.rights.find(z=>z.id===id);
  assert.ok(x,id);assert.ok(x.law.includes(ref));assert.ok(x.publicTest&&x.privateRoute&&x.note);
 }
 assert.ok(framework.prohibitedShortcuts.some(x=>x.includes("私人PTA")));
});
test("institutional evidence differs between Osaki, Osaka and Ichinomiya",()=>{
 const a=Object.fromEntries(framework.municipalityCases.map(x=>[x.id,x]));
 assert.equal(a.osaki.status,"reviewed_source");assert.match(a.osaki.documentEvidence,/第19・20条/);
 assert.equal(a.osaka.status,"reviewed_source");assert.match(a.osaka.sourceUrl,/city.osaka.lg.jp/);
 assert.equal(a.ichinomiya.status,"not_yet_assessed");
 assert.match(a.ichinomiya.institutionFact,/未立証/);
 for(const c of framework.municipalityCases){
  assert.ok(c.institutionFact&&c.schoolFact&&c.openQuestions.length>=3&&c.rightsScope);
  const indexed=all.find(m=>m.id===c.id);
  assert.equal(indexed.institutionalReview.status,c.status);
  assert.equal(indexed.institutionalReview.source,c.sourceUrl);
  const html=read("research/"+c.id+".html");
  assert.match(html,/id="municipal-accountability-rights"/);
  assert.match(html,/https:\/\/laws\.e-gov\.go\.jp|\/pta-evaluation-method\.html#three-layers/);
 }
});
test("municipal standards and public method cross-link and keep permission caveats",()=>{
 const method=read("pta-evaluation-method.html");
 assert.match(method,/id="three-layers"/);
 for(const city of ["osaki","osaka","ichinomiya"])assert.ok(method.includes("/research/"+city+".html#municipal-accountability-rights"));
 assert.match(method,/私人PTA/);
 assert.match(read("ai-system/skills/municipal-school-report.md"),/v2\.0\.0 追加固定ゲート/);
 assert.match(read("ai-system/report-standards/templates/municipality-report.md"),/2A\. 自治体/);
});

test("every municipality carries a separate institutional assessment status without presuming compliance",()=>{
 assert.ok(all.length>=10); // all municipalities registered in research-municipalities.json
 for(const m of all){
  assert.ok(m.institutionalReview,m.id);
  assert.equal(m.institutionalReview.frameworkVersion,"2.0.0");
  assert.ok(framework.assessmentStatuses.includes(m.institutionalReview.status),m.id);
  assert.ok(m.institutionalReview.summary);
  if(m.institutionalReview.status==="not_yet_assessed")assert.match(m.institutionalReview.summary,/審査|未立証/);
 }
});

test("all researched municipality articles expose institutional responsibility and rights without automatic violations",()=>{
 for(const m of all){
  const html=read("research/"+m.id+".html");
  assert.match(html,/id="municipal-accountability-rights"/,m.id);
  assert.match(html,/13条|個人の尊重/,m.id);
  assert.match(html,/21条|結社の自由/,m.id);
  assert.match(html,/29条|財産権/,m.id);
  assert.match(html,/授権|権限/,m.id);
 }
});
