const {chromium}=require('playwright');const fs=require('fs');
const PREFS=['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:1000}});
const svg=fs.readFileSync('/home/claude/ptaorg-site-next/assets/map/japan-prefectures.svg','utf8').replace(/^<\?xml[^>]*>/,'');
await p.setContent(`<body style="margin:0">${svg.replace('<svg','<svg width="1000" height="1000"')}</body>`);
const pts=JSON.parse(fs.readFileSync('geo-points.json'));
const res=await p.evaluate(({pts,PREFS})=>{
 const svg=document.querySelector('svg');const inv=svg.getScreenCTM().inverse();
 const toRoot=(x,y)=>{const q=svg.createSVGPoint();q.x=x;q.y=y;return q.matrixTransform(inv);};
 const centers={};for(const g of svg.querySelectorAll('.prefecture')){const r=g.getBoundingClientRect();const a=toRoot(r.left,r.top),c=toRoot(r.right,r.bottom);centers[PREFS[g.dataset.code-1]]=[(a.x+c.x)/2,(a.y+c.y)/2];}
 // least squares affine: [x,y] = A*[lon,lat,1]
 const rows=pts.filter(p=>p.pref!=='沖縄県'&&centers[p.pref]);
 function solve(target){ // normal equations 3x3
   const M=[[0,0,0],[0,0,0],[0,0,0]],v=[0,0,0];
   for(const p of rows){const f=[p.ll[1],p.ll[0],1];const t=centers[p.pref][target];for(let i=0;i<3;i++){v[i]+=f[i]*t;for(let j=0;j<3;j++)M[i][j]+=f[i]*f[j];}}
   // gaussian
   const A=M.map((r,i)=>[...r,v[i]]);for(let i=0;i<3;i++){let mx=i;for(let k=i+1;k<3;k++)if(Math.abs(A[k][i])>Math.abs(A[mx][i]))mx=k;[A[i],A[mx]]=[A[mx],A[i]];for(let k=0;k<3;k++){if(k===i)continue;const f=A[k][i]/A[i][i];for(let j=i;j<4;j++)A[k][j]-=f*A[i][j];}}
   return A.map((r,i)=>r[3]/r[i]);}
 const X=solve(0),Y=solve(1);
 const proj=ll=>[X[0]*ll[1]+X[1]*ll[0]+X[2],Y[0]*ll[1]+Y[1]*ll[0]+Y[2]];
 const inside=(pref,pt)=>{const g=svg.querySelector(`.prefecture[data-code="${PREFS.indexOf(pref)+1}"]`);for(const sh of g.querySelectorAll('path,polygon')){const m=sh.getCTM().inverse();const q=svg.createSVGPoint();q.x=pt[0];q.y=pt[1];
   // root coords -> screen -> element
   const s=q.matrixTransform(svg.getScreenCTM());const e=s.matrixTransform(sh.getScreenCTM().inverse());const P=svg.createSVGPoint();P.x=e.x;P.y=e.y;if(sh.isPointInFill(P))return true;}return false;};
 let ok=0;const bad=[];for(const p of pts){if(p.pref==='沖縄県')continue;const xy=proj(p.ll);if(inside(p.pref,xy))ok++;else bad.push([p.name,p.pref,xy.map(Math.round),centers[p.pref].map(Math.round)]);}
 return {X,Y,ok,total:pts.filter(p=>p.pref!=='沖縄県').length,bad,okinawa:centers['沖縄県']};
},{pts,PREFS});
console.log(JSON.stringify(res,null,0).slice(0,3000));fs.writeFileSync('fit.json',JSON.stringify(res));await b.close();})();
