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


/* Supplementary October 2026 cross-jurisdiction survey.
   Read-only, public-data-only index. The 29-region base map is not reclassified
   as a map of violations or legal findings. */
(async function renderNationalPTASurvey() {
  "use strict";
  const anchor = document.getElementById("research-results");
  if (!anchor) return;
  let survey;
  try {
    const response = await fetch("/data/research-survey-20261026.json");
    if (!response.ok) return;
    survey = await response.json();
    if (!Array.isArray(survey.records) || survey.records.length !== 48) return;
  } catch (_) {
    return; // The original static map and region list remain usable.
  }
  const mk = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text != null) el.textContent = String(text);
    if (cls) el.className = cls;
    return el;
  };
  const section = mk("section", null, "research-survey");
  section.id = "national-primary-survey";
  section.append(mk("h2", "PTA内部事務の公務化・全国横断一次調査"));
  section.append(mk("p", "2026年10月26日確認版。48主体を登録し、そのうち39主体で一次資料の該当箇所を確認。47都道府県・20指定都市の固定対象67主体では33主体の原本確認にとどまり、全国全件の検証は未完了です。"));
  section.append(mk("p", "確認済みは制度説明・資料の該当箇所を意味します。違法性の認定、全校実態の確認、現行制度の完全確認を意味しません。受領した非公表の回答原文・メールURL・添付資料は公開していません。", "research-notice"));
  const controls = mk("div", null, "research-survey-filters");
  const searchLabel = mk("label", "48主体内を検索");
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "自治体・規則・制度類型・資料名";
  search.setAttribute("aria-label", "全国一次調査の検索");
  searchLabel.append(search);
  const statusLabel = mk("label", "資料確認状況");
  const evidence = document.createElement("select");
  evidence.setAttribute("aria-label", "全国一次調査の資料確認状況");
  ["すべて", "原本確認", "公式本文確認・原本保存未了", "検索本文のみ", "候補資料"].forEach((name, i) => {
    const option = document.createElement("option");
    option.value = i ? name : "";
    option.textContent = name;
    evidence.append(option);
  });
  statusLabel.append(evidence);
  controls.append(searchLabel, statusLabel);
  section.append(controls);
  const resultCount = mk("p", "", "research-survey-result");
  resultCount.setAttribute("role", "status");
  section.append(resultCount);
  const list = mk("div", null, "research-survey-list");
  section.append(list);
  anchor.parentNode.insertBefore(section, anchor);
  const normalize = (s) => String(s || "").normalize("NFKC").replace(/\s/g, "").toLowerCase();
  const related = new Map();
  document.querySelectorAll("#research-results [data-region]").forEach((item) => {
    const title = item.querySelector("h3");
    const link = title && title.querySelector("a");
    related.set(title?.textContent.trim(), link ? link.getAttribute("href") : "#region-" + item.dataset.region);
  });
  function render() {
    const word = normalize(search.value);
    const found = survey.records.filter((r) =>
      (!evidence.value || r.evidence === evidence.value) &&
      (!word || normalize([r.prefecture, r.name, r.schoolType, r.scheme, r.activity, r.document, r.legalAssessment, r.sourceIds].join(" ")).includes(word))
    );
    resultCount.textContent = found.length + "主体を表示 ／ 全48主体・一次資料該当部分確認39主体";
    list.replaceChildren();
    for (const r of found) {
      const item = mk("article", null, "research-region");
      const heading = mk("h3");
      const url = related.get(r.prefecture + " " + r.name);
      if (url) {
        const link = mk("a", r.prefecture + " " + r.name);
        link.href = url;
        heading.append(link);
      } else {
        heading.textContent = r.prefecture + " " + r.name;
      }
      item.append(heading);
      item.append(mk("p", r.schoolType + " ／ " + r.evidence + " ／ 最終確認 " + r.reviewed));
      if (r.publicDetails) {
        if (r.scheme) item.append(mk("p", "制度類型（探索上の分類）： " + r.scheme));
        if (r.activity) item.append(mk("p", "対象事務： " + r.activity));
        const details = mk("details");
        details.append(mk("summary", "根拠資料・法的検証・未確認事項"));
        if (r.document) details.append(mk("p", "資料： " + r.document));
        if (r.dateNote) details.append(mk("p", "制度時点： " + r.dateNote));
        if (r.publicPosition) details.append(mk("p", "資料に示された位置づけ： " + r.publicPosition));
        if (r.legalAssessment) details.append(mk("p", "独立評価： " + r.legalAssessment));
        if (r.outstanding) details.append(mk("p", "未解明事項： " + r.outstanding));
        if (r.periodLimitation) details.append(mk("p", "現行性の留保： " + r.periodLimitation));
        if (r.sourceIds) details.append(mk("p", "出典台帳ID： " + r.sourceIds));
        if (r.sourceUrls?.length) {
          const ul = mk("ul");
          for (const src of r.sourceUrls) {
            const li = mk("li"), a = mk("a", "公開一次資料を開く");
            a.href = src; a.target = "_blank"; a.rel = "noopener noreferrer";
            li.append(a); ul.append(li);
          }
          details.append(ul);
        } else details.append(mk("p", "公開用リンクは未登録。原本の公開状況と利用許諾を別途確認します。"));
        item.append(details);
      } else {
        item.append(mk("p", r.notice || "非公表受領資料を含むため詳細は掲載していません。"));
      }
      list.append(item);
    }
  }
  search.addEventListener("input", render);
  evidence.addEventListener("change", render);
  render();
})();
