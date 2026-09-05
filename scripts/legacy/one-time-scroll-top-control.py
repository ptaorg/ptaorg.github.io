from pathlib import Path
import re

ROOT = Path('.')
SKIP_DIRS = {'.git', '.claude', '_site', 'node_modules', 'assets', 'css', 'data', 'js', 'scripts', 'tools', 'ホーム'}
CSS_HREF = '/css/scroll-top.css?v=20260906-1'
JS_SRC = '/js/scroll-top.js?v=20260906-1'
CSS_LINK = f'<link rel="stylesheet" href="{CSS_HREF}">'
JS_LINK = f'<script defer src="{JS_SRC}"></script>'


def public_html_files():
    for p in ROOT.rglob('*.html'):
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        yield p


def ensure_assets(html: str):
    changed = False
    if not re.search(r'</head>', html, re.I):
        return html, changed

    if not re.search(r'/css/scroll-top\.css(?:\?[^"\']*)?', html, re.I):
        html = re.sub(r'</head>', CSS_LINK + '\n</head>', html, count=1, flags=re.I)
        changed = True

    if not re.search(r'/js/scroll-top\.js(?:\?[^"\']*)?', html, re.I):
        html = re.sub(r'</head>', JS_LINK + '\n</head>', html, count=1, flags=re.I)
        changed = True

    return html, changed


eligible = 0
changed_pages = 0
for p in public_html_files():
    html = p.read_text(encoding='utf-8')
    if not re.search(r'</head>', html, re.I):
        continue
    eligible += 1
    next_html, changed = ensure_assets(html)
    if changed:
        p.write_text(next_html, encoding='utf-8')
        changed_pages += 1

# Future public pages created/enhanced by the repository pipeline should receive the control too.
enhancer = Path('scripts/enhance-public-pages.js')
if enhancer.exists():
    s = enhancer.read_text(encoding='utf-8')
    if 'scroll-top.css?v=20260906-1' not in s:
        needle = '''  if (/<footer\\b/i.test(next) && !/<link\\s+rel=["']stylesheet["'][^>]*href=["']\\/css\\/global-footer\\.css/i.test(next)) {\n    next = addHeadMarkup(next, '<link rel="stylesheet" href="/css/global-footer.css?v=20260906-2">');\n  }\n  return next;'''
        replacement = '''  if (/<footer\\b/i.test(next) && !/<link\\s+rel=["']stylesheet["'][^>]*href=["']\\/css\\/global-footer\\.css/i.test(next)) {\n    next = addHeadMarkup(next, '<link rel="stylesheet" href="/css/global-footer.css?v=20260906-2">');\n  }\n  if (!/<link\\s+rel=["']stylesheet["'][^>]*href=["']\\/css\\/scroll-top\\.css/i.test(next)) {\n    next = addHeadMarkup(next, '<link rel="stylesheet" href="/css/scroll-top.css?v=20260906-1">');\n  }\n  if (!/<script\\b[^>]*src=["']\\/js\\/scroll-top\\.js/i.test(next)) {\n    next = addHeadMarkup(next, '<script defer src="/js/scroll-top.js?v=20260906-1"></script>');\n  }\n  return next;'''
        if needle not in s:
            raise RuntimeError('enhance-public-pages.js insertion point not found')
        enhancer.write_text(s.replace(needle, replacement, 1), encoding='utf-8')

# Generated school pages should also carry the control before any enhancement pass.
generator = Path('scripts/generate-school-pages.js')
if generator.exists():
    s = generator.read_text(encoding='utf-8')
    if CSS_HREF not in s:
        needle = '  <link rel="stylesheet" href="/css/site.css?v=20260814-3">\n'
        if needle not in s:
            raise RuntimeError('generate-school-pages.js stylesheet insertion point not found')
        s = s.replace(needle, needle + f'  <link rel="stylesheet" href="{CSS_HREF}">\n', 1)
    if JS_SRC not in s:
        head_close = '</head>'
        if head_close not in s:
            raise RuntimeError('generate-school-pages.js head close not found')
        s = s.replace(head_close, f'  <script defer src="{JS_SRC}"></script>\n{head_close}', 1)
    generator.write_text(s, encoding='utf-8')

missing = []
verified = 0
for p in public_html_files():
    html = p.read_text(encoding='utf-8')
    if not re.search(r'</head>', html, re.I):
        continue
    verified += 1
    if CSS_HREF not in html or JS_SRC not in html:
        missing.append(str(p))

if missing:
    raise SystemExit('scroll-top assets missing from: ' + ', '.join(missing[:30]))

print(f'eligible public html: {eligible}')
print(f'changed pages: {changed_pages}')
print(f'verified pages: {verified}')
