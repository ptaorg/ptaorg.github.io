/* Runtime for ported pages: replaces the behaviour legacy site scripts used to provide.
   - FAQ open/close (.faq-item .faq-q / .faq-a)
   - Links created at runtime by legacy scripts that point at the site root or ptaorg.com
     are rewritten to stay inside this site. */
(() => {
  'use strict';
  const ROOT = (document.body && document.body.dataset.root) || window.__ROOT || '';
  const SITE = /^https?:\/\/(?:www\.)?ptaorg\.(?:com|github\.io)(?=\/|$)/i;
  function fixHref(a) {
    const h = a.getAttribute('href');
    if (!h || a.dataset.rootFixed) return;
    let path = null;
    if (SITE.test(h)) path = h.replace(SITE, '') || '/';
    else if (h.charAt(0) === '/' && h.charAt(1) !== '/') path = h;
    if (path === null) return;
    a.setAttribute('href', ROOT + (path === '/' ? 'index.html' : path.slice(1)));
    a.dataset.rootFixed = '1';
  }
  const fixAll = root => (root.querySelectorAll ? root.querySelectorAll('.legacy a[href], a[href].legacy-link') : []).forEach(fixHref);
  function initFAQ(scope) {
    scope.querySelectorAll('.faq-item .faq-q').forEach((q, i) => {
      if (q.dataset.faqNew === '1') return;
      const item = q.closest('.faq-item'); const answer = item && item.querySelector('.faq-a');
      if (!item || !answer) return;
      q.dataset.faqNew = '1';
      answer.id = answer.id || 'faq-answer-' + (i + 1);
      q.setAttribute('role', 'button'); q.setAttribute('tabindex', '0'); q.setAttribute('aria-controls', answer.id);
      const set = open => {
        item.classList.toggle('is-open', open);
        q.setAttribute('aria-expanded', String(open));
        answer.setAttribute('aria-hidden', String(!open));
        answer.style.maxHeight = open ? 'none' : '0px';
        answer.style.paddingBottom = open ? '20px' : '0px';
        const icon = q.querySelector('.faq-toggle'); if (icon) icon.textContent = open ? '▲' : '▼';
      };
      set(item.classList.contains('is-open'));
      q.addEventListener('click', () => set(q.getAttribute('aria-expanded') !== 'true'));
      q.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(q.getAttribute('aria-expanded') !== 'true'); } });
    });
  }
  function lightenDarkPanels() {
    const lum = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return 1; const v = m[1].split(',').map(Number); if (v.length > 3 && v[3] < 0.5) return 1;
      const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(v[0]) + 0.7152 * f(v[1]) + 0.0722 * f(v[2]); };
    document.querySelectorAll('.legacy-body *').forEach(el => {
      if (/^(A|BUTTON|SPAN|STRONG|EM|B|SMALL|CODE|MARK|SVG|PATH|IMG|INPUT|SELECT|LABEL|TD|TH|TR)$/i.test(el.tagName)) return;
      const cs = getComputedStyle(el); if (lum(cs.backgroundColor) > 0.12) return;
      if (el.getBoundingClientRect().height < 60) return;
      el.classList.add('is-dark-panel');
    });
  }
  // After restyling, legacy text that was white-on-dark can end up light-on-light: give it ink color.
  function fixContrast() {
    const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(',').map(Number); return v; };
    const L = v => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(v[0]) + 0.7152 * f(v[1]) + 0.0722 * f(v[2]); };
    const bgOf = el => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const v = parse(getComputedStyle(e).backgroundColor); if (v && (v.length < 4 || v[3] > 0.5)) return v; } return [255, 255, 255]; };
    document.querySelectorAll('.legacy-body *').forEach(el => {
      if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
      const fg = parse(getComputedStyle(el).color); if (!fg) return;
      const a = L(fg), b = L(bgOf(el)); const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      if (ratio < 3) el.classList.add('fix-contrast');
    });
  }
  let tableHintCounter = 0;
  function markWideTables() {
    const smallScreen = window.matchMedia('(max-width:760px)').matches;
    document.querySelectorAll('#main .legacy-body table').forEach(table => {
      const overflow = getComputedStyle(table).overflowX;
      const scrollable = smallScreen && table.scrollWidth > table.clientWidth + 4 &&
        (overflow === 'auto' || overflow === 'scroll');
      const hintId = table.dataset.scrollHintId;
      const hint = hintId ? document.getElementById(hintId) : null;
      if (scrollable) {
        if (!hint) {
          const el = document.createElement('p');
          el.className = 'table-scroll-hint';
          el.id = 'pta-table-scroll-hint-' + (++tableHintCounter);
          el.textContent = '表は左右にスクロールできます。';
          table.before(el);
          table.dataset.scrollHintId = el.id;
        }
        const actualId = table.dataset.scrollHintId;
        if (!table.hasAttribute('tabindex')) {
          table.setAttribute('tabindex', '0');
          table.dataset.scrollTabAdded = '1';
        }
        const describedBy = (table.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        if (!describedBy.includes(actualId)) {
          table.setAttribute('aria-describedby', [...describedBy, actualId].join(' '));
        }
      } else if (hintId) {
        hint?.remove();
        const describedBy = (table.getAttribute('aria-describedby') || '').split(/\s+/)
          .filter(x => x && x !== hintId);
        if (describedBy.length) table.setAttribute('aria-describedby', describedBy.join(' '));
        else table.removeAttribute('aria-describedby');
        if (table.dataset.scrollTabAdded === '1') {
          table.removeAttribute('tabindex');
          delete table.dataset.scrollTabAdded;
        }
        delete table.dataset.scrollHintId;
      }
    });
  }
  function init() {
    lightenDarkPanels();
    fixContrast();
    fixAll(document);
    initFAQ(document);
    markWideTables();
    window.addEventListener('load', markWideTables, { once: true });
    window.addEventListener('resize', () => window.requestAnimationFrame(markWideTables));
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.matches && n.matches('a[href]')) fixHref(n); fixAll(n); } })))
      .observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
