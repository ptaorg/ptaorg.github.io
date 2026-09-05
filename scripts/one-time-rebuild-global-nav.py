from pathlib import Path
import re

site_path = Path('js/site.js')
text = site_path.read_text(encoding='utf-8')

new_func = r'''  function addGlobalNav(){
    var path = (window.location.pathname || '/').replace(/\/+$/,'') || '/';

    function esc(s){
      return String(s).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});
    }
    function makeLink(href,label,cls){
      return '<a class="nav-link' + (cls ? ' ' + cls : '') + '" href="' + href + '">' + esc(label) + '</a>';
    }
    function makeMenu(label,href,key,leftTitle,leftLinks,rightTitle,rightLinks){
      function col(title, links){
        return '<div class="mega-col"><h4>' + esc(title) + '</h4><ul>' + links.map(function(x){
          return '<li><a href="' + x[0] + '">' + esc(x[1]) + '</a></li>';
        }).join('') + '</ul></div>';
      }
      return '<div class="nav-item has-dropdown" data-global-nav-group="' + key + '">' +
        '<a class="nav-link" href="' + href + '" aria-haspopup="true" aria-expanded="false">' + esc(label) + '</a>' +
        '<div class="mega-menu">' + col(leftTitle,leftLinks) + col(rightTitle,rightLinks) + '</div></div>';
    }

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

    var desktopHtml =
      makeLink('/index.html','トップ') +
      makeLink('/pta-membership-optin.html','任意加入','global-membership-nav') +
      makeMenu('学校とPTA','/framework.html','school','境界と事務',schoolLinks.slice(0,3),'人・場所・法',schoolLinks.slice(3)) +
      makeMenu('全国調査','/pta-school-processing.html','research','全国比較',researchLinks.slice(0,2),'資料',researchLinks.slice(2)) +
      makeLink('/board-responses.html','教育委員会回答','global-board-nav') +
      makeMenu('論考・資料','/journal.html','reading','主要論考',readingLinks.slice(0,3),'資料・文例',readingLinks.slice(3)) +
      makeLink('/submit-to-board.html','教育委員会へ提出','board-submit-nav global-submit-nav');

    function hrefPath(a){
      try { return new URL(a.href, location.href).pathname.replace(/\/+$/,'') || '/'; }
      catch(e){ return ''; }
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
      var groups = [
        ['school',schoolLinks],['research',researchLinks],['reading',readingLinks]
      ];
      groups.forEach(function(g){
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

    if (!document.getElementById('global-nav-rebuild-style-v101')) {
      var style = document.createElement('style');
      style.id = 'global-nav-rebuild-style-v101';
      style.textContent =
        '.global-nav-v101{gap:.28rem!important}' +
        '.global-nav-v101>.nav-link,.global-nav-v101>.nav-item>.nav-link{font-size:.84rem!important;padding:8px 8px!important;white-space:nowrap}' +
        '.global-nav-v101 .mega-menu{width:min(520px,calc(100vw - 32px));padding:18px;gap:16px}' +
        '.global-nav-v101 .mega-col h4{font-size:.78rem}' +
        '.global-nav-v101 .mega-col a{font-size:.84rem;padding:6px 0}' +
        '.global-nav-v101 .board-submit-nav{font-weight:900!important;color:#5f4707!important;background:#fff8df!important;border:1px solid #d7b95a!important;border-radius:6px!important;padding:8px 11px!important}' +
        '.global-nav-v101 .board-submit-nav:hover{background:#fff1bd!important;color:#4f3b08!important}' +
        '.global-nav-v101 .is-here,.global-nav-v101 .is-here-parent{color:#c89b18!important;font-weight:900!important}' +
        '.essay-nav.global-nav-v101{width:auto!important;overflow:visible!important;flex-wrap:nowrap!important}' +
        '@media(max-width:1180px){.global-nav-v101>.nav-link,.global-nav-v101>.nav-item>.nav-link{font-size:.78rem!important;padding-inline:6px!important}.global-nav-v101{gap:.12rem!important}}';
      document.head.appendChild(style);
    }

    document.querySelectorAll('.desktop-nav, .essay-nav').forEach(function(nav){
      nav.classList.add('desktop-nav','global-nav-v101');
      nav.innerHTML = desktopHtml;
      markCurrent(nav);
      installMenuBehavior(nav);
    });

    function mobileGroup(label,links){
      return '<div class="mobile-menu-group" data-global-mobile-group><div class="mobile-menu-label">' + esc(label) + '</div>' +
        links.map(function(x){
          var current = x[0] === path || (x[0] === '/pta-membership-optin.html' && membershipPaths.indexOf(path) !== -1);
          var cls = 'mobile-link' + (x[2] ? ' ' + x[2] : '') + (current ? ' is-here' : '');
          return '<a class="' + cls + '" href="' + x[0] + '"' + (current ? ' aria-current="page"' : '') + '>' + esc(x[1]) + '</a>';
        }).join('') + '</div>';
    }

    document.querySelectorAll('.mobile-overlay').forEach(function(overlay){
      overlay.querySelectorAll('.mobile-menu-group').forEach(function(g){g.remove();});
      overlay.insertAdjacentHTML('beforeend',
        mobileGroup('主要',[
          ['/index.html','トップ'],
          ['/pta-membership-optin.html','任意加入'],
          ['/board-responses.html','教育委員会回答'],
          ['/submit-to-board.html','教育委員会へ提出','board-submit-nav-mobile']
        ]) +
        mobileGroup('学校とPTA',schoolLinks) +
        mobileGroup('全国調査',researchLinks) +
        mobileGroup('論考・資料',readingLinks)
      );
    });
  }'''

