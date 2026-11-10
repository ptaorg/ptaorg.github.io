#!/usr/bin/env node
/** Copy only *already public* structured data from the existing checked-out site.
 * - data/research-map-index.json, data/board-responses.json: copied as-is
 * - data/journal-index.json: built from <title>/<meta>/JSON-LD of published journal/*.html
 * No private Gmail, unpublished PDFs, school attachments or user data are read or uploaded.
 * Usage: node scripts/sync-public-data.mjs /path/to/ptaorg.github.io
 */
import fs from 'node:fs';import path from 'node:path';import process from 'node:process';
const src=process.argv[2];if(!src){console.error('Usage: node scripts/sync-public-data.mjs <local-existing-site-repository>');process.exit(2)}
const dest=path.resolve(import.meta.dirname,'../data');const root=path.resolve(src,'data');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const m=read('research-map-index.json'),r=read('board-responses.json');
if(!Array.isArray(m.municipalities)||m.municipalities.length<1||!Array.isArray(r.responses))throw Error('Published dataset schema mismatch');
const total=m.municipalities.reduce((n,x)=>n+(x.schools||[]).length,0);
for(const region of m.municipalities){if(!region.id||!region.name||!region.prefecture)throw Error('Invalid municipality');for(const school of region.schools||[]){if(!/^\/archive\/[\w\/-]+\/$/.test(school.url))throw Error('Unexpected school URL: '+school.url)}}
for(const response of r.responses){if(response.url&&!response.url.startsWith('https://ptaorg.com/board-responses/'))throw Error('Unexpected board-response URL: '+response.url)}
for(const name of ['research-map-index.json','board-responses.json']){fs.copyFileSync(path.join(root,name),path.join(dest,name));}

// Journal index (titles and dates only; article bodies stay on ptaorg.com)
const journalDir=path.resolve(src,'journal');const articles=[];
const pick=(html,re)=>{const x=html.match(re);return x?x[1].trim():''};
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
for(const file of fs.readdirSync(journalDir).filter(f=>f.endsWith('.html'))){
  const html=fs.readFileSync(path.join(journalDir,file),'utf8');
  if(/http-equiv=["']refresh/i.test(html))continue;
  let title=decode(pick(html,/<title>([^<]*)<\/title>/i)).replace(/\s*[｜|]\s*PTA適正化推進委員会\s*$/,'').trim();
  if(!title||/移動します|統合されました|総覧|^重点論考/.test(title))continue;
  const published=pick(html,/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/)||pick(html,/article:published_time"\s+content="(\d{4}-\d{2}-\d{2})/);
  const modified=pick(html,/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
  const description=decode(pick(html,/<meta\s+name="description"\s+content="([^"]*)"/i));
  articles.push({title,url:`https://ptaorg.com/journal/${file}`,published:published||null,modified:modified||null,description});
}
articles.sort((a,b)=>String(b.published||b.modified||'').localeCompare(String(a.published||a.modified||'')));
fs.writeFileSync(path.join(dest,'journal-index.json'),JSON.stringify({source:'https://ptaorg.com/journal.html',note:'公開済み論考のタイトル・日付・説明文のみ。本文は ptaorg.com を正本とする。',articles},null,1)+'\n');
console.log(`Synced publicly hosted data only: ${m.municipalities.length} municipalities, ${total} indexed schools, ${r.responses.length} public response records, ${articles.length} journal articles.`);
console.log('Manual review required before any eventual production release; unreviewed document files were not imported.');
