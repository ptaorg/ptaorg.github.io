/* Current-location navigation — 2026-08-21 v7 */
(function(){
  var path = location.pathname.replace(/\/+$/, '') || '/index.html';
  var pageMap = {
    '/guide-parent.html': {label:'保護者向け', current:'guide', mode:'parent'},
    '/membership.html': {label:'加入手続き', current:'membership', mode:'parent'},
    '/privacy.html': {label:'個人情報', current:'privacy', mode:'parent'},
    '/fee-collection.html': {label:'会費徴収', current:'fee', mode:'parent'},
    '/journal/pta-shokumu-sennen-gimu.html': {label:'地方公務員法35条とPTA事務', current:'law35', mode:'article35'}
  };
  var page = pageMap[path];
  if (!page) return;

  var parentItems = [
    ['guide','保護者向け','/guide-parent.html'],
    ['membership','加入手続き','/membership.html'],
    ['privacy','個人情報','/privacy.html'],
    ['fee','会費徴収','/fee-collection.html'],
    ['withdrawal','退会・非加入','/guide-parent.html#parent-withdrawal']
  ];
  var articleItems = [
    ['law35','地方公務員法35条','#law35'],
    ['mext2006','文科省「教員の職務」','#mext2006'],
    ['jichisho1964','旧自治省 照会・回答','#jichisho1964'],
    ['jichiro2012','2012年交渉記録','#jichiro2012'],
    ['shiga2026','滋賀県監査の検証','#shiga2026'],
    ['faq','FAQ','#faq']
  ];
  var items = page.mode === 'article35' ? articleItems : parentItems;

  function navLinks(){
    var ul = document.createElement('ul');
    ul.className = 'current-location-list';
    items.forEach(function(item){
      var li = document.createElement('li');
      li.dataset.navKey = item[0];
      var a = document.createElement('a');
      a.href = item[2];
      a.textContent = item[1];
      if (page.mode !== 'article35' && item[0] === page.current) {
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
      if (a) {
        if (on) a.setAttribute('aria-current','location');
        else a.removeAttribute('aria-current');
      }
    });
  }

  function init(){
    if (document.querySelector('.current-location-sidebar')) return;
    document.body.classList.add('current-location-enabled');

    var aside = document.createElement('aside');
    aside.className = 'current-location-sidebar';
    aside.setAttribute('aria-label', page.mode === 'article35' ? 'この論考の現在地' : '保護者向け 現在地ナビ');
    var title = document.createElement('div');
    title.className = 'current-location-title';
    title.textContent = page.mode === 'article35' ? 'この論考の現在地' : '保護者向け';
    aside.appendChild(title);
    aside.appendChild(navLinks());
    document.body.appendChild(aside);

    var host = document.querySelector('main') || document.querySelector('.page-main') || document.querySelector('.editorial-main') || document.querySelector('.container') || document.querySelector('.wrap-narrow');
    if (host) {
      var compact = document.createElement('details');
      compact.className = 'current-location-compact';
      var summary = document.createElement('summary');
      summary.innerHTML = '<span>現在地</span><strong>' + page.label + '</strong>';
      compact.appendChild(summary);
      compact.appendChild(navLinks());
      host.insertBefore(compact, host.firstChild);
    }

    if (page.mode === 'article35') {
      var sections = articleItems.map(function(item){ return document.getElementById(item[0]); }).filter(Boolean);
      if (sections.length) {
        setArticleCurrent(sections[0].id);
        var observer = new IntersectionObserver(function(entries){
          var visible = entries.filter(function(e){ return e.isIntersecting; }).sort(function(a,b){ return a.boundingClientRect.top - b.boundingClientRect.top; });
          if (visible[0]) setArticleCurrent(visible[0].target.id);
        }, {rootMargin:'-20% 0px -65% 0px', threshold:[0,0.01]});
        sections.forEach(function(section){ observer.observe(section); });
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
