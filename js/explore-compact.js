/* Keep search results close to the input on compact screens. */
(function () {
  'use strict';
  const details = document.querySelector('.explore-filter-details');
  if (!details) return;
  const small = window.matchMedia('(max-width: 760px)');
  const params = new URLSearchParams(location.search);
  details.open = !small.matches || ['pref','topic','type'].some(k => !!params.get(k));
  const change = e => { details.open = !e.matches; };
  if (small.addEventListener) small.addEventListener('change', change);
  else if (small.addListener) small.addListener(change);
})();
