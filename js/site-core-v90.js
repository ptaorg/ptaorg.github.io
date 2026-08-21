/* site.js v90 — static body preservation
   重要本文はHTML側を正とし、JavaScriptは補助機能だけを担当する。 */
(function(){
  var initialPath = location.pathname + location.search;
  var allowAutoTop = !location.hash;

  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  } catch (e) {}

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  function addStyle(id, css) {
    var style = document.getElementById(id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = css;
  }

  function loadCss(id, href) {
    if (document.getElementById(id)) return;
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(id, src, callback) {
    var old = document.getElementById(id);
    if (old) {
      if (old.dataset.loaded === '1') {
        if (callback) callback();
      } else if (callback) {
        old.addEventListener('load', callback, { once: true });
      }
      return;
    }
    var script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.onload = function(){
      script.dataset.loaded = '1';
      if (callback) callback();
    };
    document.head.appendChild(script);
  }

  function forceTop() {
    if (!allowAutoTop) return;
    try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }
    catch (e) { try { window.scrollTo(0, 0); } catch (_) {} }
  }

  function forceTopBurst(ms) {
    var end = Date.now() + ms;
    forceTop();
    var timer = setInterval(function(){
      if (!allowAutoTop || Date.now() > end) {
        clearInterval(timer);
        return;
      }
      forceTop();
    }, 120);
  }

  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function(ev){
    window.addEventListener(ev, function(){ allowAutoTop = false; }, { once: true, passive: true });
  });

  function scrollToHashTarget() {
    if (!location.hash) return;
    var id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch (e) {}
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    var parentDetails = el.closest && el.closest('details');
    if (parentDetails) parentDetails.open = true;
    if (el.tagName && el.tagName.toLowerCase() === 'details') el.open = true;
    allowAutoTop = false;
    var header = document.querySelector('.site-header, .nav-container');
    var offset = (header ? header.getBoundingClientRect().height : 0) + 18;
    var y = el.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0) - offset;
    try { window.scrollTo({ top: Math.max(0, y), left: 0, behavior: 'auto' }); }
    catch (e) { try { window.scrollTo(0, Math.max(0, y)); } catch (_) {} }
  }

  function scheduleHashScroll() {
    if (!location.hash) return;
    [0, 80, 260, 700, 1400].forEach(function(ms){
      setTimeout(scrollToHashTarget, ms);
    });
  }

  window.addEventListener('hashchange', function(){
    allowAutoTop = false;
    scheduleHashScroll();
  }, { passive: true });

  window.addEventListener('pageshow', function(){
    if (!location.hash && (location.pathname + location.search) === initialPath) forceTopBurst(1200);
  });

  var SITE_INDEX = [
    ['トップ', '/index.html', 'PTA適正化推進委員会の全体像'],
    ['資料入口・索引', '/documents.html', '公開資料への入口'],
    ['保護者の方へ', '/guide-parent.html', '入会した覚えがない・会費の根拠が分からない場合の確認手順'],
    ['PTA役員の方へ', '/guide-pta.html', '引き継いだ運営を適法に直す実務手順'],
    ['学校・教育委員会の方へ', '/guide-board.html', '確認すべき領域と初動チェック'],
    ['研究者・記者の方へ', '/guide-research.html', '調査・取材のための資料案内'],
    ['教委向け分離指針', '/edu-board-separation.html', '学校とPTAの線引き'],
    ['適正化とは', '/proper-management.html', 'PTA適正化の基本原則'],
    ['適正化ガイドライン', '/guideline.html', '実務ガイドラインと書式テンプレート'],
    ['PTA入会の成立と申込記録', '/membership.html', '申込み・承諾・申込記録・みなし加入の確認'],
    ['学校保有情報のPTA目的利用・提供', '/privacy.html', '学校自身の利用、PTAへの提供、PTAによる直接取得'],
    ['会費徴収と学校徴収金', '/fee-collection.html', '抱合せ徴収・代行徴収・公会計化'],
    ['教職員関与と職務専念義務', '/personnel.html', '地方公務員法第35条と職専免'],
    ['施設利用と公私の境界', '/facilities.html', '学校教育法第137条と目的外使用許可'],
    ['法制度マップ', '/law-map.html', '関連法令を論点別に整理'],
    ['判例整理', '/cases.html', 'PTA関連裁判例の争点整理'],
    ['PTA制度史', '/timeline.html', '制度変遷の整理'],
    ['教育委員会の回答', '/board-responses.html', '自治体別・論点別の公式回答データベース'],
    ['全国資料館', '/national-archive.html', '自治体別・学校別の実物文書アーカイブ'],
    ['行政通知・公式PDF', '/administrative-materials.html', '行政通知・公式資料'],
    ['横浜市教育委員会通知 学教第1965号', '/journal/yokohama-notice-1965.html', '任意加入・個人情報・会費説明の中核資料'],
    ['提出文書キット', '/submission-kit.html', '学校・PTA・教育委員会への確認文'],
    ['主張と根拠の対応表', '/claim-evidence-ledger.html', '主張、根拠条文、公式資料、提出文例の対応'],
    ['PTAと消費者契約法', '/journal/consumer-contract.html', 'PTA加入・会費請求と消費者契約法'],
    ['PTAオプトアウト加入の無効性', '/journal/optout-invalidity.html', '退会届方式・みなし加入の整理'],
    ['PTA非会員情報・協力金', '/journal/nonmember-info.html', '非会員名簿、協力金、学校情報利用'],
    ['学校徴収金とPTA会費', '/journal/school-fee-separation.html', '学校徴収金と任意団体会費の分離'],
    ['第三者提供同意とPTA名簿', '/journal/third-party-consent.html', '学校書類内のPTA個人情報同意'],
    ['働き方改革とPTA会費代理徴収', '/journal/work-style-reform.html', '学校事務とPTA会費の分離'],
    ['学校とPTAの運用実例を点検する', '/reality.html', '入会案内、会費徴収、学校保有情報、教職員関与の再現資料'],
    ['論考・調査報告', '/journal.html', '個別テーマの掘り下げ'],
    ['総合分析レポート', '/report.html', 'PTA問題の構造分析'],
    ['なぜ教育委員会の所掌なのか', '/education-board-responsibility.html', '学校関与を点検すべき理由'],
    ['運営チェック', '/audit/index.html', '資料と運用の確認優先度を整理するチェック表'],
    ['お問い合わせ・情報提供', '/contact.html', '資料・情報提供窓口'],
    ['応援・寄付', '/support.html', '活動支援のお願い']
  ];

  function getSearchIndex() {
    if (Array.isArray(window.PTA_SITE_SEARCH_INDEX) && window.PTA_SITE_SEARCH_INDEX.length) {
      var merged = window.PTA_SITE_SEARCH_INDEX.slice();
      return merged;
    }
    return SITE_INDEX;
  }

  function preloadSearchIndex() {
    if (Array.isArray(window.PTA_SITE_SEARCH_INDEX) && window.PTA_SITE_SEARCH_INDEX.length) return;
    loadScript('site-search-index-dynamic', '/data/site-search-index.js?v=1');
  }

  function initSearch() {
    document.querySelectorAll('.header-search').forEach(function(box){
      var input = box.querySelector('.search-input');
      var dropdown = box.querySelector('.search-results-dropdown');
      if (!input || !dropdown || input.dataset.searchReady === '1') return;
      input.dataset.searchReady = '1';
      input.addEventListener('input', function(){
        var q = input.value.trim().toLowerCase();
        dropdown.innerHTML = '';
        if (!q) {
          dropdown.classList.remove('is-open');
          return;
        }
        var hits = getSearchIndex().filter(function(row){
          return row && (row[0] + ' ' + row[1] + ' ' + row[2]).toLowerCase().indexOf(q) >= 0;
        }).slice(0, 8);
        if (!hits.length) {
          var empty = document.createElement('div');
          empty.className = 'search-result-item srd-empty';
          empty.innerHTML = '<strong>該当なし</strong><span>別の語で検索してください。</span>';
          dropdown.appendChild(empty);
        } else {
          hits.forEach(function(row){
            var a = document.createElement('a');
            a.className = 'search-result-item srd-item';
            a.href = row[1];
            var title = document.createElement('strong');
            title.className = 'srd-item-title';
            title.textContent = row[0];
            var desc = document.createElement('span');
            desc.className = 'srd-item-desc';
            desc.textContent = row[2] || '';
            a.appendChild(title);
            a.appendChild(desc);
            dropdown.appendChild(a);
          });
        }
        dropdown.classList.add('is-open');
      });
      document.addEventListener('click', function(e){
        if (!box.contains(e.target)) dropdown.classList.remove('is-open');
      });
    });
  }


  function stabilizeMobileNavigation() {
    var hamburger = document.getElementById('hamburger');
    var overlay = document.getElementById('mobileOverlay');
    if (!hamburger || !overlay || hamburger.dataset.stableMobileNav === 'v90') return;

    addStyle('mobile-nav-stable-v90',
      'html.mobile-nav-lock-root{overflow:hidden!important;overscroll-behavior:none!important}' +
      'body.mobile-nav-lock{position:fixed!important;left:0;right:0;width:100%;overflow:hidden!important;touch-action:none!important}' +
      '.mobile-overlay{position:fixed!important;inset:0!important;z-index:5000!important;display:none!important;flex-direction:column!important;justify-content:flex-start!important;align-items:center!important;gap:10px!important;padding:calc(18px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))!important;background:rgba(5,17,31,.92)!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}' +
      '.mobile-overlay.is-open{display:flex!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important}' +
      '.mobile-menu-group{width:min(100%,430px);display:flex;flex-direction:column;gap:0;margin:0 0 16px!important;border-top:1px solid rgba(255,255,255,.2)}' +
      '.mobile-menu-label{color:rgba(255,255,255,.58);font-size:.72rem;font-weight:900;letter-spacing:.08em;text-transform:none;margin:14px 0 6px}' +
      '.mobile-link{width:100%!important;background:transparent!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.18)!important;border-radius:0!important;padding:13px 2px!important;text-decoration:none!important;color:#fff!important;font-weight:800!important;box-shadow:none!important}' +
      '.mobile-close-btn{width:min(100%,430px);min-height:44px;border:1px solid rgba(255,255,255,.35);border-radius:0;background:transparent;color:#fff;font-weight:900;cursor:pointer}'
    );

    hamburger.dataset.stableMobileNav = 'v90';
    overlay.dataset.stableMobileNav = 'v90';
    overlay.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-controls', 'mobileOverlay');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'メニューを開く');

    var savedY = 0;
    function openMenu() {
      savedY = window.scrollY || window.pageYOffset || 0;
      allowAutoTop = false;
      overlay.classList.add('is-open');
      hamburger.classList.add('is-active');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'メニューを閉じる');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.top = '-' + savedY + 'px';
      document.documentElement.classList.add('mobile-nav-lock-root');
      document.body.classList.add('mobile-nav-lock');
      setTimeout(function(){
        var close = overlay.querySelector('#closeOverlay');
        if (close && close.focus) close.focus({ preventScroll: true });
      }, 0);
    }
    function closeMenu() {
      var locked = document.body.classList.contains('mobile-nav-lock');
      overlay.classList.remove('is-open');
      hamburger.classList.remove('is-active');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'メニューを開く');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('mobile-nav-lock');
      document.documentElement.classList.remove('mobile-nav-lock-root');
      document.body.style.top = '';
      if (locked) {
        try { window.scrollTo(0, savedY); } catch (e) {}
      }
    }
    hamburger.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      if (overlay.classList.contains('is-open')) closeMenu();
      else openMenu();
    });
    overlay.addEventListener('click', function(e){
      if (e.target === overlay || e.target.id === 'closeOverlay' || (e.target.closest && e.target.closest('a.mobile-link'))) closeMenu();
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeMenu();
    });
    window.addEventListener('resize', function(){
      if (window.innerWidth > 860 && overlay.classList.contains('is-open')) closeMenu();
    }, { passive: true });
  }

  function normalizeLinks() {
    document.querySelectorAll('a[href]').forEach(function(a){
      var href = a.getAttribute('href');
      if (!href) return;
      if (href === '/donate/' || href === 'donate/' || href === 'https://ptaorg.com/donate/' || href === 'https://ptaorg.github.io/donate/' || href === 'https://ptaorg.github.io/donate') a.setAttribute('href', '/support.html');
      if (href === '/jp/' || href === 'jp/' || href === 'https://ptaorg.com/jp/') a.setAttribute('href', '/guide-board.html#board-jp-guideline');
      if (href === 'https://ptaorg.github.io/ed/' || href === 'https://ptaorg.github.io/ed') a.setAttribute('href', 'https://ptaorg.com/ed');
    });
  }

  function pdfLinks() {
    var cards = document.querySelectorAll('.parent-page .pdf-section .pdf-card');
    var pdfs = ['/assets/pdf/pta-membership-inquiry.pdf', '/assets/pdf/pta-withdrawal-notice.pdf', '/assets/pdf/personal-data-deletion-request.pdf'];
    cards.forEach(function(card, i){
      var link = card.querySelector('a.pdf-btn');
      if (link && pdfs[i]) {
        link.href = pdfs[i];
        link.removeAttribute('target');
        link.removeAttribute('rel');
        link.textContent = 'PDFを開く';
      }
    });
  }

  var TRIP_LOCATIONS = [
    {name:'札幌市',lat:43.0621,lng:141.3544},{name:'仙台市',lat:38.2682,lng:140.8694},{name:'いわき市',lat:37.0504,lng:140.8877},{name:'須賀川市',lat:37.2865,lng:140.3734},{name:'潮来市',lat:35.9344,lng:140.5453},{name:'久喜市',lat:36.0621,lng:139.6672},{name:'埼玉県',lat:35.8574,lng:139.6489},{name:'川口市',lat:35.8079,lng:139.7238},{name:'幸手市',lat:36.0747,lng:139.7247},{name:'越谷市',lat:35.8911,lng:139.7911},{name:'三鷹市',lat:35.6836,lng:139.5594},{name:'墨田区',lat:35.7129,lng:139.8015},{name:'江戸川区',lat:35.6783,lng:139.8711},{name:'足立区',lat:35.7750,lng:139.8044},{name:'厚木市',lat:35.4431,lng:139.3622},{name:'川崎市',lat:35.5302,lng:139.7029},{name:'海老名市',lat:35.4461,lng:139.3917},{name:'相模原市',lat:35.5714,lng:139.3736},{name:'神奈川県',lat:35.4478,lng:139.6425},{name:'茅ヶ崎市',lat:35.3323,lng:139.4061},{name:'静岡市',lat:34.9756,lng:138.3828},{name:'名古屋市',lat:35.1815,lng:136.9066},{name:'大津市',lat:35.0178,lng:135.8547},{name:'京都市',lat:35.0116,lng:135.7681},{name:'大阪市',lat:34.6937,lng:135.5023},{name:'岡山市',lat:34.6551,lng:133.9196},{name:'広島市',lat:34.3853,lng:132.4553},{name:'徳島市',lat:34.0711,lng:134.5517},{name:'北九州市',lat:33.8833,lng:130.8833},{name:'長崎市',lat:32.7503,lng:129.8777},{name:'熊本市',lat:32.8031,lng:130.7078},{name:'鹿児島市',lat:31.5967,lng:130.5572}
  ];

  function initHomeMap() {
    var p = location.pathname;
    if (!(p === '/' || p.endsWith('/index.html'))) return;
    var el = document.getElementById('homeEvidenceMap');
    if (!el || el.dataset.initialized === '1') return;
    el.dataset.initialized = '1';
    loadCss('leaflet-css-dynamic', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    function draw() {
      if (!window.L) return;
      function icon(color) {
        return L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-' + color + '.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [13, 21], iconAnchor: [6.5, 21], popupAnchor: [0, -20], shadowSize: [21, 21]
        });
      }
      var map = L.map(el, { scrollWheelZoom: false }).setView([36.2, 138.2], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      var group = L.featureGroup();
      var blue = icon('blue');
      var red = icon('red');
      var data = window.PTA_BOARD_RESPONSE_INDEX || {};
      var munis = data.municipalities || [];
      var blueNames = {};
      munis.forEach(function(m){
        if (!Array.isArray(m.coordinates)) return;
        blueNames[m.municipality] = true;
        var marker = L.marker(m.coordinates, { icon: blue, title: m.municipality }).addTo(map)
          .bindPopup('<strong>' + m.municipality + '</strong><br><small>教育委員会回答</small><br><a href="/board-responses.html#ans-' + m.no + '">回答本文へ</a>');
        group.addLayer(marker);
      });
      TRIP_LOCATIONS.forEach(function(loc){
        var lng = blueNames[loc.name] ? loc.lng + 0.035 : loc.lng;
        var marker = L.marker([loc.lat, lng], { icon: red, title: loc.name, zIndexOffset: 250 }).addTo(map)
          .bindPopup('<strong>' + loc.name + '</strong><br><small>資料取得・訪問先</small>');
        group.addLayer(marker);
      });
      if (group.getLayers().length) map.fitBounds(group.getBounds().pad(0.08));
    }
    function loadDataThenMap() {
      if (window.PTA_BOARD_RESPONSE_INDEX) draw();
      else loadScript('board-response-data-dynamic', '/data/board-responses-index.js', draw);
    }
    if (window.L) loadDataThenMap();
    else loadScript('leaflet-js-dynamic', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', loadDataThenMap);
  }

  function loadArchiveNotice() {
    if (location.pathname.endsWith('/national-archive.html')) loadScript('archive-notice-dynamic', '/js/archive-notice.js?v=1');
  }

  function initFAQ() {
    document.querySelectorAll('.faq-item .faq-q').forEach(function(q){
      if (q.dataset.faqReady === '1') return;
      q.dataset.faqReady = '1';
      q.addEventListener('click', function(){
        var item = q.closest('.faq-item');
        if (item) item.classList.toggle('is-open');
      });
    });
  }


  /* ===== 現在地の可視化（v90追補）=====
     ナビの現在ページ強調と、簡易パンくず（既存の静的パンくずが見えているページでは注入しない）。 */

  function locNormPath(p) {
    try { p = decodeURI(p); } catch (e) {}
    if (p.slice(-11) === '/index.html') p = p.slice(0, -10);
    return p;
  }

  var LOC_SECTIONS = [
    { re: /^\/journal\//, href: '/journal.html', label: '論考・調査報告' },
    { re: /^\/board-responses\//, href: '/board-responses.html', label: '教育委員会の回答' },
    { re: /^\/archive\//, href: '/national-archive.html', label: '全国資料館' },
    { re: /^\/starter-kit\//, href: '/starter-kit/', label: 'スターターキット' },
    { re: /^\/forms\//, href: '/documents.html', label: '資料入口・文例索引' },
    { re: /^\/downloads\//, href: '/documents.html', label: '資料入口・文例索引' }
  ];

  var LOC_GROUPS = {
    '/guide-parent.html': '立場別', '/guide-pta.html': '立場別', '/guide-board.html': '立場別', '/guide-research.html': '立場別',
    '/membership.html': '問題別', '/privacy.html': '問題別', '/fee-collection.html': '問題別', '/personnel.html': '問題別', '/facilities.html': '問題別', '/law-map.html': '問題別',
    '/board-responses.html': '根拠資料', '/national-archive.html': '根拠資料', '/administrative-materials.html': '根拠資料', '/cases.html': '根拠資料', '/journal.html': '根拠資料', '/report.html': '根拠資料', '/research-index.html': '根拠資料',
    '/guideline.html': 'チェック・文例', '/submission-kit.html': 'チェック・文例', '/documents.html': 'チェック・文例'
  };

  function initCurrentLocation() {
    var cur = locNormPath(location.pathname);
    if (document.documentElement.dataset.locReady === '1') return;
    document.documentElement.dataset.locReady = '1';

    addStyle('loc-style-v90',
      '.desktop-nav > a.nav-link.is-here,.desktop-nav .nav-item > a.nav-link.is-here-parent{color:#f0c95c!important;position:relative}' +
      '.desktop-nav > a.nav-link.is-here::after,.desktop-nav .nav-item > a.nav-link.is-here-parent::after{content:"";position:absolute;left:8px;right:8px;bottom:1px;height:3px;background:#d4af37;border-radius:2px}' +
      '.mega-menu a.is-here{color:#b45309!important;font-weight:900}' +
      '.mega-menu a.is-here::before{content:"▸ ";color:#d4af37}' +
      '.mobile-link.is-here{color:#f0c95c!important;border-left:4px solid #d4af37!important;padding-left:10px!important}' +
      '.loc-trail{background:#f4f7fa;border-bottom:1px solid #dbe4ee;font-size:.82rem;line-height:1.6}' +
      '.loc-trail-inner{max-width:1200px;margin:0 auto;padding:8px 20px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;color:#64748b}' +
      '.loc-trail a{color:#1e3a5f;text-decoration:none;font-weight:700}' +
      '.loc-trail a:hover{text-decoration:underline}' +
      '.loc-trail .loc-sep{color:#94a3b8}' +
      '.loc-trail .loc-current{color:#334155;font-weight:700;max-width:34em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    );

    var isHome = (cur === '/' || cur === '');
    var matchedInNav = false;

    function markAnchor(a) {
      a.classList.add('is-here');
      a.setAttribute('aria-current', 'page');
      var item = a.closest ? a.closest('.nav-item') : null;
      if (item) {
        var top = item.querySelector(':scope > a.nav-link') || item.querySelector('a.nav-link');
        if (top && top !== a) top.classList.add('is-here-parent');
      }
    }

    var navAnchors = document.querySelectorAll('.desktop-nav a[href], .mobile-overlay a[href]');
    navAnchors.forEach(function(a){
      var href = a.getAttribute('href') || '';
      if (href.indexOf('#') !== -1) return;
      if (locNormPath(a.pathname) === cur) { markAnchor(a); matchedInNav = true; }
    });

    var section = null;
    for (var i = 0; i < LOC_SECTIONS.length; i++) {
      if (LOC_SECTIONS[i].re.test(cur)) { section = LOC_SECTIONS[i]; break; }
    }

    if (!matchedInNav && section) {
      navAnchors.forEach(function(a){
        var href = a.getAttribute('href') || '';
        if (href.indexOf('#') !== -1) return;
        if (locNormPath(a.pathname) === section.href) {
          a.classList.add('is-here');
          var item = a.closest ? a.closest('.nav-item') : null;
          if (item) {
            var top = item.querySelector(':scope > a.nav-link') || item.querySelector('a.nav-link');
            if (top && top !== a) top.classList.add('is-here-parent');
          }
        }
      });
    }

    /* 簡易パンくず */
    if (isHome) return;
    var existing = document.querySelector('.breadcrumb-bar');
    if (existing) {
      var st = window.getComputedStyle(existing);
      if (st && st.display !== 'none' && existing.offsetParent !== null) return;
    }
    if (document.querySelector('.loc-trail')) return;

    var label = '';
    var h1 = document.querySelector('main h1, h1');
    if (h1) label = (h1.textContent || '').replace(/\s+/g, ' ').trim();
    if (!label) label = (document.title || '').split(/[|｜]/)[0].trim();
    if (label.length > 42) label = label.slice(0, 42) + '…';
    if (!label) return;

    var group = LOC_GROUPS[cur] || null;
    var frag = '<div class="loc-trail-inner"><a href="/index.html">トップ</a>';
    if (section) {
      frag += '<span class="loc-sep">›</span><a href="' + section.href + '">' + section.label + '</a>';
    } else if (group) {
      frag += '<span class="loc-sep">›</span><span>' + group + '</span>';
    }
    frag += '<span class="loc-sep">›</span><span class="loc-current" title="現在のページ">' + label.replace(/</g, '&lt;') + '</span></div>';

    var bar = document.createElement('nav');
    bar.className = 'loc-trail';
    bar.setAttribute('aria-label', '現在地');
    bar.innerHTML = frag;
    var header = document.querySelector('header.site-header');
    if (header && header.insertAdjacentElement) header.insertAdjacentElement('afterend', bar);
    else document.body.insertBefore(bar, document.body.firstChild);
  }

  /* ===== リンクの開き方の選別（v90追補）=====
     外部ドメインとファイル（PDF等）は別タブで開き、サイト内の現在地を失わないようにする。 */
  function applyLinkTargets(root) {
    var FILE_RE = /\.(pdf|xlsx?|docx?|pptx?|zip|csv)(?=$|[?#])/i;
    (root || document).querySelectorAll('a[href]').forEach(function(a){
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#') return;
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
      var external = false;
      try { external = !!a.hostname && a.hostname !== location.hostname; } catch (e) {}
      var isFile = FILE_RE.test(a.pathname || '');
      if (!external && !isFile) return;
      a.setAttribute('target', '_blank');
      var rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      if (rel.indexOf('noopener') < 0) rel.push('noopener');
      if (external && rel.indexOf('noreferrer') < 0) rel.push('noreferrer');
      a.setAttribute('rel', rel.join(' '));
      if (external && !a.querySelector('img,svg') && (a.textContent || '').trim() && !a.classList.contains('no-ext-mark')) {
        a.classList.add('ext-link-mark');
      }
    });
    addStyle('ext-link-style-v90',
      'a.ext-link-mark::after{content:"↗";font-size:.72em;margin-left:3px;vertical-align:super;opacity:.65}'
    );
  }
  function initLinkTargets() {
    applyLinkTargets(document);
    setTimeout(function(){ applyLinkTargets(document); }, 1500);
  }

  function boot() {
    stabilizeMobileNavigation();
    normalizeLinks();
    preloadSearchIndex();
    initSearch();
    initFAQ();
    pdfLinks();
    initCurrentLocation();
    initLinkTargets();
    loadArchiveNotice();
    initHomeMap();
    if (location.hash) scheduleHashScroll();
    else forceTopBurst(1000);
  }

  window.initSearch = initSearch;
  window.applyLinkTargets = applyLinkTargets;
  window.initMobileNav = stabilizeMobileNavigation;
  window.initPrimaryNavigation = stabilizeMobileNavigation;

  ready(function(){
    boot();
    setTimeout(stabilizeMobileNavigation, 80);
    setTimeout(function(){
      if (location.hash) scheduleHashScroll();
    }, 300);
  });
})();