/* Pure search selection shared with regression tests; no source data is mutated. */
(function (root) {
  "use strict";
  const normalize = (s) => String(s || "").normalize("NFKC").replace(/\s/g, "").toLowerCase();
  function selection(m, filters = {}) {
    const query = normalize(filters.query);
    const all = m.schools || [];
    const eligible = all.filter(s => (!filters.school || s.type === filters.school) &&
      (!filters.publication || s.documents.some(d => d.status === filters.publication)));
    const identityMatch = query && normalize(m.prefecture + m.name).includes(query);
    const schoolMatches = all.filter(s => normalize([s.name, ...(s.documents || []).map(d => d.title)].join(" ")).includes(query));
    const { schools, ...region } = m;
    const regionMatch = !query || identityMatch || normalize(JSON.stringify(region)).includes(query);
    // A school/document match narrows the list; a municipality name intentionally keeps all eligible schools.
    const schoolQuery = !!query && !identityMatch && schoolMatches.length > 0;
    const selected = schoolQuery ? eligible.filter(s => schoolMatches.includes(s)) : regionMatch ? eligible : [];
    return { schools: selected, matched: regionMatch || schoolMatches.length > 0, schoolQuery };
  }
  const api = { normalize, selection };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.PTAResearchSearch = api;
})(typeof window === "undefined" ? null : window);

