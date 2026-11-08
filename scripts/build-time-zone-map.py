#!/usr/bin/env python3
"""Build img/maps/us-time-zones.svg from data/us-map.svg.

Each state is filled with its time zone. The 14 states a zone line crosses are
striped in both colours, the zone covering most of the state first: the map is
drawn from state outlines, so it does not place the line inside a state; the
table on the page says which part is on which zone. USPS codes label the
states wide enough to hold one; labels are language neutral, so one file can
serve the three languages (the legend is HTML on each page).
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data' / 'us-map.svg'
OUT = ROOT / 'img' / 'maps' / 'us-time-zones.svg'

COL = {'E': '#0F2147', 'C': '#DC2626', 'M': '#F59E0B', 'P': '#059669', 'AK': '#7C3AED', 'H': '#0284C7'}
INK = {'E': '#FFFFFF', 'C': '#FFFFFF', 'M': '#0F2147', 'P': '#FFFFFF', 'AK': '#FFFFFF', 'H': '#FFFFFF'}

ZONES = {
    # whole state on one zone
    **{s: ['E'] for s in 'CT DE GA ME MD MA NH NJ NY NC OH PA RI SC VT VA WV'.split()},
    **{s: ['C'] for s in 'AL AR IL IA LA MN MS MO WI OK'.split()},
    **{s: ['M'] for s in 'AZ CO MT NM UT WY'.split()},
    **{s: ['P'] for s in 'CA WA'.split()},
    'HI': ['H'],
    # split: the zone covering most of the state first
    'AK': ['AK', 'H'], 'FL': ['E', 'C'], 'ID': ['M', 'P'], 'IN': ['E', 'C'],
    'KS': ['C', 'M'], 'KY': ['E', 'C'], 'MI': ['E', 'C'], 'NE': ['C', 'M'],
    'NV': ['P', 'M'], 'ND': ['C', 'M'], 'OR': ['P', 'M'], 'SD': ['C', 'M'],
    'TN': ['C', 'E'], 'TX': ['C', 'M'],
}
assert len(ZONES) == 50
assert sum(len(z) == 2 for z in ZONES.values()) == 14

svg = SRC.read_text(encoding='utf-8')
viewbox = re.search(r'viewBox="([^"]*)"', svg).group(1)
paths = {m.group(1): m.group(2) for m in re.finditer(r'<path[^>]*data-usps="([A-Z]{2})"[^>]*\sd="([^"]*)"', svg)}
assert set(paths) == set(ZONES), set(paths) ^ set(ZONES)


def rings(d):
    return [[tuple(map(float, p.split(','))) for p in re.findall(r'-?[\d.]+,-?[\d.]+', part)]
            for part in re.findall(r'M[^M]*', d)]


def rd(d):
    out = []
    for r in rings(d):
        pts = []
        for x, y in r:
            p = f'{x:.0f},{y:.0f}'
            if not pts or pts[-1] != p:
                pts.append(p)
        if len(pts) > 2:
            out.append('M' + 'L'.join(pts) + 'Z')
    return ''.join(out)


def centroid(d):
    ring = max(rings(d), key=len)
    a = cx = cy = 0.0
    for (xa, ya), (xb, yb) in zip(ring, ring[1:] + ring[:1]):
        f = xa * yb - xb * ya
        a += f; cx += (xa + xb) * f; cy += (ya + yb) * f
    a *= 0.5
    xs = [p[0] for p in ring]
    return cx / (6 * a), cy / (6 * a), max(xs) - min(xs)


out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" role="img" aria-labelledby="t">',
       '<title id="t">Map of the 50 US states by time zone: Eastern, Central, Mountain, Pacific, Alaska and Hawaii-Aleutian; the 14 states split between two zones are striped</title>',
       '<defs>']
for s, z in sorted(ZONES.items()):
    if len(z) == 2:
        a, b = z
        out.append(f'<pattern id="p{s}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
                   f'<rect width="8" height="8" fill="{COL[a]}"/><rect x="5" width="3" height="8" fill="{COL[b]}"/></pattern>')
out.append('</defs><g stroke="#FFFFFF" stroke-width="1">')
for s in sorted(ZONES):
    z = ZONES[s]
    fill = f'url(#p{s})' if len(z) == 2 else COL[z[0]]
    out.append(f'<path d="{rd(paths[s])}" fill="{fill}"/>')
out.append('</g><g font-family="Inter,Arial,sans-serif" font-size="12" font-weight="700" text-anchor="middle" paint-order="stroke" stroke-width="3" stroke-linejoin="round">')
labelled = 0
for s in sorted(ZONES):
    cx, cy, w = centroid(paths[s])
    if w < 38:
        continue
    z = ZONES[s][0]
    halo = COL[z]
    out.append(f'<text x="{cx:.1f}" y="{cy + 4:.1f}" fill="{INK[z]}" stroke="{halo}">{s}</text>')
    labelled += 1
out.append('</g></svg>')
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text('\n'.join(out) + '\n', encoding='utf-8')
print(f'{OUT.relative_to(ROOT)}: 50 states, 14 striped, {labelled} labelled, {OUT.stat().st_size:,} bytes')
