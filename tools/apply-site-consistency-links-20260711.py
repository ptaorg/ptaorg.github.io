from pathlib import Path

root = Path('.')
marker = '<link rel="stylesheet" href="/css/site-consistency.css?v=20260711">'
changed = []
for path in root.rglob('*.html'):
    if any(part in {'.git', 'node_modules', 'visual-audit-output'} for part in path.parts):
        continue
    text = path.read_text(encoding='utf-8')
    if marker in text:
        continue
    if '</head>' not in text:
        continue
    text = text.replace('</head>', marker + '\n</head>', 1)
    path.write_text(text, encoding='utf-8')
    changed.append(str(path))

print(f'linked consistency stylesheet in {len(changed)} HTML files')
for item in changed[:30]:
    print(item)
if len(changed) > 30:
    print(f'... and {len(changed) - 30} more')
