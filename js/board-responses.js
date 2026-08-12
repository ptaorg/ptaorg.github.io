/* board-responses.js — 公開用マスキング版：索引・本文・地図 */
(function () {
  'use strict';

  const DATA = window.PTA_BOARD_RESPONSE_INDEX || {};
  const REGIONS = [
    { id: 'hokkaido-tohoku', name: '北海道・東北', prefs: ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県'] },
    { id: 'kanto', name: '関東', prefs: ['茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県'] },
    { id: 'chubu', name: '中部', prefs: ['新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県'] },
    { id: 'kinki', name: '近畿', prefs: ['滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県'] },
    { id: 'chugoku-shikoku', name: '中国・四国', prefs: ['鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県'] },
    { id: 'kyushu', name: '九州・沖縄', prefs: ['福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'] }
  ];

  const REGION_BOUNDS = {
    'hokkaido-tohoku': [[37.0, 138.0], [46.2, 146.6]],
    'kanto': [[34.5, 138.2], [37.3, 141.3]],
    'chubu': [[33.2, 134.9], [39.4, 140.0]],
    'kinki': [[33.4, 134.0], [36.3, 137.1]],
    'chugoku-shikoku': [[32.1, 130.7], [35.8, 135.9]],
    'kyushu': [[24.0, 122.0], [34.1, 132.4]]
  };

  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
  function ansId(no) { return 'ans-' + no; }
  function getRegionId(pref) {
    for (const r of REGIONS) if (r.prefs.includes(pref)) return r.id;
    return 'other';
  }
  function getRegionMunicipalities(regionId) {
    return (DATA.municipalities || []).filter(m => getRegionId(m.prefecture || '') === regionId);
  }
  function createPinIcon() {
    return L.divIcon({
      className: 'response-pin-wrap',
      html: '<span class="response-pin-marker"></span>',
      iconSize: [18, 26],
      iconAnchor: [9, 24],
      popupAnchor: [0, -18],
      tooltipAnchor: [0, -16]
    });
  }
  function makeTileLayer() {
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      noWrap: true
    });
  }
  function injectMapStyles() {
    if (document.getElementById('board-response-pin-style')) return;
    const style = document.createElement('style');
    style.id = 'board-response-pin-style';
    style.textContent = `
      .source-note{font-size:.78rem;color:var(--text-soft);margin-top:8px}
      .excluded-response-list{font-size:.88rem;line-height:1.8}.excluded-response-list li{margin-bottom:.6rem}
      .response-pin-wrap{background:transparent!important;border:none!important}
      .response-pin-marker{display:block;width:14px;height:14px;border-radius:50% 50% 50% 0;background:#d93025;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.28);transform:rotate(-45deg)}
      .response-pin-marker::after{content:'';position:absolute;width:4px;height:4px;border-radius:50%;background:#fff;left:3px;top:3px}
      .manual-map-pin-layer{display:none!important}
      .index-map-layout{display:block!important}
      .region-content-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;align-items:start}
      .region-pref-list{min-width:0}
      .region-map-slot{min-width:0}
      .region-map-panel.is-relocated-source{display:none!important}
      @media(max-width:980px){.region-content-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function renderIndex() {
    const el = document.getElementById('regionIndex'); if (!el) return;
    const tree = {};
    for (const m of DATA.municipalities || []) {
      const pref = m.prefecture || '不明'; const rid = getRegionId(pref);
      if (!tree[rid]) tree[rid] = {}; if (!tree[rid][pref]) tree[rid][pref] = [];
      tree[rid][pref].push(m);
    }
    let html = '';
    for (const region of REGIONS) {
      const prefs = tree[region.id]; if (!prefs || !Object.keys(prefs).length) continue;
      html += `<section class="region-block" data-region="${esc(region.id)}"><h3 class="region-heading">${esc(region.name)}</h3><div class="region-content-grid"><div class="region-pref-list">`;
      for (const pref of Object.keys(prefs).sort()) {
        const list = prefs[pref].slice().sort((a,b)=>a.no-b.no);
        html += `<div class="prefecture-group"><h4 class="pref-heading">${esc(pref)}</h4><ul class="municipality-list">`;
        for (const m of list) html += `<li><a href="#${ansId(m.no)}" class="muni-link">${esc(m.municipality)}${m.detailCount>1?`<span class="muni-count">${m.detailCount}件</span>`:''}</a></li>`;
        html += '</ul></div>';
      }
      html += `</div><div class="region-map-slot" data-region-slot="${esc(region.id)}"></div></div></section>`;
    }
    el.innerHTML = html;
  }

  function relocateRegionMaps() {
    const panel = document.querySelector('.region-map-panel');
    if (!panel) return;
    panel.querySelectorAll('.region-map-card').forEach(function (card) {
      const mapEl = card.querySelector('.region-map');
      if (!mapEl) return;
      const regionId = mapEl.getAttribute('data-region-id');
      const slot = document.querySelector(`[data-region-slot="${regionId}"]`);
      if (!slot) return;
      slot.appendChild(card);
    });
    panel.classList.add('is-relocated-source');
    panel.setAttribute('aria-hidden', 'true');
  }

  function renderBodies() {
    const el = document.getElementById('responseBodiesContent'); if (!el) return;
    const details = DATA.details || [], typeMap = DATA.typeMap || {}, munis = DATA.municipalities || [];
    const muniByName = {}; for (const m of munis) muniByName[m.municipality] = m;
    const byType = {}; for (const d of details) { if (!byType[d.type]) byType[d.type] = []; byType[d.type].push(d); }
    let html = ''; const anchored = new Set();
    for (const type of Object.keys(typeMap).sort()) {
      const items = (byType[type] || []).slice().sort((a,b)=>(muniByName[a.municipality]?.no||9999)-(muniByName[b.municipality]?.no||9999));
      if (!items.length) continue;
      const info = typeMap[type] || {};
      html += `<section class="type-section" id="type-${esc(type)}"><h3 class="type-heading"><span class="type-label-badge">${esc(type)}</span>${esc(info.title || type)}</h3>`;
      for (const d of items) {
        const muni = muniByName[d.municipality] || {}, no = muni.no;
        const idAttr = no && !anchored.has(no) ? ` id="${ansId(no)}"` : ''; if (no) anchored.add(no);
        const topics = (muni.usefulTags || []).map(t => t.label).filter(Boolean).join('・');
        const masked = (muni.qualityFlags || []).find(f => f.key === 'masked');
        const processing = masked ? ` ／ 公開処理：<span class="mask-note">${esc(masked.label)}</span>` : '';
        html += `<article class="response-item"${idAttr}><h4 class="response-muni-name">${esc(d.municipality)}</h4><p class="response-meta">分類：${esc(d.typeLabel || type)} ／ 回答日：${esc(d.date || '未確認')}${processing}</p>`;
        if (topics) html += `<p class="response-topics"><strong>確認論点</strong>${esc(topics)}</p>`;
        html += `<details><summary>回答本文を読む</summary><div class="response-body">${esc(d.body || '回答本文未掲載。')}</div></details>`;
        if (d.sourceFile) html += `<p class="source-note">元資料：${esc(d.sourceFile)}</p>`;
        const plink = no != null ? (window.PTA_BOARD_RESPONSE_PERMALINKS || {})[String(no)] : null;
        html += `<p class="back-to-index">${plink ? `<a href="${plink}">この回答の個別ページを開く →</a>　` : ''}<a href="#municipality-index">▲ 自治体索引へ戻る</a></p></article>`;
      }
      html += '</section>';
    }
    el.innerHTML = html;
  }

  function renderExcluded() {
    const el = document.getElementById('excludedResponses'); if (!el) return;
    const excluded = DATA.excluded || [];
    if (!excluded.length) { el.innerHTML = '<p>掲載対象から外した資料はありません。</p>'; return; }
    el.innerHTML = `<ul class="excluded-response-list">${excluded.map(item => `<li><strong>${esc(item.municipality || '名称未確認')}</strong>${item.reason?` — ${esc(item.reason)}`:''}${item.sourceFile?` <small>（${esc(item.sourceFile)}）</small>`:''}</li>`).join('')}</ul>`;
  }

  function addMarkerToMap(map, layer, m) {
    const marker = L.marker(m.coordinates, { icon: createPinIcon(), keyboard: false });
    marker.bindTooltip(`<strong>${esc(m.municipality)}</strong><br><small>クリックで回答本文へ</small>`, { permanent:false, direction:'top', offset:[0,-16] });
    marker.on('click', function () {
      const target = document.getElementById(ansId(m.no)); if (!target) return;
      target.scrollIntoView({ behavior:'smooth', block:'start' });
      const det = target.querySelector('details'); if (det && !det.open) det.open = true;
    });
    marker.addTo(map); if (layer) layer.addLayer(marker);
  }

  function initMainMap() {
    const el = document.getElementById('responseMap'); if (!el || typeof L === 'undefined') return;
    const map = L.map('responseMap', { scrollWheelZoom:false }).setView([36.2,138.2],5);
    makeTileLayer().addTo(map);
    const group = L.featureGroup();
    for (const m of DATA.municipalities || []) if (Array.isArray(m.coordinates)) addMarkerToMap(map, group, m);
    if (group.getLayers().length) map.fitBounds(group.getBounds().pad(0.12));
  }

  function initRegionMaps() {
    if (typeof L === 'undefined') return;
    document.querySelectorAll('.region-map').forEach(function (el) {
      const regionId = el.getAttribute('data-region-id');
      const regionBounds = L.latLngBounds(REGION_BOUNDS[regionId] || [[24,122],[46,146]]);
      const map = L.map(el, {
        scrollWheelZoom:false,
        dragging:false,
        doubleClickZoom:false,
        boxZoom:false,
        keyboard:false,
        zoomControl:false,
        attributionControl:false,
        maxBounds: regionBounds.pad(0.15),
        maxBoundsViscosity: 1
      });
      makeTileLayer().addTo(map);
      const group = L.featureGroup();
      const munis = getRegionMunicipalities(regionId);
      for (const m of munis) if (Array.isArray(m.coordinates)) addMarkerToMap(map, group, m);
      map.fitBounds(regionBounds, { animate:false, padding:[6,6] });
      setTimeout(function(){ map.invalidateSize(); map.fitBounds(regionBounds, { animate:false, padding:[6,6] }); }, 0);
    });
  }

  function initSearch() {
    const input = document.getElementById('muniSearch'); if (!input) return;
    input.addEventListener('input', function () {
      const q = this.value.trim();
      document.querySelectorAll('.muni-link').forEach(function (a) { const li = a.parentElement; if (li) li.style.display = (!q || a.textContent.includes(q)) ? '' : 'none'; });
      document.querySelectorAll('.prefecture-group').forEach(function (pg) { pg.style.display = [...pg.querySelectorAll('li')].some(li => li.style.display !== 'none') ? '' : 'none'; });
      document.querySelectorAll('.region-block').forEach(function (rb) { rb.style.display = [...rb.querySelectorAll('li')].some(li => li.style.display !== 'none') ? '' : 'none'; });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectMapStyles();
    renderIndex();
    relocateRegionMaps();
    renderBodies();
    renderExcluded();
    initMainMap();
    initRegionMaps();
    initSearch();
  });
})();
