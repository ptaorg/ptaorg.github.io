"""Page frame for ported pages: pulls the legacy title block out of the body and rebuilds it
in the new design (page hero with map, two-column layout, generated table of contents,
basic-info box and related links). Body text itself is not changed."""
import json, re, html as htmllib
from pathlib import Path
from bs4 import BeautifulSoup

E = htmllib.escape
HERO_CLS = re.compile(r'(hero|banner|masthead|cover|page-head|pagehead|title-block|doc-head|article-head|intro-head|form-head)', re.I)
KICKER_CLS = re.compile(r'(kicker|eyebrow|category|page-label|hero-label|overline|journal-tag|doc-type|lead-kicker)', re.I)
LEAD_CLS = re.compile(r'(lead|sub|desc|summary|intro|deck|standfirst)', re.I)
META_CLS = re.compile(r'(meta|date|updated|byline|revision|reviewed|time|published)', re.I)
TOC_CLS = re.compile(r'(^|[-_ ])(toc|index-nav|anchor-nav|page-index|case-anchor-nav|privacy-index|board-response-index)([-_ ]|$)', re.I)
JP = re.compile(r'[぀-ヿ㐀-鿿]')


def _text(el):
    return re.sub(r'\s+', ' ', el.get_text(' ', strip=True)) if el else ''


def extract_title_block(soup, fallback_title):
    """Remove kicker / h1 / lead / meta from the body and return them."""
    h1 = soup.find('h1')
    if not h1:
        return {'kicker': '', 'h1': fallback_title, 'lead': '', 'meta': ''}
    hero = None
    for anc in h1.parents:
        if anc is None or anc.name in ('[document]', 'main', 'body') or 'legacy-main' in (anc.get('class') or []):
            break
        cls = ' '.join(anc.get('class') or [])
        if anc.name == 'header' or HERO_CLS.search(cls):
            hero = anc
    scope = hero if hero is not None else h1.parent
    title = _text(h1) or fallback_title
    heading_id = h1.get('id', '')
    kicker = ''
    before = set(id(x) for x in h1.find_all_previous())
    for el in scope.find_all(True):
        if el is h1 or h1 in el.parents:
            continue
        cls = ' '.join(el.get('class') or [])
        if KICKER_CLS.search(cls) and 0 < len(_text(el)) <= 48 and id(el) in before:
            kicker = _text(el)
            el.decompose()
            break
    lead = ''
    if hero is not None:
        cands = [el for el in h1.find_all_next(['p', 'div']) if hero in el.parents]
    else:
        cands = [sib for sib in h1.find_next_siblings(limit=2) if sib.name in ('p', 'div')]
    for el in cands:
        cls = ' '.join(el.get('class') or [])
        t = _text(el)
        if not t or META_CLS.search(cls) or el.find(['a', 'button', 'ul', 'ol', 'table', 'img', 'h2']) is not None:
            continue
        if (LEAD_CLS.search(cls) or hero is not None) and len(t) <= 420 and JP.search(t):
            lead = t
            el.decompose()
            break
    meta = ''
    for el in (hero.find_all(True) if hero is not None else []):
        cls = ' '.join(el.get('class') or [])
        if META_CLS.search(cls) and 0 < len(_text(el)) <= 160 and not el.find(['a', 'button']):
            meta = _text(el)
            el.decompose()
            break
    h1.decompose()
    if hero is not None:
        rest = _text(hero)
        if not rest:
            hero.decompose()
        else:
            hero['class'] = (hero.get('class') or []) + ['legacy-hero-rest']
    return {'kicker': kicker, 'h1': title, 'h1_id': heading_id, 'lead': lead, 'meta': meta}


