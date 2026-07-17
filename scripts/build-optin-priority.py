from pathlib import Path
import math
import re
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = Path('.')
PDF = ROOT / 'assets/documents/journal/pta-membership-optin-record.pdf'
RENDER = ROOT / '.tmp/optin-rendered'
OUT = ROOT / 'assets/optin'
RENDER.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

FONT_REG = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
FONT_BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
NAVY = (20, 53, 94)
BLUE = (36, 82, 135)
ORANGE = (196, 91, 20)
RED = (184, 43, 43)
GOLD = (197, 148, 35)
INK = (31, 41, 55)
MUTED = (77, 92, 112)
BG = (244, 247, 250)
WHITE = (255, 255, 255)
LINE = (202, 212, 224)
PALE_BLUE = (235, 243, 251)
PALE_ORANGE = (255, 246, 235)
PALE_RED = (255, 240, 240)


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size=size, index=2)


def draw_wrapped(draw, text, box, fnt, fill=INK, spacing=10):
    x0, y0, x1, y1 = box
    max_width = x1 - x0
    lines = []
    for paragraph in text.split('\n'):
        if not paragraph:
            lines.append('')
            continue
        current = ''
        for ch in paragraph:
            trial = current + ch
            if draw.textbbox((0, 0), trial, font=fnt)[2] <= max_width:
                current = trial
            else:
                if current:
                    lines.append(current)
                current = ch
        if current:
            lines.append(current)
    y = y0
    line_h = fnt.size + spacing
    for line in lines:
        if y + line_h > y1:
            break
        draw.text((x0, y), line, font=fnt, fill=fill)
        y += line_h


def arrow(draw, start, end, color=RED, width=6):
    draw.line([start, end], fill=color, width=width)
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    length = 20
    p1 = (end[0] + length * math.cos(angle + math.pi * .82), end[1] + length * math.sin(angle + math.pi * .82))
    p2 = (end[0] + length * math.cos(angle - math.pi * .82), end[1] + length * math.sin(angle - math.pi * .82))
    draw.polygon([end, p1, p2], fill=color)


def callout(draw, xy, title, body, accent=RED, bg=WHITE, number=None):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle(xy, radius=18, fill=bg, outline=LINE, width=2)
    draw.rectangle((x0, y0, x0 + 10, y1), fill=accent)
    tx = x0 + 28
    if number is not None:
        r = (tx, y0 + 20, tx + 42, y0 + 62)
        draw.rounded_rectangle(r, radius=8, fill=accent)
        draw.text((tx + 12, y0 + 24), str(number), font=font(22, True), fill=WHITE)
        tx += 58
    draw.text((tx, y0 + 22), title, font=font(28, True), fill=accent)
    draw_wrapped(draw, body, (x0 + 28, y0 + 76, x1 - 24, y1 - 20), font(23), fill=INK, spacing=11)


def render_page(page_no):
    prefix = RENDER / f'page-{page_no:02d}'
    subprocess.run([
        'pdftoppm', '-f', str(page_no), '-l', str(page_no), '-singlefile',
        '-r', '150', '-png', str(PDF), str(prefix)
    ], check=True)
    return prefix.with_suffix('.png')


