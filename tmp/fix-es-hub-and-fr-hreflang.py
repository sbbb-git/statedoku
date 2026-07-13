#!/usr/bin/env python3
"""
Two GSC-driven fixes:

  1. Inject a grid of 50 "capital de <state>" links into
     /es/learn/capitales-de-estados/ (currently 0 outgoing links to those
     pages, kills their PageRank flow). Each ES capital-de-<slug> page
     ranks pos 9-13 — a strong internal signal from the topical hub
     should push several into top 5.

  2. Rewrite hreflang on every FR page to include EN + ES alternates.
     Currently FR pages only self-reference French variants and
     x-default points to /learn/ (english hub). Google can't identify
     them as multilingual, which likely explains why FR only has 1
     tracked query in GSC.

Idempotent via markers.
"""
import os
import re
import sys
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATES_JSON = os.path.join(ROOT, 'data', 'states.json')

# ── ES state name mapping ───────────────────────────────────────────────
# Load state ES names + slugs from data/states.json
with open(STATES_JSON, 'r') as f:
    _states = json.load(f)

# Slug variations used in URLs
SLUG_ES = {
    'AL': 'alabama', 'AK': 'alaska', 'AZ': 'arizona', 'AR': 'arkansas',
    'CA': 'california', 'CO': 'colorado', 'CT': 'connecticut', 'DE': 'delaware',
    'FL': 'florida', 'GA': 'georgia', 'HI': 'hawaii', 'ID': 'idaho',
    'IL': 'illinois', 'IN': 'indiana', 'IA': 'iowa', 'KS': 'kansas',
    'KY': 'kentucky', 'LA': 'louisiana', 'ME': 'maine', 'MD': 'maryland',
    'MA': 'massachusetts', 'MI': 'michigan', 'MN': 'minnesota', 'MS': 'mississippi',
    'MO': 'missouri', 'MT': 'montana', 'NE': 'nebraska', 'NV': 'nevada',
    'NH': 'new-hampshire', 'NJ': 'new-jersey', 'NM': 'new-mexico', 'NY': 'new-york',
    'NC': 'north-carolina', 'ND': 'north-dakota', 'OH': 'ohio', 'OK': 'oklahoma',
    'OR': 'oregon', 'PA': 'pennsylvania', 'RI': 'rhode-island', 'SC': 'south-carolina',
    'SD': 'dakota-del-sur', 'TN': 'tennessee', 'TX': 'texas', 'UT': 'utah',
    'VT': 'vermont', 'VA': 'virginia', 'WA': 'washington', 'WV': 'west-virginia',
    'WI': 'wisconsin', 'WY': 'wyoming',
}
NAME_ES = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawái', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Luisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Míchigan', 'MN': 'Minnesota', 'MS': 'Misisipi',
    'MO': 'Misuri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'Nuevo Hampshire', 'NJ': 'Nueva Jersey', 'NM': 'Nuevo México', 'NY': 'Nueva York',
    'NC': 'Carolina del Norte', 'ND': 'Dakota del Norte', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregón', 'PA': 'Pensilvania', 'RI': 'Rhode Island', 'SC': 'Carolina del Sur',
    'SD': 'Dakota del Sur', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'Virginia Occidental',
    'WI': 'Wisconsin', 'WY': 'Wyoming',
}


# ═══════════════════════════════════════════════════════════════════════
# FIX 1: inject 50-state capital grid into hub
# ═══════════════════════════════════════════════════════════════════════

HUB_PATH = os.path.join(ROOT, 'es', 'learn', 'capitales-de-estados', 'index.html')
HUB_MARKER = '<!-- capital-links-grid -->'


def build_hub_grid():
    """HTML block: 50 links to /es/learn/capital-de-<slug>/ pages."""
    # Only include those where the page actually exists locally.
    items = []
    for code in ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']:
        # Try both slug spellings (dakota-del-sur vs south-dakota)
        candidates = [SLUG_ES[code]]
        # Some pages exist under the English slug too
        if code == 'SD': candidates.append('south-dakota')
        found = None
        for slug in candidates:
            p = os.path.join(ROOT, 'es', 'learn', 'capital-de-' + slug)
            if os.path.isdir(p):
                found = slug
                break
        if found:
            items.append((NAME_ES[code], found))

    if not items:
        return None

    cards = '\n'.join(
        f'    <a href="/es/learn/capital-de-{slug}/">→ Capital de {name}</a>'
        for name, slug in items
    )
    return (
        f'\n  {HUB_MARKER}\n'
        '  <section style="margin:34px 0;">\n'
        '    <h2 style="font-size:1.35rem;margin-bottom:14px;">Explora la capital de cada estado</h2>\n'
        '    <p style="color:#475569;margin-bottom:14px;font-size:.95rem">Página dedicada por estado con la capital, población, historia y datos de trivia. Ideal para crucigramas y estudio.</p>\n'
        f'    <div class="related-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;">\n{cards}\n    </div>\n'
        '  </section>\n'
    )


