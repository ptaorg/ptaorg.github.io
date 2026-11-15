/* 大崎市：保護者に先に結論を伝え、原資料・法令・集計を展開して読むための公開表示層。
   研究用HTMLと公開JSONを正本として保持する。編集元データ・証拠の新規認定は行わない。 */
(() => {
  'use strict';
  const path = location.pathname.replace(/index\.html$/, '');
  const schoolMatch = path.match(/^\/archive\/osaki\/([a-z0-9-]+)\/$/);
  const isOverview = path === '/research/osaki.html';
  const isLaw = path === '/research/osaki-legal-review.html';
  const isDocs = path === '/research/osaki-documents.html';
  if (!schoolMatch && !isOverview && !isLaw && !isDocs) return;
  const e = text => String(text == null ? '' : text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const summaries = {
    'furukawa-daini-es': {
      title:'無回答を「役員選出の委任」とみなす記載',
      fact:'役員選出のアンケートには、期限までに回答がない場合、選出を委任したものとして調整する旨が記載されています。沈黙を本人の承諾と扱うことは、役員を引き受ける自由と整合するのか重大な疑問があります。',
      action:'無回答を委任とみなす運用を直ちに見直し、本人による明示的な承諾と辞退の自由を確認すること。',
      source:'古川第二小学校・役員選出アンケート／開示文書調査報告書の該当箇所',
      critical:true
    },
    'numabe-es': {
      title:'入学式で学年役員を決める段取りが記載',
      fact:'開示された「令和8年度 入学式の流れ」には、入学式当日に学年役員を決める段取りがあります。入会意思と就任意思をそれぞれ確認し、辞退を妨げない手続か検証が必要です。',
      action:'入会・役員就任の自由を明示し、同意を得ずに役員を決定する運用を行わないこと。',
      source:'沼部小学校「令和8年度 入学式の流れ」／開示文書調査報告書の該当箇所',
      critical:true
    },
    'onuki-es': {
      title:'PTA事務のために教職員を充てる委託契約',
      fact:'校長を受託者とする委託契約に、PTA業務に必要な教職員を選出する旨が記載されています。PTA固有の事務が、公務として行える権限と結び付くのか検証が必要です。',
      action:'学校によるPTA事務受託と教職員の実従事を調べ、公法上の根拠が確認できない取扱いを見直すこと。',
      source:'大貫小学校「PTA委託契約書」／2026年度開示資料',
      critical:true
    },
    'shikitama-es': {
      title:'学校の校務分掌表にPTAの役職',
      fact:'学校の運営組織表には、校長・教頭・教職員をPTAの参与・事務長・庶務・会計に位置付ける記載があります。学校業務とPTAの内部事務の境界があいまいになっています。',
      action:'教職員をPTA事務に充てる根拠と実態を説明し、公務と団体事務を区別すること。',
      source:'敷玉小学校「学校運営組織表」／2026年度開示資料',
      critical:true
    },
    'tajiri-jhs': {
      title:'PTA会費1,500円を学校集金に計上',
      fact:'校長名の学校集金案内にPTA会費1,500円が計上され、会計事務の委託文書も確認されています。任意団体の会費を学校が徴収する権限は、委託の有無とは別に検証する必要があります。',
      action:'本人の加入記録と会費請求の根拠を確認し、学校集金からPTA固有の徴収事務を分離すること。',
      source:'2026年5月11日付学校集金案内・集金内訳表／4月18日付会計事務委託文書',
      critical:true
    },
    'naruko-compulsory': {
      title:'PTA会費を学校の決裁書類で処理',
      fact:'「徴収金会計」の支出伺書にPTA会費が計上され、学校管理職・事務職員の決裁欄があります。学校保有の個人情報をPTA活動に使う目的も校長名の文書に記載されています。',
      action:'PTA会計の学校決裁と個人情報の扱いを直ちに点検し、学校の所掌・権限、個人情報保護法61条・69条への適合を説明すること。',
      source:'鳴子小中学校「支出伺書」「個人情報の取扱い並びに使用の同意について」',
      critical:true
    }
  };
  const axisLabels = {
    school_collection_of_pta_fee:'PTA会費の学校徴収',
    officer_selection_pressure:'役員選出の本人意思',
    teacher_internal_pta_admin:'教職員によるPTA内部事務',
    school_personal_data_for_pta:'学校の個人情報をPTA目的に利用',
    school_account_or_payment_system:'学校の収納経路・口座',
    school_pta_governance_overlap:'学校とPTAの事務の混在',
    voluntary_membership_notice:'任意加入の案内',
    nonmember_equal_treatment:'非会員家庭への公平な取扱い'
  };
  function classOf(s) {
    if (summaries[s.schoolId]?.critical || s.feeRoute === 'school_collection_documented' ||
      s.observations.some(o => o.status === 'confirmed_yes' && ['officer_selection_pressure','teacher_internal_pta_admin'].includes(o.axis))) return 'critical';
    if (s.observations.length) return 'caution';
    return 'unknown';
  }
  function introOf(s) {
    if (summaries[s.schoolId]) return summaries[s.schoolId];
    if (s.feeRoute === 'school_collection_documented') {
      const o = s.observations.find(x => x.axis === 'school_collection_of_pta_fee');
      return {
        title:'PTA会費を学校の事務で徴収する記載',
        fact:o ? o.evidenceNote.split('。')[0] + '。' : '学校によるPTA会費徴収に関する文書が確認されています。',
        action:'学校がPTA固有事務を行える公法上の根拠を明らかにし、必要な分離・改善を進めること。',
        source:o && o.sourceRefs.length ? o.sourceRefs[0].title : '2026年度の学校集金関係開示資料'
      };
    }
    if (s.observations.length) {
      const o = s.observations.find(x => x.status === 'confirmed_yes') || s.observations[0];
      const first = String(o.evidenceNote || '').split('。')[0];
      return {
        title:(axisLabels[o.axis] || o.label) + 'について確認が必要',
        fact:first ? first.slice(0,190) + (first.length > 190 ? '…' : '。') : '開示資料に確認を要する記載があります。関係資料と実際の運用を照合する必要があります。',
        action:'確認された資料に対応する実務を調査し、本人の自由と学校・PTAの事務分離が守られているか説明すること。',
        source:o.sourceRefs.length ? o.sourceRefs[0].title : '2026年度の学校別開示資料'
      };
    }
    return {
      title:'加入意思とPTA事務の実態が、資料だけでは分かりません',
      fact:'今回の公開用評価データからは、学校徴収の有無や本人の加入記録を確定できません。「問題がない」と判断したものではありません。',
      action:'加入申込みと承諾の記録、会費徴収の主体、役員選出の方法、学校の関与を確認すること。',
      source:s.documentDisclosure || '資料収集状況は研究用詳細を参照'
    };
  }
  function schoolCard(s) {
    const tone = classOf(s), d = introOf(s);
    const label = tone === 'critical' ? '早急な調査・改善を要する' : tone === 'caution' ? '重要事項の確認が必要' : '資料不足・引き続き調査';
    return '<a class="osr-school osr--'+tone+'" href="/archive/osaki/'+e(s.schoolId)+'/">' +
      '<span class="osr-school__status">'+e(label)+'</span>' +
      '<strong class="osr-school__name">'+e(s.schoolName)+'</strong>' +
      '<span class="osr-school__focus">'+e(d.title)+'</span><span class="osr-school__link">この学校の評価を見る <span aria-hidden="true">›</span></span></a>';
  }
  function hero(kind, s) {
    const isSchool=kind==='school', tone = isSchool ? classOf(s) : kind==='documents'?'caution':'critical';
    const d = isSchool ? introOf(s) : kind==='documents' ? {
      title:'「入会申込書がない」と「会員になっていない」は同じではありません',
      fact:'開示された23校分の資料にはPTA入会申込書が確認できませんでした。ただし、PTAが独自に保管する記録や、書面以外の申込みが存在しないとは断定できません。',
      action:'誰が会員か、本人の加入意思を何に基づいて確認しているのか、学校・PTA双方に具体的な説明を求めます。',
      source:'大崎市25校・文書10種類の公開用存否台帳'
    } : kind==='law' ? {
      title:'学校の事務と、PTAの事務を混同していませんか。',
      fact:'PTAの会費・会員・役員は、原則として任意団体自身が管理する事務です。学校が行っている実態があるなら、まず公務としての権限を検証しなければなりません。',
      action:'加入意思、役員選出、徴収の根拠、学校の権限、個人情報の利用を分けて確認し、必要な是正を求めます。',
      source:'大崎市25校・15法令検討項目の公開評価'
    } : {
      title:'PTAへの入会も退会も、保護者が自由に決められるか。',
      fact:'大崎市25校の公開評価では、明示的な加入申込と退会手続の明示を確認できた学校はいずれも0校でした。23校の開示資料では加入意思記録・退会関係文書を確認できず、2校は学校別資料が未開示です。これは強制加入や契約不存在の確定ではなく、自由が実際に保障されているかを検証できていないことを示します。',
      action:'最初に入会・非加入・退会の自由と会員資格の確認方法を全校で調査する。そのうえで会費徴収・役員選出・学校の公務権限・個人情報の利用を順次点検し、是正方針を示す。',
      source:'大崎市25校・12評価軸・10文書種の公表済み台帳（2026年11月15日）'
    };
    const tag = tone==='critical'?'早急な調査・改善を要する':tone==='caution'?'重要事項の確認が必要':'資料不足・引き続き調査';
    const mark = '<div class="osr-hero osr--'+tone+'"><span class="osr-status"><span aria-hidden="true">!</span> '+e(tag)+'</span>'+
      '<h2>'+e(d.title)+'</h2><p class="osr-hero__fact">'+e(d.fact)+'</p>'+
      '<div class="osr-action"><strong>求める改善</strong><p>'+e(d.action)+'</p></div>'+
      '<p class="osr-source">確認資料：'+e(d.source)+'</p>'+
      '<p class="osr-caveat">これは開示資料に基づく問題提起です。個々の違法性や権利侵害を確定したものではなく、未開示資料を「不存在」とも扱いません。</p>';
    const support = isSchool && s.observations.length
      ? '<a class="osr-inline" href="#osr-technical">出典・法令の詳細を確認する <span aria-hidden="true">↓</span></a>'
      : '<a class="osr-inline" href="#osr-technical">調査方法・詳細資料を確認する <span aria-hidden="true">↓</span></a>';
    return mark+support+'</div>';
  }
  function overviewSchools(schools) {
    const counts = {
      documented:schools.filter(x => x.feeRoute === 'school_collection_documented').length,
      undisclosed:schools.filter(x => x.documentDisclosure.indexOf('未開示') >= 0).length
    };
    return '<section class="osr-community" id="schools" aria-labelledby="osr-school-heading">'+
      '<div class="osr-section-kicker">学校別の状況を確認する</div><h2 id="osr-school-heading">大崎市の25校は、どのような状況か。</h2>'+
      '<p class="osr-deck">学校を選ぶと、確認された問題・必要な改善が最初に表示されます。細かい集計表や法令検討は、各ページの「研究者向け詳細資料」で開けます。</p>'+
      '<div class="osr-summary-bar"><div><strong>'+counts.documented+'校</strong><span>学校によるPTA会費徴収を示す資料</span></div>'+
      '<div><strong>'+(schools.length-counts.documented)+'校</strong><span>徴収経路が未立証（うち'+counts.undisclosed+'校は学校別資料未開示）</span></div></div>'+
      '<div class="osr-schools">'+schools.map(schoolCard).join('')+'</div>'+
      '<p class="osr-caveat">赤・黄・灰色は「対応・追加確認の優先度」を示し、法令違反や人権侵害の確定認定ではありません。資料不足の学校は、問題なしと判断していません。</p></section>';
  }
  function cityAssessment(m){
    if(!m||!Array.isArray(m.assessmentParagraphs)||!Array.isArray(m.priorities)||m.priorities.length!==5)return '';
    const priorities=m.priorities.map(p=>'<section class="osr-municipal-issue"><div class="osr-municipal-issue-head"><span class="osr-rank">'+e(p.number)+'</span><div><h3>'+e(p.title)+'</h3><span class="osr-issue-status">'+e(p.status)+'</span></div></div><p>'+e(p.description)+'</p><div class="osr-issue-action"><strong>最低限必要なこと</strong><p>'+e(p.action)+'</p></div></section>').join('');
    const sources=(m.legalBasis||[]).map(l=>'<a href="'+e(l.url)+'" target="_blank" rel="noopener">'+e(l.title)+'</a> <span>'+e(l.question)+'</span>').join('<br>');
    return '<section class="osr-municipal" id="municipal-review" aria-labelledby="osr-municipal-heading">'+
      '<p class="osr-municipal-kicker">宮城県大崎市｜2026年度PTA制度・運用の総合評価</p><h2 id="osr-municipal-heading">大崎市の総評</h2>'+
      '<h3 class="osr-municipal-lead">'+e(m.title)+'</h3>'+
      '<p class="osr-municipal-opening">'+e(m.standfirst)+'</p>'+
      '<div class="osr-municipal-stats" aria-label="入会・退会に関する確認状況">'+
      '<div><strong>'+e(m.membership.explicitJoiningConfirmed)+'<small>／25校</small></strong><span>明示的な加入申込を確認</span></div>'+
      '<div><strong>'+e(m.membership.withdrawalProcedureConfirmed)+'<small>／25校</small></strong><span>退会手続の明示を確認</span></div>'+
      '<div><strong>'+e(m.membership.disclosureDocumentsWithoutApplicationOrIntentOrWithdrawal)+'<small>校</small></strong><span>学校別の開示資料で該当3文書種を確認できず</span></div>'+
      '<div><strong>'+e(m.membership.schoolRecordsUndisclosed)+'<small>校</small></strong><span>学校別資料が未開示</span></div></div>'+
      '<div class="osr-municipal-prose">'+m.assessmentParagraphs.map((p,i)=>'<p'+(i===0?' class="osr-municipal-prose-first"':'')+'>'+e(p)+'</p>').join('')+'</div>'+
      '<h3 class="osr-municipal-subhead">大崎市が優先して確認・改善すべき5項目</h3>'+
      '<div class="osr-municipal-issues">'+priorities+'</div>'+
      '<div class="osr-municipal-law"><strong>法的検討の入口</strong><p>'+sources+'</p>'+
      '<p class="osr-caveat">市と学校は公的主体、PTAは独立した私的団体です。学校がPTAの内部事務を扱う場合は、本人同意より先に学校の具体的な所掌事務・公法上の権限を検証し、その後で個人情報保護法61条・69条を検討します。</p></div>'+
      '<p class="osr-caveat">'+e(m.evidenceStatus)+'</p>'+
      '<div class="osr-municipal-links"><a href="#schools">学校別25校の評価を見る</a><a href="/research/osaki-legal-review.html">法令別の詳しい評価を見る</a><a href="/research/osaki-documents.html">文書の提出状況を見る</a></div>'+
      '</section>';
  }
  function communityContext() {
    return '<section class="osr-community osr-community--context" aria-labelledby="osr-freedom-heading">'+
      '<div class="osr-section-kicker">保護者の権利から考える</div>'+
      '<h2 id="osr-freedom-heading">加入しないことも、退会することも、保護者自身が決める。</h2>'+
      '<div class="osr-focus-grid">'+
      '<div class="osr-focus"><strong>第一順位｜加入・退会の自由</strong><p>加入を希望した本人の意思がいつ確認され、非加入と退会の申出がどのように反映されるか。紙の申込書の有無ではなく、会員資格を説明できるかを最初に検証します。</p></div>'+
      '<div class="osr-focus"><strong>役員選出に辞退の自由はあるか</strong><p>古川第二小学校では、無回答を役員選出の委任とみなす記載が確認されています。本人の意思を確認せずに役割を割り当てることは、自由と尊厳に関わる問題です。</p></div>'+
      '<div class="osr-focus"><strong>学校は私的団体の仕事を引き受けられるか</strong><p>PTAの会費徴収や会計は、原則としてPTA固有の事務です。委任や内部規程の存在だけでは、学校が公務として行う権限は生まれません。</p></div>'+
      '</div>'+
      '<p class="osr-caveat">くじ引き・じゃんけん、家庭事情を尋ねる免除審査などは、実施が原資料で確認できた場合だけ当該校の評価に掲載します。大崎市全校で行われているとは扱いません。</p>'+
      '</section>';
  }
  function wrapResearch(article, kind) {
    if (!article) return;
    const original = Array.from(article.childNodes);
    const detail = document.createElement('details');
    detail.className='osr-technical';
    detail.id='osr-technical';
    const sum = document.createElement('summary');
    sum.innerHTML='<span class="osr-technical__icon" aria-hidden="true">＋</span><strong>研究者向け詳細資料を開く</strong><small>12評価軸・法令検証・文書存否・資料出典を全文保存</small>';
    detail.appendChild(sum);
    original.forEach(n => detail.appendChild(n));
    article.replaceChildren(detail);
    const hash=decodeURIComponent(location.hash.slice(1));
    if(hash && detail.querySelector('[id="'+CSS.escape(hash)+'"]')) detail.open=true;
    detail.addEventListener('toggle', () => {
      const icon = sum.querySelector('.osr-technical__icon');
      if(icon) icon.textContent = detail.open?'−':'＋';
    });
  }
  async function init() {
    const main=document.querySelector('main.method');
    const article=main && main.querySelector('article.method-wrap');
    const h1=main && main.querySelector('.method-hero h1');
    if(!main || !article || !h1) return;
    let schools=[],municipal=null;
    try {
      const response=await fetch('/data/osaki-legal-screening-2026.json',{cache:'no-cache'});
      if(!response.ok) throw new Error('School summary unavailable');
      const data=await response.json();
      schools=Array.isArray(data.schools)?data.schools:[];
      if(isOverview){
        try{
          const municipalResponse=await fetch('/data/osaki-municipal-assessment-2026.json',{cache:'no-cache'});
          if(municipalResponse.ok)municipal=await municipalResponse.json();
        }catch(err){console.warn('[osaki reader] municipal assessment unavailable',err)}
      }
    } catch(err) {
      console.warn('[osaki reader] data unavailable, leaving original reports visible',err);
      return;
    }
    const s=schoolMatch && schools.find(item=>item.schoolId===schoolMatch[1]);
    if(schoolMatch&&!s) return;
    const kind=schoolMatch?'school':isOverview?'overview':isLaw?'law':'documents';
    h1.insertAdjacentHTML('afterend',hero(kind,s));
    if(isOverview) {
      const node=document.createElement('div');
      node.innerHTML=cityAssessment(municipal)+communityContext()+overviewSchools(schools);
      const old = article.querySelector('#schools');
      if(old) old.id='schools-technical-original';
      wrapResearch(article,kind);
      article.prepend(...Array.from(node.children));
    } else if(isLaw) {
      const node=document.createElement('div');
      node.innerHTML=communityContext()+'<p class="osr-quick"><a href="/research/osaki.html#schools">大崎市25校の学校別評価を見る</a></p>';
      wrapResearch(article,kind);
      article.prepend(...Array.from(node.children));
    } else {
      wrapResearch(article,kind);
      if(isDocs) {
        const note=document.createElement('p');
        note.className='osr-quick';
        note.innerHTML='<a href="/research/osaki.html#schools">25校の保護者向け評価へ戻る</a>';
        article.prepend(note);
      }
    }
    document.body.classList.add('osaki-readable');
    const hash=decodeURIComponent(location.hash.slice(1));
    if(hash) {
      const target=document.getElementById(hash);
      if(target) setTimeout(()=>target.scrollIntoView({block:'start'}),0);
    }
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
