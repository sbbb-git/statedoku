#!/usr/bin/env python3
"""
Cross-link injection: every /learn/<X>/ page gets a 'Play & Learn' card
linking to a relevant /play/ game above its existing related-grid.
Every /play/<game>/ page gets a 'Read more' card linking to relevant /learn/
articles below its main game container.

Idempotent: skip pages that already contain the cross-link marker.
"""
import os
import re
from pathlib import Path

ROOT = Path('/Users/sacha/Desktop/Statoku')
SKIP = {'node_modules', '.git', '.wrangler', 'tmp'}
MARKER = '<!-- xlink-shabbat -->'

# Map of /learn/ slug → relevant /play/ game slug (best fit per topic)
LEARN_TO_PLAY = {
    'state-capitals': 'state-capitals-typing',
    'state-capitals-pronunciation': 'state-capitals-typing',
    'states-and-capitals': 'state-capitals-match',
    'state-abbreviations': 'state-abbreviations',
    'state-nicknames': 'state-nicknames',
    'state-nicknames-complete': 'state-nicknames',
    'state-mottos': 'state-mottos',
    'state-flags': 'state-flags',
    'state-birds': 'state-symbols',
    'state-flowers': 'state-symbols',
    'state-trees': 'state-symbols',
    'state-songs': 'state-symbols',
    'state-quarters': 'state-symbols',
    'state-license-plates': 'state-abbreviations',
    '13-colonies': 'thirteen-colonies',
    'thirteen-colonies': 'thirteen-colonies',
    'colonias-originales': 'thirteen-colonies',
    'states-confederate': 'confederate-states',
    'confederate-states': 'confederate-states',
    'electoral-college': 'electoral-college',
    'colegio-electoral': 'electoral-college',
    'college-electoral': 'electoral-college',
    'swing-states': 'swing-states',
    'estados-bisagra': 'swing-states',
    'no-income-tax': 'no-income-tax-states',
    'states-by-time-zone': 'time-zones',
    'zonas-horarias-eeuu': 'time-zones',
    'fuseaux-horaires-etats-unis': 'time-zones',
    'states-bordering-canada': 'border-states',
    'states-bordering-mexico': 'border-states',
    'us-regions': 'place-the-state',
    'regiones-de-eeuu': 'place-the-state',
    'regions-des-etats-unis': 'place-the-state',
    'largest-states': 'place-the-state',
    'landlocked-states': 'place-the-state',
    'us-cultural-belts': 'states-connections',
    'cinturones-eeuu': 'states-connections',
    'state-admission-order': 'state-admission-order',
    'states-by-statehood-year': 'state-admission-order',
    'states-presidents-born': 'president-birth-states',
    'president-birth-states': 'president-birth-states',
    'presidentes-por-estado': 'president-birth-states',
    'presidents-par-etat': 'president-birth-states',
    'states-largest-cities': 'biggest-cities',
}

# Reverse: /play/ slug → suggested /learn/ articles (multiple)
PLAY_TO_LEARN = {
    'place-the-state': ['us-regions', 'largest-states', 'landlocked-states'],
    'state-abbreviations': ['state-abbreviations'],
    'state-capitals-typing': ['state-capitals', 'states-and-capitals'],
    'state-capitals-match': ['state-capitals', 'states-and-capitals'],
    'state-flags': ['state-flags'],
    'state-nicknames': ['state-nicknames-complete', 'state-nicknames'],
    'state-mottos': ['state-mottos'],
    'state-symbols': ['state-birds', 'state-flowers', 'state-trees'],
    'thirteen-colonies': ['13-colonies'],
    'confederate-states': ['states-confederate'],
    'state-admission-order': ['states-by-statehood-year'],
    'president-birth-states': ['states-presidents-born'],
    'electoral-college': ['electoral-college'],
    'swing-states': ['swing-states'],
    'no-income-tax-states': ['no-income-tax'],
    'time-zones': ['states-by-time-zone'],
    'border-states': ['states-bordering-canada', 'states-bordering-mexico'],
    'rivers-mountains': ['states-with-mountains', 'states-with-great-lakes'],
    'biggest-cities': ['states-largest-cities'],
    'state-silhouettes': ['state-flags'],
    'states-connections': ['us-cultural-belts'],
    'state-capitals-pronunciation': ['state-capitals-pronunciation'],
}

