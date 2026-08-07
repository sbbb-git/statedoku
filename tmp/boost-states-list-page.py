#!/usr/bin/env python3
"""
Consolidate the "list of states" query cluster onto /learn/states-and-capitals/.

Bing keyword data (Aug 7) shows ~6,250 impressions sitting at positions
5.5-9.2 with almost no clicks across a tight cluster:

  u.s. state                    1181 impr  pos 6.6
  list of states                 832       pos 5.5
  states                         819       pos 8.6
  list of all 50 states          705       pos 6.8
  states in usa                  503       pos 7.5
  states and capitals            456       pos 7.7
  state capitals list            327       pos 6.4
  states in alphabetical order   307       pos 8.6
  alphabetical list of states    301       pos 8.4
  50 states                      261       pos 9.0
  list of us states              205       pos 8.5
  list of 50 states              179       pos 8.3
  list of states alphabetically  178       pos 9.2

AI engines already treat this page as canonical for the same intent
(91% citation share on "list of all US state capitals", 97% on "list of
50 US states and capitals", 100% on the FR and alphabetical-order
variants). Google and Bing rank it bottom-of-page-1. The gap is
structure, not authority: the page answers "states and capitals" but
never answers "how many states are there", never presents statehood
order, and exposes no machine-readable list.

Three additions, no rewrite of what already works:
  1. A direct-answer block under the H1 (featured-snippet shape).
  2. ItemList JSON-LD enumerating all 50 states with capital + code.
  3. Two new sections: statehood order table, and a 2-letter code grid.

Idempotent via markers.
"""
import os
import re
import json
from collections import OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, 'learn', 'states-and-capitals', 'index.html')

M_ANSWER = '<!-- states-list-answer -->'
M_ORDER = '<!-- states-statehood-order -->'
M_CODES = '<!-- states-code-grid -->'
M_ITEMLIST = '<!-- states-itemlist-schema -->'

# code -> (name, capital, statehood order, long date)
S = OrderedDict([
 ('DE',('Delaware','Dover',1,'December 7, 1787')),      ('PA',('Pennsylvania','Harrisburg',2,'December 12, 1787')),
 ('NJ',('New Jersey','Trenton',3,'December 18, 1787')), ('GA',('Georgia','Atlanta',4,'January 2, 1788')),
 ('CT',('Connecticut','Hartford',5,'January 9, 1788')), ('MA',('Massachusetts','Boston',6,'February 6, 1788')),
 ('MD',('Maryland','Annapolis',7,'April 28, 1788')),    ('SC',('South Carolina','Columbia',8,'May 23, 1788')),
 ('NH',('New Hampshire','Concord',9,'June 21, 1788')),  ('VA',('Virginia','Richmond',10,'June 25, 1788')),
 ('NY',('New York','Albany',11,'July 26, 1788')),       ('NC',('North Carolina','Raleigh',12,'November 21, 1789')),
 ('RI',('Rhode Island','Providence',13,'May 29, 1790')),('VT',('Vermont','Montpelier',14,'March 4, 1791')),
 ('KY',('Kentucky','Frankfort',15,'June 1, 1792')),     ('TN',('Tennessee','Nashville',16,'June 1, 1796')),
 ('OH',('Ohio','Columbus',17,'March 1, 1803')),         ('LA',('Louisiana','Baton Rouge',18,'April 30, 1812')),
 ('IN',('Indiana','Indianapolis',19,'December 11, 1816')),('MS',('Mississippi','Jackson',20,'December 10, 1817')),
 ('IL',('Illinois','Springfield',21,'December 3, 1818')),('AL',('Alabama','Montgomery',22,'December 14, 1819')),
 ('ME',('Maine','Augusta',23,'March 15, 1820')),        ('MO',('Missouri','Jefferson City',24,'August 10, 1821')),
 ('AR',('Arkansas','Little Rock',25,'June 15, 1836')),  ('MI',('Michigan','Lansing',26,'January 26, 1837')),
 ('FL',('Florida','Tallahassee',27,'March 3, 1845')),   ('TX',('Texas','Austin',28,'December 29, 1845')),
 ('IA',('Iowa','Des Moines',29,'December 28, 1846')),   ('WI',('Wisconsin','Madison',30,'May 29, 1848')),
 ('CA',('California','Sacramento',31,'September 9, 1850')),('MN',('Minnesota','Saint Paul',32,'May 11, 1858')),
 ('OR',('Oregon','Salem',33,'February 14, 1859')),      ('KS',('Kansas','Topeka',34,'January 29, 1861')),
 ('WV',('West Virginia','Charleston',35,'June 20, 1863')),('NV',('Nevada','Carson City',36,'October 31, 1864')),
 ('NE',('Nebraska','Lincoln',37,'March 1, 1867')),      ('CO',('Colorado','Denver',38,'August 1, 1876')),
 ('ND',('North Dakota','Bismarck',39,'November 2, 1889')),('SD',('South Dakota','Pierre',40,'November 2, 1889')),
 ('MT',('Montana','Helena',41,'November 8, 1889')),     ('WA',('Washington','Olympia',42,'November 11, 1889')),
 ('ID',('Idaho','Boise',43,'July 3, 1890')),            ('WY',('Wyoming','Cheyenne',44,'July 10, 1890')),
 ('UT',('Utah','Salt Lake City',45,'January 4, 1896')), ('OK',('Oklahoma','Oklahoma City',46,'November 16, 1907')),
 ('NM',('New Mexico','Santa Fe',47,'January 6, 1912')), ('AZ',('Arizona','Phoenix',48,'February 14, 1912')),
 ('AK',('Alaska','Juneau',49,'January 3, 1959')),       ('HI',('Hawaii','Honolulu',50,'August 21, 1959')),
])

