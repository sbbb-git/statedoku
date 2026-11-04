#!/usr/bin/env python3
"""Build the three 2026 midterm election pages from scripts/data/midterms-2026.json.

    python3 scripts/build-midterms-page.py

The results are data, not prose: every sentence that states a result is
written from the JSON, so the lead, the counts, the map and the tables can
never disagree. Update the JSON as AP calls the remaining races (only AP
calls, cross-checked with a second outlet, each row with its sources), then
re-run this script, commit, and run build-sitemap-lastmod.py as for any page.

Neutral on purpose: results and rules, no commentary on parties or
candidates. Built on 4 November 2026, the day after the vote.
"""
import html
import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'scripts' / 'data' / 'midterms-2026.json'
BASE = 'https://statedoku.com'
PATHS = {'en': '/learn/2026-midterm-elections/',
         'fr': '/fr/learn/elections-mi-mandat-2026/',
         'es': '/es/learn/elecciones-intermedias-2026/'}

D = json.load(open(DATA, encoding='utf-8'))
STATES = {s['id']: s for s in json.load(open(ROOT / 'data' / 'states.json', encoding='utf-8'))}
esc = lambda s: html.escape(str(s), quote=True)

SENATE = sorted(D['senate'], key=lambda r: (r['state'], r.get('special', False)))
GOV = sorted(D['governors'], key=lambda r: r['state'])
assert len(SENATE) == 35, len(SENATE)
assert len(GOV) == 36, len(GOV)
for r in SENATE + GOV:
    assert r['usps'] in STATES, r['usps']
    assert r['status'] in ('called', 'not_called'), r
    assert r['sources'], ('no source', r['state'])
    if r['status'] == 'called':
        assert r['winner'] and r['winner_party'] in ('D', 'R', 'I'), r


def count(rows, party=None, flip=None):
    return sum(1 for r in rows if r['status'] == 'called'
               and (party is None or r['winner_party'] == party)
               and (flip is None or bool(r.get('flip')) == flip))


AS_OF = datetime.fromisoformat(D['as_of_utc'].replace('Z', '+00:00'))
MONTHS = {
    'en': 'January February March April May June July August September October November December'.split(),
    'fr': 'janvier février mars avril mai juin juillet août septembre octobre novembre décembre'.split(),
    'es': 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split(),
}


def day(lang, d):
    m = MONTHS[lang][d.month - 1]
    if lang == 'en':
        return f'{m} {d.day}, {d.year}'
    if lang == 'fr':
        return f'{"1er" if d.day == 1 else d.day} {m} {d.year}'
    return f'{d.day} de {m} de {d.year}'


def stamp(lang, at=None):
    at = at or AS_OF
    hm = at.strftime('%H:%M')
    return {'en': f'{day("en", at)}, {hm} UTC', 'fr': f'{day("fr", at)} à {hm} UTC',
            'es': f'{day("es", at)}, a las {hm} UTC'}[lang]


# The House tally can lag the Senate and governor rows: when no AP count can be
# read at the time of an update, the last one read keeps its own date.
_h_at = D['house_control'].get('as_of_utc')
HOUSE_AS_OF = datetime.fromisoformat(_h_at.replace('Z', '+00:00')) if _h_at else None


def house_when(lang):
    if not HOUSE_AS_OF or HOUSE_AS_OF == AS_OF:
        return ''
    return {'en': f' (count as of {stamp("en", HOUSE_AS_OF)})', 'fr': f' (décompte au {stamp("fr", HOUSE_AS_OF)})',
            'es': f' (recuento al {stamp("es", HOUSE_AS_OF)})'}[lang]


PARTY = {
    'en': {'D': 'Democrat', 'R': 'Republican', 'I': 'Independent'},
    'fr': {'D': 'démocrate', 'R': 'républicain', 'I': 'indépendant'},
    'es': {'D': 'demócrata', 'R': 'republicano', 'I': 'independiente'},
}
PARTIES = {
    'en': {'D': 'Democrats', 'R': 'Republicans'},
    'fr': {'D': 'les démocrates', 'R': 'les républicains'},
    'es': {'D': 'los demócratas', 'R': 'los republicanos'},
}

