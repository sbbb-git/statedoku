#!/usr/bin/env python3
"""Build img/maps/great-lakes-states.svg: the 8 Great Lakes states and the 5 lakes.

States come from data/us-map.svg, which is us-atlas's states drawn with
d3.geoAlbersUsa().scale(1300).translate([487.5, 305]). The lakes come from
Natural Earth's 1:50m lakes (public domain), kept in
scripts/data/great-lakes/, and are projected here with the same Albers conic
(parallels 29.5 and 45.5, rotation 96 W, centre 38.7 N), checked against two
corners of Colorado that d3 projects to known pixels. Michigan, the state on
four lakes, in gold; the other seven in navy; neighbours grey. USPS codes and
lake names as labels; the legend is HTML on the page. Coordinates cropped and
rounded.
"""
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data' / 'us-map.svg'
LAKES = ROOT / 'scripts' / 'data' / 'great-lakes' / 'ne_50m_great_lakes.geojson'
OUT = ROOT / 'img' / 'maps' / 'great-lakes-states.svg'

# Which lakes each state touches (the page's table says the same).
TOUCH = {
    'MI': ['Superior', 'Michigan', 'Huron', 'Erie'],
    'WI': ['Superior', 'Michigan'],
    'NY': ['Erie', 'Ontario'],
    'OH': ['Erie'],
    'MN': ['Superior'],
    'IL': ['Michigan'],
    'PA': ['Erie'],
    'IN': ['Michigan'],
}
assert len(TOUCH) == 8 and max(TOUCH, key=lambda s: len(TOUCH[s])) == 'MI'

# d3.geoAlbers as used by geoAlbersUsa for the lower 48.
P1, P2, ROT, CLAT, CLON, K, TX, TY = 29.5, 45.5, 96.0, 38.7, -0.6, 1300.0, 487.5, 305.0
s1, s2 = math.radians(P1), math.radians(P2)
N = (math.sin(s1) + math.sin(s2)) / 2
C = math.cos(s1) ** 2 + 2 * N * math.sin(s1)
R0 = math.sqrt(C) / N


def raw(lon, lat):
    lam, phi = math.radians(lon), math.radians(lat)
    r = math.sqrt(C - 2 * N * math.sin(phi)) / N
    return r * math.sin(lam * N), R0 - r * math.cos(lam * N)


cx0, cy0 = raw(CLON, CLAT)


def project(lon, lat):
    x, y = raw(lon + ROT, lat)
    return TX + K * (x - cx0), TY - K * (y - cy0)


# Two corners of Colorado as d3 projects them (checked on 26 November 2026).
for (lon, lat), (ex, ey) in (((-109.05, 41.0), (277.09524610933005, 237.17802965589965)),
                             ((-102.05, 41.0), (395.3468194166537, 249.10012550170256))):
    px, py = project(lon, lat)
    assert abs(px - ex) < 0.01 and abs(py - ey) < 0.01, (px, py, ex, ey)

svg = SRC.read_text(encoding='utf-8')
paths = {m.group(1): m.group(2) for m in re.finditer(r'<path[^>]*data-usps="([A-Z]{2})"[^>]*\sd="([^"]*)"', svg)}
assert len(paths) == 50


def rings(d):
    return [[tuple(map(float, p.split(','))) for p in re.findall(r'-?[\d.]+,-?[\d.]+', part)]
            for part in re.findall(r'M[^M]*', d) if part]


R = {k: [r for r in rings(v) if r] for k, v in paths.items()}

