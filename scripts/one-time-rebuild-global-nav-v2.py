from pathlib import Path
import runpy

runpy.run_path('scripts/one-time-rebuild-global-nav.py', run_name='__main__')

p = Path('js/site.js')
s = p.read_text(encoding='utf-8')
old = """    function hrefPath(a){
      try { return new URL(a.href, location.href).pathname.replace(/\\/+$/,'') || '/'; }
      catch(e){ return ''; }
    }"""
new = """    function hrefPath(a){
      var h = a.getAttribute('href') || '';
      if (!h || h.charAt(0) !== '/') return '';
      h = h.split('#')[0].split('?')[0];
      return h.replace(/\\/+$/,'') || '/';
    }"""
if old not in s:
    raise SystemExit('hrefPath block not found')
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
print('patched hrefPath for site checker compatibility')