T = {
    'en': dict(
        home='/', learn='/learn/', home_name='Home', learn_name='Learn', back='← Home',
        title='2026 Midterm Election Results by State | Statedoku',
        h1='2026 Midterm Elections: Results by State',
        crumb='2026 midterm elections',
        sub='Senate, governors and the House, state by state, from the vote of 3 November 2026.',
        desc='The 3 November 2026 US midterms state by state: the 35 Senate races, the 36 governors and control of the House, on a map. Updated as races are called.',
        asof='Results as of {t}, from AP race calls.',
        n_senate='Senate races called', n_gov='Governor races called', n_flip_s='Senate seats that changed party', n_flip_g='Governorships that changed party',
        map_h='The map', tab_s='Senate', tab_g='Governors',
        leg=dict(D='Democrat won', R='Republican won', I='Independent won', P='Not called yet', N='No race'),
        map_note='Color shows the winner\'s party in each state that voted for that office. Grey states had no such race, or their race has not been called.',
        sen_h='The 35 Senate races',
        sen_intro='One third of the Senate is elected every two years. In 2026 the 33 seats of class 2 were up, plus two special elections, in Ohio and Florida, for the seats JD Vance and Marco Rubio left in January 2025.',
        gov_h='The 36 governor races',
        gov_intro='Thirty-six states elected their governor, Vermont and New Hampshire among them, as they do every two years. Of the other 14, New Jersey and Virginia voted in 2025, Kentucky, Louisiana and Mississippi vote in 2027 and the other nine in 2028.',
        cols=['State', 'Winner', 'Party', 'Seat', 'Status'],
        flip='changed party', hold='kept', called='called', pending='counting', special='special',
        house_h='The House of Representatives',
        house_body='All 435 seats were up for election, as in every even year. How many each state holds was set by the 2020 census, from 52 for California to one for each of the six least populated states (see <a href="/learn/house-seats-by-state-1910-2020/">House seats by state since 1910</a>). A majority is 218 seats.',
        hist_h='How the president\'s party usually fares in midterms',
        next_h='What happens next',
        next_body='States count the remaining ballots, then certify their results over the following weeks, each on its own calendar. Close races can go to a recount, and Louisiana holds runoffs. The terms of the new Congress begin at noon on 3 January 2027, and most new governors take office in January.',
        pending_h='Races not called yet',
        pending_none='Every Senate and governor race has been called.',
        faq_h='Frequently asked questions',
        rel_h='Related guides',
        related=[('/learn/electoral-college/', 'The Electoral College'), ('/learn/swing-states/', 'Swing states'),
                 ('/learn/house-seats-by-state-1910-2020/', 'House seats by state'), ('/learn/states-and-capitals/', 'The 50 states and capitals'),
                 ('/learn/us-territories/', 'US territories')],
        cta_h='Know the 50 states?', cta_p='One grid a day, each cell a state that fits two clues.', cta_a='Play today\'s puzzle', cta_url='/',
        footer='<a href="/about/">About</a> &nbsp;·&nbsp; <a href="/learn/">Learn</a> &nbsp;·&nbsp; <a href="/states/">States</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/facts/">Facts</a> &nbsp;·&nbsp; <a href="/privacy/">Privacy</a> &nbsp;·&nbsp; <a href="/terms/">Terms</a> &nbsp;·&nbsp; <a href="/legal/">Legal notice</a>',
        src_h='Sources',
        src_body='Race calls from the Associated Press: the status of each race in the tables links to its AP results page. Every call was checked against at least one other outlet (NBC News, CNN or CBS News). Certified results come from each state\'s election office.',
    ),
    'fr': dict(
        home='/fr/', learn='/fr/learn/', home_name='Accueil', learn_name='Apprendre', back='← Apprendre',
        title='Élections de mi-mandat 2026 : résultats par État | Statedoku',
        h1='Élections de mi-mandat 2026 : les résultats État par État',
        crumb='Élections de mi-mandat 2026',
        sub='Sénat, gouverneurs et Chambre des représentants, État par État, après le vote du 3 novembre 2026.',
        desc='Les midterms du 3 novembre 2026 État par État : Sénat, 36 gouverneurs et contrôle de la Chambre, sur une carte. Mis à jour au fil des résultats.',
        asof='Résultats au {t}, selon les annonces de l\'agence AP.',
        n_senate='Élections au Sénat avec un vainqueur annoncé', n_gov='Élections de gouverneur avec un vainqueur annoncé', n_flip_s='Sièges du Sénat qui changent de parti', n_flip_g='Postes de gouverneur qui changent de parti',
        map_h='La carte', tab_s='Sénat', tab_g='Gouverneurs',
        leg=dict(D='Victoire démocrate', R='Victoire républicaine', I='Victoire indépendante', P='Pas encore annoncé', N='Pas d\'élection'),
        map_note='La couleur indique le parti du vainqueur dans chaque État qui votait pour ce poste. En gris, les États sans élection pour ce poste ou dont le résultat n\'est pas encore annoncé.',
        sen_h='Les 35 élections au Sénat',
        sen_intro='Un tiers du Sénat est renouvelé tous les deux ans. En 2026, les 33 sièges de la classe 2 étaient en jeu, plus deux élections partielles, dans l\'Ohio et en Floride, pour les sièges que JD Vance et Marco Rubio ont quittés en janvier 2025.',
        gov_h='Les 36 élections de gouverneur',
        gov_intro='Trente-six États élisaient leur gouverneur, dont le Vermont et le Nouveau-Hampshire, qui le font tous les deux ans. Parmi les 14 autres, le New Jersey et la Virginie ont voté en 2025, le Kentucky, la Louisiane et le Mississippi votent en 2027 et les neuf derniers en 2028.',
        cols=['État', 'Élu', 'Parti', 'Siège', 'Statut'],
        flip='change de parti', hold='conservé', called='annoncé', pending='dépouillement', special='partielle',
        house_h='La Chambre des représentants',
        house_body='Les 435 sièges étaient en jeu, comme chaque année paire. Leur répartition entre États découle du recensement de 2020, de 52 pour la Californie à un seul pour chacun des six États les moins peuplés (voir <a href="/fr/learn/sieges-chambre-par-etat-1910-2020/">les sièges à la Chambre par État depuis 1910</a>). La majorité est de 218 sièges.',
        hist_h='Le parti du président aux élections de mi-mandat',
        next_h='La suite',
        next_body='Les États finissent de compter les bulletins puis certifient leurs résultats dans les semaines qui suivent, chacun selon son propre calendrier. Les courses serrées peuvent donner lieu à un recomptage. La Louisiane organise des seconds tours. Le mandat du nouveau Congrès commence le 3 janvier 2027 à midi, et la plupart des nouveaux gouverneurs prennent leurs fonctions en janvier.',
        pending_h='Élections sans vainqueur annoncé',
        pending_none='Toutes les élections au Sénat et de gouverneur ont un vainqueur annoncé.',
        faq_h='Questions fréquentes',
        rel_h='Guides associés',
        related=[('/fr/learn/college-electoral/', 'Le Collège électoral'), ('/fr/learn/systeme-federal-americain/', 'Le système fédéral américain'),
                 ('/fr/learn/sieges-chambre-par-etat-1910-2020/', 'Les sièges à la Chambre par État'), ('/fr/learn/liste-des-50-etats/', 'La liste des 50 États'),
                 ('/fr/learn/territoires-americains/', 'Les territoires américains')],
        cta_h='Vous connaissez les 50 États ?', cta_p='Une grille par jour, chaque case un État qui répond à deux indices.', cta_a='Jouer la grille du jour', cta_url='/fr/',
        footer='<a href="/fr/about/">À propos</a> &nbsp;·&nbsp; <a href="/fr/learn/">Apprendre</a> &nbsp;·&nbsp; <a href="/states/">Tous les états</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/fr/faq/">FAQ</a> &nbsp;·&nbsp; <a href="/fr/privacy/">Confidentialité</a> &nbsp;·&nbsp; <a href="/fr/terms/">Conditions</a> &nbsp;·&nbsp; <a href="/fr/mentions-legales/">Mentions légales</a>',
        src_h='Sources',
        src_body='Résultats annoncés par l\'agence Associated Press : le statut de chaque élection dans les tableaux renvoie à sa page de résultats AP. Chaque annonce a été recoupée avec au moins un autre média (NBC News, CNN ou CBS News). Les résultats certifiés viennent du bureau électoral de chaque État.',
    ),
    'es': dict(
        home='/es/', learn='/es/learn/', home_name='Inicio', learn_name='Aprender', back='← Aprender',
        title='Elecciones intermedias 2026: resultados por estado | Statedoku',
        h1='Elecciones intermedias de EE.UU. 2026: resultados por estado',
        crumb='Elecciones intermedias 2026',
        sub='Senado, gobernadores y Cámara de Representantes, estado por estado, tras la votación del 3 de noviembre de 2026.',
        desc='Elecciones intermedias de EE.UU. del 3 de noviembre de 2026 por estado: Senado, 36 gobernadores y control de la Cámara, en un mapa. Se actualiza.',
        asof='Resultados al {t}, según los ganadores declarados por la agencia AP.',
        n_senate='Contiendas al Senado con ganador declarado', n_gov='Gobernaciones con ganador declarado', n_flip_s='Escaños del Senado que cambian de partido', n_flip_g='Gobernaciones que cambian de partido',
        map_h='El mapa', tab_s='Senado', tab_g='Gobernadores',
        leg=dict(D='Ganó el demócrata', R='Ganó el republicano', I='Ganó el independiente', P='Sin ganador declarado aún', N='Sin elección'),
        map_note='El color indica el partido del ganador en cada estado que votaba ese cargo. En gris, los estados sin esa elección o cuyo ganador aún no se ha declarado.',
        sen_h='Las 35 elecciones al Senado',
        sen_intro='Un tercio del Senado se renueva cada dos años. En 2026 estaban en juego los 33 escaños de la clase 2, más dos elecciones especiales, en Ohio y Florida, por los escaños que JD Vance y Marco Rubio dejaron en enero de 2025.',
        gov_h='Las 36 elecciones a gobernador',
        gov_intro='Treinta y seis estados elegían gobernador, entre ellos Vermont y Nuevo Hampshire, que lo hacen cada dos años. De los otros 14, Nueva Jersey y Virginia votaron en 2025, Kentucky, Luisiana y Misisipi votan en 2027 y los nueve restantes en 2028.',
        cols=['Estado', 'Ganador', 'Partido', 'Escaño', 'Estado del conteo'],
        flip='cambia de partido', hold='se mantiene', called='declarado', pending='en conteo', special='especial',
        house_h='La Cámara de Representantes',
        house_body='Los 435 escaños estaban en juego, como cada año par. Cuántos tiene cada estado lo fijó el censo de 2020, desde 52 para California hasta uno para cada uno de los seis estados menos poblados (ver <a href="/es/learn/escanos-camara-por-estado-1910-2020/">los escaños de la Cámara por estado desde 1910</a>). La mayoría es de 218 escaños.',
        hist_h='Cómo le va al partido del presidente en las intermedias',
        next_h='Lo que viene',
        next_body='Los estados terminan de contar las papeletas y certifican sus resultados en las semanas siguientes, cada uno con su propio calendario. Las contiendas reñidas pueden ir a un recuento, y Luisiana celebra segundas vueltas. El mandato del nuevo Congreso empieza al mediodía del 3 de enero de 2027 y la mayoría de los nuevos gobernadores asumen en enero.',
        pending_h='Contiendas aún sin ganador declarado',
        pending_none='Todas las elecciones al Senado y a gobernador ya tienen ganador declarado.',
        faq_h='Preguntas frecuentes',
        rel_h='Guías relacionadas',
        related=[('/es/learn/colegio-electoral/', 'El Colegio Electoral'), ('/es/learn/estados-bisagra/', 'Los estados bisagra'),
                 ('/es/learn/escanos-camara-por-estado-1910-2020/', 'Escaños de la Cámara por estado'), ('/es/learn/lista-de-los-50-estados/', 'La lista de los 50 estados'),
                 ('/es/learn/territorios-eeuu/', 'Los territorios de EE.UU.')],
        cta_h='¿Conoces los 50 estados?', cta_p='Una cuadrícula al día, cada casilla un estado que cumple dos pistas.', cta_a='Jugar el puzzle de hoy', cta_url='/es/',
        footer='<a href="/es/about/">Acerca</a> &nbsp;·&nbsp; <a href="/es/learn/">Aprender</a> &nbsp;·&nbsp; <a href="/states/">Todos los estados</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/es/faq/">FAQ</a> &nbsp;·&nbsp; <a href="/es/privacy/">Privacidad</a> &nbsp;·&nbsp; <a href="/es/terms/">Condiciones</a> &nbsp;·&nbsp; <a href="/es/aviso-legal/">Aviso legal</a>',
        src_h='Fuentes',
        src_body='Ganadores declarados por la agencia Associated Press: el estado de cada contienda en las tablas enlaza a su página de resultados de AP. Cada resultado se contrastó con al menos otro medio (NBC News, CNN o CBS News). Los resultados certificados vienen de la oficina electoral de cada estado.',
    ),
}



