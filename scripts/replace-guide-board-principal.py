from pathlib import Path
import re

source = Path("scripts/fix-guide-board-news-full.py").read_text(encoding="utf-8")
css_match = re.search(r"css = r'''\n(.*?)\n'''", source, re.S)
section_match = re.search(r"section = r'''\n(.*?)\n'''", source, re.S)
if not css_match or not section_match:
    raise SystemExit("could not extract replacement CSS or section")

css = css_match.group(1)
section = section_match.group(1)
path = Path("guide-board.html")
html = path.read_text(encoding="utf-8")

style_id = "guide-board-principal-evidence-20260717"
if style_id not in html:
    if "</head>" not in html:
        raise SystemExit("missing </head>")
    html = html.replace("</head>", css + "\n</head>", 1)

start_marker = '<section id="principal-liability"'
start = html.find(start_marker)
if start < 0:
    raise SystemExit("existing principal-liability section not found")

# Find the matching closing section, accounting for nested section elements.
token_re = re.compile(r"<section\b|</section\s*>", re.I)
depth = 0
end = None
for match in token_re.finditer(html, start):
    token = match.group(0).lower()
    if token.startswith("<section"):
        depth += 1
    else:
        depth -= 1
        if depth == 0:
            end = match.end()
            break
if end is None:
    raise SystemExit("matching </section> not found")

old = html[start:end]
if "principal-risk-evidence-card" not in old and "principal-liability-evidence" not in old:
    raise SystemExit("refusing to replace an unexpected principal section")

# Remove the old section wherever it currently sits.
html = html[:start] + html[end:]

# Put the revised evidence directly after <main>, before the executive summary.
main_anchor = "<main>\n"
executive_anchor = '<section id="board-executive-brief"'
if main_anchor not in html or executive_anchor not in html:
    raise SystemExit("guide opening anchors not found")
html = html.replace(main_anchor, main_anchor + section + "\n", 1)

path.write_text(html, encoding="utf-8")
print(f"moved principal section to guide opening: old={len(old)} chars, new={len(section)} chars")
