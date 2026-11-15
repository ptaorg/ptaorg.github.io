import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const enumerator=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isFile()&&d.name.endsWith('.html')?[path.join(dir,d.name)]:d.isDirectory()?enumerator(path.join(dir,d.name)):[]);
const routes=['index.html','research-map.html','pta-evaluation-method.html','contact.html','explore.html','national-archive.html',...enumerator('research'),...enumerator('journal'),...enumerator('archive/osaki'),...enumerator('archive/ichinomiya')].filter(p=>p.endsWith('.html'));
const meta=(head,k)=>{const tags=[...head.matchAll(/<meta\\b[^>]*>/gi)].map(x=>x[0]);return tags.filter(tag=>tag.includes('name="'+k+'"')||tag.includes('property="'+k+'"'));};
test('Shareable PTA pages carry one full X large-image card and Open Graph image',()=>{
  assert.ok(routes.length>=105,'unexpected sharing coverage');
  for(const route of routes){
    const html=fs.readFileSync(route,'utf8');
    const head=html.match(/<head\\b[^>]*>([\\s\\S]*?)<\\/head>/i)?.[1];
    assert.ok(head,route+': head');
    for(const k of ['og:title','og:description','og:url','og:image','twitter:card','twitter:title','twitter:description','twitter:image']){
      assert.equal(meta(head,k).length,1,route+' '+k);
    }
    assert.match(meta(head,'twitter:card')[0],/summary_large_image/,route);
    const src=meta(head,'twitter:image')[0].match(/content="([^"]+)"/)?.[1];
    assert.ok(src?.startsWith('https://'),route+': image absolute URL');
    if(src.startsWith('https://ptaorg.com/'))assert.ok(fs.existsSync(src.replace('https://ptaorg.com/','')),route+': local social image exists');
  }
});
test('Default social image is a valid sufficiently large PNG under 5MB',()=>{
 const image=fs.readFileSync('assets/og-image.png');
 assert.equal(image.subarray(1,4).toString('ascii'),'PNG');
 const width=image.readUInt32BE(16),height=image.readUInt32BE(20);
 assert.ok(width>=300&&height>=157,'X large image minimum unmet '+width+'x'+height);
 assert.ok(image.byteLength<=5_000_000,'X image size limit');
 console.log('Social image:',width+'x'+height,image.length+' bytes');
});