def sname(lang, usps):
    return STATES[usps]['names'][lang]


def state_link(lang, usps):
    slug = sname('en', usps).lower().replace(' ', '-')
    href = f'/es/states/{slug}/' if lang == 'es' else f'/states/{slug}/'
    page = ROOT / href.strip('/') / 'index.html'
    if not page.exists() or 'noindex' in page.read_text(encoding='utf-8')[:6000]:
        href = f'/states/{slug}/'
    return f'<a href="{href}">{esc(sname(lang, usps))}</a>'


def rows_html(lang, rows):
    t = T[lang]
    out = []
    for r in sorted(rows, key=lambda r: sname(lang, r['usps'])):
        name = state_link(lang, r['usps']) + (f' <span class="sp">({t["special"]})</span>' if r.get('special') else '')
        if r['status'] == 'called':
            party = PARTY[lang][r['winner_party']]
            seat = t['flip'] if r.get('flip') else t['hold']
            out.append(f'<tr><td>{name}</td><td>{esc(r["winner"])}</td><td><span class="dot p{r["winner_party"]}"></span>{party}</td>'
                       f'<td>{"<b>" + seat + "</b>" if r.get("flip") else seat}</td><td><a href="{esc(r["ap_url"])}" rel="noopener">{t["called"]}</a></td></tr>')
        else:
            out.append(f'<tr class="pend"><td>{name}</td><td></td><td></td><td></td><td><a href="{esc(r["ap_url"])}" rel="noopener">{t["pending"]}</a></td></tr>')
    head = ''.join(f'<th>{esc(c)}</th>' for c in t['cols'])
    return f'<div class="tbl-wrap"><table class="tbl"><thead><tr>{head}</tr></thead><tbody>{"".join(out)}</tbody></table></div>'