I18N_PROMOTE = {
    'en': {'play': 'Test yourself', 'learn': 'Read the full guide', 'try': 'Try the {} quiz', 'guide': 'Read the {} guide'},
    'fr': {'play': 'Teste-toi', 'learn': 'Lire le guide complet', 'try': 'Essayer le quiz {}', 'guide': 'Lire le guide {}'},
    'es': {'play': 'Pon a prueba', 'learn': 'Leer la guía completa', 'try': 'Probar el quiz {}', 'guide': 'Leer la guía {}'},
}

# /play/ game titles per language
GAME_TITLES = {
    'place-the-state': {'en': 'Place the State', 'fr': "Placer l'État", 'es': 'Coloca el Estado'},
    'state-capitals-typing': {'en': 'State Capitals Quiz', 'fr': 'Quiz Capitales', 'es': 'Quiz Capitales'},
    'state-capitals-match': {'en': 'Capitals Match', 'fr': 'Mémo Capitales', 'es': 'Empareja Capitales'},
    'state-abbreviations': {'en': 'USPS Abbreviations', 'fr': 'Abréviations USPS', 'es': 'Abreviaturas USPS'},
    'state-flags': {'en': 'State Flags', 'fr': 'Drapeaux', 'es': 'Banderas'},
    'state-nicknames': {'en': 'State Nicknames', 'fr': "Surnoms d'États", 'es': 'Apodos Estatales'},
    'state-mottos': {'en': 'State Mottos', 'fr': "Devises d'États", 'es': 'Lemas Estatales'},
    'state-symbols': {'en': 'State Symbols', 'fr': "Symboles d'États", 'es': 'Símbolos Estatales'},
    'thirteen-colonies': {'en': '13 Colonies', 'fr': '13 Colonies', 'es': '13 Colonias'},
    'confederate-states': {'en': 'Confederate States', 'fr': 'Confédération', 'es': 'Confederación'},
    'state-admission-order': {'en': 'Admission Order', 'fr': "Ordre d'Admission", 'es': 'Orden de Admisión'},
    'president-birth-states': {'en': 'Presidents by State', 'fr': 'Présidents par État', 'es': 'Presidentes por Estado'},
    'electoral-college': {'en': 'Electoral College', 'fr': 'Collège Électoral', 'es': 'Colegio Electoral'},
    'swing-states': {'en': 'Swing States', 'fr': 'États-Pivots', 'es': 'Estados Bisagra'},
    'no-income-tax-states': {'en': 'No Income Tax', 'fr': 'Sans Impôt', 'es': 'Sin Impuesto'},
    'time-zones': {'en': 'Time Zones', 'fr': 'Fuseaux Horaires', 'es': 'Zonas Horarias'},
    'border-states': {'en': 'Border States', 'fr': 'États Frontaliers', 'es': 'Estados Fronterizos'},
    'rivers-mountains': {'en': 'Rivers & Mountains', 'fr': 'Fleuves & Montagnes', 'es': 'Ríos y Montañas'},
    'biggest-cities': {'en': 'Biggest Cities', 'fr': 'Plus Grandes Villes', 'es': 'Ciudades Más Grandes'},
    'state-silhouettes': {'en': 'State Silhouettes', 'fr': "Silhouettes d'États", 'es': 'Siluetas'},
    'states-connections': {'en': 'States Connections', 'fr': "Connexions d'États", 'es': 'Conexiones de Estados'},
}


def play_card(lang, play_slug):
    """HTML for a 'play this game' promo card (injected at bottom of /learn/ pages)."""
    if play_slug not in GAME_TITLES:
        return None
    game_title = GAME_TITLES[play_slug][lang]
    label_try = I18N_PROMOTE[lang]['try'].format(game_title)
    label_play = {'en': 'Play', 'fr': 'Jouer', 'es': 'Jugar'}[lang]
    play_url = '/play/' if lang == 'en' else f'/{lang}/play/'
    return f'''
    {MARKER}
    <div style="background:linear-gradient(135deg,#0F2147,#1E3A6B);color:#fff;border-radius:14px;padding:22px;margin:24px 0;text-align:center">
      <p style="margin:0 0 6px;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;opacity:.78">{I18N_PROMOTE[lang]['play']}</p>
      <h3 style="color:#fff;margin:0 0 8px;font-size:1.25rem;letter-spacing:-.02em">{game_title}</h3>
      <p style="margin:0 0 14px;color:rgba(255,255,255,.85);font-size:.92rem">{label_try}</p>
      <a href="{play_url}{play_slug}/" style="display:inline-block;background:#F59E0B;color:#0F2147;padding:10px 22px;border-radius:999px;font-weight:800;text-decoration:none;font-size:.92rem">{label_play} →</a>
    </div>'''


