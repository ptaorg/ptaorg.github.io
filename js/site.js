/* site.js loader — 2026-09-06 v102 static-nav */
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
    var path = (window.location.pathname || '/').replace(/\/+$/,'') || '/';
    var schoolLinks = [
      ['/framework.html','学校とPTAの境界'],
      ['/fee-collection.html','会費・学校徴収'],
      ['/privacy.html','個人情報'],
      ['/personnel.html','教職員のPTA事務'],
      ['/facilities.html','学校施設・媒体'],
      ['/law-map.html','法制度マップ']
    ];
    var researchLinks = [
      ['/pta-school-processing.html','学校処理の全国法的整合性調査'],
      ['/cases.html','自治体別事例'],
      ['/national-archive.html','全国資料館'],
      ['/report.html','調査報告']
    ];
    var readingLinks = [
      ['/ppc-points.html','PPC資料'],
      ['/pta-history.html','PTAの成り立ち'],
      ['/pta-future.html','PTAのこれから'],
      ['/journal.html','論考・調査報告'],
      ['/key-materials.html','根拠法令・一次資料'],
      ['/documents.html','文例・提出資料']
    ];
    var membershipPaths = ['/pta-membership-optin.html','/membership.html','/withdrawal.html','/nonmember.html'];

    function hrefPath(a){
      var h = a.getAttribute('href') || '';
      if (!h || h.charAt(0) !== '/') return '';
      h = h.split('#')[0].split('?')[0];
      return h.replace(/\/+$/,'') || '/';
    }
    function inLinks(links){ return links.some(function(x){ return x[0] === path; }); }
    function markCurrent(nav){
      nav.querySelectorAll('.is-here,.is-here-parent').forEach(function(el){el.classList.remove('is-here','is-here-parent');});
      nav.querySelectorAll('a[href]').forEach(function(a){
        if (hrefPath(a) === path) {
          a.classList.add('is-here');
          a.setAttribute('aria-current','page');
        } else {
          a.removeAttribute('aria-current');
        }
      });
      if (membershipPaths.indexOf(path) !== -1) {
        var m = nav.querySelector('.global-membership-nav'); if (m) m.classList.add('is-here');
      }
      [['school',schoolLinks],['research',researchLinks],['reading',readingLinks]].forEach(function(g){
        if (!inLinks(g[1])) return;
        var parent = nav.querySelector('[data-global-nav-group="' + g[0] + '"] > .nav-link');
        if (parent) parent.classList.add('is-here-parent');
      });
    }
    function closeMenus(nav,except){
      nav.querySelectorAll('.nav-item.is-open').forEach(function(item){
        if (item === except) return;
        item.classList.remove('is-open');
        var trigger = item.querySelector(':scope > .nav-link');
        if (trigger) trigger.setAttribute('aria-expanded','false');
      });
    }
    function installMenuBehavior(nav){
      nav.querySelectorAll('.nav-item.has-dropdown').forEach(function(item){
        var trigger = item.querySelector(':scope > .nav-link');
        if (!trigger) return;
        trigger.addEventListener('click',function(ev){
          var touchLike = window.matchMedia && window.matchMedia('(hover: none)').matches;
          if (touchLike || window.innerWidth < 1120) {
            if (!item.classList.contains('is-open')) {
              ev.preventDefault();
              closeMenus(nav,item);
              item.classList.add('is-open');
              trigger.setAttribute('aria-expanded','true');
            }
          }
        });
        item.addEventListener('focusin',function(){
          closeMenus(nav,item);
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded','true');
        });
        item.addEventListener('focusout',function(ev){
          if (!item.contains(ev.relatedTarget)) {
            item.classList.remove('is-open');
            trigger.setAttribute('aria-expanded','false');
          }
        });
      });
      document.addEventListener('click',function(ev){
        if (!nav.contains(ev.target)) closeMenus(nav,null);
      });
    }

    document.querySelectorAll('.desktop-nav, .essay-nav').forEach(function(nav){
      nav.classList.add('desktop-nav','global-nav-v102');
      markCurrent(nav);
      installMenuBehavior(nav);
    });
    document.querySelectorAll('.mobile-overlay').forEach(markCurrent);
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

  function injectSchoolProcessingCaseVisuals(){
    var path = (window.location.pathname || '').replace(/\/+$/,'');
    if (path !== '/pta-school-processing.html') return;

    var oldSummary = document.getElementById('psc-evidence-visuals');
    if (oldSummary) oldSummary.remove();

    if (!document.getElementById('psc-case-visuals-style')) {
      var style = document.createElement('style');
      style.id = 'psc-case-visuals-style';
      style.textContent =
        '.psc-case-viz{margin:14px 26px 24px;padding:18px 18px 16px;border-top:1px solid #cfd7de;border-bottom:1px solid #cfd7de;background:#fafbfb}' +
        '.psc-case-viz-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}' +
        '.psc-case-viz-title{font-weight:900;font-size:.92rem;color:#243746}' +
        '.psc-case-viz-note{font-size:.74rem;color:#68747d}' +
        '.psc-case-viz-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}' +
        '.psc-case-viz-step{position:relative;min-width:0;padding:12px 10px 11px;border:1px solid #cfd7de;background:#fff}' +
        '.psc-case-viz-step:after{content:"→";position:absolute;right:-9px;top:50%;transform:translateY(-50%);z-index:2;color:#9aa5ad;font-weight:900;background:#fafbfb;padding:0 1px}' +
        '.psc-case-viz-step:nth-child(4n):after,.psc-case-viz-step:last-child:after{display:none}' +
        '.psc-case-viz-no{display:block;font-family:ui-monospace,monospace;font-size:.68rem;font-weight:900;color:#6b7780;margin-bottom:4px}' +
        '.psc-case-viz-label{display:block;font-size:.8rem;font-weight:900;line-height:1.35;color:#25343e;margin-bottom:7px}' +
        '.psc-case-viz-state{display:inline-block;padding:2px 6px;border-left:4px solid #607d90;background:#edf3f6;font-size:.7rem;font-weight:800;line-height:1.45;color:#304b5b}' +
        '.psc-case-viz-step.is-partial .psc-case-viz-state{border-left-color:#a47921;background:#fbf4e4;color:#6e5215}' +
        '.psc-case-viz-step.is-open .psc-case-viz-state{border-left-color:#8a4545;background:#f8eded;color:#713838}' +
        '.psc-case-viz-legend{margin:13px 0 0!important;font-size:.72rem;line-height:1.65!important;color:#67737c}' +
        '.psc-case-viz-legend b{color:#263944}.psc-case-viz-legend span{white-space:nowrap;margin-right:12px}' +
        '.psc-case-viz-legend .lg-ok:before,.psc-case-viz-legend .lg-partial:before,.psc-case-viz-legend .lg-open:before{content:"■";margin-right:4px}' +
        '.psc-case-viz-legend .lg-ok:before{color:#607d90}.psc-case-viz-legend .lg-partial:before{color:#a47921}.psc-case-viz-legend .lg-open:before{color:#8a4545}' +
        '@media(max-width:760px){.psc-case-viz{margin-left:18px;margin-right:18px;padding-left:12px;padding-right:12px}.psc-case-viz-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.psc-case-viz-step:nth-child(4n):after{display:block}.psc-case-viz-step:nth-child(2n):after,.psc-case-viz-step:last-child:after{display:none}}' +
        '@media(max-width:430px){.psc-case-viz-grid{grid-template-columns:1fr}.psc-case-viz-step:after{content:"↓";right:auto;left:50%;top:auto;bottom:-13px;transform:translateX(-50%);background:#fafbfb}.psc-case-viz-step:nth-child(2n):after,.psc-case-viz-step:nth-child(4n):after{display:block}.psc-case-viz-step:last-child:after{display:none}}';
      document.head.appendChild(style);
    }

    var labels = ['対象事務','公法上の根拠','受任主体','委任の順序','校長・職員','地公法35条','学校教育法37条','個情法61・69条'];

    document.querySelectorAll('section.psc-audit-case').forEach(function(caseEl){
      if (caseEl.querySelector('.psc-case-viz')) return;
      var items = Array.prototype.slice.call(caseEl.querySelectorAll('ol.psc-audit-list > li')).slice(0,8);
      if (!items.length) return;

      var viz = document.createElement('div');
      viz.className = 'psc-case-viz';

      var head = document.createElement('div');
      head.className = 'psc-case-viz-head';
      head.innerHTML = '<span class="psc-case-viz-title">法的構造の可視化</span>' +
        '<span class="psc-case-viz-note">色は資料確認状況。適法性・優良度の点数ではありません。</span>';
      viz.appendChild(head);

      var grid = document.createElement('div');
      grid.className = 'psc-case-viz-grid';

      items.forEach(function(item, index){
        var status = item.querySelector('.psc-audit-status');
        var step = document.createElement('div');
        step.className = 'psc-case-viz-step';
        var stateText = '確認中';
        if (status) {
          stateText = (status.textContent || '').trim();
          if (status.classList.contains('open')) step.classList.add('is-open');
          else if (status.classList.contains('partial')) step.classList.add('is-partial');
          else step.classList.add('is-ok');
        } else {
          step.classList.add('is-partial');
        }
        step.innerHTML = '<span class="psc-case-viz-no">' + String(index + 1).padStart(2,'0') + '</span>' +
          '<span class="psc-case-viz-label">' + (labels[index] || ('項目' + (index + 1))) + '</span>' +
          '<span class="psc-case-viz-state"></span>';
        step.querySelector('.psc-case-viz-state').textContent = stateText;
        grid.appendChild(step);
      });
      viz.appendChild(grid);

      var legend = document.createElement('p');
      legend.className = 'psc-case-viz-legend';
      legend.innerHTML = '<span class="lg-ok"><b>資料上確認</b></span>' +
        '<span class="lg-partial"><b>部分確認・限定的整理</b></span>' +
        '<span class="lg-open"><b>未解決・疑義</b></span>' +
        '「確認」は、その資料・制度が存在することを示すだけで、適法性を肯定する表示ではありません。';
      viz.appendChild(legend);

      var lead = caseEl.querySelector('.psc-audit-lead');
      if (lead) lead.insertAdjacentElement('afterend', viz);
      else caseEl.insertBefore(viz, caseEl.firstChild ? caseEl.firstChild.nextSibling : null);
    });
  }

  function installCoreEssayEntrances(){
    addCoreEssayStyles();
    addGlobalNav();
    var path = (window.location.pathname || '').replace(/\/+$/,'');
    if (document.body.classList.contains('home-page') || path === '' || path === '/index.html') injectHome();
    if (document.body.classList.contains('journal-page') || path === '/journal.html') injectJournal();
    if (path === '/framework.html' || document.getElementById('fw-borders')) injectFrameworkBoundaryClarification();
    if (path === '/pta-school-processing.html') injectSchoolProcessingCaseVisuals();
  }

  load('/js/site-core-v90.js?v=98', 'site-core-v90', function(){
    installMobileSearch();
    load('/js/current-location-nav.js?v=20260823-10', 'current-location-nav', installCoreEssayEntrances);
  });
})();
