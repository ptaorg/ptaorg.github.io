import {assessParentSchool} from './pta-parent-report-policy.mjs';
/* 大崎市・学校別PTA調査レポート v2: 原資料の記載を根拠にした保護者向け表示。
   原資料の複製・偽造はしない。転記の紙面は「再構成図」と明示する。詳細原文はHTMLに残す。 */
(() => {
  'use strict';
  const match=location.pathname.match(/^\/archive\/osaki\/([a-z0-9-]+)\/(?:index\.html)?$/);
  if(!match)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe=(s,n=240)=>String(s??'').slice(0,n).replace(/\s+/g,' ').trim();
  const sourceReport='大崎市立小中学校PTA関係文書 調査報告書（2026年11月15日）';
  const evidenceImages={"naruko-compulsory":{"src":"/assets/osaki-evidence/naruko-shishutsu-2026-redacted.jpg","caption":"鳴子小中学校：令和8年7月1日付支出伺書。氏名と印影を不可逆に伏せ、PTA会費222,200円の箇所を赤枠で表示。"},"furukawa-daini-es":{"src":"/assets/osaki-evidence/furukawa-daini-officer-selection.jpg","caption":"古川第二小学校：役員選出アンケートの「無回答を委任として扱う」記載。開示資料の画像抜粋。"},"tajiri-jhs":{"src":"/assets/osaki-evidence/tajiri-jhs-delegation.jpg","caption":"田尻中学校：PTA会費の収納・会計事務委任に関する記載。開示資料の画像抜粋。"},"shikitama-es":{"src":"/assets/osaki-evidence/shikitama-work-organization.jpg","caption":"敷玉小学校：学校運営組織表に記載されたPTAの担当。開示資料の画像抜粋。"},"furukawa-kita-es":{"src":"/assets/osaki-evidence/furukawa-kita-collection-regulation.jpg","caption":"古川北小学校：学校徴収金基本計画に掲げられたPTA会費と徴収方法。開示資料の画像抜粋。"}};
  // 直接照合した報告書の記載と公開済み法令別評価に限定。元画像そのものとは呼ばない。
  const featured={
    'naruko-compulsory':{
      title:'PTA会費を学校の決裁書類で処理',level:'urgent',
      lead:'学校の「徴収金会計」の支出伺書に、PTA会費222,200円が記載されています。校長・副校長・教頭・事務職員の決裁欄が使われたことが確認できます。',
      doc:'様式第2-1号　支出伺書 No.44',
      date:'令和8年7月1日',
      fields:[['会計名','徴収金会計','学校会計の様式'],['項目','PTA会費','私的団体の会費'],['金額','222,200円','学校の決裁に記載'],['摘要','第1回PTA会費、安全互助会費保護者分','会費と互助会費を含む'],['決裁欄','校長・副校長・教頭2名・事務2名','学校の決裁ライン']],
      what:'学校の会計様式を使ってPTA会費の支出を処理し、管理職・事務職員が決裁した文書が開示されています。学校がPTA活動への個人情報提供を利用目的に掲げる文書も確認されています。',
      why:'PTA会費の会計処理は原則としてPTA固有の事務です。学校が公務として処理できる権限を、PTAからの依頼や市の内部規程だけで説明することはできません。個人情報は学校の所掌事務を確認した後に個人情報保護法61条、69条の順で検証が必要です。',
      actions:['学校がPTA会計を決裁する具体的な公法上の根拠を明らかにする。','公的な決裁系統からPTA固有の会計処理を分離する方向で是正を検討する。','学校保有情報のPTA目的利用・提供を、61条・69条に基づき点検する。'],
      source:'「14_3-5 徴収金支出伺い」1頁（2026年7月1日）、個人情報同意依頼文書1頁／'+sourceReport+'9・22～23頁',
      tags:['学校による決裁','個人情報','教職員関与']
    },
    'tajiri-jhs':{
      title:'PTA会費1,500円を学校の集金に計上',level:'urgent',
      lead:'校長名の「令和8年度学校集金について」にPTA会費1,500円が記載され、会費収納などに関する委託文書も開示されています。',
      doc:'令和8年度 学校集金内訳表／会計事務の委託',
      date:'令和8年度',
      fields:[['学校集金の項目','PTA会費　1,500円','学校集金に掲載'],['別の費目','PTA生徒活動援助費　2,500円','会費とは別項目'],['別の費目','PTA安全互助会負担金　620円','会費とは別項目'],['委託文書','PTA会計事務の執行委任','学校側の権限は別途検証']],
      what:'学校の徴収金内訳にPTA関連費目が計上され、学校による徴収事務の取扱いが確認されます。内訳の3費目は別々に表示されており、PTA会費そのものは1,500円です。',
      why:'学校徴収金に含まれると、保護者には学校へ納付する義務がある費用との区別が見えにくくなります。加入意思と会費請求の根拠に加え、学校が別団体の徴収を行える公法上の権限が必要です。',
      actions:['本人の加入意思と会費請求対象者の特定方法を明らかにする。','学校集金からPTA固有の費用を分離するよう見直す。','実際の受領・保管主体と教職員の事務処理を調査する。'],
      source:'2026年5月11日付「学校集金について」・集金内訳表、4月18日付会計事務委託文書／'+sourceReport+'30～31頁',
      tags:['学校集金','加入意思','会計委託']
    },
    'furukawa-daini-es':{
      title:'無回答を「役員選出の委任」とみなす記載',level:'urgent',
      lead:'役員選出アンケートに、回答しなかった場合は選出を委任したものとして調整するという記載があります。本人が役員を引き受ける意思を示したかが重要です。',
      doc:'役員選出アンケート（開示資料の記載）',
      date:'令和8年度関係資料',
      fields:[['無回答の扱い','期限内に回答がない場合','意思表示をしなかった場合'],['運用記載','「選出を委任（お任せ）いただいたもの」として調整','無回答を委任と扱う'],['事務担当','教頭・主幹教諭が役員推薦事務に関与','公務の権限を別途検証']],
      what:'PTAの役員選出手続に、無回答を委任とみなす文言があり、教頭・主幹教諭が役員推薦委員会の事務を担当する記載も確認されています。',
      why:'沈黙は役員就任の積極的な承諾と同じではありません。辞退の自由がなく、本人の意思に反して役割を割り当てる運用であれば、保護者の人格的利益や生活に重大な影響を及ぼしかねません。',
      actions:['無回答を委任とする扱いを停止・見直す。','役員就任について本人の明確な承諾と辞退の自由を確認する。','学校教職員がPTA役員選出を担当する権限と実態を調査する。'],
      source:'古川第二小学校・役員選出資料、業務委任契約書／'+sourceReport+'13～14頁',
      tags:['役員選出','本人の意思','教職員関与']
    },
    'numabe-es':{
      title:'入学式当日の役員決定が予定されている',level:'urgent',
      lead:'「令和8年度 入学式の流れ」に、PTAの説明とともに学年役員を決める段取りが記載されています。',
      doc:'令和8年度 入学式の流れ',
      date:'令和8年度',
      fields:[['会長からの説明','PTA活動・任意団体であることの説明','説明と加入の成立は別'],['当日の進行','1学年役員の決定（補助・教務）','入学式の中で選出'],['選出人数','3人選出（委員長・委員・専門委員）','本人の承諾記録は未確認']],
      what:'学校の入学式の進行資料に、PTAの説明と同日に役員を決定する予定が記載されています。',
      why:'保護者がまだ加入や就任を決めていない段階で役員決定を進めると、自由な意思決定を阻害するおそれがあります。実際に本人の承諾を確認しているかは追加調査が必要です。',
      actions:['加入意思と役員就任意思を別々に確認する。','本人の同意のない役員決定を行わない。','学校が選出を補助する公法上の根拠を明らかにする。'],
      source:'沼部小学校「令和8年度 入学式の流れ」／'+sourceReport+'24頁',
      tags:['役員選出','入会の自由','学校関与']
    },
    'onuki-es':{
      title:'PTA事務のために教職員を選ぶ委託契約',level:'urgent',
      lead:'校長がPTAの事務局業務を受託し、必要な人員を学校教職員から選ぶという契約の記載が確認されています。',
      doc:'大貫小学校PTA 委託契約書',
      date:'令和8年4月25日',
      fields:[['委託業務','PTAの事務局業務（庶務・会計）','別団体の内部事務'],['委託金額','無償','無償でも公務の権限は別'],['職員選出','必要な人員を学校教職員から選出','服務上の根拠を検証']],
      what:'校長を受託者とする委託契約の条項に、PTA事務を行う職員を学校教職員から選出する取扱いが記載されています。',
      why:'PTAとの委託契約があっても、公立学校がPTAの内部事務を公務として処理する権限が自動的に生じるわけではありません。教職員の職務専念義務も別に検証が必要です。',
      actions:['学校によるPTA事務受託の法令上の根拠を示す。','教職員の従事実態・勤務時間と職務命令を調査する。','適法性が確認できない学校の内部事務処理を見直す。'],
      source:'大貫小学校「PTA委託契約書」1頁／'+sourceReport+'24～25頁',
      tags:['委託契約','教職員関与','学校集金']
    },
    'shikitama-es':{
      title:'校務分掌表にPTAの役職が組み込まれている',level:'urgent',
      lead:'学校の「令和8年度 学校運営機構（校務分掌等）」に、PTAの事務長・庶務・会計として教職員を配置する記載があります。',
      doc:'令和8年度 学校運営機構（校務分掌等）',
      date:'令和8年度',
      fields:[['PTA参与','校長','学校の役職と混在'],['PTA事務長','教頭','学校の校務分掌に記載'],['PTA庶務・会計','教務・事務','PTA固有事務への従事']],
      what:'学校が作成した校務分掌の表に、PTAの役員・事務担当として教職員が割り当てられる記載が確認されています。',
      why:'学校の校務分掌に記載しただけでは、PTAの内部事務が当然に公務になるわけではありません。PTA活動を支えることと、PTA会計や役員業務を学校職員に担当させることは区別すべきです。',
      actions:['PTA事務を校務に含める具体的な法令上の根拠を示す。','校務分掌からPTA固有の事務を分離する。','学校名簿などのPTA目的利用の有無を点検する。'],
      source:'敷玉小学校「学校運営組織表」1頁／'+sourceReport+'16～17頁',
      tags:['校務分掌','学校・PTA分離','教職員関与']
    },
    'tajiri-es':{
      title:'父母教師会費3,000円を学校の口座振替に掲載',level:'urgent',
      lead:'令和8年度の口座振替一覧表に「父母教師会費は、1世帯あたり3,000円」と記載されています。',
      doc:'令和8年度 口座振替一覧表',
      date:'令和8年度',
      fields:[['会費','父母教師会費　1世帯あたり3,000円','学校の振替表に記載'],['別費目','安全互助会掛金','会費とは別に記載'],['発信者','学校長名の会費納入案内','学校の関与を確認']],
      what:'PTA会費が学校の口座振替一覧表に記載され、学校長名で会費の納入を求める文書が確認されています。',
      why:'PTA会費はPTA自身の会員との関係から生じるものです。学校が徴収するときの法令上の権限、会員の特定、口座情報の扱いを確認する必要があります。',
      actions:['学校徴収の公法上の権限と本人の加入意思を確認する。','学校の振替からPTA固有の会費事務を分離する。','保護者の情報・口座データの使用目的を検証する。'],
      source:'田尻小学校「令和8年度 口座振替一覧表」／'+sourceReport+'23～24頁',
      tags:['学校口座振替','会員資格','個人情報']
    },
    'matsuyama-es':{
      title:'学校の徴収金基本計画にPTA会費2,000円',level:'review',
      lead:'校長が策定する学校徴収金基本計画に、団体費としてPTA会費2,000円が記載されています。実際の徴収経路は別途確認が必要です。',
      doc:'松山小学校徴収金基本計画',
      date:'令和7・8年度関係資料',
      fields:[['分類','③ 団体費','学校計画の項目'],['項目','3-2 PTA会費','学校徴収金計画に記載'],['金額','全会員2,000円','加入者の特定方法は要確認']],
      what:'学校徴収金の基本計画に、PTA会費の種類・額・取扱いについての記載が確認されています。',
      why:'団体会計の取扱いを内部規程に定めても、学校による徴収の権限をその規程だけで説明することはできません。実際に誰が集めたかも確認が必要です。',
      actions:['基本計画と実際の入金経路を照合する。','学校がPTA会費を扱う権限を検証する。'],
      source:'松山小学校「徴収金基本計画」／'+sourceReport+'5・19～20頁',
      tags:['徴収金計画','会員の自由','学校権限']
    },
    'furukawa-kita-es':{
      title:'学校徴収金基本計画にPTA会費3,500円',level:'review',
      lead:'学校徴収金基本計画がPTA会費を学校で扱う種類に挙げ、口座振替と振替不能時の学校への納付を定めています。',
      doc:'古川北小学校 学校徴収金基本計画',
      date:'令和8年度関係資料',
      fields:[['学校徴収金','PTA会費','学校で扱う費目に列挙'],['金額','1家庭 3,500円','学校計画に記載'],['徴収方法','口座振替・学校への直接納入','実施状況は要確認']],
      what:'学校の内部計画に、PTA会費の口座振替と学校への直接納付の方法まで記載されています。',
      why:'学校徴収金として扱えるかは、会費の性格と学校の所掌事務・権限の問題です。会員でない家庭からの徴収があるかも確認する必要があります。',
      actions:['公法上の権限を提示し、実際の徴収対象・経路を確認する。','学校徴収金の区分を見直す。'],
      source:'古川北小学校「学校集金規定」1頁／'+sourceReport+'6・17～18頁',
      tags:['学校徴収金規定','口座振替','加入意思']
    }
  };
  const axisLabels={
    school_collection_of_pta_fee:'PTA会費の学校徴収',school_account_or_payment_system:'学校口座・徴収制度',
    officer_selection_pressure:'役員選出と本人の意思',teacher_internal_pta_admin:'教職員によるPTA事務',
    school_personal_data_for_pta:'学校の個人情報利用',school_pta_governance_overlap:'学校とPTAの事務混在',
    voluntary_membership_notice:'任意加入の案内',nonmember_equal_treatment:'非会員家庭への取扱い'
  };
  function derive(s){
    if(featured[s.schoolId])return featured[s.schoolId];
    const obs=s.observations.find(x=>x.status==='confirmed_yes')||s.observations[0];
    if(obs){
      const first=safe(obs.evidenceNote.split('。')[0],150);
      return {
        title:axisLabels[obs.axis]||obs.label,
        level:s.feeRoute==='school_collection_documented'?'urgent':'review',
        lead:first?first+'。':'開示資料に検討を要する記載が確認されています。',
        doc:obs.sourceRefs?.[0]?.title||'開示資料の確認事項',date:s.evidencePeriod,
        fields:[['資料で確認された事項',axisLabels[obs.axis]||obs.label,'文書記載に基づく'],['記載の要点',first||'追加調査が必要','適法性は未確定'],['出典',obs.sourceRefs?.[0]?.locator||'学校別の評価記録','原資料に照合']],
        what:safe(obs.evidenceNote,290),
        why:'PTAは公立学校とは別の任意団体です。学校による関与は、公法上の権限と実際の取扱いを分けて検証しなければなりません。',
        actions:['学校とPTAそれぞれの事務の担当範囲を明らかにする。','本人の意思と学校の権限を確認し、必要な改善措置を示す。'],
        source:(obs.sourceRefs||[]).map(x=>x.title+'（'+x.locator+'）').join('、')||s.documentDisclosure,
        tags:[axisLabels[obs.axis]||obs.label,'学校・PTA分離','追加調査']
      };
    }
    return {
      title:'PTAの加入・会費・学校の関与は確認できていますか',level:'unknown',
      lead:'今回の開示資料だけでは、加入意思の確認方法や会費徴収経路について判断できません。問題がないという結論ではありません。',
      doc:'学校別の確認状況',date:s.evidencePeriod,
      fields:[],
      what:'学校別の公開用評価記録から、今回の項目について裏付け資料を十分に確認できていません。',
      why:'資料がないことと、実際に問題がないことは別です。学校の事務とPTAの事務を区別して調査を続けます。',
      actions:['PTA自身の加入・会員管理の記録を確認する。','学校による会費徴収・教職員従事・個人情報利用の有無を確かめる。'],
      source:s.documentDisclosure+'／大崎市2026年度公開用調査台帳',tags:['加入の確認','徴収経路未立証','資料の収集']
    };
  }
  function schoolGraphic(){
    let windows='';
    for(let r=0;r<3;r++)for(let c=0;c<7;c++)windows+='<rect x="'+(38+c*40)+'" y="'+(78+r*44)+'" width="27" height="26" rx="2" fill="#add6e9" stroke="#e5edf0" stroke-width="3"/>';
    return '<svg class="os2-scene" viewBox="0 0 410 290" role="img" aria-label="学校校舎のイメージ図（実際の校舎写真ではありません）"><defs><linearGradient id="os2sky" x2="0" y2="1"><stop stop-color="#c3e5f5"/><stop offset="1" stop-color="#eaf4f6"/></linearGradient></defs><rect width="410" height="290" fill="url(#os2sky)"/><circle cx="350" cy="45" r="30" fill="#fff8d5" opacity=".65"/><rect x="25" y="52" width="312" height="198" fill="#f2eee9" stroke="#c6cacb" stroke-width="3"/><rect x="22" y="49" width="322" height="12" fill="#b9c4c9"/>'+windows+'<rect x="156" y="193" width="56" height="57" fill="#819aaa"/><rect x="163" y="200" width="43" height="50" fill="#c2dae3"/><path d="M0 248Q200 232 410 252V290H0Z" fill="#d6dfd0"/><path d="M354 265V103" stroke="#6f735f" stroke-width="15"/><circle cx="352" cy="79" r="62" fill="#80a480"/><circle cx="379" cy="115" r="43" fill="#8aad86"/><circle cx="327" cy="116" r="40" fill="#8eb48e"/><rect x="16" y="259" width="240" height="20" fill="#c6c8bb" opacity=".7"/></svg>';
  }
  function docFields(c){
    if(!c.fields.length)return '<div class="os2-empty"><strong>この項目の原資料は未確認です。</strong><p>確認できない事実を、確認済みのように表示しません。下の研究者向け詳細で資料の提出状況を確認できます。</p></div>';
    return '<div class="os2-paper"><p class="os2-paper-date">'+esc(c.date)+'</p><h3>'+esc(c.doc)+'</h3>'+
      '<div class="os2-paper-table">'+c.fields.map(([label,value,comment],i)=>
        '<div class="os2-paper-row"><span class="os2-paper-key">'+esc(label)+'</span>'+
        '<strong class="os2-paper-value">'+esc(value)+'</strong>'+
        '<span class="os2-pointer"><i>'+(i+1)+'</i>'+esc(comment)+'</span></div>').join('')+
      '</div><p class="os2-paper-foot">※原資料の記載に基づく<strong>文字起こし・再構成図</strong>です。原本そのものの画像ではありません。氏名・印影などは転載していません。</p></div>';
  }
  function evidenceHTML(s,c){
    const item=evidenceImages[s.schoolId];
    if(!item)return docFields(c);
    return '<figure class="os2-real-doc"><a href="'+esc(item.src)+'" target="_blank" rel="noopener"><img src="'+esc(item.src)+'" alt="'+esc(s.schoolName)+'の開示資料の抜粋。本文と脚注で確認事項を説明" loading="eager" decoding="async"></a>'+
      '<figcaption>'+esc(item.caption)+'<br><a href="'+esc(item.src)+'" target="_blank" rel="noopener">資料の抜粋画像を拡大する</a></figcaption></figure>'+
      '<details class="os2-transcript"><summary>原資料の記載を文字で確認する</summary>'+docFields(c)+'</details>';
  }
  function lawLinks(){
    return '<a href="https://laws.e-gov.go.jp/law/129AC0000000089">民法（加入意思・契約）</a>'+
      '<a href="https://laws.e-gov.go.jp/law/322AC0000000026">学校教育法（校長の校務）</a>'+
      '<a href="https://laws.e-gov.go.jp/law/415AC0000000057">個人情報保護法（61・69条）</a>'+
      '<a href="https://laws.e-gov.go.jp/law/325AC0000000261">地方公務員法（35条等）</a>'+
      '<a href="https://laws.e-gov.go.jp/law/322AC0000000067">地方自治法（235条の4等）</a>';
  }
  function accordion(c,archive){
    return '<section class="os2-research" id="os2-research"><h2><span aria-hidden="true">▤</span> 詳細な法令・資料一覧</h2>'+
      '<p>詳しい条文・証拠・12評価軸は下から開けます。従来の調査本文は省略していません。</p>'+
      '<details class="os2-minidetail"><summary>関連する法令・通知</summary><div class="os2-acc-body os2-law-links">'+lawLinks()+
      '<p>検討順序：主体の分離 → 事務の帰属 → 学校の権限 → 個人情報保護法61条 → 69条 → 服務・金銭保管。</p></div></details>'+
      '<details class="os2-minidetail"><summary>確認した資料（証拠書類）</summary><div class="os2-acc-body"><p>'+esc(c.source)+'</p><p>個人情報を含み得る原本PDFと署名・印影は、このページから公開しません。</p></div></details>'+
      '<details class="os2-minidetail"><summary>参考資料（学校とPTAの事務分担）</summary><div class="os2-acc-body os2-law-links">'+
      '<a href="/research/osaki-legal-review.html">大崎市25校・法令別統合評価</a>'+
      '<a href="/research/osaki-documents.html">大崎市25校・文書の存否</a>'+
      '<a href="/pta-evaluation-method.html">全国共通の調査・評価基準</a></div></details>'+
      '<details id="os2-full-data" class="os2-minidetail os2-full"><summary>12評価軸・学校別の全調査データ</summary><div class="os2-acc-body" id="os2-original-content"></div></details>'+
      '</section>';
  }
  function renderSchoolOverview(s,overview,tone){
    if(!overview||overview.schoolId!==s.schoolId||!Array.isArray(overview.paragraphs)||overview.paragraphs.length<3){
      return '<section class="os2-overview os2-overview--unknown" aria-label="この学校の総評"><h3>この学校の総評</h3>'+
        '<p>学校別の原資料に即した総評を掲載するための確認が完了していません。資料未確認を「問題なし」とは判断しません。</p></section>';
    }
    return '<section class="os2-overview os2-overview--'+esc(tone)+'" aria-labelledby="os2-overview-title">'+
      '<div class="os2-overview-kicker"><span aria-hidden="true">◉</span> 学校別総評 <small>調査資料に基づく暫定評価</small></div>'+
      '<h3 id="os2-overview-title">'+esc(overview.title)+'</h3>'+
      overview.paragraphs.map((paragraph,i)=>'<p class="os2-overview-para'+(i===0?' os2-overview-lead':'')+'">'+esc(paragraph)+'</p>').join('')+
      '<p class="os2-overview-note">本総評は開示された文書と公開済みの学校別検討をもとに作成しています。未確認事項は判断を留保し、個別の法令違反の成立を確定したものではありません。</p>'+
      '</section>';
  }
  function joiningFirst(s,schoolPublic){
    const axes=schoolPublic?.axes||{};
    const documents=schoolPublic?.documents||{};
    const status=(id)=>axes[id]?.status||'unknown';
    const explanatory=status('voluntary_membership_notice')==='confirmed_yes'
      ? '任意加入の説明資料あり（意思確認の成立とは別）'
      : status('voluntary_membership_notice')==='indication'
      ? '任意性の一部記載あり（対象と説明内容は再確認）'
      : '開示資料から任意加入の明示を確認できず';
    const joining=status('explicit_opt_in')==='confirmed_yes'?'本人の明示的な加入意思を確認':'加入意思の確認記録は未確認';
    const leaving=status('withdrawal_procedure')==='confirmed_yes'?'退会手続の明示を確認':'退会手続の明示は未確認';
    const docStatus=documents.applicationForm?.status==='not_disclosed'
      ? '学校別資料が未開示'
      : '学校別開示資料に入会申込書などを確認できず';
    return '<section class="os2-member-priority" id="membership-freedom" aria-labelledby="os2-membership-title">'+
      '<div class="os2-member-head"><span class="os2-member-rank">最優先の評価項目</span><h2 id="os2-membership-title">PTAへの入会も退会も、本人が自由に決められるか。</h2></div>'+
      '<p class="os2-member-intro">学校別の問題を見る前に、まず会員資格の前提を確認します。<strong>加入しない自由・退会する自由</strong>が実際の手続で守られているかは、会費・役員選出を検証するうえで最重要です。</p>'+
      '<div class="os2-member-facts"><div><small>任意加入の説明</small><strong>'+esc(explanatory)+'</strong></div>'+
      '<div><small>入会意思の確認</small><strong>'+esc(joining)+'</strong></div>'+
      '<div><small>退会の自由の手続</small><strong>'+esc(leaving)+'</strong></div></div>'+
      '<p class="os2-member-notice">'+esc(docStatus)+'。書面が学校の開示資料で確認できなくても、PTAが保有する記録や書面によらない申込みが不存在とは断定できません。<strong>「未確認」は「強制加入と認定した」という意味ではありません。</strong></p>'+
      '<div class="os2-member-action"><strong>最低限必要なこと</strong><p>PTA自身が会員の加入意思・会員資格・退会申出の受領と反映を説明できる記録を整え、学校は在籍者全員を当然にPTA会員と扱うことを前提にした処理がないか点検すること。<a href="https://laws.e-gov.go.jp/law/129AC0000000089" target="_blank" rel="noopener">民法521・522条</a>の契約成立要件も個別に検証します。</p></div>'+
      '<a class="os2-member-city-link" href="/research/osaki.html#municipal-review">大崎市全体の入退会の自由についての評価を見る</a></section>';
  }
  function render(s,legalRules,overview,publicSchool){
    const main=document.querySelector('main.method');
    const oldHero=main?.querySelector('.method-hero');
    const article=main?.querySelector('article.method-wrap');
    if(!main||!oldHero||!article)return;
    const c=derive(s);
    const brief=assessParentSchool(s,legalRules,c);
    const level=brief.tone,status=brief.status.label;
    const schoolHref='/research/osaki.html#municipal-review';
    const titleHtml=c.title.replace(/PTA/g,'<em>PTA</em>');
    const hero=document.createElement('section');
    hero.className='os2-hero os2--'+level;
    hero.innerHTML='<div class="os2-shell">'+
      '<nav class="os2-breadcrumb" aria-label="パンくず"><a href="/">トップ</a><span aria-hidden="true">›</span><a href="/research-map.html">全国調査マップ</a><span aria-hidden="true">›</span><a href="'+schoolHref+'">大崎市の総合評価</a><span aria-hidden="true">›</span>'+esc(s.schoolName)+'</nav>'+
      '<div class="os2-hero-main"><div class="os2-hero-copy">'+
      '<div class="os2-hero-ribbon"><span class="os2-school-chip">'+esc(s.schoolName)+'<small>PTA調査レポート</small></span>'+
      '<span class="os2-alert"><b aria-hidden="true">!</b>'+esc(status)+'</span></div>'+
      '<p class="os2-hero-principle"><span>最初に確かめる</span> 01 入会・非加入・退会の自由</p>'+
      '<h1>'+titleHtml+'</h1><p class="os2-hero-lead">'+esc(c.lead)+'</p>'+
      '<p class="os2-hero-sub">最優先は保護者の加入・非加入・退会の自由。そのうえで<strong>誰の事務なのか、学校はなぜ処理できるのか。</strong>学校の原資料から検証します。</p>'+
      '</div><div class="os2-hero-art">'+schoolGraphic()+'<span>校舎のイメージ図</span></div></div></div>';
    const lawItems=brief.legal.slice(0,5).map(rule=>'<li><a href="'+esc(rule.lawUrl)+'" target="_blank" rel="noopener">'+esc(rule.law)+'</a><span>'+esc(rule.issue)+'</span><small>'+esc(rule.reviewStatus)+'</small></li>').join('');
    const lawHtml=lawItems?'<ul class="os2-law-summary">'+lawItems+'</ul><p class="os2-law-caution">'+esc(brief.legalCaution)+'</p>'
       :'<p>違反がないとの判定ではありません。適用する法令を特定するための具体的資料が不足しています。</p>';
    const minimumHtml='<ol class="os2-minimum-list">'+brief.minimum.slice(0,4).map((value,i)=>'<li><b>'+(i+1)+'</b>'+esc(value)+'</li>').join('')+'</ol>';
    const rightCards=[
      ['確認されたこと',esc(c.what),'fact'],
      ['何が問題か',esc(c.why),'issue'],
      [brief.lawReviewTitle,lawHtml,'law'],
      ['適正化に最低限必要なこと',minimumHtml,'minimum'],
      ['求める改善','<ol class="os2-action-list">'+c.actions.map((x,i)=>'<li><b>'+(i+1)+'</b>'+esc(x)+'</li>').join('')+'</ol>','action']
    ].map(([heading,html,cls])=>'<div class="os2-side-card os2-side--'+cls+'"><h2>'+esc(heading)+'</h2>'+((cls==='fact'||cls==='issue')?'<p>'+html+'</p>':html)+'</div>').join('');
    const first=document.createElement('div');
    first.className='os2-schoolbody';
    first.innerHTML='<div class="os2-shell"><div class="os2-columns"><section class="os2-evidence" aria-labelledby="os2-evidence-h">'+
      '<h2 id="os2-evidence-h">確認された証拠資料 <small>'+(evidenceImages[s.schoolId]?'実際の開示資料（抜粋・匿名化）':'原資料の記載から再構成')+'</small></h2>'+
      evidenceHTML(s,c)+'<p class="os2-evidence-source">出典：'+esc(c.source)+'</p>'+renderSchoolOverview(s,overview,level)+'</section>'+
      '<aside class="os2-aside" aria-label="問題と改善要求">'+rightCards+'</aside></div>'+
      '<section class="os2-topic-row" aria-label="本件の主な論点"><strong>本件に関わる<br>主な論点</strong>'+
      c.tags.slice(0,3).map((tag,i)=>'<div class="os2-topic"><span aria-hidden="true">'+(['▣','◎','▤'][i])+'</span><b>'+esc(tag)+'</b></div>').join('')+'</section>'+
      '<p class="os2-evaluation-note">色は確認事実に応じた対応の優先度と主要項目の確認状況です。赤＝早急な確認・改善、黄＝要調査、灰＝資料不足、青＝主要項目の積極的な適正確認。個別の違法性を確定する判定ではありません。</p></div>';
    const archive=Array.from(article.childNodes);
    const wrapper=document.createElement('div');
    wrapper.className='os2-shell';
    wrapper.innerHTML=accordion(c,s.schoolId);
    archive.forEach(n=>wrapper.querySelector('#os2-original-content').appendChild(n));
    article.replaceChildren(wrapper);
    main.insertBefore(hero,oldHero);
    const membership=document.createElement('div');
    membership.className='os2-schoolbody os2-schoolbody--membership';
    membership.innerHTML='<div class="os2-shell">'+joiningFirst(s,publicSchool)+'</div>';
    main.insertBefore(membership,article);
    main.insertBefore(first,article);
    document.body.classList.add('osaki-case-v2');
    const hash=decodeURIComponent(location.hash.slice(1));
    if(hash){
      const target=document.getElementById(hash);
      if(target){
        for(let p=target.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
        setTimeout(()=>target.scrollIntoView({block:'start'}),70);
      }
    }
  }
  async function init(){
    try{
      const response=await fetch('/data/osaki-legal-screening-2026.json',{cache:'no-cache'});
      if(!response.ok)throw new Error('public dataset '+response.status);
      const j=await response.json();
      const s=j.schools.find(x=>x.schoolId===match[1]);
      if(!s)return;
      let overview=null;
      try{
        const response=await fetch('/data/osaki-school-overviews-2026.json',{cache:'no-cache'});
        if(response.ok){
          const all=await response.json();
          overview=Array.isArray(all.schools)?all.schools.find(x=>x.schoolId===s.schoolId):null;
        }
      }catch(error){console.warn('School overview unavailable',error)}
      let publicSchool=null;
      try{
        const response=await fetch('/data/osaki-public-2026.json',{cache:'no-cache'});
        if(response.ok){
          const publicData=await response.json();
          publicSchool=Array.isArray(publicData.schools)?publicData.schools.find(x=>x.id===s.schoolId):null;
        }
      }catch(error){console.warn('Membership evaluation data unavailable',error)}
      render(s,j.legalRules||[],overview,publicSchool);
    }catch(error){console.error('PTA school reader: retaining original report',error)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