def learn_card(lang, learn_slugs):
    """HTML for a 'read more' card listing /learn/ articles (injected at bottom of /play/ pages)."""
    if not learn_slugs:
        return None
    learn_url = '/learn/' if lang == 'en' else f'/{lang}/learn/'
    label_head = {'en': 'Read more about this topic', 'fr': 'En savoir plus sur ce sujet', 'es': 'Leer más sobre este tema'}[lang]
    label_back = I18N_PROMOTE[lang]['learn']
    items = []
    for s in learn_slugs[:3]:
        # Verify file exists in source
        try_path = ROOT / (f'{"" if lang == "en" else lang + "/"}learn/{s}/index.html')
        if try_path.exists():
            items.append(f'<a href="{learn_url}{s}/" style="display:block;padding:10px 12px;border:1px solid #E2E8F0;border-radius:8px;color:#0F2147;text-decoration:none;font-weight:600;font-size:.88rem;margin-bottom:6px">→ /{s.replace("-", " ").title()}</a>')
    if not items:
        return None
    return f'''
    {MARKER}
    <div style="max-width:760px;margin:20px auto;padding:0 14px">
      <h2 style="font-size:1.05rem;font-weight:800;color:#0F2147;letter-spacing:-.01em;margin:14px 0 8px">{label_head}</h2>
      {"".join(items)}
    </div>'''


def lang_of(p: Path) -> str:
    parts = p.parts
    if 'es' in parts:
        return 'es'
    if 'fr' in parts:
        return 'fr'
    return 'en'


def learn_pages():
    out = []
    for prefix in ['learn', 'fr/learn', 'es/learn']:
        d = ROOT / prefix
        if not d.is_dir():
            continue
        for sub in d.iterdir():
            if sub.is_dir():
                idx = sub / 'index.html'
                if idx.exists():
                    out.append(idx)
    return out


def play_pages():
    out = []
    for prefix in ['play', 'fr/play', 'es/play']:
        d = ROOT / prefix
        if not d.is_dir():
            continue
        for sub in d.iterdir():
            if sub.is_dir() and (sub / 'index.html').exists():
                out.append(sub / 'index.html')
    return out


def inject_into_learn():
    """Inject a 'play this game' card before </main> on /learn/ pages whose slug maps."""
    n = 0
    skipped = 0
    no_map = 0
    for p in learn_pages():
        slug = p.parent.name
        play_slug = LEARN_TO_PLAY.get(slug)
        if not play_slug:
            no_map += 1
            continue
        c = p.read_text()
        if MARKER in c:
            skipped += 1
            continue
        card = play_card(lang_of(p), play_slug)
        if not card:
            continue
        new_c, count = re.subn(r'(</main>)', card + r'\n\1', c, count=1)
        if count:
            p.write_text(new_c)
            n += 1
    return n, skipped, no_map


def inject_into_play():
    """Inject a 'read related learn articles' card before </main> on /play/ game pages."""
    n = 0
    skipped = 0
    no_map = 0
    for p in play_pages():
        slug = p.parent.name
        if slug == 'state':
            continue  # /play/<game>/state/ — handled by per-state launcher pages
        learns = PLAY_TO_LEARN.get(slug)
        if not learns:
            no_map += 1
            continue
        c = p.read_text()
        if MARKER in c:
            skipped += 1
            continue
        card = learn_card(lang_of(p), learns)
        if not card:
            continue
        new_c, count = re.subn(r'(</main>)', card + r'\n\1', c, count=1)
        if count:
            p.write_text(new_c)
            n += 1
    return n, skipped, no_map


lp, ls, lnm = inject_into_learn()
pp, ps, pnm = inject_into_play()
print(f'✅ Learn pages: +{lp} cards (skipped {ls} already-done, {lnm} no-mapping)')
print(f'✅ Play pages:  +{pp} cards (skipped {ps} already-done, {pnm} no-mapping)')