def inject_hub_grid():
    if not os.path.isfile(HUB_PATH):
        return 'hub-missing'
    with open(HUB_PATH, 'r', encoding='utf-8') as f:
        html = f.read()
    if HUB_MARKER in html:
        return 'skip-marked'
    grid = build_hub_grid()
    if not grid:
        return 'no-items'
    # Inject before </main>
    m = re.search(r'</main>', html, re.IGNORECASE)
    if not m:
        return 'no-main-close'
    new_html = html[:m.start()] + grid + html[m.start():]
    with open(HUB_PATH, 'w', encoding='utf-8') as f:
        f.write(new_html)
    return 'edited'


# ═══════════════════════════════════════════════════════════════════════
# FIX 2: FR hreflang — add en + es alternates
# ═══════════════════════════════════════════════════════════════════════

# Map: FR slug -> (EN slug, ES slug). Handle mismatched slugs.
FR_TO_EN = {
    'capitales-des-etats': 'state-capitals',
    'regions-des-etats-unis': 'us-regions',
    'drapeaux-des-etats': 'state-flags',
    'college-electoral': 'electoral-college',
    'fuseaux-horaires-etats-unis': 'states-by-time-zone',
    'surnoms-des-etats': 'state-nicknames',
    'systeme-federal-americain': None,  # unclear EN mapping — skip
    'peres-fondateurs': None,
    'fleuves-des-etats-unis': None,
    'montagnes-des-etats-unis': None,
    'presidents-par-etat': 'states-presidents-born',
    'parcs-nationaux-americains': 'national-parks-by-state',
    'etats-par-pib': 'states-by-gdp-ranking',
    'fleuves-par-etat-americain': 'longest-rivers-in-each-state',
    'montagne-plus-haute-par-etat': 'highest-mountain-in-each-state',
    'etats-les-plus-surs': 'safest-states-to-live',
    'etats-plus-d-immigrants': 'states-with-most-immigrants',
    'etats-catastrophes-naturelles': 'states-most-natural-disasters',
    'etats-moins-chers-vivre': 'states-by-cost-of-living',
    'etats-niveau-etudes': 'states-by-college-attainment',
    '13-colonies': '13-colonies',
    'landlocked-states': 'landlocked-states',
    'state-abbreviations': 'state-abbreviations',
    'states-and-capitals': 'states-and-capitals',
    'states-bordering-canada': 'states-bordering-canada',
    'states-bordering-mexico': 'states-bordering-mexico',
    'largest-states': 'largest-states',
    'no-income-tax': 'no-income-tax',
}
FR_TO_ES = {
    'capitales-des-etats': 'capitales-de-estados',
    'regions-des-etats-unis': 'regiones-de-eeuu',
    'drapeaux-des-etats': 'banderas-de-estados',
    'college-electoral': 'colegio-electoral',
    'fuseaux-horaires-etats-unis': 'zonas-horarias-eeuu',
    'surnoms-des-etats': 'apodos-de-estados',
    'systeme-federal-americain': 'sistema-federal-eeuu',
    'peres-fondateurs': 'padres-fundadores',
    'fleuves-des-etats-unis': 'rios-mas-largos-eeuu',
    'montagnes-des-etats-unis': 'montanas-mas-altas-eeuu',
    'presidents-par-etat': 'presidentes-por-estado',
    'parcs-nationaux-americains': 'parques-nacionales-eeuu',
    'etats-par-pib': 'estados-por-pib',
    'fleuves-par-etat-americain': 'rios-mas-importantes-por-estado',
    'montagne-plus-haute-par-etat': 'montana-mas-alta-por-estado',
    'etats-les-plus-surs': 'estados-mas-seguros',
    'etats-plus-d-immigrants': 'estados-con-mas-inmigrantes',
    'etats-catastrophes-naturelles': 'estados-con-mas-desastres-naturales',
    'etats-moins-chers-vivre': 'estados-mas-baratos-vivir',
    'etats-niveau-etudes': 'estados-mas-educados',
}

# Match the hreflang block. Look for the LAST hreflang link (usually x-default) as anchor.
HREFLANG_BLOCK_RE = re.compile(
    r'((?:\s*<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="[^"]+"\s*/?>\s*)+)',
    re.IGNORECASE,
)


