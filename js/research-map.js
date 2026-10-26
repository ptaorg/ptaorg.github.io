/* Shared by the research map and national archive. Text is always inserted as text. */
(async function () {
  "use strict";
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
  const normalize = (s) =>
    String(s || "")
      .normalize("NFKC")
      .replace(/\s/g, "")
      .toLowerCase();
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
  function selectedSchools(m) {
    return m.schools.filter(
      (s) =>
        (!value("school") || s.type === value("school")) &&
        (!value("publication") ||
          s.documents.some((d) => d.status === value("publication"))),
    );
  }
  function match(m) {
    if (value("mode") === "自治体研究" && !m.url) return false;
    if (value("mode") === "学校別資料" && !m.schools.length) return false;
    if (value("prefecture") && m.prefecture !== value("prefecture"))
      return false;
    if (value("city") && m.name !== value("city")) return false;
    if (value("theme") && !m.themes.includes(value("theme"))) return false;
    if ((value("school") || value("publication")) && !selectedSchools(m).length)
      return false;
    for (const [field, key] of Object.entries(flags)) {
      if (!value(field)) continue;
      const confirmed =
        m.flags?.[key] === true ||
        m.flags?.[key] === "confirmed" ||
        (field === "response" && m.boardResponses?.length > 0);
      if ((value(field) === "掲載確認") !== confirmed) return false;
    }
    return (
      !value("query") ||
      normalize(JSON.stringify(m)).includes(normalize(value("query")))
    );
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
      m.schools.length +
      "校";
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
      if (details && value("mode") === "学校別資料") details.open = true;
      const visible = new Set(selectedSchools(m).map((s) => s.url));
      for (const li of el.querySelectorAll("[data-school-url]"))
        li.hidden = !visible.has(li.dataset.schoolUrl);
    }
    if (status)
      status.textContent =
        found.length +
        "地域 ／ " +
        found.reduce((n, m) => n + selectedSchools(m).length, 0) +
        "校（資料・研究の登録件数）";
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
        L.circleMarker(group[0].coordinates, {
          radius: group.length > 1 ? 11 : 8,
          color: group.some((m) => m.url) ? "#145f77" : "#65758b",
          fillOpacity: 0.8,
          weight: 2,
        })
          .addTo(layer)
          .bindPopup(box);
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
    form.addEventListener("change", render);
    form.addEventListener("submit", (e) => e.preventDefault());
    form.addEventListener("reset", () => setTimeout(render, 0));
  }
  render();
})();
