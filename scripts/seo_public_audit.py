#!/usr/bin/env python3
"""Audit public sitemap HTML and safely normalize existing search metadata.

Usage: python scripts/seo_public_audit.py [--apply] [--root PATH]
Default is read-only. Never changes body content or canonical URLs.
"""
import argparse
import html
import json
import re
from pathlib import Path
from urllib.parse import urlsplit, unquote
from xml.etree import ElementTree as ET

ORIGIN = "https://ptaorg.com"
ORG = ORIGIN + "/#organization"
SITE = ORIGIN + "/#website"
NAME = "PTA適正化推進委員会"
ROBOTS = "index,follow,max-snippet:-1,max-image-preview:large"
JSONLD = re.compile(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', re.I | re.S)
META = re.compile(r"<meta\b[^>]*>", re.I)
TITLE = re.compile(r"<title\b[^>]*>(.*?)</title>", re.I | re.S)
HEAD = re.compile(r"(<head\b[^>]*>)(.*?)(</head\s*>)", re.I | re.S)

def attrs(tag):
    return {m[0].lower(): html.unescape(m[2]) for m in re.findall(r'''([\w:-]+)\s*=\s*(["'])(.*?)\2''', tag, re.S)}

def walk(value):
    if isinstance(value, list):
        for v in value: walk(v)
    elif isinstance(value, dict):
        if value.get("@type") == "Organization" and value.get("name") == NAME:
            value["@id"] = ORG
            value["url"] = ORIGIN + "/"
        if value.get("@type") == "WebSite" and value.get("name") == NAME:
            value["@id"] = SITE
            value["url"] = ORIGIN + "/"
            value.setdefault("publisher", {"@id": ORG})
        for v in value.values(): walk(v)

def inspect(src, url):
    h = HEAD.search(src)
    if not h: return src, ["missing-head"], False
    head = h.group(2)
    issues = []
    tags = [attrs(t) for t in META.findall(head)]
    titles = TITLE.findall(head)
    if len(titles) != 1 or not titles[0].strip(): issues.append("missing-or-duplicate-title")
    descriptions = [t.get("content", "") for t in tags if t.get("name","").lower() == "description"]
    if len(descriptions) != 1 or not descriptions[0].strip(): issues.append("missing-or-duplicate-description")
    canonicals = [attrs(t).get("href","") for t in re.findall(r"<link\b[^>]*>",head,re.I) if "canonical" in attrs(t).get("rel","").lower().split()]
    if canonicals != [url]: issues.append("canonical-mismatch")
    directives = [t.get("content","").lower() for t in tags if t.get("name","").lower() in ("robots","googlebot","bingbot")]
    if any(re.search(r"\b(noindex|nofollow|nosnippet|none)\b|max-snippet\s*:\s*0", d) for d in directives):
        return src, issues+["restrictive-directive-preserved"], False
    if not any(t.get("name","").lower()=="robots" for t in tags):
        head += '\n<meta name="robots" content="'+ROBOTS+'">\n'
    if not any(t.get("property","").lower()=="og:site_name" for t in tags):
        head += '\n<meta property="og:site_name" content="'+NAME+'">\n'
    parsed = []
    for m in JSONLD.finditer(head):
        try: parsed.append(json.loads(m.group(1)))
        except json.JSONDecodeError: issues.append("invalid-jsonld")
    if "invalid-jsonld" in issues: return src, issues, False
    def replace(m):
        value = json.loads(m.group(1))
        before = json.dumps(value, ensure_ascii=False, sort_keys=True)
        walk(value)
        after = json.dumps(value, ensure_ascii=False, sort_keys=True)
        if before == after: return m.group(0)
        safe = json.dumps(value, ensure_ascii=False, separators=(",",":")).replace("</","<\\/")
        return m.group(0).replace(m.group(1), safe)
    head = JSONLD.sub(replace, head)
    if ORG not in head:
        node = {"@context":"https://schema.org","@type":"Organization","@id":ORG,"name":NAME,"url":ORIGIN+"/"}
        head += '\n<script type="application/ld+json">'+json.dumps(node, ensure_ascii=False)+'</script>\n'
    if not parsed: issues.append("no-original-page-schema")
    # Preserve canonical and body byte-for-byte; do not edit noindex or malformed JSON-LD.
    if "canonical-mismatch" in issues: return src, issues, False
    out = src[:h.start(2)] + head + src[h.end(2):]
    assert src[h.end(2):] == out[out.index(h.group(3), h.start(2)):], "body changed"
    return out, issues, out != src

def sitemap_urls(root):
    seen=set()
    for name in ("sitemap.xml","sitemap-research.xml"):
        f=root/name
        if not f.exists(): continue
        for elem in ET.parse(f).getroot().iter():
            if elem.tag.rsplit("}",1)[-1]=="loc" and elem.text:
                u=elem.text.strip()
                p=urlsplit(u)
                if p.scheme=="https" and p.netloc=="ptaorg.com" and (p.path.endswith(".html") or p.path=="/") and not p.query and not p.fragment:
                    if u not in seen: seen.add(u); yield u

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--apply",action="store_true")
    ap.add_argument("--root",type=Path,default=Path(__file__).resolve().parents[1])
    a=ap.parse_args()
    root=a.root.resolve()
    rows=[]
    for url in sitemap_urls(root):
        p=unquote(urlsplit(url).path).lstrip("/") or "index.html"
        f=(root/p).resolve()
        if not f.is_relative_to(root) or not f.is_file():
            rows.append({"url":url,"issues":["missing-file"],"change":False});continue
        # Reading/writing bytes preserves existing line endings.
        raw=f.read_bytes().decode("utf-8")
        out,issues,change=inspect(raw,url)
        if a.apply and change:
            check,_,again=inspect(out,url)
            if again or check!=out: raise RuntimeError("not idempotent: "+url)
            f.write_bytes(out.encode("utf-8"))
        rows.append({"url":url,"issues":issues,"change":change})
    print(json.dumps({"mode":"apply" if a.apply else "audit","pages":len(rows),"changed_or_proposed":sum(r["change"] for r in rows),"rows":rows},ensure_ascii=False,indent=2))
if __name__=="__main__": main()
