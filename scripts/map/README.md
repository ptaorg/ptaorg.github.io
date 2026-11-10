# 地図ピンの位置（data/map-pins.json）

公開データの概略座標（research-map-index.json の coordinates、board-responses-index.js の coordinates）を、
Geolonia の都道府県SVG（assets/map/japan-prefectures.svg）上の位置へ変換したもの。

1. `1-initial-fit.cjs` 都道府県の外接矩形中心に合わせた一次近似（アフィン変換）
2. `2-fit-to-shapes.cjs` 各点が自分の都道府県の形の内側に入るよう係数を調整
3. `3-snap-pins.cjs` それでも外に出る点は、同じ都道府県内の最も近い位置へ寄せて書き出す

ピンは自治体の概略代表位置で、学校の所在地ではない。都道府県名だけの回答（例：三重県）は都道府県の中央付近に置く。
入力 `geo-points.json` は上記2ファイルから作る（作業用、リポジトリには含めない）。
