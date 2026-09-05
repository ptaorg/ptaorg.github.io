from pathlib import Path
import re

ROOT = Path('.')
SKIP_DIRS = {'.git', 'node_modules', '_site', 'assets', 'css', 'data', 'js', 'scripts', 'tools', 'ホーム'}

AUDIENCE_DESKTOP = '''<div class="nav-item has-dropdown" data-global-nav-group="audience"><a class="nav-link" href="/guide-parent.html" aria-haspopup="true" aria-expanded="false">立場別</a><div class="mega-menu audience-menu" aria-label="立場別メニュー"><div class="mega-col"><h4>立場から探す</h4><ul><li><a href="/guide-parent.html">保護者</a></li><li><a href="/guide-pta.html">PTA役員</a></li><li><a href="/guide-board.html">教育委員会・学校</a></li><li><a href="/guide-research.html">研究者・記者</a></li></ul></div></div></div>'''

AUDIENCE_MOBILE = '''<div class="mobile-menu-group" data-global-mobile-group><div class="mobile-menu-label">立場別</div><a class="mobile-link" href="/guide-parent.html">保護者</a><a class="mobile-link" href="/guide-pta.html">PTA役員</a><a class="mobile-link" href="/guide-board.html">教育委員会・学校</a><a class="mobile-link" href="/guide-research.html">研究者・記者</a></div>'''

MEMBERSHIP_LINK = '<a class="nav-link global-membership-nav" href="/pta-membership-optin.html">任意加入</a>'
SCHOOL_MOBILE_MARKER = '<div class="mobile-menu-group" data-global-mobile-group><div class="mobile-menu-label">学校とPTA</div>'
AUDIENCE_LINKS_JS = """    var audienceLinks = [\n      ['/guide-parent.html','保護者'],\n      ['/guide-pta.html','PTA役員'],\n      ['/guide-board.html','教育委員会・学校'],\n      ['/guide-research.html','研究者・記者']\n    ];\n"""


def public_html_files():
    for p in ROOT.rglob('*.html'):
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        yield p


def patch_html(path: Path):
    s = path.read_text(encoding='utf-8')
    original = s
    if 'global-nav-v102' not in s:
        return False

    if 'data-global-nav-group="audience"' not in s:
        if MEMBERSHIP_LINK not in s:
            raise RuntimeError(f'membership nav marker missing: {path}')
        s = s.replace(MEMBERSHIP_LINK, MEMBERSHIP_LINK + '\n' + AUDIENCE_DESKTOP, 1)

    if '<div class="mobile-menu-label">立場別</div>' not in s:
        if SCHOOL_MOBILE_MARKER not in s:
            raise RuntimeError(f'mobile school marker missing: {path}')
        s = s.replace(SCHOOL_MOBILE_MARKER, AUDIENCE_MOBILE + '\n' + SCHOOL_MOBILE_MARKER, 1)

    s = re.sub(r'/css/global-nav\.css\?v=[A-Za-z0-9._-]+', '/css/global-nav.css?v=20260906-2', s)
    s = re.sub(r'/js/site\.js\?v=[A-Za-z0-9._-]+', '/js/site.js?v=96', s)

    if s != original:
        path.write_text(s, encoding='utf-8')
        return True
    return False


def patch_site_js():
    path = Path('js/site.js')
    s = path.read_text(encoding='utf-8')
    original = s
    if 'var audienceLinks = [' not in s:
        marker = '    var researchLinks = ['
        if marker not in s:
            raise RuntimeError('site.js researchLinks marker missing')
        s = s.replace(marker, AUDIENCE_LINKS_JS + marker, 1)
    s = s.replace("[['school',schoolLinks],['research',researchLinks],['reading',readingLinks]]",
                  "[['audience',audienceLinks],['school',schoolLinks],['research',researchLinks],['reading',readingLinks]]")
    s = re.sub(r'/\* site\.js loader — .*? \*/', '/* site.js loader — 2026-09-06 v103 static-nav+audience */', s, count=1)
    if s != original:
        path.write_text(s, encoding='utf-8')


