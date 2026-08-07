#!/usr/bin/env python3
"""
Add a direct-answer statehood block to all 50 /es/states/<state>/ pages.

Why: "estadidad de wyoming" is the site's single biggest query — 44,449
Bing impressions at position 3.6 with 0.04% CTR, and 1,631 AI citations
(20.9% citation share, the #1 AI grounding query). The page ranks but the
title and the body never answer "when did Wyoming become a state", so
nobody clicks and AI engines have to synthesise the answer themselves.

Fix, applied to all 50 Spanish state pages:
  1. A short answer block right under the H1 giving the exact admission
     date, statehood order number, and prior territorial status. This is
     the format Google lifts for featured snippets and AI answer boxes.
  2. An FAQ entry "¿Cuándo alcanzó X la estadidad?" appended to the
     existing FAQPage JSON-LD.
  3. Title + meta description rewritten for Wyoming only, where the query
     data proves statehood is the dominant intent. The other 49 keep their
     titles — no evidence yet that statehood outranks their current intent,
     and rewriting blind would risk the queries they already serve.

Admission dates are public-domain fact (US National Archives / state
constitutions). Idempotent via marker.
"""
import os
import re
import json
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKER = '<!-- statehood-answer -->'

# (order, ISO date, Spanish long date, prior status in Spanish)
STATEHOOD = {
    'DE': (1,  '1787-12-07', '7 de diciembre de 1787',  'una de las Trece Colonias'),
    'PA': (2,  '1787-12-12', '12 de diciembre de 1787', 'una de las Trece Colonias'),
    'NJ': (3,  '1787-12-18', '18 de diciembre de 1787', 'una de las Trece Colonias'),
    'GA': (4,  '1788-01-02', '2 de enero de 1788',      'una de las Trece Colonias'),
    'CT': (5,  '1788-01-09', '9 de enero de 1788',      'una de las Trece Colonias'),
    'MA': (6,  '1788-02-06', '6 de febrero de 1788',    'una de las Trece Colonias'),
    'MD': (7,  '1788-04-28', '28 de abril de 1788',     'una de las Trece Colonias'),
    'SC': (8,  '1788-05-23', '23 de mayo de 1788',      'una de las Trece Colonias'),
    'NH': (9,  '1788-06-21', '21 de junio de 1788',     'una de las Trece Colonias'),
    'VA': (10, '1788-06-25', '25 de junio de 1788',     'una de las Trece Colonias'),
    'NY': (11, '1788-07-26', '26 de julio de 1788',     'una de las Trece Colonias'),
    'NC': (12, '1789-11-21', '21 de noviembre de 1789', 'una de las Trece Colonias'),
    'RI': (13, '1790-05-29', '29 de mayo de 1790',      'una de las Trece Colonias'),
    'VT': (14, '1791-03-04', '4 de marzo de 1791',      'la República de Vermont'),
    'KY': (15, '1792-06-01', '1 de junio de 1792',      'parte de Virginia'),
    'TN': (16, '1796-06-01', '1 de junio de 1796',      'el Territorio del Suroeste'),
    'OH': (17, '1803-03-01', '1 de marzo de 1803',      'parte del Territorio del Noroeste'),
    'LA': (18, '1812-04-30', '30 de abril de 1812',     'el Territorio de Orleans'),
    'IN': (19, '1816-12-11', '11 de diciembre de 1816', 'el Territorio de Indiana'),
    'MS': (20, '1817-12-10', '10 de diciembre de 1817', 'el Territorio de Misisipi'),
    'IL': (21, '1818-12-03', '3 de diciembre de 1818',  'el Territorio de Illinois'),
    'AL': (22, '1819-12-14', '14 de diciembre de 1819', 'el Territorio de Alabama'),
    'ME': (23, '1820-03-15', '15 de marzo de 1820',     'parte de Massachusetts'),
    'MO': (24, '1821-08-10', '10 de agosto de 1821',    'el Territorio de Misuri'),
    'AR': (25, '1836-06-15', '15 de junio de 1836',     'el Territorio de Arkansas'),
    'MI': (26, '1837-01-26', '26 de enero de 1837',     'el Territorio de Míchigan'),
    'FL': (27, '1845-03-03', '3 de marzo de 1845',      'el Territorio de Florida'),
    'TX': (28, '1845-12-29', '29 de diciembre de 1845', 'la República de Texas'),
    'IA': (29, '1846-12-28', '28 de diciembre de 1846', 'el Territorio de Iowa'),
    'WI': (30, '1848-05-29', '29 de mayo de 1848',      'el Territorio de Wisconsin'),
    'CA': (31, '1850-09-09', '9 de septiembre de 1850', 'territorio cedido por México'),
    'MN': (32, '1858-05-11', '11 de mayo de 1858',      'el Territorio de Minnesota'),
    'OR': (33, '1859-02-14', '14 de febrero de 1859',   'el Territorio de Oregón'),
    'KS': (34, '1861-01-29', '29 de enero de 1861',     'el Territorio de Kansas'),
    'WV': (35, '1863-06-20', '20 de junio de 1863',     'parte de Virginia'),
    'NV': (36, '1864-10-31', '31 de octubre de 1864',   'el Territorio de Nevada'),
    'NE': (37, '1867-03-01', '1 de marzo de 1867',      'el Territorio de Nebraska'),
    'CO': (38, '1876-08-01', '1 de agosto de 1876',     'el Territorio de Colorado'),
    'ND': (39, '1889-11-02', '2 de noviembre de 1889',  'el Territorio de Dakota'),
    'SD': (40, '1889-11-02', '2 de noviembre de 1889',  'el Territorio de Dakota'),
    'MT': (41, '1889-11-08', '8 de noviembre de 1889',  'el Territorio de Montana'),
    'WA': (42, '1889-11-11', '11 de noviembre de 1889', 'el Territorio de Washington'),
    'ID': (43, '1890-07-03', '3 de julio de 1890',      'el Territorio de Idaho'),
    'WY': (44, '1890-07-10', '10 de julio de 1890',     'el Territorio de Wyoming'),
    'UT': (45, '1896-01-04', '4 de enero de 1896',      'el Territorio de Utah'),
    'OK': (46, '1907-11-16', '16 de noviembre de 1907', 'el Territorio de Oklahoma'),
    'NM': (47, '1912-01-06', '6 de enero de 1912',      'el Territorio de Nuevo México'),
    'AZ': (48, '1912-02-14', '14 de febrero de 1912',   'el Territorio de Arizona'),
    'AK': (49, '1959-01-03', '3 de enero de 1959',      'el Territorio de Alaska'),
    'HI': (50, '1959-08-21', '21 de agosto de 1959',    'el Territorio de Hawái'),
}

