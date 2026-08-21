(function(){
  function esc(value){
    return String(value||'').replace(/[&<>'"]/g,function(character){
      return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character];
    });
  }

  function issueList(items){
    return (items||[]).map(function(item){
      return '<span class="archive-drive-issue">'+esc(item)+'</span>';
    }).join('');
  }

  function documentRecord(item){
    var location=[item.prefecture,item.municipality,item.school].filter(Boolean).join('／');
    var detail=[item.type,item.pageCount?item.pageCount+'ページ':'ページ数未確認'].filter(Boolean).join('・');
    return '<article class="archive-material-record"><h4><a href="/document.html?id='+encodeURIComponent(item.id)+'">'+esc(item.title)+'</a></h4><p class="archive-material-meta">'+esc(location)+(detail?'｜'+esc(detail):'')+'</p><p>'+esc(item.summary)+'</p><p><a href="/document.html?id='+encodeURIComponent(item.id)+'">資料をページ内で読む</a></p></article>';
  }

  function renderDriveMaterials(data){
    var target=document.getElementById('archive-drive-materials');
    if(!target||document.getElementById('archive-drive-materials-content'))return;

    var section=document.createElement('section');
    section.className='archive-drive-materials';
    section.id='archive-drive-materials-content';
    section.setAttribute('aria-labelledby','archive-drive-title');

    var folders=data.municipalFolders||[];
    var materials=data.selectedMaterials||[];
    var documents=data.documents||[];
    var folderRows=folders.map(function(item){
      return '<tr><td><strong>'+esc(item.name)+'</strong><br>'+esc(item.prefecture||'')+'</td><td>'+esc(item.observed||'')+'</td><td>'+issueList(item.primaryIssues)+'</td><td><a href="'+esc(item.folderUrl)+'" target="_blank" rel="noopener">原本フォルダ</a></td></tr>';
    }).join('');
    var materialRows=materials.map(function(item){
      return '<tr><td>'+esc(item.municipality)+'</td><td><strong>'+esc(item.school)+'</strong><br>'+esc(item.title)+'<br>'+esc(item.type)+'</td><td>'+esc(item.summary)+'<br>'+issueList(item.issues)+'</td><td><a href="'+esc(item.sourceUrl)+'" target="_blank" rel="noopener">原本資料</a></td></tr>';
    }).join('');
    var documentRows=documents.map(documentRecord).join('');
    var cautions=((data.policy&&data.policy.cautions)||[]).map(function(item){return '<li>'+esc(item)+'</li>';}).join('');
    var rootUrl=esc(data.rootFolder&&data.rootFolder.url||'https://drive.google.com/drive/folders/1tbfpjRNJIhwQypk1vsAOaE7_qwW-lrm5');
    var status=data.loadError?'<p class="archive-drive-status">目録データを読み込めなかったため、親フォルダへのリンクのみ表示しています。</p>':'';
    var folderBody=folderRows||'<tr><td colspan="4">自治体別目録を読み込めませんでした。</td></tr>';
    var materialBody=materialRows||'<tr><td colspan="4">代表資料目録を読み込めませんでした。</td></tr>';

    section.innerHTML='<div class="wrap"><p class="archive-section-number">04 / 原本目録</p><h2 class="section-title" id="archive-drive-title">自治体別の原本資料目録</h2><p class="archive-drive-lead">各地で入手したPTA案内、入会関係書類、会費徴収資料、学校配布文書を、自治体別・学校別に整理しています。確認状況と論点メモは入口として使い、判断するときは必ずリンク先の原本全体を確認してください。</p><div class="archive-drive-actions"><a href="'+rootUrl+'" target="_blank" rel="noopener">全国PTA資料の親フォルダを開く</a><a href="/assets/data/national-materials.json">機械可読の目録JSONを開く</a></div>'+status+(cautions?'<div class="archive-drive-cautions"><strong>目録を読む際の注意</strong><ul>'+cautions+'</ul></div>':'')+'<div class="archive-drive-table-wrap"><table class="archive-drive-table"><thead><tr><th>自治体・区分</th><th>確認状況</th><th>主な論点</th><th>原本</th></tr></thead><tbody>'+folderBody+'</tbody></table></div><div class="archive-drive-representative"><h3>学校名まで確認できる代表資料</h3><div class="archive-drive-table-wrap"><table class="archive-drive-table"><thead><tr><th>自治体</th><th>資料</th><th>確認メモ</th><th>原本</th></tr></thead><tbody>'+materialBody+'</tbody></table></div></div>'+(documentRows?'<div class="archive-drive-representative archive-pilot-documents"><h3>内容を確認した試作資料</h3><p>資料本文まで確認した7件について、共通の閲覧画面で原資料と解説を一緒に読めるようにしています。これは全国展開前の表示方式の試作です。</p><div class="archive-material-records">'+documentRows+'</div></div>':'')+'<p class="archive-drive-updated">目録データ更新：'+esc(data.documentDataUpdated||data.updated||'更新日未確認')+'</p></div>';
    target.insertAdjacentElement('afterend',section);
  }

  function addArchiveDriveMaterials(){
    if(!location.pathname.endsWith('/national-archive.html'))return;
    fetch('/assets/data/national-materials.json',{cache:'no-store'})
      .then(function(response){
        if(!response.ok)throw new Error('Archive index request failed');
        return response.json();
      })
      .then(renderDriveMaterials)
      .catch(function(){
        renderDriveMaterials({
          updated:'更新日未確認',
          loadError:true,
          rootFolder:{url:'https://drive.google.com/drive/folders/1tbfpjRNJIhwQypk1vsAOaE7_qwW-lrm5'},
          municipalFolders:[],
          selectedMaterials:[]
        });
      });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addArchiveDriveMaterials,{once:true});
  else addArchiveDriveMaterials();
})();
