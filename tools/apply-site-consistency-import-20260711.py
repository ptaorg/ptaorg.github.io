from pathlib import Path

path = Path('css/hover-orange.css')
text = path.read_text(encoding='utf-8')
line = "@import url('/css/site-consistency.css?v=20260711');\n"
if line not in text:
    text = line + text
    path.write_text(text, encoding='utf-8')
    print('added site consistency import')
else:
    print('site consistency import already present')
