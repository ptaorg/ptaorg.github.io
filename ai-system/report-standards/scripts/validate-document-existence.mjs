#!/usr/bin/env node
/** Validate the PTA evidence-document ledger independently of the fixed 12 axes. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const schema=JSON.parse(fs.readFileSync(path.join(ROOT,'document-existence.schema.json'),'utf8'));
const statuses=schema.properties.statusDefinitions.required;
const present=new Set(['present_as_standalone_document','present_as_provision_only','internal_rule_only']);
const holders=new Set(['school','pta','board_of_education','school_or_pta','unknown']);
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&
!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const filled=s=>typeof s==='string'&&s.trim().length>0;
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export function validateDocumentExistence(d,{populationSchoolIds=null}={}){
 const errors=[],fail=(code,at)=>errors.push({code,at});
 if(!obj(d))return {ok:false,errors:[{code:'ROOT',at:'$'}],summary:null};
 for(const k of schema.required)if(!(k in d))fail('REQUIRED','$.'.concat(k));
 if(!filled(d.title)||!filled(d.scope)||!filled(d.relationToAxes)||!date(d.reviewDate)||!/^\d+\.\d+\.\d+$/.test(d.version??''))fail('METADATA','$');
 const types=Array.isArray(d.documentTypes)?d.documentTypes:[];
 if(!types.length)fail('DOCUMENT_TYPES','$.documentTypes');
 const typeIds=new Set();for(const [i,t] of types.entries()){
  if(!obj(t)||!filled(t.id)||!/^[a-zA-Z][a-zA-Z0-9]*$/.test(t.id)||!filled(t.label))fail('DOCUMENT_TYPE','$.documentTypes['+i+']');
  if(typeIds.has(t.id))fail('DUPLICATE_TYPE','$.documentTypes['+i+']');typeIds.add(t.id);
 }
 if(!obj(d.statusDefinitions)||statuses.some(s=>!filled(d.statusDefinitions[s])))fail('STATUS_DEFINITIONS','$.statusDefinitions');
 const src=d.source;if(!obj(src)||!filled(src.title)||!date(src.date)||!Number.isInteger(src.totalDisclosedDocuments)||!Number.isInteger(src.totalDisclosedPages)||!Number.isInteger(src.disclosedSchools))fail('SOURCE','$.source');
 const schools=Array.isArray(d.schools)?d.schools:[],ids=new Set();
 const counts=Object.fromEntries(statuses.map(x=>[x,0]));
 for(const [i,s] of schools.entries()){
  const at='$.schools['+i+']';if(!obj(s)||!filled(s.id)||!filled(s.name)||!obj(s.documents)){fail('SCHOOL',at);continue;}
  if(ids.has(s.id))fail('DUPLICATE_SCHOOL',at);ids.add(s.id);
  if(Object.keys(s.documents).length!==typeIds.size||Object.keys(s.documents).some(k=>!typeIds.has(k)))fail('DOCUMENT_COVERAGE',at);
  for(const t of types){
    const where=at+'.documents.'+t.id,v=s.documents[t.id];if(!obj(v)){fail('MISSING_DOCUMENT',where);continue;}
    if(v.documentType!==t.label||!/^\d{4}$/.test(v.year??'')||!holders.has(v.holder)||typeof v.submitted!=='boolean'||!statuses.includes(v.status)||!date(v.checkedAt)||!Array.isArray(v.evidence)||v.evidence.some(x=>!filled(x)))fail('DOCUMENT_CONTRACT',where);
    if(present.has(v.status)&&(!v.submitted||!v.evidence?.length))fail('PRESENT_EVIDENCE',where);
    if(v.status==='not_found_in_disclosure'&&v.submitted!==false)fail('NOT_FOUND_IS_SUBMITTED',where);
    if(v.status==='not_disclosed'&&(v.submitted!==false||v.evidence?.length))fail('UNDISCLOSED',where);
    if(v.status==='formally_determined_nonexistent'){
      const x=v.formalDetermination;if(!obj(x)||!filled(x.decisionDocument)||!date(x.decisionDate)||!filled(x.holdingAuthority)||!filled(x.targetYear))fail('FORMAL_NONEXISTENCE',where);
    }else if('formalDetermination' in v)fail('FALSE_FORMAL_NONEXISTENCE',where);
    if(counts[v.status]!==undefined)counts[v.status]++;
  }
 }
 if(!schools.length)fail('SCHOOLS','$.schools');
 if(Array.isArray(populationSchoolIds)){
  const expected=new Set(populationSchoolIds);
  if(expected.size!==schools.length||expected.size!==ids.size||[...ids].some(x=>!expected.has(x)))fail('POPULATION_MISMATCH','$.schools');
 }
 return {ok:errors.length===0,errors,summary:{version:d.version,schools:schools.length,documentTypes:types.length,records:schools.length*types.length,statuses:counts}};
}
function main(){
 const args=process.argv.slice(2),input=args[0];if(!input){console.error('Usage: node validate-document-existence.mjs <ledger.json> [--dataset <dataset.json>] [--summary <output.json>]');process.exitCode=2;return;}
 const flag=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
 const d=JSON.parse(fs.readFileSync(input,'utf8'));
 const pop=flag('--dataset')?JSON.parse(fs.readFileSync(flag('--dataset'),'utf8')).scope.populationSchoolIds:null;
 const r=validateDocumentExistence(d,{populationSchoolIds:pop});
 if(!r.ok){for(const x of r.errors)console.error(x.code,x.at);process.exitCode=1;return;}
 const out=flag('--summary');if(out){fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,JSON.stringify(r.summary,null,2)+'\n');}
 console.log('DOCUMENT_LEDGER_VALID',JSON.stringify(r.summary));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
