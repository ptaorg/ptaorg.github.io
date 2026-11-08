const fs = require('node:fs');
const path = require('node:path');
const { ROOT, escapeHtml: e } = require('./archive-utils');

const cohorts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/school-evidence-cohorts.json'), 'utf8'));
const analysisHeadings = [
  '主体の分離', '事務の帰属', '学校側の所掌事務と公法上の権限',
  '個人情報保護法61条', '個人情報保護法69条', '教職員の服務・会計処理',
];
const hasReviewedOriginal = school => [...school.documents, ...(school.disclosureFindings || [])]
  .some(doc => doc.originalChecked && doc.textVerified !== false);

function evidenceStatus(doc) {
  if (doc.textVerified === false) return '原本・該当箇所を識別／具体的記載は確認待ち';
  if (doc.originalChecked) return '開示原本の具体的記載を確認';
  if (doc.verified === true) return '本文の指定箇所を確認（引継ぎ記録）';
  if (doc.verified === false) return '旧表示記録あり・本文は再確認待ち';
  return '提出一覧・既存調査報告で照合';
}

function cohortIndex(municipality) {
  return (cohorts[municipality.id] || []).map(school => ({
    prefecture: municipality.prefecture,
    municipality: municipality.name,
    name: school.name,
    type: school.type,
    url: municipality.url + '#school-' + school.id,
    documents: school.documents.map(doc => ({ title: doc.title, status: evidenceStatus(doc) })),
  }));
}

function displayYear(year) {
  if (!year) return '未確認';
  return year < 100 ? `令和${year}年度` : `${year}年度`;
}

function renderDocuments(documents, source) {
  return `<ol class="evidence-documents">${documents.map(doc => `<li>
<strong>${e(doc.title)}</strong>
<p class="evidence-meta"><span class="evidence-status">${e(evidenceStatus(doc))}</span><br>作成日 ${e(doc.date || '未確認')} ／ 対象年度 ${e(displayYear(doc.targetYear || doc.year))}${doc.targetYear && doc.targetYear !== doc.year ? ` ／ 市の提出区分 令和${e(doc.year)}年度` : ''}</p>
<p>${e(source)}。該当箇所 ${e(doc.locator || '未確認')}</p>
${doc.summary ? `<p><strong>${doc.originalChecked ? '原文で確認した記載（要旨）' : '既存の確認記録'}</strong> ${e(doc.summary)}</p>` : ''}
${doc.unknown ? `<p><strong>未確認事項</strong> ${e(doc.unknown)}</p>` : ''}
${doc.url ? `<a class="evidence-source" href="${e(doc.url)}">学校公式の掲載先（閲覧再確認で403）</a><p class="evidence-meta">ログインしていないChromeでHTTP 403を確認しました。</p>` : ''}
</li>`).join('')}</ol>`;
}

function renderAnalysis(school) {
  if (!school.analysis) return '<p>学校別の法的評価は未作成です。</p>';
  const { facts, unknowns, followUp, sources } = school.evaluation;
  const limited = !hasReviewedOriginal(school);
  return `<h4>学校別の法的評価</h4>
${limited ? '<p>確認範囲は提出資料一覧と補足の公開資料です。当校分の開示原本に基づく運用評価には追加資料が必要です。</p>' : ''}
<p><strong>確認事実</strong> ${e(facts)}</p>
${sources?.length ? `<ul>${sources.map(source => `<li><a href="${e(source.url)}">${e(source.title)}</a></li>`).join('')}</ul>` : ''}
<p><strong>法令上の問題点</strong></p>
<ol>${school.analysis.map((text, i) => `<li><strong>${analysisHeadings[i]}</strong><p>${e(text)}</p></li>`).join('')}</ol>
<p><strong>未確認事項</strong> ${e(unknowns)}</p>
<p><strong>追加照会事項</strong> ${e(followUp)}</p>`;
}

