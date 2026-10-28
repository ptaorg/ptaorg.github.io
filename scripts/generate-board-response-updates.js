const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canonical = (prefecture, name) => {
  let n = String(name).replace(/\s+/g, '');
  if (n === prefecture + '教育庁') n = prefecture;
  else if (n.startsWith(prefecture) && n !== prefecture) n = n.slice(prefecture.length);
  return prefecture + '/' + n;
};
function render(data) {
  const old = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/board-responses.json'))).responses;
  const records = data.records;
  const definite = records.filter(r => r.countAsResponse);
  const previous = new Set(old.map(r => canonical(r.prefecture, r.municipality)));
  const added = new Set(definite.map(r => canonical(r.prefecture, r.municipality)).filter(k => !previous.has(k)));
  const topics = [...new Set([...records.flatMap(r => r.topics), ...old.flatMap(r => r.topics)])].sort();
  const statuses = [...new Set(records.map(r => r.status))].sort();
  const options = a => a.map(s => `<option>${esc(s)}</option>`).join('');
  return `<!-- board-response-updates:start -->
<section id="response-updates" class="board-updates"><div class="wrap reading-body">
<h2>追加回答・対応状況（2025–2026年）</h2>
<p>更新 ${esc(data.reviewedAt)}。従来の72件の公開本文・個別URLは保存し、受領資料から確認した要約を追補しています。今回の${records.length}件のうち、実質回答（一部回答を含む）${definite.length}件、回答未了・資料確認待ち等${records.length - definite.length}件。実質回答による新規掲載自治体は${added.size}です。追補は初回回答を意味せず、同一回答の両アカウント受信・再送・パスワード通知は別回答として数えません。</p>
<p>本文原文の公開と要約掲載は区別します。以下は受領メール及び取得できた添付資料の確認に基づく要約です。本文未取得の添付資料は内容を推定せず、未確認と明示しています。メール本文・個人名・メールアドレス・未公開添付資料を公開するものではありません。資料未読・検討中・今後の予定を実施済みの事実と扱いません。</p>
<p>学校・教育委員会と任意団体PTAは別主体です。まず事務の帰属と学校側の具体的な所掌事務・権限を確認し、次に個人情報保護法61条の利用目的、69条の利用・提供の制限を検討します。委任・同意・慣例だけで校務性や適法性を確定せず、各回答と独立した研究上の確認事項を分けています。<a href="https://www.ppc.go.jp/personalinfo/legal/guidelines_administrative/">検討基準：個人情報保護委員会ガイドライン5-1・5-5</a></p>
<form id="board-response-search" role="search"><label>自治体・部署・回答内容・論点<input id="board-query" type="search" placeholder="厚木市、委任、61条…"></label><label>論点<select id="board-topic"><option value="">すべて</option>${options(topics)}</select></label><label>回答状況<select id="board-status"><option value="">すべて</option><option>従来公開本文</option>${options(statuses)}</select></label><button type="reset">条件を解除</button></form>
<p id="board-query-status" role="status">追補${records.length}件と従来公開本文72件を掲載しています。</p><p id="board-query-empty" hidden>一致する記録はありません。検索語や条件を変更してください。</p>
<p><a href="#municipality-index">従来公開本文72件の索引へ</a> ／ <a href="/data/board-response-updates.json" download>追補データJSON</a> ／ <a href="/data/board-response-updates.csv" download>追補データCSV</a></p>
<div id="board-update-records">${records.map(r => `<article class="board-update-record" id="${esc(r.id)}" data-board-update data-status="${esc(r.status)}" data-topics="${esc(JSON.stringify(r.topics))}">
<h3>${esc(r.prefecture)} ${esc(r.municipality)}</h3><p><strong>${esc(r.status)}</strong> ／ 回答日（文書日未確認時は受信日）：${esc(r.date || '文書日未確認')} ／ 受信日：${esc(r.receivedDate || '未確認')}</p>
<p>回答部署：${esc(r.department || '部署未確認')} ／ 確認状況：${esc(r.verification)}</p><p>照会事項：${esc(r.questionSummary)}</p>
<h4>行政側の回答要約</h4><p>${esc(r.adminSummary)}</p>
<p>回答中で示された根拠：${esc(r.citedLaws.length ? r.citedLaws.join('、') : '具体的条文・規程の提示は要確認')}</p>
<details><summary>当委員会の分析・未確認事項</summary><h4>研究上の確認事項（行政回答と別）</h4>${r.researchIssues.map(t => `<p>${esc(t)}</p>`).join('')}<h4>確認の限界・後続状況</h4>${r.limitations.map(t => `<p>${esc(t)}</p>`).join('')}</details>
<p class="board-source">出典：${esc(r.source)}。原本・受領メールは非公開。原本確認と、その説明の適法性・運用改善の実施確認は異なります。</p><p><a href="#response-updates">検索条件へ戻る</a> ／ <a href="#${esc(r.id)}">この記録へのリンク</a></p>
</article>`).join('\n')}</div></div></section>
<!-- board-response-updates:end -->`;
}
function main() {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/board-response-updates.json')));
  const file = path.join(ROOT, 'board-responses.html');
  const before = fs.readFileSync(file, 'utf8');
  const block = render(data);
  const re = /<!-- board-response-updates:start -->[\s\S]*?<!-- board-response-updates:end -->/;
  const after = re.test(before) ? before.replace(re, block) : before.replace('<section class="dataset-scope-section"', block + '\n<section class="dataset-scope-section"');
  const columns = ['id','prefecture','municipality','date','receivedDate','department','status','verification','questionSummary','adminSummary','citedLaws','topics','researchIssues','limitations','source','countAsResponse'];
  const csv = '\ufeff' + [columns, ...data.records.map(r => columns.map(k => Array.isArray(r[k]) ? r[k].join(' ／ ') : r[k] ?? ''))].map(row => row.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n') + '\n';
  const csvFile = path.join(ROOT, 'data/board-response-updates.csv');
  if (process.argv.includes('--check')) {
    if (before !== after || !fs.existsSync(csvFile) || fs.readFileSync(csvFile, 'utf8') !== csv) throw Error('Board response supplement is out of date; regenerate explicitly.');
  } else {
    fs.writeFileSync(file, after); fs.writeFileSync(csvFile, csv);
  }
}
if (require.main === module) main();
module.exports = { canonical, render };
