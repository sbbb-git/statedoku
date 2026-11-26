#!/usr/bin/env python3
"""Build learn/colorado-river-states/index.html (queue item 6, 26 November 2026).

Which states the Colorado River runs through or along, which two are in its
basin through tributaries only, how the 1922 compact splits the basin, the
dams, the source and the mouth. Head, styles, header and footer come from the
Mississippi page, as for the US flag page. The five river states are asserted
against the daily grid's "On the Colorado River" set in js/puzzle.js, so the
page and the game never disagree. The map is img/maps/colorado-river-states.svg
(scripts/build-colorado-river-map.py).
"""
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'https://statedoku.com/learn/colorado-river-states/'
TITLE = 'Colorado River States: the 7 Basin States and the 5 on the River'
DESC = ('The Colorado River runs through or along 5 states and its basin covers 7. Map, the 1922 compact, '
        'Hoover and Glen Canyon dams, source and mouth.')
assert 70 <= len(DESC) <= 160, len(DESC)

# The daily grid's set for "On the Colorado River": the river itself, not its basin.
puzzle = open(os.path.join(ROOT, 'js', 'puzzle.js'), encoding='utf-8').read()
GAME = set(re.search(r"colorado_river:\s*'([A-Z ]+)'", puzzle).group(1).split())
ON_RIVER = ['CO', 'UT', 'AZ', 'NV', 'CA']
BASIN_ONLY = ['WY', 'NM']
assert set(ON_RIVER) == GAME, (ON_RIVER, GAME)

states = {s['id']: s for s in json.load(open(os.path.join(ROOT, 'data', 'states.json'), encoding='utf-8'))}
def link(code):
    n = states[code]['names']['en']
    return f'<a href="/states/{n.lower().replace(" ", "-")}/">{n}</a>'

# One row per state, upstream to downstream. Division under the 1922 compact.
ROWS = [
    ('CO', 'Yes, it rises here', 'Rocky Mountain National Park, Glenwood Springs, Grand Junction', 'Upper'),
    ('WY', 'No, through the Green River', 'The Green River rises in the Wind River Range', 'Upper'),
    ('UT', 'Yes, runs through', 'Moab, Canyonlands National Park, the upper part of Lake Powell', 'Upper'),
    ('NM', 'No, through the San Juan River', 'The San Juan River flows past Farmington', 'Upper'),
    ('AZ', 'Yes, through, then along its western border', 'Glen Canyon Dam, the Grand Canyon, Hoover Dam, Yuma', 'Lower'),
    ('NV', 'Yes, along its border with Arizona', 'Lake Mead, Hoover Dam, Laughlin', 'Lower'),
    ('CA', 'Yes, along its border with Arizona', 'Needles, Blythe, the All-American Canal', 'Lower'),
]
assert [r[0] for r in ROWS if r[1].startswith('Yes')] == [c for c in ['CO', 'UT', 'AZ', 'NV', 'CA'] if c in ON_RIVER]
assert {r[0] for r in ROWS} == set(ON_RIVER + BASIN_ONLY)
TABLE = '\n'.join(
    f'        <tr><td>{link(c)}</td><td>{html.escape(on)}</td><td>{html.escape(where)}</td><td>{div}</td></tr>'
    for c, on, where, div in ROWS)
names = lambda codes: ', '.join(states[c]['names']['en'] for c in codes[:-1]) + ' and ' + states[codes[-1]]['names']['en']

FAQ = [
    ('How many states does the Colorado River flow through?',
     f'Five states are on the river itself: {names(ON_RIVER)}. Seven are in its basin, with Wyoming and New Mexico, '
     'which drain into it through the Green River and the San Juan River.'),
    ('What are the seven Colorado River basin states?',
     'Colorado, Utah, Wyoming and New Mexico, the Upper Division states of the 1922 Colorado River Compact, and '
     'Arizona, Nevada and California, the Lower Division states.'),
    ('Where does the Colorado River start and end?',
     'It rises in Rocky Mountain National Park in northern Colorado and flows about 1,450 miles southwest to Mexico. '
     'Its mouth is on the Gulf of California, but in most years since the 1960s its water is used up before it gets there.'),
    ('What is the Colorado River Compact?',
     'An agreement signed by the seven basin states on November 24, 1922. It splits the basin at Lee Ferry, Arizona, '
     'and gives the Upper Basin and the Lower Basin 7.5 million acre-feet of water a year each.'),
]
faq_ld = json.dumps({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
    {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in FAQ]}, ensure_ascii=False)
