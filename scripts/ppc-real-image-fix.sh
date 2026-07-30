#!/usr/bin/env bash
set -euo pipefail

images=(
  assets/images/ppc-points/ppc-page-01-cover.jpg
  assets/images/ppc-points/ppc-page-03-overview.jpg
  assets/images/ppc-points/ppc-page-05-school-point1.jpg
  assets/images/ppc-points/ppc-page-08-temporary-note.jpg
  assets/images/ppc-points/ppc-page-11-consent.jpg
  assets/images/ppc-points/ppc-page-17-notes.jpg
)
for image in "${images[@]}"; do
  test -f "$image"
  file "$image"
  test "$(xxd -p -l 3 "$image")" = "ffd8ff"
  test "$(stat -c %s "$image")" -gt 20000
done

python <<'PY'
from pathlib import Path

html_path = Path('ppc-points.html')
html = html_path.read_text(encoding='utf-8')
assert 'class="ppc-source-figure"' not in html

def replace_once(old: str, new: str) -> None:
    global html
    count = html.count(old)
    assert count == 1, (count, old[:120])
    html = html.replace(old, new, 1)

replace_once(
    '<link rel="stylesheet" href="/css/prose.css?v=20260719">',
    '<link rel="stylesheet" href="/css/prose.css?v=20260719">\n<link rel="stylesheet" href="/css/pages/ppc-points.css?v=20260730">'
)
html = html.replace(
    '"name": "会費徴収と 学校徴収金の混在"',
    '"name": "PPC「公立学校とPTAの間で個人情報のやり取りをするためのポイント」の読み方"'
)

bluebar = '<div class="editorial-bluebar">この資料は、学校がPTAに情報を渡してよい場面を広げるものではなく、渡すために何を確認しなければならないかを示すものです。</div>'
lead = '''<div class="ppc-source-gallery" aria-label="PPC資料の主要ページ">
          <figure class="ppc-source-figure">
            <img src="/assets/images/ppc-points/ppc-page-01-cover.jpg" alt="個人情報保護委員会資料、公立学校とPTAの間で個人情報のやり取りをするためのポイントの表紙" loading="eager" decoding="async">
            <figcaption><strong>資料1ページ・表紙。</strong>個人情報保護委員会事務局が令和8年3月に公表した全17ページの資料です。</figcaption>
          </figure>
          <figure class="ppc-source-figure">
            <img src="/assets/images/ppc-points/ppc-page-03-overview.jpg" alt="PPC資料3ページ、個人情報保護法上気を付けるポイントの全体像" loading="eager" decoding="async">
            <figcaption><strong>資料3ページ・全体像。</strong>必要性、利用目的、目的外利用・提供の順に確認する構成です。</figcaption>
          </figure>
        </div>'''
replace_once(bluebar, bluebar + '\n\n        ' + lead)

quote5 = '''        <blockquote>
          <p>個人情報保護法上、学校には、法令の定める所掌事務又は業務の範囲内で、個人情報の「利用目的」をできる限り特定して保有するというルール（法第61条）と、特定した「利用目的」のためであれば、保有個人情報を利用又は提供することができるというルール（法第69条第１項）が適用されます。</p>
          <p class="quote-src">同資料5ページ</p>
        </blockquote>'''
figure5 = '''<figure class="ppc-source-figure">
          <img src="/assets/images/ppc-points/ppc-page-05-school-point1.jpg" alt="PPC資料5ページ、学校側のポイント1、利用目的の特定と法第61条・法第69条第1項の説明" loading="lazy" decoding="async">
          <figcaption><strong>資料5ページ。</strong>学校側のポイント1として、法第61条による利用目的の特定と、法第69条第1項による利用・提供の順序が示されています。</figcaption>
        </figure>'''
replace_once(quote5, quote5 + '\n\n        ' + figure5)

text11 = '<p>資料11ページも、公的規律の下では「特別の理由」があるとして<strong>臨時的に</strong>利用・提供する場合には本人同意は要件とならない、と同じ整理を繰り返しています。</p>'
figures8_11 = '''<div class="ppc-source-gallery" aria-label="法第69条第2項に関する資料の該当ページ">
          <figure class="ppc-source-figure">
            <img src="/assets/images/ppc-points/ppc-page-08-temporary-note.jpg" alt="PPC資料8ページ、本人同意と特別の理由はいずれも臨時的な利用・提供の規定との注記" loading="lazy" decoding="async">
            <figcaption><strong>資料8ページ。</strong>本人同意と特別の理由は、いずれも<strong>「臨時的」な利用・提供</strong>の規定であると明記されています。</figcaption>
          </figure>
          <figure class="ppc-source-figure">
            <img src="/assets/images/ppc-points/ppc-page-11-consent.jpg" alt="PPC資料11ページ、公的規律における本人同意と臨時的な利用・提供の説明" loading="lazy" decoding="async">
            <figcaption><strong>資料11ページ。</strong>特別の理由による利用・提供についても、臨時的な場面として整理されています。</figcaption>
          </figure>
        </div>'''
replace_once(text11, text11 + '\n\n        ' + figures8_11)

