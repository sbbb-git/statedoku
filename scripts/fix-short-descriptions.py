#!/usr/bin/env python3
"""Bring indexable meta descriptions back into the 110 to 160 range.

Two were truncated mid-phrase. The rest are pages my own earlier trim cut too
hard: trimming to fit 160 is right, trimming to 97 is not, because Google then
has less to show than the slot allows.

Every replacement is built from facts already on the page, never invented.
"""
import pathlib, re, html, sys

TEXT = {
 'learn/world-cup-2026-opening-match':
   "The 2026 FIFA World Cup opening match is on June 11, 2026 at Estadio Azteca in Mexico City, with Mexico playing. Kick-off times, venue and how to follow it.",
 'es/play/state-abbreviations':
   "Empareja el codigo postal de 2 letras con su estado. 20 rondas, opcion multiple y escritura. Juego gratuito en el navegador, sin registro ni descarga.",
 'es/learn/estados-con-mas-inmigrantes':
   "Los estados de EE.UU. con mayor poblacion nacida en el extranjero segun el Census Bureau (ACS): California, Nueva York, Nueva Jersey y Florida a la cabeza.",
 'fr/learn/france-coupe-du-monde-2026':
   "L'equipe de France a la Coupe du Monde 2026 aux USA, Canada et Mexique. Mbappe, Dembele, Tchouameni: calendrier, villes hotes et decalage horaire.",
 'learn/states-by-gdp-ranking':
   "The full ranking of US states by GDP. California $4T, Texas $2.3T, New York $2.1T, Florida $1.6T. How each state compares, and what drives the gap.",
 'play/state-nicknames':
   "Match nicknames to their states: Lone Star, Golden State, Sunshine State. Free browser game, no signup, playable in under a minute. Updated for 2026.",
 'fr/learn/peres-fondateurs':
   "Les Peres Fondateurs des Etats-Unis : Washington, Jefferson, Franklin, Adams, Hamilton, Madison, Jay. Qui ils etaient et ce qu'ils ont reellement fait.",
 'es/learn/estadio-azteca-historia':
   "Historia del Estadio Azteca de Ciudad de Mexico: tres Mundiales en 1970, 1986 y 2026, 87.000 espectadores y los partidos que lo hicieron legendario.",
 'es/learn/concentraciones-mundial-2026':
   "Las concentraciones del Mundial 2026: donde entrenan Mexico, Argentina, Brasil, Espana y Estados Unidos entre partidos, y como se eligen las sedes.",
 'es/learn/mexico-vs-eeuu-historia':
   "Historia de la rivalidad Mexico contra Estados Unidos en futbol: cara a cara, victorias famosas y el origen de la tradicion del Dos a Cero.",
 'es/learn/padres-fundadores':
   "Los Padres Fundadores de Estados Unidos: Washington, Jefferson, Franklin, Adams, Hamilton y Madison. Quienes fueron y que estado los vio nacer.",
 'fr/learn/parcs-nationaux-americains':
   "Liste complete des 63 parcs nationaux americains par Etat. La Californie en compte 9, l'Alaska 8, l'Utah 5. Le plus ancien, le plus grand, le plus visite.",
 'learn/safest-states-to-live':
   "The safest US states by violent and property crime rate. New Hampshire, Maine, Vermont and New Jersey lead. Full ranking with the numbers behind it.",
}

D = re.compile(r'(<meta[^>]*?name="description"[^>]*?content=")([^"]*)(")', re.I)
n = 0
for slug, new in TEXT.items():
    if not 110 <= len(new) <= 160: sys.exit(f'{slug}: {len(new)} chars, out of range')
    if '"' in new: sys.exit(f'{slug}: contains a quote')
    p = pathlib.Path(slug) / 'index.html'
    if not p.is_file(): sys.exit(f'missing: {p}')
    s = p.read_text(encoding='utf-8')
    m = D.search(s[:16000])
    if not m: sys.exit(f'no description in {p}')
    p.write_text(s[:m.start(2)] + new + s[m.end(2):], encoding='utf-8')
    print(f'  {len(html.unescape(m.group(2))):4} -> {len(new):3}  /{slug}/')
    n += 1
print(f'\n{n} descriptions extended')