def fix_fr_hreflang(path):
    rel = os.path.relpath(path, ROOT).replace(os.sep, '/')
    if not rel.startswith('fr/learn/'):
        return 'skip-not-fr-learn'
    slug = rel.split('/')[2]

    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Skip if already has en/es hreflang
    if re.search(r'hreflang="en"|hreflang="es"', html):
        return 'skip-already-fixed'

    en_slug = FR_TO_EN.get(slug)
    es_slug = FR_TO_ES.get(slug)

    # Build the new hreflang block
    fr_url = f'https://statedoku.com/fr/learn/{slug}/'
    en_url = f'https://statedoku.com/learn/{en_slug}/' if en_slug else None
    es_url = f'https://statedoku.com/es/learn/{es_slug}/' if es_slug else None

    # Verify the alternates actually exist on disk (avoid pointing to 404s)
    if en_url and not os.path.isdir(os.path.join(ROOT, 'learn', en_slug)):
        en_url = None
    if es_url and not os.path.isdir(os.path.join(ROOT, 'es', 'learn', es_slug)):
        es_url = None

    if not en_url and not es_url:
        return 'skip-no-alternates'

    new_alternates = []
    if en_url:
        new_alternates.append(f'  <link rel="alternate" hreflang="en" href="{en_url}">')
        new_alternates.append(f'  <link rel="alternate" hreflang="en-US" href="{en_url}">')
    if es_url:
        new_alternates.append(f'  <link rel="alternate" hreflang="es" href="{es_url}">')
        new_alternates.append(f'  <link rel="alternate" hreflang="es-ES" href="{es_url}">')
        new_alternates.append(f'  <link rel="alternate" hreflang="es-MX" href="{es_url}">')

    # Also fix x-default: it should point to the EN equivalent if it exists,
    # otherwise to the FR page itself.
    x_default = en_url or fr_url

    # Find + replace x-default
    xd_re = re.compile(r'<link\s+rel="alternate"\s+hreflang="x-default"\s+href="[^"]+"\s*/?>', re.IGNORECASE)
    new_xd = f'<link rel="alternate" hreflang="x-default" href="{x_default}">'
    m_xd = xd_re.search(html)
    if m_xd:
        html = html[:m_xd.start()] + new_xd + html[m_xd.end():]

    # Insert new_alternates block before the (now-updated) x-default link, or
    # after the last hreflang="fr-CH" if present.
    insertion_point = None
    for anchor_re in [
        re.compile(r'<link\s+rel="alternate"\s+hreflang="fr-CH"\s+href="[^"]+"\s*/?>', re.IGNORECASE),
        re.compile(r'<link\s+rel="alternate"\s+hreflang="fr-BE"\s+href="[^"]+"\s*/?>', re.IGNORECASE),
        re.compile(r'<link\s+rel="alternate"\s+hreflang="fr-CA"\s+href="[^"]+"\s*/?>', re.IGNORECASE),
        re.compile(r'<link\s+rel="alternate"\s+hreflang="fr-FR"\s+href="[^"]+"\s*/?>', re.IGNORECASE),
        re.compile(r'<link\s+rel="alternate"\s+hreflang="fr"\s+href="[^"]+"\s*/?>', re.IGNORECASE),
    ]:
        m = anchor_re.search(html)
        if m:
            insertion_point = m.end()
            break

    if insertion_point is None:
        return 'no-anchor'

    payload = '\n' + '\n'.join(new_alternates)
    new_html = html[:insertion_point] + payload + html[insertion_point:]

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    return 'edited'


# ═══════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════

from collections import Counter

print('═══ FIX 1: ES hub cross-link ═══')
r = inject_hub_grid()
print(f'   /es/learn/capitales-de-estados/ → {r}')

print('\n═══ FIX 2: FR hreflang ═══')
c = Counter()
touched = []
for dirpath, dirs, files in os.walk(os.path.join(ROOT, 'fr', 'learn')):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git')]
    for fn in files:
        if fn != 'index.html':
            continue
        full = os.path.join(dirpath, fn)
        try:
            r = fix_fr_hreflang(full)
        except Exception as e:
            r = 'error'
            print(f'   !! {os.path.relpath(full, ROOT)}: {e}', file=sys.stderr)
        c[r] += 1
        if r == 'edited':
            touched.append(os.path.relpath(full, ROOT))

for k, v in c.most_common():
    print(f'   {k}={v}')
print(f'\n   Total FR pages fixed: {len(touched)}')
if touched[:3]:
    print(f'   Samples: {touched[:3]}')
