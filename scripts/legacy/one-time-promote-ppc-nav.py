from pathlib import Path
import re

ROOT = Path('.')
SKIP_DIRS = {'.git', '.claude', '_site', 'node_modules', 'assets', 'css', 'data', 'js', 'scripts', 'tools', 'ホーム'}

PPC_DESKTOP = '<a class="nav-link global-ppc-nav" href="/ppc-points.html">PPC</a>'
PPC_MOBILE = '<a class="mobile-link global-ppc-nav" href="/ppc-points.html">PPC</a>'


def public_html_files():
    for p in ROOT.rglob('*.html'):
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        yield p


def promote_in_desktop(nav: str) -> str:
    if 'global-ppc-nav' not in nav:
        membership = '<a class="nav-link global-membership-nav" href="/pta-membership-optin.html">任意加入</a>'
        if membership in nav:
            nav = nav.replace(membership, membership + '\n' + PPC_DESKTOP, 1)
    # PPC is now a first-class item, so remove the duplicate from 論考・資料.
    nav = nav.replace('<li><a href="/ppc-points.html">PPC資料</a></li>', '', 1)
    return nav


def promote_in_mobile(overlay: str) -> str:
    if 'global-ppc-nav' not in overlay:
        membership = '<a class="mobile-link global-membership-nav" href="/pta-membership-optin.html">任意加入</a>'
        if membership in overlay:
            overlay = overlay.replace(membership, membership + PPC_MOBILE, 1)
    # Remove duplicate PPC entry from the 論考・資料 mobile group.
    overlay = overlay.replace('<a class="mobile-link" href="/ppc-points.html">PPC資料</a>', '', 1)
    return overlay


def replace_first_nav(html: str) -> tuple[str, bool]:
    m = re.search(r'<nav\b[^>]*class=["\'][^"\']*\bdesktop-nav\b[^"\']*["\'][^>]*>[\s\S]*?</nav>', html, re.I)
    if not m:
        return html, False
    before = m.group(0)
    after = promote_in_desktop(before)
    if after == before:
        return html, False
    return html[:m.start()] + after + html[m.end():], True


def replace_balanced_mobile(html: str) -> tuple[str, bool]:
    m = re.search(r'<div\b[^>]*\bid=["\']mobileOverlay["\'][^>]*>', html, re.I)
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
        raise RuntimeError('Unbalanced mobile overlay')
    before = html[m.start():end]
    after = promote_in_mobile(before)
    if after == before:
        return html, False
    return html[:m.start()] + after + html[end:], True


changed = 0
nav_pages = 0
for p in public_html_files():
    html = p.read_text(encoding='utf-8')
    if 'desktop-nav global-nav-v102' not in html:
        continue
    nav_pages += 1
    original = html
    html, _ = replace_first_nav(html)
    html, _ = replace_balanced_mobile(html)
    if html != original:
        p.write_text(html, encoding='utf-8')
        changed += 1

# site.js: PPC should be a direct current item, not part of the 論考・資料 parent group.
site_js = Path('js/site.js')
if site_js.exists():
    s = site_js.read_text(encoding='utf-8')
    s = re.sub(r"\n\s*\['/ppc-points\.html','PPC資料'\],", '', s, count=1)
    site_js.write_text(s, encoding='utf-8')

# Keep the canonical static-nav migration source aligned for future rebuilds.
migration = Path('scripts/legacy/static-global-nav-migration.py')
if migration.exists():
    s = migration.read_text(encoding='utf-8')
    desktop_membership = '<a class="nav-link global-membership-nav" href="/pta-membership-optin.html">任意加入</a>'
    if PPC_DESKTOP not in s and desktop_membership in s:
        s = s.replace(desktop_membership, desktop_membership + '\\n' + PPC_DESKTOP, 1)
    s = s.replace('<li><a href="/ppc-points.html">PPC資料</a></li>', '', 1)
    mobile_membership = '<a class="mobile-link global-membership-nav" href="/pta-membership-optin.html">任意加入</a>'
    if PPC_MOBILE not in s and mobile_membership in s:
        s = s.replace(mobile_membership, mobile_membership + PPC_MOBILE, 1)
    s = s.replace('<a class="mobile-link" href="/ppc-points.html">PPC資料</a>', '', 1)
    s = re.sub(r"\n\s*\['/ppc-points\.html','PPC資料'\],", '', s, count=2)
    s = s.replace(
        'トップ / 任意加入 / 立場別 / 学校とPTA / 全国調査 / 教育委員会回答 / 論考・資料 / 教育委員会へ提出',
        'トップ / 任意加入 / PPC / 立場別 / 学校とPTA / 全国調査 / 教育委員会回答 / 論考・資料 / 教育委員会へ提出'
    )
    migration.write_text(s, encoding='utf-8')

# Structure documentation.
structure = Path('SITE_STRUCTURE.md')
if structure.exists():
    s = structure.read_text(encoding='utf-8')
    s = s.replace(
        'トップ / 任意加入 / 立場別 / 学校とPTA / 全国調査 / 教育委員会回答 / 論考・資料 / 教育委員会へ提出',
        'トップ / 任意加入 / PPC / 立場別 / 学校とPTA / 全国調査 / 教育委員会回答 / 論考・資料 / 教育委員会へ提出'
    )
    structure.write_text(s, encoding='utf-8')

# Verification.
failures = []
verified = 0
for p in public_html_files():
    html = p.read_text(encoding='utf-8')
    if 'desktop-nav global-nav-v102' not in html:
        continue
    verified += 1
    desktop = re.search(r'<nav\b[^>]*class=["\'][^"\']*\bdesktop-nav\b[^"\']*["\'][^>]*>[\s\S]*?</nav>', html, re.I)
    if not desktop or PPC_DESKTOP not in desktop.group(0):
        failures.append(f'{p}: desktop PPC missing')
        continue
    if '<li><a href="/ppc-points.html">PPC資料</a></li>' in desktop.group(0):
        failures.append(f'{p}: duplicate PPC remains in reading menu')
    if 'id="mobileOverlay"' in html and PPC_MOBILE not in html:
        failures.append(f'{p}: mobile PPC missing')

if failures:
    raise SystemExit('\n'.join(failures[:30]))

print('nav pages:', nav_pages)
print('changed pages:', changed)
print('verified pages:', verified)
