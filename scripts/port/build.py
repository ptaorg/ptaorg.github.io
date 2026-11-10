#!/usr/bin/env python3
"""Port captured legacy ptaorg.github.io pages into this site with the new header/footer.

Usage:
  python3 scripts/port/build.py <legacy-checkout> <capture-dir> [--node-path DIR]

* Page bodies are kept as they are (no text shortening); only legacy chrome is replaced.
* Legacy CSS is scoped under `.legacy` (scripts/port/prefix-css.mjs) so it cannot touch the new chrome.
* Root-absolute and https://ptaorg.com/ links are rewritten to relative links inside this site.
* Only files referenced by ported pages are copied.
"""
import hashlib, json, os, re, shutil, subprocess, sys, html as htmllib
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit, unquote, quote
from bs4 import BeautifulSoup
sys.path.insert(0, str(Path(__file__).resolve().parent))
import frame

ROOT = Path(__file__).resolve().parents[2]
LEGACY = Path(sys.argv[1]).resolve()
CAPTURE = Path(sys.argv[2]).resolve()
NODE_PATH = sys.argv[sys.argv.index('--node-path') + 1] if '--node-path' in sys.argv else os.environ.get('NODE_PATH', '')
SITE_HOSTS = ('https://ptaorg.com', 'http://ptaorg.com', 'https://www.ptaorg.com', 'https://ptaorg.github.io', 'http://ptaorg.github.io')
CHROME_CSS = {'/css/global-nav.css', '/css/global-footer.css', '/css/scroll-top.css', '/css/shared/current-location-nav.css'}
CHROME_JS = re.compile(r'(site\.js|scroll-top\.js|site-search-index\.js|googletagmanager|analytics\.js|site-core-v90|current-location-nav|seo-analytics|home-enhance|archive-notice)')
NEW_PAGES = {'index.html', 'explore.html', 'municipality.html', 'school.html'}
GTAG = 'G-0D18ZSSLMH'

copied = set()        # legacy-relative paths copied verbatim
css_done = {}         # legacy css path -> output path
inline_css = {}       # hash -> (text, count)

def rel_prefix(page_rel):
    depth = len(PurePosixPath(page_rel).parts) - 1
    return '../' * depth

def legacy_exists(p):
    return (LEGACY / p).is_file() or (LEGACY / p / 'index.html').is_file()

def resolve(url, page_rel):
    """Return legacy-root-relative path for a same-site URL, or None if external/anchor."""
    if not url or url.startswith(('#', 'mailto:', 'tel:', 'javascript:', 'data:', 'blob:')):
        return None
    u = url
    for h in SITE_HOSTS:
        if u.startswith(h + '/') or u == h:
            u = u[len(h):] or '/'
            break
    else:
        if re.match(r'^[a-z][a-z0-9+.-]*:', u, re.I) or u.startswith('//'):
            return None
    parts = urlsplit(u)
    path = unquote(parts.path)
    if path.startswith('/'):
        target = path.lstrip('/')
    else:
        target = str(PurePosixPath(page_rel).parent / path) if path else page_rel
        target = os.path.normpath(target).replace('\\', '/')
        if target == '.':
            target = ''
        if target.startswith('..'):
            return None
    return target, parts.query, parts.fragment, path.endswith('/') or path == ''

def rewrite_url(url, page_rel, refs):
    r = resolve(url, page_rel)
    if r is None:
        return url
    target, query, frag, is_dir = r
    if target in ('', 'index.html'):
        out = 'index.html'
    else:
        out = target
        if not legacy_exists(target.rstrip('/')) and not (ROOT / target).exists():
            # unknown on both sides: keep pointing at the canonical site
            return 'https://ptaorg.com/' + quote(target, safe='/#?=&') + (('?' + query) if query else '') + (('#' + frag) if frag else '')
        if (LEGACY / target).is_file():
            refs.add(target)
        elif (LEGACY / target.rstrip('/') / 'index.html').is_file():
            refs.add(target.rstrip('/') + '/index.html')
    rel = os.path.relpath(out, str(PurePosixPath(page_rel).parent) or '.').replace('\\', '/')
    if is_dir and out not in ('index.html',) and not rel.endswith('/'):
        rel += '/'
    if out == 'index.html' and target == '' and rel == 'index.html':
        rel = 'index.html'
    rel = quote(rel, safe='/._-~%')
    return rel + (('?' + query) if query else '') + (('#' + frag) if frag else '')

