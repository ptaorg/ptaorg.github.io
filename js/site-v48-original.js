/* PTA適正化推進委員会 — site.js v48 */
const SUPPORT_URL='/support.html';
const CONTACT_URL='/contact.html';
const path=location.pathname;
const isPage=n=>(path==='/'&&n==='index.html')||path.endsWith('/'+n)||path.endsWith(n);
const SITE_INDEX=[
 ['トップ','/index.html','任意加入、公私分離、個人情報、会費徴収、学校関与の全体像。'],
 ['保護者の方へ','/guide-parent.html','退会、非加入、会費、個人情報、役員強制に悩む保護者向け。'],
 ['PTA役員の方へ','/guide-pta.html','役員を責めず、入会記録、会計、個人情報、学校との分離を点検。'],
 ['教育委員会・学校の方へ','/guide-board.html','学校が関与する範囲を自己診断する行政・学校管理職向け。'],
 ['教育委員会の回答','/board-responses.html','教育委員会からの回答資料。'],
 ['全国資料館','/national-archive.html','自治体別・学校別のPTA実物文書アーカイブ。'],
 ['行政資料整理','/administrative-materials.html','文科省通知、個人情報保護委員会資料、法令本文等。'],
 ['横浜市教育委員会通知 学教第1965号','/journal/yokohama-notice-1965.html','通知本文、別紙1、別紙2を分けて整理した中核資料。'],
 ['横浜市通知 別紙1・別紙2','/journal/yokohama-notice-1965.html','任意加入、個人情報、会費説明、加入届ひな型の確認ポイント。'],
 ['横浜市通知の要点','/membership.html#yokohama','オプトイン方式と3点セット移行の説明。'],
 ['PTA入会申込書がない場合','/membership.html#no-application-record','入会記録、同意、会費徴収、学校関与を確認する質問。'],
 ['法的根拠から使う文書パック','/documents.html#legal-template-pack','根拠資料、確認事項、提出文書をまとめた入口。'],
 ['提出文書キット','/submission-kit.html','学校・PTA・教育委員会への確認文、会費分離申入書、個人情報確認書、根拠整理メモ。'],
 ['主張と根拠の対応表','/claim-evidence-ledger.html','主張、根拠条文、公式資料、実物文書、提出文例を対応させる根拠台帳。'],
 ['学校・教育委員会への照会書','/guideline.html#tpl-board-inquiry','入会記録、名簿、会費、教職員関与、施設利用を確認するひな形。'],
 ['PTA会費徴収分離申入書','/guideline.html#tpl-fee-separation','学校徴収金とPTA会費を分けるための提出文書。'],
 ['学校名簿・学校アプリ利用確認書','/guideline.html#tpl-school-info-stop','学校保有情報とPTA連絡利用の確認文書。'],
 ['PTA非会員情報と協力金','/privacy.html#nonmember-info-impossibility','非会員名簿、協力金、実費徴収を学校情報に依存させない整理。'],
 ['主要論点の整理','/journal.html#core-topics','消費者契約、非会員情報、公益性、学校徴収金を一次資料で整理。'],
 ['PTAと消費者契約法の関係','/journal/consumer-contract.html','PTA加入・会費請求を消費者契約法の定義、事業者性、説明、入会意思確認から整理。'],
 ['PTAオプトアウト加入の無効性','/journal/optout-invalidity.html','退会届方式・みなし加入を入会意思、会費、個人情報、学校関与の連鎖で整理。'],
 ['PTA非会員情報・協力金・学校名簿','/journal/nonmember-info.html','非会員名簿、協力金、学校アプリ、学校保有情報の利用を整理。'],
 ['学校徴収金とPTA会費を分ける理由','/journal/school-fee-separation.html','学校徴収金と任意団体会費を文書、口座、未納管理で分離する理由。'],
 ['学校経由の第三者提供同意とPTA名簿','/journal/third-party-consent.html','学校書類の中でPTAへの個人情報提供同意を取る場合の提供先、項目、利用目的、加入意思との分離。'],
 ['働き方改革から見たPTA会費代理徴収の限界','/journal/work-style-reform.html','学校徴収金の公会計化・学校経由しない支払いの流れからPTA会費と学校事務の分離を整理。'],
 ['PTA運営の現場実例','/compliance.html','みなし加入、抱き合わせ徴収、個人情報提供などを実物資料ベースで確認するページ。'],
 ['論考・調査報告','/journal.html','PTA運営の法的構造、行政対応、判例、制度史。'],
 ['総合分析レポート','/report.html','PTA運営に関する総合分析。'],
 ['法制度マップ','/law-map.html','条文と制度の関係整理。'],
 ['判例整理','/cases.html','PTA関連判例・事例の整理。'],
 ['PTA制度史','/timeline.html','PTA制度の沿革。'],
 ['運営チェック','/audit/index.html','PTA運営を点検するためのチェックツール。'],
 ['適正化ガイドライン','/guideline.html','PTA運営適正化の基本資料。'],
 ['お問い合わせ・相談',CONTACT_URL,'相談・情報提供の窓口。'],
 ['応援・寄付',SUPPORT_URL,'資料取得、資料整理、Web公開への支援。']
];
function addGlobalStyle(){
 if(document.getElementById('pta-v48-style'))return;
 const s=document.createElement('style');
 s.id='pta-v48-style';
 s.textContent=`
 .support-strip,.support-banner,.top-support,.donation-strip{display:none!important}.desktop-nav{gap:14px!important}.desktop-nav>.btn-gold{display:none!important}.entry-section:empty{display:none!important}
 .desktop-nav .support-nav-link{display:inline-flex;align-items:center;justify-content:center;min-width:56px;min-height:56px;border-radius:999px;background:#ea580c!important;color:#fff!important;font-weight:900!important;text-decoration:none!important;box-shadow:0 10px 24px rgba(234,88,12,.22)}
 .desktop-nav .support-nav-link:hover{background:#c2410c!important;color:#fff!important;transform:translateY(-1px)}
 .mobile-overlay.is-open{display:flex!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important}.mobile-link.support-mobile-link{background:#ea580c;color:#fff!important}
 .search-results-dropdown{display:none}.search-results-dropdown.is-open{display:block}.search-result-item{display:block;text-decoration:none;color:#0f2742;padding:10px 12px;border-bottom:1px solid #e5e7eb;background:#fff}.search-result-item strong{display:block;font-weight:900}.search-result-item span{display:block;color:#64748b;font-size:.82rem;line-height:1.55;margin-top:3px}
 .parent-page .visual-section{display:none!important}
 .parent-page .mc-section{background:#f4f8fc!important;color:var(--navy)!important;border-top:1px solid #e8edf4;border-bottom:1px solid #e8edf4}.parent-page .mc-section .section-title{color:var(--navy)!important}.parent-page .mc-section p{color:#27496f!important}.parent-page .mc-section .section-kicker{background:rgba(212,175,55,.18)!important;border:1px solid rgba(212,175,55,.35)!important;color:#7a5c00!important}.parent-page .mc-panel{background:#fff!important;border:1px solid #d8e0ea!important;box-shadow:var(--shadow-sm);color:var(--navy)!important}.parent-page .mc-panel>p{color:#27496f!important}.parent-page .mc-meter{background:#eef4fb!important;border:1px solid #d8e0ea!important}.parent-page .mc-count{background:var(--gold)!important;color:var(--navy)!important}.parent-page .mc-meter-text{color:#27496f!important}.parent-page .mc-meter-text b{color:var(--navy)!important}.parent-page .mc-option{background:#f8fafc!important;border:1px solid #d8e0ea!important}.parent-page .mc-option:hover{background:#eef4fb!important}.parent-page .mc-option strong{color:var(--navy)!important}.parent-page .mc-option span{color:var(--text-soft)!important}.parent-page .mc-app-link{color:var(--navy)!important;border-bottom-color:rgba(15,39,66,.28)!important}.parent-page #checker-result>div{background:#fff!important;border:1px solid #d8e0ea!important;color:var(--navy)!important}.parent-page #checker-result div,.parent-page #checker-result p{color:var(--text)!important}.parent-page #checker-result a{color:var(--navy)!important}.parent-page #checker-result a[style*="background:var(--gold)"]{background:var(--gold)!important;color:var(--navy)!important}.parent-page #checker-result a:not([style*="background:var(--gold)"]){background:#f8fafc!important;color:var(--navy)!important;border:1px solid #d8e0ea!important}
 .parent-page .pdf-section{background:#f4f8fc!important;color:var(--navy)!important;border-top:1px solid #e8edf4;border-bottom:1px solid #e8edf4}.parent-page .pdf-section .section-title{color:var(--navy)!important}.parent-page .pdf-section .section-lead{color:#27496f!important}.parent-page .pdf-section .section-kicker{background:rgba(212,175,55,.18)!important;border:1px solid rgba(212,175,55,.35)!important;color:#7a5c00!important}.parent-page .pdf-card{background:#fff!important;border:1px solid #d8e0ea!important;box-shadow:var(--shadow-sm)}.parent-page .pdf-card h3{color:var(--navy)!important}.parent-page .pdf-card p{color:var(--text-soft)!important}
 .parent-compliance-jump{background:#fff;padding:70px 0 76px;border-top:1px solid #e8edf4;border-bottom:1px solid #e8edf4}.parent-compliance-jump .pcj-wrap{width:min(calc(100% - 40px),1100px);margin-inline:auto;display:grid;grid-template-columns:minmax(0,.86fr) minmax(360px,1.14fr);gap:34px;align-items:center}.pcj-kicker{display:inline-flex;align-items:center;gap:8px;margin-bottom:12px;color:#8a6a10;font-size:.76rem;font-weight:900;letter-spacing:.08em}.pcj-kicker:before{content:'';width:28px;height:2px;background:var(--gold)}.pcj-title{font-family:'Noto Serif JP',serif;color:var(--navy);font-size:clamp(1.55rem,3vw,2.35rem);line-height:1.36;margin:0 0 14px}.pcj-text{color:var(--text-soft);font-size:.98rem;line-height:1.95;margin:0 0 18px}.pcj-list{margin:0 0 24px;padding:0;list-style:none;display:grid;gap:8px}.pcj-list li{position:relative;padding-left:20px;color:var(--text);font-size:.92rem;line-height:1.75}.pcj-list li:before{content:'・';position:absolute;left:0;color:var(--gold);font-weight:900}.pcj-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center}.pcj-btn{display:inline-flex;align-items:center;justify-content:center;padding:11px 20px;border-radius:999px;background:var(--navy);color:#fff;text-decoration:none;font-weight:900;box-shadow:0 10px 24px rgba(15,39,66,.16)}.pcj-btn:hover{background:#16395e;color:#fff;transform:translateY(-1px)}.pcj-note{font-size:.78rem;color:var(--text-soft);line-height:1.6}.pcj-preview{position:relative;height:470px;border:1px solid #d8e0ea;border-radius:18px;background:#f8fafc;box-shadow:0 18px 44px rgba(5,17,31,.14);overflow:hidden}.pcj-browserbar{height:38px;display:flex;align-items:center;gap:7px;padding:0 14px;background:#0f2742;color:rgba(255,255,255,.72);font-size:.72rem;font-weight:800}.pcj-browserbar i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.42);display:inline-block}.pcj-framebox{position:absolute;left:0;right:0;top:38px;bottom:0;overflow:hidden;background:#fff}.pcj-framebox iframe{position:absolute;left:0;top:0;width:1280px;height:1120px;border:0;transform:scale(.50);transform-origin:top left;pointer-events:none}.pcj-preview-mask{position:absolute;left:0;right:0;bottom:0;height:92px;background:linear-gradient(180deg,rgba(255,255,255,0),#fff);pointer-events:none}.pcj-preview-link{position:absolute;right:18px;bottom:18px;z-index:2;display:inline-flex;padding:9px 15px;border-radius:999px;background:var(--gold);color:var(--navy);font-weight:900;text-decoration:none;box-shadow:0 8px 18px rgba(0,0,0,.13)}
 .parent-board-response-jump{background:#fff;padding:70px 0 76px;border-top:1px solid #e8edf4;border-bottom:1px solid #e8edf4}.pbr-wrap{width:min(calc(100% - 40px),1100px);margin-inline:auto}.pbr-top{display:grid;grid-template-columns:minmax(0,.92fr) minmax(360px,1.08fr);gap:34px;align-items:start;margin-bottom:28px}.pbr-kicker{display:inline-flex;align-items:center;gap:8px;margin-bottom:12px;color:#8a6a10;font-size:.76rem;font-weight:900;letter-spacing:.08em}.pbr-kicker:before{content:'';width:28px;height:2px;background:var(--gold)}.pbr-title{font-family:'Noto Serif JP',serif;color:var(--navy);font-size:clamp(1.55rem,3vw,2.35rem);line-height:1.36;margin:0 0 14px}.pbr-lead{color:#27496f;font-size:.98rem;line-height:1.95;margin:0 0 22px}.pbr-btn{display:inline-flex;align-items:center;justify-content:center;padding:11px 20px;border-radius:8px;background:var(--navy);color:#fff;text-decoration:none;font-weight:900;box-shadow:0 10px 24px rgba(15,39,66,.16)}.pbr-btn:hover{background:#16395e;color:#fff;transform:translateY(-1px)}.pbr-map-preview{position:relative;height:340px;border:1px solid #d8e0ea;border-radius:18px;background:#f8fafc;box-shadow:0 18px 44px rgba(5,17,31,.14);overflow:hidden}.pbr-browserbar{height:38px;display:flex;align-items:center;gap:7px;padding:0 14px;background:#0f2742;color:rgba(255,255,255,.72);font-size:.72rem;font-weight:800}.pbr-browserbar i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.42);display:inline-block}.pbr-framebox{position:absolute;left:0;right:0;top:38px;bottom:0;overflow:hidden;background:#fff}.pbr-framebox iframe{position:absolute;left:0;top:0;width:1180px;height:880px;border:0;transform:scale(.54);transform-origin:top left;pointer-events:none}.pbr-map-link{position:absolute;right:18px;bottom:18px;z-index:2;display:inline-flex;padding:9px 15px;border-radius:8px;background:var(--navy);color:#fff;font-weight:900;text-decoration:none;box-shadow:0 8px 18px rgba(0,0,0,.13)}.pbr-examples{display:grid;gap:14px}.pbr-response-item{background:#fffdf8;border:1px solid #e8dfc9;border-radius:12px;padding:20px 22px}.pbr-muni-name{font-family:'Noto Serif JP',serif;font-size:1.05rem;font-weight:900;color:var(--navy);margin-bottom:4px}.pbr-meta{font-size:.82rem;color:var(--text-soft);margin-bottom:10px}.pbr-response-item summary{cursor:pointer;list-style:none;font-size:.88rem;font-weight:700;color:var(--navy);padding:6px 0;user-select:none}.pbr-response-item summary::-webkit-details-marker{display:none}.pbr-response-item details[open] summary{margin-bottom:10px}.pbr-body{font-size:.91rem;line-height:1.85;color:var(--text);white-space:pre-wrap;border-top:1px solid var(--line);padding-top:12px}.pbr-back{margin-top:14px;font-size:.8rem;color:var(--navy);font-weight:700}.pbr-note{max-width:920px;margin:24px 0 0;padding:18px 20px;background:#fffdf3;border:1px solid #f1df9b;border-left:6px solid var(--gold);border-radius:0 14px 14px 0;color:#374151;font-size:.93rem;line-height:1.9}
 @media(max-width:900px){.parent-compliance-jump{padding:56px 0}.parent-compliance-jump .pcj-wrap,.pbr-top{grid-template-columns:1fr}.pcj-preview{height:360px}.pcj-framebox iframe{width:1050px;transform:scale(.42)}.pbr-map-preview{height:300px}.pbr-framebox iframe{width:980px;transform:scale(.42)}}
 @media(max-width:780px){.desktop-nav{gap:8px!important}.nav-link{font-size:.82rem!important}}
 `;
 document.head.appendChild(s);
}
function removeTopDonation(){document.querySelectorAll('.support-strip,.support-banner,.top-support,.donation-strip').forEach(e=>e.remove())}
function initPrimaryNavigation(){
 const d=document.querySelector('.desktop-nav');
 if(d)d.innerHTML='<a class="nav-link" href="/index.html">トップ</a><div class="nav-item has-dropdown"><a class="nav-link" href="#">立場別</a><div class="mega-menu"><div class="mega-col"><h4>立場別</h4><ul><li><a href="/guide-parent.html">保護者の方へ</a></li><li><a href="/guide-pta.html">PTA役員の方へ</a></li><li><a href="/guide-board.html">教育委員会・学校の方へ</a></li></ul></div></div></div><div class="nav-item has-dropdown"><a class="nav-link" href="#">資料・データ</a><div class="mega-menu"><div class="mega-col"><h4>一次資料</h4><ul><li><a href="/board-responses.html">教育委員会の回答</a></li><li><a href="/national-archive.html">全国資料館</a></li><li><a href="/administrative-materials.html">行政資料整理</a></li><li><a href="/compliance.html">PTA運営の現場実例</a></li></ul></div></div></div><div class="nav-item has-dropdown"><a class="nav-link" href="/journal.html">研究</a><div class="mega-menu"><div class="mega-col"><h4>論考・整理</h4><ul><li><a href="/journal.html">論考・調査報告</a></li><li><a href="/report.html">総合分析レポート</a></li><li><a href="/law-map.html">法制度マップ</a></li><li><a href="/cases.html">判例整理</a></li><li><a href="/timeline.html">PTA制度史</a></li></ul></div><div class="mega-col"><h4>論点別</h4><ul><li><a href="/membership.html">入会手続</a></li><li><a href="/privacy.html">個人情報</a></li><li><a href="/fee-collection.html">会費徴収</a></li><li><a href="/personnel.html">教職員関与</a></li><li><a href="/facilities.html">施設利用</a></li></ul></div></div></div><div class="nav-item has-dropdown"><a class="nav-link" href="#">ツール</a><div class="mega-menu"><div class="mega-col"><h4>点検用</h4><ul><li><a href="/audit/index.html">運営チェックアプリ</a></li><li><a href="/guideline.html">適正化ガイドライン</a></li></ul></div></div></div><a class="nav-link support-nav-link" href="'+SUPPORT_URL+'">応援</a>';
 const m=document.getElementById('mobileOverlay');
 if(m)m.innerHTML='<a class="mobile-link" href="/index.html"><span>Top</span>トップ</a><a class="mobile-link" href="/guide-parent.html"><span>Parents</span>保護者の方へ</a><a class="mobile-link" href="/guide-pta.html"><span>PTA Board</span>PTA役員の方へ</a><a class="mobile-link" href="/guide-board.html"><span>School Board</span>教育委員会・学校へ</a><a class="mobile-link" href="/board-responses.html"><span>Data</span>教育委員会の回答</a><a class="mobile-link" href="/national-archive.html"><span>Archive</span>全国資料館</a><a class="mobile-link" href="/administrative-materials.html"><span>Materials</span>行政資料整理</a><a class="mobile-link" href="/compliance.html"><span>Examples</span>現場実例</a><a class="mobile-link" href="/journal.html"><span>Journal</span>論考・調査報告</a><a class="mobile-link" href="/audit/index.html"><span>Check</span>運営チェックアプリ</a><a class="mobile-link support-mobile-link" href="'+SUPPORT_URL+'"><span>Support</span>応援・寄付</a><div class="close-overlay" id="closeOverlay">CLOSE ×</div>';
 document.querySelectorAll('a[href="/donate/"],a[href="donate/"],a[href="https://ptaorg.com/donate/"],a[href="https://ptaorg.github.io/donate/"]').forEach(a=>a.setAttribute('href',SUPPORT_URL));
}
function initCompliancePageFixes(){
 if(!isPage('compliance.html'))return;
 document.querySelectorAll('.reading-guide').forEach(el=>el.remove());
}
function initParentCompliancePreview(){
 if(!isPage('guide-parent.html'))return;
 if(document.querySelector('.parent-compliance-jump'))return;
 const anchor=document.querySelector('.case-foot');
 if(!anchor)return;
 const section=document.createElement('section');
 section.className='parent-compliance-jump';
 section.setAttribute('aria-labelledby','pcj-title');
 section.innerHTML='<div class="pcj-wrap"><div class="pcj-copy"><div class="pcj-kicker">資料で確認する</div><h2 class="pcj-title" id="pcj-title">実物の書類を見ると、問題点はもっと分かります。</h2><p class="pcj-text">このページで見た相談は、現実の入会案内、会費徴収通知、名簿提供、役員選出資料の中に現れます。別ページでは、現場で使われる書類を類型別に並べ、どこを確認すればよいかを整理しています。</p><ul class="pcj-list"><li>みなし加入・全員加入扱い</li><li>学校徴収金とPTA会費の抱き合わせ徴収</li><li>学校からPTAへの個人情報提供</li></ul><div class="pcj-actions"><a class="pcj-btn" href="/compliance.html">現場実例ページを全部見る →</a><span class="pcj-note">右側はページ冒頭の縮小プレビューです。</span></div></div><div class="pcj-preview" aria-label="PTA運営の現場実例ページの縮小プレビュー"><div class="pcj-browserbar"><i></i><i></i><i></i><span>ptaorg.com/compliance.html</span></div><div class="pcj-framebox"><iframe src="/compliance.html#case01" loading="lazy" title="PTA運営の現場実例ページのプレビュー" tabindex="-1"></iframe></div><div class="pcj-preview-mask"></div><a class="pcj-preview-link" href="/compliance.html">全部を見る</a></div></div>';
 anchor.insertAdjacentElement('afterend',section);
}
function initParentBoardResponsesPreview(){
 if(!isPage('guide-parent.html'))return;
 if(document.querySelector('.parent-board-response-jump'))return;
 const anchor=document.querySelector('.parent-compliance-jump')||document.querySelector('.case-foot');
 if(!anchor)return;
 const section=document.createElement('section');
 section.className='parent-board-response-jump';
 section.setAttribute('aria-labelledby','pbr-title');
 section.innerHTML=`<div class="pbr-wrap"><div class="pbr-top"><div class="pbr-copy"><div class="pbr-kicker">教育委員会回答</div><h2 class="pbr-title" id="pbr-title">全国教育委員会への照会結果</h2><p class="pbr-lead">PTAの入会、会費徴収、個人情報、学校関与、施設利用などについて、各地の教育委員会から得られた回答を自治体別・論点別に整理しています。</p><a class="pbr-btn" href="/board-responses.html">教育委員会の回答ページへ進む →</a><div class="pbr-note">下の回答例は、実際の回答ページと同じ考え方で、回答本文をアコーディオンで開く形にしています。本文は要約せず、そのまま掲載しています。</div></div><div class="pbr-map-preview" aria-label="回答自治体マップの縮小プレビュー"><div class="pbr-browserbar"><i></i><i></i><i></i><span>ptaorg.com/board-responses.html</span></div><div class="pbr-framebox"><iframe src="/board-responses.html#responseMap" loading="lazy" title="回答自治体マップのプレビュー" tabindex="-1"></iframe></div><a class="pbr-map-link" href="/board-responses.html">全部を見る</a></div></div><div class="pbr-examples"><article class="pbr-response-item" id="parent-sample-nishiwaki"><div class="pbr-muni-name">兵庫県西脇市</div><div class="pbr-meta">分類：A:6項目 ／ 回答日：未確認</div><details><summary>回答本文を読む</summary><div class="pbr-body">【情報提供】兵庫県西脇市教育委員会の回答

1. PTAの入会契約の成立要件に関する法的見解について

PTAは任意加入の団体であり、保護者個人の自由な意思に基づいて加入するものです。

入会には、保護者の方の明確な申し込みの意思表示と、PTAの承諾が必要です。

ご指摘の、保護者の意思確認をせずに児童・生徒の入学をもって自動的に会員とする、いわゆる「みなし入会」方式では、契約が成立しているとは判断できません。

2. 学校によるPTA会費の徴収行為が無権代理に該当するかについて

学校がPTA会費を徴収する行為は、原則としてPTAとの間で代理権に関する契約（委任契約など）を締結した上で行われるべきものと考えます。

契約関係のない状態で学校が代行徴収を行うことは、法的な問題を生じさせる可能性があると認識しています。

3. 入会申込書による保護者および教職員の明確な意思確認の必要性について

PTAが任意加入の団体である以上、入会手続きにおいては、保護者の方の明確な入会意思を確認することが不可欠です。書面による入会申込書や同意書は、その意思を確実に確認できる一つの有効な方法ですが、これに限定されるものではありません。

例えば、新学期当初の保護者会等の場で、PTAの活動内容や会費、入退会は任意である旨を明確に説明し、その場で口頭による入会意思を確認する方法や、PTAのウェブサイトや専用システムを通じて、入会に関する説明を十分に行った上で、保護者が自らの意思で入会の意思表示を行う電子フォームを導入する方法も考えられます。ただし、口頭の場合、確認の記録を適切に残す必要があります。

どのような方法を採用するにしても、重要なのは、保護者の方が入会を強制されていると感じることなく、PTAの活動内容や入会に伴う会費や役員活動などを十分に理解した上で、自らの自由な意思で入会を選択できるように配慮することが必要と考えます。

本市としましては、各学校やPTAに対し、地域の実情に応じた柔軟な方法を取り入れつつ、保護者の明確な意思確認が確実に行われるよう指導してまいります。

4. 個人情報保護法に基づく児童名簿・連絡個票の利用目的逸脱について

児童・生徒の個人情報は、学校教育の目的にのみ使用されるべきものです。

保護者の同意なく、PTA会費の徴収といった目的外に利用することは、個人情報保護法に抵触する可能性があると認識しています。

引き続き、PTAの活動への情報提供に関して、保護者の明確な同意を得るよう学校を指導してまいります。

5. PTAの運用に関する教育委員会の是正指導責任について

ご指摘の通り、地方教育行政法第19条に基づき、教育委員会は所管する学校に対する管理・監督義務を負っています。

一方で、PTAは「学校教育法第137条」に基づき、学校の設置者である教育委員会の管理する施設を使用する機会が認められている任意団体です。

PTA活動は学校教育活動とは区別されるべきものですが、学校施設の使用や教職員が運営に関与している実態を踏まえると、学校教育に支障をきたす可能性は否定できません。

PTAの運営が学校教育に支障をきたすような不適切な状況にあると判断される場合、その是正について、教育委員会が学校に指導を行うことは、不当な干渉にはあたらないものと認識しております。

6. 任意加入・法令遵守が確保されるまでの暫定的措置に関する方針について

PTAの運営に関して、保護者の権利を保護し、法令遵守を確保することは、学校と教育委員会の責務です。

入会手続きや個人情報の取り扱いなど、PTAの運営が適正に行われているかを確認し、必要に応じて学校と連携しながら改善を促します。</div></details><div class="pbr-back">▲ 自治体索引へ戻る</div></article><article class="pbr-response-item" id="parent-sample-tone"><div class="pbr-muni-name">利根町</div><div class="pbr-meta">分類：A:6項目 ／ 回答日：未確認</div><details><summary>回答本文を読む</summary><div class="pbr-body">(茨城県利根町教育委員会）PTA入会に関する法的見解・照会６項目の回答について

1. PTAの入会契約の成立要件に関する法的見解について
→PTAの入会に関しましては、学校からPTAの入会について説明をし、書面等による保護者の意思表示を確認し、PTAの承諾によって入会契約が成立するものと考えております。
2. 学校によるPTA会費の徴収行為が無権代理に該当するかについて
→学校が正式な代理権を持たずにPTAの業務を代行している場合は無権代理に該当すると考えております。学校がPTAとPTA会費の徴収業務の準委任契約を結び、正式な代理権を持ってPTAの業務を代行するものと考えております。
3. 入会申込書による保護者および教職員の明確な意思確認の必要性について
→契約の成立には、申込書や同意書等の加入意思の確認が必要と考えております。申込書や同意書の徴収していない場合は、是正の必要性を伝え、指導、助言を行っていきたいと考えております。
4. 個人情報保護法に基づく児童名簿・連絡個票の利用目的逸脱について
→学校が正式な代理権を持たずに、保護者の同意なく児童生徒の名簿等の個人情報をPTAで使用することは適切ではないと考えております。個人情報を適切に管理するように指導、助言を行っていきたいと考えております。
5. PTAの運用に関する教育委員会の是正指導責任について
→学校が会費徴収や施設利用について、不適切な運用をしている場合は、是正指導をする必要があると考えております。
6. 任意加入・法令遵守が確保されるまでの暫定的措置に関する方針について
→法令違反が懸念されるときは、学校による施設提供や会費徴収への協力を停止する措置を講ずることもあることを伝え、指導、助言を行っていきたいと考えております。
利根町教育委員会
指導課 石井</div></details><div class="pbr-back">▲ 自治体索引へ戻る</div></article></div></div>`;
 anchor.insertAdjacentElement('afterend',section);
}
function initCommonFooter(){
 const footer=document.querySelector('footer.footer');
 if(!footer)return;
 footer.innerHTML=`<div class="footer-inner"><div class="footer-grid"><div><h3>PTA適正化推進委員会</h3><a class="yokomusubi-card" href="https://yokomusubi.city.yokohama.lg.jp/organizations/detail/f69c7ad2-cf21-4dfa-87bb-9c891874eb6b/" rel="noopener noreferrer" target="_blank"><img alt="よこむすび" src="/assets/yokomusubi.png"><span class="yokomusubi-tagline">磯子区「よこむすび」掲載団体</span><span class="yokomusubi-meta">登録番号：磯子12406</span><span class="yokomusubi-meta">分類番号：12-4（市民活動・社会教育推進）</span></a><div class="footer-contact"><p>〒235-0021<br>神奈川県横浜市磯子区岡村8-17-5-301</p><p><strong>070-9012-7772</strong></p><p><a href="mailto:info@ptaorg.com">info@ptaorg.com</a></p></div></div><div><h4>公式発信</h4><p class="footer-sns-sub">最新資料・論考・動画はこちら</p><div class="footer-sns-cards"><a class="fsns-card fsns-x" href="https://x.com/jjjqqqxxx0852" rel="noopener" target="_blank"><div><div class="fsns-name">X</div><div class="fsns-desc">速報・資料更新</div></div></a><a class="fsns-card fsns-yt" href="https://www.youtube.com/@PTA%E9%81%A9%E6%AD%A3%E5%8C%96%E6%8E%A8%E9%80%B2%E5%A7%94%E5%93%A1%E4%BC%9A" rel="noopener" target="_blank"><div><div class="fsns-name">YouTube</div><div class="fsns-desc">動画で解説</div></div></a><a class="fsns-card fsns-note" href="https://note.com/hiroshisatoh" rel="noopener" target="_blank"><div><div class="fsns-name">note</div><div class="fsns-desc">論考・研究ノート</div></div></a></div></div><div><h4>立場別</h4><ul><li><a href="/guide-parent.html">保護者</a></li><li><a href="/guide-pta.html">PTA役員</a></li><li><a href="/guide-board.html">教育委員会・学校</a></li><li><a href="/guide-research.html">研究者・記者</a></li><li><a href="/guide-board.html">教育委員会向け指針</a></li></ul></div><div><h4>論点</h4><ul><li><a href="/membership.html">入会手続</a></li><li><a href="/privacy.html">個人情報</a></li><li><a href="/fee-collection.html">会費徴収</a></li><li><a href="/personnel.html">教職員関与</a></li><li><a href="/facilities.html">施設利用</a></li></ul></div><div><h4>資料・支援</h4><ul><li><a href="/support.html">応援・寄付</a></li><li><a href="/board-responses.html">教育委員会の回答</a></li><li><a href="/national-archive.html">全国資料館</a></li><li><a href="/administrative-materials.html">行政資料整理</a></li><li><a href="/compliance.html">PTA運営の現場実例</a></li><li><a href="/journal.html">論考・調査報告</a></li><li><a href="/report.html">総合分析レポート</a></li><li><a href="/audit/index.html">運営チェックアプリ</a></li><li><a href="/law-map.html">法制度マップ</a></li><li><a href="/guideline.html">適正化ガイドライン</a></li></ul></div></div><div class="footer-support"><div><strong>調査・資料公開の継続を応援してください</strong><p>いただいたご支援は、資料取得、資料整理、Web公開、自治体・学校への働きかけに活用します。</p></div><a href="/support.html">応援ページへ</a></div><p class="copyright">© PTA適正化推進委員会</p></div>`;
}
function initMegaMenu(){document.querySelectorAll('.nav-item.has-dropdown>.nav-link').forEach(link=>link.addEventListener('click',e=>{const item=link.closest('.nav-item');if(link.getAttribute('href')==='#')e.preventDefault();item.classList.toggle('is-open');document.querySelectorAll('.nav-item.is-open').forEach(i=>{if(i!==item)i.classList.remove('is-open')})}));document.addEventListener('click',e=>{if(!e.target.closest('.nav-item'))document.querySelectorAll('.nav-item.is-open').forEach(i=>i.classList.remove('is-open'))})}
function initMobileNav(){const h=document.getElementById('hamburger');const m=document.getElementById('mobileOverlay');if(!h||!m)return;const close=()=>{m.classList.remove('is-open');h.classList.remove('is-active');h.setAttribute('aria-expanded','false')};h.addEventListener('click',()=>{const open=!m.classList.contains('is-open');m.classList.toggle('is-open',open);h.classList.toggle('is-active',open);h.setAttribute('aria-expanded',open?'true':'false')});m.addEventListener('click',e=>{if(e.target.id==='closeOverlay'||e.target.classList.contains('mobile-link'))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape')close()})}
function initSearch(){document.querySelectorAll('.header-search').forEach(box=>{const input=box.querySelector('.search-input');const dd=box.querySelector('.search-results-dropdown');if(!input||!dd)return;input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();dd.innerHTML='';if(!q){dd.classList.remove('is-open');return}const hits=SITE_INDEX.filter(([title,url,desc])=>(title+url+desc).toLowerCase().includes(q)).slice(0,8);if(!hits.length){dd.innerHTML='<div class="search-result-item"><strong>該当なし</strong><span>別の語で検索してください。</span></div>'}else{hits.forEach(([title,url,desc])=>dd.insertAdjacentHTML('beforeend','<a class="search-result-item" href="'+url+'"><strong>'+title+'</strong><span>'+desc+'</span></a>'))}dd.classList.add('is-open')});document.addEventListener('click',e=>{if(!box.contains(e.target))dd.classList.remove('is-open')})})}
function initFAQ(){document.querySelectorAll('.faq-item').forEach(item=>{const q=item.querySelector('.faq-q');if(q)q.addEventListener('click',()=>item.classList.toggle('is-open'))})}
function initChecklist(){document.querySelectorAll('.check-box').forEach(box=>box.addEventListener('click',()=>{box.classList.toggle('checked');box.textContent=box.classList.contains('checked')?'✓':''}))}
function initCompatibilityFixes(){
 if(!document.querySelector('link[href^="/css/refine.css"],link[href^="css/refine.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/css/refine.css?v=refine1';document.head.appendChild(l)}
 document.querySelectorAll('link[rel="canonical"]').forEach((el,i)=>{if(i>0)el.remove()});
 if(document.querySelector('meta[name="twitter:card"]')&&!document.querySelector('meta[name="twitter:image"]')){const m=document.createElement('meta');m.name='twitter:image';m.content='https://ptaorg.com/assets/og-image-popc-en.png';document.head.appendChild(m)}
 const map={'guide-board.html#responses':'board-responses.html#municipality-index','board-responses.html#yokohama':'board-responses.html#municipality-index','guide-parent.html#templates':'guide-parent.html#pdf-dl','guide-board.html#yokohama':'journal/yokohama-notice-1965.html','administrative-materials.html#admin-table':'administrative-materials.html#yokohama','/donate/':SUPPORT_URL,'donate/':SUPPORT_URL,'https://ptaorg.com/donate/':SUPPORT_URL,'https://ptaorg.github.io/donate/':SUPPORT_URL};
 document.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href');if(map[h])a.setAttribute('href',map[h])});
 if(location.hash){
  let id=location.hash.slice(1);
  try{id=decodeURIComponent(id)}catch(e){}
  const target=document.getElementById(id);
  if(target)setTimeout(()=>{
   const details=target.closest&&target.closest('details');
   if(details)details.open=true;
   const header=document.querySelector('.site-header,.nav-container');
   const offset=(header?header.getBoundingClientRect().height:0)+18;
   const y=target.getBoundingClientRect().top+window.pageYOffset-offset;
   window.scrollTo({top:Math.max(0,y),left:0,behavior:'auto'});
  },160);
 }
}
function initPageClasses(){if(isPage('guide-board.html'))document.body.classList.add('guide-board-page');if(isPage('journal.html'))document.body.classList.add('journal-clean')}
document.addEventListener('DOMContentLoaded',()=>{addGlobalStyle();removeTopDonation();initPrimaryNavigation();initCompliancePageFixes();initParentCompliancePreview();initParentBoardResponsesPreview();initCommonFooter();initCompatibilityFixes();initMegaMenu();initMobileNav();initSearch();initFAQ();initChecklist();initPageClasses()});
