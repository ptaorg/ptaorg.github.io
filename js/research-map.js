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
    const response = await fetch("/data/research-map-index.json");
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
  const maps = [];
  if (window.L)
    for (const el of containers) {
      const map = L.map(el, { scrollWheelZoom: false }).setView(
        [36.2, 137.8],
        5,
      );
      map.fitBounds([[24, 122], [46, 146]], { padding: [15, 15], maxZoom: 5 });
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
    if (value("mode") === "学校別資料" && !m.schools.length) return false;
    if (value("prefecture") && m.prefecture !== value("prefecture"))
      return false;
    if (value("city") && m.name !== value("city")) return false;
    if (value("theme") && !m.themes.includes(value("theme"))) return false;
    if ((value("school") || value("publication") || value("mode") === "学校別資料" || selection(m).schoolQuery) && !selectedSchools(m).length)
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
  function popup(m) {
    const box = document.createElement("div"),
      title = document.createElement("strong");
    title.textContent = m.prefecture + " " + m.name;
    box.append(title);
    const p = document.createElement("p");
    p.textContent =
      (m.url ? "研究ノートあり" : m.catalogUrl ? "既存資料館に所在掲載" : "学校別資料目録") +
      " ／ " +
      selectedSchools(m).length +
      "校（登録全" + m.schools.length + "校）";
    box.append(p);
    const a = document.createElement("a");
    a.href =
      (value("mode") !== "学校別資料" && m.url) || m.catalogUrl ||
      (form
        ? "#region-" + m.id
        : "/research-map.html?city=" + encodeURIComponent(m.name));
    a.textContent =
      m.url && value("mode") !== "学校別資料"
        ? "自治体研究ノートを読む"
        : m.catalogUrl ? "既存資料館を開く" : "学校別一覧を開く";
    a.addEventListener("click", () => {
      const details = document.querySelector(
        '[data-region="' + m.id + '"] details',
      );
      if (details) details.open = true;
    });
    box.append(a);
    return box;
  }
  function render() {
    const found = data.municipalities.filter(match);
    for (const m of data.municipalities) {
      const el = document.querySelector('[data-region="' + m.id + '"]');
      if (!el) continue;
      el.id = "region-" + m.id;
      el.hidden = !found.includes(m);
      const details = el.querySelector("details");
      if (details) {
        details.open = value("mode") === "学校別資料" || selection(m).schoolQuery;
        const summary = details.querySelector("summary");
        if (summary) summary.textContent = "学校別一次資料（表示 " + selectedSchools(m).length + "校 ／ 登録全 " + m.schools.length + "校）";
      }
      const visible = new Set(selectedSchools(m).map((s) => s.url));
      for (const li of el.querySelectorAll("[data-school-url]"))
        li.hidden = !visible.has(li.dataset.schoolUrl);
    }
    if (status)
      status.textContent =
        found.length +
        "地域 ／ " +
        found.reduce((n, m) => n + selectedSchools(m).length, 0) +
        "校（表示対象。原本公開済みの件数ではありません）";
    const empty = document.getElementById("research-empty");
    if (empty) empty.hidden = found.length > 0;
    const scope = document.getElementById("research-query-scope");
    if (scope) scope.textContent = found.some(m => selection(m).schoolQuery)
      ? "学校名・文書名に一致する学校を表示しています。自治体の登録全校は各一覧のリンクで確認できます。"
      : "自治体・研究の一致に基づく登録校を表示しています。学校名・文書名で検索すると該当学校へ絞り込みます。";
    for (const { map, layer } of maps) {
      layer.clearLayers();
      const positions = new Map();
      for (const m of found.filter((x) => x.coordinates)) {
        const key = m.coordinates.join(",");
        if (!positions.has(key)) positions.set(key, []);
        positions.get(key).push(m);
      }
      for (const group of positions.values()) {
        const box = document.createElement("div");
        for (const m of group) box.append(popup(m));
        const marker = L.circleMarker(group[0].coordinates, {
          radius: group.length > 1 ? 11 : 8,
          color: group.some((m) => m.url) ? "#145f77" : "#65758b",
          fillOpacity: 0.8,
          weight: 2,
        }).addTo(layer).bindPopup(box);
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
    form.addEventListener("input", render);
    // Search input already renders on every input event. Re-rendering on blur
    // would remove a marker between pointerdown/up and swallow its first click.
    form.addEventListener("change", (event) => {
      if (event.target.id !== fields.query) render();
    });
    form.addEventListener("submit", (e) => e.preventDefault());
    form.addEventListener("reset", () => setTimeout(render, 0));
  }
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
