/* PTA適正化推進委員会 | site-next
   Public data only. No credentials, unpublished attachments, or production writes. */
(() => {
  'use strict';
  const normalize = value => String(value || '').normalize('NFKC').replace(/\s+/g, '').toLocaleLowerCase('ja');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = (id, cls='') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const PREFS = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
  const TOPICS = [
    {id:'membership',label:'任意加入・入会',themes:['PTA任意加入','入会申込書・加入意思確認'],topics:['入会意思確認','みなし加入']},
    {id:'fee',label:'会費徴収',themes:['PTA会費の学校徴収','委任契約による公務化','地方自治法235条の4','PTA自己徴収化'],topics:['会費徴収・委任']},
    {id:'privacy',label:'個人情報の利用・提供',themes:['学校保有個人情報の利用・提供'],topics:['個人情報・名簿']},
    {id:'staff',label:'教職員の関与',themes:['教職員のPTA事務従事','職務専念義務免除・兼職承認','学校管理規則・要綱による校務化'],topics:['教職員関与']},
    {id:'facilities',label:'学校施設の利用',themes:[],topics:['学校施設利用']},
    {id:'correction',label:'行政の指導・是正',themes:['制度是正・改善事例','住民監査請求','情報公開・審査請求'],topics:['教委指導・是正']}
  ];
  const SITE = 'https://ptaorg.com';
  const ROOT = (typeof document!=='undefined'&&document.body&&document.body.dataset.root)||'';
  // same-site paths stay inside this site (relative to the page)
  const localLink = p => {if(typeof p!=='string')return ROOT+'index.html';const q=p.replace(/^https?:\/\/(?:www\.)?ptaorg\.(?:com|github\.io)/,'');return /^\/(?:archive|research|journal|board-responses|assets\/docs|assets\/documents)\/[\w./%-]+(?:\.html|\.pdf|\/)$/.test(q)?ROOT+q.slice(1):ROOT+'index.html';};
  const schoolLink = p => `school.html?url=${encodeURIComponent(p)}`;
  const regionLink = id => `municipality.html?id=${encodeURIComponent(id)}`;
  function safeSourceLink(url){try{const x=new URL(url,SITE);return x.origin===SITE?ROOT+(x.pathname.slice(1)||'index.html')+x.hash:ROOT+'board-responses.html';}catch{return ROOT+'board-responses.html';}}
  const fmtDate = d => {const s=String(d||'').trim();const m=s.match(/^(\d{4})[\/.-](\d{1,2})(?:[\/.-](\d{1,2}))?$/);if(m)return [m[1],m[2].padStart(2,'0'),m[3]&&m[3].padStart(2,'0')].filter(Boolean).join('-');return s.replace(/\s+/g,'');};
  let data = {map:{municipalities:[]},responses:{responses:[]},journal:{articles:[]},demo:true};

  /* ---------- data ---------- */
  async function loadJSON(path){const r=await fetch(ROOT+path,{cache:'no-cache'});if(!r.ok)throw Error(`Data unavailable: ${path}`);return r.json();}
  async function loadData(){
    const [fm,fr,fj]=await Promise.allSettled([loadJSON('data/research-map-index.json'),loadJSON('data/board-responses.json'),loadJSON('data/journal-index.json')]);
    const needDemo=!(fm.status==='fulfilled'&&Array.isArray(fm.value.municipalities))||!(fr.status==='fulfilled'&&Array.isArray(fr.value.responses));
    const demo=needDemo?await loadJSON('data/demo.json'):null;
    const map=fm.status==='fulfilled'&&Array.isArray(fm.value.municipalities)?fm.value:demo.map;
    const responses=fr.status==='fulfilled'&&Array.isArray(fr.value.responses)?fr.value:demo.responses;
    const journal=fj.status==='fulfilled'&&Array.isArray(fj.value.articles)?fj.value:{articles:[]};
    return {map,responses,journal,demo:needDemo};
  }
  const allSchools = () => data.map.municipalities.flatMap(m=>(m.schools||[]).map(s=>({...s,regionId:m.id,regionName:m.name,regionPrefecture:m.prefecture})));
  const prefsWithData = () => [...new Set(data.map.municipalities.map(m=>m.prefecture))];
  const status = doc => String(doc?.status||'確認状況未記載');
  const schoolStatus = s => {const st=(s.documents||[]).map(status);return st.includes('公開前確認中')?'公開前確認中':st[0]||'未確認';};
  const topicById = id => TOPICS.find(t=>t.id===id);
  const respBase = r => String(r.municipality||'').replace(/（[^）]*）$/,'').replace(/(教育委員会|教育庁)$/,'');
  const respTitle = r => /教育庁$/.test(r.municipality||'')?`${r.municipality}の回答`:`${respBase(r)}教育委員会の回答`;
  const responsesFor = m => {
    const linked=(m.boardResponses||[]).map(b=>b.url);
    return (data.responses.responses||[]).filter(r=>linked.includes(r.url)||(normalize(respBase(r)).endsWith(normalize(m.name))&&(!r.prefecture||r.prefecture===m.prefecture)));
  };

  /* ---------- search ---------- */
  const sitePages = () => (typeof window!=='undefined'&&Array.isArray(window.PTA_SITE_SEARCH_INDEX)?window.PTA_SITE_SEARCH_INDEX:[]).map(([title,url,desc])=>({title:String(title||'').replace(/\s*[｜|]\s*PTA適正化推進委員会.*$/,''),url:String(url||''),desc:String(desc||'')})).filter(p=>p.title&&p.url);
  const has = (parts,q) => parts.some(x=>normalize(x).includes(q));
  function matchedRecords({query='',prefecture='',schoolType='',topic=''}){
    const q=normalize(query);const t=topicById(topic);
    const themeHit=m=>!t||(m.themes||[]).some(x=>t.themes.includes(x));
    const municipalities=data.map.municipalities.filter(m=>(!prefecture||m.prefecture===prefecture)&&!schoolType&&themeHit(m)&&(!q||has([m.name,m.prefecture,`${m.prefecture}${m.name}`,...(m.aliases||[]),...(m.themes||[])],q)));
    const regionById=Object.fromEntries(data.map.municipalities.map(m=>[m.id,m]));
    const schools=allSchools().filter(s=>{
      if(prefecture&&s.regionPrefecture!==prefecture)return false;
      if(schoolType&&s.type!==schoolType)return false;
      if(t&&!themeHit(regionById[s.regionId]||{}))return false;
      return !q||has([s.name,s.regionName,s.regionPrefecture,`${s.regionPrefecture}${s.regionName}`,...(s.documents||[]).map(d=>d.title)],q);
    });
    const responses=(data.responses.responses||[]).filter(r=>{
      if(schoolType)return false;
      if(prefecture&&r.prefecture!==prefecture)return false;
      if(t&&!(r.topics||[]).some(x=>t.topics.includes(x)))return false;
      // Metadata only; the full answer text is read on the canonical page.
      return !q||has([r.municipality,r.prefecture,...(r.topics||[]),r.date],q);
    });
    const pages=(!q||schoolType||prefecture||t)?[]:sitePages().filter(p=>has([p.title,p.desc],q));
    return {municipalities,schools,responses,pages};
  }

  /* ---------- shared UI ---------- */
  function chrome(){
    const btn=document.querySelector('[data-menu-button]');const nav=document.getElementById('global-nav');
    if(btn&&nav)btn.addEventListener('click',()=>{const open=nav.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));});
    const triggers=[...document.querySelectorAll('.nav-trigger')];
    const closeAll=except=>triggers.forEach(t=>{if(t!==except){t.setAttribute('aria-expanded','false');t.parentElement.classList.remove('is-open');}});
    triggers.forEach(t=>t.addEventListener('click',e=>{e.stopPropagation();const open=t.getAttribute('aria-expanded')!=='true';closeAll(t);t.setAttribute('aria-expanded',String(open));t.parentElement.classList.toggle('is-open',open);}));
    document.addEventListener('click',e=>{if(!e.target.closest('.nav-item'))closeAll();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){const o=triggers.find(t=>t.getAttribute('aria-expanded')==='true');closeAll();if(o)o.focus();}});
    const section=document.body.dataset.section;const cur=section&&document.querySelector(`.nav-trigger[data-nav="${section}"]`);if(cur)cur.classList.add('is-current');
  }
  function fillSelects(){
    document.querySelectorAll('[data-pref-select]').forEach(sel=>PREFS.filter(p=>prefsWithData().includes(p)).forEach(p=>sel.add(new Option(p,p))));
    document.querySelectorAll('[data-topic-select]').forEach(sel=>TOPICS.forEach(t=>sel.add(new Option(t.label,t.id))));
  }
  function writeCounts(){
    const n={regions:data.map.municipalities.length,schools:allSchools().length,responses:data.responses.responses.length,journal:(data.journal.articles||[]).length};
    document.querySelectorAll('[data-stat]').forEach(e=>{const v=n[e.dataset.stat];if(v!=null)e.textContent=v.toLocaleString('ja-JP');});
    const d=data.map.updated;document.querySelectorAll('[data-index-date]').forEach(e=>{e.textContent=data.demo?'画面確認用の抜粋データ':(d?`${d}時点の公開済み索引`:'公開済み索引');});
    const note=document.getElementById('data-note');
    if(note)note.textContent=data.demo?'画面確認用の抜粋データを表示しています。全件は scripts/sync-public-data.mjs で同期します。':`公開済み索引：${n.regions}地域・${n.schools.toLocaleString('ja-JP')}校・教育委員会回答${n.responses}件${d?`（${d}時点）`:''}。件数は索引の登録数で、文書本体の公開数ではありません。`;
  }
  const label = (text,kind='') => `<span class="label ${kind?'label-'+kind:''}">${esc(text)}</span>`;

  /* ---------- home ---------- */

  /* ---------- Japan map (Geolonia SVG) with pins ---------- */
  const NS='http://www.w3.org/2000/svg';
  let svgText=null,pinsData=null;
  const getSvg=async()=>svgText||(svgText=(await (await fetch(ROOT+'assets/map/japan-prefectures.svg')).text()).replace(/^<\?xml[^>]*>\s*/,''));
  const getPins=async()=>pinsData||(pinsData=await (await fetch(ROOT+'data/map-pins.json')).json().catch(()=>({prefs:{},regions:{},responses:{}})));
  function addPin(svg,x,y,r,cls,title,href,label){
    const g=document.createElementNS(NS,href?'a':'g');if(href)g.setAttribute('href',href);
    const c=document.createElementNS(NS,'path');
    // teardrop pin whose tip sits on (x,y)
    c.setAttribute('d',`M${x} ${y} c ${-r*0.9} ${-r*1.4} ${-r*1.6} ${-r*2.1} ${-r*1.6} ${-r*3} a ${r*1.6} ${r*1.6} 0 1 1 ${r*3.2} 0 c 0 ${r*0.9} ${-r*0.7} ${r*1.6} ${-r*1.6} ${r*3} z`);
    c.setAttribute('class',cls);c.setAttribute('stroke-width',String(r*0.35));
    const dot=document.createElementNS(NS,'circle');dot.setAttribute('cx',x);dot.setAttribute('cy',y-r*3);dot.setAttribute('r',r*0.6);dot.setAttribute('fill','#fff');
    const t=document.createElementNS(NS,'title');t.textContent=title;g.append(t,c,dot);
    if(label){const tx=document.createElementNS(NS,'text');tx.setAttribute('x',x+r*2);tx.setAttribute('y',y-r*2.6);tx.setAttribute('class','map-pin-label');tx.setAttribute('font-size',String(r*2.6));tx.textContent=label;g.append(tx);}
    svg.append(g);return g;
  }
  function zoomTo(svg,g,factor){
    const r=g.getBoundingClientRect();const m=svg.getScreenCTM();if(!m||!r.width)return null;const inv=m.inverse();
    const pt=(x,y)=>{const p=svg.createSVGPoint();p.x=x;p.y=y;return p.matrixTransform(inv);};
    const a=pt(r.left,r.top),b=pt(r.right,r.bottom);const w=b.x-a.x,h=b.y-a.y;const size=Math.max(w,h)*factor+40;
    svg.setAttribute('viewBox',`${a.x+w/2-size*0.62} ${a.y+h/2-size/2} ${size*1.24} ${size}`);svg.setAttribute('preserveAspectRatio','xMidYMid slice');return size;
  }
  async function renderMapEl(el){
    try{
      el.innerHTML=await getSvg();const svg=el.querySelector('svg');if(!svg)return;
      const pref=el.dataset.mapPref;const code=PREFS.indexOf(pref)+1;const g=code?svg.querySelector(`.prefecture[data-code="${code}"]`):null;
      let size=1000;if(g){g.classList.add('is-target');size=zoomTo(svg,g,2.4)||1000;}
      const pin=(el.dataset.mapPin||'').split(',').map(Number);
      if(pin.length===2&&pin.every(Number.isFinite))addPin(svg,pin[0],pin[1],size*0.012,'map-pin',`${el.dataset.mapLabel||pref}（概略位置）`,null,el.dataset.mapLabel||'');
    }catch{el.remove();}
  }
  /* list map: whole Japan with grouped pins; items = [{key,xy,kind,count,title,href,onClick}] */
  async function drawPinMap(el,items){
    if(!el)return;
    if(!el.querySelector('svg')){el.innerHTML=await getSvg();}
    const svg=el.querySelector('svg');svg.querySelectorAll('.pin-layer').forEach(n=>n.remove());
    const layer=document.createElementNS(NS,'g');layer.setAttribute('class','pin-layer');svg.append(layer);
    const prefsOn=new Set(items.map(i=>i.pref).filter(Boolean));
    svg.querySelectorAll('.prefecture').forEach(g=>g.classList.toggle('has-data',prefsOn.has(PREFS[g.dataset.code-1])));
    // zoom to the area that has pins (keeps a minimum size so a single city still shows its surroundings)
    let scale=1;
    if(items.length){const xs=items.map(i=>i.xy[0]),ys=items.map(i=>i.xy[1]);const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
      const w=Math.max(x1-x0,180)*1.25+60,h=Math.max(y1-y0,180)*1.25+80;const size=Math.max(w,h/0.9);scale=Math.max(0.45,Math.min(1,size/900));
      svg.setAttribute('viewBox',`${(x0+x1)/2-size/2} ${(y0+y1)/2-size*0.9/2-15} ${size} ${size*0.9}`);svg.setAttribute('preserveAspectRatio','xMidYMid meet');}
    else svg.setAttribute('viewBox','0 0 1000 1000');
    const order={response:0,school:1,region:2};
    for(const it of [...items].sort((a,b)=>(order[a.kind]??3)-(order[b.kind]??3))){
      const cls=it.kind==='response'?'map-pin-resp':it.kind==='school'?'map-pin-school':'map-pin';
      const R=(it.kind==='response'?5.2:6.6)*scale;
      const g=addPin(layer,it.xy[0],it.xy[1],R,cls,it.title,it.href||null,null);
      if(it.count>1){const tx=document.createElementNS(NS,'text');tx.setAttribute('x',it.xy[0]);tx.setAttribute('y',it.xy[1]-R*3+R*0.55);tx.setAttribute('font-size',String(R*1.45));tx.setAttribute('class','pin-count');tx.textContent=it.count>99?'99+':String(it.count);g.append(tx);g.querySelector('circle')?.remove();}
      if(it.onClick){g.style.cursor='pointer';g.addEventListener('click',e=>{e.preventDefault();it.onClick();});}
    }
    const note=el.parentElement&&el.parentElement.querySelector('[data-map-count]');if(note)note.textContent=`地図上の地点：${items.length}`;
  }
  function pinsForResults(r,pins,act){
    const out=[];const want=k=>act==='all'||act===k;
    if(want('response'))for(const x of r.responses){const xy=pins.responses[String(x.no)]||pins.prefs[x.prefecture];if(xy)out.push({kind:'response',xy,pref:x.prefecture,title:`${respTitle(x)}`,href:safeSourceLink(x.url)});}
    if(want('municipality'))for(const m of r.municipalities){const xy=pins.regions[m.id]||pins.prefs[m.prefecture];if(xy)out.push({kind:'region',xy,pref:m.prefecture,title:`${m.name}：自治体の調査`,href:regionLink(m.id)});}
    if(want('school')){const by=new Map();for(const s of r.schools){const k=s.regionId;if(!by.has(k))by.set(k,[]);by.get(k).push(s);}
      for(const [id,list] of by){const m=data.map.municipalities.find(x=>x.id===id);if(!m)continue;const xy=pins.regions[id]||pins.prefs[m.prefecture];if(xy)out.push({kind:'school',xy,pref:m.prefecture,count:list.length,title:`${m.name}：学校の資料 ${list.length}校`,href:`explore.html?tab=school&q=${encodeURIComponent(m.name)}`});}}
    return out;
  }
  async function renderListMaps(){
    const els=[...document.querySelectorAll('[data-list-map]')];if(!els.length)return;
    const pins=await getPins();
    for(const el of els){const kind=el.dataset.listMap;const r={responses:[],municipalities:[],schools:[]};
      if(kind==='responses')r.responses=data.responses.responses||[];
      if(kind==='regions')r.municipalities=data.map.municipalities;
      if(kind==='schools')r.schools=allSchools();
      const act=kind==='responses'?'response':kind==='regions'?'municipality':'school';
      await drawPinMap(el,pinsForResults(r,pins,act));}
  }
  async function renderMap(){
    const box=document.querySelector('[data-japan-map]');const grid=document.querySelector('[data-pref-grid]');
    const active=prefsWithData();const count=p=>data.map.municipalities.filter(m=>m.prefecture===p).length;
    if(grid){grid.innerHTML=PREFS.map(p=>active.includes(p)?`<a class="pref is-active" href="explore.html?pref=${encodeURIComponent(p)}" title="${esc(p)}：${count(p)}地域">${esc(p)}</a>`:`<span class="pref">${esc(p)}</span>`).join('');}
    const note=document.querySelector('[data-pref-note]');if(note)note.textContent=`公開索引のある都道府県：${active.length}／47`;
    if(!box)return;
    try{
      box.innerHTML=await getSvg();
      box.querySelectorAll('.prefecture').forEach(g=>{
        const name=PREFS[Number(g.dataset.code)-1];if(!name)return;
        const t=document.createElementNS('http://www.w3.org/2000/svg','title');t.textContent=active.includes(name)?`${name}（${count(name)}地域）`:name;g.prepend(t);
        if(active.includes(name)){g.classList.add('has-data');g.addEventListener('click',()=>{location.href=`explore.html?pref=${encodeURIComponent(name)}`;});}
      });
      const svg=box.querySelector('svg');const pins=await getPins();
      for(const r of data.responses.responses||[]){const xy=pins.responses[String(r.no)];if(xy)addPin(svg,xy[0],xy[1],4.2,'map-pin-resp',`${r.municipality}：教育委員会の回答`,safeSourceLink(r.url));}
      for(const m of data.map.municipalities){const xy=pins.regions[m.id]||pins.prefs[m.prefecture];if(xy)addPin(svg,xy[0],xy[1],5.2,'map-pin',`${m.name}：自治体の調査${(m.schools||[]).length?`・学校資料${m.schools.length}校`:''}`,regionLink(m.id));}
    }catch(e){box.textContent='地図を読み込めませんでした。右の一覧から選択できます。';}
  }
  function renderHome(){
    renderMap();
    const list=document.querySelector('[data-region-list]');
    if(list){
      const ranked=[...data.map.municipalities].sort((a,b)=>(b.summary?1:0)-(a.summary?1:0)||(b.schools||[]).length-(a.schools||[]).length).slice(0,8);
      list.innerHTML=ranked.map(m=>{const sub=(m.themes||[]).slice(0,3).join('・')||`学校別資料 ${(m.schools||[]).length}校`;return `<li><a href="${regionLink(m.id)}"><strong>${esc(m.name)}</strong><span>${esc(sub)}</span>${icon('chevron')}</a></li>`;}).join('');
    }
    const news=document.querySelector('[data-journal-list]');
    if(news){const items=(data.journal.articles||[]).slice(0,5);
      news.innerHTML=items.length?items.map(a=>`<li><time datetime="${esc(a.published||a.modified||'')}">${esc(a.published||a.modified||'')}</time><a href="${esc(safeSourceLink(a.url))}">${esc(a.title)}</a></li>`).join(''):'<li>論考データが同期されていません。</li>';}
  }

  /* ---------- explore ---------- */
  function rowMunicipality(m){
    const n=(m.schools||[]).length;const rs=responsesFor(m).length;
    return `<article class="result-row"><span class="row-icon">${icon('home')}</span><div class="row-body">${label('自治体の調査','region')}<h3><a href="${regionLink(m.id)}">${esc(m.prefecture===m.name?m.name:m.prefecture+' '+m.name)}</a></h3><p>${esc((m.summary||[])[0]||'学校別資料の索引のみ登録されています。')}</p><div class="meta">${n?`<span>学校索引 ${n}校</span>`:''}${rs?`<span>教育委員会回答 ${rs}件</span>`:''}${m.updated?`<span>${icon('calendar')}${esc(m.updated)}</span>`:''}</div></div><a class="row-go" href="${regionLink(m.id)}" aria-label="${esc(m.name)}の調査">${icon('chevron')}</a></article>`;
  }
  function rowSchool(s){
    const st=schoolStatus(s);
    return `<article class="result-row"><span class="row-icon">${icon('folder')}</span><div class="row-body">${label('学校の資料','school')}<h3><a href="${schoolLink(s.url)}">${esc(s.name)}</a></h3><div class="meta"><span>${icon('pin')}${esc(s.regionPrefecture)} ${esc(s.regionName)}</span><span>${esc(s.type||'学校種別未記載')}</span><span>文書 ${(s.documents||[]).length}件</span>${label(st,st==='公開前確認中'?'caution':'')}</div></div><a class="row-go" href="${schoolLink(s.url)}" aria-label="${esc(s.name)}の資料">${icon('chevron')}</a></article>`;
  }
  function rowResponse(r){
    const href=esc(safeSourceLink(r.url));
    return `<article class="result-row"><span class="row-icon">${icon('doc')}</span><div class="row-body">${label('教育委員会の回答','response')}<h3><a href="${href}">${esc(respTitle(r))}</a></h3><div class="meta"><span>${icon('calendar')}${esc(fmtDate(r.date)||'日付記載なし')}</span>${r.typeLabel?`<span>${esc(r.typeLabel.replace(/^[A-Z]:/,''))}</span>`:''}</div><div class="tag-row">${(r.topics||[]).slice(0,4).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div><a class="row-go" href="${href}" aria-label="${esc(r.municipality)}の回答原文">${icon('out')}</a></article>`;
  }
  function rowPage(p){
    const href=esc(p.url.replace(/^\//,''));
    return `<article class="result-row"><span class="row-icon">${icon('book')}</span><div class="row-body">${label('ページ','analysis')}<h3><a href="${href}">${esc(p.title)}</a></h3><p>${esc(p.desc)}</p></div><a class="row-go" href="${href}" aria-label="${esc(p.title)}">${icon('chevron')}</a></article>`;
  }
  function renderExplorer(){
    const mc=document.querySelector('.explore-map details');if(mc&&window.innerWidth<1040)mc.removeAttribute('open');
    const form=document.getElementById('explore-form');const q=document.getElementById('query');const pref=document.getElementById('prefecture');const type=document.getElementById('school-type');const topic=document.getElementById('topic');
    const tabs=[...document.querySelectorAll('[data-tab]')];const out=document.getElementById('results');const empty=document.getElementById('empty-results');
    PREFS.filter(p=>prefsWithData().includes(p)).forEach(p=>pref.add(new Option(p,p)));
    const u=new URL(location.href);q.value=u.searchParams.get('q')||'';pref.value=u.searchParams.get('pref')||'';type.value=u.searchParams.get('type')||'';topic.value=u.searchParams.get('topic')||'';
    let active=u.searchParams.get('tab')||'all';if(!['all','municipality','school','response','page'].includes(active))active='all';let max=30;
    const sync=()=>{const p=new URLSearchParams();if(q.value.trim())p.set('q',q.value.trim());if(pref.value)p.set('pref',pref.value);if(topic.value)p.set('topic',topic.value);if(type.value)p.set('type',type.value);if(active!=='all')p.set('tab',active);history.replaceState(null,'',`explore.html${p.toString()?'?'+p:''}`);};
    function draw(){
      sync();const r=matchedRecords({query:q.value,prefecture:pref.value,schoolType:type.value,topic:topic.value});
      const c={municipality:r.municipalities.length,school:r.schools.length,response:r.responses.length,page:r.pages.length};c.all=c.municipality+c.school+c.response+c.page;
      Object.entries(c).forEach(([k,n])=>{document.getElementById('count-'+k).textContent=n.toLocaleString('ja-JP');});
      tabs.forEach(t=>{const on=t.dataset.tab===active;t.setAttribute('aria-selected',String(on));t.classList.toggle('is-active',on);});
      const want=k=>active==='all'||active===k;
      const items=[...(want('municipality')?r.municipalities.map(v=>rowMunicipality(v)):[]),...(want('page')?r.pages.map(v=>rowPage(v)):[]),...(want('response')?r.responses.map(v=>rowResponse(v)):[]),...(want('school')?r.schools.map(v=>rowSchool(v)):[])];
      document.getElementById('result-count').textContent=`${items.length.toLocaleString('ja-JP')}件`;
      out.innerHTML=items.slice(0,max).join('');
      if(items.length>max){const b=document.createElement('div');b.className='more-results';b.innerHTML=`<button class="button button-secondary" type="button">さらに表示（残り${items.length-max}件）</button>`;b.querySelector('button').addEventListener('click',()=>{max+=60;draw();});out.append(b);}
      empty.hidden=items.length!==0;
      const mapEl=document.querySelector('[data-explore-map]');
      if(mapEl)getPins().then(pins=>drawPinMap(mapEl,pinsForResults(r,pins,active==='page'?'none':active)));
    }
    form.addEventListener('submit',e=>{e.preventDefault();max=30;draw();});
    [q,pref,type,topic].forEach(el=>el.addEventListener(el===q?'input':'change',()=>{max=30;draw();}));
    tabs.forEach(t=>t.addEventListener('click',()=>{active=t.dataset.tab;max=30;draw();}));
    document.getElementById('clear-filters').addEventListener('click',()=>{q.value='';pref.value='';type.value='';topic.value='';active='all';max=30;draw();q.focus();});
    const copy=document.getElementById('copy-url');copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);copy.textContent='コピーしました';}catch{copy.textContent='URLをコピーできませんでした';}setTimeout(()=>{copy.textContent='検索条件をコピー';},2000);});
    draw();
  }

  /* ---------- municipality ---------- */
  async function prefMap(target,prefName){
    try{
      const svgText=await (await fetch(ROOT+'assets/map/japan-prefectures.svg')).text();
      target.innerHTML=svgText.replace(/^<\?xml[^>]*>\s*/,'');
      const svg=target.querySelector('svg');const code=PREFS.indexOf(prefName)+1;const g=svg.querySelector(`.prefecture[data-code="${code}"]`);
      if(!g)return;g.classList.add('is-target');
      const r=g.getBoundingClientRect();const m=svg.getScreenCTM();if(!m||!r.width)return;const inv=m.inverse();
      const pt=(x,y)=>{const p=svg.createSVGPoint();p.x=x;p.y=y;return p.matrixTransform(inv);};
      const a=pt(r.left,r.top),b=pt(r.right,r.bottom);const w=b.x-a.x,h=b.y-a.y;const size=Math.max(w,h)*2.4+40;
      svg.setAttribute('viewBox',`${a.x+w/2-size*0.62} ${a.y+h/2-size/2} ${size*1.24} ${size}`);svg.setAttribute('preserveAspectRatio','xMidYMid slice');
    }catch{target.remove();}
  }
  function renderMunicipality(){
    const id=new URL(location.href).searchParams.get('id')||'';const root=document.getElementById('municipality-root');
    const m=data.map.municipalities.find(x=>x.id===id);
    if(!m){root.innerHTML=`<div class="container"><div class="empty-state"><h1>自治体が見つかりません</h1><p>全国の資料検索から選び直してください。</p><a class="button button-primary" href="explore.html?tab=municipality">自治体の一覧へ</a></div></div>`;return;}
    const isPref=m.name===m.prefecture;document.title=`${m.name}｜自治体別調査｜PTA適正化推進委員会`;
    const resp=responsesFor(m);const schools=m.schools||[];const sources=m.sources||[];const articles=m.articles||[];const legal=m.legal||[];
    const primary=sources.filter(s=>s.kind==='primary');const writings=[...new Map([...articles,...sources.filter(s=>s.kind==='article')].map(a=>[a.url,a])).values()];
    const lead=m.summary?'任意加入、会費徴収、個人情報の取扱いについて、教育委員会の通知・回答と学校の資料を整理し、関連する分析とともに掲載しています。':'学校別資料の索引を登録しています。この地域の研究ノートはまだ作成していません。';
    const stat=(ic,lab,n,href)=>`<a class="stat-tile" href="${href}">${icon(ic)}<span><small>${lab}</small><strong>${n}<em>件</em></strong></span></a>`;
    const srcRow=(s,kind)=>{const href=esc(s.url&&s.url.startsWith('http')?safeSourceLink(s.url):localLink(s.url));const pdf=/\.pdf$/i.test(s.url||'');
      return `<li class="doc-row"><span class="doc-kind">${label(kind==='response'?'回答':pdf?'PDF':kind==='primary'?'原資料':'論考',kind==='response'?'response':kind==='primary'?'primary':'analysis')}</span><div class="doc-main"><a href="${href}">${esc(s.title)}</a><div class="meta">${s.date?`<span>${icon('calendar')}${esc(fmtDate(s.date))}</span>`:''}${s.publisher?`<span>${esc(s.publisher)}</span>`:''}${s.topics?s.topics.slice(0,3).map(t=>`<span class="tag">${esc(t)}</span>`).join(''):''}</div></div><a class="doc-open" href="${href}">${pdf?'PDFを開く':'原文を見る'}${icon('out')}</a></li>`;};
    const respRows=resp.map(r=>srcRow({title:respTitle(r),url:r.url,date:r.date,publisher:respBase(r)+'教育委員会',topics:r.topics},'response')).join('');
    const primRows=primary.map(s=>srcRow(s,'primary')).join('');
    const SHOW=12;
    const schoolRows=schools.map((s,i)=>{const st=schoolStatus(s);return `<tr${i>=SHOW?' class="is-extra" hidden':''}><th scope="row"><a href="${schoolLink(s.url)}">${esc(s.name)}</a></th><td>${esc(s.type||'—')}</td><td>${(s.documents||[]).length}件</td><td>${label(st,st==='公開前確認中'?'caution':'')}</td></tr>`;}).join('');
    root.innerHTML=`
    <section class="page-hero">
      <div class="page-hero-map" aria-hidden="true" data-map data-map-pref="${esc(m.prefecture)}" data-map-label="${esc(m.name)}"></div>
      <div class="container">
        <nav class="breadcrumb" aria-label="パンくず"><ol><li><a href="index.html">トップ</a></li><li><a href="explore.html?tab=municipality">全国調査</a></li>${isPref?'':`<li><a href="explore.html?pref=${encodeURIComponent(m.prefecture)}">${esc(m.prefecture)}</a></li>`}<li aria-current="page">${esc(m.name)}</li></ol></nav>
        <span class="label">自治体別調査</span>
        <h1>${esc(m.name)}</h1>
        <p class="page-lead">${lead}</p>
      </div>
    </section>
    <div class="container">
      <form class="search-panel search-panel-local" action="explore.html" method="get" role="search">
        <div class="search-panel-title">${icon('search')}<div><h2>資料・記録を検索する</h2><p>${esc(m.name)}に関する回答・学校資料・<br class="pc-only">論考を検索できます。</p></div></div>
        <div class="search-panel-body"><div class="search-field"><label class="sr-only" for="local-q">キーワード</label>${icon('search')}<input type="search" id="local-q" name="q" value="${esc(m.name)}" autocomplete="off"><button type="submit">検索</button></div>
          <div class="search-filters"><label>資料種別<select name="tab"><option value="">すべての資料</option><option value="school">学校の資料</option><option value="response">教育委員会の回答</option></select></label><label>論点<select name="topic" data-topic-select><option value="">すべて</option></select></label></div></div>
        <div class="search-panel-side"><a href="explore.html">詳細検索${icon('chevron')}</a></div>
      </form>
      <nav class="page-tabs" aria-label="このページの構成"><a href="#overview" class="is-active">概要</a><a href="#responses">行政回答・原資料</a><a href="#schools">学校別資料</a><a href="#analysis">関連する法的分析</a></nav>
      <div class="detail-layout">
        <div class="detail-main">
          <section class="detail-section" id="overview"><h2>${icon('list')}調査の概要</h2>
            ${(m.summary||[]).map(t=>`<p>${esc(t)}</p>`).join('')||'<p>この地域は学校別資料の索引のみを登録しています。教育委員会の回答や研究ノートが登録された時点で、ここに概要を掲載します。</p>'}
            <div class="stat-tiles">${stat('doc','行政の回答',resp.length,'#responses')}${stat('folder','学校の資料',schools.length,'#schools')}${stat('scale','原資料',primary.length,'#responses')}${stat('book','論考・分析',writings.length,'#analysis')}</div>
            ${(m.themes||[]).length?`<div class="theme-row"><span>主な論点</span>${m.themes.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>`:''}
            ${(m.system||[]).length?`<h3>制度の整理</h3>${m.system.map(t=>`<p>${esc(t)}</p>`).join('')}`:''}
            ${(m.timeline||[]).length?`<h3>経過</h3><ol class="timeline">${m.timeline.map(t=>`<li><time>${esc(fmtDate(t.date))}</time><div><strong>${esc(t.title)}</strong><p>${esc(t.text||'')}</p></div></li>`).join('')}</ol>`:''}
          </section>
          <section class="detail-section" id="responses"><div class="section-head"><h2>${icon('list')}行政回答・原資料</h2>${resp.length?`<a class="more-link" href="explore.html?tab=response&q=${encodeURIComponent(m.name)}">一覧を見る${icon('chevron')}</a>`:''}</div>
            <p class="section-lead">${esc(m.name)}教育委員会の回答・通知と、PTAの取扱いに関する原資料です。</p>
            ${respRows||primRows?`<ul class="doc-list">${respRows}${primRows}</ul>`:'<p class="empty-line">現在の索引には、この地域の公開済み回答・原資料が登録されていません。存在しないことを意味するものではありません。</p>'}
          </section>
          <section class="detail-section" id="schools"><div class="section-head"><h2>${icon('folder')}学校別資料</h2>${schools.length?`<a class="more-link" href="explore.html?tab=school&q=${encodeURIComponent(m.name)}">一覧を見る${icon('chevron')}</a>`:''}</div>
            <p class="section-lead">${esc(m.name)}内の学校におけるPTAの規約・案内・会費等の資料の登録状況です。</p>
            ${schools.length?`<div class="table-wrap"><table class="index-table"><thead><tr><th scope="col">学校名</th><th scope="col">種別</th><th scope="col">文書</th><th scope="col">状況</th></tr></thead><tbody>${schoolRows}</tbody></table></div>${schools.length>SHOW?`<button class="button button-secondary" type="button" data-show-all>すべて表示（${schools.length}校）</button>`:''}`:`<a class="row-link" href="explore.html?tab=school&pref=${encodeURIComponent(m.prefecture)}">${icon('folder')}<strong>学校資料の掲載一覧（0件）</strong><span>${esc(m.prefecture)}の学校資料を探す</span>${icon('chevron')}</a>`}
          </section>
          <section class="detail-section" id="analysis"><h2>${icon('scale')}関連する法的分析</h2>
            ${legal.length?`<ol class="analysis-list">${legal.map(l=>`<li><strong>${esc(l.title)}</strong><p>${esc(l.text)}</p></li>`).join('')}</ol>`:''}
            ${(m.unknowns||[]).length?`<div class="notice notice-unknown"><strong>未確認の事項</strong><ul>${m.unknowns.map(u=>`<li>${esc(u)}</li>`).join('')}</ul></div>`:''}
            ${writings.length?`<h3>関連する論考</h3><ul class="plain-links">${writings.map(a=>`<li><a href="${esc(localLink(a.url))}">${esc(a.title)}</a></li>`).join('')}</ul>`:''}
            <article class="feature feature-wide"><div><span class="label">基本的な検討方法</span><h3><a href="framework.html">学校と外部団体の境界をどう確認するか</a></h3><p>主体・事務の帰属・学校の公法上の権限・個人情報・教職員の関与を順に検討する。</p><a class="text-link" href="framework.html">論考を見る${icon('chevron')}</a></div><div class="paper-ornament feature-ornament" aria-hidden="true"></div></article>
          </section>
        </div>
        <aside class="detail-side">
          <section class="side-box"><h2>${icon('pin')}${esc(m.name)}の基本情報</h2><dl class="info-table"><dt>都道府県</dt><dd>${esc(m.prefecture)}</dd><dt>自治体</dt><dd>${esc(m.name)}</dd>${m.type?`<dt>区分</dt><dd>${esc(m.type)}</dd>`:''}<dt>学校索引</dt><dd>${schools.length}校</dd>${m.updated?`<dt>索引更新</dt><dd>${esc(m.updated)}</dd>`:''}</dl><p class="side-note">※ 数は当委員会の公開索引への登録数です。自治体の学校総数ではありません。</p></section>
          <section class="side-box"><h2>${icon('search')}この自治体の資料を探す</h2><ul class="side-links">
            <li><a href="#responses">${icon('folder')}行政回答・通知（${resp.length}件）${icon('chevron')}</a></li>
            <li><a href="#schools">${icon('folder')}学校の資料（${schools.length}校）${icon('chevron')}</a></li>
            <li><a href="#responses">${icon('doc')}原資料（${primary.length}件）${icon('chevron')}</a></li>
            <li><a href="#analysis">${icon('book')}論考・分析（${writings.length}件）${icon('chevron')}</a></li></ul></section>
          <section class="side-box"><h2>${icon('link')}参考リンク</h2><ul class="side-links">
            ${m.url?`<li><a href="${esc(localLink(m.url))}">${esc(m.name)}の研究ノート${icon('chevron')}</a></li>`:''}
            ${m.catalogUrl?`<li><a href="${esc(safeSourceLink(m.catalogUrl))}">資料目録${icon('chevron')}</a></li>`:''}
            <li><a href="national-archive.html">全国資料館${icon('chevron')}</a></li>
            <li><a href="board-responses.html">教育委員会回答データベース${icon('chevron')}</a></li></ul>
            ${(m.comparisons||[]).length?`<h3 class="side-sub">比較する自治体</h3><ul class="side-links">${m.comparisons.map(cid=>{const c=data.map.municipalities.find(x=>x.id===cid);return c?`<li><a href="${regionLink(c.id)}">${esc(c.name)}${icon('chevron')}</a></li>`:'';}).join('')}</ul>`:''}
          </section>
        </aside>
      </div>
    </div>`;
    root.querySelectorAll('[data-topic-select]').forEach(sel=>TOPICS.forEach(t=>sel.add(new Option(t.label,t.id))));
    const all=root.querySelector('[data-show-all]');if(all)all.addEventListener('click',()=>{root.querySelectorAll('tr.is-extra').forEach(tr=>{tr.hidden=false;});all.remove();});
    const tabs=[...root.querySelectorAll('.page-tabs a')];tabs.forEach(a=>a.addEventListener('click',()=>{tabs.forEach(x=>x.classList.toggle('is-active',x===a));}));
    if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)tabs.forEach(x=>x.classList.toggle('is-active',x.getAttribute('href')==='#'+e.target.id));}),{rootMargin:'-30% 0px -60% 0px'});root.querySelectorAll('.detail-section').forEach(s=>io.observe(s));}
    getPins().then(p=>{const el=root.querySelector('[data-map]');const xy=p.regions[m.id]||p.prefs[m.prefecture];if(xy)el.dataset.mapPin=xy.join(',');renderMapEl(el);});
  }

  /* ---------- school ---------- */
  function renderSchool(){
    const url=new URL(location.href).searchParams.get('url')||'';const root=document.getElementById('school-root');const s=allSchools().find(x=>x.url===url);
    if(!s){root.innerHTML=`<div class="container"><div class="empty-state"><h1>学校が見つかりません</h1><p>全国の資料検索から学校名を探してください。</p><a class="button button-primary" href="explore.html?tab=school">学校の一覧へ</a></div></div>`;return;}
    document.title=`${s.name}｜学校別資料｜PTA適正化推進委員会`;
    const docs=s.documents||[];const peers=allSchools().filter(x=>x.regionId===s.regionId&&x.url!==s.url).slice(0,6);
    root.innerHTML=`
    <section class="page-hero"><div class="page-hero-map" aria-hidden="true" data-map data-map-pref="${esc(s.regionPrefecture)}" data-map-label="${esc(s.regionName)}"></div><div class="container">
      <nav class="breadcrumb" aria-label="パンくず"><ol><li><a href="index.html">トップ</a></li><li><a href="explore.html?tab=school">学校の資料</a></li><li><a href="${regionLink(s.regionId)}">${esc(s.regionName)}</a></li><li aria-current="page">${esc(s.name)}</li></ol></nav>
      <span class="label">学校別資料</span><h1>${esc(s.name)}</h1>
      <p class="page-lead">${esc(s.regionPrefecture)}${esc(s.regionName===s.regionPrefecture?'':s.regionName)}の${esc(s.type||'学校')}。PTA関係文書の登録状況を示します。</p>
    </div></section>
    <div class="container"><div class="detail-layout">
      <div class="detail-main">
        <section class="detail-section"><h2>${icon('folder')}登録文書（${docs.length}件）</h2>
          <ul class="doc-list">${docs.map(d=>{const st=status(d);return `<li class="doc-row"><span class="doc-kind">${label(/\.pdf$/i.test(d.title||'')?'PDF':/\.(m4a|mp3|wav)$/i.test(d.title||'')?'音声':'文書','primary')}</span><div class="doc-main"><strong>${esc(d.title||'資料名未確認')}</strong></div>${label(st,st==='公開前確認中'?'caution':'')}</li>`;}).join('')||'<li class="empty-line">登録文書はありません。</li>'}</ul>
          <div class="notice notice-caution"><strong>状況表示の意味</strong><p>文書の登録、原本の公開、内容の確認、法的評価は別の段階です。「公開前確認中」の原本は、このサイトではリンクを作成しません。この画面は登録情報を示すもので、適法・違法を判断するものではありません。</p></div>
        </section>
      </div>
      <aside class="detail-side">
        <section class="side-box"><h2>${icon('pin')}学校の基本情報</h2><dl class="info-table"><dt>都道府県</dt><dd>${esc(s.regionPrefecture)}</dd><dt>自治体</dt><dd><a href="${regionLink(s.regionId)}">${esc(s.regionName)}</a></dd><dt>学校種別</dt><dd>${esc(s.type||'未記載')}</dd><dt>登録文書</dt><dd>${docs.length}件</dd></dl></section>
        <section class="side-box"><h2>${icon('link')}参考リンク</h2><ul class="side-links"><li><a href="${regionLink(s.regionId)}">${esc(s.regionName)}の調査${icon('chevron')}</a></li><li><a href="${esc(localLink(s.url))}">学校別資料ページ${icon('chevron')}</a></li></ul>
          ${peers.length?`<h3 class="side-sub">${esc(s.regionName)}の他の学校</h3><ul class="side-links">${peers.map(p=>`<li><a href="${schoolLink(p.url)}">${esc(p.name)}${icon('chevron')}</a></li>`).join('')}<li><a href="explore.html?tab=school&q=${encodeURIComponent(s.regionName)}">すべて見る${icon('chevron')}</a></li></ul>`:''}
        </section>
      </aside>
    </div></div>`;
    getPins().then(p=>{const el=root.querySelector('[data-map]');const xy=p.regions[s.regionId]||p.prefs[s.regionPrefecture];if(xy)el.dataset.mapPin=xy.join(',');renderMapEl(el);});
  }

  function tocSpy(){
    const links=[...document.querySelectorAll('.side-toc a[href^="#"]')];if(!links.length||!('IntersectionObserver' in window))return;
    const map=new Map(links.map(a=>[decodeURIComponent(a.getAttribute('href').slice(1)),a]));
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){links.forEach(a=>a.classList.remove('is-active'));const a=map.get(e.target.id);if(a)a.classList.add('is-active');}}),{rootMargin:'-15% 0px -70% 0px'});
    map.forEach((a,id)=>{const t=document.getElementById(id);if(t)io.observe(t);});
  }
  async function init(){
    chrome();
    if(document.body.dataset.page==='legacy'){document.querySelectorAll('[data-map]').forEach(renderMapEl);tocSpy();
      if(document.querySelector('[data-list-map]')){try{data=await loadData();await renderListMaps();}catch(e){console.error(e);}}
      return;}
    try{data=await loadData();fillSelects();writeCounts();const p=document.body.dataset.page;
      if(p==='home')renderHome();if(p==='explore')renderExplorer();if(p==='municipality')renderMunicipality();if(p==='school')renderSchool();
    }catch(e){console.error('Failed to load public site data:',e);const t=document.getElementById('data-note')||document.getElementById('municipality-root')||document.getElementById('school-root');if(t)t.textContent='データを読み込めませんでした。HTTPサーバー経由で開いてください。';}
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={normalize,TOPICS,PREFS,safeSourceLink,localLink,fmtDate,matchedRecordsFactory:(map,responses,query)=>{data={map,responses,journal:{articles:[]}};return matchedRecords(query);}};
  if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',init);
})();
