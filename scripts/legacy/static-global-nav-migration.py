from pathlib import Path
import re

ROOT = Path('.')
SITE_JS_VERSION = '95'
GLOBAL_NAV_VERSION = '20260906-1'

DESKTOP_NAV = '''<nav aria-label="主要ナビゲーション" class="desktop-nav global-nav-v102">
<a class="nav-link" href="/index.html">トップ</a>
<a class="nav-link global-membership-nav" href="/pta-membership-optin.html">任意加入</a>
<div class="nav-item has-dropdown" data-global-nav-group="school"><a class="nav-link" href="/framework.html" aria-haspopup="true" aria-expanded="false">学校とPTA</a><div class="mega-menu" aria-label="学校とPTAメニュー"><div class="mega-col"><h4>境界と事務</h4><ul><li><a href="/framework.html">学校とPTAの境界</a></li><li><a href="/fee-collection.html">会費・学校徴収</a></li><li><a href="/privacy.html">個人情報</a></li></ul></div><div class="mega-col"><h4>人・場所・法</h4><ul><li><a href="/personnel.html">教職員のPTA事務</a></li><li><a href="/facilities.html">学校施設・媒体</a></li><li><a href="/law-map.html">法制度マップ</a></li></ul></div></div></div>
<div class="nav-item has-dropdown" data-global-nav-group="research"><a class="nav-link" href="/pta-school-processing.html" aria-haspopup="true" aria-expanded="false">全国調査</a><div class="mega-menu" aria-label="全国調査メニュー"><div class="mega-col"><h4>全国比較</h4><ul><li><a href="/pta-school-processing.html">学校処理の全国法的整合性調査</a></li><li><a href="/cases.html">自治体別事例</a></li></ul></div><div class="mega-col"><h4>資料</h4><ul><li><a href="/national-archive.html">全国資料館</a></li><li><a href="/report.html">調査報告</a></li></ul></div></div></div>
<a class="nav-link global-board-nav" href="/board-responses.html">教育委員会回答</a>
<div class="nav-item has-dropdown" data-global-nav-group="reading"><a class="nav-link" href="/journal.html" aria-haspopup="true" aria-expanded="false">論考・資料</a><div class="mega-menu" aria-label="論考・資料メニュー"><div class="mega-col"><h4>主要論考</h4><ul><li><a href="/ppc-points.html">PPC資料</a></li><li><a href="/pta-history.html">PTAの成り立ち</a></li><li><a href="/pta-future.html">PTAのこれから</a></li></ul></div><div class="mega-col"><h4>資料・文例</h4><ul><li><a href="/journal.html">論考・調査報告</a></li><li><a href="/key-materials.html">根拠法令・一次資料</a></li><li><a href="/documents.html">文例・提出資料</a></li></ul></div></div></div>
<a class="nav-link board-submit-nav global-submit-nav" href="/submit-to-board.html">教育委員会へ提出</a>
</nav>'''

HEADER = '''<header class="site-header"><div class="nav-container"><a class="logo" href="/index.html"><img alt="PTA適正化推進委員会" src="/assets/popc-logo.png"><span>PTA適正化推進委員会</span></a><div class="header-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg><input aria-label="サイト内検索" class="search-input" placeholder="キーワードで検索…" type="search"><div class="search-results-dropdown"></div></div>''' + DESKTOP_NAV + '''<button class="hamburger" id="hamburger" aria-controls="mobileOverlay" aria-expanded="false" aria-label="メニューを開く"><span></span><span></span><span></span></button></div></header>'''

MOBILE = '''<div class="mobile-overlay" id="mobileOverlay">
<div class="mobile-menu-group" data-global-mobile-group><div class="mobile-menu-label">主要</div><a class="mobile-link" href="/index.html">トップ</a><a class="mobile-link global-membership-nav" href="/pta-membership-optin.html">任意加入</a><a class="mobile-link global-board-nav" href="/board-responses.html">教育委員会回答</a><a class="mobile-link board-submit-nav-mobile" href="/submit-to-board.html">教育委員会へ提出</a></div>
<div class="mobile-menu-group" data-global-mobile-group><div class="mobile-menu-label">学校とPTA</div><a class="mobile-link" href="/framework.html">学校とPTAの境界</a><a class="mobile-link" href="/fee-collection.html">会費・学校徴収</a><a class="mobile-link" href="/privacy.html">個人情報</a><a class="mobile-link" href="/personnel.html">教職員のPTA事務</a><a class="mobile-link" href="/facilities.html">学校施設・媒体</a><a class="mobile-link" href="/law-map.html">法制度マップ</a></div>
<div class="mobile-menu-group" data-global-mobile-group><div class="mobile-menu-label">全国調査</div><a class="mobile-link" href="/pta-school-processing.html">学校処理の全国法的整合性調査</a><a class="mobile-link" href="/cases.html">自治体別事例</a><a class="mobile-link" href="/national-archive.html">全国資料館</a><a class="mobile-link" href="/report.html">調査報告</a></div>
<div class="mobile-menu-group" data-global-mobile-group><div class="mobile-menu-label">論考・資料</div><a class="mobile-link" href="/ppc-points.html">PPC資料</a><a class="mobile-link" href="/pta-history.html">PTAの成り立ち</a><a class="mobile-link" href="/pta-future.html">PTAのこれから</a><a class="mobile-link" href="/journal.html">論考・調査報告</a><a class="mobile-link" href="/key-materials.html">根拠法令・一次資料</a><a class="mobile-link" href="/documents.html">文例・提出資料</a></div>
</div>'''

