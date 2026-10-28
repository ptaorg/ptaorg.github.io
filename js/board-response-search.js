/* One search across preserved response texts and static, reviewed supplements. */
(function () {
  'use strict';
  function init() {
    const form = document.getElementById('board-response-search');
    if (!form) return;
    const query = document.getElementById('board-query'), topic = document.getElementById('board-topic'), status = document.getElementById('board-status');
    const norm = s => String(s || '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
    const old = (window.PTA_BOARD_RESPONSE_INDEX || {}).details || [];
    const municipalities = (window.PTA_BOARD_RESPONSE_INDEX || {}).municipalities || [];
    const supplement = [...document.querySelectorAll('[data-board-update]')];
    const oldItems = [...document.querySelectorAll('#responseBodiesContent .response-item')];
    const oldSearch = document.getElementById('muniSearch');
    function update() {
      const q = norm(query.value), t = topic.value, s = status.value;
      const active = !!(q || t || s);
      let newer = 0, legacy = 0;
      for (const article of supplement) {
        const topics = JSON.parse(article.dataset.topics);
        article.hidden = !!((q && !norm(article.textContent).includes(q)) || (t && !topics.includes(t)) || (s && article.dataset.status !== s));
        if (!article.hidden) newer++;
      }
      const shownNames = new Set();
      oldItems.forEach((article, i) => {
        const d = old.find(d => String(d.no) === article.id.replace('ans-', '')) || old[i] || {}, m = municipalities.find(m => m.municipality === d.municipality) || {};
        const tags = (m.usefulTags || []).map(t => t.label);
        article.hidden = !!((q && !norm([d.municipality,d.prefecture,d.body,...tags].join(' ')).includes(q)) || (t && !tags.includes(t)) || (s && s !== '従来公開本文'));
        if (!article.hidden) { legacy++; shownNames.add(d.municipality); }
      });
      for (const a of document.querySelectorAll('.muni-link')) a.parentElement.hidden = !shownNames.has(a.textContent.replace(/\d+件$/, ''));
      for (const section of document.querySelectorAll('.prefecture-group,.region-block')) section.hidden = ![...section.querySelectorAll('.muni-link')].some(a => !a.parentElement.hidden);
      for (const section of document.querySelectorAll('.type-section')) section.hidden = ![...section.querySelectorAll('.response-item')].some(a => !a.hidden);
      for (const section of document.querySelectorAll('.response-trends-section,.dataset-scope-section,.map-section')) section.hidden = active;
      document.getElementById('board-query-status').textContent = '追補 ' + newer + '件 ／ 従来公開本文 ' + legacy + '件（回答未了等は実質回答件数に含めません）';
      document.getElementById('board-query-empty').hidden = newer + legacy > 0;
      const params = new URLSearchParams(location.search);
      for (const [key,value] of [['boardQuery',query.value],['boardTopic',t],['boardStatus',s]]) value ? params.set(key,value) : params.delete(key);
      history.replaceState(null,'',location.pathname + (params.size ? '?' + params : '') + location.hash);
    }
    const params = new URLSearchParams(location.search);
    query.value = params.get('boardQuery') || ''; topic.value = params.get('boardTopic') || ''; status.value = params.get('boardStatus') || '';
    form.addEventListener('submit', e => { e.preventDefault(); update(); });
    form.addEventListener('input', update); form.addEventListener('change', update);
    form.addEventListener('reset', event => {
      event.preventDefault();
      query.value = ''; topic.value = ''; status.value = '';
      if (oldSearch) oldSearch.value = '';
      update();
    });
    // The older municipality field delegates to the shared query rather than filtering a second, inconsistent result set.
    if (oldSearch) oldSearch.addEventListener('input', () => { query.value = oldSearch.value; update(); });
    update();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