def build_toc(soup):
    heads = []
    for i, h in enumerate(soup.find_all('h2')):
        t = _text(h)
        if not t or len(t) > 90:
            continue
        if any(p.name in ('nav', 'aside', 'footer') for p in h.parents):
            continue
        if not h.get('id'):
            sec = h.find_parent('section')
            if sec is not None and sec.get('id') and _text(sec.find('h2')) == t:
                hid = sec['id']
            else:
                hid = f'sec-{i + 1}'
                h['id'] = hid
        else:
            hid = h['id']
        t = re.sub(r'^(?:第?[0-9０-９]+[章節]?|[0-9０-９]+\s*[/／.．、)）])\s*', '', t) or t
        heads.append((hid, t if len(t) <= 40 else t[:38] + '…'))
    # legacy in-body tables of contents duplicate the generated one
    if len(heads) >= 3:
        for el in soup.find_all(['nav', 'div', 'aside', 'section']):
            cls = ' '.join(el.get('class') or [])
            label = el.get('aria-label') or ''
            links = el.find_all('a', href=True)
            if links and all(a['href'].startswith('#') for a in links) and (TOC_CLS.search(cls) or '目次' in label or (el.name == 'nav' and len(links) >= 3)):
                el['class'] = (el.get('class') or []) + ['legacy-toc']
    return heads


def info_pairs(soup):
    pairs = []
    for box in soup.select('.archive-box'):
        lb, vl = box.select_one('.archive-label'), box.select_one('.archive-value')
        if lb and vl:
            pairs.append((_text(lb), _text(vl)))
    for card in soup.select('.meta-card'):
        lb, vl = card.select_one('.lb'), card.select_one('.vl')
        if lb and vl:
            pairs.append((_text(lb), _text(vl)))
    return pairs[:8]


def map_block(map_info):
    if not map_info:
        return ''
    pref, xy, name = map_info
    attrs = f' data-map-pref="{E(pref)}"'
    if xy:
        attrs += f' data-map-pin="{xy[0]},{xy[1]}" data-map-label="{E(name)}"'
    return f'<div class="page-hero-map" aria-hidden="true" data-map{attrs}></div>'


def hero_html(*, prefix, crumbs, label, tb, map_info, date='', image=True):
    crumb = f'<li><a href="{prefix}index.html">トップ</a></li>'
    for lab, href in crumbs[:-1]:
        crumb += f'<li><a href="{prefix}{href}">{E(lab)}</a></li>' if href else f'<li>{E(lab)}</li>'
    crumb += f'<li aria-current="page">{E(crumbs[-1][0])}</li>'
    kick = tb['kicker'] or label
    if map_info:
        visual = f'<div class="article-visual article-visual-map">{map_block(map_info)}</div>'
    elif image:
        visual = '<div class="article-visual paper-ornament" aria-hidden="true"></div>'
    else:
        visual = ''
    meta = []
    if date:
        meta.append(f'<span><svg aria-hidden="true"><use href="#i-calendar"/></svg>{E(date)}</span>')
    meta.append('<span><svg aria-hidden="true"><use href="#i-pen"/></svg>PTA適正化推進委員会</span>')
    meta.append(f'<span class="label">{E(label)}</span>')
    heading_id = tb.get('h1_id')
    heading_attr = f' id="{E(heading_id)}"' if heading_id else ''
    out = [f'<section class="article-hero"><div class="container">',
           f'<nav class="breadcrumb" aria-label="パンくず"><ol>{crumb}</ol></nav>',
           f'<div class="article-hero-grid{" no-visual" if not visual else ""}"><div class="article-hero-text">',
           f'<span class="label">{E(kick)}</span>', f'<h1{heading_attr}>{E(tb["h1"])}</h1>']
    if tb['lead']:
        out.append(f'<p class="page-lead">{E(tb["lead"])}</p>')
    out.append(f'<p class="article-meta">{"".join(meta)}</p>')
    if tb['meta'] and tb['meta'] != date:
        out.append(f'<p class="page-meta">{E(tb["meta"])}</p>')
    out += ['</div>', visual, '</div></div></section>']
    return '\n'.join(out)


TOPIC_CHIPS = [('任意加入・退会', 'membership.html'), ('会費徴収', 'fee-collection.html'), ('個人情報の利用', 'privacy.html'), ('教職員の関与', 'personnel.html'), ('学校施設・媒体', 'facilities.html'), ('学校とPTAの境界', 'framework.html')]


