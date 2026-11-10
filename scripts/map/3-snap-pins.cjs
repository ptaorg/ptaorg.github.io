const fs=require('fs');
const PREFS=['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
const {X,Y,okinawa}=JSON.parse(fs.readFileSync('affine.json'));const {N,S,grid}=JSON.parse(fs.readFileSync('grid.json'));
const pts=JSON.parse(fs.readFileSync('geo-points.json'));
const ok=(x,y,c,r)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=N||Y>=N||grid[Y*N+X]!==c)return false;}return true;};
function snap(x,y,c){for(const r of [2,1,0]){let best=null,bd=1e9;for(let yy=0;yy<N;yy++)for(let xx=0;xx<N;xx++){if(grid[yy*N+xx]!==c)continue;const d=(xx-x)**2+(yy-y)**2;if(d<bd&&ok(xx,yy,c,r)){bd=d;best=[xx,yy];}}if(best)return best;}return [x,y];}
const out={note:'地図上の位置は自治体の概略代表位置（都道府県内に収まるよう補正）。学校の所在地ではありません。',prefs:{},regions:{},responses:{}};
// prefecture label centers (largest-area interior point)
for(let c=1;c<=47;c++){let sx=0,sy=0,n=0;for(let i=0;i<N*N;i++)if(grid[i]===c){sx+=i%N;sy+=(i/N)|0;n++;}if(n){const [px,py]=snap(Math.round(sx/n),Math.round(sy/n),c);out.prefs[PREFS[c-1]]=[px*S+1,py*S+1];}}
for(const q of pts){const c=PREFS.indexOf(q.pref)+1;let xy;
 if(q.pref==='沖縄県')xy=out.prefs['沖縄県'];
 else if(q.name===q.pref||/県$|府$|都$|道$|教育庁$/.test(q.name)&&!/[市区町村]/.test(q.name.replace(q.pref,'')))xy=out.prefs[q.pref];
 else{const gx=Math.round((X[0]*q.ll[1]+X[1]*q.ll[0]+X[2])/S),gy=Math.round((Y[0]*q.ll[1]+Y[1]*q.ll[0]+Y[2])/S);const [a,b]=snap(gx,gy,c);xy=[a*S+1,b*S+1];}
 if(q.kind==='region')out.regions[q.id]=xy;else out.responses[q.no]=xy;}
fs.writeFileSync('/home/claude/ptaorg-site-next/data/map-pins.json',JSON.stringify(out));
console.log(Object.keys(out.prefs).length,Object.keys(out.regions).length,Object.keys(out.responses).length);
