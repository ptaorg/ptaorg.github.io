from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
CSS = ROOT / 'css' / 'global-footer.css'
MARKER = '/* Footer support CTA normalization */'
BLOCK = r'''

/* Footer support CTA normalization */
body > footer .footer-support,
footer.footer .footer-support {
  box-sizing: border-box !important;
  width: min(100%, 1180px) !important;
  max-width: 1180px !important;
  margin: 0 auto 30px !important;
  padding: 18px 20px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 20px !important;
  border: 1px solid rgba(255,255,255,.20) !important;
  border-radius: 14px !important;
  background: linear-gradient(90deg, #f97316 0%, #ea580c 100%) !important;
  box-shadow: 0 10px 28px rgba(0,0,0,.14) !important;
}

body > footer .footer-support > div,
footer.footer .footer-support > div {
  min-width: 0 !important;
  flex: 1 1 auto !important;
}

body > footer .footer-support strong,
footer.footer .footer-support strong {
  display: block !important;
  margin: 0 !important;
  color: #fff !important;
  font-weight: 900 !important;
}

body > footer .footer-support p,
footer.footer .footer-support p {
  margin: 4px 0 0 !important;
  color: rgba(255,255,255,.96) !important;
  line-height: 1.65 !important;
}

body > footer .footer-support > a,
footer.footer .footer-support > a {
  box-sizing: border-box !important;
  flex: 0 0 auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-width: 136px !important;
  min-height: 46px !important;
  padding: 10px 18px !important;
  border: 1px solid rgba(255,255,255,.28) !important;
  border-radius: 999px !important;
  background: #102a43 !important;
  color: #fff !important;
  font-weight: 900 !important;
  line-height: 1.25 !important;
  text-align: center !important;
  text-decoration: none !important;
  white-space: nowrap !important;
  box-shadow: 0 5px 14px rgba(0,0,0,.16) !important;
}

body > footer .footer-support > a:hover,
footer.footer .footer-support > a:hover {
  background: #173a5e !important;
  color: #fff !important;
  text-decoration: none !important;
  transform: translateY(-1px);
}

@media (max-width: 760px) {
  body > footer .footer-support,
  footer.footer .footer-support {
    margin-bottom: 24px !important;
    padding: 16px !important;
    align-items: stretch !important;
    flex-direction: column !important;
    gap: 14px !important;
  }

  body > footer .footer-support > a,
  footer.footer .footer-support > a {
    width: 100% !important;
    min-width: 0 !important;
  }
}

@media print {
  body > footer .footer-support,
  footer.footer .footer-support {
    background: #fff !important;
    color: #111 !important;
    border: 1px solid #777 !important;
    box-shadow: none !important;
  }

  body > footer .footer-support > a,
  footer.footer .footer-support > a {
    background: #fff !important;
    color: #111 !important;
    border-color: #777 !important;
    box-shadow: none !important;
  }
}
'''

css = CSS.read_text(encoding='utf-8')
if MARKER not in css:
    css = css.rstrip() + BLOCK + '\n'
    CSS.write_text(css, encoding='utf-8')

skip = {'.git', '.claude', '_site', 'node_modules', 'assets', 'css', 'data', 'js', 'scripts', 'tools', 'ホーム'}
changed = 0
covered = 0
for p in ROOT.rglob('*.html'):
    if any(part in skip for part in p.relative_to(ROOT).parts):
        continue
    s = p.read_text(encoding='utf-8')
    if not re.search(r'<footer\b', s, re.I):
        continue
    if '/css/global-footer.css' not in s:
        continue
    covered += 1
    n = re.sub(r'/css/global-footer\.css\?v=[A-Za-z0-9._-]+', '/css/global-footer.css?v=20260906-2', s)
    if n != s:
        p.write_text(n, encoding='utf-8')
        changed += 1

for rel in ['scripts/enhance-public-pages.js', 'scripts/legacy/one-time-global-footer-normalize.py']:
    p = ROOT / rel
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8')
    n = s.replace('/css/global-footer.css?v=20260906-1', '/css/global-footer.css?v=20260906-2')
    if n != s:
        p.write_text(n, encoding='utf-8')

print(f'footer pages with shared stylesheet: {covered}')
print(f'html cache references updated: {changed}')
