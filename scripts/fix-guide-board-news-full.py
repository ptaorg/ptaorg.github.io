from pathlib import Path

path = Path("guide-board.html")
html = path.read_text(encoding="utf-8")

style_id = "guide-board-principal-evidence-20260717"
section_id = "principal-liability"
if style_id in html:
    raise SystemExit("style already exists")
if f'id="{section_id}"' in html:
    raise SystemExit("principal section already exists; refusing duplicate insertion")

css = r'''
<style id="guide-board-principal-evidence-20260717">
body.guide-board-editorial #principal-liability{
  display:block!important;
  background:#fff!important;
  padding:66px 0 74px!important;
  border-top:0!important;
  border-bottom:1px solid #d7dee8!important;
}
.principal-liability-wrap{
  width:min(calc(100% - 48px),960px);
  margin-inline:auto;
}
.principal-liability-label{
  margin:0 0 10px!important;
  color:#6b7788!important;
  font-size:.78rem!important;
  font-weight:900!important;
  letter-spacing:.08em!important;
}
#principal-liability-title{
  margin:0 0 18px!important;
  padding:0 0 15px!important;
  border:0!important;
  border-bottom:3px solid #d6a724!important;
  color:#172033!important;
  font-family:'Noto Serif JP',serif!important;
  font-size:clamp(1.55rem,2.8vw,2.18rem)!important;
  line-height:1.48!important;
}
.principal-liability-lead{
  max-width:56rem;
  margin:0!important;
  color:#334155!important;
  font-size:1rem!important;
  line-height:2!important;
}
.principal-liability-flow{
  display:grid;
  grid-template-columns:minmax(0,1fr) 46px minmax(0,1fr) 46px minmax(0,1fr);
  align-items:center;
  margin:30px 0 34px;
  padding:20px 0;
  border-top:1px solid #d8dee8;
  border-bottom:1px solid #d8dee8;
}
.principal-liability-flow-item{
  min-width:0;
  padding:0 16px;
}
.principal-liability-flow-item strong{
  display:block;
  margin-bottom:5px;
  color:#17345c;
  font-size:.95rem;
  line-height:1.55;
}
.principal-liability-flow-item span{
  display:block;
  color:#526276;
  font-size:.84rem;
  line-height:1.7;
}
.principal-liability-flow-arrow{
  color:#b44b42;
  font-size:1.5rem;
  font-weight:700;
  text-align:center;
}
.principal-liability-meaning{
  margin:0 0 30px;
  padding:4px 0 4px 20px;
  border-left:4px solid #d6a724;
}
.principal-liability-meaning h3,
.principal-liability-explanation h3{
  margin:0 0 10px!important;
  padding:0!important;
  border:0!important;
  color:#17345c!important;
  font-size:1.12rem!important;
  line-height:1.6!important;
}
.principal-liability-meaning p,
.principal-liability-explanation p{
  margin:0 0 14px!important;
  color:#334155!important;
  font-size:.96rem!important;
  line-height:1.95!important;
}
.principal-liability-full-evidence{
  width:min(100%,680px);
  margin:32px auto 34px;
  padding:0;
  overflow:visible!important;
  background:transparent!important;
  border:0!important;
  border-radius:0!important;
  box-shadow:none!important;
}
.principal-liability-full-evidence a{
  display:block;
  width:max-content;
  max-width:100%;
  margin:0 auto;
  background:#fff;
}
.principal-liability-full-evidence img{
  display:block!important;
  width:auto!important;
  max-width:100%!important;
  height:auto!important;
  max-height:none!important;
  margin:0 auto!important;
  object-fit:contain!important;
  object-position:center!important;
  border:2px solid #dc2626!important;
  border-radius:0!important;
  background:#fff!important;
  box-shadow:none!important;
}
.principal-liability-full-evidence figcaption{
  margin-top:13px;
  padding-top:12px;
  border-top:1px solid #d8dee8;
  color:#5d6878;
  font-size:.84rem;
  line-height:1.8;
}
.principal-liability-full-evidence figcaption a{
  display:inline;
  width:auto;
  margin:0;
  color:#064f91;
  font-weight:800;
  text-decoration:underline;
  text-underline-offset:3px;
}
.principal-liability-explanation{
  max-width:56rem;
  margin:0;
}
.principal-liability-explanation ul{
  margin:18px 0 0;
  padding:18px 0 0 1.35rem;
  border-top:1px solid #d8dee8;
  color:#334155;
}
.principal-liability-explanation li{
  margin:.5em 0;
  padding-left:.2em;
  font-size:.94rem;
  line-height:1.85;
}
.principal-liability-caution{
  margin:22px 0 0!important;
  padding:16px 18px!important;
  border-left:4px solid #64748b!important;
  background:#f8fafc!important;
  color:#475569!important;
  font-size:.88rem!important;
  line-height:1.85!important;
}
@media(max-width:720px){
  body.guide-board-editorial #principal-liability{padding:48px 0 56px!important}
  .principal-liability-wrap{width:min(calc(100% - 32px),960px)}
  .principal-liability-flow{grid-template-columns:1fr;padding:8px 0}
  .principal-liability-flow-item{padding:15px 0}
  .principal-liability-flow-arrow{transform:rotate(90deg);line-height:1}
  .principal-liability-full-evidence{margin:26px auto 30px}
}
</style>
'''

