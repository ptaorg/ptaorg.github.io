from pathlib import Path
import re

css_path = Path('css/pages/board-responses.css')
html_path = Path('board-responses.html')

css = css_path.read_text(encoding='utf-8')
marker = '/* 2026-09-06: chapter heading labels outside main */'
block = r'''

  /* 2026-09-06: chapter heading labels outside main */
  .board-responses-editorial > section:not(.compact-hero-section) h2 {
    display: inline-block !important;
    width: max-content !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    margin: 1.7rem 0 1rem !important;
    padding: 7px 11px 8px !important;
    border: 1px solid #17345c !important;
    border-left: 3px solid #c89b18 !important;
    border-radius: 2px !important;
    background: #102a43 !important;
    color: #fff !important;
    box-shadow: 0 3px 8px rgba(10, 25, 47, 0.08) !important;
    font-size: clamp(.98rem, 1.35vw, 1.14rem) !important;
    line-height: 1.32 !important;
    text-wrap: pretty;
    overflow-wrap: anywhere;
  }

  @media (max-width: 640px) {
    .board-responses-editorial > section:not(.compact-hero-section) h2 {
      margin: 1.4rem 0 .85rem !important;
      padding: 6px 9px 7px !important;
      font-size: .98rem !important;
      line-height: 1.3 !important;
    }
  }

  @media print {
    .board-responses-editorial > section:not(.compact-hero-section) h2 {
      background: #fff !important;
      color: #111 !important;
      border-color: #777 !important;
      box-shadow: none !important;
    }
  }
'''

if marker not in css:
    # Insert before the closing @layer brace.
    pos = css.rfind('\n}')
    if pos < 0:
        raise SystemExit('closing @layer brace not found')
    css = css[:pos] + block + css[pos:]
    css_path.write_text(css, encoding='utf-8')

html = html_path.read_text(encoding='utf-8')
html = re.sub(r'/css/pages/board-responses\.css\?v=[A-Za-z0-9._-]+',
              '/css/pages/board-responses.css?v=20260906-1', html)
html_path.write_text(html, encoding='utf-8')

print('board-responses H2 scope fixed')