URL_ATTRS = ('href', 'src', 'poster', 'action', 'data-src', 'data-href', 'data-pdf', 'data-url')

def rewrite_html(fragment, page_rel, refs):
    soup = BeautifulSoup(fragment, 'html.parser')
    for el in soup.find_all(True):
        for a in URL_ATTRS:
            if el.has_attr(a) and isinstance(el[a], str):
                el[a] = rewrite_url(el[a].strip(), page_rel, refs)
        if el.has_attr('srcset'):
            el['srcset'] = ', '.join(
                ' '.join([rewrite_url(p.strip().split(' ')[0], page_rel, refs)] + p.strip().split(' ')[1:])
                for p in el['srcset'].split(',') if p.strip())
        if el.has_attr('style'):
            el['style'] = re.sub(r'url\((["\']?)([^)"\']+)\1\)', lambda m: f'url({m.group(1)}{rewrite_url(m.group(2), page_rel, refs)}{m.group(1)})', el['style'])
        if el.name == 'a' and el.get('target') == '_blank' and el.has_attr('href') and not re.match(r'^(https?:)?//', el['href']) and not re.search(r'\.(pdf|xlsx?|docx?|pptx?|zip|csv)($|[?#])', el['href'], re.I):
            del el['target']
    return soup

def rewrite_css_urls(text, css_rel, refs):
    def fix(m):
        q, u = m.group(1), m.group(2).strip()
        if u.startswith(('data:', '#')):
            return m.group(0)
        return f'url({q}{rewrite_url(u, css_rel, refs)}{q})'
    return re.sub(r'url\(\s*(["\']?)([^)"\']+)\1\s*\)', fix, text)

def prefix_css(text):
    p = subprocess.run(['node', '-e', "import(process.argv[1]).then(m=>{let s='';process.stdin.on('data',d=>s+=d).on('end',()=>process.stdout.write(m.prefixCss(s)))})", str(ROOT / 'scripts/port/prefix-css.mjs')],
                       input=text.encode(), capture_output=True, env={**os.environ, 'NODE_PATH': NODE_PATH}, check=True)
    return p.stdout.decode()

def port_css(href, page_rel, refs):
    """Return relative href to a scoped copy of a legacy stylesheet, or the href itself if external."""
    if href.startswith('http'):
        return href
    r = resolve(href, page_rel)
    if r is None:
        return None
    target = r[0]
    if '/' + target in CHROME_CSS or not (LEGACY / target).is_file():
        return None
    if target not in css_done:
        refs_css = set()
        text = (LEGACY / target).read_text(encoding='utf-8', errors='ignore')
        text = rewrite_css_urls(text, target, refs_css)
        (ROOT / target).parent.mkdir(parents=True, exist_ok=True)
        (ROOT / target).write_text(prefix_css(text), encoding='utf-8')
        css_done[target] = refs_css
    refs.update(css_done[target])
    return os.path.relpath(target, str(PurePosixPath(page_rel).parent) or '.').replace('\\', '/')

JS_ROOT_RE = re.compile(r'(["\'`])(?:https?://(?:www\.)?ptaorg\.(?:com|github\.io))?/(?=(?:data|assets|js|css|journal|archive|research|board-responses|docs|kit|forms|downloads|source-pdfs|audit|starter-kit|[\w.-]+\.html)\b)')

def port_js(target, refs):
    if target in copied:
        return
    text = (LEGACY / target).read_text(encoding='utf-8', errors='ignore')
    for m in re.finditer(r'["\'`](?:https?://ptaorg\.com)?/((?:data|assets)/[^"\'`?#\s]+)', text):
        if (LEGACY / m.group(1)).is_file():
            refs.add(m.group(1))
    text = JS_ROOT_RE.sub(lambda m: '(window.__ROOT||"")+' + m.group(1), text)
    out = ROOT / target
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding='utf-8')
    copied.add(target)

