#!/usr/bin/env node
/** Copy partials/header.html and partials/footer.html into every page between
 *  <!-- chrome:header --> … <!-- /chrome:header --> and the footer markers.
 *  One source for the shared header/footer; pages stay plain static HTML.
 *  Usage: node scripts/render-chrome.mjs [--check]
 */
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
export const PAGES=['index.html','explore.html','municipality.html','school.html'];
const part=name=>fs.readFileSync(path.join(root,'partials',`${name}.html`),'utf8').trim();
export function render(html){
  for(const name of ['header','footer']){
    const re=new RegExp(`(<!-- chrome:${name} -->)[\\s\\S]*?(<!-- /chrome:${name} -->)`);
    if(!re.test(html))throw Error(`missing chrome:${name} markers`);
    html=html.replace(re,(_,a,b)=>`${a}\n${part(name)}\n${b}`);
  }
  return html;
}
if(import.meta.url===`file://${process.argv[1]}`){
  const check=process.argv.includes('--check');let stale=[];
  for(const page of PAGES){const file=path.join(root,page);const before=fs.readFileSync(file,'utf8');const after=render(before);
    if(before!==after){if(check)stale.push(page);else fs.writeFileSync(file,after);}}
  if(check&&stale.length){console.error('Out of date: '+stale.join(', ')+' — run npm run chrome');process.exit(1);}
  console.log(check?'chrome up to date':'chrome rendered into '+PAGES.length+' pages');
}
