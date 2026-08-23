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
    {name:'札幌市',lat:43.0621,lng:141.3544},{name:'仙台市',lat:38.2682,lng:140.8694},{name:'いわき市',lat:37.0504,lng:140.8877},{name:'須賀川市',lat:37.2865,lng:140.3734},{name:'潮来市',lat:35.9344,lng:140.5453},{name:'久喜市',lat:36.0621,lng:139.6672},{name:'埼玉県',lat:35.8574,lng:139.6489},{name:'川口市',lat:35.8079,lng:139.7238},{name:'幸手市',lat:36.0747,lng:139.7247},{name:'越谷市',lat:35.8911,lng:139.7911},{name:'三鷹市',lat:35.6836,lng:139.5594},{name:'墨田区',lat:35.7129,lng:139.8015},{name:'江戸川区',lat:35.6783,lng:139.8711},{name:'足立区',lat:35.7750,lng:139.8044},{name:'厚木市',lat:35.4431,lng:139.3622},{name:'川崎市',lat:35.5302,lng:139.7029},{name:'海老名市',lat:35.4461,lng:139.3917},{name:'相模原市',lat:35.5714,lng:139.3736},{name:'神奈川県',lat:35.4478,lng:139.6425},{name:'茅ヶ崎市',lat:35.3323,lng:139.4061},{name:'静岡市',lat:34.9756,lng:138.3828},{name:'名古屋市',lat