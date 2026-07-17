from pathlib import Path
import re
import base64
import hashlib

ROOT = Path('.')

# Reconstruct verified binary assets from temporary text chunks.
asset_specs = {
    ROOT / 'assets/optin/optin-annotated-01-optout-consent.webp': (['.tmp/optin-assets/img-01.b64'], 'af5ec483bbd668dbce87aa0ac4bcab0d621e605890f2250be164b2848d0a048a'),
    ROOT / 'assets/optin/optin-annotated-02-master-data.webp': (['.tmp/optin-assets/img-02.b64'], '3c2f11c7ab9912af5fa88205d12b1db93fbca9f14861847001644b92271e6c9b'),
    ROOT / 'assets/optin/optin-annotated-03-article69.webp': (['.tmp/optin-assets/img-03.b64'], '2522b526d42f07d5579e8679ae9e874851884b0db44e53d6d624fc73fdbcbb98'),
    ROOT / 'assets/optin/optin-annotated-04-paradigm.webp': (['.tmp/optin-assets/img-04.b64'], '9d517512b8e03eb89d7bba24c99303fc7e008824fd3ac10cf31b87ebd3c087d9'),
    ROOT / 'assets/documents/pta-membership-optin-only-board-school-20260710.pdf': ([
        '.tmp/optin-assets/pdf-00.b64', '.tmp/optin-assets/pdf-01.b64',
        '.tmp/optin-assets/pdf-02.b64', '.tmp/optin-assets/pdf-03.b64'
    ], 'ab26b97266dbec90a7150cfeee932de5edfd0357166b5c23317789f7cfa0307b'),
}
for target, (parts, expected) in asset_specs.items():
    encoded = ''.join((ROOT / part).read_text(encoding='ascii').strip() for part in parts)
    data = base64.b64decode(encoded)
    actual = hashlib.sha256(data).hexdigest()
    if actual != expected:
        raise SystemExit(f'hash mismatch for {target}: {actual}')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    print(f'wrote {target} {len(data)} bytes {actual}')

STYLE_LINK = '<link rel="stylesheet" href="/css/priority-optin.css?v=20260717">'
START = '<!-- PRIORITY_OPTIN_ROUTE_START -->'
END = '<!-- PRIORITY_OPTIN_ROUTE_END -->'

routes = {
    'index.html': 'PTA加入、学校名簿、会費徴収、会計事務を一つの法的構造として整理した基幹ページです。',
    'guide-parent.html': '加入した覚えがない、非加入届を求められた、学校口座から会費が引き落とされた場合の出発点です。',
    'guide-pta.html': '会員名簿、入会申込、会費請求、未納・返金・会計を、学校情報に依存しない形へ直す基準です。',
    'guide-board.html': '第61条・第69条を順に確認し、代理徴収・会計事務を含む学校関与を全校点検する基準です。',
    'guide-research.html': '民法521条・522条、個人情報保護法61条・69条、PPC資料を一体で読む基幹整理です。',
    'membership.html': '入学、沈黙、非加入届の不提出、会費引落しでは加入申込みを代替できないことを図解します。',
    'privacy.html': '学校自身の利用とPTAへの提供を分け、第69条2項の全号が恒常運用の根拠にならないことを整理します。',
    'fee-collection.html': '会員判定、引落対象設定、未納管理、送金、返金、帳簿まで、代理徴収・会計事務を一連の情報処理として点検します。',
    'research-index.html': '原資料、注釈付き図解、第69条各号の検討表、PDF原版をまとめた最重要資料です。',
    'documents.html': '教育委員会・学校・PTAへの提出、研修、全校点検に使えるPDF原版とWeb解説です。',
    'submission-kit.html': '照会・申入れの前提となる、オプトイン、学校情報、代理徴収・会計の法的整理です。',
    'key-materials.html': 'PTA適正化の中心命題を、契約・個人情報・会費・会計まで一体で示す最重要資料です。',
    'journal.html': '詳細論考へ進む前に読む、PTA加入と学校情報利用の基幹ページです。',
    'journal/pta-membership-optin-record.html': '本論考の結論を教育委員会・学校実務向けに図解し、第69条と代理徴収・会計まで統合した基幹ページです。',
    'journal/optout-invalidity.html': 'オプトアウトの成立問題を、第69条2項の全経路、学校の代理徴収・会計事務まで拡張した基幹ページです。',
}

