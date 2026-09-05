from pathlib import Path
import re

css_path = Path('css/pages/journal.css')
html_path = Path('journal.html')

css = css_path.read_text(encoding='utf-8')
marker = '/* 2026-09-06: two-column journal cards */'
block = r'''

@layer page {
  /* 2026-09-06: two-column journal cards */
  .journal-page .article-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
    align-items: stretch;
  }

  .journal-page .article-card {
    height: 100%;
    padding: 24px 58px 25px 24px;
    border: 2px solid var(--journal-accent);
    border-left-width: 8px;
    border-top-width: 4px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--journal-wash) 0%, #fff 68%);
    box-shadow: 0 7px 20px rgba(17, 40, 66, 0.10);
  }

  .journal-page .article-card:hover {
    border-color: var(--journal-accent);
    border-left-color: var(--journal-accent);
    background: linear-gradient(135deg, var(--journal-wash) 0%, #fff 76%);
    box-shadow: 0 12px 28px rgba(17, 40, 66, 0.16);
  }

  .journal-page .article-card--lead {
    background: linear-gradient(135deg, rgba(155, 79, 47, 0.14), #fff 72%);
  }

  .journal-page .article-card::after {
    top: 20px;
    right: 18px;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--journal-accent);
    color: #fff;
    font-size: .78rem;
    letter-spacing: .04em;
  }

  .journal-page .ac-meta {
    margin-bottom: 11px;
  }

  .journal-page .ac-title {
    margin-bottom: 10px;
    font-size: clamp(1rem, 1.35vw, 1.14rem);
    line-height: 1.58;
  }

  .journal-page .ac-excerpt {
    font-size: .88rem;
    line-height: 1.78;
  }

  @media (max-width: 820px) {
    .journal-page .article-list {
      grid-template-columns: 1fr;
      gap: 18px;
    }

    .journal-page .article-card {
      padding: 24px 54px 25px 20px;
      border-left-width: 7px;
      border-top-width: 3px;
    }
  }
}
'''

if marker not in css:
    css += block
    css_path.write_text(css, encoding='utf-8')

html = html_path.read_text(encoding='utf-8')
html = re.sub(r'/css/pages/journal\.css\?v=[A-Za-z0-9._-]+',
              '/css/pages/journal.css?v=20260906-1', html)
html_path.write_text(html, encoding='utf-8')

print('journal two-column layout and stronger borders applied')