def patch_static_migration_source():
    path = Path('scripts/legacy/static-global-nav-migration.py')
    s = path.read_text(encoding='utf-8')
    original = s
    s = s.replace("SITE_JS_VERSION = '95'", "SITE_JS_VERSION = '96'")
    s = s.replace("GLOBAL_NAV_VERSION = '20260906-1'", "GLOBAL_NAV_VERSION = '20260906-2'")

    if 'data-global-nav-group="audience"' not in s:
        target = MEMBERSHIP_LINK + '\n<div class="nav-item has-dropdown" data-global-nav-group="school">'
        replacement = MEMBERSHIP_LINK + '\n' + AUDIENCE_DESKTOP + '\n<div class="nav-item has-dropdown" data-global-nav-group="school">'
        if target not in s:
            raise RuntimeError('static migration desktop insertion point missing')
        s = s.replace(target, replacement, 1)

    if '<div class="mobile-menu-label">立場別</div>' not in s:
        target = SCHOOL_MOBILE_MARKER
        if target not in s:
            raise RuntimeError('static migration mobile insertion point missing')
        s = s.replace(target, AUDIENCE_MOBILE + '\n' + target, 1)

    if 'var audienceLinks = [' not in s:
        marker = "    var researchLinks = ["
        if marker not in s:
            raise RuntimeError('static migration JS insertion point missing')
        s = s.replace(marker, AUDIENCE_LINKS_JS + marker, 1)

    s = s.replace("[['school',schoolLinks],['research',researchLinks],['reading',readingLinks]]",
                  "[['audience',audienceLinks],['school',schoolLinks],['research',researchLinks],['reading',readingLinks]]")
    s = s.replace('トップ / 任意加入 / 学校とPTA / 全国調査 / 教育委員会回答 / 論考・資料 / 教育委員会へ提出',
                  'トップ / 任意加入 / 立場別 / 学校とPTA / 全国調査 / 教育委員会回答 / 論考・資料 / 教育委員会へ提出')

    if s != original:
        path.write_text(s, encoding='utf-8')


def patch_css():
    path = Path('css/global-nav.css')
    s = path.read_text(encoding='utf-8')
    original = s
    marker = '/* Audience navigation */'
    if marker not in s:
        s += '''\n\n/* Audience navigation */\n.global-nav-v102 [data-global-nav-group="audience"] .mega-menu {\n  width: min(300px, calc(100vw - 32px));\n}\n\n.global-nav-v102 [data-global-nav-group="audience"] .mega-col {\n  min-width: 0;\n}\n'''
    if s != original:
        path.write_text(s, encoding='utf-8')


def patch_package():
    path = Path('package.json')
    s = path.read_text(encoding='utf-8')
    original = s
    s = s.replace('check-site-js-version.js 95', 'check-site-js-version.js 96')
    s = s.replace('bump-site-js-version.js 95 --dry-run', 'bump-site-js-version.js 96 --dry-run')
    s = s.replace('maintenance:bump-site-js -- 95', 'maintenance:bump-site-js -- 96')
    if s != original:
        path.write_text(s, encoding='utf-8')


def patch_structure():
    path = Path('SITE_STRUCTURE.md')
    if not path.exists():
        return
    s = path.read_text(encoding='utf-8')
    original = s
    s = s.replace('トップ / 任意加入 / 学校とPTA / 全国調査 / 教育委員会回答 / 論考・資料 / 教育委員会へ提出',
                  'トップ / 任意加入 / 立場別 / 学校とPTA / 全国調査 / 教育委員会回答 / 論考・資料 / 教育委員会へ提出')
    if s != original:
        path.write_text(s, encoding='utf-8')


def verify():
    checked = 0
    failures = []
    for p in public_html_files():
        s = p.read_text(encoding='utf-8')
        if 'global-nav-v102' not in s:
            continue
        checked += 1
        required = [
            'data-global-nav-group="audience"',
            '<div class="mobile-menu-label">立場別</div>',
            '/guide-parent.html', '/guide-pta.html', '/guide-board.html', '/guide-research.html',
            '/css/global-nav.css?v=20260906-2', '/js/site.js?v=96'
        ]
        if any(x not in s for x in required):
            failures.append(str(p))
    if failures:
        raise SystemExit('audience nav verification failed: ' + ', '.join(failures[:30]))
    site_js = Path('js/site.js').read_text(encoding='utf-8')
    if "['audience',audienceLinks]" not in site_js:
        raise SystemExit('audience current-location parent marking missing in site.js')
    print('verified audience navigation pages:', checked)


def main():
    changed = 0
    for p in public_html_files():
        if patch_html(p):
            changed += 1
    patch_site_js()
    patch_static_migration_source()
    patch_css()
    patch_package()
    patch_structure()
    verify()
    print('changed html pages:', changed)


if __name__ == '__main__':
    main()
