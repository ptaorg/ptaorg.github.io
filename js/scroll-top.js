/* Site-wide back-to-top control */
(function () {
  function initScrollTop() {
    if (document.getElementById('scrollTopButton')) return;

    var button = document.createElement('button');
    button.id = 'scrollTopButton';
    button.className = 'scroll-top-button';
    button.type = 'button';
    button.setAttribute('aria-label', 'ページ上部へ戻る');
    button.setAttribute('title', 'ページ上部へ戻る');
    button.textContent = '上へ';
    document.body.appendChild(button);

    var visibleAfter = 500;
    var ticking = false;

    function update() {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      button.classList.toggle('is-visible', y > visibleAfter);
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    button.addEventListener('click', function () {
      var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollTop, { once: true });
  } else {
    initScrollTop();
  }
})();
