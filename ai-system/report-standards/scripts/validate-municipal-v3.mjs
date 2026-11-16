#!/usr/bin/env node
/* PTA municipal assessment v3: deterministic completeness gates, not legal findings. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const policy=JSON.parse(fs.readFileSync(path.join(here,'..','municipal-v3-gates.json'),'utf8'));
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const passed=(o,k)=>o && own(o,k) && o[k]===true;
const distinct=a=>new Set(a).size===a.length;
function evaluate(input){
 const errors=[],warnings=[];
 if(!input||typeof input!=='object'||Array.isArray(input))return {readyForFinal:false,readyForPublication:false,errors:['INPUT_NOT_OBJECT'],warnings};
 if(typeof input.municipality!=='string'||!input.municipality.trim())errors.push('MUNICIPALITY_REQUIRED');
 if(!/^20\d{2}-\d\d-\d\d$/.test(input.asOf||''))errors.push('AS_OF_REQUIRED');
 const phase=(key,fields)=>{
   const missing=fields.filter(x=>!passed(input[key],x));
   return {complete:missing.length===0,missing};
 };
 const evidence=phase('evidence',policy.evidenceRequired);
 const legal=phase('legal',policy.legalRequired);
 const progress=phase('progress',policy.progressRequired);
 const publication=phase('publication',policy.publicationRequired);
 const delegation=input.delegation||{};
 if(!policy.delegationStatus.includes(delegation.status))errors.push('DELEGATION_STATUS_INVALID');
 const delegationGate=phase('delegation',policy.delegationRequired);
 if(delegation.status==='none_found_after_search'){
   // Existence cannot be disproved by a missing search result; the record must state scope.
   if(!delegation.searchScope||!delegation.searchScope.trim())errors.push('DELEGATION_NEGATIVE_SCOPE_REQUIRED');
 }
 if(delegation.status==='identified'&&(!Array.isArray(delegation.contracts)||!delegation.contracts.length))errors.push('DELEGATION_CONTRACT_RECORD_REQUIRED');
 for(const c of delegation.contracts||[]){
   if(!c.id||!c.direction||!['pta_to_school','school_to_pta','other','unknown'].includes(c.direction)||!c.sourceRef||!c.privateEffect||!c.publicAuthorityAssessment)errors.push('DELEGATION_CONTRACT_INCOMPLETE:'+String(c.id||'unknown'));
   if(c.publicAuthorityAssessment==='contract_alone_sufficient')errors.push('DELEGATION_AUTHORITY_CONFLATED:'+String(c.id));
 }
 const events=input.events||[];
 if(!Array.isArray(events))errors.push('EVENTS_NOT_ARRAY');
 else{
   const ids=events.map(x=>x.id);
   if(!distinct(ids)||ids.some(x=>!x))errors.push('EVENT_IDS_INVALID');
   for(const e of events){
     if(!/^20\d{2}-\d\d-\d\d$/.test(e.date||'')||!e.sourceRef||!e.stage||!policy.stages.includes(e.stage))errors.push('EVENT_INCOMPLETE:'+String(e.id||'unknown'));
     if(e.stage==='implemented_at_schools'&&!e.implementationEvidence)errors.push('IMPLEMENTATION_EVIDENCE_REQUIRED:'+e.id);
     if(e.stage==='outcome_verified'&&!e.outcomeEvidence)errors.push('OUTCOME_EVIDENCE_REQUIRED:'+e.id);
   }
   if(events.some((e,i)=>i>0&&e.date<events[i-1].date))warnings.push('EVENTS_NOT_CHRONOLOGICAL');
 }
 if(!Array.isArray(input.sources)||!input.sources.length)errors.push('SOURCES_REQUIRED');
 const src=new Set((input.sources||[]).map(x=>x.id));
 if(!distinct((input.sources||[]).map(x=>x.id)))errors.push('SOURCE_IDS_DUPLICATED');
 for(const e of (Array.isArray(events)?events:[]))if(e.sourceRef&&!src.has(e.sourceRef))errors.push('EVENT_SOURCE_UNRESOLVED:'+e.id);
 for(const c of delegation.contracts||[])if(c.sourceRef&&!src.has(c.sourceRef))errors.push('DELEGATION_SOURCE_UNRESOLVED:'+c.id);
 if(input.assertions?.schoolCollectionAuthorizedByDelegation===true)errors.push('UNSUPPORTED_DELEGATION_AUTHORITY_CLAIM');
 if(input.assertions?.reformCompletedFromPolicyAnnouncement===true)errors.push('POLICY_IS_NOT_IMPLEMENTATION');
 if(input.assertions?.allSchoolsCompliantFromMissingDocuments===true)errors.push('MISSING_IS_NOT_COMPLIANT');
 if(input.assertions?.userInquiryCausedPolicyChange===true&&!input.assertions?.causationPrimaryEvidence)errors.push('CAUSATION_NOT_ESTABLISHED');
 const missing={evidence:evidence.missing,delegation:delegationGate.missing,legal:legal.missing,progress:progress.missing,publication:publication.missing};
 const readyForFinal=errors.length===0&&evidence.complete&&delegationGate.complete&&legal.complete&&progress.complete;
 const readyForPublication=readyForFinal&&publication.complete;
 return {version:policy.version,municipality:input.municipality,readyForFinal,readyForPublication,missing,errors,warnings};
}
function main(argv){
 const file=argv[0];
 if(!file){console.error('usage: node validate-municipal-v3.mjs path/to/private-input.json [--json output.json]');process.exitCode=1;return;}
 try{
   const input=JSON.parse(fs.readFileSync(file,'utf8'));
   const result=evaluate(input);
   const text=JSON.stringify(result,null,2)+'\n';
   const jsonIndex=argv.indexOf('--json');
   if(jsonIndex!==-1){if(!argv[jsonIndex+1])throw Error('Missing --json destination');fs.writeFileSync(argv[jsonIndex+1],text);}
   process.stdout.write(text);
   if(!result.readyForPublication)process.exitCode=2;
 }catch(e){console.error(e.message);process.exitCode=1;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main(process.argv.slice(2));
export {evaluate};
