const {chromium}=require('playwright');const fs=require('fs');
const PREFS=['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:1000}});
const svg=fs.readFileSync('/home/claude/ptaorg-site-next/assets/map/japan-prefectures.svg','utf8').replace(/^<\?xml[^>]*>/,'');
await p.setContent(`<style>body{margin:0}.boundary-line{display:none}</style>${svg.replace('<svg','<svg width="1000" height="1000"')}`);
const grid=await p.evaluate(()=>{const S=2,N=500;const out=new Uint8Array(N*N);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const e=document.elementFromPoint(x*S+1,y*S+1);const g=e&&e.closest&&e.closest('.prefecture');out[y*N+x]=g?+g.dataset.code:0;}return Array.from(out);});
// viewBox is 0 0 1000 1000 and rendered 1000px -> pixel == root unit
const N=500,S=2;const pts=JSON.parse(fs.readFileSync('geo-points.json')).filter(q=>q.pref!=='沖縄県');
const code=q=>PREFS.indexOf(q.pref)+1;
// distance transform per needed prefecture (BFS)
const need=[...new Set(pts.map(code))];const dist={};
for(const c of need){const d=new Float32Array(N*N).fill(1e9);const qu=[];for(let i=0;i<N*N;i++)if(grid[i]===c){d[i]=0;qu.push(i);}
 for(let h=0;h<qu.length;h++){const i=qu[h],x=i%N,y=(i/N)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=N||Y>=N)continue;const j=Y*N+X;if(d[j]>d[i]+1){d[j]=d[i]+1;qu.push(j);}}}dist[c]=d;}
const cost=a=>{let s=0;for(const q of pts){const X=(a[0]*q.ll[1]+a[1]*q.ll[0]+a[2])/S,Y=(a[3]*q.ll[1]+a[4]*q.ll[0]+a[5])/S;const xi=Math.round(X),yi=Math.round(Y);if(xi<0||yi<0||xi>=N||yi>=N){s+=400;continue;}const dd=dist[code(q)][yi*N+xi];s+=Math.min(dd,200)+(dd>0?3:0);}return s;};
const init=JSON.parse(fs.readFileSync('fit.json'));let best=[...init.X,...init.Y];let bc=cost(best);
// coordinate descent / random search
let step=[2,2,40,2,2,40];
for(let it=0;it<20000;it++){const c=best.slice();const k=it%6;const r=(Math.random()*2-1)*step[k];c[k]+=r;const v=cost(c);if(v<bc){bc=v;best=c;}if(it%3000===2999)step=step.map(s=>s*0.6);}
let inside=0;const bad=[];for(const q of pts){const X=Math.round((best[0]*q.ll[1]+best[1]*q.ll[0]+best[2])/S),Y=Math.round((best[3]*q.ll[1]+best[4]*q.ll[0]+best[5])/S);const dd=dist[code(q)][Y*N+X];if(dd===0)inside++;else bad.push([q.name,dd]);}
console.log('cost',bc,'inside',inside,'/',pts.length,bad);
// snap function data: for outside points we will snap to nearest inside pixel at build time; save affine and okinawa center
fs.writeFileSync('affine.json',JSON.stringify({X:best.slice(0,3),Y:best.slice(3),okinawa:init.okinawa}));
fs.writeFileSync('grid.json',JSON.stringify({N,S,grid}));await b.close();})();
