from pathlib import Path
import re

PATH = Path("guide-board.html")
html = PATH.read_text(encoding="utf-8")

STYLE_ID = "guide-board-text-first-20260717"
if STYLE_ID in html:
    raise SystemExit("text-first revision already present")


def balanced_element(source: str, start_marker: str, tag: str):
    start = source.find(start_marker)
    if start < 0:
        raise ValueError(f"missing marker: {start_marker}")
    token_re = re.compile(rf"<{tag}\b|</{tag}\s*>", re.I)
    depth = 0
    end = None
    for match in token_re.finditer(source, start):
        token = match.group(0).lower()
        if token.startswith(f"<{tag}"):
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                end = match.end()
                break
    if end is None:
        raise ValueError(f"unclosed {tag}: {start_marker}")
    return start, end, source[start:end]


def remove_blocks(source: str, blocks):
    for start, end, _ in sorted(blocks, key=lambda item: item[0], reverse=True):
        source = source[:start] + source[end:]
    return source

# Use a restrained text hero instead of a decorative photograph.
hero_pattern = re.compile(
    r'\s*<div[^>]*class="page-hero-bg-img"[^>]*>\s*<img[^>]*>\s*</div>',
    re.S | re.I,
)
html, hero_count = hero_pattern.subn("", html, count=1)
if hero_count != 1:
    raise SystemExit(f"expected one hero background image, removed {hero_count}")

old_body = '<body class="guide-board-direct-fixed guide-board-editorial">'
new_body = '<body class="guide-board-direct-fixed guide-board-editorial guide-board-text-first">'
if old_body not in html:
    raise SystemExit("body class marker not found")
html = html.replace(old_body, new_body, 1)

style = r'''
<style id="guide-board-text-first-20260717">
body.guide-board-text-first .page-hero--photo{
  min-height:0!important;
  padding:58px 0 52px!important;
  background:linear-gradient(135deg,#12345a 0%,#1d527e 72%,#28678e 100%)!important;
}
body.guide-board-text-first .page-hero--photo::before,
body.guide-board-text-first .page-hero--photo::after{opacity:.28!important}
body.guide-board-text-first .page-hero-bg-img{display:none!important}
body.guide-board-text-first #board-executive-brief{padding-top:54px!important}
body.guide-board-text-first #principal-liability{padding-top:54px!important}
body.guide-board-text-first .gbv-head{margin-bottom:18px!important}
body.guide-board-text-first .principal-liability-explanation{margin-top:28px!important}
body.guide-board-text-first .principal-liability-meaning{margin-top:34px!important}
body.guide-board-text-first .principal-liability-full-evidence{margin-top:25px!important}
.board-visual-details{
  margin:28px 0 34px;
  border-top:1px solid #cbd5e1;
  border-bottom:1px solid #cbd5e1;
  background:#fff;
}
.board-visual-details>summary{
  position:relative;
  padding:17px 44px 17px 0;
  color:#17345c;
  font-size:.94rem;
  font-weight:900;
  line-height:1.65;
  cursor:pointer;
  list-style:none;
}
.board-visual-details>summary::-webkit-details-marker{display:none}
.board-visual-details>summary::after{
  content:"＋";
  position:absolute;
  top:50%;
  right:4px;
  transform:translateY(-50%);
  color:#9a6c00;
  font-size:1.35rem;
  font-weight:700;
}
.board-visual-details[open]>summary::after{content:"－"}
.board-visual-details[open]>summary{border-bottom:1px solid #e2e8f0}
.board-visual-details__body{padding:24px 0 8px}
.board-visual-details--compact{max-width:56rem;margin-top:32px}
.board-visual-details--compact .board-visual-details__body{padding:18px 0 4px}
body.guide-board-text-first .gbv-source{margin-top:32px!important}
@media(max-width:720px){
  body.guide-board-text-first .page-hero--photo{padding:44px 0 40px!important}
  body.guide-board-text-first #board-executive-brief,
  body.guide-board-text-first #principal-liability{padding-top:44px!important}
  .board-visual-details>summary{font-size:.9rem;padding-right:38px}
  .board-visual-details__body{padding-top:18px}
}
</style>
'''
if "</head>" not in html:
    raise SystemExit("missing </head>")
