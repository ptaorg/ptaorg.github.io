#!/usr/bin/env node
/* Deterministic, unpublished report skeletons and source ledger. Never publishes. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateReport} from './validate-dataset.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const def=JSON.parse(fs.readFileSync(path.join(here,'..','evaluation-axes.json'),'utf8'));
const text=x=>String(x??'').replaceAll('|','\\|').replace(/[\r\n]+/g,' ').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const link=x=>x?`[原本](${x})`:'【格納場所を確認】';
const rate=x=>x===null?'算定不能':`${x.toFixed(1)}%`;
const ref=x=>x.map(e=>`${text(e.sourceId)}（${text(e.locator)}）`).join('、')||'未確認';
const stateJP={confirmed_yes:'一次資料で記載あり',confirmed_no:'一次資料で明示的に記載なし',indication:'示唆・要確認',unknown:'未確認',not_applicable:'非該当',conflicting:'資料間矛盾'};
const legalTemplate=`1. **主体の分離**：学校・教育委員会（公的主体）／PTA（私的団体）を区別した分析を追加（未記述）。\n2. **事務の帰属**：当該事務が学校かPTAかの根拠を追加（未記述）。\n3. **学校側の公法上の権限**：適用する具体的な条文と例外根拠を確認（未記述）。\n4. **個人情報**：所掌事務検証の後、61条・69条等を検討（未記述）。\n5. **根拠と結論の区別**：反証、例外、適用関係、未確認事項を明記（未記述）。`;

export function buildDraft(dataset){
  const check=validateReport(dataset);
  if(!check.ok)throw Error('Invalid audit dataset: '+check.errors.map(e=>e.code+' '+e.at).join('; '));
  const d=dataset,stats=check.metrics,srcById=new Map(d.sources.map(s=>[s.id,s]));
  const lines=[
    `# ${text(d.municipality.prefecture)} ${text(d.municipality.name)}｜公立学校PTA制度・運用総合報告書`,
    '',`> **未公開の作業草稿** ｜評価規格 ${d.schemaVersion} ｜調査基準日 ${d.asOf} ｜報告書ID ${d.reportId} ｜原資料台帳: [sources.md](sources.md)`,
    '',`## 0. 調査範囲と資料の信頼性`,
    '',`公立学校の母集団：**${d.scope.totalPublicSchools}校**（根拠資料ID: ${text(d.scope.populationSourceId)}）。今回の調査対象：**${d.schools.length}校**。調査方式：${d.scope.sampling==='census'?'全数':'選定対象'}。学校を母集団とした対象カバー率：${rate(stats.coverageOfAllPublicSchoolsPct)}。対象年度：${d.scope.targetYears.join('、')}。`,
    '',`範囲の限定：${text(d.scope.scopeNote)}。資料の収集対象と収集できた資料を混同しない。未確認校は評価不能として明示。`,
    '',`## 1. 自治体全体の特色と調査上の結論`,
    '',`【根拠資料と学校数を添え、特色を文章で記述。反証・別解釈・未解明の論点を必ず併記。未記述のまま公開不可】`,
    '',`## 2. 教育委員会・自治体の制度、通知、回答`,
    '',`| 文書ID | 区分 | 資料ID | 記載内容 | 対象範囲 |`,
    `|---|---|---|---|---|`,
    ...(d.municipalDocuments.length?d.municipalDocuments.map(a=>`| ${text(a.id)} | ${text(a.category)} | ${text(a.sourceId)} | ${text(a.statement)} | ${text(a.scopeOfEffect)} |`):['| 未確認 | 未確認 | - | 自治体資料を追加調査 | - |']),
    '',`通知や規則の存在と、それがPTA内部事務を学校側の公務として行える権限を創設するかは別問題。`,
    '',`## 3. 調査対象校の固定12軸集計`,
    '',`| 12評価軸 | YES / 全対象校 | NO | 示唆 | 未確認 | 矛盾 | 非該当 | 全対象校確認YES率 | 判定可能校YES率 | 判定可能率 |`,
    `|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|`,
    ...stats.axes.map(a=>`| ${text(a.label)} | ${a.confirmed_yes}/${a.denominatorTargetSchools} | ${a.confirmed_no} | ${a.indication} | ${a.unknown} | ${a.conflicting} | ${a.not_applicable} | ${rate(a.confirmedYesOfTargetPct)} | ${rate(a.confirmedYesOfKnownPct)} | ${rate(a.confirmedCoveragePct)} |`),
    '',`**割合の解釈**：YESは対象制度・行為の存在に関する観察値であり、直ちに適法／違法の判定ではない。判定可能校が0の場合は算定不能。標本抽出なら全校実態率への一般化不可。`,
    '',`## 4. 項目別の事実、反証、法的評価`,
    '',...def.axes.flatMap(a=>[`### ${text(a.label)}（${a.id}）`,'',`【該当校の原資料・該当頁／確認事実／反証／例外の根拠／未確認／暫定評価を記述。確認済みでない事実は断定しない】`,'']),
    `## 5. 学校別評価書と原資料への導線`,'',
    `| 学校 | 校種 | 対象年度 | 直接確認済みYES/NO軸数 | 個別評価書 |`,
    `|---|---|---|---:|---|`,
    ...d.schools.map(s=>`| ${text(s.name)} | ${text(s.schoolType)} | ${s.analysisYear} | ${Object.values(s.axes).filter(v=>['confirmed_yes','confirmed_no'].includes(v.status)).length}/12 | [評価書](schools/${s.id}.md) |`),
    '',`## 6. 学校・教育委員会への追加確認と是正検証`,'',`【担当主体・根拠資料・質問番号・期限と、学校側が行える事務の法的根拠を具体的に記載】`,
    '',`## 7. 法的評価の必須順序`,'',legalTemplate,
    '',`## 8. 出典・検証と公開判定`,'',`[原資料台帳](sources.md)。この自動生成は集計・分類の検証に限る。URLの実接続、資料原文、適法性、匿名化、Senior review、人間承認は、独立に確認するまで未実施。`,
    '',`**公開状態：${d.publication.status}（草稿段階。自動生成で公開承認しない）**`,''];
  const files={'municipality-report.md':lines.join('\n'),'metrics.json':JSON.stringify(stats,null,2)+'\n'};
  files['sources.md']=['# 原資料台帳（確認状態と出典位置）','',`> ${d.reportId} ｜ ${d.asOf} ｜自動生成草稿`,'',
    '| ID | 文書名 | 発行主体 | 対象年度 | 文書日付 | 検証状態 | URL／格納先 |',
    '|---|---|---|---|---|---|---|',
    ...d.sources.map(s=>`| ${text(s.id)} | ${text(s.title)} | ${text(s.issuer)} | ${text(s.targetYear)} | ${s.documentDate??'未確認'} | ${text(s.verification)} | ${s.url?link(s.url):text(s.filePath)} |`),
    '',`原本直接照合が済んでいない資料は「検証済み」と書き換えない。個人情報のマスキングを別途確認。`,''].join('\n');
  for(const school of d.schools){
    const l=[`# ${text(d.municipality.name)} ${text(school.name)}｜PTA運用個別評価書`,'',
      `> **未公開の作業草稿** ｜評価規格 ${d.schemaVersion} ｜対象年度 ${school.analysisYear} ｜学校ID ${school.id} ｜基準日 ${d.asOf}`,
      '',`## 1. 学校と確認した原資料`,'',`校種：${text(school.schoolType)}。原資料ID：${school.sourceIds.map(text).join('、')||'未取得'}。`,'',
      '| 原資料ID | 文書名 | 原本の確認状態 | 原本URL／所在 |','|---|---|---|---|',
      ...(school.sourceIds.length?school.sourceIds.map(sid=>{const src=srcById.get(sid);return `| ${text(sid)} | ${text(src.title)} | ${text(src.verification)} | ${src.url?link(src.url):text(src.filePath)} |`}):['| - | 資料未確認 | - | - |']),
      '',`## 2. 確認事実と未確認事項`,'',`【資料の記載事実のみ列挙。学校がPTAを設立した、許可した、徴収した等の事実は文書・担当・年度を確認してから記載】`,
      '',`## 3. 固定12評価軸`,'',`| 項目 | 観察区分 | 記載・不足理由 | 証拠IDと頁 |`,
      `|---|---|---|---|`,
      ...def.axes.map(a=>{const v=school.axes[a.id];return `| ${text(a.label)} | ${stateJP[v.status]} | ${text(v.observation)} | ${ref(v.sourceRefs)} |`}),
      '',`確認なしは「問題なし」ではない。確認YES／NOは適法性の評価ではない。`,
      '',`## 4. 法的評価（必ず5段階）`,'',legalTemplate,
      '',`## 5. 反証・例外・再照会・是正確認`,'',`【原資料・制度根拠・本人同意では創設できない権限の検証・見解の相違を記載】`,
      '',`## 6. 検証履歴・公開判定`,'',`【原本再確認日、文書の正確なページ、法的再審査、匿名化、Senior review、人間承認】`,'',
      `**公開状態：${d.publication.status}（自動生成時点で未公開）**`,''];
    files[`schools/${school.id}.md`]=l.join('\n');
  }
  files['map-record.json']=JSON.stringify({municipalityId:d.municipality.id,municipalityName:d.municipality.name,prefecture:d.municipality.prefecture,
    coordinates:d.municipality.lat===null?null:[d.municipality.lat,d.municipality.long],coordinateSourceId:d.municipality.coordinateSourceId,
    coordinateType:'verified-municipality-representative-not-school-location',reportUrl:null,publishedSchoolReports:0,targetSchools:d.schools.length,
    coverageRatePct:stats.coverageOfAllPublicSchoolsPct,publicationStatus:'draft',asOf:d.asOf,
    mapLabelPolicy:'調査状況を表示。法的判定や学校所在地は推定しない'},null,2)+'\n';
  return files;
}

const direct=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(direct){
  const input=process.argv[2],out=process.argv[3];
  if(!input||!out){console.error('Usage: node ai-system/report-standards/scripts/render-draft.mjs <dataset.json> <output-directory>');process.exitCode=2;}
  else try{
    const d=JSON.parse(fs.readFileSync(input,'utf8'));
    const files=buildDraft(d);
    if(d.publication.status==='approved')throw Error('Renderer is for draft datasets only. Never auto-create public approved documents.');
    for(const [name,contents] of Object.entries(files)){
      const full=path.join(out,name);
      fs.mkdirSync(path.dirname(full),{recursive:true});
      fs.writeFileSync(full,contents,'utf8');
    }
    console.log(`Generated unpublished draft artifacts: ${Object.keys(files).length}`);
  }catch(e){console.error(e.message);process.exitCode=1;}
}
