import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('archive school hero and controls stay inside the document column',()=>{
 const css=read('assets/legacy-theme.css');
 const block=css.slice(css.lastIndexOf('/* Archive school reading cards | 2026-11-14'));
 assert.ok(block.length>600);
 assert.match(block,/\.archive-school-page > \.archive-hero\.legacy-hero-rest\s*\{[^}]*width:100%!important/);
 assert.match(block,/\.archive-school-page \.archive-grid\s*\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
 assert.match(block,/\.archive-grid > \.archive-box\s*\{[^}]*flex-direction:column/);
 assert.match(block,/@media\(max-width:760px\)/);
 assert.match(css,/\.archive-material-item > p\.archive-label,[\s\S]*?font-size:\.875rem!important/);
 const atsugi=read('archive/atsugi/echi-jhs/index.html');
 assert.match(atsugi,/class="archive-hero legacy-hero-rest"/);
 assert.match(atsugi,/class="archive-grid"/);
 assert.match(atsugi,/assets\/legacy-theme\.css/);
 const toyohashi=read('archive/toyohashi/school-009-es/index.html');
 assert.match(toyohashi,/assets\/legacy-theme\.css/);
});