crumb_ld = json.dumps({'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
    {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://statedoku.com/'},
    {'@type': 'ListItem', 'position': 2, 'name': 'Learn', 'item': 'https://statedoku.com/learn/'},
    {'@type': 'ListItem', 'position': 3, 'name': 'Colorado River States', 'item': URL}]}, ensure_ascii=False)
faq_html = '\n'.join(f'    <details><summary><strong>{html.escape(q)}</strong></summary><p>{html.escape(a)}</p></details>' for q, a in FAQ)

tmpl = open(os.path.join(ROOT, 'learn', 'mississippi-river-states', 'index.html'), encoding='utf-8').read()
head_top = tmpl[:tmpl.index('  <title>')]
style = tmpl[tmpl.index('  <style>'):tmpl.index('  </style>') + len('  </style>\n')]
header = tmpl[tmpl.index('<body'):tmpl.index('<main>')]
footer = tmpl[tmpl.index('</main><footer>'):]
SW = 'display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-1px;margin-right:6px;background:'

page = f'''{head_top}  <title>{TITLE} | Statedoku</title>
  <meta name="description" content="{DESC}">
  <meta name="keywords" content="colorado river, colorado river states, colorado river basin states, colorado river compact, states the colorado river flows through">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="{URL}">
  <link rel="alternate" hreflang="en" href="{URL}">
  <link rel="alternate" hreflang="x-default" href="{URL}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=37">
  <meta property="og:type" content="article">
  <meta property="og:title" content="Colorado River States">
  <meta property="og:description" content="{DESC}">
  <meta property="og:url" content="{URL}">
  <meta property="og:image" content="https://statedoku.com/og-image.png?v=2">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Colorado River States">
  <meta name="twitter:description" content="{DESC}">
  <meta name="twitter:image" content="https://statedoku.com/og-image.png?v=2">

{style}  <script type="application/ld+json">{crumb_ld}</script>
  <script type="application/ld+json">{faq_ld}</script>
</head>
{header}<main>
  <section class="hp-hero">
    <p class="crumb"><a href="/">Home</a> · <a href="/learn/">Learn</a> · Colorado River States</p>
    <h1>Which states does the Colorado River flow through?</h1>
    <p class="meta">Five states on the river, seven in its basin, one compact that shares its water.</p>
  </section>
  <div class="hp-main">
    <p><strong>The Colorado River runs through or along five states: {names(ON_RIVER)}.</strong> Two more, Wyoming and New Mexico, are in its basin through tributaries, the Green River and the San Juan River, which makes seven Colorado River basin states. The river rises in Rocky Mountain National Park in Colorado and flows about 1,450 miles (2,334 km) southwest to Mexico.</p>

    <figure style="margin:18px 0 8px;">
      <img src="/img/maps/colorado-river-states.svg" width="401" height="340" alt="Map of the Colorado River and its seven basin states: Colorado, Utah, Arizona, Nevada and California in navy, on the river itself; Wyoming and New Mexico in gold, in the basin through tributaries. The river runs from northern Colorado through Utah and Arizona, then along the Arizona line with Nevada and California, into Mexico." loading="lazy" style="display:block;width:100%;max-width:420px;height:auto;margin:0 auto;border-radius:10px;">
      <figcaption style="max-width:420px;margin:10px auto 0;font-size:.9rem;color:#475569;">
        <span style="display:flex;flex-wrap:wrap;gap:4px 14px;margin-bottom:6px;"><span style="white-space:nowrap;"><span style="{SW}#0F2147"></span>On the river itself</span><span style="white-space:nowrap;"><span style="{SW}#F59E0B"></span>In the basin through a tributary</span><span style="white-space:nowrap;"><span style="{SW}#3B82F6;height:4px;vertical-align:3px"></span>The Colorado River</span></span>
        Below Hoover Dam the river is the state line between Arizona and Nevada, then between Arizona and California.
      </figcaption>
    </figure>

    <h2>The seven states, from source to Mexico</h2>
    <div class="ad-slot" data-ad-slot="PLACEHOLDER_LEARN_MID" data-ad-format="auto"></div>
    <div style="overflow-x:auto;">
    <table class="tbl">
      <thead><tr><th>State</th><th>On the river?</th><th>Where</th><th>1922 compact</th></tr></thead>
      <tbody>
{TABLE}
      </tbody>
    </table>
    </div>
    <p class="after-table-cta">"On the Colorado River" is a clue of the <a href="/">daily Statedoku grid</a>: it counts the five states on the river itself, not the two that only share its basin.</p>

    <h2>How the water is shared: the 1922 compact</h2>
    <p>On November 24, 1922, the seven states signed the Colorado River Compact in Santa Fe, New Mexico. It splits the basin at Lee Ferry, in northern Arizona, into an Upper Basin and a Lower Basin, and gives each the use of 7.5 million acre-feet of water a year. Colorado, Utah, Wyoming and New Mexico are the Upper Division states; Arizona, Nevada and California the Lower Division states. Some land of Arizona drains to the Upper Basin, and some of New Mexico and Utah to the Lower Basin, but each state belongs to one division.</p>
    <p>A treaty signed with Mexico in 1944 promises Mexico 1.5 million acre-feet a year. The shares were set after an unusually wet run of years, and the river has carried less water on average since, which is why the states keep negotiating how to share shortages.</p>

    <h2>The dams and the two great reservoirs</h2>
    <ul>
      <li><strong>Glen Canyon Dam</strong>, near Page, Arizona, completed in 1966, holds back <strong>Lake Powell</strong>, which reaches far up into Utah.</li>
      <li><strong>Hoover Dam</strong>, in Black Canyon on the Arizona and Nevada line, completed in 1936, holds back <strong>Lake Mead</strong>, the largest reservoir in the United States when full.</li>
      <li>Downstream, Davis Dam forms Lake Mohave, Parker Dam forms Lake Havasu, and Imperial Dam sends water into the All-American Canal toward California's Imperial Valley.</li>
    </ul>
    <p>The river supplies water to about 40 million people, from Denver and Salt Lake City to Las Vegas, Phoenix, Tucson, Los Angeles and San Diego, and to farms on both sides of the border.</p>

    <h2>From the Rockies to the Gulf of California</h2>
    <p>The Colorado begins as a stream in the Never Summer Mountains, in Rocky Mountain National Park. It crosses western Colorado and eastern Utah, where the Green River joins it in Canyonlands National Park, enters Arizona at Lake Powell and cuts the Grand Canyon. Below the canyon it turns south as the state line, first between Arizona and Nevada, then between Arizona and California, and briefly between Arizona and Mexico near Yuma.</p>
    <p>Its mouth is on the Gulf of California, in Mexico. In most years since the 1960s, so much of its water is used along the way that the river dries up before it reaches the sea. A planned release in 2014, the pulse flow, let it reach the Gulf again for a short time.</p>

    <h2>Its main tributaries</h2>
    <ul>
      <li><strong>Green River</strong>, its largest tributary, rises in Wyoming and joins the Colorado in Utah.</li>
      <li><strong>Gunnison River</strong> joins at Grand Junction, Colorado.</li>
      <li><strong>San Juan River</strong> flows from Colorado through New Mexico and joins in Lake Powell, in Utah.</li>
      <li><strong>Little Colorado River</strong> joins in the Grand Canyon, in Arizona.</li>
      <li><strong>Gila River</strong> flows from New Mexico across Arizona and joins at Yuma.</li>
    </ul>

    <section class="cta-card">
      <h3>Play it on the daily grid</h3>
      <p>"On the Colorado River" is one of the clues of the daily Statedoku puzzle.</p>
      <a href="/">Today's puzzle</a>
    </section>

    <h2>Frequently asked questions</h2>
{faq_html}

    <h2>Related guides</h2>
    <div class="related-grid">
      <a href="/learn/mississippi-river-states/">The 10 Mississippi River states</a>
      <a href="/learn/longest-rivers-in-each-state/">Longest river in each state</a>
      <a href="/learn/national-parks-by-state/">National parks by state</a>
      <a href="/learn/states-bordering-mexico/">States bordering Mexico</a>
      <a href="/states/">All 50 state pages</a>
      <a href="/learn/">Learn hub</a>
    </div>
  </div>
    <div class="ad-slot ad-slot-inline" data-ad-slot="PLACEHOLDER_LEARN_BOTTOM" data-ad-format="auto"></div>

{footer}'''
page = re.sub(r'\n  <p class="page-updated">.*?</p>\n', '\n', page, flags=re.S)
if re.search('[‐-―−]', re.sub(r'<!--.*?-->', '', page, flags=re.S)):
    raise SystemExit('unicode dash in the page')
out = os.path.join(ROOT, 'learn', 'colorado-river-states', 'index.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(page)
print(f'wrote {os.path.relpath(out, ROOT)}: {len(ROWS)} rows, {len(FAQ)} questions, {len(page):,} bytes')