SCHOOL_LINKS = [
    ['/framework.html','学校とPTAの境界'],
    ['/fee-collection.html','会費・学校徴収'],
    ['/privacy.html','個人情報'],
    ['/personnel.html','教職員のPTA事務'],
    ['/facilities.html','学校施設・媒体'],
    ['/law-map.html','法制度マップ'],
]
RESEARCH_LINKS = [
    ['/pta-school-processing.html','学校処理の全国法的整合性調査'],
    ['/cases.html','自治体別事例'],
    ['/national-archive.html','全国資料館'],
    ['/report.html','調査報告'],
]
READING_LINKS = [
    ['/ppc-points.html','PPC資料'],
    ['/pta-history.html','PTAの成り立ち'],
    ['/pta-future.html','PTAのこれから'],
    ['/journal.html','論考・調査報告'],
    ['/key-materials.html','根拠法令・一次資料'],
    ['/documents.html','文例・提出資料'],
]

SKIP_DIRS = {'.git', 'node_modules', '_site', 'assets', 'css', 'data', 'js', 'scripts', 'tools', 'ホーム'}


def replace_header(html: str):
    patterns = [
        r'<header\b[^>]*class=["\'][^"\']*\bsite-header\b[^"\']*["\'][^>]*>[\s\S]*?</header>',
        r'<header\b[^>]*class=["\'][^"\']*\bsite-head\b[^"\']*["\'][^>]*>[\s\S]*?</header>',
        r'<header\b[^>]*class=["\'][^"\']*\bessay-header\b[^"\']*["\'][^>]*>[\s\S]*?</header>',
    ]
    for pattern in patterns:
        if re.search(pattern, html, flags=re.I):
            return re.sub(pattern, HEADER, html, count=1, flags=re.I), True
    return html, False


def replace_balanced_div(html: str, marker='mobileOverlay'):
    m = re.search(r'<div\b[^>]*\bid=["\']' + re.escape(marker) + r'["\'][^>]*>', html, flags=re.I)
    if not m:
        return html, False
    token_re = re.compile(r'<div\b[^>]*>|</div\s*>', re.I)
    depth = 0
    end = None
    for token in token_re.finditer(html, m.start()):
        if token.group(0).lower().startswith('<div'):
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                end = token.end()
                break
    if end is None:
        raise RuntimeError('Unbalanced mobile overlay div')
    return html[:m.start()] + MOBILE + html[end:], True


def ensure_css(html: str, href: str, after_site=False):
    if href.split('?')[0] in html:
        return html
    tag = f'<link rel="stylesheet" href="{href}">'
    if after_site:
        site = re.search(r'<link\b[^>]*href=["\']/css/site\.css[^"\']*["\'][^>]*>', html, flags=re.I)
        if site:
            return html[:site.end()] + '\n' + tag + html[site.end():]
    local = re.search(r'<link\b[^>]*rel=["\']stylesheet["\'][^>]*href=["\']/css/[^"\']+["\'][^>]*>', html, flags=re.I)
    if local:
        return html[:local.start()] + tag + '\n' + html[local.start():]
    return re.sub(r'</head>', tag + '\n</head>', html, count=1, flags=re.I)


def ensure_script(html: str):
    ref = re.compile(r'/js/site\.js\?v=[A-Za-z0-9._-]+')
    if ref.search(html):
        return ref.sub(f'/js/site.js?v={SITE_JS_VERSION}', html)
    tag = f'<script src="/js/site.js?v={SITE_JS_VERSION}"></script>'
    return re.sub(r'</body>', tag + '\n</body>', html, count=1, flags=re.I)


def migrate_html(path: Path):
    html = path.read_text(encoding='utf-8')
    original = html
    had_old_header = bool(re.search(r'<header\b[^>]*class=["\'][^"\']*\b(site-header|site-head|essay-header)\b', html, flags=re.I))
    if not had_old_header:
        # Still keep site.js cache coherent if present.
        html = re.sub(r'/js/site\.js\?v=[A-Za-z0-9._-]+', f'/js/site.js?v={SITE_JS_VERSION}', html)
        if html != original:
            path.write_text(html, encoding='utf-8')
            return 'cache-only'
        return None

    html, replaced = replace_header(html)
    if not replaced:
        raise RuntimeError(f'Header marker found but could not replace: {path}')

    html, mobile_replaced = replace_balanced_div(html)
    if not mobile_replaced:
        header_end = html.find('</header>')
        if header_end < 0:
            raise RuntimeError(f'Header end not found: {path}')
        header_end += len('</header>')
        html = html[:header_end] + '\n' + MOBILE + html[header_end:]

    # Old document/essay pages did not necessarily load the main site chrome CSS.
    if '/css/site.css' not in html:
        html = ensure_css(html, '/css/site.css?v=20260814-3')
    html = ensure_css(html, f'/css/global-nav.css?v={GLOBAL_NAV_VERSION}', after_site=True)
    html = ensure_script(html)

    if html != original:
        path.write_text(html, encoding='utf-8')
        return 'header'
    return None


