/* site.js v84 navigation cleanup */
(function(){
  var initialPath=location.pathname+location.search;
  var allowAutoTop=!location.hash;
  try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(e){}
  function forceTop(){
    if(!allowAutoTop) return;
    try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(e){ try{ window.scrollTo(0,0); }catch(_){} }
  }
  function forceTopBurst(ms){
    var end=Date.now()+ms;
    forceTop();
    var timer=setInterval(function(){
      if(!allowAutoTop || Date.now()>end){ clearInterval(timer); return; }
      forceTop();
    },120);
  }
  ['wheel','touchstart','keydown','mousedown'].forEach(function(ev){
    window.addEventListener(ev,function(){ allowAutoTop=false; },{once:true,passive:true});
  });
  function scrollToHashTarget(){
    if(!location.hash) return;
    var id=location.hash.slice(1);
    try{ id=decodeURIComponent(id); }catch(e){}
    if(!id) return;
    var el=document.getElementById(id);
    if(!el) return;
    var parentDetails=el.closest&&el.closest('details');
    if(parentDetails) parentDetails.open=true;
    if(el.tagName&&el.tagName.toLowerCase()==='details') el.open=true;
    allowAutoTop=false;
    var header=document.querySelector('.site-header,.nav-container');
    var offset=(header?header.getBoundingClientRect().height:0)+18;
    var y=el.getBoundingClientRect().top+(window.pageYOffset||document.documentElement.scrollTop||0)-offset;
    try{ window.scrollTo({top:Math.max(0,y),left:0,behavior:'auto'}); }catch(e){ try{ window.scrollTo(0,Math.max(0,y)); }catch(_){} }
  }
  function scheduleHashScroll(){
    if(!location.hash) return;
    [0,80,260,700,1400].forEach(function(ms){ setTimeout(scrollToHashTarget,ms); });
  }
  window.addEventListener('hashchange',function(){ allowAutoTop=false; scheduleHashScroll(); },{passive:true});
  window.addEventListener('pageshow',function(){ if(!location.hash && (location.pathname+location.search)===initialPath) forceTopBurst(2200); });
  if(location.hash) scheduleHashScroll(); else forceTopBurst(2600);

  var TRIP_LOCATIONS=[
    {name:'札幌市',lat:43.0621,lng:141.3544},{name:'仙台市',lat:38.2682,lng:140.8694},{name:'いわき市',lat:37.0504,lng:140.8877},{name:'須賀川市',lat:37.2865,lng:140.3734},{name:'潮来市',lat:35.9344,lng:140.5453},{name:'久喜市',lat:36.0621,lng:139.6672},{name:'埼玉県',lat:35.8574,lng:139.6489},{name:'川口市',lat:35.8079,lng:139.7237},{name:'幸手市',lat:36.0747,lng:139.7247},{name:'越谷市',lat:35.8911,lng:139.7909},{name:'三鷹市',lat:35.6836,lng:139.5594},{name:'墨田区',lat:35.7107,lng:139.8016},{name:'江戸川区',lat:35.7066,lng:139.8683},{name:'足立区',lat:35.7750,lng:139.8044},{name:'厚木市',lat:35.4431,lng:139.3622},{name:'川崎市',lat:35.5308,lng:139.7029},{name:'海老名市',lat:35.4464,lng:139.3908},{name:'相模原市',lat:35.5714,lng:139.3733},{name:'神奈川県',lat:35.4478,lng:139.6425},{name:'茅ヶ崎市',lat:35.3339,lng:139.4047},{name:'長岡市',lat:37.4461,lng:138.8511},{name:'射水市',lat:36.7294,lng:137.0537},{name:'下諏訪町',lat:36.0694,lng:138.0807},{name:'各務原市',lat:35.3989,lng:136.8482},{name:'岐阜県',lat:35.3912,lng:136.7223},{name:'富士宮市',lat:35.2220,lng:138.6211},{name:'静岡市',lat:34.9756,lng:138.3828},{name:'一宮市',lat:35.3042,lng:136.8025},{name:'名古屋市',lat:35.1815,lng:136.9066},{name:'安城市',lat:34.9588,lng:137.0800},{name:'愛知県',lat:35.1802,lng:136.9066},{name:'愛西市',lat:35.1528,lng:136.7288},{name:'扶桑町',lat:35.3592,lng:136.9139},{name:'豊橋市',lat:34.7692,lng:137.3915},{name:'豊田市',lat:35.0824,lng:137.1563},{name:'長久手市',lat:35.1841,lng:137.0487},{name:'三重県',lat:34.7303,lng:136.5086},{name:'大津市',lat:35.0179,lng:135.8546},{name:'彦根市',lat:35.2745,lng:136.2596},{name:'甲賀市',lat:34.9660,lng:136.1668},{name:'野洲市',lat:35.0674,lng:136.0257},{name:'亀岡市',lat:35.0134,lng:135.5735},{name:'京都市',lat:35.0116,lng:135.7681},{name:'交野市',lat:34.7879,lng:135.6809},{name:'大阪市',lat:34.6937,lng:135.5023},{name:'枚方市',lat:34.8143,lng:135.6507},{name:'茨木市',lat:34.8163,lng:135.5685},{name:'高槻市',lat:34.8461,lng:135.6173},{name:'姫路市',lat:34.8151,lng:134.6853},{name:'岡山市',lat:34.6551,lng:133.9195},{name:'岡山県',lat:34.6618,lng:133.9350},{name:'広島市',lat:34.3853,lng:132.4553},{name:'徳島市',lat:34.0703,lng:134.5548},{name:'北九州市',lat:33.8834,lng:130.8750},{name:'宗像市',lat:33.8054,lng:130.5401},{name:'長崎市',lat:32.7503,lng:129.8777},{name:'熊本市',lat:32.8031,lng:130.7079},{name:'大分県',lat:33.2381,lng:131.6126},{name:'鹿児島市',lat:31.5966,lng:130.5571}
  ];

  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn,{once:true}); else fn(); }
  function addStyle(id,css){ var st=document.getElementById(id); if(!st){ st=document.createElement('style'); st.id=id; document.head.appendChild(st); } st.textContent=css; }
  function loadCss(id,href){ if(document.getElementById(id)) return; var l=document.createElement('link'); l.id=id; l.rel='stylesheet'; l.href=href; document.head.appendChild(l); }
  function loadScript(id,src,cb){ var old=document.getElementById(id); if(old){ if(old.dataset.loaded==='1') cb&&cb(); else old.addEventListener('load',function(){ cb&&cb(); },{once:true}); return; } var s=document.createElement('script'); s.id=id; s.src=src; s.onload=function(){ s.dataset.loaded='1'; cb&&cb(); }; document.head.appendChild(s); }


  /* --- サイト内検索（軽量実装・2026-06統一整理で復旧） --- */
  var SITE_INDEX=[
    ['トップ','/index.html','PTA適正化推進委員会の全体像'],
    ['資料入口・索引','/documents.html','公開資料への入口を1ページに整理'],
    ['保護者の方へ','/guide-parent.html','入会した覚えがない・会費の根拠が分からない場合の確認手順'],
    ['PTA役員の方へ','/guide-pta.html','引き継いだ運営を適法に直す実務手順'],
    ['学校・教育委員会の方へ','/guide-board.html','確認すべき5領域と初動チェック'],
    ['研究者・記者の方へ','/guide-research.html','調査・取材のための資料案内'],
    ['教委向け分離指針','/edu-board-separation.html','学校とPTAの線引きを示す実務整理'],
    ['教委向け分離資料','/guide-board.html#board-jp-guideline','配布用ガイドラインPDF・通知ひな形・実態調査票'],
    ['PTAの適正化とは','/proper-management.html','適正化の定義と七つの基本原則'],
    ['適正化ガイドライン','/guideline.html','実務ガイドラインと書式テンプレート'],
    ['適正化ガイドブック 第4版','/PTA運営適正化ガイドブック_第4版_改訂本文.html','総合ガイドブック本文（HTML版）'],
    ['入会手続とオプトアウト','/membership.html','入会申込書・同意・みなし加入の論点'],
    ['個人情報提供の問題','/privacy.html','学校名簿のPTA提供と個人情報保護法第69条'],
    ['会費徴収と学校徴収金','/fee-collection.html','抱合せ徴収・代行徴収・公会計化'],
    ['教職員関与と職務専念義務','/personnel.html','地方公務員法第35条と職専免の論点'],
    ['施設利用と公私の境界','/facilities.html','学校教育法第137条と目的外使用許可'],
    ['法制度マップ','/law-map.html','PTA問題を入会・個人情報・会費・教職員関与・施設利用の5論点から体系整理'],
    ['判例整理','/cases.html','PTA関連裁判例の争点別整理'],
    ['PTA制度史','/timeline.html','占領期から現在までの制度変遷'],
    ['教育委員会の回答','/board-responses.html','76自治体・111件の公式回答データベース'],
    ['全国資料館','/national-archive.html','自治体別・学校別の実物文書アーカイブ'],
    ['行政通知・公式PDF','/administrative-materials.html','横浜市通知・文科省通知・PPC資料'],
    ['横浜市教育委員会通知 学教第1965号','/journal/yokohama-notice-1965.html','通知本文と別紙を一式で整理した中核資料'],
    ['横浜市通知 別紙1・別紙2','/journal/yokohama-notice-1965.html','任意加入、個人情報、会費説明、加入届ひな型の確認ポイント'],
    ['横浜市通知の要点','/membership.html#yokohama','オプトイン方式と3点セット移行の説明'],
    ['PTA入会申込書がない場合','/membership.html#no-application-record','入会記録・同意・会費徴収・学校関与を確認する質問'],
    ['法的根拠から使う文書パック','/documents.html#legal-template-pack','根拠資料・確認事項・提出文書をまとめた入口'],
    ['提出文書キット','/submission-kit.html','学校・PTA・教育委員会への確認文、会費分離申入書、個人情報確認書、根拠整理メモ'],
    ['主張と根拠の対応表','/claim-evidence-ledger.html','主張、根拠条文、公式資料、実物文書、提出文例を対応させる根拠台帳'],
    ['学校・教育委員会への照会書','/guideline.html#tpl-board-inquiry','入会記録・名簿・会費・教職員関与・施設利用を確認するひな形'],
    ['PTA会費徴収分離申入書','/guideline.html#tpl-fee-separation','学校徴収金とPTA会費を分けるための提出文書'],
    ['学校名簿・学校アプリ利用確認書','/guideline.html#tpl-school-info-stop','学校保有情報とPTA連絡利用の確認文書'],
    ['PTA非会員情報と協力金','/privacy.html#nonmember-info-impossibility','非会員名簿・協力金・実費徴収を学校情報に依存させない整理'],
    ['PTA個人情報取得・利用同意書','/guideline.html#tpl-info-consent','PTAが本人から直接情報を取得するための同意書'],
    ['主要論点の整理','/journal.html#core-topics','消費者契約・非会員情報・公益性・学校徴収金を一次資料で整理'],
    ['PTAと消費者契約法の関係','/journal/consumer-contract.html','PTA加入・会費請求を消費者契約法の定義、事業者性、説明、入会意思確認から整理'],
    ['PTAオプトアウト加入の無効性','/journal/optout-invalidity.html','退会届方式・みなし加入を入会意思、会費、個人情報、学校関与の連鎖で整理'],
    ['PTA非会員情報・協力金・学校名簿','/journal/nonmember-info.html','非会員名簿、協力金、学校アプリ、学校保有情報の利用を整理'],
    ['学校徴収金とPTA会費を分ける理由','/journal/school-fee-separation.html','学校徴収金と任意団体会費を文書、口座、未納管理で分離する理由'],
    ['学校経由の第三者提供同意とPTA名簿','/journal/third-party-consent.html','学校書類の中でPTAへの個人情報提供同意を取る場合の提供先、項目、利用目的、加入意思との分離'],
    ['働き方改革から見たPTA会費代理徴収の限界','/journal/work-style-reform.html','学校徴収金の公会計化・学校経由しない支払いの流れからPTA会費と学校事務の分離を整理'],
    ['PTA運営の現場実例','/compliance.html','みなし加入・代行徴収・名簿提供の実例'],
    ['静岡市9200人分個人情報事案','/shizuoka-incident.html','根拠確認事案の経緯と論点'],
    ['論考・調査報告','/journal.html','個別テーマの掘り下げ'],
    ['総合分析レポート','/report.html','PTA問題の5軸構造分析'],
    ['なぜ教育委員会の所掌なのか','/education-board-responsibility.html','学校関与を点検すべき理由の論考'],
    ['運営チェックアプリ','/audit/index.html','自校・自PTAのセルフチェック'],
    ['お問い合わせ・情報提供','/contact.html','資料・情報の提供窓口'],
    ['応援・寄付','/support.html','活動支援のお願い']
  ];
  window.initSearch=function(){
    document.querySelectorAll('.header-search').forEach(function(box){
      var input=box.querySelector('.search-input'); var dd=box.querySelector('.search-results-dropdown');
      if(!input||!dd) return;
      input.addEventListener('input',function(){
        var q=input.value.trim().toLowerCase(); dd.innerHTML='';
        if(!q){ dd.classList.remove('is-open'); return; }
        var hits=SITE_INDEX.filter(function(r){ return (r[0]+' '+r[1]+' '+r[2]).toLowerCase().indexOf(q)>=0; }).slice(0,8);
        if(!hits.length){ dd.innerHTML='<div class="search-result-item"><strong>該当なし</strong><span>別の語で検索してください。</span></div>'; }
        else{ hits.forEach(function(r){ dd.insertAdjacentHTML('beforeend','<a class="search-result-item" href="'+r[1]+'"><strong>'+r[0]+'</strong><span>'+r[2]+'</span></a>'); }); }
        dd.classList.add('is-open');
      });
      document.addEventListener('click',function(e){ if(!box.contains(e.target)) dd.classList.remove('is-open'); });
    });
  };



  function mobileNavHtml(){
    return [
      '<button type="button" class="mobile-close-btn" id="closeOverlay" aria-label="メニューを閉じる">閉じる ×</button>',
      '<div class="mobile-menu-group">',
      '<div class="mobile-menu-label">主要入口</div>',
      '<a class="mobile-link" href="/index.html">トップ</a>',
      '<a class="mobile-link" href="/guide-parent.html">保護者の方へ</a>',
      '<a class="mobile-link" href="/guide-pta.html">PTA役員の方へ</a>',
      '<a class="mobile-link" href="/guide-board.html">教育委員会・学校へ</a>',
      '</div>',
      '<div class="mobile-menu-group">',
      '<div class="mobile-menu-label">教育委員会向け</div>',
      '<a class="mobile-link" href="/guide-board.html#board-jp-guideline">教委向け分離資料</a>',
      '<a class="mobile-link" href="/edu-board-separation.html">学校とPTAの分離指針</a>',
      '<a class="mobile-link" href="/board-responses.html">教育委員会の回答</a>',
      '</div>',
      '<div class="mobile-menu-group">',
      '<div class="mobile-menu-label">資料・論考</div>',
      '<a class="mobile-link" href="/documents.html">資料入口・索引</a>',
      '<a class="mobile-link" href="/national-archive.html">全国資料館</a>',
      '<a class="mobile-link" href="/administrative-materials.html">行政通知・公式PDF</a>',
      '<a class="mobile-link" href="/journal.html">論考・調査報告</a>',
      '<a class="mobile-link" href="/audit/index.html">運営チェックアプリ</a>',
      '</div>',
      '<div class="mobile-menu-group mobile-menu-bottom">',
      '<a class="mobile-link" href="/contact.html">お問い合わせ・情報提供</a>',
      '<a class="mobile-link support-mobile-link" href="/support.html">応援・寄付</a>',
      '</div>'
    ].join('');
  }

  function stabilizeMobileNavigation(){
    var h0=document.getElementById('hamburger');
    var m0=document.getElementById('mobileOverlay');
    if(!h0||!m0) return;
    if(h0.dataset.stableMobileNav==='v72' && m0.dataset.stableMobileNav==='v72'){
      return;
    }
    addStyle('mobile-nav-stable-v72',
      'html.mobile-nav-lock-root{overflow:hidden!important;overscroll-behavior:none!important}' +
      'body.mobile-nav-lock{position:fixed!important;left:0;right:0;width:100%;overflow:hidden!important;touch-action:none!important}' +
      '.mobile-overlay{position:fixed!important;inset:0!important;z-index:5000!important;display:none!important;flex-direction:column!important;justify-content:flex-start!important;align-items:center!important;gap:10px!important;padding:calc(18px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))!important;background:rgba(5,17,31,.92)!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}' +
      '.mobile-overlay.is-open{display:flex!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important}' +
      '.mobile-menu-group{width:min(100%,430px);display:flex;flex-direction:column;gap:8px;margin:0 0 8px!important}' +
      '.mobile-menu-label{color:rgba(255,255,255,.78)!important;font-size:.76rem!important;font-weight:900!important;letter-spacing:.08em!important;margin:8px 4px 0!important}' +
      '.mobile-link{width:100%!important;display:block!important;background:rgba(255,255,255,.98)!important;border:1px solid rgba(255,255,255,.18)!important;border-radius:14px!important;padding:15px 16px!important;text-decoration:none!important;color:#0f2742!important;font-weight:900!important;line-height:1.45!important;box-shadow:0 8px 22px rgba(0,0,0,.13)!important}' +
      '.mobile-link span{display:none!important}' +
      '.mobile-link.support-mobile-link{background:#ea580c!important;color:#fff!important}' +
      '.mobile-close-btn,.close-overlay{width:min(100%,430px)!important;display:block!important;position:sticky!important;top:0!important;z-index:2!important;margin:0 0 8px!important;padding:12px 16px!important;border-radius:999px!important;border:1px solid rgba(255,255,255,.38)!important;background:rgba(15,39,66,.94)!important;color:#fff!important;text-align:center!important;font-weight:900!important;letter-spacing:.06em!important;cursor:pointer!important}' +
      '.hamburger.is-active span:nth-child(1){transform:translateY(7px) rotate(45deg)!important}.hamburger.is-active span:nth-child(2){opacity:0!important}.hamburger.is-active span:nth-child(3){transform:translateY(-7px) rotate(-45deg)!important}.hamburger span{transition:transform .18s ease,opacity .18s ease!important}' +
      '@media(max-width:860px){.site-header{z-index:4900!important}.nav-container{min-height:64px!important}.hamburger{display:inline-flex!important;position:relative!important;z-index:5100!important}.desktop-nav{display:none!important}.header-search{display:none!important}}' +
      '@media(min-width:861px){.mobile-overlay{display:none!important}.hamburger{display:none!important}}'
    );

    var h=h0.cloneNode(true);
    var m=m0.cloneNode(false);
    h0.parentNode.replaceChild(h,h0);
    m0.parentNode.replaceChild(m,m0);
    m.id='mobileOverlay';
    m.className='mobile-overlay';
    m.setAttribute('aria-hidden','true');
    m.innerHTML=mobileNavHtml();
    h.dataset.stableMobileNav='v72';
    m.dataset.stableMobileNav='v72';
    h.setAttribute('aria-controls','mobileOverlay');
    h.setAttribute('aria-expanded','false');
    h.setAttribute('aria-label','メニューを開く');
    h.classList.remove('is-active');

    var savedY=0;
    function openMenu(){
      savedY=window.scrollY||window.pageYOffset||0;
      allowAutoTop=false;
      m.classList.add('is-open');
      h.classList.add('is-active');
      h.setAttribute('aria-expanded','true');
      h.setAttribute('aria-label','メニューを閉じる');
      m.setAttribute('aria-hidden','false');
      document.body.style.top='-'+savedY+'px';
      document.documentElement.classList.add('mobile-nav-lock-root');
      document.body.classList.add('mobile-nav-lock');
      setTimeout(function(){ var c=m.querySelector('#closeOverlay'); if(c&&c.focus) c.focus({preventScroll:true}); },0);
    }
    function closeMenu(){
      var locked=document.body.classList.contains('mobile-nav-lock');
      m.classList.remove('is-open');
      h.classList.remove('is-active');
      h.setAttribute('aria-expanded','false');
      h.setAttribute('aria-label','メニューを開く');
      m.setAttribute('aria-hidden','true');
      document.body.classList.remove('mobile-nav-lock');
      document.documentElement.classList.remove('mobile-nav-lock-root');
      document.body.style.top='';
      if(locked){ try{ window.scrollTo(0,savedY); }catch(e){} }
    }
    h.addEventListener('click',function(e){
      e.preventDefault();
      if(m.classList.contains('is-open')) closeMenu(); else openMenu();
    });
    m.addEventListener('click',function(e){
      if(e.target===m || e.target.id==='closeOverlay' || e.target.closest('.mobile-link')) closeMenu();
    });
    window.addEventListener('keydown',function(e){ if(e.key==='Escape' && m.classList.contains('is-open')) closeMenu(); });
  }

  ready(function(){
    if(window.initSearch) window.initSearch();
    stabilizeMobileNavigation();
  });
})();
