#!/usr/bin/env python3
"""Stop inlining the 218 KB US map on every play page.

The map is 90% of a play page's 243 KB, it is byte-identical on every one of
them, and /data/us-map.svg already holds exactly the same file. Inlined, the
browser re-downloads it on every navigation and can never cache it. Fetched, it
is downloaded once and served from cache on all the others.

Ahrefs flags 21 slow pages; exactly 21 pages carry this SVG, and 18 of them
share one structure. The three state-silhouettes pages build their map from a
JS object instead and are left alone here.

The game script binds to the map synchronously:
    const svg = document.querySelector('#pts-map-wrap svg')
so it cannot simply run earlier than the fetch. Its body is moved into a boot
function that runs once the SVG is in the DOM.
"""
import pathlib, re, sys

SVG_URL = '/data/us-map.svg?v=1'
LOADER = """(function(){
function __bootGame(){%s}
var __wrap=document.getElementById('pts-map-wrap');
if(!__wrap){__bootGame();return;}
fetch('%s').then(function(r){if(!r.ok)throw new Error(r.status);return r.text();})
 .then(function(svg){__wrap.innerHTML=svg;__bootGame();})
 .catch(function(){__wrap.innerHTML='<p style="padding:20px;text-align:center">Map failed to load. Please refresh.</p>';});
})();"""

targets = []
for p in sorted(pathlib.Path('.').rglob('play/*/index.html')):
    if any(s in p.parts for s in ('node_modules', '.git', 'tmp')): continue
    s = p.read_text(encoding='utf-8', errors='ignore')
    if 'id="pts-map-wrap"' in s and '<svg' in s:
        targets.append(p)

print(f'{len(targets)} pages to transform\n')
done = 0
for p in targets:
    s = p.read_text(encoding='utf-8')
    before = len(s)

    # 1. drop the inline svg that sits inside the map wrapper
    w = s.find('id="pts-map-wrap"')
    m = re.compile(r'<svg\b.*?</svg>', re.S).search(s, w)
    if not m or m.start() - w > 400:
        print(f'  SKIP {p}: no svg right after the wrapper'); continue
    s = s[:m.start()] + s[m.end():]

    # 2. defer the game until the map has been injected
    scripts = [(mm.start(), mm.end(), mm.group(1)) for mm in
               re.finditer(r'<script(?![^>]*\ssrc=)[^>]*>(.*?)</script>', s, re.S)
               if '"@context"' not in mm.group(1)]
    if not scripts:
        print(f'  SKIP {p}: no game script'); continue
    st, en, body = max(scripts, key=lambda t: len(t[2]))
    stripped = body.strip()
    if not (stripped.startswith('(function(){') and stripped.endswith('})();')):
        print(f'  SKIP {p}: unexpected script shape'); continue
    inner = stripped[len('(function(){'):-len('})();')]
    if '__bootGame' in inner:
        print(f'  skip {p}: already transformed'); continue

    new_script = '<script>' + (LOADER % (inner, SVG_URL)) + '</script>'
    s = s[:st] + new_script + s[en:]

    p.write_text(s, encoding='utf-8')
    done += 1
    print(f'  {before//1024:4} KB -> {len(s)//1024:3} KB   {p}')

print(f'\n{done} pages transformed')
