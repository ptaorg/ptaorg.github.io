import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const req=createRequire(import.meta.url),{transform}=req('../scripts/phase4-update-cache.cjs');
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('newly modified CSS references use the phase4b cache version',()=>{
 for(const p of ['index.html','guide-board.html','guide-pta.html','guide-parent.html','membership.html','privacy.html','fee-collection.html','personnel.html','facilities.html','journal.html']){
  const html=read(p);assert.equal(transform(html),html,p+' stale');
 }
 assert.match(read('guide-board.html'),/css\/pages\/guide-board\.css\?v=20261113-phase4b/);
 assert.match(read('index.html'),/assets\/style\.css\?v=20261114-readable/);
});