SECTIONS = [
    ('regions', '地域・学校から探す', 'explore.html', r'^(archive/|research/|national-archive|research-map|research-index|research\.html|national-materials)'),
    ('database', 'データベース', 'board-responses.html', r'^(board-responses|administrative-materials|key-materials|kurume-)'),
    ('journal', '論考', 'journal.html', r'^(journal|pta-history|pta-future|report|timeline|cases|case-reading|reality|compliance|claim-evidence)'),
    ('roles', '立場から探す', None, r'^(guide-|kit/|board-brief|submit-to-board|submission-kit|board-pta-chain|pta-officer-chain)'),
    ('resources', '資料・書式', 'documents.html', r'^(documents|document\.html|forms/|downloads/|starter-kit/|pta-membership-template|pta-addon|audit/|docs/|evidence-checklist|pta-application-chain)'),
    ('about', '団体情報', 'about.html', r'^(about|contact|support|privacy-policy|popc|404)'),
    ('topics', '論点から探す', 'framework.html', r'.'),
]

def section_for(rel):
    for key, label, hub, pat in SECTIONS:
        if re.search(pat, rel):
            return key, label, hub
    return 'topics', '論点から探す', 'framework.html'

def clean_title(t):
    t = re.sub(r'\s*[｜|]\s*PTA適正化推進委員会\s*$', '', (t or '').strip())
    t = re.sub(r'\s*[|｜-]\s*PTA適正化推進委員会.*$', '', t)
    return t.strip() or 'PTA適正化推進委員会'

def redirect_target(rel, source):
    m = re.search(r'http-equiv=["\']refresh["\'][^>]*content=["\'][^"\']*url=([^"\']+)', source, re.I)
    if m:
        return m.group(1).strip()
    if len(source) < 6000:
        m = re.search(r'location\.replace\(\s*["\']([^"\']+)["\']', source)
        if m:
            return m.group(1)
        m = re.search(r"var target = '([^']+)'", source)
        if m:
            return m.group(1)
    return None

def rootify(fragment, prefix):
    if not prefix:
        return fragment
    return re.sub(r'(\s(?:href|src)=")(?!https?:|mailto:|tel:|#|/|data:)([^"]+)"', lambda m: f'{m.group(1)}{prefix}{m.group(2)}"', fragment)

SEARCH = '''<div class="container"><form class="search-panel search-panel-bar" action="{p}explore.html" method="get" role="search"><div class="search-panel-title"><svg aria-hidden="true"><use href="#i-search"/></svg><div><h2>資料・記録を検索する</h2><p>全国の調査・通知・回答・学校資料を横断検索できます。</p></div></div><div class="search-panel-body"><div class="search-field"><label class="sr-only" for="site-q">キーワード</label><svg aria-hidden="true"><use href="#i-search"/></svg><input type="search" id="site-q" name="q" placeholder="例：横浜市、学校徴収、個人情報、教育委員会回答" autocomplete="off"><button type="submit">検索</button></div><div class="search-filters"><label>資料種別<select name="tab"><option value="">すべての資料</option><option value="municipality">自治体の調査</option><option value="school">学校の資料</option><option value="response">教育委員会の回答</option><option value="page">解説・論考ページ</option></select></label><label>論点<select name="topic"><option value="">すべて</option><option value="membership">任意加入・入会</option><option value="fee">会費徴収</option><option value="privacy">個人情報の利用・提供</option><option value="staff">教職員の関与</option><option value="facilities">学校施設の利用</option><option value="correction">行政の指導・是正</option></select></label></div></div><div class="search-panel-side"><a href="{p}explore.html">詳細検索<svg aria-hidden="true"><use href="#i-chevron"/></svg></a></div></form></div>'''
HEADER = (ROOT / 'partials/header.html').read_text(encoding='utf-8').strip()
FOOTER = (ROOT / 'partials/footer.html').read_text(encoding='utf-8').strip()
PINS = json.loads((ROOT / 'data/map-pins.json').read_text(encoding='utf-8'))
REGIONS = {m['id']: m for m in json.loads((ROOT / 'data/research-map-index.json').read_text(encoding='utf-8'))['municipalities']}
RESPONSES = {r['no']: r for r in json.loads((ROOT / 'data/board-responses.json').read_text(encoding='utf-8'))['responses']}
JOURNAL = json.loads((ROOT / 'data/journal-index.json').read_text(encoding='utf-8'))['articles']
TOPIC_PAGES = [('任意加入・退会', 'membership.html'), ('会費徴収', 'fee-collection.html'), ('個人情報の利用・提供', 'privacy.html'), ('教職員の関与', 'personnel.html'), ('学校施設・媒体', 'facilities.html'), ('学校とPTAの境界', 'framework.html'), ('法制度マップ', 'law-map.html')]
ROLE_PAGES = [('保護者の方へ', 'guide-parent.html'), ('PTA役員の方へ', 'guide-pta.html'), ('学校・教育委員会の方へ', 'guide-board.html'), ('研究者・記者の方へ', 'guide-research.html'), ('教育委員会へ提出する資料', 'submit-to-board.html')]
INDEX_DATE = json.loads((ROOT / 'data/research-map-index.json').read_text(encoding='utf-8')).get('updated', '')

