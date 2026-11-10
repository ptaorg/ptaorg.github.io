import json
from pathlib import Path
base=Path(__file__).resolve().parents[1]
# Grounded in published 2026-10-28 research-map-index.json summaries and public index.
regions=[
 ('osaka','大阪市','大阪府',0),('kawaguchi','川口市','埼玉県',38),('kawasaki','川崎市','神奈川県',0),('yokohama','横浜市','神奈川県',0),('matsuyama','松山市','愛媛県',0),('shiga','滋賀県','滋賀県',0),('shizuoka','静岡県','静岡県',0),('hiroshima','広島市','広島県',41),('atsugi','厚木市','神奈川県',36),('hyogo','兵庫県','兵庫県',0),('nishinomiya','西宮市','兵庫県',0),('archive-daito','大東市','大阪府',3),('archive-hikone','彦根市','滋賀県',24),('archive-hirakata','枚方市','大阪府',68),('archive-imizu','射水市','富山県',15),('archive-iwaki','いわき市','福島県',15),('archive-kameoka','亀岡市','京都府',17),('archive-koka','甲賀市','滋賀県',27),('archive-kuki','久喜市','埼玉県',30),('archive-ota','大田区','東京都',81),('archive-sagamihara','相模原市','神奈川県',102),('archive-toyohashi','豊橋市','愛知県',72),('catalog-nagakute','長久手市','愛知県',0),('catalog-ibaraki','茨木市','大阪府',0),('catalog-sendai','仙台市','宮城県',0),('catalog-fuso','扶桑町','愛知県',0),('catalog-kagoshima','鹿児島市','鹿児島県',0),('catalog-kanagawa','神奈川県','神奈川県',0),('catalog-saitama','埼玉県','埼玉県',0)]
# Public sample only. No non-published document bytes are copied.
def school(name,url,typ='小学校',titles=None,status='公開前確認中'):
 return {'name':name,'url':url,'type':typ,'documents':[{'title':t,'status':status} for t in (titles or [f'{name}.pdf'])]}
schools={
 'kawaguchi':[
 school('上青木小学校','/archive/kawaguchi/school-001-es/'),
 school('仲町小学校','/archive/kawaguchi/school-002-es/',titles=['仲町小学校 0626.m4a','仲町小学校.pdf']),
 school('元郷南小学校','/archive/kawaguchi/school-003-es/'),
 school('安行小学校','/archive/kawaguchi/school-009-es/',titles=['安行小学校.pdf','安行小学校1023.m4a'])],
 'atsugi':[
 school('相川小学校','/archive/atsugi/aikawa-es/',titles=['相川小学校 相談受付記録_01.pdf'],status='既存学校ページで確認'),
 school('相川中学校','/archive/atsugi/aikawa-jhs/','中学校',titles=['相川中学校 会議録_04.pdf'],status='既存学校ページで確認'),
 school('厚木小学校','/archive/atsugi/atsugi-es/',titles=['厚木小学校_06.pdf'],status='既存学校ページで確認')],
 'archive-imizu':[
 school('下村小学校','/archive/imizu/school-001-es/',titles=['11-1 下村小学校.pdf']),
 school('中太閤山小学校','/archive/imizu/school-002-es/',titles=['08-1 中太閤山小学校.pdf','08-2 中太閤山小学校.pdf']),
 school('作道小学校','/archive/imizu/school-003-es/',titles=['05-1 作道小学校.pdf','05-2 作道小学校.pdf']),
 school('堀岡小学校','/archive/imizu/school-004-es/',titles=['03-2 堀岡小学校.pdf']),
 school('塚原小学校','/archive/imizu/school-005-es/',titles=['01-1 塚原小学校.pdf','01-2 塚原小学校.pdf'])],
 'archive-hirakata':[
 school('さだ中学校','/archive/hirakata/school-001-jhs/','中学校',titles=['18 さだ中']),
 school('さだ小学校','/archive/hirakata/school-002-es/',titles=['３ さだ小']),
 school('さだ東小学校','/archive/hirakata/school-003-es/',titles=['34 さだ東小（PTAは解散）'])],
 'archive-sagamihara':[
 school('くぬぎ台小学校','/archive/sagamihara/school-001-es/',titles=['034くぬぎ台小学校.pdf']),
 school('もえぎ台小学校','/archive/sagamihara/school-002-es/',titles=['054もえぎ台小学校.pdf']),
 school('上溝中学校','/archive/sagamihara/school-003-jhs/','中学校',titles=['502上溝中学校.pdf'])],
 'archive-koka':[
 school('伴谷小学校','/archive/koka/school-001-es/',titles=['1-1-1_伴谷小_PTA総会資料.pdf','1-4-1_伴谷小_学校徴収金案内.pdf']),
 school('伴谷東小学校','/archive/koka/school-002-es/',titles=['6-1-1_伴谷東小_PTA総会資料.pdf','6-4-1_伴谷東小_学校徴収金案内.pdf'])],
 'archive-kameoka':[school('大井小学校','/archive/kameoka/school-001-es/',titles=['007_大井小学校.pdf'])],
 'hiroshima':[school('上安小学校','/archive/hiroshima/school-001-es/',titles=['上安小学校_01.pdf'])],
 'archive-daito':[school('住道北小学校','/archive/daito/school-001-es/',titles=['④【住道北小学校】学校徴収金案内文書.pdf','⑥【住道北小学校】校務分掌表.pdf'])]
}
summary={
 'kawaguchi':['2025年8月8日の公開回答ではPTAを任意加入団体とし、法令違反の可能性にも言及しています。各学校の運用状況は個別の一次資料で確認する必要があります。'],
 'atsugi':['2026年3月30日通知と4月9日公式回答などを起点に、加入意思・学校会費徴収・学校保有情報を区別して確認します。'],
 'yokohama':['2025年12月1日付学教第1965号通知を中心に、任意加入と個人情報、会費納入、学校関与の実務を検討します。'],
 'kawasaki':['2021年の学校管理運営規則改正に関連し、PTA会費の委任収納と学校の公務の範囲を検討します。'],
 'archive-imizu':['射水市の学校別一次資料を探すための地域索引です。各文書の公開状態を確認してください。']
}
notes={'osaka','kawaguchi','kawasaki','yokohama','matsuyama','shiga','shizuoka','hiroshima','atsugi','hyogo','nishinomiya'}
out=[]
for key,name,pref,n in regions:
 out.append({'id':key,'name':name,'prefecture':pref,'url':f'/research/{key}.html' if key in notes else None,'themes':[],'summary':summary.get(key,[]),'schools':schools.get(key,[]),'sampleOnly':True,'publishedIndexSchoolCount':n})
responses={'responses':[
 {'no':1,'municipality':'三重県','prefecture':'三重県','date':'2025年10月10日','topics':['会費徴収・委任','教委指導・是正'],'url':'https://ptaorg.com/board-responses/01-mie.html'},
 {'no':2,'municipality':'京都府亀岡市','prefecture':'京都府','date':'2025/09/01','topics':['入会意思確認','みなし加入','会費徴収・委任','個人情報・名簿'],'url':'https://ptaorg.com/board-responses/02-kyoto-kameoka.html'}
]}
payload={'demo':True,'description':'公開済み索引から抽出した画面確認用の抜粋。未公開文書原本は含まない。','map':{'version':'demo','municipalities':out},'responses':responses}
(base/'data/demo.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(len(out),'regions',sum(len(m['schools']) for m in out),'sample schools',len(responses['responses']),'responses; full index listed',sum(x[3] for x in regions),'schools')
