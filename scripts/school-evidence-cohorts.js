const fs = require('node:fs');
const path = require('node:path');
const { ROOT, escapeHtml: e } = require('./archive-utils');

const cohorts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/school-evidence-cohorts.json'), 'utf8'));

function evidenceStatus(doc) {
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

function cohortDetails(id) {
  const schools = cohorts[id];
  if (!schools) return '';
  const source = id === 'ichinomiya' ? '学校公式の公開資料' : '市の開示資料（提出一覧と既存調査報告書を参照）';
  return `<p>学校名から各校の記録に移動できます。資料の登録、本文確認、学校別の法的評価を区別しています。</p>
${schools.map(school => `<section class="research-region" id="school-${e(school.id)}">
<h3>${e(school.name)}</h3><p>${e(school.note)}</p>
${school.references === undefined ? '' : `<p>旧台帳の保存参照：${e(school.references)}件。参照件数には掲載記録や本文未確認資料も含まれます。</p>`}
${id === 'ichinomiya' ? `<p>開示取得資料の所在：${school.disclosure ? Object.entries(school.disclosure).sort().map(([year, count]) => `令和${e(year.slice(1))}年度 ${e(count)} PDFファイル`).join(' ／ ') : '該当するフォルダを確認できていません'}。本文確認数とは別の集計です。</p>` : ''}
${school.audits?.length ? `<p>当校が対象に含まれる監査：${school.audits.map(year => `<a href="#source-audit-${e(year)}">${e(year)}年の監査報告</a>`).join(' ／ ')}</p>` : ''}
${school.documents.length ? `<ul>${school.documents.map(doc => `<li>
<strong>${e(doc.title)}</strong> ／ ${doc.year ? e(doc.year < 100 ? '令和' + doc.year + '年度' : doc.year + '年度') : '年度未確認'} ／ ${e(evidenceStatus(doc))}
<p>取得元：${e(source)}。該当箇所：${e(doc.locator)}</p>
${doc.summary ? `<p>${e(doc.summary)}</p>` : ''}
${doc.url ? `<p><a href="${e(doc.url)}">学校公式の掲載資料を開く</a></p>` : ''}
</li>`).join('')}</ul>` : '<p>この索引で参照できる個別文書はありません。</p>'}
${school.disclosureFindings?.length ? `<h4>開示原本で確認した記載と確認事項</h4><ul>${school.disclosureFindings.map(doc => `<li><strong>${e(doc.title)}</strong> ／ ${e(doc.locator)}<p>${e(doc.summary)}</p></li>`).join('')}</ul>\n` : ''}<p><a href="#schools">学校別索引へ戻る</a> ／ <a href="#administrative-responses">自治体の行政回答・関連資料</a></p>
</section>`).join('\n')}`;
}

module.exports = { cohortIndex, cohortDetails };
