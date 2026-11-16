#!/usr/bin/env node
// Read-only static QA for municipality page publishing. Browser and X preview are separate.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const trim=s=>(s||'').trim();
function getTags(html){
 const list=[...html.matchAll(/<meta\s+[^>]*>/gi)].map(m=>m[0]);
 const attr=(tag,key)=>{const m=tag.match(new RegExp('(?:\\s|^)'+key+'\\s*=\\s*(["\x27])([\\s\\S]*?)\\1','i'));return m?m[2]:''};
 return list.map(tag=>({key:attr(tag,'property')||attr(tag,'name'),value:attr(tag,'content')}));
}
export function checkPage(html,{pagePath='',root=ROOT}={}){
 const errors=[],warnings=[],details={};
 const fail=(type,reason)=>errors.push({type,reason});
 const warn=(type,reason)=>warnings.push({type,reason});
 const tags=getTags(html);
 const find=name=>tags.filter(t=>t.key.toLowerCase()===name.toLowerCase()).map(t=>trim(t.value));
 const one=name=>{const a=find(name);if(a.length!==1)fail('META_CARDINALITY',name+': '+a.length);return a[0]||''};
 const title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()||'';
 if(!title)fail('TITLE_REQUIRED','title is blank');
 const desc=one('description');
 const canonical=html.match(/<link\s+[^>]*rel=["\x27]canonical["\x27][^>]*>/i)?.[0]||'';
 const href=canonical.match(/href=["\x27]([^"\x27]+)["\x27]/i)?.[1]||'';
 if(!/^https:\/\/ptaorg\.com\//.test(href))fail('CANONICAL_INVALID',href);
 if(!desc)fail('DESCRIPTION_REQUIRED','description missing');
 const ogTitle=one('og:title'),ogDesc=one('og:description'),ogImg=one('og:image'),card=one('twitter:card');
 if(!ogTitle||!ogDesc)fail('OG_TEXT_REQUIRED','og title or description missing');
 if(card!=='summary_large_image')fail('TWITTER_CARD_INVALID',card);
 if(!/^https:\/\//.test(ogImg))fail('OG_IMAGE_NOT_ABSOLUTE',ogImg);
 if(ogImg.includes(' '))fail('OG_IMAGE_SPACE',ogImg);
 if(ogImg&&/^https:\/\/ptaorg\.com\//.test(ogImg)){
   const asset=new URL(ogImg).pathname;
   const candidate=path.join(root,asset.replace(/^\//,''));
   if(!fs.existsSync(candidate))warn('OG_IMAGE_NOT_IN_REPOSITORY',asset);
 }
 if(find('og:image:width').length&&(!/^\d+$/.test(find('og:image:width')[0])))fail('OG_IMAGE_WIDTH_INVALID','width must be integer');
 if(find('og:image:height').length&&(!/^\d+$/.test(find('og:image:height')[0])))fail('OG_IMAGE_HEIGHT_INVALID','height must be integer');
 const ids=[...html.matchAll(/\bid=["\x27]([^"\x27]+)["\x27]/g)].map(x=>x[1]);
 const seen=new Set();for(const id of ids){if(seen.has(id))fail('DUPLICATE_ANCHOR',id);seen.add(id)}
 const links=[...html.matchAll(/<a\s+[^>]*href=["\x27]([^"\x27]+)["\x27]/gi)].map(m=>m[1]);
 for(const href2 of links){
   if(href2.startsWith('#')&&href2.length>1&&!seen.has(decodeURIComponent(href2.slice(1))))warn('BROKEN_INPAGE_ANCHOR',href2);
   if(href2.startsWith('/research/')||href2.startsWith('/archive/')||href2.startsWith('/assets/')){
     const target=href2.split(/[?#]/)[0];const local=path.join(root,target.slice(1));
     if(!fs.existsSync(local))warn('UNRESOLVED_LOCAL_LINK',href2);
   }
 }
 if(/(?:<style\b|\sstyle=|<link[^>]+stylesheet)/i.test(html)===false)warn('STYLE_NOT_REFERENCED','no CSS detected');
 details.pagePath=pagePath;details.title=title;details.canonical=href;details.ogImage=ogImg;details.card=card;details.anchorCount=ids.length;details.linkCount=links.length;
 return {ok:errors.length===0,errors,warnings,details};
}
const requiredStages=['v3LegalReview','originalContentPreserved','sourceReview','mapAndSchoolLinks','staticChecks','desktopBrowser','mobileBrowser','liveUrl','ogImageHttp','xPreview','humanApproval'];
export function checkManifest(m){
 const errors=[],warnings=[];
 if(!m||!m.municipality||!m.page)errors.push('MANIFEST_IDENTITY');
 for(const k of requiredStages)if(m?.checks?.[k]!==true)errors.push('NOT_VERIFIED:'+k);
 for(const key of ['desktopBrowser','mobileBrowser','liveUrl','ogImageHttp','xPreview']){
  if(m?.checks?.[key]===true&&!m?.evidence?.[key])errors.push('MISSING_EVIDENCE:'+key);
 }
 if(m?.status==='verified'&&errors.length)errors.push('FALSE_VERIFIED_STATUS');
 if(m?.status==='verified'&&m?.checks?.xPreview!==true)errors.push('X_PREVIEW_UNVERIFIED');
 if(!['draft','published_unverified','verified'].includes(m?.status))errors.push('STATUS_INVALID');
 return {ok:errors.length===0,errors,warnings};
}
function main(argv){
 if(!argv[0]){console.error('Usage: node scripts/validate-municipal-web.mjs research/<city>.html [--manifest private.json]');process.exitCode=1;return;}
 const page=path.resolve(ROOT,argv[0]);
 if(!page.startsWith(ROOT+path.sep)||!fs.existsSync(page)){console.error('Invalid or missing page');process.exitCode=1;return;}
 const result=checkPage(fs.readFileSync(page,'utf8'),{pagePath:argv[0]});
 const i=argv.indexOf('--manifest');
 if(i>=0){if(!argv[i+1]){console.error('Missing manifest path');process.exitCode=1;return;}result.manifest=checkManifest(JSON.parse(fs.readFileSync(argv[i+1],'utf8')));}
 console.log(JSON.stringify(result,null,2));
 if(!result.ok||result.manifest&&!result.manifest.ok)process.exitCode=2;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main(process.argv.slice(2));