def map_data():
    def m(rows):
        d = {}
        for r in rows:
            v = r['winner_party'] if r['status'] == 'called' else 'P'
            # Two Senate races in one state (a special election): show both.
            d[r['usps']] = d[r['usps']] + v if r['usps'] in d else v
        return d
    return {'s': m(SENATE), 'g': m(GOV)}


MAP_JS = '''<script>
(function () {
  var box = document.getElementById('mt-map'); if (!box) return;
  var data = %s, mode = 's';
  var col = {D: '#2563EB', R: '#DC2626', I: '#7C3AED', P: '#CBD5E1'};
  function paint() {
    var d = data[mode];
    box.querySelectorAll('path[data-usps]').forEach(function (p) {
      var v = d[p.getAttribute('data-usps')];
      p.style.fill = !v ? '#F1F5F9' : v.length > 1 && v[0] !== v[1] ? 'url(#mt-split-' + v + ')' : col[v[0]];
      p.style.stroke = '#fff'; p.style.strokeWidth = '1';
    });
    document.querySelectorAll('.mt-tab').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-m') === mode ? 'true' : 'false'); });
  }
  document.querySelectorAll('.mt-tab').forEach(function (b) {
    b.addEventListener('click', function () { mode = b.getAttribute('data-m'); paint(); });
  });
  fetch('/data/us-map.svg?v=1').then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (svg) {
    box.innerHTML = svg;
    var s = box.querySelector('svg'); s.setAttribute('aria-hidden', 'true'); s.removeAttribute('role');
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'), pairs = {};
    Object.keys(data).forEach(function (k) { Object.keys(data[k]).forEach(function (u) { var v = data[k][u]; if (v.length > 1 && v[0] !== v[1]) pairs[v] = 1; }); });
    Object.keys(pairs).forEach(function (v) {
      defs.innerHTML += '<pattern id="mt-split-' + v + '" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="8" fill="' + col[v[0]] + '"/><rect x="4" width="4" height="8" fill="' + col[v[1]] + '"/></pattern>';
    });
    s.insertBefore(defs, s.firstChild);
    paint();
  }).catch(function () { box.style.display = 'none'; });
})();
</script>'''

CSS = '''
    .hp-hero { max-width: 900px; margin: 28px auto 14px; padding: 0 16px; text-align: center; }
    .hp-hero .crumb { font-size: .8rem; color: var(--text-3); margin-bottom: 8px; }
    .hp-hero .crumb a { color: var(--text-2); text-decoration: none; }
    .hp-hero h1 { font-size: clamp(1.7rem, 5.5vw, 2.4rem); font-weight: 900; letter-spacing: -0.025em; margin: 4px 0 8px; }
    .hp-hero .meta { color: var(--text-2); font-size: 1rem; }
    .hp-main { max-width: 760px; margin: 0 auto; padding: 18px 16px 60px; line-height: 1.65; }
    .hp-main h2 { margin-top: 32px; margin-bottom: 10px; font-size: 1.3rem; font-weight: 800; letter-spacing: -0.015em; }
    .answer { background: #F8FAFC; border-left: 4px solid var(--navy); padding: 14px 18px; border-radius: 0 10px 10px 0; margin: 4px 0 18px; }
    .answer p { margin: 0 0 10px; } .answer p:last-child { margin-bottom: 0; }
    .asof { font-size: .85rem; color: var(--text-3); }
    .keys { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 14px 0 6px; padding: 0; list-style: none; }
    .keys li { border: 2px solid var(--border); border-radius: 12px; padding: 12px 14px; background: #fff; font-size: .86rem; color: var(--text-2); line-height: 1.4; }
    .keys b { display: block; font-size: 1.6rem; font-weight: 900; color: var(--navy); margin-bottom: 2px; font-variant-numeric: tabular-nums; }
    .mt-tabs { display: flex; gap: 8px; margin: 8px 0 10px; }
    .mt-tab { font: 700 .85rem/1 Inter, system-ui, sans-serif; padding: 9px 14px; border: 1.5px solid var(--navy); border-radius: 999px; background: #fff; color: var(--navy); cursor: pointer; }
    .mt-tab[aria-pressed="true"] { background: var(--navy); color: #fff; }
    #mt-map { max-width: 720px; margin: 0 auto; aspect-ratio: 975 / 610; }
    #mt-map svg { width: 100%; height: auto; display: block; }
    .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: .84rem; color: var(--text-2); margin: 10px 0 4px; padding: 0; list-style: none; }
    .dot { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
    .pD { background: #2563EB; } .pR { background: #DC2626; } .pI { background: #7C3AED; } .pP { background: #CBD5E1; } .pN { background: #F1F5F9; border: 1px solid #CBD5E1; }
    .note { font-size: .85rem; color: var(--text-3); }
    .tbl-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 12px 0 22px; }
    table.tbl { width: 100%; border-collapse: collapse; font-size: .9rem; }
    table.tbl th, table.tbl td { padding: 7px 10px; border-bottom: 1px solid var(--border); text-align: left; white-space: nowrap; }
    table.tbl th { background: #F8FAFC; font-weight: 700; color: var(--navy); font-size: .78rem; text-transform: uppercase; letter-spacing: .03em; }
    table.tbl a { color: var(--navy); font-weight: 700; text-decoration: none; }
    table.tbl tr.pend td { color: var(--text-3); }
    .sp { font-size: .8rem; color: var(--text-3); }
    .cta-card { background: linear-gradient(135deg, var(--navy), var(--navy-soft)); color: #fff; padding: 22px; border-radius: 14px; margin: 28px 0; text-align: center; }
    .cta-card h3 { color: #fff; margin: 0 0 8px; } .cta-card p { margin: 0 0 12px; color: rgba(255,255,255,0.85); }
    .cta-card a { display: inline-block; background: var(--gold); color: var(--navy); padding: 10px 22px; border-radius: 999px; font-weight: 800; text-decoration: none; font-size: .92rem; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; margin: 14px 0; }
    .related-grid a { display: block; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; color: var(--navy); text-decoration: none; font-weight: 600; font-size: .9rem; }
    .faq-rendered details { border: 1px solid var(--border); border-radius: 10px; margin-bottom: 8px; padding: 12px 16px; background: #fff; }
    .faq-rendered summary { cursor: pointer; font-weight: 700; color: var(--navy); }
    .faq-rendered p { margin: 8px 0 0; color: var(--text-2); font-size: .95rem; }
'''