lakes = json.loads(LAKES.read_text(encoding='utf-8'))['features']
LR = {}
for f in lakes:
    name = f['properties']['name'].replace('Lake ', '')
    g = f['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    LR[name] = [[project(lon, lat) for lon, lat in ring] for poly in polys for ring in poly[:1]]
assert {'Superior', 'Michigan', 'Huron', 'Erie', 'Ontario'} <= set(LR)


def bbox(pts):
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


allpts = [p for s in TOUCH for r in R[s] for p in r] + [p for n in LR for r in LR[n] for p in r]
x0, y0, x1, y1 = bbox(allpts)
x0, y0, x1, y1 = x0 - 12, y0 - 12, x1 + 12, y1 + 12


def inside(pts):
    a, b, c, d = bbox(pts)
    return not (c < x0 or a > x1 or d < y0 or b > y1)


def ring_d(r):
    pts = []
    for x, y in r:
        p = f'{x - x0:.0f},{y - y0:.0f}'
        if not pts or pts[-1] != p:
            pts.append(p)
    return 'M' + 'L'.join(pts) + 'Z' if len(pts) > 2 else ''


def path_d(rs):
    return ''.join(ring_d(r) for r in rs)


def area(ring):
    return abs(sum(xa * yb - xb * ya for (xa, ya), (xb, yb) in zip(ring, ring[1:] + ring[:1]))) / 2


def centroid(ring):
    a = cx = cy = 0.0
    for (xa, ya), (xb, yb) in zip(ring, ring[1:] + ring[:1]):
        f = xa * yb - xb * ya
        a += f; cx += (xa + xb) * f; cy += (ya + yb) * f
    a *= 0.5
    return cx / (6 * a) - x0, cy / (6 * a) - y0


# Label nudges (pixels) where the centroid sits badly; lake names placed in open water.
NUDGE = {'MI': (4, 6), 'NY': (14, 6), 'PA': (6, 4), 'MN': (0, 10), 'WI': (-4, 6)}
LAKE_LABEL = {'Superior': (0, 2), 'Michigan': (0, 0), 'Huron': (6, 6), 'Erie': (2, 1), 'Ontario': (0, 1)}

W, H = x1 - x0, y1 - y0
neigh = sorted(s for s in paths if s not in TOUCH and inside([p for r in R[s] for p in r]))
out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" role="img" aria-labelledby="t">',
       '<title id="t">The eight Great Lakes states and the five Great Lakes: Michigan touches four lakes; Wisconsin and New York two; Minnesota, Illinois, Indiana, Ohio and Pennsylvania one</title>',
       f'<rect width="{W:.0f}" height="{H:.0f}" fill="#F8FAFC"/>',
       '<g fill="#E2E8F0" stroke="#FFFFFF" stroke-width="1">'] + [f'<path d="{path_d(R[s])}"/>' for s in neigh] + ['</g>']
out.append('<g fill="#0F2147" stroke="#FFFFFF" stroke-width="1">')
out += [f'<path d="{path_d(R[s])}"/>' for s in TOUCH if s != 'MI']
out.append('</g>')
out.append(f'<path fill="#F59E0B" stroke="#FFFFFF" stroke-width="1" d="{path_d(R["MI"])}"/>')
out.append('<g fill="#93C5FD" stroke="#3B82F6" stroke-width="0.8">')
out += [f'<path d="{path_d(LR[n])}"/>' for n in LR]
out.append('</g>')
out.append('<g font-family="Inter,Arial,sans-serif" font-size="12" font-weight="700" text-anchor="middle">')
for s in TOUCH:
    cx, cy = centroid(max(R[s], key=area))
    dx, dy = NUDGE.get(s, (0, 0))
    fill = '#0F2147' if s == 'MI' else '#FFFFFF'
    out.append(f'<text x="{cx + dx:.0f}" y="{cy + dy + 4:.0f}" fill="{fill}">{s}</text>')
out.append('</g>')
out.append('<g font-family="Inter,Arial,sans-serif" font-size="10.5" font-weight="700" font-style="italic" fill="#1E3A8A" text-anchor="middle">')
for n, (dx, dy) in LAKE_LABEL.items():
    cx, cy = centroid(max(LR[n], key=area))
    if n == 'Michigan':
        # A long narrow lake: the name runs along it.
        out.append(f'<text x="{cx + dx:.0f}" y="{cy + dy:.0f}" transform="rotate(-90 {cx + dx:.0f} {cy + dy:.0f})" dy="4">{n}</text>')
    else:
        out.append(f'<text x="{cx + dx:.0f}" y="{cy + dy + 4:.0f}">{n}</text>')
out.append('</g></svg>')
OUT.write_text('\n'.join(out) + '\n', encoding='utf-8')
print(f'{OUT.relative_to(ROOT)}: 8 states, {len(LR)} lakes, {len(neigh)} neighbours, {OUT.stat().st_size:,} bytes, viewBox {W:.0f}x{H:.0f}')