def side_html(*, prefix, toc, pairs, related, map_info, chips=True):
    parts = []
    if map_info:
        return _side_region(prefix, toc, pairs, related, map_info)
    if toc:
        items = ''.join(f'<li><a href="#{E(h)}"><span class="toc-no">{i:02d}</span><span>{E(t)}</span></a></li>' for i, (h, t) in enumerate(toc, 1))
        parts.append(f'<nav class="side-box side-toc" aria-label="目次"><h2><svg aria-hidden="true"><use href="#i-list"/></svg>目次</h2><ol class="toc-list">{items}</ol></nav>')
    if pairs:
        rows = ''.join(f'<dt>{E(a)}</dt><dd>{E(b)}</dd>' for a, b in pairs)
        parts.append(f'<section class="side-box"><h2><svg aria-hidden="true"><use href="#i-pin"/></svg>基本情報</h2><dl class="info-table">{rows}</dl></section>')
    if related:
        items = ''.join(f'<li><a href="{prefix}{E(h)}">{E(t)}<svg aria-hidden="true"><use href="#i-chevron"/></svg></a></li>' for t, h in related[:6])
        parts.append(f'<section class="side-box"><h2><svg aria-hidden="true"><use href="#i-doc"/></svg>関連資料</h2><ul class="side-links">{items}</ul></section>')
    if chips:
        c = ''.join(f'<a class="chip" href="{prefix}{h}">{E(t)}</a>' for t, h in TOPIC_CHIPS)
        parts.append(f'<section class="side-box"><h2><svg aria-hidden="true"><use href="#i-tag"/></svg>関連する論点</h2><div class="chip-row">{c}</div></section>')
    return '\n'.join(parts)


def _side_region(prefix, toc, pairs, related, map_info):
    pref, xy, name = map_info
    parts = []
    if pairs:
        rows = ''.join(f'<dt>{E(a)}</dt><dd>{E(b)}</dd>' for a, b in pairs)
        parts.append(f'<section class="side-box"><h2><svg aria-hidden="true"><use href="#i-pin"/></svg>{E(name)}の基本情報</h2><dl class="info-table">{rows}</dl><p class="side-note">※ 地図の位置は自治体の概略位置です。学校の所在地ではありません。</p></section>')
    if related:
        items = ''.join(f'<li><a href="{prefix}{E(h)}"><svg aria-hidden="true"><use href="#i-folder"/></svg>{E(t)}<svg aria-hidden="true"><use href="#i-chevron"/></svg></a></li>' for t, h in related[:6])
        parts.append(f'<section class="side-box"><h2><svg aria-hidden="true"><use href="#i-search"/></svg>この自治体の資料を探す</h2><ul class="side-links">{items}</ul></section>')
    if toc:
        items = ''.join(f'<li><a href="#{E(h)}"><span class="toc-no">{i:02d}</span><span>{E(t)}</span></a></li>' for i, (h, t) in enumerate(toc, 1))
        parts.append(f'<nav class="side-box side-toc" aria-label="目次"><h2><svg aria-hidden="true"><use href="#i-list"/></svg>目次</h2><ol class="toc-list">{items}</ol></nav>')
    return '\n'.join(parts)


def pager_html(*, prefix, prev, nxt, readmore):
    out = []
    if prev or nxt:
        out.append('<nav class="pager" aria-label="前後のページ">')
        out.append(f'<a class="button button-secondary" href="{prefix}{E(prev[1])}"><svg class="flip" aria-hidden="true"><use href="#i-chevron"/></svg><span><small>前へ</small>{E(prev[0])}</span></a>' if prev else '<span></span>')
        out.append(f'<a class="button button-secondary" href="{prefix}{E(nxt[1])}"><span><small>次へ</small>{E(nxt[0])}</span><svg aria-hidden="true"><use href="#i-chevron"/></svg></a>' if nxt else '<span></span>')
        out.append('</nav>')
    if readmore:
        cards = ''.join(f'<a href="{prefix}{E(h)}">{E(t)}<svg aria-hidden="true"><use href="#i-chevron"/></svg></a>' for t, h in readmore[:3])
        out.append(f'<section class="readmore"><h2><svg aria-hidden="true"><use href="#i-book"/></svg>あわせて読みたい</h2><div class="readmore-grid">{cards}</div></section>')
    return '\n'.join(out)


def toc_mobile(toc):
    if not toc:
        return ''
    items = ''.join(f'<li><a href="#{E(h)}">{E(t)}</a></li>' for h, t in toc)
    return f'<details class="toc-mobile"><summary>このページの目次（{len(toc)}項目）</summary><ol class="toc-list">{items}</ol></details>'
