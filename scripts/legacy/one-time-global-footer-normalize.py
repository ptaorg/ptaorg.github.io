from pathlib import Path
import re

ROOT = Path('.')
SKIP_DIRS = {'.git', '.claude', '_site', 'node_modules', 'assets', 'css', 'data', 'js', 'scripts', 'tools', 'ホーム'}
FOOTER_HREF = '/css/global-footer.css?v=20260906-1'
FOOTER_LINK = f'<link rel="stylesheet" href="{FOOTER_HREF}">'


def public_html_files():
    for p in ROOT.rglob('*.html'):
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        yield p


def add_footer_css(html: str) -> tuple[str, bool]:
    if not re.search(r'<footer\b', html, re.I):
        return html, False
    if re.search(r'/css/global-footer\.css(?:\?[^"\']*)?', html, re.I):
        return html, False
    if not re.search(r'</head>', html, re.I):
        raise RuntimeError('footer page has no </head>')
    return re.sub(r'</head>', FOOTER_LINK + '\n</head>', html, count=1, flags=re.I), True


footer_pages = 0
changed_pages = 0
for p in public_html_files():
    html = p.read_text(encoding='utf-8')
    if re.search(r'<footer\b', html, re.I):
        footer_pages += 1
    next_html, changed = add_footer_css(html)
    if changed:
        p.write_text(next_html, encoding='utf-8')
        changed_pages += 1

# Keep the metadata/enhancement pipeline aligned so future public pages with
# a footer automatically receive the shared footer stylesheet.
enhancer = Path('scripts/enhance-public-pages.js')
if enhancer.exists():
    s = enhancer.read_text(encoding='utf-8')
    marker = 'global-footer.css?v=20260906-1'
    if marker not in s:
        needle = '''  if (!/<link\\s+rel=["']stylesheet["'][^>]*href=["']\\/css\\/prose\\.css/i.test(next)) {\n    next = addHeadMarkup(next, '<link rel="stylesheet" href="/css/prose.css?v=20260906-4">');\n  }\n  return next;'''
        replacement = '''  if (!/<link\\s+rel=["']stylesheet["'][^>]*href=["']\\/css\\/prose\\.css/i.test(next)) {\n    next = addHeadMarkup(next, '<link rel="stylesheet" href="/css/prose.css?v=20260906-4">');\n  }\n  if (/<footer\\b/i.test(next) && !/<link\\s+rel=["']stylesheet["'][^>]*href=["']\\/css\\/global-footer\\.css/i.test(next)) {\n    next = addHeadMarkup(next, '<link rel="stylesheet" href="/css/global-footer.css?v=20260906-1">');\n  }\n  return next;'''
        if needle not in s:
            raise RuntimeError('enhance-public-pages.js insertion point not found')
        enhancer.write_text(s.replace(needle, replacement, 1), encoding='utf-8')

# Keep generated school pages self-contained even before the enhancement pass.
generator = Path('scripts/generate-school-pages.js')
if generator.exists():
    s = generator.read_text(encoding='utf-8')
    if FOOTER_HREF not in s:
        needle = '  <link rel="stylesheet" href="/css/site.css?v=20260814-3">\n'
        if needle not in s:
            raise RuntimeError('generate-school-pages.js stylesheet insertion point not found')
        s = s.replace(needle, needle + f'  <link rel="stylesheet" href="{FOOTER_HREF}">\n', 1)
        generator.write_text(s, encoding='utf-8')

# Final repository-wide verification for every public page that actually has a footer.
missing = []
verified = 0
for p in public_html_files():
    html = p.read_text(encoding='utf-8')
    if not re.search(r'<footer\b', html, re.I):
        continue
    verified += 1
    if FOOTER_HREF not in html:
        missing.append(str(p))

if missing:
    raise SystemExit('footer CSS missing from: ' + ', '.join(missing[:30]))

print(f'footer pages: {footer_pages}')
print(f'newly linked: {changed_pages}')
print(f'verified footer pages: {verified}')
