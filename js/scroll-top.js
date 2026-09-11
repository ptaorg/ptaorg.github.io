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

  function initHomeOptinDefinition() {
    if (!document.body || !document.body.classList.contains('home-page')) return;
    if (document.querySelector('.hc-optin-definition')) return;

    var coreHead = document.querySelector('.hc-core-head');
    if (!coreHead) return;

    var definition = document.createElement('p');
    definition.className = 'hc-optin-definition';

    var label = document.createElement('strong');
    label.textContent = 'オプトインとは、';
    definition.appendChild(label);
    definition.appendChild(document.createTextNode('本人が内容を確認したうえで、自分の意思で「加入する」と申し込んで初めて会員になる方式です。何もしないこと、在籍していること、退会届を出していないことだけでは、加入したことにはなりません。'));

    coreHead.insertAdjacentElement('afterend', definition);

    if (!document.getElementById('hc-optin-definition-style')) {
      var style = document.createElement('style');
      style.id = 'hc-optin-definition-style';
      style.textContent =
        '.home-page .hc-optin-definition{' +
          'max-width:66%;' +
          'margin:16px 0 0;' +
          'padding:0 0 15px;' +
          'border-bottom:2px solid #173650;' +
          'color:#2f4050;' +
          'font-size:.96rem;' +
          'line-height:1.85;' +
        '}' +
        '.home-page .hc-optin-definition strong{' +
          'color:#173650;' +
          'font-weight:900;' +
        '}' +
        '.home-page .hc-optin-definition + .hc-boundary-prose{' +
          'margin-top:26px;' +
          'padding-top:0;' +
          'border-top:0;' +
        '}' +
        '@media(max-width:760px){' +
          '.home-page .hc-optin-definition{' +
            'max-width:100%;' +
            'margin-top:18px;' +
            'font-size:.94rem;' +
            'line-height:1.8;' +
          '}' +
        '}';
      document.head.appendChild(style);
    }
  }

  function initPageEnhancements() {
    initScrollTop();
    initHomeOptinDefinition();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageEnhancements, { once: true });
  } else {
    initPageEnhancements();
  }
})();