notes_text = '<p>資料自身が末尾（17ページ）で次のように述べています。</p>'
figure17 = '''<figure class="ppc-source-figure">
          <img src="/assets/images/ppc-points/ppc-page-17-notes.jpg" alt="PPC資料17ページ、公立学校とPTAの関係性を方向付ける趣旨ではないとの注意書き" loading="lazy" decoding="async">
          <figcaption><strong>資料17ページ。</strong>資料末尾に「公立学校とPTAの関係性を方向付ける趣旨ではありません」と明記されています。</figcaption>
        </figure>'''
replace_once(notes_text, notes_text + '\n\n        ' + figure17)
assert html.count('class="ppc-source-figure"') == 6
html_path.write_text(html, encoding='utf-8')

prose_path = Path('css/prose.css')
prose = prose_path.read_text(encoding='utf-8')
marker = '/* PPC points page: restore a clear document layout and show the cited source pages. */'
assert marker in prose
prose = prose.split(marker, 1)[0].rstrip() + '\n'
assert 'body.ppc-editorial section[id]::before' not in prose
prose_path.write_text(prose, encoding='utf-8')

css = '''/* PPC points page only. Source material is rendered with real img elements. */
body.ppc-editorial{background:#eef3f8;color:#1d2a34}
body.ppc-editorial .issue-main{width:min(100% - 32px,1040px);margin:0 auto;padding:28px 0 64px}
body.ppc-editorial .editorial-panel{margin:22px 0!important;padding:30px!important;background:#fff!important;border:1px solid #d5e0ea!important;border-radius:18px!important;box-shadow:0 10px 28px rgba(11,51,87,.08)!important}
body.ppc-editorial .editorial-panel:hover{background:#fff!important;border-color:#d5e0ea!important;box-shadow:0 10px 28px rgba(11,51,87,.08)!important}
body.ppc-editorial h1{color:#102a43;font-family:"Noto Serif JP",serif;font-size:clamp(1.65rem,3vw,2.25rem);line-height:1.5}
body.ppc-editorial h2{margin-top:1.8rem;padding-bottom:.45rem;border-bottom:2px solid #d6e7f4;color:#123b63;font-family:"Noto Serif JP",serif;font-size:clamp(1.3rem,2.4vw,1.7rem);line-height:1.55}
body.ppc-editorial h3{padding-left:.75rem;border-left:4px solid #0b6aa2;color:#123b63}
body.ppc-editorial :where(p,li){font-size:1rem;line-height:1.95}
body.ppc-editorial .editorial-bluebar{margin:1.25rem 0;padding:1.05rem 1.25rem;border-radius:14px;background:linear-gradient(90deg,#0b6aa2,#0b3357);color:#fff;font-weight:700;line-height:1.85;box-shadow:0 7px 18px rgba(11,51,87,.14)}
body.ppc-editorial .editorial-matrix{display:grid;grid-template-columns:minmax(170px,230px) 1fr;margin:1.2rem 0 1.6rem;overflow:hidden;border:1px solid #d7e1ea;border-radius:14px;background:#fff}
body.ppc-editorial .editorial-matrix-row{display:contents}
body.ppc-editorial .editorial-matrix-term,body.ppc-editorial .editorial-matrix-desc{padding:15px 17px;border-bottom:1px solid #e5edf3}
body.ppc-editorial .editorial-matrix-term{background:#f3f8fb;color:#123b63;font-weight:700}
.ppc-source-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin:1.5rem 0 2rem;align-items:start}
.ppc-source-figure{margin:1.5rem 0 2rem;padding:14px;background:#f8fbfd;border:1px solid #cbd7e2;border-radius:14px;box-shadow:0 6px 18px rgba(11,51,87,.07)}
.ppc-source-gallery .ppc-source-figure{margin:0}
.ppc-source-figure img{display:block;width:100%;max-width:100%;height:auto;margin:0 auto;background:#fff;border:1px solid #d5e0ea;border-radius:8px}
.ppc-source-figure figcaption{margin-top:.75rem;color:#334e68;font-size:.92rem;line-height:1.8}
@media(max-width:820px){body.ppc-editorial .issue-main{width:min(100% - 20px,1040px);padding:16px 0 48px}body.ppc-editorial .editorial-panel{padding:22px 16px!important;border-radius:14px!important}body.ppc-editorial .editorial-matrix,.ppc-source-gallery{grid-template-columns:1fr}}
'''
path = Path('css/pages/ppc-points.css')
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(css, encoding='utf-8')
PY

npm ci
npm run check:all

mkdir -p /tmp/ppc-browser
cd /tmp/ppc-browser
npm init -y >/dev/null
npm install playwright >/dev/null
npx playwright install chromium --with-deps
cd "$GITHUB_WORKSPACE"
python3 -m http.server 4173 >/tmp/ppc-http.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" >/dev/null 2>&1 || true' EXIT
sleep 2