def page_shell(*, rel, title, desc, canonical, og_image, jsonld, css_links, inline_styles, body_cls, body_attrs, content, scripts, crumbs, section, label, tb, map_info, toc, pairs, related, wide, date, pager):
    p = rel_prefix(rel)
    e = htmllib.escape
    head = [
        '<!doctype html>', '<html lang="ja">', '<head>',
        '  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
        f'  <title>{e(title)}｜PTA適正化推進委員会</title>',
        f'  <meta name="description" content="{e(desc)}">' if desc else '',
        f'  <link rel="canonical" href="{e(canonical)}">' if canonical else '',
        f'  <meta property="og:title" content="{e(title)}"><meta property="og:type" content="article"><meta property="og:site_name" content="PTA適正化推進委員会">',
        f'  <meta property="og:description" content="{e(desc)}">' if desc else '',
        f'  <meta property="og:image" content="{e(og_image)}">' if og_image else '',
        *[f'  <script type="application/ld+json">{j}</script>' for j in jsonld],
        f'  <script async src="https://www.googletagmanager.com/gtag/js?id={GTAG}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag("js",new Date());gtag("config","{GTAG}");</script>',
        f'  <script>window.__ROOT={json.dumps(p)};</script>',
        '  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        '  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@600;700&display=swap">',
        f'  <link rel="stylesheet" href="{p}assets/style.css">',
        *[f'  <link rel="stylesheet" href="{e(h)}">' for h in css_links],
        *[f'  <style>{s}</style>' for s in inline_styles],
        f'  <link rel="stylesheet" href="{p}assets/legacy-theme.css">',
        f'  <script defer src="{p}assets/app.js"></script><script defer src="{p}assets/legacy.js"></script>',
        '</head>']
    attrs = ''.join(f' {k}="{e(v)}"' for k, v in body_attrs)
    hero = frame.hero_html(prefix=p, crumbs=crumbs, label=label, tb=tb, map_info=map_info, date=date, image=not wide)
    if section in ('journal', 'topics'):
        hero += '\n<div class="container"><p class="article-notice"><svg aria-hidden="true"><use href="#i-info"/></svg>本稿は当委員会による研究・検討資料です。個別の判断にあたっては、最新の法令・通知と原資料を確認してください。</p></div>'
    side = '' if wide else frame.side_html(prefix=p, toc=toc, pairs=pairs, related=related, map_info=map_info)
    legacy = f'<div class="legacy {e(body_cls)}"{attrs}><div class="legacy-body {e(body_cls)}">\n{content}\n</div></div>'
    search = SEARCH.replace('{p}', p)
    LIST_MAPS = {'board-responses.html': ('responses', '教育委員会の回答（全国）', '緑のピンが回答のあった自治体・都道府県です。押すとその回答ページへ移動します。'),
                 'national-archive.html': ('schools', '学校別資料のある自治体', 'ピンの数字はその自治体で登録している学校の数です。押すと学校の一覧へ移動します。'),
                 'research-index.html': ('regions', '自治体別の研究', 'ピンを押すとその自治体の調査ページへ移動します。')}
    listmap = ''
    if rel in LIST_MAPS:
        kind, ttl, note = LIST_MAPS[rel]
        listmap = (f'<div class="container"><section class="list-map-block"><h2><svg aria-hidden="true"><use href="#i-pin"/></svg>{ttl}を地図で見る<span class="map-count" data-map-count></span></h2>'
                   f'<div class="list-map" data-list-map="{kind}" role="img" aria-label="{ttl}の所在地を示した日本地図"></div>'
                   f'<p class="map-note">{note} 位置は自治体の概略位置です。</p></section></div>')
    if side and map_info:
        # region pages: hero with map, search, content left / info right (自治体別調査の型)
        layout = f'{search}<div class="container"><div class="detail-layout region-layout"><div class="detail-main">{frame.toc_mobile(toc)}{legacy}</div><aside class="detail-side">{side}</aside></div>{pager}</div>'
        body_main = f'<main id="main">\n{hero}\n{layout}\n</main>'
    elif side:
        # articles: search, hero, notice, table of contents left (研究・論考の型)
        layout = f'<div class="container"><div class="article-layout"><aside class="article-side">{side}</aside><div class="article-main">{frame.toc_mobile(toc)}{legacy}</div></div>{pager}</div>'
        body_main = f'<main id="main">\n{search}\n{hero}\n{listmap}\n{layout}\n</main>'
    else:
        layout = f'<div class="legacy-wide">{legacy}</div><div class="container">{pager}</div>'
        body_main = f'<main id="main">\n{search}\n{hero}\n{listmap}\n{layout}\n</main>'
    main_id = 'main'
    header = rootify(HEADER, p).replace('<span data-index-date>公開済み索引</span>', f'<span data-index-date>{INDEX_DATE}時点の公開済み索引</span>' if INDEX_DATE else '<span data-index-date>公開済み索引</span>')
    body = [
        f'<body data-page="legacy" data-section="{section}" data-root="{p}">',
        f'  <a class="skip-link" href="#{main_id}">本文へ移動</a>',
        header,
        body_main,
        rootify(FOOTER, p),
        *scripts,
        '</body>', '</html>']
    return '\n'.join(x for x in head if x) + '\n' + '\n'.join(body) + '\n'

