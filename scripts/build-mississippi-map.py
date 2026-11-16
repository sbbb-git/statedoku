#!/usr/bin/env python3
"""Build img/maps/mississippi-river-states.svg from data/us-map.svg.

The ten states the Mississippi River touches, on today's outlines, coloured by
the bank they hold: east bank, west bank, or both (Minnesota, where the river
rises and runs inside the state before it becomes the Wisconsin line, and
Louisiana, where it leaves the Mississippi line and runs inside the state to
the Gulf). Neighbours in grey, USPS codes as language-neutral labels; the
legend is HTML on each page. Coordinates cropped and rounded.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data' / 'us-map.svg'
OUT = ROOT / 'img' / 'maps' / 'mississippi-river-states.svg'

BANKS = {
    'east': (['WI', 'IL', 'KY', 'TN', 'MS'], '#0F2147', '#FFFFFF'),
    'west': (['IA', 'MO', 'AR'], '#DC2626', '#FFFFFF'),
    'both': (['MN', 'LA'], '#F59E0B', '#0F2147'),
}
RIVER = {s: b for b, (ss, _, _) in BANKS.items() for s in ss}
assert len(RIVER) == 10
GREY = '#E2E8F0'
OFFSHORE = {}

svg = SRC.read_text(encoding='utf-8')
paths = {m.group(1): m.group(2) for m in re.finditer(r'<path[^>]*data-usps="([A-Z]{2})"[^>]*\sd="([^"]*)"', svg)}
assert len(paths) == 50


def rings(d):
    return [[tuple(map(float, p.split(','))) for p in re.findall(r'-?[\d.]+,-?[\d.]+', part)]
            for part in re.findall(r'M[^M]*', d) if part]


R = {k: [r for r in rings(v) if r] for k, v in paths.items()}


def bbox(pts):
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


x0, y0, x1, y1 = bbox([p for s in RIVER for r in R[s] for p in r])
x0, y0, x1, y1 = x0 - 60, y0 - 10, x1 + 60, y1 + 10


def inside(s):
    a, b, c, d = bbox([p for r in R[s] for p in r])
    return not (c < x0 or a > x1 or d < y0 or b > y1)


def path_d(s):
    out = []
    for r in R[s]:
        pts = []
        for x, y in r:
            p = f'{x - x0:.0f},{y - y0:.0f}'
            if not pts or pts[-1] != p:
                pts.append(p)
        if len(pts) > 2:
            out.append('M' + 'L'.join(pts) + 'Z')
    return ''.join(out)


def centroid(s):
    ring = max(R[s], key=len)
    a = cx = cy = 0.0
    for (xa, ya), (xb, yb) in zip(ring, ring[1:] + ring[:1]):
        f = xa * yb - xb * ya
        a += f; cx += (xa + xb) * f; cy += (ya + yb) * f
    a *= 0.5
    return cx / (6 * a) - x0, cy / (6 * a) - y0


W, H = x1 - x0, y1 - y0
neigh = sorted(s for s in paths if s not in RIVER and inside(s))
out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" role="img" aria-labelledby="t">',
       '<title id="t">The ten states on the Mississippi River, coloured by the bank they hold: east, west or both</title>',
       f'<rect width="{W:.0f}" height="{H:.0f}" fill="#F8FAFC"/>',
       f'<g fill="{GREY}" stroke="#FFFFFF" stroke-width="1">'] + [f'<path d="{path_d(s)}"/>' for s in neigh] + ['</g>']
for b, (ss, fill, _) in BANKS.items():
    out.append(f'<g fill="{fill}" stroke="#FFFFFF" stroke-width="1">')
    out += [f'<path d="{path_d(s)}"/>' for s in ss]
    out.append('</g>')
out.append('<g font-family="Inter,Arial,sans-serif" font-size="12" font-weight="700" text-anchor="middle">')
for s, b in RIVER.items():
    cx, cy = centroid(s)
    if s in OFFSHORE:
        dx, dy = OFFSHORE[s]
        out.append(f'<line x1="{cx:.0f}" y1="{cy:.0f}" x2="{cx + dx - 10:.0f}" y2="{cy + dy - 4:.0f}" stroke="#475569" stroke-width="0.8"/>')
        out.append(f'<text x="{cx + dx:.0f}" y="{cy + dy:.0f}" fill="#0F2147">{s}</text>')
    else:
        out.append(f'<text x="{cx:.0f}" y="{cy + 4:.0f}" fill="{BANKS[b][2]}">{s}</text>')
out.append('</g></svg>')
OUT.write_text('\n'.join(out) + '\n', encoding='utf-8')
print(f'{OUT.relative_to(ROOT)}: 10 river states, {len(neigh)} neighbours, {OUT.stat().st_size:,} bytes, viewBox {W:.0f}x{H:.0f}')