def prose(lang):
    """Every sentence that states a result, written from the data."""
    sC, sD, sR, sI = count(SENATE), count(SENATE, 'D'), count(SENATE, 'R'), count(SENATE, 'I')
    gC, gD, gR = count(GOV), count(GOV, 'D'), count(GOV, 'R')
    fS = [r for r in SENATE if r['status'] == 'called' and r.get('flip')]
    fG = [r for r in GOV if r['status'] == 'called' and r.get('flip')]
    to = lambda fl: {r['winner_party'] for r in fl}
    sb, nu = D['senate_before'], D['senate_not_up']
    need = 51 - (sb['D'] + sb['I_caucus_D'])
    # An independent winner is not counted in either caucus until he or she says
    # which one to join (Osborn in Nebraska said neither).
    dtot, rtot, sU = nu['D_caucus'] + sD, nu['R'] + sR, 35 - sC
    H = D['house_control']
    hD, hR, hU = H['seats_called']['D'], H['seats_called']['R'], H['uncalled']
    sc = D['senate_control']
    both = sc['status'] == 'projected' and H['status'] == 'projected' and sc['party'] == H['party']
    P = sc['party']
    if lang == 'en':
        name = {'D': 'Democrats', 'R': 'Republicans'}
        adj = {'D': 'Democratic', 'R': 'Republican'}
        ctrl = (f'<strong>{name[P]} won control of both the House and the Senate</strong> in the midterm elections of 3 November 2026, according to Associated Press race calls.'
                if both else 'Control of Congress after the midterm elections of 3 November 2026: ' +
                ('; '.join(f'AP has called the {n} for {name[c["party"]]}' if c['status'] == 'projected' else f'the {n} is not decided yet'
                           for n, c in (('Senate', sc), ('House', H)))) + '.')
        flip_s = f'{len(fS)} of them changed party' + (f', all to {name[next(iter(to(fS)))]}' if len(to(fS)) == 1 else '') if fS else 'None of them changed party'
        flip_g = f'{len(fG)} governorships changed party' + (f', all to {name[next(iter(to(fG)))]}' if len(to(fG)) == 1 else '') if fG else 'no governorship changed party'
        lead = (f'<p>{ctrl}</p>'
                f'<p>In the Senate, AP has called {sC} of the 35 races: {sD} won by Democrats and {sR} by Republicans. {flip_s}. '
                f'With the 65 seats that were not on the ballot, the Democratic caucus has {dtot} seats and Republicans {rtot}' + (f', with {sI} independent' + ('s' if sI > 1 else '') if sI else '') + f', and {sU} races are still to be called.</p>'
                f'<p>Of the 36 governor races, AP has called {gC}: {gD} won by Democrats and {gR} by Republicans, and {flip_g}. '
                f'In the House, AP has called {hD} seats for Democrats and {hR} for Republicans; {hU} have not been called yet' + house_when('en') + ', and a majority is 218.</p>')
        sen_control = (f'Before the vote Republicans held {sb["R"]} seats and Democrats {sb["D"] + sb["I_caucus_D"]}, {sb["I_caucus_D"]} of them independents who caucus with the Democrats. '
                       f'With the vice president breaking ties, Democrats needed a net gain of {need} seats to take the majority.')
        house_control = (f'AP has called the House majority for {name[H["party"]]}.' if H['status'] == 'projected' else 'AP has not yet called the House majority.')
        history = ('<p>In the 23 midterm elections from 1934 to 2022, the president\'s party gained House seats only three times: in 1934, 1998 and 2002 '
                   '(American Presidency Project, University of California, Santa Barbara). In every other one it lost seats. In 2026 the president, Donald Trump, '
                   'is a Republican, and Republicans held both the House and the Senate before the vote.</p>')
        faq = [
            ('Who won the 2026 midterm elections?', re.sub('<[^>]+>', '', ctrl) + f' AP has called {sC} of the 35 Senate races and {gC} of the 36 governor races; the rest have not been called yet.'),
            ('When were the 2026 midterms?', 'On Tuesday 3 November 2026. Many states opened early or mail voting weeks before.'),
            ('How many Senate seats were up in 2026?', '35: the 33 seats of class 2 and special elections in Ohio and Florida, for the seats JD Vance and Marco Rubio left in January 2025.'),
            ('How many governors were elected in 2026?', 'Thirty-six, in 36 states, plus the governors of three territories: Guam, the Northern Mariana Islands and the US Virgin Islands.'),
            ('What is a midterm election?', 'The federal election held halfway through a president\'s four-year term. All 435 House seats, about a third of the Senate and most governors are elected.'),
            ('When does the new Congress start?', 'At noon on 3 January 2027, as the 20th Amendment sets for every new Congress.'),
        ]
    elif lang == 'fr':
        name = {'D': 'les démocrates', 'R': 'les républicains'}
        cap = {'D': 'Les démocrates', 'R': 'Les républicains'}
        adj = {'D': 'démocrate', 'R': 'républicaine'}
        ctrl = (f'<strong>{cap[P]} ont remporté le contrôle de la Chambre des représentants et du Sénat</strong> lors des élections de mi-mandat du 3 novembre 2026, selon les résultats annoncés par l\'agence Associated Press.'
                if both else 'Le contrôle du Congrès après les élections de mi-mandat du 3 novembre 2026 : ' +
                ('; '.join(f'AP annonce une majorité {adj[c["party"]]} {n}' if c['status'] == 'projected' else f'la majorité {n} n\'est pas encore décidée'
                           for n, c in (('au Sénat', sc), ('à la Chambre', H)))) + '.')
        flip_s = f'Parmi ces sièges, {len(fS)} changent de parti' + (f', tous au profit des {name[next(iter(to(fS)))].split()[1]}' if len(to(fS)) == 1 else '') if fS else 'Aucun ne change de parti'
        flip_g = f'{len(fG)} postes de gouverneur changent de parti' + (f', tous au profit des {name[next(iter(to(fG)))].split()[1]}' if len(to(fG)) == 1 else '') if fG else 'aucun poste de gouverneur ne change de parti'
        lead = (f'<p>{ctrl}</p>'
                f'<p>Au Sénat, AP a désigné le vainqueur de {sC} des 35 élections : {sD} démocrates et {sR} républicains. {flip_s}. '
                f'Avec les 65 sièges qui n\'étaient pas renouvelés, le groupe démocrate compte {dtot} sièges et les républicains {rtot}' + (f', plus {sI} indépendant' + ('s' if sI > 1 else '') if sI else '') + f', et {sU} élections n\'ont pas encore de vainqueur annoncé.</p>'
                f'<p>Sur les 36 élections de gouverneur, AP a désigné le vainqueur de {gC} : {gD} démocrates et {gR} républicains, et {flip_g}. '
                f'À la Chambre, AP a désigné {hD} élus démocrates et {hR} républicains ; {hU} sièges n\'ont pas encore de vainqueur annoncé' + house_when('fr') + ', et la majorité est de 218.</p>')
        sen_control = (f'Avant le vote, les républicains détenaient {sb["R"]} sièges et les démocrates {sb["D"] + sb["I_caucus_D"]}, dont {sb["I_caucus_D"]} indépendants qui siègent avec eux. '
                       f'Le vice-président départageant les égalités, les démocrates avaient besoin d\'un gain net de {need} sièges pour prendre la majorité.')
        house_control = (f'AP a annoncé que {name[H["party"]]} ont remporté la majorité.' if H['status'] == 'projected' else 'AP n\'a pas encore annoncé quel parti a remporté la majorité.')
        history = ('<p>Sur les 23 élections de mi-mandat de 1934 à 2022, le parti du président n\'a gagné des sièges à la Chambre que trois fois : en 1934, 1998 et 2002 '
                   '(American Presidency Project, université de Californie à Santa Barbara). Il en a perdu à toutes les autres. En 2026, le président, Donald Trump, '
                   'est républicain, et les républicains contrôlaient la Chambre et le Sénat avant le vote.</p>')
        faq = [
            ('Qui a gagné les élections de mi-mandat 2026 ?', re.sub('<[^>]+>', '', ctrl) + f' AP a désigné le vainqueur de {sC} des 35 élections au Sénat et de {gC} des 36 élections de gouverneur ; les autres n\'ont pas encore de vainqueur annoncé.'),
            ('Quand ont eu lieu les midterms 2026 ?', 'Le mardi 3 novembre 2026. Beaucoup d\'États avaient ouvert le vote anticipé ou par correspondance des semaines avant.'),
            ('Combien de sièges du Sénat étaient en jeu en 2026 ?', '35 : les 33 sièges de la classe 2 et deux élections partielles, dans l\'Ohio et en Floride, pour les sièges que JD Vance et Marco Rubio ont quittés en janvier 2025.'),
            ('Combien de gouverneurs ont été élus en 2026 ?', 'Trente-six, dans 36 États, plus les gouverneurs de trois territoires : Guam, les Îles Mariannes du Nord et les Îles Vierges des États-Unis.'),
            ('Qu\'est-ce qu\'une élection de mi-mandat ?', 'L\'élection fédérale organisée au milieu du mandat de quatre ans du président. Les 435 sièges de la Chambre, environ un tiers du Sénat et la plupart des gouverneurs sont élus.'),
            ('Quand le nouveau Congrès entre-t-il en fonction ?', 'Le 3 janvier 2027 à midi, comme le fixe le 20e amendement pour chaque nouveau Congrès.'),
        ]
    else:
        name = {'D': 'los demócratas', 'R': 'los republicanos'}
        cap = {'D': 'Los demócratas', 'R': 'Los republicanos'}
        adj = {'D': 'demócrata', 'R': 'republicano'}
        ctrl = (f'<strong>{cap[P]} ganaron el control de la Cámara de Representantes y del Senado</strong> en las elecciones intermedias del 3 de noviembre de 2026, según los ganadores declarados por la agencia Associated Press.'
                if both else 'El control del Congreso tras las elecciones intermedias del 3 de noviembre de 2026: ' +
                ('; '.join(f'AP declara el control {adj[c["party"]]} {n}' if c['status'] == 'projected' else f'el control {n} aún no está decidido'
                           for n, c in (('del Senado', sc), ('de la Cámara', H)))) + '.')
        flip_s = f'De ellas, {len(fS)} cambian de partido' + (f', todas a favor de {name[next(iter(to(fS)))]}' if len(to(fS)) == 1 else '') if fS else 'Ninguna cambia de partido'
        flip_g = f'{len(fG)} gobernaciones cambian de partido' + (f', todas a favor de {name[next(iter(to(fG)))]}' if len(to(fG)) == 1 else '') if fG else 'ninguna gobernación cambia de partido'
        lead = (f'<p>{ctrl}</p>'
                f'<p>En el Senado, AP ha declarado ganador en {sC} de las 35 contiendas: {sD} demócratas y {sR} republicanos. {flip_s}. '
                f'Con los 65 escaños que no se renovaban, el grupo demócrata tiene {dtot} escaños y los republicanos {rtot}' + (f', más {sI} independiente' + ('s' if sI > 1 else '') if sI else '') + f', y {sU} contiendas siguen sin ganador declarado.</p>'
                f'<p>De las 36 elecciones a gobernador, AP ha declarado ganador en {gC}: {gD} demócratas y {gR} republicanos, y {flip_g}. '
                f'En la Cámara, AP ha declarado {hD} escaños para los demócratas y {hR} para los republicanos; {hU} siguen sin ganador declarado' + house_when('es') + ', y la mayoría es de 218.</p>')
        sen_control = (f'Antes de la votación los republicanos tenían {sb["R"]} escaños y los demócratas {sb["D"] + sb["I_caucus_D"]}, {sb["I_caucus_D"]} de ellos independientes que forman parte del grupo demócrata. '
                       f'Como el vicepresidente desempata, los demócratas necesitaban una ganancia neta de {need} escaños para tomar la mayoría.')
        house_control = (f'AP ha declarado que {name[H["party"]]} ganaron la mayoría.' if H['status'] == 'projected' else 'AP aún no ha declarado qué partido ganó la mayoría.')
        history = ('<p>En las 23 elecciones intermedias de 1934 a 2022, el partido del presidente ganó escaños en la Cámara solo tres veces: en 1934, 1998 y 2002 '
                   '(American Presidency Project, Universidad de California en Santa Bárbara). En todas las demás perdió escaños. En 2026 el presidente, Donald Trump, '
                   'es republicano, y los republicanos controlaban la Cámara y el Senado antes de la votación.</p>')
        faq = [
            ('¿Quién ganó las elecciones intermedias de 2026?', re.sub('<[^>]+>', '', ctrl) + f' AP ha declarado ganador en {sC} de las 35 contiendas al Senado y en {gC} de las 36 a gobernador; el resto sigue sin ganador declarado.'),
            ('¿Cuándo fueron las elecciones intermedias de 2026?', 'El martes 3 de noviembre de 2026. Muchos estados abrieron el voto anticipado o por correo semanas antes.'),
            ('¿Cuántos escaños del Senado estaban en juego en 2026?', '35: los 33 escaños de la clase 2 y dos elecciones especiales, en Ohio y Florida, por los escaños que JD Vance y Marco Rubio dejaron en enero de 2025.'),
            ('¿Cuántos gobernadores se eligieron en 2026?', 'Treinta y seis, en 36 estados, más los gobernadores de tres territorios: Guam, las Islas Marianas del Norte y las Islas Vírgenes de EE.UU.'),
            ('¿Qué es una elección intermedia?', 'La elección federal que se celebra a mitad del mandato de cuatro años del presidente. Se eligen los 435 escaños de la Cámara, alrededor de un tercio del Senado y la mayoría de los gobernadores.'),
            ('¿Cuándo empieza el nuevo Congreso?', 'Al mediodía del 3 de enero de 2027, como fija la Enmienda 20 para cada nuevo Congreso.'),
        ]
    return dict(lead=lead, sen_control=sen_control, house_control=house_control, history=history, faq=faq)