section = r'''
<section id="principal-liability" aria-labelledby="principal-liability-title">
  <div class="principal-liability-wrap">
    <p class="principal-liability-label">学校保有情報・管理者責任</p>
    <h2 id="principal-liability-title">学校保有情報の扱いは、校長の管理責任に直結する</h2>
    <p class="principal-liability-lead">公立学校が児童・保護者情報を収集し、保有し、利用する場面では、その管理主体は学校と教育委員会です。PTAが学校とは別の任意団体である以上、学校の情報をPTAの会員管理、役員選出、会費徴収、地区班編成、連絡等へ使うときは、「PTA活動への協力」という説明だけで済ませることはできません。</p>

    <div class="principal-liability-flow" aria-label="学校保有情報がPTA目的に利用される場合の責任の流れ">
      <div class="principal-liability-flow-item"><strong>学校保有情報</strong><span>氏名、住所、連絡先、学年、学級、兄弟姉妹情報等</span></div>
      <div class="principal-liability-flow-arrow" aria-hidden="true">→</div>
      <div class="principal-liability-flow-item"><strong>PTA目的で利用・提供</strong><span>会員名簿、役員候補、会費、地区班、非会員把握等</span></div>
      <div class="principal-liability-flow-arrow" aria-hidden="true">→</div>
      <div class="principal-liability-flow-item"><strong>学校側の管理問題</strong><span>利用目的、本人同意、提供記録、服務・守秘義務</span></div>
    </div>

    <div class="principal-liability-meaning">
      <h3>この新聞資料が示すこと</h3>
      <p>2021年6月、大分市内の小学校長が、児童の個人情報を本人の意思に反してPTA等へ提供した疑いで、地方公務員法上の守秘義務違反として書類送検されたと報じられました。この事案の重要点は、PTA内部の運営が問題にされたというより、学校が保有する情報を学校側がどう扱ったかが、校長の服務と管理責任に結び付いたことです。</p>
      <p>したがって教育委員会は、「PTAは任意団体なので関与できない」として終えるのではなく、学校が情報を取得・保有・利用・提供した部分を自らの監督対象として確認する必要があります。</p>
    </div>

    <figure class="principal-liability-full-evidence" id="principal-liability-evidence">
      <a href="assets/guide-board/principal-liability-news.png" target="_blank" rel="noopener" aria-label="新聞切り抜きの原寸画像を開く">
        <img src="assets/guide-board/principal-liability-news.png" alt="学校がPTA等に児童の個人情報を無断提供した疑いで校長が書類送検されたと報じる新聞記事の切り抜き" loading="eager">
      </a>
      <figcaption>提供資料。大分合同新聞2021年6月26日付「学校PTAに情報無断提供　守秘義務違反の疑いで　校長を書類送検」。<a href="https://www.oita-press.co.jp/1010000000/2021/06/26/JD0060372709" target="_blank" rel="noopener">掲載記事</a>。書類送検は有罪確定を意味しません。<a href="https://news.allabout.co.jp/articles/o/73578/?page=2" target="_blank" rel="noopener">後の二次報道</a>では不起訴とされています。本資料は個別事件の有罪・違法を断定するためではなく、学校保有情報の利用根拠、同意、記録を学校側が確認すべきことを示す参考資料として掲載しています。</figcaption>
    </figure>

    <div class="principal-liability-explanation">
      <h3>教育委員会が確認すべきなのは、PTAの自治ではなく、学校側の情報利用です</h3>
      <p>PTAが必要とする会員情報は、本来、PTAが入会申込時に会員本人から直接取得します。学校在籍情報からPTA会員関係は生じません。入会申込記録がないまま学校名簿を基礎に会員名簿を作成したり、学校の口座振替情報を使ってPTA会費を徴収したり、非会員を学校情報との照合で抽出したりする運用は、学校保有情報の利用目的と学校の所掌事務から点検しなければなりません。</p>
      <p>本人同意があると説明する場合も、同意書の有無だけでは足りません。何の情報を、誰に、何の目的で提供するのかが明示され、不同意を自由に選べ、不同意者の情報が確実に除外され、提供記録が残っているかを確認する必要があります。</p>
      <ul>
        <li>学校が保有する児童・保護者情報を、PTA又はPTA役員へ提供しているか。</li>
        <li>学校自身が、その情報をPTAの会員管理、会費徴収、役員選出、地区班編成、非会員把握等に利用しているか。</li>
        <li>利用目的、本人同意、提供項目、提供先、提供年月日、担当者の記録が存在するか。</li>
        <li>不同意者・非加入者の情報を削除又はマスキングできる運用になっているか。</li>
        <li>担任、教頭、事務職員が、PTA文書の配布・回収・集計、名簿作成、未納確認等に関与しているか。</li>
        <li>学校連絡アプリ、学校メール、児童経由配布、学校徴収金システムをPTA目的に利用しているか。</li>
      </ul>
      <p class="principal-liability-caution">確認対象はPTAの議決や役員人事そのものではありません。学校が管理する個人情報、職員、施設、徴収システム、連絡手段がPTA内部事務に使われている部分です。ここは教育委員会と校長の権限・責任の範囲内です。</p>
    </div>
  </div>
</section>
'''

if "</head>" not in html:
    raise SystemExit("missing </head>")
if "<main>" not in html:
    raise SystemExit("missing <main>")
if '<section id="board-executive-brief"' not in html:
    raise SystemExit("missing executive section anchor")

html = html.replace("</head>", css + "\n</head>", 1)
html = html.replace("<main>\n", "<main>\n" + section + "\n", 1)
path.write_text(html, encoding="utf-8")
print("updated", path, "bytes", path.stat().st_size)