/* Shared by the research map and national archive. Text is always inserted as text. */
(async function () {
  "use strict";
  if (typeof document === "undefined") return;
  const containers = [...document.querySelectorAll("[data-research-map]")];
  if (!containers.length) return;
  const form = document.getElementById("research-filters"),
    status = document.getElementById("research-result-status");
  let data;
  try {
    const response = await fetch((window.__ROOT||"")+"data/research-map-index.json?v=20261116-japan-focus-v2");
    if (!response.ok) throw Error("index");
    data = await response.json();
  } catch (_) {
    if (status)
      status.textContent =
        "検索データを取得できません。下の自治体一覧からすべてのページを開けます。";
    return;
  }
  const fields = {
    query: "research-query",
    mode: "research-mode",
    prefecture: "research-prefecture",
    city: "research-city",
    theme: "research-theme",
    school: "research-school",
    publication: "research-publication",
    response: "research-response",
    audit: "research-audit",
    improvement: "research-improvement",
  };
  const value = (k) => document.getElementById(fields[k])?.value || "";
  const selection = (m) => window.PTAResearchSearch.selection(m, {
    query: value("query"), school: value("school"), publication: value("publication"),
  });
  const flags = {
    response: "administrativeResponse",
    audit: "audit",
    improvement: "improvement",
  };
  const feature = {
    panel:document.querySelector(".research-map-feature"),
    overline:document.getElementById("research-feature-overline"),
    title:document.getElementById("research-feature-title"),
    label:document.getElementById("research-feature-label"),
    desc:document.getElementById("research-feature-desc"),
    links:document.getElementById("research-feature-quicklinks"),
    go:document.getElementById("research-feature-go"),
    foot:document.getElementById("research-feature-foot"),
    reset:document.getElementById("research-feature-reset")
  };
  function selectFeature(m) {
    if (!feature.panel || !m) return;
    feature.panel.dataset.featureMode="selected";
    feature.overline.textContent="選択した自治体";
    feature.title.textContent=m.prefecture+" "+m.name;
    feature.label.textContent=m.schoolReportCount ? "学校別の調査 "+m.schoolReportCount+"校" :
      m.url ? "自治体の調査ページを公開中" : "資料の所在を確認できます";
    feature.desc.textContent=m.summary?.[0] || "この自治体で確認できた資料の内容をご覧ください。";
    feature.links.hidden=true;
    feature.go.href=m.url || m.catalogUrl || "#region-"+m.id;
    feature.go.firstChild.textContent=m.url ? "この自治体の評価を読む " : "この自治体の資料を見る ";
    feature.foot.textContent="確認事実と未確認事項を区別して掲載しています。";
    feature.reset.hidden=false;
  }
  function resetFeature() {
    if(!feature.panel) return;
    feature.panel.dataset.featureMode="national";
    feature.overline.textContent="全国の調査状況";
    feature.title.textContent="地域を選んで、PTAの実態を調べる。";
    feature.label.textContent=data.municipalities.length+"自治体・地域の資料を掲載";
    feature.desc.textContent="地図のピンを押すと、その自治体の概要と資料への入口がここに表示されます。赤いピンは自治体の調査ページ、青灰色は資料の索引を示します。";
    feature.links.hidden=false;
    feature.go.href="#research-results";
    feature.go.firstChild.textContent="自治体一覧を見る ";
    feature.foot.textContent="自治体の総合評価から、学校ごとの調査と根拠資料へ進めます。";
    feature.reset.hidden=true;
  }
  feature.reset?.addEventListener("click",resetFeature);
  const maps = [];
  if (window.L)
    for (const el of containers) {
      // Main-island first view: visitors should see Japan, not a continent-sized area.
      // The "日本全体" control remains available for Okinawa and the outer islands.
      const mapWidth = el.getBoundingClientRect().width;
      const initialZoom = mapWidth >= 650 ? 6 : mapWidth >= 440 ? 5.75 : 5.25;
      const map = L.map(el, {
        scrollWheelZoom: false,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        maxBounds: [[22, 120], [47.5, 149]],
        maxBoundsViscosity: 0.8,
      }).setView([37.6, 138.2], initialZoom);
      const allJapan = L.latLngBounds([[24, 123], [46.5, 146.5]]);
      const AllJapanButton = L.Control.extend({
        options: { position: "topright" },
        onAdd() {
          const wrap = L.DomUtil.create("div", "leaflet-bar pta-map-reset");
          const button = L.DomUtil.create("button", "", wrap);
          button.type = "button";
          button.textContent = "日本全体";
          button.setAttribute("aria-label", "沖縄を含む日本全体を表示");
          L.DomEvent.disableClickPropagation(wrap);
          L.DomEvent.disableScrollPropagation(wrap);
          L.DomEvent.on(button, "click", (event) => {
            L.DomEvent.stop(event);
            map.fitBounds(allJapan, { padding: [24, 24] });
          });
          return wrap;
        },
      });
      map.addControl(new AllJapanButton());
      // Responsive parent layouts sometimes size after Leaflet initialization.
      requestAnimationFrame(() => map.invalidateSize({ pan: false }));
      const layer = L.layerGroup().addTo(map);
      const tiles = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" },
      );
      tiles.on("tileerror", () => {
        const msg = document.getElementById("research-map-message");
        if (msg)
          msg.textContent =
            "背景地図を取得できません。自治体一覧・検索は引き続き利用できます。";
      });
      tiles.addTo(map);
      maps.push({ map, layer });
    }
  function selectedSchools(m) { return selection(m).schools; }
  function match(m) {
    if (value("mode") === "自治体研究" && !m.url) return false;
    if (value("mode") === "学校別資料" && !m.schools.length && !m.schoolReportCount) return false;
    if (value("prefecture") && m.prefecture !== value("prefecture"))
      return false;
    if (value("city") && m.name !== value("city")) return false;
    if (value("theme") && !m.themes.includes(value("theme"))) return false;
    const schoolFilter = value("school") || value("publication") || selection(m).schoolQuery;
    if ((schoolFilter || value("mode") === "学校別資料") && !selectedSchools(m).length && !(value("mode") === "学校別資料" && !schoolFilter && m.schoolReportCount))
      return false;
    for (const [field, key] of Object.entries(flags)) {
      if (!value(field)) continue;
      const confirmed =
        m.flags?.[key] === true ||
        m.flags?.[key] === "confirmed" ||
        (field === "response" && m.boardResponses?.length > 0);
      if ((value(field) === "掲載確認") !== confirmed) return false;
    }
    return selection(m).matched;
  }
  const moreRegions=document.getElementById("research-more-regions");
  const advancedControls=document.getElementById("research-advanced");
  function popup(m) {
    const box = document.createElement("div"),
      title = document.createElement("strong");
    title.textContent = m.prefecture + " " + m.name;
    box.append(title);
    const p = document.createElement("p");
    p.textContent =
      (m.url ? (m.schoolReportCount ? "自治体の総合評価を公開" : "研究ノートあり") : m.catalogUrl ? "既存資料館に所在掲載" : "学校別資料目録") +
      " ／ " +
      (m.schoolReportCount ? "学校別評価 " + m.schoolReportCount + "校（市の総合評価から閲覧）" : selectedSchools(m).length + "校（登録全" + m.schools.length + "校）");
    box.append(p);
    const a = document.createElement("a");
    a.href =
      (value("mode") !== "学校別資料" && m.url) || m.catalogUrl ||
      (form
        ? "#region-" + m.id
        : (window.__ROOT||"")+"research-map.html?city=" + encodeURIComponent(m.name));
    a.textContent =
      m.url && value("mode") !== "学校別資料"
        ? (m.schoolReportCount ? "市の総合評価・" + m.schoolReportCount + "校の評価を見る" : "自治体の評価を読む")
        : m.catalogUrl ? "既存資料館を開く" : "学校別一覧を開く";
    a.addEventListener("click", () => {
      const region = document.querySelector('[data-region="' + m.id + '"]');
      const wrapper = region?.closest("#research-more-regions");
      if (wrapper) wrapper.open = true;
      const details = region?.querySelector("details");
      if (details) details.open = true;
    });
    box.append(a);
    return box;
  }
  function render() {
    const found = data.municipalities.filter(match);
    const activeFilters=Object.keys(fields).some(k=>!!value(k));
    if (moreRegions && activeFilters && found.some(m=>moreRegions.querySelector('[data-region="' + m.id + '"]'))) moreRegions.open=true;
    for (const m of data.municipalities) {
      const el = document.querySelector('[data-region="' + m.id + '"]');
      if (!el) continue;
      el.id = "region-" + m.id;
      el.hidden = !found.includes(m);
      const details = el.querySelector("details");
      if (details) {
        details.open = value("mode") === "学校別資料" || selection(m).schoolQuery;
        const summary = details.querySelector("summary");
        if (summary) summary.textContent = m.schoolReportCount && !m.schools.length ? "学校別評価 " + m.schoolReportCount + "校は市の総合評価へ" : "学校別一次資料（表示 " + selectedSchools(m).length + "校 ／ 登録全 " + m.schools.length + "校）";
      }
      const visible = new Set(selectedSchools(m).map((s) => s.url));
      for (const li of el.querySelectorAll("[data-school-url]"))
        li.hidden = !visible.has(li.dataset.schoolUrl);
    }
    if (status) status.textContent = found.length + "自治体・地域を表示中";
    const empty = document.getElementById("research-empty");
    if (empty) empty.hidden = found.length > 0;
    const scope = document.getElementById("research-query-scope");
    if (scope) scope.textContent = found.some(m => selection(m).schoolQuery)
      ? "学校名・資料名に一致する自治体を表示しています。" : "";
    for (const { map, layer } of maps) {
      layer.clearLayers();
      const positions = new Map();
      for (const m of found.filter((x) => x.coordinates)) {
        const key = m.coordinates.join(",");
        if (!positions.has(key)) positions.set(key, []);
        positions.get(key).push(m);
      }
      for (const group of positions.values()) {
        // Leaflet handles the tile viewport; keep offscreen pins out of the DOM.
        // This also avoids stray focus targets and markers beyond the map edge.
        if (!map.getBounds().pad(-0.08).contains(group[0].coordinates)) continue;
        const box = document.createElement("div");
        for (const m of group) box.append(popup(m));
        const published = group.some((m) => m.url);
        const pinIcon = L.divIcon({
          className: "pta-map-marker " + (published ? "is-published" : "is-indexed"),
          html: '<span class="pta-map-pin" aria-hidden="true"></span>',
          iconSize: [30, 40],
          iconAnchor: [15, 38],
          popupAnchor: [0, -34],
        });
        const marker = L.marker(group[0].coordinates, {
          icon: pinIcon,
          keyboard: true,
          title: group.map(m => m.prefecture + " " + m.name).join("、"),
        }).addTo(layer).bindPopup(box);
        marker.on("click", () => selectFeature(group[0]));
        const element = marker.getElement();
        if (element) {
          element.setAttribute("tabindex", "0");
          element.setAttribute("role", "button");
          element.setAttribute("aria-label", group.map(m => m.prefecture + " " + m.name).join("、") + "の資料・研究を開く");
          element.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault(); marker.openPopup();
              box.querySelector("a")?.focus();
            }
          });
        }
      }
    }
    if (form) {
      const params = new URLSearchParams();
      for (const k of Object.keys(fields))
        if (value(k)) params.set(k, value(k));
      history.replaceState(
        null,
        "",
        location.pathname + (params.size ? "?" + params : ""),
      );
    }
  }
  if (form) {
    const params = new URLSearchParams(location.search);
    for (const k of Object.keys(fields)) {
      const el = document.getElementById(fields[k]);
      if (params.has(k) && el) el.value = params.get(k);
    }
    if (advancedControls && Object.keys(fields).some(k=>!["query","prefecture"].includes(k) && params.has(k))) advancedControls.open=true;
    form.addEventListener("input", render);
    // Search input already renders on every input event. Re-rendering on blur
    // would remove a marker between pointerdown/up and swallow its first click.
    form.addEventListener("change", (event) => {
      if (event.target.id !== fields.query) render();
    });
    form.addEventListener("submit", (e) => e.preventDefault());
    form.addEventListener("reset", () => setTimeout(() => {
      if (advancedControls) advancedControls.open = false;
      if (moreRegions) moreRegions.open = false;
      render();
    }, 0));
  }
  for (const { map } of maps) map.on("moveend", render);
  render();
})();


/* The 48-subject survey is present in static HTML, even without JS.
   JS enhances it with search and status filtering without republishing sources. */
(function filterNationalPTASurvey() {
  "use strict";
  if (typeof document === "undefined") return;
  const section = document.getElementById("national-primary-survey");
  if (!section) return;
  const input = section.querySelector(".research-survey-filters input");
  const status = section.querySelector(".research-survey-filters select");
  const count = section.querySelector(".research-survey-result");
  const cards = [...section.querySelectorAll(".survey-record")];
  const normalize = (s) => String(s || "").normalize("NFKC").replace(/\s/g, "").toLowerCase();
  function render() {
    const phrase = normalize(input.value);
    let shown = 0;
    for (const card of cards) {
      const matches = (!status.value || card.dataset.surveyEvidence === status.value) &&
        (!phrase || normalize(card.textContent).includes(phrase));
      card.hidden = !matches;
      if (matches) shown++;
    }
    count.textContent = shown + "主体を表示 ／ 全48主体・一次資料該当部分確認39主体";
  }
  input.addEventListener("input", render);
  status.addEventListener("change", render);
  render();
})();
