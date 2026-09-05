#!/usr/bin/env bash
set -euo pipefail

python3 - <<'PY'
from pathlib import Path
import re

css_path = Path('css/prose.css')
css = css_path.read_text(encoding='utf-8')
marker = '/* Site-wide reading highlights: heading rule + inline emphasis marker. */'
block = '''

/* Site-wide reading highlights: heading rule + inline emphasis marker. */
body[data-content-mode="prose"] {
  --prose-highlight-gold: #c89b18;
  --prose-highlight-soft: rgba(212, 175, 55, 0.24);
}

body[data-content-mode="prose"] main h3::after {
  content: "";
  display: block;
  width: 4.75rem;
  max-width: 42%;
  height: 3px;
  margin-top: 0.42rem;
  background: var(--prose-highlight-gold);
}

body[data-content-mode="prose"] main :where(
  .support-payment-card,
  .region-map-card,
  .search-results-dropdown,
  .psc-case-viz-step,
  .psc-audit-head,
  .psc-audit-meta
) h3::after {
  display: none;
}

body[data-content-mode="prose"] main :where(p, li, dd) > strong {
  background-image: linear-gradient(
    to top,
    var(--prose-highlight-soft) 0,
    var(--prose-highlight-soft) 0.5em,
    transparent 0.5em,
    transparent 100%
  );
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

body[data-content-mode="prose"] main :where(
  .psc-audit-status,
  .psc-audit-badge,
  .badge,
  .tag,
  .status,
  .btn,
  .button,
  [class*="button"],
  [class*="badge"],
  [class*="status"]
) strong {
  background-image: none;
}

@media (max-width: 700px) {
  body[data-content-mode="prose"] main h3::after {
    width: 3.75rem;
    height: 2px;
    margin-top: 0.34rem;
  }
}

@media print {
  body[data-content-mode="prose"] main h3::after {
    background: #666;
  }
  body[data-content-mode="prose"] main :where(p, li, dd) > strong {
    background-image: none;
  }
}
'''
if marker not in css:
    css = css.rstrip() + block + '\n'
css_path.write_text(css, encoding='utf-8')

version = '20260905-3'
skip = {'.git', '_site', 'node_modules', 'assets', 'css', 'data', 'js', 'scripts', 'tools', 'ホーム'}
for path in Path('.').rglob('*.html'):
    if set(path.parts) & skip:
        continue
    text = path.read_text(encoding='utf-8', errors='ignore')
    updated = re.sub(r'/css/prose\.css\?v=[^"\']+', f'/css/prose.css?v={version}', text)
    if updated != text:
        path.write_text(updated, encoding='utf-8')

enhancer = Path('scripts/enhance-public-pages.js')
text = enhancer.read_text(encoding='utf-8')
text = re.sub(r'/css/prose\.css\?v=\d{8}(?:-\d+)?', f'/css/prose.css?v={version}', text)
enhancer.write_text(text, encoding='utf-8')
PY

grep -q 'Site-wide reading highlights' css/prose.css
grep -q '/css/prose.css?v=20260905-3' index.html
grep -q '/css/prose.css?v=20260905-3' pta-school-processing.html
npm run check:site
