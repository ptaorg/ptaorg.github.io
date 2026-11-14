#!/usr/bin/env node
/* PTA municipal-school report validation / metric computation. Node >=20, no dependencies. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const defs=JSON.parse(fs.readFileSync(path.join(root,'evaluation-axes.json'),'utf8'));
const contract=JSON.parse(fs.readFileSync(path.join(root,'report-dataset.schema.json'),'utf8'));
const AXES=defs.axes.map(x=>x.id);
const STATES=['confirmed_yes','confirmed_no','indication','unknown','not_applicable','conflicting'];
const BOOLEANS=['sourceChecked','linksChecked','citationsChecked','redactionsChecked','legalReviewCompleted','seniorApproved','humanApproved'];
const LEGAL=['subjectSeparation','taskOwnership','publicAuthority','privacyAnalysis','applicationAndConclusion','counterInterpretation'];
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const arr=x=>Array.isArray(x)?x:[];
const filled=x=>typeof x==='string'&&x.trim().length>0;
const year=x=>typeof x==='string'&&/^\d{4}$/.test(x);
const id=x=>typeof x==='string'&&/^[a-z0-9][a-z0-9-]+$/.test(x);
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
const pct=(n,d)=>d===0?null:Math.round(n*1000/d)/10;

// Enforce the checked-in JSON Schema contract using its supported standard keywords.
// No third-party package or network access is required for validation.
function validateSchema(value,rule,at,fail){
  const matches=t=>t==='null'?value===null
    :t==='object'?obj(value)
    :t==='array'?Array.isArray(value)
    :t==='integer'?Number.isInteger(value)
    :t==='number'?typeof value==='number'&&Number.isFinite(value)
    :t==='string'?typeof value==='string'
    :t==='boolean'?typeof value==='boolean'
    :false;
  const types=rule.type===undefined?[]:Array.isArray(rule.type)?rule.type:[rule.type];
  if(types.length&&!types.some(matches)){fail('SCHEMA_TYPE',at,'expected '+types.join(' or '));return;}
  if(Object.hasOwn(rule,'const')&&value!==rule.const)fail('SCHEMA_CONST',at,'constant value mismatch');
  if(Array.isArray(rule.enum)&&!rule.enum.includes(value))fail('SCHEMA_ENUM',at,'value not in contract enum');
  if(typeof value==='string'){
    if(rule.minLength!==undefined&&value.length<rule.minLength)fail('SCHEMA_MIN_LENGTH',at,'string too short');
    if(rule.pattern&&!new RegExp(rule.pattern).test(value))fail('SCHEMA_PATTERN',at,'string does not match pattern');
    if(rule.format==='date'&&!date(value))fail('SCHEMA_DATE',at,'invalid calendar date');
  }
  if(typeof value==='number'){
    if(rule.minimum!==undefined&&value<rule.minimum)fail('SCHEMA_MINIMUM',at,'below minimum');
    if(rule.maximum!==undefined&&value>rule.maximum)fail('SCHEMA_MAXIMUM',at,'above maximum');
  }
  if(Array.isArray(value)){
    if(rule.minItems!==undefined&&value.length<rule.minItems)fail('SCHEMA_MIN_ITEMS',at,'too few items');
    if(rule.uniqueItems&&new Set(value.map(v=>JSON.stringify(v))).size!==value.length)fail('SCHEMA_UNIQUE',at,'duplicate array items');
    if(rule.items)value.forEach((v,i)=>validateSchema(v,rule.items,at+'['+i+']',fail));
  }
  if(obj(value)){
    for(const k of rule.required??[])if(!Object.hasOwn(value,k))fail('SCHEMA_REQUIRED',at+'.'+k,'missing required field');
    for(const [k,v] of Object.entries(value)){
      if(rule.additionalProperties===false&&!Object.hasOwn(rule.properties??{},k))fail('SCHEMA_EXTRA',at+'.'+k,'field not allowed by contract');
      if(Object.hasOwn(rule.properties??{},k))validateSchema(v,rule.properties[k],at+'.'+k,fail);
    }
  }
}

export function validateReport(d,{publish=false}={}){
  const errors=[];
  const fail=(code,at,detail)=>errors.push({code,at,detail});
  if(!obj(d))return {ok:false,errors:[{code:'ROOT',at:'
  for(const k of ['schemaVersion','reportId','asOf','municipality','scope','sources','municipalDocuments','schools','narrativeClaims','legalReviews','publication'])if(!(k in d))fail('MISSING',`$.${k}`,'required');
  if(d.schemaVersion!==defs.version)fail('VERSION','$.schemaVersion','assessment and axis versions must match');
  if(!id(d.reportId)||!date(d.asOf))fail('METADATA','$','report ID slug and asOf date required');
  const m=obj(d.municipality)?d.municipality:{},scope=obj(d.scope)?d.scope:{};
  if(!id(m.id)||!filled(m.name)||!filled(m.prefecture))fail('MUNICIPALITY','$.municipality','name, prefecture, id required');
  if((m.lat===null)!==(m.long===null)||!(m.lat===null||typeof m.lat==='number')||!(m.long===null||typeof m.long==='number'))fail('COORDINATES','$.municipality','both coordinates or both null');
  if(m.lat!==null&&m.lat!==undefined&&(!filled(m.coordinateSourceId)||Math.abs(m.lat)>90||Math.abs(m.long)>180))fail('COORDINATE_SOURCE','$.municipality','grounded in-bounds coordinates required');
  if(!Number.isInteger(scope.totalPublicSchools)||scope.totalPublicSchools<1||!filled(scope.populationSourceId)||!filled(scope.scopeNote)||!['census','selected'].includes(scope.sampling))fail('SCOPE','$.scope','population count, source, scope note and method required');
  if(!arr(scope.schoolTypes).length||!arr(scope.targetYears).length||arr(scope.targetYears).some(x=>!year(x)))fail('SCOPE_YEARS','$.scope','targeted school types and years required');
  const populationIds=arr(scope.populationSchoolIds);
  if(!Array.isArray(scope.populationSchoolIds)||populationIds.length!==scope.totalPublicSchools||populationIds.some(x=>!id(x))||new Set(populationIds).size!==populationIds.length)
    fail('POPULATION_ROSTER','$.scope.populationSchoolIds','complete unique official school-ID roster required; count alone cannot establish census coverage');
  for(const k of ['sources','municipalDocuments','schools','narrativeClaims','legalReviews'])if(!Array.isArray(d[k]))fail('ARRAY',`$.${k}`,'array required');
  if(!arr(d.schools).length)fail('NO_SCHOOLS','$.schools','at least one target school required');

  const sources=new Map();
  for(const [i,s] of arr(d.sources).entries()){
    const at=`$.sources[${i}]`;
    if(!obj(s)||!filled(s.id)){fail('SOURCE_ID',at,'source ID missing');continue;}
    if(sources.has(s.id))fail('DUPLICATE_SOURCE',at,s.id); sources.set(s.id,s);
    if(!filled(s.title)||!filled(s.issuer)||!year(s.targetYear)||!['primary','secondary','internal'].includes(s.kind))fail('SOURCE_DETAILS',at,'title issuer year and kind required');
    if(!['direct_checked','metadata_only','unavailable'].includes(s.verification))fail('SOURCE_VERIFICATION',at,'verification state invalid');
    if(s.documentDate!==null&&!date(s.documentDate))fail('SOURCE_DATE',at,'documentDate not a full date');
    if(s.verifiedAt!==null&&!date(s.verifiedAt))fail('SOURCE_DATE',at,'verifiedAt not a full date');
    if(s.verification==='direct_checked'&&!date(s.verifiedAt))fail('DIRECT_INSPECTION_DATE',at,'verifiedAt required');
    if(!filled(s.url)&&!filled(s.filePath))fail('SOURCE_LOCATION',at,'url or filePath required');
    if(filled(s.url)&&!s.url.startsWith('https://')&&!s.url.startsWith('/'))fail('SOURCE_URL',at,'HTTPS or site path required');
    for(const k of ['publicationLinkChecked','containsPersonalData','redactionChecked'])if(typeof s[k]!=='boolean')fail('SOURCE_FLAG',`${at}.${k}`,'boolean required');
  }
  if(!sources.has(scope.populationSourceId))fail('POPULATION_SOURCE','$.scope.populationSourceId','must link official school-list evidence');
  if(m.lat!==null&&m.lat!==undefined&&!sources.has(m.coordinateSourceId))fail('COORDINATE_LINK','$.municipality.coordinateSourceId','source not found');
  const N=arr(d.schools).length;
  if(Number.isInteger(scope.totalPublicSchools)&&N>scope.totalPublicSchools)fail('TOO_MANY_SCHOOLS','$.schools','more target schools than total');
  if(scope.sampling==='census'&&Number.isInteger(scope.totalPublicSchools)&&N!==scope.totalPublicSchools)fail('CENSUS_MISSING','$.schools','include unknown schools to match population');
  const roster=new Set(populationIds);
  for(const [i,s] of arr(d.schools).entries())if(obj(s)&&filled(s.id)&&!roster.has(s.id))fail('SCHOOL_NOT_IN_ROSTER',`$.schools[${i}].id`,'school is not in the fixed population roster');
  if(scope.sampling==='census')for(const sid of populationIds)if(!arr(d.schools).some(s=>s?.id===sid))fail('ROSTER_SCHOOL_MISSING','$.schools',`missing school ID: ${sid}`);
  const schools=new Map();
  function refCheck(refs,where,{need=false,confirmed=false,targetYear=null,schoolSourceIds=null}={}){
    if(!Array.isArray(refs)){fail('REFERENCE_ARRAY',where,'sourceRefs must be array');return;}
    if(need&&refs.length===0)fail('MISSING_REFERENCE',where,'evidence required');
    let primary=0;const seen=new Set();const verifiedPrimarySources=new Set();
    for(const [i,r] of refs.entries()){
      const at=`${where}[${i}]`;
      if(!obj(r)||!filled(r.sourceId)||!filled(r.locator)){fail('REFERENCE_LOCATOR',at,'source and page/section required');continue;}
      const key=r.sourceId+'|'+r.locator;
      if(seen.has(key))fail('DUPLICATE_REFERENCE',at,key); seen.add(key);
      const src=sources.get(r.sourceId);
      if(!src){fail('UNKNOWN_SOURCE',at,r.sourceId);continue;}
      if(schoolSourceIds&&!schoolSourceIds.has(r.sourceId))fail('SCHOOL_SOURCE_MISMATCH',at,'source not listed for school');
      if(src.kind==='primary'&&src.verification==='direct_checked'&&src.targetYear===targetYear){primary++;verifiedPrimarySources.add(src.id);}
      if(confirmed&&src.targetYear!==targetYear)fail('SOURCE_YEAR_MISMATCH',at,'source year differs from school analysis');
    }
    if(confirmed&&primary===0)fail('NO_PRIMARY_CONFIRMATION',where,'confirmed yes/no requires directly inspected primary evidence');
    return verifiedPrimarySources.size;
  }
  for(const [i,s] of arr(d.schools).entries()){
    const at=`$.schools[${i}]`;
    if(!obj(s)||!id(s.id)){fail('SCHOOL_ID',at,'school slug required');continue;}
    if(schools.has(s.id))fail('DUPLICATE_SCHOOL',at,s.id); schools.set(s.id,s);
    if(!filled(s.name)||!filled(s.schoolType)||!year(s.analysisYear))fail('SCHOOL_DETAILS',at,'school name/type/year required');
    if(!arr(scope.schoolTypes).includes(s.schoolType)||!arr(scope.targetYears).includes(s.analysisYear))fail('SCHOOL_OUT_OF_SCOPE',at,'school type/year outside scope');
    if(!Array.isArray(s.sourceIds))fail('SCHOOL_SOURCES',at,'array required');
    const listed=new Set(arr(s.sourceIds));
    if(listed.size!==arr(s.sourceIds).length)fail('SCHOOL_DUPLICATE_SOURCE',at,'duplicate source IDs');
    for(const sid of listed)if(!sources.has(sid))fail('SCHOOL_UNKNOWN_SOURCE',at,sid);
    if(!obj(s.axes)){fail('NO_AXES',at,'12-axis matrix required');continue;}
    for(const a of AXES){
      const v=s.axes[a],at2=`${at}.axes.${a}`;
      if(!obj(v)){fail('MISSING_AXIS',at2,'every school must have every axis');continue;}
      if(!STATES.includes(v.status))fail('INVALID_STATUS',at2,'invalid state');
      if(v.year!==s.analysisYear||!year(v.year))fail('AXIS_YEAR',at2,'year mismatch');
      if(!filled(v.observation))fail('OBSERVATION',at2,'observation or missing-evidence reason required');
      const directPrimaryCount=refCheck(v.sourceRefs,at2+'.sourceRefs',{need:['confirmed_yes','confirmed_no','conflicting','not_applicable'].includes(v.status),confirmed:['confirmed_yes','confirmed_no'].includes(v.status),targetYear:s.analysisYear,schoolSourceIds:listed});
      if(v.status==='confirmed_no'&&v.explicitNegative!==true)fail('NEGATIVE_NOT_EXPLICIT',at2,'must document explicit negative, not mere absence');
      if(v.status==='conflicting'&&new Set(arr(v.sourceRefs).map(r=>r?.sourceId)).size<2)fail('CONFLICT_TOO_FEW_SOURCES',at2,'two distinct source IDs required');
      if(v.status==='conflicting'&&directPrimaryCount<2)fail('CONFLICT_NOT_VERIFIED',at2,'two distinct directly checked contemporaneous primary sources required');
      if(v.status==='not_applicable'&&directPrimaryCount<1)fail('NA_NOT_VERIFIED',at2,'directly checked contemporaneous primary source establishing non-applicability required');
    }
    for(const k of Object.keys(s.axes).filter(k=>!AXES.includes(k)))fail('AXIS_NOT_REGISTERED',at+'.axes.'+k,'change axis version before adding');
  }
  const docIds=new Set();
  for(const [i,x] of arr(d.municipalDocuments).entries()){
    const at=`$.municipalDocuments[${i}]`;
    if(!obj(x)||!filled(x.id)||!filled(x.statement)||!filled(x.scopeOfEffect)||!sources.has(x.sourceId))fail('MUNICIPAL_DOC',at,'source, scope and statement required');
    if(docIds.has(x?.id))fail('MUNICIPAL_DOC_DUPLICATE',at,'duplicate ID');docIds.add(x?.id);
    if(!['notice','reply','regulation','guideline','minutes','other'].includes(x?.category))fail('MUNICIPAL_DOC_CATEGORY',at,'invalid category');
  }
  const claims=new Map();
  for(const [i,x] of arr(d.narrativeClaims).entries()){
    const at=`$.narrativeClaims[${i}]`;
    if(!obj(x)||!filled(x.id)||!filled(x.text)||!['fact','administrative_statement','interpretation','legal_assessment'].includes(x.kind))fail('CLAIM',at,'id/text/kind required');
    if(claims.has(x?.id))fail('CLAIM_DUPLICATE',at,'duplicate ID');claims.set(x?.id,x);
    if(x?.schoolId!==null&&x?.schoolId!==undefined&&!schools.has(x.schoolId))fail('CLAIM_SCHOOL',at,'school not found');
    refCheck(x?.sourceRefs,at+'.sourceRefs',{need:['fact','administrative_statement'].includes(x?.kind)});
  }
  const legalIds=new Set();
  for(const [i,r] of arr(d.legalReviews).entries()){
    const at=`$.legalReviews[${i}]`;
    if(!obj(r)||claims.get(r.claimId)?.kind!=='legal_assessment')fail('LEGAL_CLAIM',at,'legal review must match a legal_assessment claim');
    if(legalIds.has(r?.claimId))fail('LEGAL_DUPLICATE',at,'duplicate review');legalIds.add(r?.claimId);
    for(const k of LEGAL)if(!filled(r?.[k]))fail('LEGAL_ORDER',at+'.'+k,'required legal stage omitted');
    if(typeof r?.seniorReviewed!=='boolean')fail('LEGAL_REVIEW_FLAG',at,'seniorReviewed boolean required');
  }
  for(const [cid,c] of claims)if(c.kind==='legal_assessment'&&!legalIds.has(cid))fail('LEGAL_REVIEW_MISSING',cid,'legal assessment must carry ordered legal review');
  const pub=obj(d.publication)?d.publication:{};
  if(!['draft','review','approved'].includes(pub.status))fail('PUBLICATION_STATE','$.publication.status','invalid state');
  for(const k of BOOLEANS)if(typeof pub[k]!=='boolean')fail('PUBLICATION_FLAG','$.publication.'+k,'boolean required');
  const record=obj(pub.reviewRecord)?pub.reviewRecord:{};
  if(!obj(pub.reviewRecord))fail('REVIEW_RECORD','$.publication.reviewRecord','reviewer and date record required');
  for(const k of ['seniorReviewer','humanApprover'])if(record[k]!==null&&typeof record[k]!=='string')fail('REVIEW_NAME','$.publication.reviewRecord.'+k,'string or null required');
  for(const k of ['seniorReviewedAt','humanApprovedAt'])if(record[k]!==null&&!date(record[k]))fail('REVIEW_DATE','$.publication.reviewRecord.'+k,'date or null required');
  if(publish){
    if(pub.status!=='approved')fail('PUBLICATION_APPROVAL','$.publication.status','publication not approved');
    if(!filled(record.seniorReviewer)||!filled(record.humanApprover)||!date(record.seniorReviewedAt)||!date(record.humanApprovedAt))
      fail('REVIEW_SIGNATURE','$.publication.reviewRecord','named senior and human approval with dates are required');
    if(!arr(d.narrativeClaims).some(c=>c.kind==='legal_assessment'))
      fail('MISSING_REPORT_ASSESSMENT','$.narrativeClaims','assessment report requires a documented legal claim and ordered review');
    if(!arr(d.schools).some(s=>Object.values(s?.axes??{}).some(a=>['confirmed_yes','confirmed_no'].includes(a?.status))))
      fail('NO_SCHOOL_EVIDENCE','$.schools','evaluation report needs at least one directly established school observation');
    for(const [i,c] of arr(d.narrativeClaims).entries())
      if(['interpretation','legal_assessment'].includes(c.kind)&&!arr(c.sourceRefs).length)
        fail('UNSUPPORTED_REPORT_CLAIM',`$.narrativeClaims[${i}]`,'published analysis requires traceable supporting sources');
    for(const k of BOOLEANS)if(pub[k]!==true)fail('PUBLICATION_GATE','$.publication.'+k,'required approval not complete');
    for(const [i,x] of arr(d.sources).entries()){
      if(x.publicationLinkChecked!==true)fail('UNVERIFIED_PUBLICATION_LINK',`$.sources[${i}]`,'source link must be checked');
      if(x.containsPersonalData===true&&x.redactionChecked!==true)fail('PERSONAL_DATA_UNREDACTED',`$.sources[${i}]`,'redaction approval needed');
      if(typeof x.url==='string'&&x.url.includes('example.org'))fail('PLACEHOLDER_URL',`$.sources[${i}]`,'test URL forbidden');
    }
    if(m.name?.includes('架空')||m.prefecture?.includes('架空'))fail('FICTIONAL_EXAMPLE','$.municipality','fixture is not public evidence');
    if(sources.get(scope.populationSourceId)?.verification!=='direct_checked'||sources.get(scope.populationSourceId)?.kind!=='primary')fail('POPULATION_NOT_VERIFIED','$.scope.populationSourceId','primary school list needed');
    if(m.lat!==null&&m.lat!==undefined&&sources.get(m.coordinateSourceId)?.verification!=='direct_checked')fail('GEO_NOT_VERIFIED','$.municipality','primary representative coordinate source needed');
    for(const [i,r] of arr(d.legalReviews).entries())if(r.seniorReviewed!==true)fail('SENIOR_NOT_APPROVED',`$.legalReviews[${i}]`,'legal review must be approved');
  }
  const axisMetrics=AXES.map(a=>{
    const count=Object.fromEntries(STATES.map(st=>[st,0]));
    for(const s of arr(d.schools)){const status=s?.axes?.[a]?.status;if(status in count)count[status]++;}
    const total=STATES.reduce((n,s)=>n+count[s],0);
    if(total!==N)fail('AXIS_SUM','$.schools.'+a,`classification count ${total} != ${N}`);
    const known=count.confirmed_yes+count.confirmed_no;
    return{id:a,label:defs.axes.find(z=>z.id===a).label,denominatorTargetSchools:N,...count,confirmedKnownDenominator:known,
      confirmedYesOfTargetPct:pct(count.confirmed_yes,N),confirmedYesOfKnownPct:pct(count.confirmed_yes,known),confirmedCoveragePct:pct(known,N)};
  });
  const metrics={schemaVersion:defs.version,reportId:d.reportId,asOf:d.asOf,municipality:{id:m.id,name:m.name,prefecture:m.prefecture},
    totalPublicSchools:scope.totalPublicSchools,targetSchools:N,sampling:scope.sampling,
    coverageOfAllPublicSchoolsPct:pct(N,scope.totalPublicSchools),axes:axisMetrics};
  return{ok:errors.length===0,errors,metrics};
}

const isCLI=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isCLI){
  const argv=process.argv.slice(2),input=argv[0],ix=argv.indexOf('--metrics');
  if(!input||argv.includes('--help')){
    console.log('Usage: node ai-system/report-standards/scripts/validate-dataset.mjs <dataset.json> [--metrics <metrics.json>] [--publish]');
    process.exitCode=input?0:2;
  }else if(ix>=0&&!argv[ix+1]){console.error('Missing output path for --metrics');process.exitCode=2;}
  else{
    try{
      const d=JSON.parse(fs.readFileSync(input,'utf8'));
      const result=validateReport(d,{publish:argv.includes('--publish')});
      if(ix>=0&&result.ok){const target=path.resolve(argv[ix+1]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(result.metrics,null,2)+'\n');}
      if(ix>=0&&!result.ok)console.error('ERROR METRICS_NOT_WRITTEN: dataset validation failed; no trusted metrics were exported');
      for(const e of result.errors)console.error(`ERROR ${e.code} ${e.at}: ${e.detail}`);
      console.log(`report=${d.reportId??'unknown'} schools=${result.metrics.targetSchools} axes=${AXES.length} issues=${result.errors.length} mode=${argv.includes('--publish')?'publish':'draft'}`);
      if(!result.ok)process.exitCode=1;
    }catch(e){console.error('ERROR DATA_READ: '+e.message);process.exitCode=1;}
  }
}
,detail:'JSON object required'}],metrics:null};
  validateSchema(d,contract,'
  for(const k of ['schemaVersion','reportId','asOf','municipality','scope','sources','municipalDocuments','schools','narrativeClaims','legalReviews','publication'])if(!(k in d))fail('MISSING',`$.${k}`,'required');
  if(d.schemaVersion!==defs.version)fail('VERSION','$.schemaVersion','assessment and axis versions must match');
  if(!id(d.reportId)||!date(d.asOf))fail('METADATA','$','report ID slug and asOf date required');
  const m=obj(d.municipality)?d.municipality:{},scope=obj(d.scope)?d.scope:{};
  if(!id(m.id)||!filled(m.name)||!filled(m.prefecture))fail('MUNICIPALITY','$.municipality','name, prefecture, id required');
  if((m.lat===null)!==(m.long===null)||!(m.lat===null||typeof m.lat==='number')||!(m.long===null||typeof m.long==='number'))fail('COORDINATES','$.municipality','both coordinates or both null');
  if(m.lat!==null&&m.lat!==undefined&&(!filled(m.coordinateSourceId)||Math.abs(m.lat)>90||Math.abs(m.long)>180))fail('COORDINATE_SOURCE','$.municipality','grounded in-bounds coordinates required');
  if(!Number.isInteger(scope.totalPublicSchools)||scope.totalPublicSchools<1||!filled(scope.populationSourceId)||!filled(scope.scopeNote)||!['census','selected'].includes(scope.sampling))fail('SCOPE','$.scope','population count, source, scope note and method required');
  if(!arr(scope.schoolTypes).length||!arr(scope.targetYears).length||arr(scope.targetYears).some(x=>!year(x)))fail('SCOPE_YEARS','$.scope','targeted school types and years required');
  const populationIds=arr(scope.populationSchoolIds);
  if(!Array.isArray(scope.populationSchoolIds)||populationIds.length!==scope.totalPublicSchools||populationIds.some(x=>!id(x))||new Set(populationIds).size!==populationIds.length)
    fail('POPULATION_ROSTER','$.scope.populationSchoolIds','complete unique official school-ID roster required; count alone cannot establish census coverage');
  for(const k of ['sources','municipalDocuments','schools','narrativeClaims','legalReviews'])if(!Array.isArray(d[k]))fail('ARRAY',`$.${k}`,'array required');
  if(!arr(d.schools).length)fail('NO_SCHOOLS','$.schools','at least one target school required');

  const sources=new Map();
  for(const [i,s] of arr(d.sources).entries()){
    const at=`$.sources[${i}]`;
    if(!obj(s)||!filled(s.id)){fail('SOURCE_ID',at,'source ID missing');continue;}
    if(sources.has(s.id))fail('DUPLICATE_SOURCE',at,s.id); sources.set(s.id,s);
    if(!filled(s.title)||!filled(s.issuer)||!year(s.targetYear)||!['primary','secondary','internal'].includes(s.kind))fail('SOURCE_DETAILS',at,'title issuer year and kind required');
    if(!['direct_checked','metadata_only','unavailable'].includes(s.verification))fail('SOURCE_VERIFICATION',at,'verification state invalid');
    if(s.documentDate!==null&&!date(s.documentDate))fail('SOURCE_DATE',at,'documentDate not a full date');
    if(s.verifiedAt!==null&&!date(s.verifiedAt))fail('SOURCE_DATE',at,'verifiedAt not a full date');
    if(s.verification==='direct_checked'&&!date(s.verifiedAt))fail('DIRECT_INSPECTION_DATE',at,'verifiedAt required');
    if(!filled(s.url)&&!filled(s.filePath))fail('SOURCE_LOCATION',at,'url or filePath required');
    if(filled(s.url)&&!s.url.startsWith('https://')&&!s.url.startsWith('/'))fail('SOURCE_URL',at,'HTTPS or site path required');
    for(const k of ['publicationLinkChecked','containsPersonalData','redactionChecked'])if(typeof s[k]!=='boolean')fail('SOURCE_FLAG',`${at}.${k}`,'boolean required');
  }
  if(!sources.has(scope.populationSourceId))fail('POPULATION_SOURCE','$.scope.populationSourceId','must link official school-list evidence');
  if(m.lat!==null&&m.lat!==undefined&&!sources.has(m.coordinateSourceId))fail('COORDINATE_LINK','$.municipality.coordinateSourceId','source not found');
  const N=arr(d.schools).length;
  if(Number.isInteger(scope.totalPublicSchools)&&N>scope.totalPublicSchools)fail('TOO_MANY_SCHOOLS','$.schools','more target schools than total');
  if(scope.sampling==='census'&&Number.isInteger(scope.totalPublicSchools)&&N!==scope.totalPublicSchools)fail('CENSUS_MISSING','$.schools','include unknown schools to match population');
  const roster=new Set(populationIds);
  for(const [i,s] of arr(d.schools).entries())if(obj(s)&&filled(s.id)&&!roster.has(s.id))fail('SCHOOL_NOT_IN_ROSTER',`$.schools[${i}].id`,'school is not in the fixed population roster');
  if(scope.sampling==='census')for(const sid of populationIds)if(!arr(d.schools).some(s=>s?.id===sid))fail('ROSTER_SCHOOL_MISSING','$.schools',`missing school ID: ${sid}`);
  const schools=new Map();
  function refCheck(refs,where,{need=false,confirmed=false,targetYear=null,schoolSourceIds=null}={}){
    if(!Array.isArray(refs)){fail('REFERENCE_ARRAY',where,'sourceRefs must be array');return;}
    if(need&&refs.length===0)fail('MISSING_REFERENCE',where,'evidence required');
    let primary=0;const seen=new Set();const verifiedPrimarySources=new Set();
    for(const [i,r] of refs.entries()){
      const at=`${where}[${i}]`;
      if(!obj(r)||!filled(r.sourceId)||!filled(r.locator)){fail('REFERENCE_LOCATOR',at,'source and page/section required');continue;}
      const key=r.sourceId+'|'+r.locator;
      if(seen.has(key))fail('DUPLICATE_REFERENCE',at,key); seen.add(key);
      const src=sources.get(r.sourceId);
      if(!src){fail('UNKNOWN_SOURCE',at,r.sourceId);continue;}
      if(schoolSourceIds&&!schoolSourceIds.has(r.sourceId))fail('SCHOOL_SOURCE_MISMATCH',at,'source not listed for school');
      if(src.kind==='primary'&&src.verification==='direct_checked'&&src.targetYear===targetYear){primary++;verifiedPrimarySources.add(src.id);}
      if(confirmed&&src.targetYear!==targetYear)fail('SOURCE_YEAR_MISMATCH',at,'source year differs from school analysis');
    }
    if(confirmed&&primary===0)fail('NO_PRIMARY_CONFIRMATION',where,'confirmed yes/no requires directly inspected primary evidence');
    return verifiedPrimarySources.size;
  }
  for(const [i,s] of arr(d.schools).entries()){
    const at=`$.schools[${i}]`;
    if(!obj(s)||!id(s.id)){fail('SCHOOL_ID',at,'school slug required');continue;}
    if(schools.has(s.id))fail('DUPLICATE_SCHOOL',at,s.id); schools.set(s.id,s);
    if(!filled(s.name)||!filled(s.schoolType)||!year(s.analysisYear))fail('SCHOOL_DETAILS',at,'school name/type/year required');
    if(!arr(scope.schoolTypes).includes(s.schoolType)||!arr(scope.targetYears).includes(s.analysisYear))fail('SCHOOL_OUT_OF_SCOPE',at,'school type/year outside scope');
    if(!Array.isArray(s.sourceIds))fail('SCHOOL_SOURCES',at,'array required');
    const listed=new Set(arr(s.sourceIds));
    if(listed.size!==arr(s.sourceIds).length)fail('SCHOOL_DUPLICATE_SOURCE',at,'duplicate source IDs');
    for(const sid of listed)if(!sources.has(sid))fail('SCHOOL_UNKNOWN_SOURCE',at,sid);
    if(!obj(s.axes)){fail('NO_AXES',at,'12-axis matrix required');continue;}
    for(const a of AXES){
      const v=s.axes[a],at2=`${at}.axes.${a}`;
      if(!obj(v)){fail('MISSING_AXIS',at2,'every school must have every axis');continue;}
      if(!STATES.includes(v.status))fail('INVALID_STATUS',at2,'invalid state');
      if(v.year!==s.analysisYear||!year(v.year))fail('AXIS_YEAR',at2,'year mismatch');
      if(!filled(v.observation))fail('OBSERVATION',at2,'observation or missing-evidence reason required');
      const directPrimaryCount=refCheck(v.sourceRefs,at2+'.sourceRefs',{need:['confirmed_yes','confirmed_no','conflicting','not_applicable'].includes(v.status),confirmed:['confirmed_yes','confirmed_no'].includes(v.status),targetYear:s.analysisYear,schoolSourceIds:listed});
      if(v.status==='confirmed_no'&&v.explicitNegative!==true)fail('NEGATIVE_NOT_EXPLICIT',at2,'must document explicit negative, not mere absence');
      if(v.status==='conflicting'&&new Set(arr(v.sourceRefs).map(r=>r?.sourceId)).size<2)fail('CONFLICT_TOO_FEW_SOURCES',at2,'two distinct source IDs required');
      if(v.status==='conflicting'&&directPrimaryCount<2)fail('CONFLICT_NOT_VERIFIED',at2,'two distinct directly checked contemporaneous primary sources required');
      if(v.status==='not_applicable'&&directPrimaryCount<1)fail('NA_NOT_VERIFIED',at2,'directly checked contemporaneous primary source establishing non-applicability required');
    }
    for(const k of Object.keys(s.axes).filter(k=>!AXES.includes(k)))fail('AXIS_NOT_REGISTERED',at+'.axes.'+k,'change axis version before adding');
  }
  const docIds=new Set();
  for(const [i,x] of arr(d.municipalDocuments).entries()){
    const at=`$.municipalDocuments[${i}]`;
    if(!obj(x)||!filled(x.id)||!filled(x.statement)||!filled(x.scopeOfEffect)||!sources.has(x.sourceId))fail('MUNICIPAL_DOC',at,'source, scope and statement required');
    if(docIds.has(x?.id))fail('MUNICIPAL_DOC_DUPLICATE',at,'duplicate ID');docIds.add(x?.id);
    if(!['notice','reply','regulation','guideline','minutes','other'].includes(x?.category))fail('MUNICIPAL_DOC_CATEGORY',at,'invalid category');
  }
  const claims=new Map();
  for(const [i,x] of arr(d.narrativeClaims).entries()){
    const at=`$.narrativeClaims[${i}]`;
    if(!obj(x)||!filled(x.id)||!filled(x.text)||!['fact','administrative_statement','interpretation','legal_assessment'].includes(x.kind))fail('CLAIM',at,'id/text/kind required');
    if(claims.has(x?.id))fail('CLAIM_DUPLICATE',at,'duplicate ID');claims.set(x?.id,x);
    if(x?.schoolId!==null&&x?.schoolId!==undefined&&!schools.has(x.schoolId))fail('CLAIM_SCHOOL',at,'school not found');
    refCheck(x?.sourceRefs,at+'.sourceRefs',{need:['fact','administrative_statement'].includes(x?.kind)});
  }
  const legalIds=new Set();
  for(const [i,r] of arr(d.legalReviews).entries()){
    const at=`$.legalReviews[${i}]`;
    if(!obj(r)||claims.get(r.claimId)?.kind!=='legal_assessment')fail('LEGAL_CLAIM',at,'legal review must match a legal_assessment claim');
    if(legalIds.has(r?.claimId))fail('LEGAL_DUPLICATE',at,'duplicate review');legalIds.add(r?.claimId);
    for(const k of LEGAL)if(!filled(r?.[k]))fail('LEGAL_ORDER',at+'.'+k,'required legal stage omitted');
    if(typeof r?.seniorReviewed!=='boolean')fail('LEGAL_REVIEW_FLAG',at,'seniorReviewed boolean required');
  }
  for(const [cid,c] of claims)if(c.kind==='legal_assessment'&&!legalIds.has(cid))fail('LEGAL_REVIEW_MISSING',cid,'legal assessment must carry ordered legal review');
  const pub=obj(d.publication)?d.publication:{};
  if(!['draft','review','approved'].includes(pub.status))fail('PUBLICATION_STATE','$.publication.status','invalid state');
  for(const k of BOOLEANS)if(typeof pub[k]!=='boolean')fail('PUBLICATION_FLAG','$.publication.'+k,'boolean required');
  const record=obj(pub.reviewRecord)?pub.reviewRecord:{};
  if(!obj(pub.reviewRecord))fail('REVIEW_RECORD','$.publication.reviewRecord','reviewer and date record required');
  for(const k of ['seniorReviewer','humanApprover'])if(record[k]!==null&&typeof record[k]!=='string')fail('REVIEW_NAME','$.publication.reviewRecord.'+k,'string or null required');
  for(const k of ['seniorReviewedAt','humanApprovedAt'])if(record[k]!==null&&!date(record[k]))fail('REVIEW_DATE','$.publication.reviewRecord.'+k,'date or null required');
  if(publish){
    if(pub.status!=='approved')fail('PUBLICATION_APPROVAL','$.publication.status','publication not approved');
    if(!filled(record.seniorReviewer)||!filled(record.humanApprover)||!date(record.seniorReviewedAt)||!date(record.humanApprovedAt))
      fail('REVIEW_SIGNATURE','$.publication.reviewRecord','named senior and human approval with dates are required');
    if(!arr(d.narrativeClaims).some(c=>c.kind==='legal_assessment'))
      fail('MISSING_REPORT_ASSESSMENT','$.narrativeClaims','assessment report requires a documented legal claim and ordered review');
    if(!arr(d.schools).some(s=>Object.values(s?.axes??{}).some(a=>['confirmed_yes','confirmed_no'].includes(a?.status))))
      fail('NO_SCHOOL_EVIDENCE','$.schools','evaluation report needs at least one directly established school observation');
    for(const [i,c] of arr(d.narrativeClaims).entries())
      if(['interpretation','legal_assessment'].includes(c.kind)&&!arr(c.sourceRefs).length)
        fail('UNSUPPORTED_REPORT_CLAIM',`$.narrativeClaims[${i}]`,'published analysis requires traceable supporting sources');
    for(const k of BOOLEANS)if(pub[k]!==true)fail('PUBLICATION_GATE','$.publication.'+k,'required approval not complete');
    for(const [i,x] of arr(d.sources).entries()){
      if(x.publicationLinkChecked!==true)fail('UNVERIFIED_PUBLICATION_LINK',`$.sources[${i}]`,'source link must be checked');
      if(x.containsPersonalData===true&&x.redactionChecked!==true)fail('PERSONAL_DATA_UNREDACTED',`$.sources[${i}]`,'redaction approval needed');
      if(typeof x.url==='string'&&x.url.includes('example.org'))fail('PLACEHOLDER_URL',`$.sources[${i}]`,'test URL forbidden');
    }
    if(m.name?.includes('架空')||m.prefecture?.includes('架空'))fail('FICTIONAL_EXAMPLE','$.municipality','fixture is not public evidence');
    if(sources.get(scope.populationSourceId)?.verification!=='direct_checked'||sources.get(scope.populationSourceId)?.kind!=='primary')fail('POPULATION_NOT_VERIFIED','$.scope.populationSourceId','primary school list needed');
    if(m.lat!==null&&m.lat!==undefined&&sources.get(m.coordinateSourceId)?.verification!=='direct_checked')fail('GEO_NOT_VERIFIED','$.municipality','primary representative coordinate source needed');
    for(const [i,r] of arr(d.legalReviews).entries())if(r.seniorReviewed!==true)fail('SENIOR_NOT_APPROVED',`$.legalReviews[${i}]`,'legal review must be approved');
  }
  const axisMetrics=AXES.map(a=>{
    const count=Object.fromEntries(STATES.map(st=>[st,0]));
    for(const s of arr(d.schools)){const status=s?.axes?.[a]?.status;if(status in count)count[status]++;}
    const total=STATES.reduce((n,s)=>n+count[s],0);
    if(total!==N)fail('AXIS_SUM','$.schools.'+a,`classification count ${total} != ${N}`);
    const known=count.confirmed_yes+count.confirmed_no;
    return{id:a,label:defs.axes.find(z=>z.id===a).label,denominatorTargetSchools:N,...count,confirmedKnownDenominator:known,
      confirmedYesOfTargetPct:pct(count.confirmed_yes,N),confirmedYesOfKnownPct:pct(count.confirmed_yes,known),confirmedCoveragePct:pct(known,N)};
  });
  const metrics={schemaVersion:defs.version,reportId:d.reportId,asOf:d.asOf,municipality:{id:m.id,name:m.name,prefecture:m.prefecture},
    totalPublicSchools:scope.totalPublicSchools,targetSchools:N,sampling:scope.sampling,
    coverageOfAllPublicSchoolsPct:pct(N,scope.totalPublicSchools),axes:axisMetrics};
  return{ok:errors.length===0,errors,metrics};
}

const isCLI=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isCLI){
  const argv=process.argv.slice(2),input=argv[0],ix=argv.indexOf('--metrics');
  if(!input||argv.includes('--help')){
    console.log('Usage: node ai-system/report-standards/scripts/validate-dataset.mjs <dataset.json> [--metrics <metrics.json>] [--publish]');
    process.exitCode=input?0:2;
  }else if(ix>=0&&!argv[ix+1]){console.error('Missing output path for --metrics');process.exitCode=2;}
  else{
    try{
      const d=JSON.parse(fs.readFileSync(input,'utf8'));
      const result=validateReport(d,{publish:argv.includes('--publish')});
      if(ix>=0&&result.ok){const target=path.resolve(argv[ix+1]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(result.metrics,null,2)+'\n');}
      if(ix>=0&&!result.ok)console.error('ERROR METRICS_NOT_WRITTEN: dataset validation failed; no trusted metrics were exported');
      for(const e of result.errors)console.error(`ERROR ${e.code} ${e.at}: ${e.detail}`);
      console.log(`report=${d.reportId??'unknown'} schools=${result.metrics.targetSchools} axes=${AXES.length} issues=${result.errors.length} mode=${argv.includes('--publish')?'publish':'draft'}`);
      if(!result.ok)process.exitCode=1;
    }catch(e){console.error('ERROR DATA_READ: '+e.message);process.exitCode=1;}
  }
}
,fail);
  for(const k of ['schemaVersion','reportId','asOf','municipality','scope','sources','municipalDocuments','schools','narrativeClaims','legalReviews','publication'])if(!(k in d))fail('MISSING',`$.${k}`,'required');
  if(d.schemaVersion!==defs.version)fail('VERSION','$.schemaVersion','assessment and axis versions must match');
  if(!id(d.reportId)||!date(d.asOf))fail('METADATA','$','report ID slug and asOf date required');
  const m=obj(d.municipality)?d.municipality:{},scope=obj(d.scope)?d.scope:{};
  if(!id(m.id)||!filled(m.name)||!filled(m.prefecture))fail('MUNICIPALITY','$.municipality','name, prefecture, id required');
  if((m.lat===null)!==(m.long===null)||!(m.lat===null||typeof m.lat==='number')||!(m.long===null||typeof m.long==='number'))fail('COORDINATES','$.municipality','both coordinates or both null');
  if(m.lat!==null&&m.lat!==undefined&&(!filled(m.coordinateSourceId)||Math.abs(m.lat)>90||Math.abs(m.long)>180))fail('COORDINATE_SOURCE','$.municipality','grounded in-bounds coordinates required');
  if(!Number.isInteger(scope.totalPublicSchools)||scope.totalPublicSchools<1||!filled(scope.populationSourceId)||!filled(scope.scopeNote)||!['census','selected'].includes(scope.sampling))fail('SCOPE','$.scope','population count, source, scope note and method required');
  if(!arr(scope.schoolTypes).length||!arr(scope.targetYears).length||arr(scope.targetYears).some(x=>!year(x)))fail('SCOPE_YEARS','$.scope','targeted school types and years required');
  const populationIds=arr(scope.populationSchoolIds);
  if(!Array.isArray(scope.populationSchoolIds)||populationIds.length!==scope.totalPublicSchools||populationIds.some(x=>!id(x))||new Set(populationIds).size!==populationIds.length)
    fail('POPULATION_ROSTER','$.scope.populationSchoolIds','complete unique official school-ID roster required; count alone cannot establish census coverage');
  for(const k of ['sources','municipalDocuments','schools','narrativeClaims','legalReviews'])if(!Array.isArray(d[k]))fail('ARRAY',`$.${k}`,'array required');
  if(!arr(d.schools).length)fail('NO_SCHOOLS','$.schools','at least one target school required');

  const sources=new Map();
  for(const [i,s] of arr(d.sources).entries()){
    const at=`$.sources[${i}]`;
    if(!obj(s)||!filled(s.id)){fail('SOURCE_ID',at,'source ID missing');continue;}
    if(sources.has(s.id))fail('DUPLICATE_SOURCE',at,s.id); sources.set(s.id,s);
    if(!filled(s.title)||!filled(s.issuer)||!year(s.targetYear)||!['primary','secondary','internal'].includes(s.kind))fail('SOURCE_DETAILS',at,'title issuer year and kind required');
    if(!['direct_checked','metadata_only','unavailable'].includes(s.verification))fail('SOURCE_VERIFICATION',at,'verification state invalid');
    if(s.documentDate!==null&&!date(s.documentDate))fail('SOURCE_DATE',at,'documentDate not a full date');
    if(s.verifiedAt!==null&&!date(s.verifiedAt))fail('SOURCE_DATE',at,'verifiedAt not a full date');
    if(s.verification==='direct_checked'&&!date(s.verifiedAt))fail('DIRECT_INSPECTION_DATE',at,'verifiedAt required');
    if(!filled(s.url)&&!filled(s.filePath))fail('SOURCE_LOCATION',at,'url or filePath required');
    if(filled(s.url)&&!s.url.startsWith('https://')&&!s.url.startsWith('/'))fail('SOURCE_URL',at,'HTTPS or site path required');
    for(const k of ['publicationLinkChecked','containsPersonalData','redactionChecked'])if(typeof s[k]!=='boolean')fail('SOURCE_FLAG',`${at}.${k}`,'boolean required');
  }
  if(!sources.has(scope.populationSourceId))fail('POPULATION_SOURCE','$.scope.populationSourceId','must link official school-list evidence');
  if(m.lat!==null&&m.lat!==undefined&&!sources.has(m.coordinateSourceId))fail('COORDINATE_LINK','$.municipality.coordinateSourceId','source not found');
  const N=arr(d.schools).length;
  if(Number.isInteger(scope.totalPublicSchools)&&N>scope.totalPublicSchools)fail('TOO_MANY_SCHOOLS','$.schools','more target schools than total');
  if(scope.sampling==='census'&&Number.isInteger(scope.totalPublicSchools)&&N!==scope.totalPublicSchools)fail('CENSUS_MISSING','$.schools','include unknown schools to match population');
  const roster=new Set(populationIds);
  for(const [i,s] of arr(d.schools).entries())if(obj(s)&&filled(s.id)&&!roster.has(s.id))fail('SCHOOL_NOT_IN_ROSTER',`$.schools[${i}].id`,'school is not in the fixed population roster');
  if(scope.sampling==='census')for(const sid of populationIds)if(!arr(d.schools).some(s=>s?.id===sid))fail('ROSTER_SCHOOL_MISSING','$.schools',`missing school ID: ${sid}`);
  const schools=new Map();
  function refCheck(refs,where,{need=false,confirmed=false,targetYear=null,schoolSourceIds=null}={}){
    if(!Array.isArray(refs)){fail('REFERENCE_ARRAY',where,'sourceRefs must be array');return;}
    if(need&&refs.length===0)fail('MISSING_REFERENCE',where,'evidence required');
    let primary=0;const seen=new Set();const verifiedPrimarySources=new Set();
    for(const [i,r] of refs.entries()){
      const at=`${where}[${i}]`;
      if(!obj(r)||!filled(r.sourceId)||!filled(r.locator)){fail('REFERENCE_LOCATOR',at,'source and page/section required');continue;}
      const key=r.sourceId+'|'+r.locator;
      if(seen.has(key))fail('DUPLICATE_REFERENCE',at,key); seen.add(key);
      const src=sources.get(r.sourceId);
      if(!src){fail('UNKNOWN_SOURCE',at,r.sourceId);continue;}
      if(schoolSourceIds&&!schoolSourceIds.has(r.sourceId))fail('SCHOOL_SOURCE_MISMATCH',at,'source not listed for school');
      if(src.kind==='primary'&&src.verification==='direct_checked'&&src.targetYear===targetYear){primary++;verifiedPrimarySources.add(src.id);}
      if(confirmed&&src.targetYear!==targetYear)fail('SOURCE_YEAR_MISMATCH',at,'source year differs from school analysis');
    }
    if(confirmed&&primary===0)fail('NO_PRIMARY_CONFIRMATION',where,'confirmed yes/no requires directly inspected primary evidence');
    return verifiedPrimarySources.size;
  }
  for(const [i,s] of arr(d.schools).entries()){
    const at=`$.schools[${i}]`;
    if(!obj(s)||!id(s.id)){fail('SCHOOL_ID',at,'school slug required');continue;}
    if(schools.has(s.id))fail('DUPLICATE_SCHOOL',at,s.id); schools.set(s.id,s);
    if(!filled(s.name)||!filled(s.schoolType)||!year(s.analysisYear))fail('SCHOOL_DETAILS',at,'school name/type/year required');
    if(!arr(scope.schoolTypes).includes(s.schoolType)||!arr(scope.targetYears).includes(s.analysisYear))fail('SCHOOL_OUT_OF_SCOPE',at,'school type/year outside scope');
    if(!Array.isArray(s.sourceIds))fail('SCHOOL_SOURCES',at,'array required');
    const listed=new Set(arr(s.sourceIds));
    if(listed.size!==arr(s.sourceIds).length)fail('SCHOOL_DUPLICATE_SOURCE',at,'duplicate source IDs');
    for(const sid of listed)if(!sources.has(sid))fail('SCHOOL_UNKNOWN_SOURCE',at,sid);
    if(!obj(s.axes)){fail('NO_AXES',at,'12-axis matrix required');continue;}
    for(const a of AXES){
      const v=s.axes[a],at2=`${at}.axes.${a}`;
      if(!obj(v)){fail('MISSING_AXIS',at2,'every school must have every axis');continue;}
      if(!STATES.includes(v.status))fail('INVALID_STATUS',at2,'invalid state');
      if(v.year!==s.analysisYear||!year(v.year))fail('AXIS_YEAR',at2,'year mismatch');
      if(!filled(v.observation))fail('OBSERVATION',at2,'observation or missing-evidence reason required');
      const directPrimaryCount=refCheck(v.sourceRefs,at2+'.sourceRefs',{need:['confirmed_yes','confirmed_no','conflicting','not_applicable'].includes(v.status),confirmed:['confirmed_yes','confirmed_no'].includes(v.status),targetYear:s.analysisYear,schoolSourceIds:listed});
      if(v.status==='confirmed_no'&&v.explicitNegative!==true)fail('NEGATIVE_NOT_EXPLICIT',at2,'must document explicit negative, not mere absence');
      if(v.status==='conflicting'&&new Set(arr(v.sourceRefs).map(r=>r?.sourceId)).size<2)fail('CONFLICT_TOO_FEW_SOURCES',at2,'two distinct source IDs required');
      if(v.status==='conflicting'&&directPrimaryCount<2)fail('CONFLICT_NOT_VERIFIED',at2,'two distinct directly checked contemporaneous primary sources required');
      if(v.status==='not_applicable'&&directPrimaryCount<1)fail('NA_NOT_VERIFIED',at2,'directly checked contemporaneous primary source establishing non-applicability required');
    }
    for(const k of Object.keys(s.axes).filter(k=>!AXES.includes(k)))fail('AXIS_NOT_REGISTERED',at+'.axes.'+k,'change axis version before adding');
  }
  const docIds=new Set();
  for(const [i,x] of arr(d.municipalDocuments).entries()){
    const at=`$.municipalDocuments[${i}]`;
    if(!obj(x)||!filled(x.id)||!filled(x.statement)||!filled(x.scopeOfEffect)||!sources.has(x.sourceId))fail('MUNICIPAL_DOC',at,'source, scope and statement required');
    if(docIds.has(x?.id))fail('MUNICIPAL_DOC_DUPLICATE',at,'duplicate ID');docIds.add(x?.id);
    if(!['notice','reply','regulation','guideline','minutes','other'].includes(x?.category))fail('MUNICIPAL_DOC_CATEGORY',at,'invalid category');
  }
  const claims=new Map();
  for(const [i,x] of arr(d.narrativeClaims).entries()){
    const at=`$.narrativeClaims[${i}]`;
    if(!obj(x)||!filled(x.id)||!filled(x.text)||!['fact','administrative_statement','interpretation','legal_assessment'].includes(x.kind))fail('CLAIM',at,'id/text/kind required');
    if(claims.has(x?.id))fail('CLAIM_DUPLICATE',at,'duplicate ID');claims.set(x?.id,x);
    if(x?.schoolId!==null&&x?.schoolId!==undefined&&!schools.has(x.schoolId))fail('CLAIM_SCHOOL',at,'school not found');
    refCheck(x?.sourceRefs,at+'.sourceRefs',{need:['fact','administrative_statement'].includes(x?.kind)});
  }
  const legalIds=new Set();
  for(const [i,r] of arr(d.legalReviews).entries()){
    const at=`$.legalReviews[${i}]`;
    if(!obj(r)||claims.get(r.claimId)?.kind!=='legal_assessment')fail('LEGAL_CLAIM',at,'legal review must match a legal_assessment claim');
    if(legalIds.has(r?.claimId))fail('LEGAL_DUPLICATE',at,'duplicate review');legalIds.add(r?.claimId);
    for(const k of LEGAL)if(!filled(r?.[k]))fail('LEGAL_ORDER',at+'.'+k,'required legal stage omitted');
    if(typeof r?.seniorReviewed!=='boolean')fail('LEGAL_REVIEW_FLAG',at,'seniorReviewed boolean required');
  }
  for(const [cid,c] of claims)if(c.kind==='legal_assessment'&&!legalIds.has(cid))fail('LEGAL_REVIEW_MISSING',cid,'legal assessment must carry ordered legal review');
  const pub=obj(d.publication)?d.publication:{};
  if(!['draft','review','approved'].includes(pub.status))fail('PUBLICATION_STATE','$.publication.status','invalid state');
  for(const k of BOOLEANS)if(typeof pub[k]!=='boolean')fail('PUBLICATION_FLAG','$.publication.'+k,'boolean required');
  const record=obj(pub.reviewRecord)?pub.reviewRecord:{};
  if(!obj(pub.reviewRecord))fail('REVIEW_RECORD','$.publication.reviewRecord','reviewer and date record required');
  for(const k of ['seniorReviewer','humanApprover'])if(record[k]!==null&&typeof record[k]!=='string')fail('REVIEW_NAME','$.publication.reviewRecord.'+k,'string or null required');
  for(const k of ['seniorReviewedAt','humanApprovedAt'])if(record[k]!==null&&!date(record[k]))fail('REVIEW_DATE','$.publication.reviewRecord.'+k,'date or null required');
  if(publish){
    if(pub.status!=='approved')fail('PUBLICATION_APPROVAL','$.publication.status','publication not approved');
    if(!filled(record.seniorReviewer)||!filled(record.humanApprover)||!date(record.seniorReviewedAt)||!date(record.humanApprovedAt))
      fail('REVIEW_SIGNATURE','$.publication.reviewRecord','named senior and human approval with dates are required');
    if(!arr(d.narrativeClaims).some(c=>c.kind==='legal_assessment'))
      fail('MISSING_REPORT_ASSESSMENT','$.narrativeClaims','assessment report requires a documented legal claim and ordered review');
    if(!arr(d.schools).some(s=>Object.values(s?.axes??{}).some(a=>['confirmed_yes','confirmed_no'].includes(a?.status))))
      fail('NO_SCHOOL_EVIDENCE','$.schools','evaluation report needs at least one directly established school observation');
    for(const [i,c] of arr(d.narrativeClaims).entries())
      if(['interpretation','legal_assessment'].includes(c.kind)&&!arr(c.sourceRefs).length)
        fail('UNSUPPORTED_REPORT_CLAIM',`$.narrativeClaims[${i}]`,'published analysis requires traceable supporting sources');
    for(const k of BOOLEANS)if(pub[k]!==true)fail('PUBLICATION_GATE','$.publication.'+k,'required approval not complete');
    for(const [i,x] of arr(d.sources).entries()){
      if(x.publicationLinkChecked!==true)fail('UNVERIFIED_PUBLICATION_LINK',`$.sources[${i}]`,'source link must be checked');
      if(x.containsPersonalData===true&&x.redactionChecked!==true)fail('PERSONAL_DATA_UNREDACTED',`$.sources[${i}]`,'redaction approval needed');
      if(typeof x.url==='string'&&x.url.includes('example.org'))fail('PLACEHOLDER_URL',`$.sources[${i}]`,'test URL forbidden');
    }
    if(m.name?.includes('架空')||m.prefecture?.includes('架空'))fail('FICTIONAL_EXAMPLE','$.municipality','fixture is not public evidence');
    if(sources.get(scope.populationSourceId)?.verification!=='direct_checked'||sources.get(scope.populationSourceId)?.kind!=='primary')fail('POPULATION_NOT_VERIFIED','$.scope.populationSourceId','primary school list needed');
    if(m.lat!==null&&m.lat!==undefined&&sources.get(m.coordinateSourceId)?.verification!=='direct_checked')fail('GEO_NOT_VERIFIED','$.municipality','primary representative coordinate source needed');
    for(const [i,r] of arr(d.legalReviews).entries())if(r.seniorReviewed!==true)fail('SENIOR_NOT_APPROVED',`$.legalReviews[${i}]`,'legal review must be approved');
  }
  const axisMetrics=AXES.map(a=>{
    const count=Object.fromEntries(STATES.map(st=>[st,0]));
    for(const s of arr(d.schools)){const status=s?.axes?.[a]?.status;if(status in count)count[status]++;}
    const total=STATES.reduce((n,s)=>n+count[s],0);
    if(total!==N)fail('AXIS_SUM','$.schools.'+a,`classification count ${total} != ${N}`);
    const known=count.confirmed_yes+count.confirmed_no;
    return{id:a,label:defs.axes.find(z=>z.id===a).label,denominatorTargetSchools:N,...count,confirmedKnownDenominator:known,
      confirmedYesOfTargetPct:pct(count.confirmed_yes,N),confirmedYesOfKnownPct:pct(count.confirmed_yes,known),confirmedCoveragePct:pct(known,N)};
  });
  const metrics={schemaVersion:defs.version,reportId:d.reportId,asOf:d.asOf,municipality:{id:m.id,name:m.name,prefecture:m.prefecture},
    totalPublicSchools:scope.totalPublicSchools,targetSchools:N,sampling:scope.sampling,
    coverageOfAllPublicSchoolsPct:pct(N,scope.totalPublicSchools),axes:axisMetrics};
  return{ok:errors.length===0,errors,metrics};
}

const isCLI=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isCLI){
  const argv=process.argv.slice(2),input=argv[0],ix=argv.indexOf('--metrics');
  if(!input||argv.includes('--help')){
    console.log('Usage: node ai-system/report-standards/scripts/validate-dataset.mjs <dataset.json> [--metrics <metrics.json>] [--publish]');
    process.exitCode=input?0:2;
  }else if(ix>=0&&!argv[ix+1]){console.error('Missing output path for --metrics');process.exitCode=2;}
  else{
    try{
      const d=JSON.parse(fs.readFileSync(input,'utf8'));
      const result=validateReport(d,{publish:argv.includes('--publish')});
      if(ix>=0&&result.ok){const target=path.resolve(argv[ix+1]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(result.metrics,null,2)+'\n');}
      if(ix>=0&&!result.ok)console.error('ERROR METRICS_NOT_WRITTEN: dataset validation failed; no trusted metrics were exported');
      for(const e of result.errors)console.error(`ERROR ${e.code} ${e.at}: ${e.detail}`);
      console.log(`report=${d.reportId??'unknown'} schools=${result.metrics.targetSchools} axes=${AXES.length} issues=${result.errors.length} mode=${argv.includes('--publish')?'publish':'draft'}`);
      if(!result.ok)process.exitCode=1;
    }catch(e){console.error('ERROR DATA_READ: '+e.message);process.exitCode=1;}
  }
}
