/* SEO + measurement refinements — 2026-09-06 v104 */
(function(){
  'use strict';

  var path = (window.location.pathname || '/').replace(/\/+$/,'') || '/';

  var seo = {
    '/guideline.html': {
      title: 'PTAガイドライン｜文部科学省・PPC等の公的資料から適正運営を整理｜PTA適正化推進委員会',
      description: '文部科学省・個人情報保護委員会等の公的資料を基に、PTAの任意加入、個人情報、会費徴収、学校・教職員との関係を確認するための運営ガイドラインです。'
    },
    '/fee-collection.html': {
      title: 'PTA会費を学校が徴収してよい？｜学校徴収金・口座振替・未納管理を確認｜PTA適正化推進委員会',
      description: 'PTA会費を学校徴収金と一括で引き落とす場合の確認事項を整理。加入意思、請求主体、口座情報の利用、未納・返金、学校とPTAの会計分離を確認します。'
    },
    '/guide-board.html': {
      title: '教育委員会・学校のPTA対応ガイド｜任意加入・個人情報・会費徴収・教職員関与｜PTA適正化推進委員会',
      description: '教育委員会・学校管理職向けに、PTAの任意加入、学校保有個人情報、会費徴収、教職員の服務、学校施設利用を一次資料と確認手順から整理します。'
    },
    '/facilities.html': {
      title: 'PTAの学校施設利用はどこまで可能？｜学校教育法137条・目的外使用・使用許可｜PTA適正化推進委員会',
      description: 'PTA室、印刷機、学校配布、連絡ツール等の利用を、学校教育法137条、目的外使用、使用許可、学校教育上の支障、公私分離の観点から確認します。'
    },
    '/about.html': {
      title: 'PTA適正化推進委員会とは｜運営主体・活動内容・一次資料の確認方法',
      description: 'PTA適正化推進委員会の運営主体、活動目的、調査方法、教育委員会回答・公文書開示資料などの一次資料と当委員会の分析をどう区別して公開しているかを案内します。'
    }
  };

  function ensureMeta(selector, attr, value){
    var el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      var pair = selector.match(/^meta\[([^=]+)="([^"]+)"\]$/);
      if (pair) el.setAttribute(pair[1], pair[2]);
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  }

  function applySeoMeta(){
    var item = seo[path];
    if (!item) return;
    document.title = item.title;
    ensureMeta('meta[name="description"]', 'content', item.description);
    ensureMeta('meta[property="og:title"]', 'content', item.title);
    ensureMeta('meta[property="og:description"]', 'content', item.description);
    ensureMeta('meta[name="twitter:title"]', 'content', item.title);
    ensureMeta('meta[name="twitter:description"]', 'content', item.description);
  }

  function addOrganizationSchema(){
    if (document.getElementById('popc-org-schema-v104')) return;
    var s = document.createElement('script');
    s.id = 'popc-org-schema-v104';
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://ptaorg.com/#organization',
      name: 'PTA適正化推進委員会',
      url: 'https://ptaorg.com/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://ptaorg.com/assets/popc-logo.png'
      }
    });
    document.head.appendChild(s);
  }

  function addUtilityStyle(){
    if (document.getElementById('seo-context-v104-style')) return;
    var st = document.createElement('style');
    st.id = 'seo-context-v104-style';
    st.textContent =
      '.seo-context-v104{max-width:980px;margin:22px auto 30px;padding:15px 18px;border-left:4px solid #0b3357;background:#f6f8fa;color:#1c2730;line-height:1.8}' +
      '.seo-context-v104 strong{font-weight:900}.seo-context-v104 a{font-weight:800;text-underline-offset:3px}' +
      '.seo-context-v104 p{margin:0}.seo-context-v104 p+p{margin-top:7px}' +
      '@media(max-width:760px){.seo-context-v104{margin:18px 16px 24px;padding:13px 14px}}';
    document.head.appendChild(st);
  }

  function insertAfterHero(html, id){
    if (document.getElementById(id)) return;
    var hero = document.querySelector('main .page-hero, .page-hero');
    if (!hero) return;
    var box = document.createElement('aside');
    box.id = id;
    box.className = 'seo-context-v104';
    box.innerHTML = html;
    hero.insertAdjacentElement('afterend', box);
  }

  function addPpcContextLinks(){
    if (path === '/privacy.html') {
      insertAfterHero(
        '<p><strong>個人情報保護委員会（PPC）の令和8年3月資料を確認する：</strong> <a href="/ppc-points.html">第61条・第69条の要点を読む</a> ／ <a href="/ppc-school-pta-personal-data.html">全17ページの詳細解説を読む</a></p>',
        'privacy-ppc-context-v104'
      );
    }
    if (path === '/' || path === '/index.html') {
      if (document.getElementById('home-ppc-context-v104')) return;
      var h = Array.prototype.slice.call(document.querySelectorAll('h2')).find(function(el){
        return (el.textContent || '').indexOf('このサイトが扱う問題') !== -1;
      });
      if (!h) return;
      var box = document.createElement('aside');
      box.id = 'home-ppc-context-v104';
      box.className = 'seo-context-v104';
      box.innerHTML = '<p><strong>学校とPTAの個人情報：</strong> 個人情報保護委員会の2026年3月資料について、<a href="/ppc-points.html">法第61条・第69条から読む要点解説</a>と<a href="/ppc-school-pta-personal-data.html">全17ページ詳細解説</a>を公開しています。</p>';
      var section = h.closest('section') || h.parentElement;
      if (section) section.insertAdjacentElement('afterend', box);
    }
  }

  function addAboutTrustNote(){
    if (path !== '/about.html') return;
    insertAfterHero(
      '<p><strong>資料の読み方：</strong> 当委員会は、法令・行政機関の公表資料・教育委員会回答・公文書開示資料と、当委員会による分析・評価を区別して公開します。</p>' +
      '<p><a href="/board-responses.html">教育委員会の原回答を確認</a> ／ <a href="/national-archive.html">開示資料・実物資料を確認</a> ／ <a href="/evidence-checklist.html">資料検証の基準を確認</a></p>',
      'about-trust-context-v104'
    );
  }

  function fire(name, params){
    if (typeof window.gtag !== 'function') return;
    try { window.gtag('event', name, params || {}); } catch (e) {}
  }

  function fileNameFromUrl(url){
    try {
      var u = new URL(url, window.location.href);
      return decodeURIComponent((u.pathname.split('/').pop() || '').slice(0,160));
    } catch (e) { return ''; }
  }

  function installActionMeasurement(){
    if (window.__popcActionMeasurementV104) return;
    window.__popcActionMeasurementV104 = true;
    document.addEventListener('click', function(ev){
      var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
      if (!a) return;
      var raw = a.getAttribute('href') || '';
      if (!raw || raw.charAt(0) === '#') return;
      var absolute;
      try { absolute = new URL(raw, window.location.href); } catch (e) { return; }
      var common = {
        link_url: absolute.href.slice(0,500),
        link_text: (a.textContent || '').trim().replace(/\s+/g,' ').slice(0,160),
        page_path: window.location.pathname
      };

      if (a.hasAttribute('download') || /\.(pdf|docx?|xlsx?|csv|zip)(?:$|[?#])/i.test(absolute.href)) {
        common.file_name = fileNameFromUrl(absolute.href);
        fire('resource_download', common);
      }

      if (absolute.protocol === 'mailto:' || absolute.protocol === 'tel:' || absolute.pathname === '/contact.html') {
        fire('contact_action', common);
      }

      if (absolute.origin === window.location.origin && absolute.pathname === '/support.html') {
        fire('support_visit', common);
      }

      if (absolute.origin === window.location.origin && (/^\/forms\//.test(absolute.pathname) || /^\/starter-kit\//.test(absolute.pathname))) {
        fire('action_kit_click', common);
      }

      if (absolute.origin === window.location.origin && (absolute.pathname === '/ppc-points.html' || absolute.pathname === '/ppc-school-pta-personal-data.html')) {
        fire('ppc_reference_click', common);
      }

      if (absolute.origin !== window.location.origin && /(^|\.)(go\.jp|lg\.jp|e-gov\.go\.jp)$/i.test(absolute.hostname)) {
        fire('primary_source_click', common);
      }
    }, true);
  }

  function init(){
    applySeoMeta();
    addOrganizationSchema();
    addUtilityStyle();
    addPpcContextLinks();
    addAboutTrustNote();
    installActionMeasurement();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
