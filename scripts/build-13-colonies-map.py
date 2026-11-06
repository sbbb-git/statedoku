#!/usr/bin/env python3
"""Build img/maps/13-colonies-regions.svg from data/us-map.svg.

The 13 original colonies on today's state outlines, coloured by the three
regional groups, neighbouring states in grey, USPS codes as labels (language
neutral, so one file serves the EN, FR and ES pages, whose legend is HTML).
Coordinates are cropped to the East Coast and rounded to 0.1.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data' / 'us-map.svg'
OUT = ROOT / 'img' / 'maps' / '13-colonies-regions.svg'

REGIONS = {
    'ne': (['MA', 'CT', 'RI', 'NH'], '#0F2147', '#FFFFFF'),
    'mid': (['NY', 'NJ', 'PA', 'DE'], '#DC2626', '#FFFFFF'),
    'south': (['MD', 'VA', 'NC', 'SC', 'GA'], '#F59E0B', '#0F2147'),
}
COLONIES = {s: r for r, (ss, _, _) in REGIONS.items() for s in ss}
assert len(COLONIES) == 13
GREY, EDGE = '#E2E8F0', '#FFFFFF'

# Labels that do not fit inside their state sit offshore with a leader line.
OFFSHORE = {'RI': (28, 10), 'CT': (14, 26), 'NJ': (30, 6), 'DE': (30, 6), 'MD': (34, 22), 'MA': (34, -6)}

svg = SRC.read_text(encoding='utf-8')
paths = {m.group(1): m.group(2) for m in re.finditer(r'<path[^>]*data-usps="([A-Z]{2})"[^>]*\sd="([^"]*)"', svg)}
assert len(paths) == 50, len(paths)


def rings(d):
    out = []
    for part in re.findall(r'M[^M]*', d):
        pts = [tuple(map(float, p.split(','))) for p in re.findall(r'-?[\d.]+,-?[\d.]+', part)]
        if pts:
            out.append(pts)
    return out


def bbox(pts):
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


R = {k: rings(v) for k, v in paths.items()}
allpts = [p for s in COLONIES for ring in R[s] for p in ring]
x0, y0, x1, y1 = bbox(allpts)
pad = 12
x0, y0, x1, y1 = x0 - pad, y0 - pad, x1 + 70, y1 + pad  # room on the right for offshore labels


def intersects(s):
    a, b, c, d = bbox([p for ring in R[s] for p in ring])
    return not (c < x0 or a > x1 or d < y0 or b > y1)


def path_d(s):
    return ''.join('M' + 'L'.join(f'{x - x0:.1f},{y - y0:.1f}' for x, y in ring) + 'Z' for ring in R[s])


def centroid(s):
    ring = max(R[s], key=len)
    a = cx = cy = 0.0
    for (xa, ya), (xb, yb) in zip(ring, ring[1:] + ring[:1]):
        f = xa * yb - xb * ya
        a += f; cx += (xa + xb) * f; cy += (ya + yb) * f
    a *= 0.5
    return cx / (6 * a) - x0, cy / (6 * a) - y0


W, H = x1 - x0, y1 - y0
neigh = sorted(s for s in paths if s not in COLONIES and intersects(s))
out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" role="img" aria-labelledby="t">',
       '<title id="t">The 13 original colonies on today\'s state borders: New England, Middle and Southern colonies</title>',
       f'<rect width="{W:.0f}" height="{H:.0f}" fill="#F8FAFC"/>',
       f'<g fill="{GREY}" stroke="{EDGE}" stroke-width="1">']
out += [f'<path d="{path_d(s)}"/>' for s in neigh]
out.append('</g>')
for r, (ss, fill, _) in REGIONS.items():
    out.append(f'<g fill="{fill}" stroke="{EDGE}" stroke-width="1">')
    out += [f'<path d="{path_d(s)}"/>' for s in ss]
    out.append('</g>')
out.append('<g font-family="Inter,Arial,sans-serif" font-size="11" font-weight="700" text-anchor="middle">')
for s, r in COLONIES.items():
    cx, cy = centroid(s)
    ink = REGIONS[r][2]
    if s in OFFSHORE:
        dx, dy = OFFSHORE[s]
        lx, ly = cx + dx, cy + dy
        out.append(f'<line x1="{cx:.1f}" y1="{cy:.1f}" x2="{lx - 9:.1f}" y2="{ly - 4:.1f}" stroke="#475569" stroke-width="0.8"/>')
        out.append(f'<text x="{lx:.1f}" y="{ly:.1f}" fill="#0F2147">{s}</text>')
    else:
        out.append(f'<text x="{cx:.1f}" y="{cy + 4:.1f}" fill="{ink}">{s}</text>')
out.append('</g></svg>')
OUT.write_text('\n'.join(out) + '\n', encoding='utf-8')
print(f'{OUT.relative_to(ROOT)}: {len(COLONIES)} colonies, {len(neigh)} neighbouring states, {OUT.stat().st_size:,} bytes, viewBox {W:.0f}x{H:.0f}')
