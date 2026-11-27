#!/usr/bin/env python3
"""Build img/maps/national-parks-by-state.svg from data/us-map.svg.

Each state is shaded by how many of the 64 sites officially named National
Park lie in it, a park in two or three states counting for each (Yellowstone,
Great Smoky Mountains, Death Valley). Asserts 64 parks, 62 in the states and 2
in the territories, 30 states with at least one, the 20 others, and the grid's
natl_parks_3 set (states with three or more) in js/puzzle.js. The count sits
on each state that has a park; the legend is HTML on the page. Coordinates
rounded. Re-run when Congress names a new park.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data' / 'us-map.svg'
OUT = ROOT / 'img' / 'maps' / 'national-parks-by-state.svg'

# NPS list of National Parks, as of the Chiricahua National Park Act (20 October 2026).
PARKS = {
    'Acadia': 'ME', 'American Samoa': '', 'Arches': 'UT', 'Badlands': 'SD', 'Big Bend': 'TX',
    'Biscayne': 'FL', 'Black Canyon of the Gunnison': 'CO', 'Bryce Canyon': 'UT', 'Canyonlands': 'UT',
    'Capitol Reef': 'UT', 'Carlsbad Caverns': 'NM', 'Channel Islands': 'CA', 'Chiricahua': 'AZ',
    'Congaree': 'SC', 'Crater Lake': 'OR', 'Cuyahoga Valley': 'OH', 'Death Valley': 'CA NV',
    'Denali': 'AK', 'Dry Tortugas': 'FL', 'Everglades': 'FL', 'Gates of the Arctic': 'AK',
    'Gateway Arch': 'MO', 'Glacier': 'MT', 'Glacier Bay': 'AK', 'Grand Canyon': 'AZ',
    'Grand Teton': 'WY', 'Great Basin': 'NV', 'Great Sand Dunes': 'CO', 'Great Smoky Mountains': 'NC TN',
    'Guadalupe Mountains': 'TX', 'Haleakala': 'HI', 'Hawaii Volcanoes': 'HI', 'Hot Springs': 'AR',
    'Indiana Dunes': 'IN', 'Isle Royale': 'MI', 'Joshua Tree': 'CA', 'Katmai': 'AK', 'Kenai Fjords': 'AK',
    'Kings Canyon': 'CA', 'Kobuk Valley': 'AK', 'Lake Clark': 'AK', 'Lassen Volcanic': 'CA',
    'Mammoth Cave': 'KY', 'Mesa Verde': 'CO', 'Mount Rainier': 'WA', 'New River Gorge': 'WV',
    'North Cascades': 'WA', 'Olympic': 'WA', 'Petrified Forest': 'AZ', 'Pinnacles': 'CA',
    'Redwood': 'CA', 'Rocky Mountain': 'CO', 'Saguaro': 'AZ', 'Sequoia': 'CA', 'Shenandoah': 'VA',
    'Theodore Roosevelt': 'ND', 'Virgin Islands': '', 'Voyageurs': 'MN', 'White Sands': 'NM',
    'Wind Cave': 'SD', 'Wrangell-St. Elias': 'AK', 'Yellowstone': 'WY MT ID', 'Yosemite': 'CA', 'Zion': 'UT',
}
assert len(PARKS) == 64
assert sum(1 for v in PARKS.values() if not v) == 2

svg = SRC.read_text(encoding='utf-8')
viewbox = re.search(r'viewBox="([^"]*)"', svg).group(1)
paths = {m.group(1): m.group(2) for m in re.finditer(r'<path[^>]*data-usps="([A-Z]{2})"[^>]*\sd="([^"]*)"', svg)}
assert len(paths) == 50

COUNT = {s: 0 for s in paths}
for st in PARKS.values():
    for s in st.split():
        COUNT[s] += 1
HAVE = {s for s, n in COUNT.items() if n}
assert len(HAVE) == 30, len(HAVE)
NONE = set('AL CT DE GA IA IL KS LA MD MA MS NE NH NJ NY OK PA RI VT WI'.split())
assert set(paths) - HAVE == NONE
assert (COUNT['CA'], COUNT['AK'], COUNT['UT'], COUNT['CO'], COUNT['AZ']) == (9, 8, 5, 4, 4)
puzzle = (ROOT / 'js' / 'puzzle.js').read_text(encoding='utf-8')
grid = set(re.search(r"natl_parks_3:\s*'([^']*)'", puzzle).group(1).split())
assert grid == {s for s, n in COUNT.items() if n >= 3}, (grid, {s for s, n in COUNT.items() if n >= 3})

# 0 grey; 1, 2, 3 to 4, 5 and more in four greens.
BINS = [(0, '#E2E8F0', '#475569'), (1, '#A7F3D0', '#064E3B'), (2, '#34D399', '#064E3B'),
        (3, '#059669', '#FFFFFF'), (5, '#064E3B', '#FFFFFF')]


def shade(n):
    return [b for b in BINS if n >= b[0]][-1]


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


def area(ring):
    return abs(sum(xa * yb - xb * ya for (xa, ya), (xb, yb) in zip(ring, ring[1:] + ring[:1]))) / 2


def centroid(d):
    ring = max(rings(d), key=area)
    a = cx = cy = 0.0
    for (xa, ya), (xb, yb) in zip(ring, ring[1:] + ring[:1]):
        f = xa * yb - xb * ya
        a += f; cx += (xa + xb) * f; cy += (ya + yb) * f
    a *= 0.5
    return cx / (6 * a), cy / (6 * a)


# Labels that the centroid would put badly (pixels).
NUDGE = {'MI': (8, 14), 'FL': (14, 4), 'HI': (14, 6), 'AK': (0, 0), 'ID': (0, 18), 'KY': (6, 2), 'WV': (-2, 2), 'VA': (8, 2)}

out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" role="img" aria-labelledby="t">',
       '<title id="t">Map of the 50 US states shaded by number of national parks: California 9, Alaska 8, Utah 5, Colorado and Arizona 4, Washington and Florida 3; 20 states have none</title>',
       '<g stroke="#FFFFFF" stroke-width="1">']
for s in sorted(paths):
    out.append(f'<path d="{rd(paths[s])}" fill="{shade(COUNT[s])[1]}"/>')
out.append('</g><g font-family="Inter,Arial,sans-serif" font-size="13" font-weight="800" text-anchor="middle">')
for s in sorted(HAVE):
    cx, cy = centroid(paths[s])
    dx, dy = NUDGE.get(s, (0, 0))
    out.append(f'<text x="{cx + dx:.0f}" y="{cy + dy + 5:.0f}" fill="{shade(COUNT[s])[2]}">{COUNT[s]}</text>')
out.append('</g></svg>')
OUT.write_text('\n'.join(out) + '\n', encoding='utf-8')
print(f'{OUT.relative_to(ROOT)}: 64 parks, {len(HAVE)} states with one or more, {OUT.stat().st_size:,} bytes')