def banner(desc: str) -> str:
    return f'''\n{START}\n<a class="priority-optin-route" href="/pta-membership-optin.html" aria-label="最重要基幹ページ PTA加入はオプトイン以外では成立しない">\n  <span class="priority-optin-route__label">最重要基幹ページ</span>\n  <span class="priority-optin-route__title">PTA加入はオプトイン以外では成立しない</span>\n  <span class="priority-optin-route__text">{desc}</span>\n  <span class="priority-optin-route__link">図解・第69条全号・PDF原版を開く →</span>\n</a>\n{END}\n'''

changed = []
for rel, desc in routes.items():
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(f'missing route file: {rel}')
    text = path.read_text(encoding='utf-8')
    original = text
    if STYLE_LINK not in text:
        if '</head>' not in text:
            raise SystemExit(f'missing </head>: {rel}')
        text = text.replace('</head>', STYLE_LINK + '\n</head>', 1)
    if START not in text:
        m = re.search(r'<main\b[^>]*>', text, re.I)
        if not m:
            raise SystemExit(f'missing <main>: {rel}')
        text = text[:m.end()] + banner(desc) + text[m.end():]
    if text != original:
        path.write_text(text, encoding='utf-8')
        changed.append(rel)

# Dynamic search index: insert as the first record.
index_path = ROOT / 'data/site-search-index.js'
text = index_path.read_text(encoding='utf-8')
entry = '''  [\n    "PTA加入はオプトイン以外では成立しない",\n    "/pta-membership-optin.html",\n    "最重要基幹ページ。民法521条・522条、個人情報保護法61条・69条、PPC資料から、オプトアウト、学校名簿利用、PTA会費の代理徴収・会計事務が成立しない構造を注釈付き図解とPDFで整理。"\n  ],\n'''
if '"/pta-membership-optin.html"' not in text:
    marker = 'window.PTA_SITE_SEARCH_INDEX = [\n'
    if marker not in text:
        raise SystemExit('search index marker missing')
    text = text.replace(marker, marker + entry, 1)
    index_path.write_text(text, encoding='utf-8')
    changed.append(str(index_path))

# Built-in fallback search index in site.js.
site_path = ROOT / 'js/site.js'
text = site_path.read_text(encoding='utf-8')
row = "    ['PTA加入はオプトイン以外では成立しない', '/pta-membership-optin.html', '最重要基幹ページ。オプトイン、61条・69条、学校名簿、代理徴収・会計事務を統合整理'],\n"
if "'/pta-membership-optin.html'" not in text:
    marker = '  var SITE_INDEX = [\n'
    if marker not in text:
        raise SystemExit('site.js index marker missing')
    text = text.replace(marker, marker + row, 1)
    site_path.write_text(text, encoding='utf-8')
    changed.append(str(site_path))

# Sitemap.
sitemap = ROOT / 'sitemap.xml'
text = sitemap.read_text(encoding='utf-8')
url_block = '''  <url>\n    <loc>https://ptaorg.com/pta-membership-optin.html</loc>\n    <lastmod>2026-07-17</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n'''
if 'https://ptaorg.com/pta-membership-optin.html' not in text:
    marker = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    if marker not in text:
        raise SystemExit('sitemap marker missing')
    text = text.replace(marker, marker + url_block, 1)
    sitemap.write_text(text, encoding='utf-8')
    changed.append(str(sitemap))

# Basic validation.
page = (ROOT / 'pta-membership-optin.html').read_text(encoding='utf-8')
required = [
    'PTA加入はオプトイン以外では成立しない',
    '第69条2項は「臨時的」',
    '第1号', '第2号', '第3号', '第4号',
    '代理徴収・会計事務',
    'pta-membership-optin-only-board-school-20260710.pdf',
]
for token in required:
    if token not in page:
        raise SystemExit(f'missing core token in page: {token}')
for rel in routes:
    text = (ROOT / rel).read_text(encoding='utf-8')
    if text.count(START) != 1 or text.count('/pta-membership-optin.html') < 1:
        raise SystemExit(f'route validation failed: {rel}')

print('generated files and routes:', len(changed))
for item in changed:
    print(item)