def sequences(pages):
    by = {pg['rel']: pg for pg in pages}
    groups = {}
    jorder = [a['url'].replace('https://ptaorg.com/', '') for a in JOURNAL]
    for pg in pages:
        r = pg['rel']
        if r.startswith('journal/') and r in jorder:
            g = 'journal'
        elif r.startswith('board-responses/'):
            g = 'responses'
        elif r.startswith('archive/'):
            g = '/'.join(r.split('/')[:2])
        elif r.startswith('research/'):
            g = 'research'
        elif r in [h for _, h in TOPIC_PAGES]:
            g = 'topics'
        elif r in [h for _, h in ROLE_PAGES]:
            g = 'roles'
        else:
            g = None
        if g:
            groups.setdefault(g, []).append(r)
    order = {'journal': lambda L: sorted(L, key=lambda r: -jorder.index(r)), 'topics': lambda L: [h for _, h in TOPIC_PAGES if h in L], 'roles': lambda L: [h for _, h in ROLE_PAGES if h in L]}
    nav = {}
    for g, L in groups.items():
        L = order.get(g, sorted)(L)
        for i, r in enumerate(L):
            short = lambda x: by[x]['name'] if len(by[x]['name']) <= 30 else by[x]['name'][:28] + '…'
            prev = (short(L[i - 1]), L[i - 1]) if i > 0 else None
            nxt = (short(L[i + 1]), L[i + 1]) if i + 1 < len(L) else None
            nav[r] = (prev, nxt)
    out = {}
    for pg in pages:
        prev, nxt = nav.get(pg['rel'], (None, None))
        rm = [(t, h) for t, h in pg['related'] if not h.startswith(('explore.html', 'municipality.html'))][:3]
        out[pg['rel']] = (prev, nxt, rm)
    return out

