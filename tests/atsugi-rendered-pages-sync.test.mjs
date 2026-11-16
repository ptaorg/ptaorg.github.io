import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

test('15 reviewed Atsugi school HTML files match their source JSON without altering unreviewed schools',()=>{
 const result=spawnSync(process.execPath,['scripts/generate-atsugi-reviewed-pages.cjs','--check'],{encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
 const summary=JSON.parse(result.stdout);
 assert.equal(summary.reviewed,15);
 assert.equal(summary.changed,0);
 assert.equal(summary.unreviewed,21);
});

test('Aikawa correction, Shimizu dual evaluation and Atsugi Daini additional form reach static HTML',()=>{
 const pairs=[
  ['aikawa-es','相川中学校'],
  ['shimizu-es','学校へのPTA会費集金委託同意'],
  ['atsugi-daini-es','2026年1月26日付']
 ];
 for(const [slug,needle] of pairs){
  const html=fs.readFileSync('archive/atsugi/'+slug+'/index.html','utf8');
  assert.ok(html.includes(needle),slug+': '+needle);
  for(let n=1;n<=10;n++)assert.ok(html.includes('id="sec-'+n+'"'),slug+': sec-'+n);
  assert.ok(html.includes('name="twitter:card"'),slug+': X card');
  assert.ok(html.includes('追加確認が必要'),slug+': review disclaimer');
 }
});