def make_annotated(page_no, title, callouts, filename):
    src = Image.open(render_page(page_no)).convert('RGB')
    canvas_w, canvas_h = 1800, 1600
    canvas = Image.new('RGB', (canvas_w, canvas_h), BG)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, canvas_w, 108), fill=NAVY)
    draw.text((42, 28), title, font=font(37, True), fill=WHITE)

    page_x, page_y, page_w = 36, 134, 980
    scale = min(page_w / src.width, 1380 / src.height)
    page_w2, page_h2 = round(src.width * scale), round(src.height * scale)
    page = src.resize((page_w2, page_h2), Image.Resampling.LANCZOS)
    canvas.paste(page, (page_x, page_y))
    draw.rectangle((page_x, page_y, page_x + page_w2, page_y + page_h2), outline=LINE, width=2)

    for item in callouts:
        callout(draw, item['box'], item['title'], item['body'], item.get('accent', RED), item.get('bg', WHITE), item.get('number'))
        fx, fy = item['target']
        target = (page_x + int(page_w2 * fx), page_y + int(page_h2 * fy))
        x0, y0, x1, y1 = item['box']
        start = item.get('start', (x0, (y0 + y1) // 2))
        arrow(draw, start, target, item.get('accent', RED), 6)

    draw.text((1070, 1530), '出典：PTA適正化推進委員会「オプトイン型申込記録の不可欠性」', font=font(17), fill=MUTED)
    target = OUT / filename
    canvas.save(target, 'WEBP', quality=82, method=6)
    print('wrote', target, target.stat().st_size)


make_annotated(11, '図解1　沈黙・非加入届の不提出は、加入申込みにも本人同意にもならない', [
    {'box': (1060, 145, 1760, 430), 'target': (.56, .18), 'title': '加入契約の問題', 'body': '入学書類への混在、全員加入の前提、非加入届の不提出は、民法522条の「契約締結を申し入れる意思表示」ではありません。', 'accent': BLUE, 'bg': PALE_BLUE, 'number': 1},
    {'box': (1060, 470, 1760, 795), 'target': (.55, .48), 'title': '第69条2項1号の問題', 'body': '学校が「拒否しなければ同意」と扱うこともできません。PPC Q3-3-10は、行政機関等がオプトアウトに準じる方法で本人同意を取得したと扱うことを否定しています。', 'accent': RED, 'bg': PALE_RED, 'number': 2},
    {'box': (1060, 840, 1760, 1195), 'target': (.52, .68), 'title': '後続処理も正当化しない', 'body': '加入を推定したうえで名簿を作り、学校口座で会費を引き落としても、その徴収結果を後から加入意思の証拠にはできません。推定を推定結果で支える循環です。', 'accent': ORANGE, 'bg': PALE_ORANGE, 'number': 3},
], 'optin-annotated-01-optout-consent.webp')

make_annotated(13, '図解2　学校保有情報はPTA会員情報ではない――第61条の壁', [
    {'box': (1060, 145, 1760, 420), 'target': (.55, .19), 'title': '学校情報の利用目的', 'body': '学校の氏名、住所、連絡先、口座情報は、学校教育・学校徴収金等のために保有する情報です。PTA会員管理・会費・会計の情報ではありません。', 'accent': BLUE, 'bg': PALE_BLUE, 'number': 1},
    {'box': (1060, 455, 1760, 760), 'target': (.53, .42), 'title': 'PTA側はゼロから取得', 'body': 'PTAが必要な情報は、加入希望者本人から申込時に直接取得します。学校名簿から非加入者を引くための全保護者マスターデータを、PTAは当然には持てません。', 'accent': ORANGE, 'bg': PALE_ORANGE, 'number': 2},
    {'box': (1060, 800, 1760, 1145), 'target': (.52, .69), 'title': '第61条を先に確認', 'body': '恒常的に学校が会員判定、徴収対象設定、未納管理、送金、返金、帳簿処理を行うなら、それが「法令の定める所掌事務又は業務」かを先に示す必要があります。', 'accent': RED, 'bg': PALE_RED, 'number': 3},
    {'box': (1060, 1185, 1760, 1490), 'target': (.55, .91), 'title': '委任・慣行では足りない', 'body': 'PTAからの依頼、委任、覚書、従来の教頭・事務職員の取扱いは、学校の法令上の所掌事務を新たに作る根拠ではありません。', 'accent': GOLD, 'bg': WHITE, 'number': 4},
], 'optin-annotated-02-master-data.webp')

make_annotated(14, '図解3　第69条の全経路は、恒常的な代理徴収・会計事務の根拠にならない', [
    {'box': (1060, 135, 1760, 405), 'target': (.53, .13), 'title': '第69条2項は「臨時的」', 'body': 'PPC Q3-3-2は、第69条2項を臨時的な目的外利用・提供の規定と整理しています。この入口は第1号から第4号まで共通です。', 'accent': RED, 'bg': PALE_RED, 'number': 1},
    {'box': (1060, 440, 1760, 775), 'target': (.52, .34), 'title': '反復継続する通常業務', 'body': '毎年度の会員確定、毎月の口座振替、未納確認、入金照合、PTA口座への送金、返金、帳簿、決算は、偶発的・一時的な処理ではありません。', 'accent': ORANGE, 'bg': PALE_ORANGE, 'number': 2},
    {'box': (1060, 815, 1760, 1135), 'target': (.50, .56), 'title': '「法令に基づく場合」', 'body': '第69条1項の例外には、具体的な情報利用・提供を認める法令上の根拠が必要です。包括的権限、PTA規約、委任、覚書、便宜では足りません。', 'accent': BLUE, 'bg': PALE_BLUE, 'number': 3},
    {'box': (1060, 1175, 1760, 1495), 'target': (.52, .79), 'title': '学校自身の利用も対象', 'body': '名簿をPTAへ渡さなくても、学校自身が会員判定、引落対象設定、未納管理、送金、返金を行えば、保有個人情報の「自ら利用」です。第三者提供を避けても第69条から逃れません。', 'accent': GOLD, 'bg': WHITE, 'number': 4},
], 'optin-annotated-03-article69.webp')

make_annotated(17, '図解4　学校の「引き算」をやめ、PTA自身の「足し算」へ', [
    {'box': (1060, 145, 1760, 450), 'target': (.49, .18), 'title': '引き算方式', 'body': '学校名簿から非加入者を除き、残りを会員・徴収対象とする方式は、学校の全保護者データと学校による差分処理を必要とします。', 'accent': RED, 'bg': PALE_RED, 'number': 1},
    {'box': (1060, 490, 1760, 805), 'target': (.52, .38), 'title': '代理徴収・会計へ連鎖', 'body': '会員が申込記録から確定していないため、連絡、役員候補、当番、会費債務、引落し、未納、返金、帳簿まで学校情報へ依存します。', 'accent': BLUE, 'bg': PALE_BLUE, 'number': 2},
    {'box': (1060, 845, 1760, 1175), 'target': (.51, .67), 'title': '足し算方式', 'body': 'PTAはゼロから、加入申込者本人の情報だけを追加します。申込者＝承諾者＝会員名簿とすれば、学校は会員・非会員を判定しません。', 'accent': ORANGE, 'bg': PALE_ORANGE, 'number': 3},
    {'box': (1060, 1215, 1760, 1495), 'target': (.51, .88), 'title': '制度設計の結論', 'body': 'PTA自身が入会、名簿、請求、入金、未納、返金、会計を処理し、学校は教育上必要な情報だけを扱う。この分離が全論点を同時に解消します。', 'accent': GOLD, 'bg': WHITE, 'number': 4},
], 'optin-annotated-04-paradigm.webp')

# Make the independent page point to the existing, more detailed PDF.
page_path = ROOT / 'pta-membership-optin.html'
page = page_path.read_text(encoding='utf-8')
page = page.replace('/assets/documents/pta-membership-optin-only-board-school-20260710.pdf', '/assets/documents/journal/pta-membership-optin-record.pdf')
page = page.replace('12ページの原資料です。', '21ページの詳細PDF版です。')
page_path.write_text(page, encoding='utf-8')

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


def banner(desc):
    return f'''\n{START}\n<a class="priority-optin-route" href="/pta-membership-optin.html" aria-label="最重要基幹ページ PTA加入はオプトイン以外では成立しない">\n  <span class="priority-optin-route__label">最重要基幹ページ</span>\n  <span class="priority-optin-route__title">PTA加入はオプトイン以外では成立しない</span>\n  <span class="priority-optin-route__text">{desc}</span>\n  <span class="priority-optin-route__link">図解・第69条全号・PDF原版を開く →</span>\n</a>\n{END}\n'''

changed = []
for rel, desc in routes.items():
    path = ROOT / rel
    text = path.read_text(encoding='utf-8')
    original = text
    if STYLE_LINK not in text:
        text = text.replace('</head>', STYLE_LINK + '\n</head>', 1)
    if START not in text:
        match = re.search(r'<main\b[^>]*>', text, re.I)
        if not match:
            raise SystemExit(f'missing <main>: {rel}')
        text = text[:match.end()] + banner(desc) + text[match.end():]
    if text != original:
        path.write_text(text, encoding='utf-8')
        changed.append(rel)

index_path = ROOT / 'data/site-search-index.js'
text = index_path.read_text(encoding='utf-8')
entry = '''  [\n    "PTA加入はオプトイン以外では成立しない",\n    "/pta-membership-optin.html",\n    "最重要基幹ページ。民法521条・522条、個人情報保護法61条・69条、PPC資料から、オプトアウト、学校名簿利用、PTA会費の代理徴収・会計事務が成立しない構造を注釈付き図解とPDFで整理。"\n  ],\n'''
if '"/pta-membership-optin.html"' not in text:
    text = text.replace('window.PTA_SITE_SEARCH_INDEX = [\n', 'window.PTA_SITE_SEARCH_INDEX = [\n' + entry, 1)
    index_path.write_text(text, encoding='utf-8')

site_path = ROOT / 'js/site.js'
text = site_path.read_text(encoding='utf-8')
row = "    ['PTA加入はオプトイン以外では成立しない', '/pta-membership-optin.html', '最重要基幹ページ。オプトイン、61条・69条、学校名簿、代理徴収・会計事務を統合整理'],\n"
if "'/pta-membership-optin.html'" not in text:
    text = text.replace('  var SITE_INDEX = [\n', '  var SITE_INDEX = [\n' + row, 1)
    site_path.write_text(text, encoding='utf-8')

sitemap = ROOT / 'sitemap.xml'
text = sitemap.read_text(encoding='utf-8')
block = '''  <url>\n    <loc>https://ptaorg.com/pta-membership-optin.html</loc>\n    <lastmod>2026-07-17</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n'''
if 'https://ptaorg.com/pta-membership-optin.html' not in text:
    text = text.replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + block, 1)
    sitemap.write_text(text, encoding='utf-8')

required = ['第1号', '第2号', '第3号', '第4号', '臨時的', '法令に基づく場合', '代理徴収・会計事務']
page = page_path.read_text(encoding='utf-8')
for token in required:
    if token not in page:
        raise SystemExit(f'missing core token: {token}')
for rel in routes:
    text = (ROOT / rel).read_text(encoding='utf-8')
    if text.count(START) != 1:
        raise SystemExit(f'route validation failed: {rel}')
print('generated annotated evidence and routes', len(changed))