function cohortDetails(id) {
  const schools = cohorts[id];
  if (!schools) return '';
  const isIchinomiya = id === 'ichinomiya';
  const submitted = schools.flatMap(school => isIchinomiya ? school.disclosureFindings || [] : school.documents);
  const identified = submitted.filter(doc => doc.originalChecked).length;
  const reviewed = submitted.filter(doc => doc.originalChecked && doc.textVerified !== false).length;
  const schoolsWithAnalysis = schools.filter(school => school.analysis).length;
  const limited = schools.filter(school => school.analysis && !hasReviewedOriginal(school)).length;
  const found = isIchinomiya
    ? schools.reduce((total, school) => total + Object.values(school.disclosure || {}).reduce((a, b) => a + b, 0), 0)
    : submitted.length;
  return `<div class="research-notice evidence-progress">
<ul>
<li>開示資料の所在 <strong>${found}件</strong></li>
<li>開示原本を識別 <strong>${identified}件</strong></li>
<li>具体的な本文記載を確認 <strong>${reviewed}件</strong> ／ 確認待ち ${found - reviewed}件</li>
<li>学校別の法的評価を記載 <strong>${schoolsWithAnalysis}校</strong> ／ 未作成 ${schools.length - schoolsWithAnalysis}校</li>
${limited ? `<li>評価の内訳：開示原本に基づく評価 ${schoolsWithAnalysis - limited}校 ／ 提出資料一覧・補足公開資料に基づく照会整理 ${limited}校</li>` : ''}
</ul>
</div>
<p>法的評価の共通参照先は、<a href="https://laws.e-gov.go.jp/law/415AC0000000057">個人情報保護法61条・69条</a>、<a href="https://www.ppc.go.jp/files/pdf/202603_school_pta_pd_point.pdf">個人情報保護委員会の公立学校・PTA向け資料</a>、<a href="https://www.ppc.go.jp/all_faq_index/faq7-q3-3-2/">目的外利用・提供のQ&amp;A</a>、<a href="https://laws.e-gov.go.jp/law/325AC0000000261">地方公務員法35条</a>です。</p>
${isIchinomiya ? '<p>学校別公開Web資料28件のうち、24件は本文確認の引継ぎ記録、4件は旧表示記録です。2026年11月8日にログインしていないChromeで23校28件を開き、全件でHTTP 403を確認しました。同じ資料IDが検索に出た別URL候補6件も403でした。閲覧できる同一原本の代替公開URLは確認できていません。市全体の資料5件は上の一次資料欄を参照してください。</p><p><a href="https://www.city.ichinomiya.aichi.jp/shisei/shingikai/1009998/1001591.html">一宮市公式の学校サイト一覧</a> ／ <a href="https://www.city.ichinomiya.aichi.jp/shisetsu/hoikugakko/1001602.html">一宮市公式の学校連絡先</a> ／ <a href="https://ptaorg.github.io/ichinomiya-pta-report/schools/">専用調査サイトの学校索引</a>。学校・資料名を探すための導線です。</p>' : '<p>原本を識別した提出記録のうち、金額、手続、契約条項などを示せるものを本文確認として数えています。学校別評価は資料件数と別に集計します。</p>'}
${schools.map(school => `<section class="research-region school-evidence" id="school-${e(school.id)}">
<h3>${e(school.name)}</h3><p>${e(school.note)}</p>
${school.references === undefined ? '' : `<p>旧Web台帳の保存参照 ${e(school.references)}件。本文未確認の参照も含みます。</p>`}
${isIchinomiya ? `<p>開示取得資料の所在 ${school.disclosure ? Object.entries(school.disclosure).sort().map(([year, count]) => `令和${e(year.slice(1))}年度 ${e(count)} PDFファイル`).join(' ／ ') : '該当するフォルダを確認できていません'}。</p>` : ''}
${school.audits?.length ? `<p>当校が対象に含まれる監査 ${school.audits.map(year => `<a href="#source-audit-${e(year)}">${e(year)}年の監査報告</a>`).join(' ／ ')}</p>` : ''}
${school.documents.length ? renderDocuments(school.documents, isIchinomiya ? '学校公式の公開Web資料' : '市の開示資料。原本の所在は内部台帳に記録') : isIchinomiya ? '<p>この索引に学校公式の公開Web資料は登録されていません。</p>' : '<p>この索引に登録された開示資料はありません。</p>'}
${school.disclosureFindings?.length ? `<h4>開示原本で確認した記載</h4>${renderDocuments(school.disclosureFindings, '情報公開請求で取得。原本の所在は内部台帳に記録')}` : ''}
${renderAnalysis(school)}
<p><a href="#schools">学校別索引へ戻る</a> ／ <a href="#administrative-responses">自治体の行政回答・関連資料</a></p>
</section>`).join('\n')}`;
}

module.exports = { cohortIndex, cohortDetails };
