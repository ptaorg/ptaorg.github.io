const fs = require('node:fs');
const path = require('node:path');
const { ROOT, escapeHtml: e } = require('./archive-utils');

const cohorts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/school-evidence-cohorts.json'), 'utf8'));
const analysisHeadings = [
  '主体の分離', '事務の帰属', '学校側の所掌事務と公法上の権限',
  '個人情報保護法61条', '個人情報保護法69条', '教職員の服務・会計処理',
];

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
${doc.summary ? `<p><strong>${doc.originalChecked ? '原文で確認した事実' : '既存の確認記録'}</strong> ${e(doc.summary)}</p>` : ''}
${doc.unknown ? `<p><strong>未確認事項</strong> ${e(doc.unknown)}</p>` : ''}
${doc.url ? `<a class="evidence-source" href="${e(doc.url)}">学校公式の掲載先（再取得未確認）</a><p class="evidence-meta">検証環境ではHTTP 403またはタイムアウト。本文の既存確認状況は上記のとおりです。</p>` : ''}
</li>`).join('')}</ol>`;
}

function renderAnalysis(school) {
  if (!school.analysis) return '<p>学校別の法的評価は未作成です。</p>';
  return `<h4>学校別の法的評価</h4>
<p>確認した資料の範囲で評価を記載しました。現行運用や適法性の判断には、未確認事項の照合が必要です。</p>
<ol>${school.analysis.map((text, i) => `<li><strong>${analysisHeadings[i]}</strong><p>${e(text)}</p></li>`).join('')}</ol>`;
}

function cohortDetails(id) {
  const schools = cohorts[id];
  if (!schools) return '';
  const isIchinomiya = id === 'ichinomiya';
  const submitted = schools.flatMap(school => isIchinomiya ? school.disclosureFindings || [] : school.documents);
  const identified = submitted.filter(doc => doc.originalChecked).length;
  const reviewed = submitted.filter(doc => doc.originalChecked && doc.textVerified !== false).length;
  const schoolsWithAnalysis = schools.filter(school => school.analysis).length;
  const found = isIchinomiya
    ? schools.reduce((total, school) => total + Object.values(school.disclosure || {}).reduce((a, b) => a + b, 0), 0)
    : submitted.length;
  return `<div class="research-notice evidence-progress">
<ul>
<li>開示資料の所在 <strong>${found}件</strong></li>
<li>開示原本を識別 <strong>${identified}件</strong></li>
<li>具体的な本文記載を確認 <strong>${reviewed}件</strong> ／ 確認待ち ${found - reviewed}件</li>
<li>学校別の法的評価を記載 <strong>${schoolsWithAnalysis}校</strong> ／ 未作成 ${schools.length - schoolsWithAnalysis}校</li>
</ul>
</div>
${isIchinomiya ? '<p>学校別公開Web資料28件のうち、24件は本文確認の引継ぎ記録、4件は旧表示記録です。検証環境では28件とも再取得できませんでした（HTTP 403またはタイムアウト）。市全体の資料5件は上の一次資料欄を参照してください。</p><p><a href="https://www.city.ichinomiya.aichi.jp/shisei/shingikai/1009998/1001591.html">一宮市公式の学校サイト一覧</a> ／ <a href="https://www.city.ichinomiya.aichi.jp/shisetsu/hoikugakko/1001602.html">一宮市公式の学校連絡先</a> ／ <a href="https://ptaorg.github.io/ichinomiya-pta-report/schools/">専用調査サイトの学校索引</a>。学校・資料名を探すための導線です。同一原本を閲覧できる代替公開URLは確認できていません。</p>' : '<p>原本を識別した提出記録のうち、金額、手続、契約条項などを示せるものを本文確認として数えています。学校別評価は資料件数と別に集計します。</p>'}
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
