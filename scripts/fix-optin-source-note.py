from pathlib import Path

path = Path('pta-membership-optin.html')
text = path.read_text(encoding='utf-8')
replacements = {
    'PDF第4頁を用い、': '詳細PDFの該当頁を用い、',
    'PDF第6頁を用い、': '詳細PDFの該当頁を用い、',
    'PDF第7頁を用い、': '詳細PDFの該当頁を用い、',
    'PDF第11頁を用い、': '詳細PDFの該当頁を用い、',
    '21ページの詳細PDF版です。提出、研修、全校点検、校長・教頭・事務職員への説明に使用できます。': '本ページは、教育委員会・学校向け12ページ資料の論旨をWebで再構成しています。PDFリンクは、同じ論旨を代理徴収・会計委任まで拡張した21ページの詳細版です。提出、研修、全校点検、校長・教頭・事務職員への説明に使用できます。',
}
for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'missing replacement target: {old}')
    text = text.replace(old, new)
path.write_text(text, encoding='utf-8')
print('updated opt-in source and figure wording')