def page(lang):
    t = {**T[lang], **prose(lang)}
    url = BASE + PATHS[lang]
    alts = ''.join(f'  <link rel="alternate" hreflang="{l}" href="{BASE + p}">\n' for l, p in PATHS.items())
    alts += f'  <link rel="alternate" hreflang="x-default" href="{BASE + PATHS["en"]}">\n'
    keys = [(f'{count(SENATE)}/35', t['n_senate']), (f'{count(GOV)}/36', t['n_gov']),
            (str(count(SENATE, flip=True)), t['n_flip_s']), (str(count(GOV, flip=True)), t['n_flip_g'])]
    keys_html = ''.join(f'<li><b>{k}</b>{esc(v)}</li>' for k, v in keys)
    pend = [(sname(lang, r['usps']) + (f' ({t["special"]})' if r.get('special') else ''), r) for r in SENATE if r['status'] != 'called']
    pend_g = [(sname(lang, r['usps']), r) for r in GOV if r['status'] != 'called']
    sep = ' : ' if lang == 'fr' else ': '
    if pend or pend_g:
        pend_html = ('<ul>' + f'<li><b>{esc(t["tab_s"])}</b>{sep}{esc(", ".join(n for n, _ in pend) or "0")}</li>'
                     + f'<li><b>{esc(t["tab_g"])}</b>{sep}{esc(", ".join(n for n, _ in pend_g) or "0")}</li></ul>')
    else:
        pend_html = f'<p>{esc(t["pending_none"])}</p>'
    leg = ''.join(f'<li><span class="dot p{k}"></span>{esc(v)}</li>' for k, v in t['leg'].items())
    faq_html = ''.join(f'<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>\n' for q, a in t['faq'])
    faq_ld = json.dumps({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in t['faq']]}, ensure_ascii=False)
    crumbs = json.dumps({'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': t['home_name'], 'item': BASE + t['home']},
        {'@type': 'ListItem', 'position': 2, 'name': t['learn_name'], 'item': BASE + t['learn']},
        {'@type': 'ListItem', 'position': 3, 'name': t['crumb'], 'item': url}]}, ensure_ascii=False)
    related = ''.join(f'<a href="{u}">{esc(n)}</a>' for u, n in t['related'])
    back_href = t['learn'] if lang != 'en' else '/'
    return f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
  <!-- Google tag (gtag.js) -->
  <!-- adsense-head -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1481624152917622"
     crossorigin="anonymous"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', 'G-P7ZBQNYLS4');
    // gtag.js only after consent (config.js asks; CNIL rules for a publisher in France).
    try {{ var sdc = JSON.parse(localStorage.getItem('statedoku_consent') || 'null');
      if (sdc && sdc.v === 'yes' && Date.now() - sdc.t < 15724800000) {{
        var sdg = document.createElement('script'); sdg.async = true;
        sdg.src = 'https://www.googletagmanager.com/gtag/js?id=G-P7ZBQNYLS4'; document.head.appendChild(sdg); }} }} catch (e) {{}}
  </script>

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#FFFFFF">
  <meta name="color-scheme" content="light">
  <title>{esc(t["title"])}</title>
  <meta name="description" content="{esc(t["desc"])}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="{url}">
{alts}  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=35">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{esc(t["h1"])}">
  <meta property="og:description" content="{esc(t["desc"])}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{BASE}/og-image.png?v=2">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(t["h1"])}">
  <meta name="twitter:description" content="{esc(t["desc"])}">
  <meta name="twitter:image" content="{BASE}/og-image.png?v=2">
  <style>{CSS}
  </style>
  <script type="application/ld+json">{crumbs}</script>
  <script type="application/ld+json">{faq_ld}</script>
