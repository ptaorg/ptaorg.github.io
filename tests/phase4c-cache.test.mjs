import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);
const {transform,phase4c}=req('../scripts/phase4-update-cache.cjs');
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('maintained CSS uses phase4c version without downgrading newer release asset tags',()=>{
 assert.ok(phase4c.size>=30);
 for(const p of ['index.html','guide-board.html','membership.html','law-map.html','about.html','archive/ota/school-001-es/index.html']){
  assert.equal(transform(read(p)),read(p),p+' has stale stylesheet query');
 }
 assert.match(read('law-map.html'),/css\/pages\/law-map\.css\?v=20261113-phase4c/);
 assert.match(read('guide-board.html'),/css\/pages\/guide-board\.css\?v=20261113-phase4b/);
});