pattern = re.compile(r"  function addGlobalNav\(\)\{.*?\n  \}\n\n  function installMobileSearch\(\)\{", re.S)
match = pattern.search(text)
if not match:
    raise SystemExit('addGlobalNav function not found')
text = pattern.sub(new_func + "\n\n  function installMobileSearch(){", text, count=1)
text = re.sub(r'/\* site\.js loader — .*? \*/', '/* site.js loader — 2026-09-06 v101 */', text, count=1)
site_path.write_text(text, encoding='utf-8')

# Bump cache references on public HTML to the repository's next shared version.
site_ref = re.compile(r'/js/site\.js\?v=[A-Za-z0-9._-]+')
changed = 0
skip_dirs = {'.git','node_modules','_site','assets','css','data','js','scripts','tools','ホーム'}
for p in Path('.').rglob('*.html'):
    if any(part in skip_dirs for part in p.parts):
        continue
    s = p.read_text(encoding='utf-8')
    n = site_ref.sub('/js/site.js?v=94', s)
    if n != s:
        p.write_text(n, encoding='utf-8')
        changed += 1

# Keep generated-page template and maintenance checks aligned.
gen = Path('scripts/generate-school-pages.js')
if gen.exists():
    s = gen.read_text(encoding='utf-8')
    gen.write_text(site_ref.sub('/js/site.js?v=94', s), encoding='utf-8')

pkg = Path('package.json')
if pkg.exists():
    s = pkg.read_text(encoding='utf-8')
    s = s.replace('check-site-js-version.js 93', 'check-site-js-version.js 94')
    s = s.replace('bump-site-js-version.js 93 --dry-run', 'bump-site-js-version.js 94 --dry-run')
    s = s.replace('maintenance:bump-site-js -- 93', 'maintenance:bump-site-js -- 94')
    pkg.write_text(s, encoding='utf-8')

structure = Path('SITE_STRUCTURE.md')
if structure.exists():
    s = structure.read_text(encoding='utf-8')
    s = re.sub(r'グローバルナビゲーションは.*?です。デスクトップ・モバイルともHTMLへ静的に出力し、`js/site\.js` では開閉だけを扱います。',
               'グローバルナビゲーションは `トップ / 任意加入 / 学校とPTA / 全国調査 / 教育委員会回答 / 論考・資料 / 教育委員会へ提出` を基本系統とします。デスクトップは主要3系統をドロップダウン化し、モバイルは同じ情報構造をグループ表示します。`js/site.js` が共通ナビを同期します。', s)
    structure.write_text(s, encoding='utf-8')

print('updated HTML refs:', changed)
