/* site.js loader — 2026-08-21 v92 */
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
      '@media(max-width:760px){.core-essay-entrance{margin:48px 16px;padding:28px 18px 26px}.core-essay-entrance .core-thesis{padding-left:15px}.core-history-nav{font-weight:800!important}}';
    document.head.appendChild(style);
  }

  function addGlobalNav(){
    document.querySelectorAll('.desktop-nav').forEach(function(nav){
      if (nav.querySelector('[data-core-history-nav]')) return;
      var a = document.createElement('a');
      a.className = 'nav-link core-history-nav';
      a.href = '/pta-history.html';
      a.textContent = 'PTAの成り立ち';
      a.setAttribute('data-core-history-nav','');
      var ppc = nav.querySelector('a[href="/ppc-points.html"]');
      if (ppc && ppc.parentNode === nav) ppc.insertAdjacentElement('afterend', a);
      else nav.insertBefore(a, nav.firstChild);
    });

    document.querySelectorAll('.mobile-menu-group').forEach(function(group){
      var label = group.querySelector('.mobile-menu-label');
      if (!label || label.textContent.trim() !== '最重要' || group.querySelector('[data-core-history-mobile]')) return;
      var a = document.createElement('a');
      a.className = 'mobile-link';
      a.href = '/pta-history.html';
      a.textContent = 'PTAの成立とこれから';
      a.setAttribute('data-core-history-mobile','');
      var ppc = group.querySelector('a[href="/ppc-points.html"]');
      if (ppc) ppc.insertAdjacentElement('afterend', a);
      else group.appendChild(a);
    });
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

  function installCoreEssayEntrances(){
    addCoreEssayStyles();
    addGlobalNav();
    var path = (window.location.pathname || '').replace(/\/+$/,'');
    if (document.body.classList.contains('home-page') || path === '' || path === '/index.html') injectHome();
    if (document.body.classList.contains('journal-page') || path === '/journal.html') injectJournal();
  }

  load('/js/site-core-v90.js?v=92', 'site-core-v90', function(){
    load('/js/current-location-nav.js?v=20260821-9', 'current-location-nav', installCoreEssayEntrances);
  });
})();