cat > /tmp/ppc-browser/check-local.mjs <<'JS'
import fs from 'node:fs';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});const report={};
for(const v of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){const c=await browser.newContext({viewport:{width:v.width,height:v.height}});const p=await c.newPage();const errors=[];p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173/ppc-points.html',{waitUntil:'networkidle'});const r=await p.evaluate(()=>{const imgs=[...document.querySelectorAll('.ppc-source-figure img')];return{count:imgs.length,images:imgs.map(i=>({src:i.getAttribute('src'),complete:i.complete,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,renderedHeight:i.getBoundingClientRect().height})),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,before:getComputedStyle(document.querySelector('#lead'),'::before').content,after:getComputedStyle(document.querySelector('#lead'),'::after').content}});if(r.count!==6)throw new Error(`${v.name}: count ${r.count}`);for(const i of r.images)if(!i.complete||i.naturalWidth<500||i.naturalHeight<500||i.renderedHeight<100)throw new Error(`${v.name}: ${JSON.stringify(i)}`);if(r.scrollWidth>r.clientWidth)throw new Error(`${v.name}: overflow`);if(!['none','normal','""'].includes(r.before)||!['none','normal','""'].includes(r.after))throw new Error(`${v.name}: pseudo ${r.before} ${r.after}`);if(errors.length)throw new Error(errors.join(' | '));report[v.name]=r;await p.screenshot({path:`/tmp/ppc-local-${v.name}-top.png`,fullPage:false});await p.locator('#point2').scrollIntoViewIfNeeded();await p.screenshot({path:`/tmp/ppc-local-${v.name}-middle.png`,fullPage:false});if(v.name==='desktop'){await p.locator('#notes').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/ppc-local-desktop-bottom.png',fullPage:false})}await c.close()}await browser.close();fs.writeFileSync('/tmp/ppc-local-report.json',JSON.stringify(report,null,2)+'\n');
JS
cd /tmp/ppc-browser
node check-local.mjs
cd "$GITHUB_WORKSPACE"

rm -f \
  .github/workflows/ppc-real-image-fix.yml \
  .github/workflows/ppc-real-image-fix-pr.yml \
  scripts/ppc-real-image-fix.sh \
  .ppc-real-image-fix-trigger \
  .ppc-real-image-fix-pr-trigger \
  .ppc-png-render-trigger

git diff --check
git config user.name ptaorg
git config user.email noreply@ptaorg.com
git add ppc-points.html css/prose.css css/pages/ppc-points.css .github/workflows/ppc-real-image-fix.yml .github/workflows/ppc-real-image-fix-pr.yml scripts/ppc-real-image-fix.sh .ppc-real-image-fix-trigger .ppc-real-image-fix-pr-trigger .ppc-png-render-trigger
git commit -m 'PPC資料画像を実画像要素で正常表示'
commit_sha=$(git rev-parse HEAD)
echo "$commit_sha" >/tmp/ppc-final-commit.txt
git push origin HEAD:main

cat > /tmp/ppc-browser/check-public.mjs <<'JS'
import fs from 'node:fs';import {chromium} from 'playwright';
const commit=fs.readFileSync('/tmp/ppc-final-commit.txt','utf8').trim();const b=await chromium.launch({headless:true});let last='';for(let a=1;a<=30;a++){try{const out={};for(const v of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){const c=await b.newContext({viewport:{width:v.width,height:v.height}}),p=await c.newPage(),responses=[];p.on('response',r=>{if(r.url().includes('/assets/images/ppc-points/'))responses.push({url:r.url(),status:r.status(),contentType:r.headers()['content-type']||''})});await p.goto(`https://ptaorg.com/ppc-points.html?verify=${commit}&attempt=${a}`,{waitUntil:'networkidle',timeout:60000});const r=await p.evaluate(()=>{const imgs=[...document.querySelectorAll('.ppc-source-figure img')];return{count:imgs.length,images:imgs.map(i=>({src:i.src,complete:i.complete,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,renderedHeight:i.getBoundingClientRect().height})),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}});if(r.count!==6)throw new Error(`not deployed ${r.count}`);for(const i of r.images)if(!i.complete||i.naturalWidth<500||i.naturalHeight<500||i.renderedHeight<100)throw new Error(JSON.stringify(i));if(r.scrollWidth>r.clientWidth)throw new Error('overflow');if(responses.filter(x=>x.status!==200||!x.contentType.startsWith('image/jpeg')).length)throw new Error(JSON.stringify(responses));out[v.name]={...r,responses};await p.screenshot({path:`/tmp/ppc-public-${v.name}-top.png`,fullPage:false});await p.locator('#point2').scrollIntoViewIfNeeded();await p.screenshot({path:`/tmp/ppc-public-${v.name}-middle.png`,fullPage:false});if(v.name==='desktop'){await p.locator('#notes').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/ppc-public-desktop-bottom.png',fullPage:false})}await c.close()}fs.writeFileSync('/tmp/ppc-public-report.json',JSON.stringify({commit,out},null,2)+'\n');await b.close();process.exit(0)}catch(e){last=e?.stack||String(e);await new Promise(r=>setTimeout(r,10000))}}await b.close();throw new Error(last||'timeout');
JS
node /tmp/ppc-browser/check-public.mjs
