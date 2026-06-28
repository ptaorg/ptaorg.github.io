#!/usr/bin/env python3
"""Legacy one-off footer contact replacement script.

This script was formerly stored in SITE_STRUCTURE.md. It is kept only as
historical maintenance material and should not be run against the public site
without reviewing the current HTML structure first.
"""

import glob
import re

# 修正対象のHTMLファイル
html_files = glob.glob('*.html')
html_files.remove('post-template.html') if 'post-template.html' in html_files else None

# 検索パターン
old_pattern = r'(<h3>PTA適正化推進委員会</h3>\s*)<p>全国調査、教育委員会回答、学校文書、法制度整理をもとに、PTAをめぐる制度と実務を研究・整理するための公開サイトです。</p>\s*(<a href="https://yokomusubi\.city\.yokohama\.lg\.jp/.*?</a>)'

# 置換後のテキスト
new_text = r'''\1\2
                <div class="footer-contact">
                    <p>横浜市磯子区岡村8-17-5-301</p>
                    <p>070-9012-7772</p>
                    <p><a href="mailto:info@ptaorg.com">info@ptaorg.com</a></p>
                </div>'''

for html_file in html_files:
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # パターンマッチと置換
        new_content = re.sub(old_pattern, new_text, content, flags=re.DOTALL)

        # ファイルに書き戻し
        if new_content != content:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'✓ {html_file} を修正しました')
        else:
            print(f'- {html_file} は変更不要です')
    except Exception as e:
        print(f'✗ {html_file} でエラー: {e}')

print('\n完了')