def slug(name):
    return name.lower().replace(' ', '-')

by_alpha = sorted(S.items(), key=lambda kv: kv[1][0])
by_order = sorted(S.items(), key=lambda kv: kv[1][2])


# ── 1. Direct-answer block ───────────────────────────────────────────────
ANSWER = f"""    {M_ANSWER}
    <section class="quick-answer" style="background:#F8FAFC;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:0 10px 10px 0;margin:0 0 22px;">
      <p style="margin:0 0 8px;font-size:1.05rem;"><strong>There are 50 states in the United States.</strong> Each has its own capital city, its own government, and a two-letter postal code. Delaware was the first to ratify the Constitution on December 7, 1787. Hawaii was the last to join, on August 21, 1959.</p>
      <p style="margin:0;font-size:.94rem;color:#475569;">The full alphabetical list is below, followed by the same 50 states ordered by the date they joined the Union, and a grid of all 50 two-letter abbreviations.</p>
    </section>
"""

# ── 2. ItemList schema ───────────────────────────────────────────────────
items = []
for i, (code, (name, cap, order, date)) in enumerate(by_alpha, start=1):
    items.append({
        '@type': 'ListItem', 'position': i, 'name': name,
        'url': f'https://statedoku.com/states/{slug(name)}/',
        'description': f'Capital: {cap}. Postal code: {code}. Joined the Union {date} as state number {order}.',
    })
itemlist = {
    '@context': 'https://schema.org', '@type': 'ItemList',
    'name': 'List of all 50 US states and their capitals',
    'description': 'The 50 United States in alphabetical order, with capital city, two-letter postal abbreviation, and date of statehood.',
    'numberOfItems': 50, 'itemListOrder': 'https://schema.org/ItemListOrderAscending',
    'itemListElement': items,
}
ITEMLIST_TAG = (f'  {M_ITEMLIST}\n  <script type="application/ld+json">'
                + json.dumps(itemlist, ensure_ascii=False, separators=(',', ':'))
                + '</script>\n')

# ── 3. Statehood-order table ─────────────────────────────────────────────
order_rows = '\n'.join(
    f'      <tr><td>{order}</td><td><a href="/states/{slug(name)}/"><strong>{name}</strong></a> ({code})</td>'
    f'<td>{cap}</td><td>{date}</td></tr>'
    for code, (name, cap, order, date) in by_order
)
ORDER_SECTION = f"""
    {M_ORDER}
    <h2 id="statehood-order">The 50 states in order of statehood</h2>
    <p>The same 50 states, ordered by the day they joined the Union rather than alphabetically. The first 13 entries are the original colonies, in the order they ratified the US Constitution. Everything from Vermont onward was admitted by an act of Congress.</p>
    <table class="lt">
      <thead><tr><th>#</th><th>State</th><th>Capital</th><th>Date of statehood</th></tr></thead>
      <tbody>
{order_rows}
      </tbody>
    </table>
    <p>Two pairs joined on the same day. North Dakota and South Dakota were both admitted on November 2, 1889, and President Benjamin Harrison shuffled the signed papers so no one would know which came first. They are listed alphabetically by convention, which is how North Dakota ended up as number 39.</p>
"""

# ── 4. Two-letter code grid ──────────────────────────────────────────────
code_cells = '\n'.join(
    f'      <a href="/states/{slug(name)}/"><strong>{code}</strong> {name}</a>'
    for code, (name, cap, order, date) in by_alpha
)
CODES_SECTION = f"""
    {M_CODES}
    <h2 id="abbreviations">All 50 state abbreviations</h2>
    <p>The two-letter codes below are the official USPS abbreviations, standardised in 1963 so that state names would fit on a punch card alongside the new ZIP code. They are the codes you write on an envelope, and the ones crossword puzzles ask for.</p>
    <div class="related-grid">
{code_cells}
    </div>
"""


def main():
    with open(PAGE, 'r', encoding='utf-8') as f:
        html = f.read()
    changed = []

    # Answer block, right after the hero </section>
    if M_ANSWER not in html:
        m = re.search(r'<article class="lt-main">', html)
        if m:
            html = html[:m.end()] + '\n' + ANSWER + html[m.end():]
            changed.append('answer-block')

    # ItemList schema before </head>
    if M_ITEMLIST not in html:
        m = re.search(r'</head>', html, re.IGNORECASE)
        if m:
            html = html[:m.start()] + ITEMLIST_TAG + html[m.start():]
            changed.append('itemlist-schema')

    # New sections before the "Related guides" H2
    anchor = re.search(r'\n\s*<h2>Related guides</h2>', html)
    if anchor:
        insert = ''
        if M_ORDER not in html:
            insert += ORDER_SECTION
            changed.append('statehood-order-table')
        if M_CODES not in html:
            insert += CODES_SECTION
            changed.append('abbreviation-grid')
        if insert:
            html = html[:anchor.start()] + '\n' + insert + html[anchor.start():]

    if not changed:
        print('   nothing to do (all markers present)')
        return
    with open(PAGE, 'w', encoding='utf-8') as f:
        f.write(html)
    print('   added: ' + ', '.join(changed))


if __name__ == '__main__':
    main()
