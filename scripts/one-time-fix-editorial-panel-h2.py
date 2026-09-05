from pathlib import Path
import re

css_path = Path('css/prose.css')
css = css_path.read_text(encoding='utf-8')
marker = '/* Editorial panels are article sections, not tool/card panels. */'
block = r'''

/* Editorial panels are article sections, not tool/card panels. */
body[data-content-mode="prose"] main .editorial-panel > h2 {
  display: inline-block !important;
  width: max-content !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  margin: 1.7rem 0 1rem !important;
  padding: 7px 11px 8px !important;
  border: 1px solid #17345c !important;
  border-left: 3px solid var(--prose-highlight-gold, #c89b18) !important;
  border-radius: 2px !important;
  background: var(--prose-navy, #102a43) !important;
  color: #fff !important;
  box-shadow: 0 3px 8px rgba(10, 25, 47, 0.08) !important;
  font-size: clamp(.98rem, 1.35vw, 1.14rem) !important;
  line-height: 1.32 !important;
  text-wrap: pretty;
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  body[data-content-mode="prose"] main .editorial-panel > h2 {
    margin: 1.4rem 0 .85rem !important;
    padding: 6px 9px 7px !important;
    font-size: .98rem !important;
    line-height: 1.3 !important;
  }
}

@media print {
  body[data-content-mode="prose"] main .editorial-panel > h2 {
    background: #fff !important;
    color: #111 !important;
    border-color: #777 !important;
    box-shadow: none !important;
  }
}
'''
if marker not in css:
    css += block
css_path.write_text(css, encoding='utf-8')

pat = re.compile(r'/css/prose\.css(?:\?v=[A-Za-z0-9._-]+)?')
changed = 0
skip = {'.git', 'node_modules', '_site', 'assets', 'css', 'data', 'js', 'scripts', 'tools'}
for p in Path('.').rglob('*.html'):
    if any(part in skip for part in p.parts):
        continue
    s = p.read_text(encoding='utf-8')
    n = pat.sub('/css/prose.css?v=20260906-4', s)
    if n != s:
        p.write_text(n, encoding='utf-8')
        changed += 1

future = Path('scripts/enhance-public-pages.js')
if future.exists():
    s = future.read_text(encoding='utf-8')
    future.write_text(pat.sub('/css/prose.css?v=20260906-4', s), encoding='utf-8')

print('updated html:', changed)
