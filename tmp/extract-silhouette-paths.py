#!/usr/bin/env python3
"""Build the silhouette game's PATHS object from the shared SVG instead of
inlining it.

Same 211 KB of path data as /data/us-map.svg, in JS object form, on three more
pages. Verified beforehand that all 50 d values are byte-identical to the file,
so deriving them at runtime is exact rather than approximate.

The game reads PATHS[id] synchronously, so its body moves into a boot function
that runs once the SVG has been parsed. The file is already fetched and cached
by the other play pages, so on a second visit this costs nothing.
"""
import pathlib, re, sys

SVG_URL = '/data/us-map.svg?v=1'
PRELUDE = """var PATHS={};
function __bootGame(){%s}
fetch('%s').then(function(r){if(!r.ok)throw new Error(r.status);return r.text();})
 .then(function(t){
   var doc=new DOMParser().parseFromString(t,'image/svg+xml');
   Array.prototype.forEach.call(doc.querySelectorAll('path[data-usps]'),function(p){
     PATHS[p.getAttribute('data-usps')]=p.getAttribute('d');
   });
   if(Object.keys(PATHS).length<50)throw new Error('map incomplete');
   __bootGame();
 })
 .catch(function(){
   var m=document.querySelector('#g-silh')||document.body;
   m.innerHTML='<p style="padding:20px;text-align:center">Map failed to load. Please refresh.</p>';
 });"""

pages = [pathlib.Path(p) / 'index.html' for p in
         ('play/state-silhouettes', 'fr/play/state-silhouettes', 'es/play/state-silhouettes')]

done = 0
for p in pages:
    if not p.is_file():
        print('missing:', p); continue
    s = p.read_text(encoding='utf-8')
    before = len(s)
    if '__bootGame' in s:
        print('already transformed:', p); continue

    js = [(m.start(), m.end(), m.group(1)) for m in
          re.finditer(r'<script(?![^>]*\ssrc=)[^>]*>(.*?)</script>', s, re.S)
          if '"@context"' not in m.group(1)]
    st, en, body = max(js, key=lambda t: len(t[2]))
    b = body.strip()
    if not (b.startswith('(function(){') and b.endswith('})();')):
        print('unexpected shape:', p); continue
    inner = b[len('(function(){'):-len('})();')]

    # cut out the PATHS literal, matching braces so no nested object is clipped
    m = re.search(r'const PATHS\s*=\s*\{', inner)
    if not m:
        print('no PATHS literal:', p); continue
    i = m.end() - 1; depth = 0
    for j in range(i, len(inner)):
        if inner[j] == '{': depth += 1
        elif inner[j] == '}':
            depth -= 1
            if depth == 0: break
    tail = inner[j+1:]
    tail = tail[1:] if tail.startswith(';') else tail
    inner_no_paths = inner[:m.start()] + tail

    new = '<script>(function(){' + (PRELUDE % (inner_no_paths, SVG_URL)) + '})();</script>'
    s = s[:st] + new + s[en:]
    p.write_text(s, encoding='utf-8')
    done += 1
    print(f'  {before//1024:4} KB -> {len(s)//1024:3} KB   {p}')

print(f'\n{done} pages transformed')
