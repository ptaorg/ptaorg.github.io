/* Current-location navigation — 2026-08-21 v8 */
(function(){
  var path = location.pathname.replace(/\/+$/, '') || '/index.html';
  if (path === '/index.html' || path === '/') return;

  function pageLabel(){
    var h1 = document.querySelector('main h1, h1');
    var s = h1 ? (h1.textContent || '') : (document.title || '').split(/[|｜]/)[0];
    s = s.replace(/\s+/g,' ').trim();
    return s.length > 28 ? s.slice(0,28) + '…' : s;
  }

  var GROUPS = {
    parent: {title:'保護者向け', items:[
      ['guide','保護者向け','/guide-parent.html'],
      ['membership','加入手続き','/membership.html'],
      ['privacy','個人情報','/privacy.html'],
      ['fee','会費徴収','/fee-collection.html'],
      ['withdrawal','退会・非加入','/guide-parent.html#parent-withdrawal']
    ]},
    ppc: {title:'個人情報・PPC', items:[
      ['ppc','PPC資料','/ppc-points.html'],
      ['privacy','個人情報','/privacy.html'],
      ['membership','加入手続き','/membership.html'],
      ['fee','会費徴収','/fee-collection.html'],
      ['law','法制度マップ','/law-map.html']
    ]},
    law: {title:'論点別', items:[
      ['law','法制度マップ','/law-map.html'],
      ['membership','加入手続き','/membership.html'],
      ['privacy','個人情報','/privacy.html'],
      ['fee','会費徴収','/fee-collection.html'],
      ['personnel','教職員関与','/personnel.html'],
      ['facilities','施設利用','/facilities.html'],
      ['boardresp','教育委員会の所掌','/education-board-responsibility.html']
    ]},
    docs: {title:'根拠資料', items:[
      ['documents','資料入口','/documents.html'],
      ['board','教育委員会回答','/board-responses.html'],
      ['archive','全国資料館','/national-archive.html'],
      ['admin','行政通知・公式PDF','/administrative-materials.html'],
      ['journal','論考・調査報告','/journal.html']
    ]},
    audience: {title:'立場別', items:[
      ['parent','保護者','/guide-parent.html'],
      ['pta','PTA役員','/guide-pta.html'],
      ['board','教育委員会・学校','/guide-board.html'],
      ['research','研究者・記者','/guide-research.html']
    ]},
    journal: {title:'論考・調査', items:[
      ['journal','論考一覧','/journal.html'],
      ['report','総合分析','/report.html'],
      ['personnel','教職員関与','/personnel.html'],
      ['fee','会費徴収','/fee-collection.html'],
      ['privacy','個人情報','/privacy.html']
    ]},
    generic: {title:'サイト内の現在地', items:[
      ['optin','オプトイン','/pta-membership-optin.html'],
      ['ppc','PPC資料','/ppc-points.html'],
      ['board','教育委員会回答','/board-responses.html'],
      ['law','論点別','/law-map.html'],
      ['docs','根拠資料','/documents.html'],
      ['audience','立場別','/guide-parent.html'],
      ['journal','論考・調査','/journal.html']
    ]}
  };

  var article35Items = [
    ['law35','地方公務員法35条','#law35'],
    ['mext2006','文科省「教員の職務」','#mext2006'],
    ['jichisho1964','旧自治省 照会・回答','#jichisho1964'],
    ['jichiro2012','2012年交渉記録','#jichiro2012'],
    ['shiga2026','滋賀県監査の検証','#shiga2026'],
    ['faq','FAQ','#faq']
  ];

  function chooseGroup(){
    if (path === '/journal/pta-shokumu-sennen-gimu.html') return {mode:'article35', title:'この論考の現在地', items:article35Items};
    if (path === '/ppc-points.html') return {mode:'normal', key:'ppc', data:GROUPS.ppc};
    if (['/guide-parent.html','/membership.html','/privacy.html','/fee-collection.html'].indexOf(path) >= 0) return {mode:'normal', key:path.indexOf('guide-parent')>=0?'guide':path.indexOf('membership')>=0?'membership':path.indexOf('privacy')>=0?'privacy':'fee', data:GROUPS.parent};
    if (['/law-map.html','/personnel.html','/facilities.html','/education-board-responsibility.html','/cases.html','/timeline.html'].indexOf(path) >= 0) {
      var k = path.indexOf('personnel')>=0?'personnel':path.indexOf('facilities')>=0?'facilities':path.indexOf('education-board')>=0?'boardresp':'law';
      return {mode:'normal', key:k, data:GROUPS.law};
    }
    if (['/documents.html','/board-responses.html','/national-archive.html','/administrative-materials.html','/claim-evidence-ledger.html'].indexOf(path) >= 0) {
      var kd = path.indexOf('board-responses')>=0?'board':path.indexOf('national-archive')>=0?'archive':path.indexOf('administrative-materials')>=0?'admin':'documents';
      return {mode:'normal', key:kd, data:GROUPS.docs};
    }
    if (['/guide-pta.html','/guide-board.html','/guide-research.html'].indexOf(path) >= 0) {
      var ka = path.indexOf('guide-pta')>=0?'pta':path.indexOf('guide-board')>=0?'board':'research';
      return {mode:'normal', key:ka, data:GROUPS.audience};
    }
    if (path === '/journal.html' || path === '/report.html' || path.indexOf('/journal/') === 0) {
      return {mode:'normal', key:path === '/journal.html'?'journal':path === '/report.html'?'report':'current', data:GROUPS.journal};
    }
    return {mode:'normal', key:'current', data:GROUPS.generic};
  }

  var group = chooseGroup();
  var items = group.mode === 'article35' ? group.items.slice() : group.data.items.slice();
  var title = group.mode === 'article35' ? group.title : group.data.title;
  var currentKey = group.mode === 'article35' ? null : group.key;
  var label = pageLabel();

  if (group.mode !== 'article35') {
    var exact = items.some(function(i){ return i[2].split('#')[0] === path; });
    if (!exact && label) items.push(['current', label, path]);
  }

  var style = document.createElement('style');
  style.id = 'current-location-nav-v8-style';
  style.textContent =
    '.loc-trail,.breadcrumb-bar,.breadcrumb,.breadcrumbs{font-size:clamp(1.8rem,2.45vw,2.45rem)!important;line-height:1.35!important}' +
    '.loc-trail-inner{padding:18px 28px!important;gap:12px!important}' +
    '.loc-trail .loc-current{max-width:none!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;font-weight:800!important}' +
    '.loc-trail a{font-weight:800!important}' +
    '.current-location-sidebar{display:none;position:fixed;z-index:900;top:118px;width:178px;padding:14px 10px 12px;background:#fff;border-top:4px solid #173b67;border-right:1px solid #d5dde7;border-bottom:1px solid #d5dde7;box-shadow:0 8px 26px rgba(23,45,70,.13);font-family:"Noto Sans JP",sans-serif}' +
    '.current-location-title{padding:2px 8px 10px;margin-bottom:4px;border-bottom:1px solid #dce3ea;color:#173b67;font-size:.9rem;font-weight:900;line-height:1.4}' +
    '.current-location-list{list-style:none;margin:0;padding:0}' +
    '.current-location-list li{margin:0;padding:0}' +
    '.current-location-list a{display:block;position:relative;padding:9px 6px 9px 21px;color:#4b5565;text-decoration:none;font-size:.82rem;line-height:1.45;border-left:3px solid transparent}' +
    '.current-location-list a:before{content:"—";position:absolute;left:5px;color:#9aa5b3}' +
    '.current-location-list .is-current a{color:#102d4d;font-weight:900;background:#eef4f9;border-left-color:#173b67}' +
    '.current-location-list .is-current a:before{content:"▶";color:#173b67;font-size:.7rem;top:11px}' +
    '.current-location-compact{display:block;margin:12px 16px 18px;font-family:"Noto Sans JP",sans-serif}' +
    '.current-location-compact summary{display:flex;gap:10px;align-items:center;padding:12px 14px;border:1px solid #d6dee7;background:#fff;cursor:pointer}' +
    '.current-location-compact summary span{font-size:.8rem;color:#687385;font-weight:800}' +
    '.current-location-compact summary strong{font-size:1rem;color:#173b67}' +
    '.current-location-compact .current-location-list{border:1px solid #d6dee7;border-top:0;background:#fff;padding:6px}' +
    '@media(min-width:1100px){.current-location-sidebar{display:block;left:max(10px,calc(50vw - 680px))}.current-location-compact{display:none!important}}' +
    '@media(max-width:1099px){.current-location-sidebar{display:none!important}.loc-trail,.breadcrumb-bar,.breadcrumb,.breadcrumbs{font-size:clamp(1.3rem,4vw,1.9rem)!important}.loc-trail-inner{padding:14px 16px!important}}';
  document.head.appendChild(style);

  function navLinks(){
    var ul = document.createElement('ul');
    ul.className = 'current-location-list';
    items.forEach(function(item){
      var li = document.createElement('li');
      li.dataset.navKey = item[0];
      var a = document.createElement('a');
      a.href = item[2];
      a.textContent = item[1];
      if (group.mode !== 'article35' && (item[0] === currentKey || item[2].split('#')[0] === path)) {
        li.className = 'is-current';
        a.setAttribute('aria-current','page');
      }
      li.appendChild(a);
      ul.appendChild(li);
    });
    return ul;
  }

  function setArticleCurrent(key){
    document.querySelectorAll('.current-location-list li').forEach(function(li){
      var on = li.dataset.navKey === key;
      li.classList.toggle('is-current', on);
      var a = li.querySelector('a');
      if (a) { if (on) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); }
    });
  }

  function init(){
    if (document.querySelector('.current-location-sidebar')) return;
    var aside = document.createElement('aside');
    aside.className = 'current-location-sidebar';
    aside.setAttribute('aria-label','現在地ナビ');
    var t = document.createElement('div');
    t.className = 'current-location-title';
    t.textContent = title;
    aside.appendChild(t);
    aside.appendChild(navLinks());
    document.body.appendChild(aside);

    var host = document.querySelector('main') || document.querySelector('.page-main') || document.querySelector('.editorial-main') || document.querySelector('.container') || document.querySelector('.wrap-narrow');
    if (host) {
      var compact = document.createElement('details');
      compact.className = 'current-location-compact';
      var s = document.createElement('summary');
      s.innerHTML = '<span>現在地</span><strong>' + (label || title) + '</strong>';
      compact.appendChild(s);
      compact.appendChild(navLinks());
      host.insertBefore(compact, host.firstChild);
    }

    if (group.mode === 'article35') {
      var sections = article35Items.map(function(i){ return document.getElementById(i[0]); }).filter(Boolean);
      if (sections.length) {
        setArticleCurrent(sections[0].id);
        var observer = new IntersectionObserver(function(entries){
          var visible = entries.filter(function(e){return e.isIntersecting;}).sort(function(a,b){return a.boundingClientRect.top-b.boundingClientRect.top;});
          if (visible[0]) setArticleCurrent(visible[0].target.id);
        },{rootMargin:'-20% 0px -65% 0px',threshold:[0,0.01]});
        sections.forEach(function(sec){observer.observe(sec);});
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
