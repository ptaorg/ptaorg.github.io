from pathlib import Path
import re

ROOT = Path('.')
CSS = ROOT / 'css' / 'prose.css'
ENHANCER = ROOT / 'scripts' / 'enhance-public-pages.js'
VERSION = '20260906-3'
MARKER = '/* Site-wide footer normalization */'

BLOCK = r'''

/* Site-wide footer normalization */
body[data-content-mode="prose"] footer {
  box-sizing: border-box !important;
  margin-top: 48px !important;
  padding: 0 20px !important;
  border-top: 3px solid var(--prose-highlight-gold, #c89b18) !important;
  background: #10233d !important;
  color: #dbe6f2 !important;
  box-shadow: none !important;
}

body[data-content-mode="prose"] footer :where(
  .footer-inner,
  .essay-footer-inner,
  .submit-footer-inner,
  .foot-inner,
  .footer-container
) {
  box-sizing: border-box !important;
  width: min(100%, 1180px) !important;
  max-width: 1180px !important;
  margin: 0 auto !important;
  padding: 30px 0 34px !important;
  color: #dbe6f2 !important;
}

body[data-content-mode="prose"] footer :where(p, li, span, small) {
  color: #dbe6f2 !important;
}

body[data-content-mode="prose"] footer :where(strong, .foot-brand, .submit-footer-title) {
  color: #fff !important;
}

body[data-content-mode="prose"] footer a {
  color: #fff !important;
  text-decoration-color: rgba(255,255,255,.48) !important;
  text-underline-offset: 3px;
}

body[data-content-mode="prose"] footer a:hover {
  color: #f3d36a !important;
  text-decoration-color: #f3d36a !important;
}

body[data-content-mode="prose"] footer .footer-governance {
  margin-top: 18px !important;
  padding-top: 16px !important;
  border-top: 1px solid rgba(255,255,255,.16) !important;
}

@media (max-width: 640px) {
  body[data-content-mode="prose"] footer {
    margin-top: 36px !important;
    padding-inline: 16px !important;
  }

  body[data-content-mode="prose"] footer :where(
    .footer-inner,
    .essay-footer-inner,
    .submit-footer-inner,
    .foot-inner,
    .footer-container
  ) {
    padding: 24px 0 28px !important;
  }
}

@media print {
  body[data-content-mode="prose"] footer {
    border-top: 1px solid #777 !important;
    background: #fff !important;
    color: #111 !important;
  }

  body[data-content-mode="prose"] footer * {
    color: #111 !important;
  }
}
'''

text = CSS.read_text(encoding='utf-8')
if MARKER not in text:
    CSS.write_text(text.rstrip() + BLOCK + '\n', encoding='utf-8')

pattern = re.compile(r'/css/prose\.css(?:\?v=[A-Za-z0-9._-]+)?')
skip_dirs = {'.git', 'node_modules', '_site', 'assets', 'css', 'data', 'js', 'scripts', 'tools'}
changed = 0

for path in ROOT.rglob('*.html'):
    if any(part in skip_dirs for part in path.parts):
        continue
    source = path.read_text(encoding='utf-8')
    updated = pattern.sub(f'/css/prose.css?v={VERSION}', source)
    if updated != source:
        path.write_text(updated, encoding='utf-8')
        changed += 1

source = ENHANCER.read_text(encoding='utf-8')
updated = pattern.sub(f'/css/prose.css?v={VERSION}', source)
if updated != source:
    ENHANCER.write_text(updated, encoding='utf-8')

print(f'Updated prose stylesheet cache reference in {changed} HTML files')
