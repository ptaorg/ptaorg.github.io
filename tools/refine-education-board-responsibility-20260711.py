from pathlib import Path
import re

p = Path('education-board-responsibility.html')
s = p.read_text(encoding='utf-8')

replacements = {
    'PTA問題はなぜ教育委員会の所掌なのか｜PTA適正化推進委員会': '学校のPTA関与を教育委員会が点検する理由｜PTA適正化推進委員会',
    '<title>PTA問題はなぜ教育委員会の所掌なのか｜PTA適正化推進委員会</title>': '<title>学校のPTA関与を教育委員会が点検する理由｜PTA適正化推進委員会</title>',
    '<body class="thesis-page">': '<body class="thesis-page education-board-editorial">',
    '<div class="page-hero-kicker">Education Board Responsibility</div>': '<div class="page-hero-kicker">教育委員会・学校管理</div>',
    '<h1>PTA問題は、なぜ<br/><em>教育委員会の所掌</em>なのか</h1>': '<h1>学校のPTA関与を<br/><em>教育委員会が点検する理由</em></h1>',
    '<div class="section-kicker">Issue Chain</div>': '<div class="section-kicker">確認の連鎖</div>',
}
for old, new in replacements.items():
    if old not in s:
        raise SystemExit(f'missing replacement target: {old[:70]}')
    s = s.replace(old, new)

s, count = re.subn(r'\s*<div class="hero-actions">.*?</div>', '', s, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'hero actions: expected 1, found {count}')

s, count = re.subn(r'\s*<figure class="diagram-figure".*?</figure>', '', s, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'diagram: expected 1, found {count}')

s, count = re.subn(
    r'\s*<div class="ed-link-buttons">.*?</div>',
    '\n<p><a href="guide-board.html#board-jp-guideline">教育委員会向け実務指針と一次資料を確認する</a></p>',
    s,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit(f'resource buttons: expected 1, found {count}')

s, count = re.subn(r'\s*<div class="thesis-related">.*?</div>', '', s, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'thesis related: expected 1, found {count}')

css = r'''
<style id="education-board-responsibility-20260711">
.education-board-editorial .page-hero-kicker,
.education-board-editorial .section-kicker{padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;text-transform:none!important;letter-spacing:.04em!important}
.education-board-editorial .thesis-lead-section,
.education-board-editorial .thesis-section,
.education-board-editorial .editorial-section{padding:54px 0!important;border-bottom:1px solid #dbe4ee!important}
.education-board-editorial .thesis-grid{display:block!important;max-width:920px!important;margin:28px auto 0!important;border-top:2px solid var(--navy)!important}
.education-board-editorial .thesis-card{display:grid!important;grid-template-columns:54px minmax(0,1fr)!important;gap:0 18px!important;padding:22px 0!important;border:0!important;border-bottom:1px solid #cfd8e2!important;border-radius:0!important;box-shadow:none!important;background:transparent!important}
.education-board-editorial .thesis-card>span{grid-row:1 / span 2!important;align-self:start!important;padding:0!important;border:0!important;background:transparent!important;color:#64748b!important}
.education-board-editorial .thesis-card h3{margin:0 0 7px!important}
.education-board-editorial .thesis-card p{margin:0!important;line-height:1.9!important}
.education-board-editorial .thesis-callout,
.education-board-editorial .editorial-bluebar{margin:24px 0!important;padding:20px 0 20px 22px!important;border:0!important;border-left:5px solid var(--gold)!important;border-radius:0!important;box-shadow:none!important;background:#f8fafc!important;color:var(--text)!important}
.education-board-editorial .ed-resource-list{display:block!important;border-top:1px solid #cfd8e2!important}
.education-board-editorial .ed-resource-list>div{display:block!important;padding:18px 0!important;border-bottom:1px solid #cfd8e2!important;border-radius:0!important;background:transparent!important}
.education-board-editorial .thesis-steps{padding-left:1.3rem!important}
.education-board-editorial .thesis-steps li{padding:14px 0!important;border-bottom:1px solid #dbe4ee!important;line-height:1.9!important}
@media(max-width:700px){.education-board-editorial .thesis-card{grid-template-columns:40px minmax(0,1fr)!important;gap:0 12px!important}}
</style>
'''
if '</head>' not in s:
    raise SystemExit('closing head not found')
s = s.replace('</head>', css + '</head>', 1)

p.write_text(s, encoding='utf-8')
