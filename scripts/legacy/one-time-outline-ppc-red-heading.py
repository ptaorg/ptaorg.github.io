from pathlib import Path
import re

css_path = Path('css/pages/ppc-points.css')
html_path = Path('ppc-points.html')

css = css_path.read_text(encoding='utf-8')
marker = '/* 2026-09-06: improve contrast of the red PPC core line */'
rule = '''\n\n/* 2026-09-06: improve contrast of the red PPC core line */\n.ppc-core-title span:last-child {\n  color: #c51f2b;\n  -webkit-text-stroke: 0.8px #fff;\n  paint-order: stroke fill;\n  text-shadow:\n    0 0 1px rgba(255,255,255,.95),\n    0 1px 1px rgba(0,0,0,.18);\n}\n'''

if marker not in css:
    css = css.rstrip() + rule + '\n'
else:
    css = re.sub(
        r'/\* 2026-09-06: improve contrast of the red PPC core line \*/[\s\S]*?\n}\n',
        rule.strip() + '\n',
        css,
        count=1,
    )
css_path.write_text(css, encoding='utf-8')

html = html_path.read_text(encoding='utf-8')
html = re.sub(
    r'/css/pages/ppc-points\.css\?v=[A-Za-z0-9._-]+',
    '/css/pages/ppc-points.css?v=20260906-1',
    html,
    count=1,
)
html_path.write_text(html, encoding='utf-8')

# Verification
css_check = css_path.read_text(encoding='utf-8')
html_check = html_path.read_text(encoding='utf-8')
required = [
    '.ppc-core-title span:last-child',
    '-webkit-text-stroke: 0.8px #fff;',
    'paint-order: stroke fill;',
]
for needle in required:
    if needle not in css_check:
        raise SystemExit(f'missing CSS: {needle}')
if '/css/pages/ppc-points.css?v=20260906-1' not in html_check:
    raise SystemExit('PPC CSS cache version not updated')

print('PPC red heading outline applied')
