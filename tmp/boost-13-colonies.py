#!/usr/bin/env python3
"""
Boost /learn/13-colonies/ for the query cluster it already half-owns.

Bing:  "13 original colonies" 740 impr pos 8.8 · "original 13 colonies" 209 pos 8.8
AI:    "first 13 states" 147 cites 48.7% share
       "13 original states in order" 34 cites 81.0%
       "original 13 states of america" 24 cites 44.4%
       "13 colonies list and history" 12 cites
       "number of original colonies" 15 cites
       "which state was not one of the original 13 colonies?" 9 cites

The page is 687 words with a decent order table but no ItemList schema, no
direct answer to "how many", and nothing serving the very common negative
query "which state was NOT one of the 13". Adding those three.

Idempotent via markers.
"""
import os
import re
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, 'learn', '13-colonies', 'index.html')

M_ANSWER = '<!-- colonies-answer -->'
M_NOT = '<!-- colonies-not-included -->'
M_SCHEMA = '<!-- colonies-itemlist -->'

# (name, slug, ratification order, date)
COLONIES = [
    ('Delaware', 'delaware', 1, 'December 7, 1787'),
    ('Pennsylvania', 'pennsylvania', 2, 'December 12, 1787'),
    ('New Jersey', 'new-jersey', 3, 'December 18, 1787'),
    ('Georgia', 'georgia', 4, 'January 2, 1788'),
    ('Connecticut', 'connecticut', 5, 'January 9, 1788'),
    ('Massachusetts', 'massachusetts', 6, 'February 6, 1788'),
    ('Maryland', 'maryland', 7, 'April 28, 1788'),
    ('South Carolina', 'south-carolina', 8, 'May 23, 1788'),
    ('New Hampshire', 'new-hampshire', 9, 'June 21, 1788'),
    ('Virginia', 'virginia', 10, 'June 25, 1788'),
    ('New York', 'new-york', 11, 'July 26, 1788'),
    ('North Carolina', 'north-carolina', 12, 'November 21, 1789'),
    ('Rhode Island', 'rhode-island', 13, 'May 29, 1790'),
]

ANSWER = f"""    {M_ANSWER}
    <section class="quick-answer" style="background:#F8FAFC;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:0 10px 10px 0;margin:0 0 22px;">
      <p style="margin:0 0 8px;font-size:1.05rem;"><strong>There were 13 original colonies, and they became the first 13 states.</strong> In order of ratifying the US Constitution: Delaware, Pennsylvania, New Jersey, Georgia, Connecticut, Massachusetts, Maryland, South Carolina, New Hampshire, Virginia, New York, North Carolina, Rhode Island.</p>
      <p style="margin:0;font-size:.94rem;color:#475569;">Delaware ratified first on December 7, 1787, which is why it is nicknamed the First State. Rhode Island held out until May 29, 1790, more than a year after George Washington took office.</p>
    </section>
"""

# Common wrong guesses, with the actual reason each one is not on the list.
NOT_INCLUDED = [
    ('Vermont', 'Governed itself as the independent Vermont Republic from 1777 and joined as the 14th state in 1791.'),
    ('Maine', 'Was part of Massachusetts until the Missouri Compromise made it a separate state in 1820.'),
    ('Kentucky', 'Was Virginia\'s western county until it became the 15th state in 1792.'),
    ('Tennessee', 'Was the Southwest Territory, admitted in 1796.'),
    ('West Virginia', 'Did not exist until it split from Virginia during the Civil War in 1863.'),
    ('Florida', 'Was Spanish territory throughout the colonial period and only became a state in 1845.'),
    ('Ohio', 'Was part of the Northwest Territory, admitted in 1803.'),
]

not_rows = '\n'.join(
    f'      <tr><td><strong>{n}</strong></td><td>{why}</td></tr>' for n, why in NOT_INCLUDED
)

NOT_SECTION = f"""
    {M_NOT}
    <h2 id="not-included">Which states were not among the 13 colonies?</h2>
    <p>Every state except the 13 above joined later, but a handful get guessed wrong often enough to be worth naming. Vermont and Maine trip people up most, because both sit in New England and feel like they should have been there from the start.</p>
    <table class="lt">
      <thead><tr><th>Commonly guessed</th><th>Why it is not on the list</th></tr></thead>
      <tbody>
{not_rows}
      </tbody>
    </table>
    <p>The simplest test: if a state touches the Atlantic between Maine and Georgia, it is probably one of the 13. The two exceptions to that shortcut are Vermont, which is landlocked and joined in 1791, and Maine, which was still Massachusetts territory at the time.</p>
"""

items = [{
    '@type': 'ListItem', 'position': order, 'name': name,
    'url': f'https://statedoku.com/states/{slug}/',
    'description': f'Ratified the US Constitution on {date}, the number {order} of the original 13.',
} for name, slug, order, date in COLONIES]

schema = {
    '@context': 'https://schema.org', '@type': 'ItemList',
    'name': 'The 13 original colonies in order of ratification',
    'description': 'The thirteen British colonies that became the first thirteen United States, ordered by the date each ratified the US Constitution.',
    'numberOfItems': 13,
    'itemListOrder': 'https://schema.org/ItemListOrderAscending',
    'itemListElement': items,
}
SCHEMA_TAG = (f'  {M_SCHEMA}\n  <script type="application/ld+json">'
              + json.dumps(schema, ensure_ascii=False, separators=(',', ':'))
              + '</script>\n')


def main():
    with open(PAGE, 'r', encoding='utf-8') as f:
        html = f.read()
    changed = []

    if M_ANSWER not in html:
        m = re.search(r'<article class="lt-main">', html)
        if not m:
            m = re.search(r'</h1>\s*</section>', html)
            pos = m.end() if m else None
        else:
            pos = m.end()
        if pos:
            html = html[:pos] + '\n' + ANSWER + html[pos:]
            changed.append('answer-block')

    if M_SCHEMA not in html:
        m = re.search(r'</head>', html, re.IGNORECASE)
        if m:
            html = html[:m.start()] + SCHEMA_TAG + html[m.start():]
            changed.append('itemlist-schema')

    if M_NOT not in html:
        anchor = re.search(r'\n\s*<h2>Related guides</h2>', html)
        if not anchor:
            anchor = re.search(r'\n\s*<h2>How to remember all 13</h2>', html)
        if anchor:
            html = html[:anchor.start()] + '\n' + NOT_SECTION + html[anchor.start():]
            changed.append('not-included-section')

    if not changed:
        print('   nothing to do')
        return
    with open(PAGE, 'w', encoding='utf-8') as f:
        f.write(html)
    print('   added: ' + ', '.join(changed))


if __name__ == '__main__':
    main()