</head>
<body class="legal-body">

<header>
  <a href="{t["home"]}" class="logo">State<em>doku</em></a>
  <nav class="nav-actions"><a href="{back_href}" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem;">{t["back"]}</a></nav>
</header><main>
  <section class="hp-hero">
    <p class="crumb"><a href="{t["home"]}">{esc(t["home_name"])}</a> · <a href="{t["learn"]}">{esc(t["learn_name"])}</a> · {esc(t["crumb"])}</p>
    <h1>{esc(t["h1"])}</h1>
    <p class="meta">{esc(t["sub"])}</p>
  </section>
  <div class="hp-main">
    <div class="answer">
      {t["lead"]}
      <p class="asof">{esc(t["asof"].format(t=stamp(lang)))}</p>
    </div>
    <ul class="keys">{keys_html}</ul>

    <h2>{esc(t["map_h"])}</h2>
    <div class="mt-tabs" role="group"><button type="button" class="mt-tab" data-m="s" aria-pressed="true">{esc(t["tab_s"])}</button><button type="button" class="mt-tab" data-m="g" aria-pressed="false">{esc(t["tab_g"])}</button></div>
    <div id="mt-map"></div>
    <ul class="legend">{leg}</ul>
    <p class="note">{esc(t["map_note"])}</p>

    <div class="ad-slot" data-ad-slot="PLACEHOLDER_LEARN_MID" data-ad-format="auto"></div>

    <h2>{esc(t["sen_h"])}</h2>
    <p>{esc(t["sen_intro"])} {t["sen_control"]}</p>
    {rows_html(lang, SENATE)}

    <h2>{esc(t["gov_h"])}</h2>
    <p>{esc(t["gov_intro"])}</p>
    {rows_html(lang, GOV)}

    <h2>{esc(t["house_h"])}</h2>
    <p>{t["house_body"]} {t["house_control"]}</p>

    <h2>{esc(t["pending_h"])}</h2>
    {pend_html}

    <h2>{esc(t["hist_h"])}</h2>
    {t["history"]}

    <h2>{esc(t["next_h"])}</h2>
    <p>{esc(t["next_body"])}</p>

    <div class="cta-card">
      <h3>{esc(t["cta_h"])}</h3>
      <p>{esc(t["cta_p"])}</p>
      <a href="{t["cta_url"]}">{esc(t["cta_a"])}</a>
    </div>

    <section class="faq-rendered">
    <h2>{esc(t["faq_h"])}</h2>
    {faq_html}    </section>

    <h2>{esc(t["src_h"])}</h2>
    <p>{esc(t["src_body"])}</p>

    <h2>{esc(t["rel_h"])}</h2>
    <div class="related-grid">{related}</div>
  </div>
  <div class="ad-slot ad-slot-inline" data-ad-slot="PLACEHOLDER_LEARN_BOTTOM" data-ad-format="auto"></div>
