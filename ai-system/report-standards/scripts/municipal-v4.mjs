#!/usr/bin/env node
/**
 * PTA municipal investigation v4.0: offline, deterministic evidence/run ledger.
 * Never logs into Gmail/Drive, downloads unknown attachments, or publishes.
 * This tool verifies the hand-off of authorized external retrieval results.
 * It does not replace v3 legal review, the 12-axis/10-document validators or human approval.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'../../..');
const PHASES=['scope','discover','retrieve','inspect','image','assess','review','web'];
const CHANNELS=['gmail','drive','official','archive','local','github'];
const OUTCOMES=['retrieved','access_denied','not_found','unsupported','rate_limited','failed','not_attempted'];
const SHA=/^[a-f0-9]{64}$/i;
const ID=/^[a-z0-9][a-z0-9._-]*$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clean=v=>typeof v==='string'&&v.trim().length>0;
const unique=a=>new Set(a).size===a.length;
const sha256=buf=>createHash('sha256').update(buf).digest('hex');
function validate(d,{baseDir='.',checkBytes=false}={}){
 const errors=[],warnings=[],missing=[];
 const fail=(code,at,detail)=>errors.push({code,at,detail});
 if(!isObj(d))return {ok:false,errors:[{code:'ROOT',at:'$',detail:'object required'}],warnings,missing,readyForReview:false,readyForPublication:false};
 if(d.schemaVersion!=='4.0.0')fail('VERSION','$.schemaVersion','expected 4.0.0');
 if(!clean(d.municipality)||!DATE.test(d.asOf||''))fail('METADATA','$','municipality and ISO date required');
 if(!Array.isArray(d.schoolIds)||!d.schoolIds.length||!unique(d.schoolIds)||d.schoolIds.some(s=>!ID.test(s)))fail('SCHOOL_ROSTER','$.schoolIds','unique nonempty canonical roster required');
 const schoolSet=new Set(d.schoolIds||[]);
 const phaseValues=['not_started','in_progress','blocked','complete'];
 if(!isObj(d.phases))fail('PHASES','$.phases','phase states required');
 else for(const phase of PHASES)if(!phaseValues.includes(d.phases[phase]))fail('PHASE_STATUS','$.phases.'+phase,'invalid/missing phase status');
 const attempts=Array.isArray(d.retrievalAttempts)?d.retrievalAttempts:[];
 const artifacts=Array.isArray(d.artifacts)?d.artifacts:[];
 const clips=Array.isArray(d.clips)?d.clips:[];
 const evaluations=Array.isArray(d.schoolAssessments)?d.schoolAssessments:[];
 const targets=Array.isArray(d.targets)?d.targets:[];
 for(const key of ['retrievalAttempts','artifacts','clips','schoolAssessments','targets'])if(!Array.isArray(d[key]))fail('ARRAY','$. '+key,'array required');
 const aIds=new Set(),artIds=new Set(),targetIds=new Set();
 for(const [i,t] of targets.entries()){
  const at='$.targets['+i+']';
  if(!clean(t.id)||targetIds.has(t.id))fail('TARGET_ID',at,'unique target id required');
  targetIds.add(t.id);
  if(!clean(t.description)||!['gmail','drive','official','archive','local','github'].includes(t.sourceChannel))fail('TARGET_DETAILS',at,'description and sourceChannel required');
  if(t.schoolId!==null&&t.schoolId!==undefined&&!schoolSet.has(t.schoolId))fail('TARGET_SCHOOL',at,'outside roster');
  if(!['pending','attempted','retrieved','blocked','exhausted'].includes(t.state))fail('TARGET_STATE',at,'invalid target state');
 }
 for(const [i,a] of attempts.entries()){
  const at='$.retrievalAttempts['+i+']';
  if(!clean(a.id)||aIds.has(a.id))fail('ATTEMPT_ID',at,'unique attempt id required');
  aIds.add(a.id);
  if(!targetIds.has(a.targetId))fail('ATTEMPT_TARGET',at,'unknown target id');
  if(!CHANNELS.includes(a.channel)||!OUTCOMES.includes(a.outcome)||!DATE.test(a.at||''))fail('ATTEMPT_METADATA',at,'channel, outcome, date required');
  if(!clean(a.method)||!clean(a.evidenceLocation))fail('ATTEMPT_PROVENANCE',at,'method and provider evidence ID/URL required');
  if(a.outcome!=='retrieved'&&!clean(a.reason))fail('ATTEMPT_REASON',at,'non-success needs concrete error/limitation');
 }
 for(const [i,t] of targets.entries()){
  const own=attempts.filter(a=>a.targetId===t.id);
  const got=own.some(a=>a.outcome==='retrieved');
  if(t.state==='retrieved'&&!got)fail('TARGET_UNPROVEN','$.targets['+i+']','successful attempt required');
  if(t.state==='exhausted'&&(!own.length||!clean(t.exhaustionReason)))fail('EXHAUSTION_UNPROVEN','$.targets['+i+']','attempt and documented exhaustion required');
  if(t.state==='blocked'&&!own.length)fail('BLOCK_UNPROVEN','$.targets['+i+']','attempt required');
  if(['pending','attempted','blocked'].includes(t.state))missing.push('target:'+t.id);
 }
 for(const [i,a] of artifacts.entries()){
  const at='$.artifacts['+i+']';
  if(!clean(a.id)||artIds.has(a.id))fail('ARTIFACT_ID',at,'unique artifact id required');
  artIds.add(a.id);
  if(!targetIds.has(a.targetId))fail('ARTIFACT_TARGET',at,'unknown target');
  if(a.schoolId!==null&&a.schoolId!==undefined&&!schoolSet.has(a.schoolId))fail('ARTIFACT_SCHOOL',at,'not in roster');
  if(!['school_internal','official_registry','supplement','municipal_rule','other'].includes(a.evidenceClass))fail('ARTIFACT_CLASS',at,'evidence category required');
  if(!['metadata_only','bytes_verified','text_verified','image_verified'].includes(a.verification))fail('ARTIFACT_VERIFICATION',at,'unsupported verification state');
  if(!clean(a.title)||!clean(a.sourceUrl)&&!clean(a.providerId))fail('ARTIFACT_SOURCE',at,'title and source ID/URL required');
  if(['bytes_verified','text_verified','image_verified'].includes(a.verification)&&!SHA.test(a.sha256||''))fail('ARTIFACT_HASH',at,'verified bytes require SHA-256');
  if(['text_verified','image_verified'].includes(a.verification)&&(!clean(a.locator)||!clean(a.excerpt)))fail('ARTIFACT_TEXT',at,'page/section locator and observed excerpt required');
  if(checkBytes&&clean(a.localPath)&&SHA.test(a.sha256||'')){
    const file=path.resolve(baseDir,a.localPath);
    if(!file.startsWith(path.resolve(baseDir)+path.sep))fail('UNSAFE_PATH',at,'path outside evidence root');
    else if(!fs.existsSync(file))fail('MISSING_FILE',at,'underlying bytes not found');
    else if(sha256(fs.readFileSync(file))!==a.sha256.toLowerCase())fail('HASH_MISMATCH',at,'original bytes changed');
  }
 }
 const artById=new Map(artifacts.map(a=>[a.id,a]));
 for(const [i,c] of clips.entries()){
  const at='$.clips['+i+']',original=artById.get(c.artifactId);
  if(!original)fail('CLIP_SOURCE',at,'unknown original artifact');
  if(!clean(c.path)||!SHA.test(c.sha256||''))fail('CLIP_HASH',at,'clip path/hash required');
  if(!Number.isInteger(c.page)||c.page<1||!Array.isArray(c.crop)||c.crop.length!==4||c.crop.some(x=>!Number.isFinite(x)||x<0)||c.crop[2]<=c.crop[0]||c.crop[3]<=c.crop[1])fail('CROP_COORDINATES',at,'page and [x0,y0,x1,y1] required');
  if(!['adopted','held','rejected'].includes(c.decision))fail('CLIP_DECISION',at,'explicit adoption decision required');
  if(!clean(c.claim)||!clean(c.reason))fail('CLIP_CLAIM',at,'specific claim and decision reason required');
  if(c.decision==='adopted'&&original?.verification!=='text_verified'&&original?.verification!=='image_verified')fail('CLIP_UNVERIFIED_ORIGINAL',at,'only text/image-verified originals may be adopted');
  if(checkBytes&&clean(c.path)){
    const file=path.resolve(baseDir,c.path);
    if(!file.startsWith(path.resolve(baseDir)+path.sep))fail('UNSAFE_PATH',at,'path outside evidence root');
    else if(!fs.existsSync(file))fail('MISSING_CLIP',at,'clip bytes missing');
    else if(SHA.test(c.sha256||'')&&sha256(fs.readFileSync(file))!==c.sha256.toLowerCase())fail('CLIP_HASH_MISMATCH',at,'clip bytes changed');
  }
 }
 const seenSchools=new Set();
 const ordered=['subjectSeparation','taskOwnership','publicAuthority','privacy61','privacy69','serviceAndFinance','contractAndRights'];
 for(const [i,s] of evaluations.entries()){
  const at='$.schoolAssessments['+i+']';
  if(!schoolSet.has(s.schoolId)||seenSchools.has(s.schoolId))fail('SCHOOL_ASSESSMENT_ID',at,'unique roster school required');
  seenSchools.add(s.schoolId);
  if(!['verified','partial','unverified'].includes(s.status))fail('ASSESSMENT_STATUS',at,'invalid status');
  if(!isObj(s.legalSequence)||ordered.some(k=>!clean(s.legalSequence[k])))fail('LEGAL_SEQUENCE',at,'seven ordered legal steps required, including explicit unknown if not resolved');
  if(!Array.isArray(s.evidenceIds))fail('ASSESSMENT_EVIDENCE',at,'source references required');
  else for(const id of s.evidenceIds)if(!artById.has(id))fail('ASSESSMENT_SOURCE',at,'unknown artifact '+id);
  if(s.status==='verified'&&!s.evidenceIds?.some(id=>['text_verified','image_verified'].includes(artById.get(id)?.verification)))fail('ASSESSMENT_UNPROVEN',at,'verified assessment needs inspected original');
  if(!clean(s.finding)||!clean(s.unknowns))fail('ASSESSMENT_FINDING',at,'fact and unresolved issues required');
 }
 for(const sid of schoolSet)if(!seenSchools.has(sid))missing.push('school:'+sid);
 const progress=isObj(d.progress)?d.progress:{};
 for(const k of ['municipalRulesReviewed','sourceDocumentLedgerChecked','twelveAxesValidated','tenDocumentsValidated','v3LegalValidated','imageProvenanceChecked','siteSourceSynchronized','seniorReviewed','humanApproved','browserVerified','publishedUrlVerified'])if(progress[k]!==true)missing.push('gate:'+k);
 const sourcesVerified=artifacts.filter(a=>['text_verified','image_verified'].includes(a.verification)).length;
 const internalSchools=new Set(artifacts.filter(a=>a.evidenceClass==='school_internal'&&['text_verified','image_verified'].includes(a.verification)&&schoolSet.has(a.schoolId)).map(a=>a.schoolId));
 const allTargetsResolved=targets.every(t=>['retrieved','exhausted'].includes(t.state));
 const schoolsComplete=schoolSet.size>0&&seenSchools.size===schoolSet.size;
 const reviewComplete=allTargetsResolved&&schoolsComplete&&['scope','discover','retrieve','inspect','image','assess','review'].every(k=>d.phases?.[k]==='complete')&&
  ['municipalRulesReviewed','sourceDocumentLedgerChecked','twelveAxesValidated','tenDocumentsValidated','v3LegalValidated','imageProvenanceChecked','seniorReviewed'].every(k=>progress[k]===true)&&errors.length===0;
 const publicationComplete=reviewComplete&&d.phases?.web==='complete'&&['humanApproved','siteSourceSynchronized','browserVerified','publishedUrlVerified'].every(k=>progress[k]===true);
 const metrics={targetSchoolCount:schoolSet.size,schoolAssessments:seenSchools.size,internalOriginalSchools:internalSchools.size,inspectedArtifacts:sourcesVerified,adoptedClips:clips.filter(c=>c.decision==='adopted').length,unresolvedTargets:targets.filter(t=>!['retrieved','exhausted'].includes(t.state)).length};
 return {schemaVersion:'4.0.0',ok:errors.length===0,readyForReview:reviewComplete,readyForPublication:publicationComplete,metrics,errors,warnings,missing:[...new Set(missing)]};
}
function init(name,schoolIds,asOf){
 return {schemaVersion:'4.0.0',municipality:name,asOf,schoolIds,phases:Object.fromEntries(PHASES.map(p=>[p,'not_started'])),targets:[],retrievalAttempts:[],artifacts:[],clips:[],schoolAssessments:[],progress:Object.fromEntries(['municipalRulesReviewed','sourceDocumentLedgerChecked','twelveAxesValidated','tenDocumentsValidated','v3LegalValidated','imageProvenanceChecked','siteSourceSynchronized','seniorReviewed','humanApproved','browserVerified','publishedUrlVerified'].map(k=>[k,false]))};
}
function main(argv){
 const action=argv[0];
 try{
  if(action==='init'){
   const [name,rosterFile,out,asOf=new Date().toISOString().slice(0,10)]=argv.slice(1);
   if(!name||!rosterFile||!out)throw Error('usage: node municipal-v4.mjs init 自治体 roster.json output.json [YYYY-MM-DD]');
   const roster=JSON.parse(fs.readFileSync(rosterFile,'utf8'));
   if(!Array.isArray(roster))throw Error('roster.json must be a school-ID array');
   fs.mkdirSync(path.dirname(out),{recursive:true});
   fs.writeFileSync(out,JSON.stringify(init(name,roster,asOf),null,2)+'\n',{flag:'wx'});
   process.stdout.write(out+'\n');
  }else if(action==='validate'){
   const file=argv[1];if(!file)throw Error('usage: node municipal-v4.mjs validate ledger.json [--check-bytes] [--strict-review] [--strict-publish]');
   const result=validate(JSON.parse(fs.readFileSync(file,'utf8')),{baseDir:path.dirname(path.resolve(file)),checkBytes:argv.includes('--check-bytes')});
   process.stdout.write(JSON.stringify(result,null,2)+'\n');
   if(!result.ok||argv.includes('--strict-publish')&&!result.readyForPublication||argv.includes('--strict-review')&&!result.readyForReview)process.exitCode=2;
  }else throw Error('usage: node municipal-v4.mjs init|validate ...');
 }catch(e){console.error(e.message);process.exitCode=1;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main(process.argv.slice(2));
export {validate,init,sha256};
