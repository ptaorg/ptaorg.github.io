from pathlib import Path
import re

TARGETS = {
    'guideline.html': 'guideline-editorial site-reviewed',
    'edu-board-separation.html': 'edu-board-separation-page site-reviewed',
    'education-board-responsibility.html': 'education-board-responsibility-page site-reviewed',
    'PTA運営適正化ガイドブック_第4版_改訂本文.html': 'guidebook-page site-reviewed',
}
LINK = '<link rel="stylesheet" href="/css/site-consistency.css?v=20260711">'

for name, required_classes in TARGETS.items():
    path = Path(name)
    if not path.exists():
        raise SystemExit(f'missing target: {name}')
    text = path.read_text(encoding='utf-8')
    if LINK not in text:
        if '</head>' not in text:
            raise SystemExit(f'closing head missing: {name}')
        text = text.replace('</head>', LINK + '\n</head>', 1)

    match = re.search(r'<body(?:\s+class="([^"]*)")?([^>]*)>', text)
    if not match:
        raise SystemExit(f'body tag missing: {name}')
    existing = (match.group(1) or '').split()
    for cls in required_classes.split():
        if cls not in existing:
            existing.append(cls)
    attrs = match.group(2) or ''
    replacement = f'<body class="{" ".join(existing)}"{attrs}>'
    text = text[:match.start()] + replacement + text[match.end():]
    path.write_text(text, encoding='utf-8')
    print(name)