ORDINAL_ES = {
    1: 'primer', 2: 'segundo', 3: 'tercer', 4: 'cuarto', 5: 'quinto',
    6: 'sexto', 7: 'séptimo', 8: 'octavo', 9: 'noveno', 10: 'décimo',
    13: 'decimotercer', 50: 'quincuagésimo',
}

states = json.load(open(os.path.join(ROOT, 'data', 'states.json')))
SLUG = {s['id']: s['names']['en'].lower().replace(' ', '-') for s in states}
NAME_ES = {s['id']: (s.get('names', {}).get('es') or s['names']['en']) for s in states}
CAPITAL = {s['id']: s['capital'] for s in states}


def build_block(code):
    order, iso, long_es, prior = STATEHOOD[code]
    name = NAME_ES[code]
    cap = CAPITAL[code]

    if order <= 13:
        rank_txt = (f'Fue el {ORDINAL_ES.get(order, str(order) + ".º")} estado en ratificar '
                    f'la Constitución de los Estados Unidos.')
    else:
        rank_txt = f'Se convirtió en el estado número {order} de la Unión.'

    return f"""    {MARKER}
    <section class="statehood-answer" style="background:#F8FAFC;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:0 10px 10px 0;margin:18px 0;">
      <h2 style="margin:0 0 8px;font-size:1.15rem;">¿Cuándo alcanzó {name} la estadidad?</h2>
      <p style="margin:0 0 10px;font-size:1.02rem;"><strong>{name} alcanzó la estadidad el {long_es}.</strong> {rank_txt} Antes de la estadidad era {prior}.</p>
      <dl style="display:grid;grid-template-columns:max-content 1fr;gap:4px 16px;margin:0;font-size:.92rem;">
        <dt style="font-weight:700;color:#475569;">Fecha de admisión</dt><dd style="margin:0;">{long_es}</dd>
        <dt style="font-weight:700;color:#475569;">Número de estado</dt><dd style="margin:0;">{order} de 50</dd>
        <dt style="font-weight:700;color:#475569;">Estatus previo</dt><dd style="margin:0;">{prior.capitalize()}</dd>
        <dt style="font-weight:700;color:#475569;">Capital</dt><dd style="margin:0;">{cap}</dd>
      </dl>
    </section>
"""


