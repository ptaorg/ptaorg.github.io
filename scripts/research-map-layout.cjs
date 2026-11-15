"use strict";

function escape(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function excerpt(m){const s=String(m.summary?.[0]||"この地域で確認できた資料と調査状況を掲載しています。").replace(/\s+/g," ").trim();const first=s.split("。").slice(0,2).filter(Boolean).join("。");return escape(first.length>170?first.slice(0,167)+"…":first+(first.endsWith("。")?"":"。"));}

function schoolLinks(m){return `<ul>${(m.schools||[]).map(s=>`<li data-school-url="${escape(s.url)}" data-school-type="${escape(s.type)}"><a href="${escape(s.url)}">${escape(s.name)}</a>（${escape(s.type)}）</li>`).join("")}</ul>`;}

function option(id,name,values){return `<label>${escape(name)}<select id="${id}"><option value="">すべて</option>${values.map(v=>`<option>${escape(v)}</option>`).join("")}</select></label>`;}

function regionCard(m){
const href=m.url||m.catalogUrl;
const schools=m.schools||[];
const many=m.schoolReportCount?`学校別の調査 ${m.schoolReportCount}校`:(schools.length?`学校資料 ${schools.length}校`:"");
const action=m.url?"自治体の評価を読む":"資料の所在を見る";
const detail=schools.length?`<details class="research-card-documents"><summary>学校資料を見る（${schools.length}校）</summary>${schoolLinks(m)}</details>`:m.schoolReportCount&&m.url?'<p class="research-card-documents-note">学校別の調査は自治体の評価ページから確認できます。</p>':"";
return `<article class="research-region" data-region="${escape(m.id)}"><p class="research-region-place">${escape(m.prefecture)}${many?` <span>／ ${escape(many)}</span>`:""}</p><h3>${href?`<a href="${escape(href)}">${escape(m.name)}</a>`:escape(m.name)}</h3><p class="research-region-description">${excerpt(m)}</p>${href?`<p class="research-region-go"><a href="${escape(href)}">${action}</a></p>`:'<p class="research-region-unpublished">自治体の評価は現在準備中です。</p>'}${detail}</article>`;
}

function renderPrimaryMap(index,surveyHTML=""){
const regions=[...index.municipalities];
const featured=regions.filter(m=>m.url).sort((a,b)=>String(b.updated||"").localeCompare(String(a.updated||""))||(b.schoolReportCount||0)-(a.schoolReportCount||0)).slice(0,6);
const selected=new Set(featured.map(m=>m.id));
const remaining=regions.filter(m=>!selected.has(m.id));
const lead=featured[0]||regions.find(m=>m.url)||regions[0];
const advanced=option("research-mode","資料の種類",["自治体研究","学校別資料"])+option("research-city","自治体名",regions.map(m=>m.name))+
 option("research-theme","調査内容",index.themes)+option("research-school","学校種別",[...new Set(regions.flatMap(m=>m.schools.map(s=>s.type)))])+
 option("research-publication","資料公開状況",[...new Set(regions.flatMap(m=>m.schools.flatMap(s=>s.documents.map(d=>d.status))))])+
 option("research-response","教育委員会の回答",["掲載確認","未確認"])+option("research-audit","監査・審査請求",["掲載確認","未確認"])+option("research-improvement","改善措置",["掲載確認","未確認"]);
return `<section class="research-introduction" aria-labelledby="research-introduction-title">
 <p class="research-introduction-small">全国のPTA調査</p>
 <h2 id="research-introduction-title">気になる地域を、地図から選ぶ。</h2>
 <p>入会・退会の自由は守られているか。学校はPTAの事務をどこまで担当しているか。確認できた資料をもとに自治体ごとの評価を順次掲載しています。</p>
 <p class="research-introduction-guide">地図や自治体名から選ぶと、<strong>市の総合評価 → 学校ごとの調査 → 根拠資料</strong>の順に確認できます。</p>
</section>
<form id="research-filters" role="search" aria-label="調べたい自治体を探す">
 <div class="research-search-simple">
  <label class="research-search-query">自治体名・学校名から探す<input id="research-query" type="search" placeholder="例：大崎市、横浜市、学校名" autocomplete="off"></label>
  ${option("research-prefecture","都道府県",[...new Set(regions.map(m=>m.prefecture))])}
  <button type="reset" class="research-reset">条件を解除</button>
 </div>
 <details class="research-search-advanced" id="research-advanced"><summary>詳しい条件で探す</summary><div class="research-search-extra">${advanced}</div></details>
</form>
<div class="research-map-layout">
 <section class="research-map-pane" aria-label="日本地図から自治体を選ぶ">
  <div class="research-map-heading"><h2>日本地図から探す</h2><p>地図のピンを押すと、自治体の評価や資料を開けます。</p></div>
  <div data-research-map class="research-map" aria-label="全国PTA研究地図"></div>
  <p id="research-map-message" class="research-map-help">地図が表示されない場合も、下の自治体一覧から調べられます。</p>
 </section>
 <aside class="research-map-feature" aria-labelledby="research-feature-title">
  <p class="research-feature-overline">公開中の自治体評価から</p>
  <h2 id="research-feature-title">${lead?escape(lead.prefecture+" "+lead.name):"自治体の調査"}</h2>
  <p class="research-feature-label">最初に確認するのは、保護者の入会・退会の自由。</p>
  <p class="research-feature-desc">${lead?excerpt(lead):"各自治体の調査資料を順次掲載しています。"}</p>
  ${lead?.url?`<a class="research-feature-go" href="${escape(lead.url)}">この自治体の評価を読む <span aria-hidden="true">→</span></a>`:""}
  ${lead?.schoolReportCount?`<p class="research-feature-foot">学校別の調査 ${lead.schoolReportCount}校。詳しい評価と証拠資料を確認できます。</p>`:""}
  <div class="research-feature-bottom">調査で確認できた範囲と、まだ確認できていないことを区別しています。資料不足を「問題なし」とは扱いません。</div>
 </aside>
</div>
<div class="research-map-after"><p id="research-result-status" role="status">${regions.length}自治体・地域を掲載しています。</p><a href="#research-results">自治体の一覧から探す</a></div>
<p class="research-map-disclaimer">地図は自治体の代表位置を示し、学校所在地や違反件数・重大度を示すものではありません。現在の掲載は調査中の地域も含み、全国全自治体を網羅するものではありません。</p>
<section id="research-results" aria-labelledby="research-results-title">
 <div class="research-list-heading"><h2 id="research-results-title">自治体の評価・資料を見る</h2><p>資料を確認した自治体から掲載しています。詳しい学校資料は個別のページで確認できます。</p></div>
 <p hidden id="research-empty">一致する自治体がありません。自治体名の一部で検索するか、条件を解除してください。</p>
 <p id="research-query-scope" class="research-scope"></p>
 <div class="research-region-grid research-region-featured">${featured.map(regionCard).join("")}</div>
 ${remaining.length?`<details class="research-more" id="research-more-regions"><summary>そのほかの自治体・地域を表示（${remaining.length}地域）</summary><div class="research-region-grid research-region-remaining">${remaining.map(regionCard).join("")}</div></details>`:""}
</section>
<p class="research-deeper-link">全国を横断した調査記録は、<a href="#national-primary-survey">一次資料の調査</a>で確認できます。</p>
${surveyHTML}
`;
}

module.exports={renderPrimaryMap,regionCard,excerpt};