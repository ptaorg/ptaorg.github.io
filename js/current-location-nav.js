/* Parent journey current-location navigation — 2026-08-21 v6 */
(function(){
  var path = location.pathname.replace(/\/+$/, '') || '/index.html';
  var pages = {
    '/guide-parent.html': {label:'保護者向け', current:'guide'},
    '/membership.html': {label:'加入手続き', current:'membership'},
    '/privacy.html': {label:'個人情報', current:'privacy'},
    '/fee-collection.html': {label:'会費徴収', current:'fee'}
  };
  var page = pages[path];
  if (!page) return;

  var items = [
    ['guide','保護者向け','/guide-parent.html'],
    ['membership','加入手続き','/membership.html'],
    ['privacy','個人情報','/privacy.html'],
    ['fee','会費徴収','/fee-collection.html'],
    ['withdrawal','退会・非加入','/guide-parent.html#parent-withdrawal']
  ];

  function navLinks(){
    var ul = document.createElement('ul');
    ul.className = 'current-location-list';
    items.forEach(function(item){
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = item[2];
      a.textContent = item[1];
      if (item[0] === page.current) {
        li.className = 'is-current';
        a.setAttribute('aria-current','page');
      }
      li.appendChild(a);
      ul.appendChild(li);
    });
    return ul;
  }

  function init(){
    if (document.querySelector('.current-location-sidebar')) return;
    document.body.classList.add('current-location-enabled');

    var withdrawal = document.querySelector('.howto-section');
    if (withdrawal && !withdrawal.id) withdrawal.id = 'parent-withdrawal';

    var aside = document.createElement('aside');
    aside.className = 'current-location-sidebar';
    aside.setAttribute('aria-label','保護者向け 現在地ナビ');
    var title = document.createElement('div');
    title.className = 'current-location-title';
    title.textContent = '保護者向け';
    aside.appendChild(title);
    aside.appendChild(navLinks());
    document.body.appendChild(aside);

    var host = document.querySelector('main') || document.querySelector('.page-main') || document.querySelector('.editorial-main') || document.querySelector('.container') || document.querySelector('.wrap-narrow');
    if (!host) return;

    var existingCrumb = document.querySelector('.breadcrumb, .breadcrumbs, nav[aria-label="パンくずリスト"], nav[aria-label="パンくず"]');
    var crumb = existingCrumb;
    if (!existingCrumb) {
      crumb = document.createElement('nav');
      crumb.className = 'current-location-breadcrumb';
      crumb.setAttribute('aria-label','パンくずリスト');
      var top = document.createElement('a');
      top.href = '/index.html';
      top.textContent = 'トップ';
      crumb.appendChild(top);
      crumb.appendChild(document.createTextNode(' › '));
      if (page.current === 'guide') {
        var here = document.createElement('span');
        here.textContent = '保護者向け';
        here.setAttribute('aria-current','page');
        crumb.appendChild(here);
      } else {
        var parent = document.createElement('a');
        parent.href = '/guide-parent.html';
        parent.textContent = '保護者向け';
        crumb.appendChild(parent);
        crumb.appendChild(document.createTextNode(' › '));
        var current = document.createElement('span');
        current.textContent = page.label;
        current.setAttribute('aria-current','page');
        crumb.appendChild(current);
      }
      host.insertBefore(crumb, host.firstChild);
    }

    var compact = document.createElement('details');
    compact.className = 'current-location-compact';
    var summary = document.createElement('summary');
    summary.innerHTML = '<span>現在地</span><strong>' + page.label + '</strong>';
    compact.appendChild(summary);
    compact.appendChild(navLinks());
    if (crumb && crumb.parentNode === host && crumb.nextSibling) host.insertBefore(compact, crumb.nextSibling);
    else host.insertBefore(compact, host.firstChild);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
