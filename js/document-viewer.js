(function(){
  'use strict';

  function byId(id){
    return document.getElementById(id);
  }

  function text(id,value){
    var element=byId(id);
    if(element)element.textContent=value||'';
  }

  function addFact(list,label,value){
    if(value===null||value===undefined||value==='')return;
    var term=document.createElement('dt');
    var detail=document.createElement('dd');
    term.textContent=label;
    detail.textContent=String(value);
    list.appendChild(term);
    list.appendChild(detail);
  }

  function addLinkFact(list,label,url,linkText){
    var term=document.createElement('dt');
    var detail=document.createElement('dd');
    var link=document.createElement('a');
    term.textContent=label;
    link.href=url;
    link.target='_blank';
    link.rel='noopener';
    link.textContent=linkText;
    detail.appendChild(link);
    list.appendChild(term);
    list.appendChild(detail);
  }

  function formatBytes(value){
    if(!Number.isFinite(value)||value<0)return '未確認';
    if(value<1024)return value+' B';
    if(value<1024*1024)return (value/1024).toFixed(1)+' KB';
    return (value/(1024*1024)).toFixed(1)+' MB';
  }

  function locationText(item){
    return [item.prefecture,item.municipality,item.school].filter(Boolean).join('／');
  }

  function showError(message){
    byId('documentLoading').hidden=true;
    byId('documentArticle').hidden=true;
    byId('documentError').hidden=false;
    text('documentErrorMessage',message);
  }

  function render(item,data){
    var location=locationText(item);
    var previewUrl='https://drive.google.com/file/d/'+encodeURIComponent(item.driveFileId)+'/preview';
    var viewUrl='https://drive.google.com/file/d/'+encodeURIComponent(item.driveFileId)+'/view';

    document.title='【行政資料】'+item.title+'｜PTA適正化推進委員会';
    var description=document.querySelector('meta[name="description"]');
    if(description)description.setAttribute('content',item.summary);
    var canonical=document.querySelector('link[rel="canonical"]');
    if(canonical)canonical.setAttribute('href','https://ptaorg.com/document.html?id='+encodeURIComponent(item.id));
    text('breadcrumbCurrent',item.title);
    text('documentTitle','【行政資料】'+item.title);
    text('documentLocation',location);
    text('documentLead',item.type+'として収集した原資料を、内容確認メモと併せて掲載しています。');
    text('documentSummary',item.summary);

    var overview=byId('documentOverview');
    overview.replaceChildren();
    addFact(overview,'資料種別',item.type);
    addFact(overview,'発行・作成主体',item.issuer);
    addFact(overview,'資料の日付',item.documentDate||'資料上で特定できず');
    addFact(overview,'ページ数',item.pageCount?item.pageCount+'ページ':'未確認');

    var frame=byId('documentFrame');
    frame.title=item.title+'（原資料PDF）';
    frame.src=previewUrl;
    var driveLink=byId('documentDriveLink');
    driveLink.href=viewUrl;

    var findings=byId('documentFindings');
    findings.replaceChildren();
    (item.findings||[]).forEach(function(value){
      var row=document.createElement('li');
      row.textContent=value;
      findings.appendChild(row);
    });
    text('documentIssues',(item.issues||[]).length?'この資料は、'+item.issues.join('、')+'に関係します。各論点について資料単体から法的評価を断定せず、制度・運用全体と照合して検討します。':'関連論点は確認中です。');

    var provenance=byId('documentProvenance');
    provenance.replaceChildren();
    addFact(provenance,'都道府県',item.prefecture);
    addFact(provenance,'自治体',item.municipality);
    addFact(provenance,'学校・機関',item.school);
    addFact(provenance,'原ファイル名',item.originalFileName);
    addFact(provenance,'Google Drive File ID',item.driveFileId);
    addFact(provenance,'ファイル形式',item.format);
    addFact(provenance,'ファイルサイズ',formatBytes(item.sizeBytes));
    addFact(provenance,'取得日',item.acquiredAt||'未確認');
    addFact(provenance,'内容確認日',item.reviewedAt);
    addFact(provenance,'掲載状態',item.listingStatus);
    addFact(provenance,'台帳更新日',data.documentDataUpdated||data.updated);
    addLinkFact(provenance,'Google Drive URL',viewUrl,'原資料をGoogle Driveで開く');

    byId('documentLoading').hidden=true;
    byId('documentError').hidden=true;
    byId('documentArticle').hidden=false;
  }

  function start(){
    var id=new URLSearchParams(location.search).get('id');
    if(!id){
      showError('資料IDが指定されていません。全国資料ページから資料を選択してください。');
      return;
    }
    fetch('/assets/data/national-materials.json',{cache:'no-store'})
      .then(function(response){
        if(!response.ok)throw new Error('台帳データを取得できませんでした。');
        return response.json();
      })
      .then(function(data){
        var item=(data.documents||[]).find(function(candidate){return candidate.id===id;});
        if(!item){
          showError('指定された資料IDは資料台帳にありません。全国資料ページから資料を選択してください。');
          return;
        }
        render(item,data);
      })
      .catch(function(){
        showError('資料台帳を読み込めませんでした。時間を置いて再度お試しください。');
      });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
