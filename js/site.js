/* site.js loader — 2026-08-21 */
(function(){
  function load(src, id, done){
    if (document.getElementById(id)) { if (done) done(); return; }
    var s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.async = false;
    if (done) s.onload = done;
    (document.head || document.documentElement).appendChild(s);
  }
  load('/js/site-core-v90.js?v=90', 'site-core-v90', function(){
    load('/js/current-location-nav.js?v=20260821-1', 'current-location-nav');
  });
})();