def behavior_only_nav_function():
    return r'''  function addGlobalNav(){
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
  }'''


def migrate_site_js():
    path = Path('js/site.js')
    text = path.read_text(encoding='utf-8')
    pattern = re.compile(r'  function addGlobalNav\(\)\{.*?\n  \}\n\n  function installMobileSearch\(\)\{', re.S)
    if not pattern.search(text):
        raise RuntimeError('addGlobalNav function not found')
    text = pattern.sub(behavior_only_nav_function() + '\n\n  function installMobileSearch(){', text, count=1)
    text = re.sub(r'/\* site\.js loader — .*? \*/', '/* site.js loader — 2026-09-06 v102 static-nav */', text, count=1)
    path.write_text(text, encoding='utf-8')


def update_generator():
    path = Path('scripts/generate-school-pages.js')
    text = path.read_text(encoding='utf-8')
    if '/css/global-nav.css' not in text:
        text = text.replace(
            '<link rel="stylesheet" href="/css/site.css?v=20260814-3">',
            '<link rel="stylesheet" href="/css/site.css?v=20260814-3">\n  <link rel="stylesheet" href="/css/global-nav.css?v=' + GLOBAL_NAV_VERSION + '">'
        )
    text = re.sub(r'/js/site\.js\?v=[A-Za-z0-9._-]+', f'/js/site.js?v={SITE_JS_VERSION}', text)
    path.write_text(text, encoding='utf-8')


def update_package():
    path = Path('package.json')
    text = path.read_text(encoding='utf-8')
    text = text.replace('check-site-js-version.js 94', 'check-site-js-version.js 95')
    text = text.replace('bump-site-js-version.js 94 --dry-run', 'bump-site-js-version.js 95 --dry-run')
    text = text.replace('maintenance:bump-site-js -- 94', 'maintenance:bump-site-js -- 95')
    path.write_text(text, encoding='utf-8')


def update_structure():
    path = Path('SITE_STRUCTURE.md')
    text = path.read_text(encoding='utf-8')
    text = re.sub(
        r'グローバルナビゲーションは `トップ / 任意加入 / 学校とPTA / 全国調査 / 教育委員会回答 / 論考・資料 / 教育委員会へ提出` を基本系統とします。[^\n]*',
        'グローバルナビゲーションは `トップ / 任意加入 / 学校とPTA / 全国調査 / 教育委員会回答 / 論考・資料 / 教育委員会へ提出` を基本系統とします。デスクトップ・モバイルともHTMLへ静的に出力し、`js/site.js` は現在地表示・ドロップダウン開閉・検索等の補助動作だけを担当します。',
        text,
        count=1,
    )
    text = text.replace(
        '`js/site.js` は全ページ共通の補助スクリプトです。検索、ハンバーガーメニューの開閉、スクロール補正、リンク補正などの横断処理に限定します。主要ナビゲーションや本文を実行時に生成・置換・並べ替えません。',
        '`js/site.js` は全ページ共通の補助スクリプトです。検索、ハンバーガーメニュー、ドロップダウン、現在地表示、スクロール補正などの横断処理に限定します。主要ナビゲーションのリンク構造はHTMLに静的に置き、実行時に生成・置換・並べ替えません。'
    )
    path.write_text(text, encoding='utf-8')


def main():
    counts = {'header': 0, 'cache-only': 0}
    for path in ROOT.rglob('*.html'):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        result = migrate_html(path)
        if result:
            counts[result] += 1

    migrate_site_js()
    update_generator()
    update_package()
    update_structure()

    # Hard verification: no runtime nav replacement remains.
    site_js = Path('js/site.js').read_text(encoding='utf-8')
    if 'nav.innerHTML = desktopHtml' in site_js or 'insertAdjacentHTML(\'beforeend\'' in site_js and 'mobileGroup(' in site_js:
        raise RuntimeError('Runtime navigation generation still remains')

    # Every migrated standard header must carry static nav and CSS.
    failures = []
    checked = 0
    for path in ROOT.rglob('*.html'):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        html = path.read_text(encoding='utf-8')
        if '<header class="site-header"' not in html:
            continue
        checked += 1
        if 'global-nav-v102' not in html or '/css/global-nav.css' not in html:
            failures.append(str(path))
    if failures:
        raise RuntimeError('Static nav missing: ' + ', '.join(failures[:20]))

    print('migrated headers:', counts['header'])
    print('cache-only updates:', counts['cache-only'])
    print('verified static site headers:', checked)


if __name__ == '__main__':
    main()
