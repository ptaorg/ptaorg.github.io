/* site.js loader — 2026-09-05 v99 */
(function(){
  function load(src, id, done){
    if (document.getElementById(id)) { if (done) done(); return; }
    var s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.async = false;
    if (done) s.onload = done;
    (document.head || document.documentElement).appendChild(s);
  }

  function addCoreEssayStyles(){
    if (document.getElementById('core-essay-entrance-style')) return;
    var style = document.createElement('style');
    style.id = 'core-essay-entrance-style';
    style.textContent =
      '.core-history-nav{font-weight:900!important;color:#8b1e2d!important;border-bottom-color:#8b1e2d!important}' +
      '.board-submit-nav{font-weight:900!important;color:#5f4707!important;background:#fff8df!important;border:1px solid #d7b95a!important;border-radius:4px;padding:7px 10px!important;white-space:nowrap}' +
      '.board-submit-nav:hover{background:#fff1bd!important;color:#4f3b08!important}' +
      '.board-submit-nav-mobile{font-weight:900!important;color:#7a5908!important}' +
      '.core-essay-entrance{max-width:1100px;margin:74px auto;padding:38px 34px 34px;border-top:3px solid #8b1e2d;border-bottom:1px solid #cfd6dc;background:#fff;color:#18212b}' +
      '.core-essay-entrance .core-kicker{margin:0 0 10px;font-size:.76rem;letter-spacing:.13em;text-transform:uppercase;font-weight:900;color:#8b1e2d}' +
      '.core-essay-entrance h2{margin:0 0 20px!important;padding:0!important;border:0!important;font-family:"Noto Serif JP",serif!important;font-size:clamp(1.65rem,4vw,2.55rem)!important;line-height:1.45!important;color:#18212b!important}' +
      '.core-essay-entrance>.core-intro{max-width:900px;margin:0 0 28px;font-size:1.03rem;line-height:1.95}' +
      '.core-essay-entrance .core-thesis{margin:26px 0 34px;padding:18px 0 18px 20px;border-left:5px solid #8b1e2d;font-family:"Noto Serif JP",serif;font-size:1.08rem;font-weight:700;line-height:1.9}' +
      '.core-essay-item{padding:27px 0 25px;border-top:1px solid #cfd6dc}' +
      '.core-essay-item:last-of-type{border-bottom:1px solid #cfd6dc}' +
      '.core-essay-item .core-no{margin:0 0 7px;font-size:.72rem;letter-spacing:.1em;font-weight:900;color:#68727c}' +
      '.core-essay-item h3{margin:0 0 10px!important;font-family:"Noto Serif JP",serif!important;font-size:clamp(1.22rem,3vw,1.65rem)!important;line-height:1.55!important}' +
      '.core-essay-item h3 a{color:#18212b;text-decoration-thickness:1px;text-underline-offset:5px}' +
      '.core-essay-item p{margin:0 0 10px;line-height:1.85}' +
      '.core-read{display:inline-block;margin-top:3px;color:#8b1e2d!important;font-weight:800;text-decoration:none!important}' +
      '.core-journal-more{margin:24px 0 0;font-size:.9rem}' +
      '.core-journal-more a{color:#354f69;font-weight:700}' +
      '.core-essay-entrance.core-essay-journal{margin-top:34px;margin-bottom:52px}' +
      '@media(max-width:760px){.core-essay-entrance{margin:48px 16px;padding:28px 18px 26px}.core-essay-entrance .core-thesis{padding-left:15px}.core-history-nav{font-weight:800!important}.board-submit-nav{padding:6px 8px!important}}';
    document.head.appendChild(style);
  }

  function addGlobalNav(){
    document.querySelectorAll('.desktop-nav').forEach(function(nav){
      var history = nav.querySelector('[data-core-history-nav]');
      if (!history) {
        history = document.createElement('a');
        history.className = 'nav-link core-history-nav';
        history.href = '/pta-history.html';
        history.textContent = 'PTAの成り立ち';
        history.setAttribute('data-core-history-nav','');
        var ppc = nav.querySelector('a[href="/ppc-points.html"]');
        if (ppc && ppc.parentNode === nav) ppc.insertAdjacentElement('afterend', history);
        else nav.insertBefore(history, nav.firstChild);
      }

      if (!nav.querySelector('[data-board-submit-nav]')) {
        var submit = document.createElement('a');
        submit.className = 'nav-link board-submit-nav';
        submit.href = '/submit-to-board.html';
        submit.textContent = '教育委員会へ提出';
        submit.title = '各地でPTA適正化に取り組む方向け：教育委員会・学校管理職への提出資料と手順';
        submit.setAttribute('aria-label','教育委員会への提出資料と手順');
        submit.setAttribute('data-board-submit-nav','');
        if (history && history.parentNode === nav) history.insertAdjacentElement('afterend', submit);
        else nav.insertBefore(submit, nav.firstChild);
      }
    });

    document.querySelectorAll('.mobile-menu-group').forEach(function(group){
      var label = group.querySelector('.mobile-menu-label');
      if (!label || label.textContent.trim() !== '最重要') return;

      var history = group.querySelector('[data-core-history-mobile]');
      if (!history) {
        history = document.createElement('a');
        history.className = 'mobile-link';
        history.href = '/pta-history.html';
        history.textContent = 'PTAの成立とこれから';
        history.setAttribute('data-core-history-mobile','');
        var ppc = group.querySelector('a[href="/ppc-points.html"]');
        if (ppc) ppc.insertAdjacentElement('afterend', history);
        else group.appendChild(history);
      }

      if (!group.querySelector('[data-board-submit-mobile]')) {
        var submit = document.createElement('a');
        submit.className = 'mobile-link board-submit-nav-mobile';
        submit.href = '/submit-to-board.html';
        submit.textContent = '教育委員会へ提出する資料';
        submit.setAttribute('data-board-submit-mobile','');
        if (history) history.insertAdjacentElement('afterend', submit);
        else group.appendChild(submit);
      }
    });
  }

  function installMobileSearch(){
    var overlay = document.getElementById('mobileOverlay');
    if (!overlay || overlay.querySelector('[data-mobile-site-search]')) return;

    var box = document.createElement('div');
    box.className = 'header-search mobile-menu-search';
    box.setAttribute('data-mobile-site-search','');
    box.innerHTML =
      '<label class="mobile-menu-search-label" for="mobileSiteSearch">サイト内検索</label>' +
      '<input id="mobileSiteSearch" aria-label="サイト内検索" class="search-input" placeholder="例：会費徴収、個人情報、退会" type="search">' +
      '<div class="search-results-dropdown" aria-live="polite"></div>';

    var firstGroup = overlay.querySelector('.mobile-menu-group');
    if (firstGroup) overlay.insertBefore(box, firstGroup);
    else overlay.insertBefore(box, overlay.firstChild);

    if (!document.getElementById('mobile-menu-search-style-v97')) {
      var style = document.createElement('style');
      style.id = 'mobile-menu-search-style-v97';
      style.textContent =
        '.mobile-overlay .mobile-menu-search{display:block!important;flex:none!important;width:min(100%,430px)!important;max-width:430px!important;margin:0 0 8px!important;position:relative!important}' +
        '.mobile-menu-search-label{display:block;margin:0 0 6px;color:rgba(255,255,255,.72);font-size:.76rem;font-weight:900;letter-spacing:.08em}' +
        '.mobile-overlay .mobile-menu-search input{min-height:46px;padding:10px 12px!important;border:1px solid rgba(255,255,255,.38)!important;border-radius:0!important;background:#fff!important;color:#18212b!important}' +
        '.mobile-overlay .mobile-menu-search .search-results-dropdown{position:static!important;margin-top:6px!important;max-height:42vh!important;border-radius:0!important;box-shadow:none!important;text-align:left!important}' +
        '.mobile-overlay .mobile-menu-search .srd-item{padding:11px 12px!important}';
      document.head.appendChild(style);
    }

    if (typeof window.initSearch === 'function') window.initSearch();
  }

  function makeCoreSection(journal){
    var section = document.createElement('section');
    section.className = 'core-essay-entrance' + (journal ? ' core-essay-journal' : '');
    section.id = journal ? 'core-essays-journal' : 'core-essays-entry';
    section.setAttribute('aria-labelledby', section.id + '-title');
    section.innerHTML =
      '<p class="core-kicker">Core Analysis · 成立史と再設計</p>' +
      '<h2 id="' + section.id + '-title">PTAは、なぜこうなったのか。<br>そして、これからどうするのか。</h2>' +
      '<p class="core-intro">任意加入、個人情報、会費徴収、教職員関与を個別に検討するだけでは、現在のPTAがなぜ学校とここまで一体化したのかは見えません。成立の経緯と、これからの組織設計を一続きで読むための主要論考です。</p>' +
      '<p class="core-thesis">民主的・自主的な社会教育団体として構想されたPTAが、なぜ「学校単位で当然に存在し、保護者が会費と労働力を提供する組織」になったのか。その経路を確認し、学校のお手伝いを存在理由にしないPTAへ組み替える道筋を示します。</p>' +
      '<article class="core-essay-item">' +
        '<p class="core-no">01 / 成立史</p>' +
        '<h3><a href="/pta-history.html">PTAは誰が作ったのか――「自主的団体」の成立史</a></h3>' +
        '<p>GHQ・CIE、米国教育使節団、文部省による全国的な普及と、旧父兄会・学校後援会の構造が残った経緯を、公的資料からたどります。「自主的な団体を上から普及させる」という出発点の矛盾を検証します。</p>' +
        '<a class="core-read" href="/pta-history.html">本文を読む →</a>' +
      '</article>' +
      '<article class="core-essay-item">' +
        '<p class="core-no">02 / これからのPTA</p>' +
        '<h3><a href="/pta-future.html">PTAは「学校のお手伝い」をやめなければ生き残れない</a></h3>' +
        '<p>会費に加えて無償労働まで求める学校支援型から、「やりたい人がいるから活動する」自主参加型へ。学校支援を禁止するのではなく、学校支援をPTAの義務・存在理由にしない再設計を提言します。</p>' +
        '<a class="core-read" href="/pta-future.html">本文を読む →</a>' +
      '</article>' +
      (journal ? '' : '<p class="core-journal-more"><a href="/journal.html">その他の論考・調査報告を見る →</a></p>');
    return section;
  }

  function findHeading(tag, text){
    var nodes = document.querySelectorAll(tag);
    for (var i=0; i<nodes.length; i++){
      if ((nodes[i].textContent || '').replace(/\s+/g,'').indexOf(text.replace(/\s+/g,'')) !== -1) return nodes[i];
    }
    return null;
  }

  function injectHome(){
    if (document.getElementById('core-essays-entry')) return;
    var section = makeCoreSection(false);
    var targetHeading = findHeading('h2','PTAの強制加入問題');
    if (targetHeading) {
      var target = targetHeading.closest('section') || targetHeading.parentElement;
      if (target && target.parentNode) { target.parentNode.insertBefore(section, target); return; }
    }
    var main = document.querySelector('main');
    if (main) main.appendChild(section);
  }

  function injectJournal(){
    if (document.getElementById('core-essays-journal')) return;
    var section = makeCoreSection(true);
    var main = document.querySelector('main');
    var h1 = document.querySelector('h1');
    if (main && h1 && main.contains(h1)) {
      var child = h1;
      while (child.parentElement && child.parentElement !== main) child = child.parentElement;
      if (child.parentElement === main) { child.insertAdjacentElement('afterend', section); return; }
    }
    if (main) { main.insertBefore(section, main.firstChild); return; }
    var header = document.querySelector('.site-header');
    if (header) header.insertAdjacentElement('afterend', section);
  }

  function injectFrameworkBoundaryClarification(){
    if (document.getElementById('fw-boundary-internal-use')) return;
    var section = document.getElementById('fw-borders');
    if (!section) return;
    var wrap = section.querySelector('.wrap-narrow');
    var steps = wrap && wrap.querySelector('ol.thesis-steps');
    if (!wrap || !steps) return;

    var block = document.createElement('div');
    block.id = 'fw-boundary-internal-use';
    block.className = 'thesis-callout';
    block.innerHTML =
      '<strong>境界線は「学校からPTAへ情報を渡したか」だけでは決まりません。</strong>' +
      '<p>学校が名簿ファイルをPTAへ提供していなくても、学校が保有する情報をPTA内部事務のために検索・照合・抽出・連絡・徴収へ使えば、学校自身による「利用」という境界問題が生じます。個人情報保護法69条は、利用目的以外の目的のために保有個人情報を「自ら利用し、又は提供」することを原則として制限しています。</p>' +
      '<p><strong>典型例：</strong>学校在籍者とPTA入会届の提出者を照合して未提出者を割り出す、学年・学級・学籍番号等を使って担任が提出を督促する、学校保有情報からPTA会員・非会員を判別する、学校口座情報を使ってPTA会費の対象登録・引落し・未納管理を行う、登校班・地区班・旗振り当番をPTA目的で編成する、学校連絡アプリでPTA配信対象者を抽出する、といった処理です。</p>' +
      '<p>さらに、教職員が職務上知り得た家庭・児童・保護者情報をPTA内部事務へ用いる場面では、学校組織としての61条・69条の整理とは別に、個人情報保護法67条の従事者義務も確認する必要があります。</p>' +
      '<p><strong>確認の中心は、「誰に渡したか」だけでなく「誰の事務のために、誰の情報・システム・職員を使ったか」です。</strong> この視点で見ると、入会、名簿、会費、会計、当番、連絡、教職員労務は、すべて同じ「学校とPTAの境界」の問題としてつながります。具体例と67条・懲戒等の射程は<a href="/ppc-school-pta-personal-data.html#internal-use-examples">PPC資料17ページ詳細解説</a>で整理しています。</p>';
    steps.insertAdjacentElement('beforebegin', block);
  }

  function injectSchoolProcessingVisuals(){
    if (document.getElementById('psc-evidence-visuals')) return;
    var path = (window.location.pathname || '').replace(/\/+$/,'');
    if (path !== '/pta-school-processing.html') return;

    var heading = findHeading('h2','優先15自治体・都道府県の第1次比較');
    if (!heading) return;
    var node = heading.nextElementSibling;
    while (node && !node.classList.contains('psc-table-wrap')) node = node.nextElementSibling;
    if (!node) return;
    var table = node.querySelector('table.psc-table');
    if (!table) return;

    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
    if (!rows.length) return;

    var basisCounts = {
      '規則・訓令・要綱・要領等': 0,
      '徴収・会計等の内部制度': 0,
      '内部手引＋委任等': 0,
      '委任・同意・契約中心': 0
    };
    var issueDefs = [
      {label:'個人情報保護法61条', re:/61条/},
      {label:'受任権限・受任主体', re:/受任権限|受任主体|受託所掌|学校長の受任|公法上の受任/},
      {label:'上位授権・法規階層', re:/上位授権|上位法|法規階層|法規的根拠|法規性/}
    ];
    var issueCounts = issueDefs.map(function(d){ return {label:d.label,re:d.re,count:0}; });

    rows.forEach(function(tr){
      var cells = tr.querySelectorAll('td');
      if (cells.length < 6) return;
      var basis = (cells[1].textContent || '').trim();
      var issues = ((cells[4].textContent || '') + ' ' + (cells[5].textContent || '')).trim();

      if (/教育委員会規則|訓令|要綱|要領/.test(basis)) basisCounts['規則・訓令・要綱・要領等']++;
      else if (/学校徴収|私費会計|受託事務分掌/.test(basis)) basisCounts['徴収・会計等の内部制度']++;
      else if (/内部手引/.test(basis)) basisCounts['内部手引＋委任等']++;
      else basisCounts['委任・同意・契約中心']++;

      issueCounts.forEach(function(d){ if (d.re.test(issues)) d.count++; });
    });

    if (!document.getElementById('psc-evidence-visuals-style')) {
      var style = document.createElement('style');
      style.id = 'psc-evidence-visuals-style';
      style.textContent =
        '#psc-evidence-visuals{margin:28px 0 34px;padding:24px 26px;border:1px solid #cbd4da;background:#fbfcfc}' +
        '#psc-evidence-visuals .psc-viz-title{margin:0 0 8px!important;font-family:"Noto Serif JP",serif;font-size:1.3rem;line-height:1.5}' +
        '#psc-evidence-visuals .psc-viz-intro{margin:0 0 22px!important;color:#52606b;font-size:.9rem;line-height:1.75}' +
        '#psc-evidence-visuals .psc-viz-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}' +
        '#psc-evidence-visuals .psc-viz-panel{min-width:0}' +
        '#psc-evidence-visuals .psc-viz-panel h3{margin:0 0 14px!important;font-size:1rem!important}' +
        '#psc-evidence-visuals .psc-viz-row{display:grid;grid-template-columns:minmax(128px,1.15fr) minmax(130px,2fr) 34px;gap:9px;align-items:center;margin:10px 0}' +
        '#psc-evidence-visuals .psc-viz-label{font-size:.8rem;line-height:1.45;color:#33424d}' +
        '#psc-evidence-visuals .psc-viz-track{height:16px;background:#e9eef1;overflow:hidden}' +
        '#psc-evidence-visuals .psc-viz-fill{display:block;height:100%;min-width:2px;background:#526b7a}' +
        '#psc-evidence-visuals .psc-viz-issues .psc-viz-fill{background:#8a4a4a}' +
        '#psc-evidence-visuals .psc-viz-value{font-weight:900;font-size:.82rem;text-align:right;color:#27343e}' +
        '#psc-evidence-visuals .psc-viz-note{margin:18px 0 0!important;padding-top:14px;border-top:1px solid #d7dee3;color:#66727b;font-size:.78rem;line-height:1.7}' +
        '@media(max-width:820px){#psc-evidence-visuals .psc-viz-grid{grid-template-columns:1fr;gap:24px}}' +
        '@media(max-width:520px){#psc-evidence-visuals{padding:20px 16px}#psc-evidence-visuals .psc-viz-row{grid-template-columns:1fr 34px;gap:6px 9px}#psc-evidence-visuals .psc-viz-label{grid-column:1/3}#psc-evidence-visuals .psc-viz-track{grid-column:1/2}}';
      document.head.appendChild(style);
    }

    function barRows(items, total, issueClass){
      return items.map(function(item){
        var pct = total > 0 ? Math.max(0, Math.min(100, (item.count / total) * 100)) : 0;
        return '<div class="psc-viz-row">' +
          '<div class="psc-viz-label">' + item.label + '</div>' +
          '<div class="psc-viz-track" role="img" aria-label="' + item.label + ' ' + item.count + '件／' + total + '件">' +
            '<span class="psc-viz-fill" style="width:' + pct.toFixed(1) + '%"></span>' +
          '</div>' +
          '<div class="psc-viz-value">' + item.count + '</div>' +
        '</div>';
      }).join('');
    }

    var basisItems = Object.keys(basisCounts).map(function(label){ return {label:label,count:basisCounts[label]}; });
    var section = document.createElement('section');
    section.id = 'psc-evidence-visuals';
    section.setAttribute('aria-labelledby','psc-evidence-visuals-title');
    section.innerHTML =
      '<h3 id="psc-evidence-visuals-title" class="psc-viz-title">15自治体の比較を可視化する</h3>' +
      '<p class="psc-viz-intro">左は「学校処理を何で説明しているか」の分布、右は比較表の「なお残る主要論点」「現時点の法的評価」に明記された未解決論点の出現件数です。どちらも適法度・優良度の順位ではありません。</p>' +
      '<div class="psc-viz-grid">' +
        '<div class="psc-viz-panel psc-viz-basis"><h3>主たる根拠形態の分布</h3>' + barRows(basisItems, rows.length, false) + '</div>' +
        '<div class="psc-viz-panel psc-viz-issues"><h3>主要な未解決論点の出現件数</h3>' + barRows(issueCounts, rows.length, true) + '</div>' +
      '</div>' +
      '<p class="psc-viz-note">集計対象：現在の比較表15自治体・都道府県。右側は同一自治体が複数論点に重複して数えられます。表の記載から自動集計しているため、原資料の追加・表の更新に応じて数値も変わります。</p>';

    node.parentNode.insertBefore(section, node);
  }

  function installCoreEssayEntrances(){
    addCoreEssayStyles();
    addGlobalNav();
    var path = (window.location.pathname || '').replace(/\/+$/,'');
    if (document.body.classList.contains('home-page') || path === '' || path === '/index.html') injectHome();
    if (document.body.classList.contains('journal-page') || path === '/journal.html') injectJournal();
    if (path === '/framework.html' || document.getElementById('fw-borders')) injectFrameworkBoundaryClarification();
    if (path === '/pta-school-processing.html') injectSchoolProcessingVisuals();
  }

  load('/js/site-core-v90.js?v=98', 'site-core-v90', function(){
    installMobileSearch();
    load('/js/current-location-nav.js?v=20260823-10', 'current-location-nav', installCoreEssayEntrances);
  });
})();
