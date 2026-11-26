#!/usr/bin/env python3
"""Build img/maps/colorado-river-states.svg: the Colorado River and the seven basin states.

States come from data/us-map.svg (us-atlas, d3.geoAlbersUsa().scale(1300)
.translate([487.5, 305])). The river comes from Natural Earth's 1:50m rivers
and lake centerlines (public domain), its western Colorado kept in
scripts/data/colorado-river/, projected with the same Albers conic as
scripts/build-great-lakes-map.py, checked against two corners of Colorado.
Navy: the five states the river itself runs through or along (the daily
grid's "On the Colorado River": AZ, CA, CO, NV, UT). Gold: the two states in
its basin through tributaries only (WY, the Green River; NM, the San Juan and the Gila).
Neighbours grey; the legend is HTML on the page.
"""
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data' / 'us-map.svg'
RIVER = ROOT / 'scripts' / 'data' / 'colorado-river' / 'ne_50m_colorado_river.geojson'
OUT = ROOT / 'img' / 'maps' / 'colorado-river-states.svg'

ON_RIVER = ['CO', 'UT', 'AZ', 'NV', 'CA']
BASIN_ONLY = ['WY', 'NM']
SEVEN = ON_RIVER + BASIN_ONLY
assert len(set(SEVEN)) == 7

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


river = json.loads(RIVER.read_text(encoding='utf-8'))['features'][0]['geometry']['coordinates']
LINES = [[project(lon, lat) for lon, lat in line] for line in river]
assert len(LINES) > 5

def bbox(pts):
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


allpts = [p for s in SEVEN for r in R[s] for p in r] + [p for l in LINES for p in l]
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



NUDGE = {'CA': (14, -6), 'NV': (0, -10), 'AZ': (-6, 0), 'UT': (0, -8), 'CO': (8, 0), 'WY': (0, 4), 'NM': (8, 4)}

W, H = x1 - x0, y1 - y0
neigh = sorted(s for s in paths if s not in SEVEN and inside([p for r in R[s] for p in r]))


def line_d(l):
    pts = []
    for x, y in l:
        p = f'{x - x0:.1f},{y - y0:.1f}'
        if not pts or pts[-1] != p:
            pts.append(p)
    return 'M' + 'L'.join(pts)


out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" role="img" aria-labelledby="t">',
       '<title id="t">The Colorado River and its seven basin states: Colorado, Utah, Arizona, Nevada and California on the river itself; Wyoming and New Mexico in the basin through its tributaries</title>',
       f'<rect width="{W:.0f}" height="{H:.0f}" fill="#F8FAFC"/>',
       '<g fill="#E2E8F0" stroke="#FFFFFF" stroke-width="1">'] + [f'<path d="{path_d(R[s])}"/>' for s in neigh] + ['</g>']
out.append('<g fill="#0F2147" stroke="#FFFFFF" stroke-width="1">')
out += [f'<path d="{path_d(R[s])}"/>' for s in ON_RIVER]
out.append('</g>')
out.append('<g fill="#F59E0B" stroke="#FFFFFF" stroke-width="1">')
out += [f'<path d="{path_d(R[s])}"/>' for s in BASIN_ONLY]
out.append('</g>')
out.append('<g fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">')
out += [f'<path d="{line_d(l)}"/>' for l in LINES]
out.append('</g>')
out.append('<g fill="none" stroke="#3B82F6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">')
out += [f'<path d="{line_d(l)}"/>' for l in LINES]
out.append('</g>')
out.append('<g font-family="Inter,Arial,sans-serif" font-size="12" font-weight="700" text-anchor="middle">')
for s in SEVEN:
    cx, cy = centroid(max(R[s], key=area))
    dx, dy = NUDGE.get(s, (0, 0))
    fill = '#0F2147' if s in BASIN_ONLY else '#FFFFFF'
    out.append(f'<text x="{cx + dx:.0f}" y="{cy + dy + 4:.0f}" fill="{fill}">{s}</text>')
out.append('</g>')
mx, my = LINES[-1][-1] if LINES[-1][-1][1] > LINES[0][0][1] else LINES[0][0]
mx, my = min((p for l in LINES for p in l), key=lambda q: -q[1])
out.append(f'<text x="{mx - x0 + 30:.0f}" y="{H - 6:.0f}" font-family="Inter,Arial,sans-serif" font-size="10.5" font-style="italic" fill="#64748B" text-anchor="start">Mexico</text>')
out.append('</svg>')
OUT.write_text('\n'.join(out) + '\n', encoding='utf-8')
print(f'{OUT.relative_to(ROOT)}: 7 states, {len(LINES)} river lines, {len(neigh)} neighbours, {OUT.stat().st_size:,} bytes, viewBox {W:.0f}x{H:.0f}')