def redirect_page(rel, target_url):
    p = rel_prefix(rel)
    refs = set()
    t = rewrite_url(target_url, rel, refs)
    return refs, f'<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>移動しました｜PTA適正化推進委員会</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url={htmllib.escape(t)}"><link rel="canonical" href="{htmllib.escape(t)}"></head><body><p><a href="{htmllib.escape(t)}">移動先のページへ</a></p></body></html>\n'

def main():
    caps = sorted(CAPTURE.glob('*.json'))
    all_refs = set()
    pages_out = []
    report = {'ported': 0, 'redirects': 0, 'raw': 0}
    for f in caps:
        d = json.loads(f.read_text(encoding='utf-8'))
        rel = d['path']
        source = (LEGACY / rel).read_text(encoding='utf-8', errors='ignore')
        tgt = redirect_target(rel, source)
        out = ROOT / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        if tgt:
            refs, txt = redirect_page(rel, tgt)
            all_refs |= refs
            out.write_text(txt, encoding='utf-8')
            report['redirects'] += 1
            continue
        refs = set()
        soup = rewrite_html(d['html'], rel, refs)
        for el in soup.select('nav.loc-trail, nav.crumbs, nav.research-breadcrumb, nav.navlinks'):
            el.decompose()
        # stylesheets
        css_links = []
        for h in d.get('css') or []:
            if not h or 'fonts.googleapis.com/css2?family=Noto' in h:
                continue
            ph = port_css(h.split('?')[0] if not h.startswith('http') else h, rel, refs)
            if ph and ph not in css_links:
                css_links.append(ph)
        inline_styles = []
        for st in d.get('styles') or []:
            txt = rewrite_css_urls(st['text'], rel, refs)
            hsh = hashlib.sha1(txt.encode()).hexdigest()[:12]
            inline_css.setdefault(hsh, [txt, 0])
            inline_css[hsh][1] += 1
            inline_styles.append(hsh)
        # scripts
        scripts = []
        src_soup = BeautifulSoup(source, 'lxml')
        if d.get('raw'):
            report['raw'] += 1
            for s in src_soup.find_all('script'):
                if s.get('type') == 'application/ld+json':
                    continue
                if s.get('src'):
                    src = s['src']
                    if CHROME_JS.search(src):
                        continue
                    if src.startswith('http'):
                        scripts.append(f'<script src="{htmllib.escape(src)}"></script>')
                        continue
                    r = resolve(src.split('?')[0], rel)
                    if r and (LEGACY / r[0]).is_file():
                        port_js(r[0], refs)
                        scripts.append(f'<script src="{os.path.relpath(r[0], str(PurePosixPath(rel).parent) or ".")}"></script>')
                else:
                    t = s.string or ''
                    if 'gtag(' in t or 'dataLayer' in t or not t.strip():
                        continue
                    scripts.append('<script>' + JS_ROOT_RE.sub(lambda m: '(window.__ROOT||"")+' + m.group(1), t) + '</script>')
        else:
            for s in src_soup.find_all('script'):
                if s.get('src') or s.get('type') == 'application/ld+json':
                    continue
                t = s.string or ''
                if 'gtag(' in t or 'dataLayer' in t or not t.strip():
                    continue
                scripts.append('<script>' + JS_ROOT_RE.sub(lambda m: '(window.__ROOT||"")+' + m.group(1), t) + '</script>')
        key, label, hub = section_for(rel)
        title = clean_title(d.get('title'))
        # legacy <main> becomes a div: the new page owns the single <main> landmark
        for m in soup.find_all('main'):
            m.name = 'div'
            m['class'] = ['legacy-main'] + (m.get('class') or [])
        tb = frame.extract_title_block(soup, title)
        name = tb['h1'] or title
        if len(name) > 48:
            name = title if len(title) <= 48 else name[:46] + '…'
        crumbs = [(label, hub), (name, None)]
        map_info, related, pairs = None, [], frame.info_pairs(soup)
        parts = rel.split('/')
        region = None
        if parts[0] in ('archive', 'research') and len(parts) >= 2:
            slug = parts[1].replace('.html', '')
            region = REGIONS.get(slug) or REGIONS.get('archive-' + slug)
        if region:
            pin = PINS['regions'].get(region['id']) or PINS['prefs'].get(region['prefecture'])
            map_info = (region['prefecture'], pin, region['name'])
            if parts[0] == 'archive':
                if region.get('url'):
                    related.append((f"{region['name']}の研究ノート", region['url'].lstrip('/')))
                related.append((f"{region['name']}の調査（自治体別）", f"municipality.html?id={region['id']}"))
                related.append((f"{region['name']}の他の学校", f"explore.html?tab=school&q={quote(region['name'])}"))
                pairs = [('都道府県', region['prefecture']), ('自治体', region['name'])] + [p for p in pairs if p[0] != '自治体']
            else:
                related.append((f"{region['name']}の調査（自治体別）", f"municipality.html?id={region['id']}"))
                related.append((f"{region['name']}の学校別資料", f"explore.html?tab=school&q={quote(region['name'])}"))
            related.append(('全国資料館', 'national-archive.html'))
        m = re.match(r'board-responses/(\d+)-', rel)
        if m and int(m.group(1)) in RESPONSES:
            r = RESPONSES[int(m.group(1))]
            pin = PINS['responses'].get(str(int(m.group(1)))) or PINS['prefs'].get(r.get('prefecture', ''))
            map_info = (r.get('prefecture', ''), pin, r['municipality'])
            pairs = [('都道府県', r.get('prefecture', '')), ('回答元', r['municipality']), ('回答日', r.get('date') or '記載なし'), ('種別', (r.get('typeLabel') or '').replace('A:', '').replace('C:', ''))] + pairs
            related = [('教育委員会回答データベース', 'board-responses.html'), (f"{r.get('prefecture', '')}の回答を探す", f"explore.html?tab=response&pref={quote(r.get('prefecture', ''))}"), ('照会書・申入書の文例', 'documents.html')]
        if not related:
            if key == 'topics':
                related = [(t, h) for t, h in TOPIC_PAGES if h != rel]
            elif key == 'roles':
                related = [(t, h) for t, h in ROLE_PAGES if h != rel]
            elif key == 'journal':
                related = [(a['title'][:40] + ('…' if len(a['title']) > 40 else ''), a['url'].replace('https://ptaorg.com/', '')) for a in JOURNAL if not a['url'].endswith('/' + rel)][:5] + [('論考一覧', 'journal.html')]
            elif key == 'database':
                related = [('教育委員会回答データベース', 'board-responses.html'), ('行政資料', 'administrative-materials.html'), ('全国の資料を探す', 'explore.html')]
            elif key == 'resources':
                related = [('文例・提出書式', 'documents.html'), ('運営チェック', 'audit/'), ('教育委員会へ提出する資料', 'submit-to-board.html')]
        related = [(t, h) for t, h in related if h.rstrip('/') != rel.replace('index.html', '').rstrip('/')]
        date = ''
        for j in d.get('jsonld') or []:
            mm = re.search(r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})', j)
            if mm:
                date = mm.group(1); break
        if not date:
            rv = dict(d.get('bodyAttrs') or []).get('data-reviewed', '')
            if re.match(r'\d{4}-\d{2}-\d{2}$', rv):
                date = '改訂 ' + rv
        toc = frame.build_toc(soup) if not d.get('raw') else []
        if len(toc) < 3:
            toc = []
        content = str(soup)
        canonical = d.get('canonical') or ('https://ptaorg.com/' + rel.replace('index.html', ''))
        og = d.get('ogImage') or ''
        pages_out.append(dict(rel=rel, title=title, desc=d.get('description', ''), canonical=canonical if canonical.startswith('http') else 'https://ptaorg.com' + canonical,
                              og_image=og if og.startswith('http') else ('https://ptaorg.com' + og if og.startswith('/') else og),
                              jsonld=d.get('jsonld') or [], css_links=css_links, inline_styles=inline_styles,
                              body_cls=d.get('bodyClass', ''), body_attrs=d.get('bodyAttrs') or [], content=content,
                              scripts=scripts, crumbs=crumbs, section=key, label=label, tb=tb, map_info=map_info,
                              toc=toc, pairs=pairs, related=related, wide=bool(d.get('raw')), date=date, name=name))
        all_refs |= refs
        report['ported'] += 1
    # shared inline styles become files
    (ROOT / 'css/legacy-inline').mkdir(parents=True, exist_ok=True)
    shared = {}
    for hsh, (txt, n) in inline_css.items():
        if n >= 2:
            (ROOT / f'css/legacy-inline/{hsh}.css').write_text(prefix_css(txt), encoding='utf-8')
            shared[hsh] = True
    seq_nav = sequences(pages_out)
    prefixed_cache = {}
    for pg in pages_out:
        links = list(pg['css_links'])
        styles = []
        for hsh in pg['inline_styles']:
            if hsh in shared:
                links.append(os.path.relpath(f'css/legacy-inline/{hsh}.css', str(PurePosixPath(pg['rel']).parent) or '.'))
            else:
                if hsh not in prefixed_cache:
                    prefixed_cache[hsh] = prefix_css(inline_css[hsh][0])
                styles.append(prefixed_cache[hsh])
        html_out = page_shell(rel=pg['rel'], title=pg['title'], desc=pg['desc'], canonical=pg['canonical'], og_image=pg['og_image'],
                              jsonld=pg['jsonld'], css_links=links, inline_styles=styles, body_cls=pg['body_cls'], body_attrs=pg['body_attrs'],
                              content=pg['content'], scripts=pg['scripts'], crumbs=pg['crumbs'], section=pg['section'],
                              label=pg['label'], tb=pg['tb'], map_info=pg['map_info'], toc=pg['toc'], pairs=pg['pairs'], related=pg['related'], wide=pg['wide'],
                              date=pg['date'], pager=frame.pager_html(prefix=rel_prefix(pg['rel']), prev=seq_nav[pg['rel']][0], nxt=seq_nav[pg['rel']][1], readmore=seq_nav[pg['rel']][2]))
        (ROOT / pg['rel']).write_text(html_out, encoding='utf-8')
    # copy referenced non-html files (and html files that are not ported pages, e.g. templates)
    ported = {pg['rel'] for pg in pages_out}
    port_js('data/site-search-index.js', all_refs)
    queue = sorted(all_refs)
    seen = set()
    while queue:
        r = queue.pop()
        if r in seen or r in ported or r in NEW_PAGES:
            continue
        seen.add(r)
        srcp = LEGACY / r
        if not srcp.is_file():
            continue
        if r.endswith('.js'):
            more = set(); port_js(r, more); queue.extend(more - seen); continue
        if r.endswith('.css'):
            more = set(); port_css('/' + r, 'index.html', more); queue.extend(more - seen); continue
        dst = ROOT / r
        if dst.exists() and r.startswith('data/') and r.endswith('.json'):
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(srcp, dst)
        copied.add(r)
    report['copied_files'] = len(copied)
    report['css_files'] = len(css_done)
    report['shared_inline_css'] = len(shared)
    print(json.dumps(report, ensure_ascii=False))
    (ROOT / 'scripts/port/last-build.json').write_text(json.dumps({'report': report, 'pages': sorted(ported), 'copied': sorted(copied), 'css': sorted(css_done)}, ensure_ascii=False, indent=1), encoding='utf-8')

if __name__ == '__main__':
    main()