</main><footer>
  <p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="https://www.reddit.com/r/Statedoku/" rel="noopener" target="_blank">Reddit</a> &nbsp;·&nbsp; {t["footer"]}</p>
</footer>
{MAP_JS % json.dumps(map_data(), separators=(',', ':'))}
<script src="/config.js?v=15"></script>
<script src="/js/admin.js?v=5"></script>
<script src="/js/ads.js?v=1"></script>
</body>
</html>
'''


DASHES = re.compile('[‐-―−]')
NB = ' '
for lang in PATHS:
    t = T[lang]
    assert 70 <= len(t['desc']) <= 160, (lang, len(t['desc']))
    out = page(lang)
    visible = re.sub(r'<(script|style)\b.*?</\1>', '', out, flags=re.S)
    assert not DASHES.search(visible), (lang, DASHES.findall(visible)[:3])
    if lang == 'fr':   # French spacing, outside tags and scripts
        parts = re.split(r'(<script(?! type="application/ld\+json").*?</script>|<style.*?</style>|<[^>]+>)', out, flags=re.S)
        out = ''.join(p if i % 2 else re.sub(r' ([:;?!%»])', NB + r'\1', p).replace('« ', '«' + NB) for i, p in enumerate(parts))
    p = ROOT / PATHS[lang].strip('/') / 'index.html'
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(out, encoding='utf-8')
    print(f'{p.relative_to(ROOT)}  {len(out):,} bytes, senate {count(SENATE)}/35 called, governors {count(GOV)}/36')