html = html.replace("</head>", style + "\n</head>", 1)

# Extract the two opening sections so they can be reorganized without touching the long article.
p_start, p_end, principal = balanced_element(html, '<section id="principal-liability"', "section")
e_start, e_end, executive = balanced_element(html, '<section id="board-executive-brief"', "section")

# In the school-information section, put all explanatory prose before the evidence image.
flow = balanced_element(principal, '<div class="principal-liability-flow"', "div")
meaning = balanced_element(principal, '<div class="principal-liability-meaning"', "div")
figure = balanced_element(principal, '<figure class="principal-liability-full-evidence"', "figure")
explanation = balanced_element(principal, '<div class="principal-liability-explanation"', "div")
principal_base = remove_blocks(principal, [flow, meaning, figure, explanation])
lead_marker = '<p class="principal-liability-lead">'
lead_start = principal_base.find(lead_marker)
if lead_start < 0:
    raise SystemExit("principal lead not found")
lead_end = principal_base.find("</p>", lead_start)
if lead_end < 0:
    raise SystemExit("principal lead closing tag not found")
lead_end += len("</p>")
optional_flow = (
    '\n<details class="board-visual-details board-visual-details--compact">\n'
    '  <summary>学校保有情報がPTA目的へ流れる構造を図で確認する</summary>\n'
    '  <div class="board-visual-details__body">\n'
    + flow[2]
    + '\n  </div>\n</details>\n'
)
principal_insert = (
    "\n\n" + explanation[2]
    + "\n\n" + meaning[2]
    + "\n\n" + figure[2]
    + optional_flow
)
principal = principal_base[:lead_end] + principal_insert + principal_base[lead_end:]

# In the executive brief, keep the written conclusion visible and place the large diagrams in details.
stack_start, stack_end, stack = balanced_element(executive, '<div class="gbv-stack">', "div")
open_end = stack.find(">") + 1
source_start, source_end, source = balanced_element(stack, '<div class="gbv-source">', "div")
visuals = stack[open_end:source_start].strip()
stack_tail = stack[source_end:stack.rfind("</div>")]
new_stack = (
    stack[:open_end]
    + '\n<details class="board-visual-details">\n'
      '  <summary>境界図・5領域の連鎖・相談対応フローを開く</summary>\n'
      '  <div class="board-visual-details__body">\n'
    + visuals
    + '\n  </div>\n</details>\n'
    + source
    + stack_tail
    + '\n</div>'
)
executive = executive[:stack_start] + new_stack + executive[stack_end:]

# Put the concise written brief first, followed by school-held information and the newspaper evidence.
original_blocks = [(p_start, p_end, principal), (e_start, e_end, executive)]
html = remove_blocks(html, original_blocks)
main_marker = "<main>"
main_pos = html.find(main_marker)
if main_pos < 0:
    raise SystemExit("main marker not found")
insert_at = main_pos + len(main_marker)
html = html[:insert_at] + "\n" + executive + "\n" + principal + html[insert_at:]

# Assertions guard against accidental loss or duplication.
checks = {
    "executive section": html.count('id="board-executive-brief"') == 1,
    "principal section": html.count('id="principal-liability"') == 1,
    "newspaper image": html.count('assets/guide-board/principal-liability-news.png') == 2,
    "newspaper figure": html.count('class="principal-liability-full-evidence"') == 1,
    "visual details": html.count('class="board-visual-details') >= 2,
    "hero photograph removed": 'class="page-hero-bg-img"' not in html,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("failed assertions: " + ", ".join(failed))

PATH.write_text(html, encoding="utf-8")
print("guide-board.html reordered to text-first layout")
