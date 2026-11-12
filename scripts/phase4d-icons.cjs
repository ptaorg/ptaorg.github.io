#!/usr/bin/env node
// Phase 4D: replace ONLY icon-only check/cross glyphs in two authored UI diagrams.
// We do not alter any adjacent legal prose, blockquote, original document or script.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const TARGETS=['guide-board.html','guide-pta.html'];
const CLASSES=new Set([
 'u-ac08073e64','u-9af90c1b8c','u-45247e925b',
 'scope-ok-dot','scope-ng-dot','u-4eae02cf40',
 'u-d80273a5ad','u-29145437e0','u-00625d1adf',
 'u-2f296362f6','ci-dot-ng','ci-dot-ok'
]);
const single=/<(span|div)\b([^>]*\bclass="([^"]+)"[^>]*)>(\s*)([✓✗📄📋✅❌])(\s*)<\/\1>/g;
const ICON={
 '✓':{label:'チェック印',paths:'<path d="M20 6 9 17 4 12"/>'},
 '✗':{label:'バツ印',paths:'<path d="M18 6 6 18"/><path d="M6 6 18 18"/>'}
};
function protectedContext(source,at){
 for(const tag of ['blockquote','pre','code','q','cite','textarea','script','style']){
  // These elements contain literal documents or code. Never edit their content.
  const open=source.slice(0,at).lastIndexOf('<'+tag);
  const close=source.slice(0,at).lastIndexOf('</'+tag);
  if(open>close)return tag;
 }
 return '';
}
function transform(source,rel){
 if(!TARGETS.includes(rel))throw Error('Target is outside approved UI pages: '+rel);
 let count=0;
 const out=source.replace(single,(whole,tag,attrs,cls,before,char,after,offset)=>{
  if(!CLASSES.has(cls)||!ICON[char])return whole;
  const inProtected=protectedContext(source,offset);
  if(inProtected)throw Error('Refusing to change glyph within '+inProtected+' at '+rel+' '+offset);
  if(/\b(?:role|aria-label)\s*=/.test(attrs))throw Error('Existing accessibility label in '+rel+' '+cls);
  count++;
  const icon=ICON[char];
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icon.paths+'</svg>';
  return '<'+tag+attrs+' role="img" aria-label="'+icon.label+'">'+before+svg+after+'</'+tag+'>';
 });
 return {out,count};
}
function main(){
 const check=process.argv.includes('--check');
 const output=[];
 for(const rel of TARGETS){
  const pathName=path.join(root,rel),source=fs.readFileSync(pathName,'utf8');
  const v=transform(source,rel);
  output.push({file:rel,converted:v.count,changed:v.out!==source});
  if(!check&&v.out!==source)fs.writeFileSync(pathName,v.out,'utf8');
 }
 console.log('Phase 4D standalone pictogram conversion:',JSON.stringify(output));
 if(check&&output.some(x=>x.changed))throw Error('Standalone pictograms have not been regenerated');
}
if(require.main===module)main();
module.exports={TARGETS,CLASSES,transform};