FAQ_RE = re.compile(
    r'(<script type="application/ld\+json">\s*)(\{"@context":"https://schema\.org","@type":"FAQPage".*?\})(\s*</script>)',
    re.DOTALL,
)


def add_faq(html, code):
    """Append a statehood Q&A to the page's FAQPage JSON-LD if present."""
    order, iso, long_es, prior = STATEHOOD[code]
    name = NAME_ES[code]
    q = f'¿Cuándo alcanzó {name} la estadidad?'
    a = (f'{name} alcanzó la estadidad el {long_es}, convirtiéndose en el estado '
         f'número {order} de los Estados Unidos. Antes era {prior}.')

    m = FAQ_RE.search(html)
    if not m:
        return html
    try:
        data = json.loads(m.group(2))
    except json.JSONDecodeError:
        return html
    entities = data.get('mainEntity')
    if not isinstance(entities, list):
        return html
    if any(q in (e.get('name') or '') for e in entities):
        return html  # already added
    entities.insert(0, {
        '@type': 'Question', 'name': q,
        'acceptedAnswer': {'@type': 'Answer', 'text': a},
    })
    new_json = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    return html[:m.start(2)] + new_json + html[m.end(2):]


# Wyoming only: the query data proves statehood is the dominant intent.
WY_TITLE = 'Estadidad de Wyoming: 10 de julio de 1890 (estado 44)'
WY_DESC = ('Wyoming alcanzó la estadidad el 10 de julio de 1890 como el estado número 44 '
           'de EE. UU. Antes fue territorio desde 1868. Capital: Cheyenne.')


def retitle_wyoming(html):
    html = re.sub(r'(<title>)[^<]*(</title>)', r'\g<1>' + WY_TITLE + r'\g<2>', html, count=1)
    html = re.sub(r'(<meta name="description" content=")[^"]*(")',
                  r'\g<1>' + WY_DESC + r'\g<2>', html, count=1)
    html = re.sub(r'(<meta property="og:title" content=")[^"]*(")',
                  r'\g<1>' + WY_TITLE + r'\g<2>', html, count=1)
    html = re.sub(r'(<meta property="og:description" content=")[^"]*(")',
                  r'\g<1>' + WY_DESC + r'\g<2>', html, count=1)
    html = re.sub(r'(<meta name="twitter:title" content=")[^"]*(")',
                  r'\g<1>' + WY_TITLE + r'\g<2>', html, count=1)
    html = re.sub(r'(<meta name="twitter:description" content=")[^"]*(")',
                  r'\g<1>' + WY_DESC + r'\g<2>', html, count=1)
    return html


# Insert the answer block right after the closing </h1>
H1_RE = re.compile(r'(</h1>)', re.IGNORECASE)

c = Counter()
for code in STATEHOOD:
    slug = SLUG.get(code)
    if not slug:
        c['no-slug'] += 1
        continue
    path = os.path.join(ROOT, 'es', 'states', slug, 'index.html')
    if not os.path.isfile(path):
        c['missing-file'] += 1
        continue
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()
    if MARKER in html:
        c['skip'] += 1
        continue

    m = H1_RE.search(html)
    if not m:
        c['no-h1'] += 1
        continue
    html = html[:m.end()] + '\n' + build_block(code) + html[m.end():]
    html = add_faq(html, code)
    if code == 'WY':
        html = retitle_wyoming(html)
        c['wy-retitled'] += 1

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    c['edited'] += 1

for k, v in c.most_common():
    print(f'   {k}={v}')
