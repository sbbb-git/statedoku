#!/usr/bin/env python3
"""Topics competitors publish about the US states that Statedoku has no page for.

Owner, 23 November 2026, after a video on reading competitors' sitemaps: the
weekly keyword reading (collect-bing-keywords.mjs) only seeds the site's own
taxonomy, so it can never find a subject the site has not thought of. This
script reads the public sitemaps of a few sites on the same subject, keeps the
pages about the US states, turns each URL into a topic, drops the topics the
site already covers, and ranks what is left by how many competitors cover it.

Two outputs:
- seo-snapshots/competitor-gaps-<date>.md, the report (repo only, not deployed);
- scripts/seo/competitor-seeds.json, the best gap topics as search phrases,
  which collect-bing-keywords.mjs adds to its seeds, so the next Saturday
  reading says how often each is searched on Bing.

A gap is a question for the weekly routine, not a page to write: a topic goes
to scripts/content/QUEUE.md only once the Bing reading shows demand, and the
usual rules hold (no template family, at most three new pages a week, every
fact checked). Per-state families ("<state> state bird") are reported apart:
the site answers them on its state pages, never with one page per state.

    python3 scripts/seo/competitor-gaps.py              # fetch, report, seeds
    python3 scripts/seo/competitor-gaps.py --volumes    # annotate with the latest Bing reading
"""
import datetime, glob, gzip, json, os, re, sys, time, urllib.request
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UA = 'Mozilla/5.0 (compatible; statedoku-research/1.0)'
# Public sitemaps, as each site's robots.txt lists them (23 November 2026).
COMPETITORS = {
    'worldpopulationreview.com': 'https://worldpopulationreview.com/sitemap-index.xml',
    '50states.com': 'https://www.50states.com/sitemap.xml',
    'statesymbolsusa.org': 'https://statesymbolsusa.org/sitemap.xml',
    'worldatlas.com': 'https://www.worldatlas.com/webmap/sitemap-index.xml',
}
MAX_CHILD = 80          # child sitemaps read per site
MAX_URLS = 250_000      # URLs read per site
MAX_SEEDS = 40
STOP = set('a an and are as at by for from how in is it of on or the to what which who why with vs list '
           'page index html php www com org en us usa america american united states state 50 all top'.split())
GEO = re.compile(r'elevat|river|lake|mountain|peak|coast|border|area|size|population|capital|flag|bird|flower|'
                 r'tree|nickname|motto|histor|found|admit|statehood|time-?zone|climate|tornado|earthquake|'
                 r'hurricane|park|island|volcan|desert|forest|count(y|ies)|cit(y|ies)|name|shape|small|larg|'
                 r'high|low|old|quiz|map|region|territor|coloni|president|senat|elector|symbol|animal|song|'
                 r'geograph|landlocked|ocean|gulf|canyon|cave|weather|snow|rain|temperature|latitude|abbrev|dri|hot|cold|'
                 r'humid|wet|sunn|wind|flat|northwest|northeast|southwest|southeast|midwest|belt|panhandle|'
                 r'contiguous|commonwealth|plains|frontier|union|confedera|independen|republic|democracy', re.I)
# Population by origin ("albanian population by state"): one data template per group, not a subject.
ORIGIN = re.compile(r'^(?!population)[a-z]+ population by state$')
ADJ = re.compile(r'educat|rich|poor|cost|expensive|cheap|tax|sport|tallest|populous|gdp|income', re.I)
SENSITIVE = re.compile(r'abortion|consent|death|deadl|obes|religio|medicaid|welfare|gun|drug|crime|prison|cup size|trucial|unitary|legal|carry|reciprocity|independent states|state park|production', re.I)


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Encoding': 'gzip'})
    with urllib.request.urlopen(req, timeout=40) as r:
        data = r.read()
    if data[:2] == b'\x1f\x8b':
        data = gzip.decompress(data)
    return data.decode('utf-8', 'replace')


def read_sitemap(url, out, depth=0, budget=None):
    budget = budget if budget is not None else {'child': 0}
    try:
        xml = fetch(url)
    except Exception as e:
        print(f'  skip {url}: {type(e).__name__}', file=sys.stderr)
        return
    locs = re.findall(r'<loc>\s*([^<\s]+)\s*</loc>(?:\s*<lastmod>\s*([^<\s]+))?', xml)
    if '<sitemapindex' in xml[:2000] or (locs and all(l.endswith(('.xml', '.xml.gz')) for l, _ in locs[:20])):
        for loc, _ in locs:
            if budget['child'] >= MAX_CHILD or len(out) >= MAX_URLS:
                break
            budget['child'] += 1
            time.sleep(0.5)
            read_sitemap(loc, out, depth + 1, budget)
    else:
        for loc, lastmod in locs:
            if len(out) >= MAX_URLS:
                break
            out.append((loc, lastmod[:10] if lastmod else ''))


def state_slugs():
    states = json.load(open(os.path.join(ROOT, 'data', 'states.json'), encoding='utf-8'))
    return sorted({re.sub(r'[^a-z]+', '-', s['names']['en'].lower()).strip('-') for s in states}, key=len, reverse=True)


STATES = state_slugs()
STATE_RX = re.compile(r'(?<![a-z])(' + '|'.join(re.escape(s) for s in STATES) + r')(?![a-z])')
# "west virginia" contains "virginia": the longest names are tried first.


def topic_of(url):
    """The last meaningful path segment, as words, with any state name replaced by {state}."""
    path = re.sub(r'^https?://[^/]+', '', url).split('?')[0].strip('/').lower()
    segs = [s for s in path.split('/') if s and not re.fullmatch(r'\d+|page|amp|en', s)]
    if not segs:
        return None, False
    seg = re.sub(r'\.(html?|php|aspx)$', '', segs[-1])
    seg = re.sub(r'-\d{3,}$', '', seg)                # trailing ids
    full = '-'.join(segs[-2:]) if len(segs) > 1 else seg
    has_state = bool(STATE_RX.search(full))
    if OFF.search(path):
        return None, False
    seg = LISTICLE.sub('', seg)
    words = STATE_RX.sub('{state}', seg).replace('_', '-')
    if '-' not in words:                              # one word: a code or a label, not a topic
        return None, False
    return words, has_state


# Not the site's subject: other countries, cities and towns, counties, zip and area codes.
OFF = re.compile(r'(?<![a-z])(australia\w*|brazil\w*|india|indian-states|nigeria\w*|german\w*|malaysia\w*|'
                 r'town|towns|city|cities|neighborhoods?|count(y|ies)|zip|zips|area-codes?|school-district\w*|'
                 r'hospital\w*|airports?|restaurants?|hotels?|universit\w*|colleges?|jobs?|salar\w*|'
                 r'lottery|casino\w*|best-places|places-to)(?![a-z])')
LISTICLE = re.compile(r'^(?:\d+|top-\d+)-(?:of-the-)?(?:best-|most-(?=(?:beautiful|stunning|charming))|prettiest-|'
                      r'adorable-|coziest-|easygoing-|stunning-|charming-|beautiful-)?')


def relevant(url):
    p = url.lower()
    return bool(STATE_RX.search(p)) or bool(re.search(r'(?<![a-z])(states?|capitals?|united-states|us-states|usa)(?![a-z])', p))


def norm_tokens(text):
    return {w for w in re.findall(r'[a-z]+', text.lower().replace('{state}', ' ')) if w not in STOP and len(w) > 2}


def our_pages():
    """Our indexable pages: path, title and h1, as token sets."""
    lm = open(os.path.join(ROOT, 'functions', '_sitemap-lastmod.js'), encoding='utf-8').read()
    paths = re.findall(r'"(/[^"]*)":', lm)
    out = []
    for p in paths:
        f = os.path.join(ROOT, p.strip('/'), 'index.html') if p != '/' else os.path.join(ROOT, 'index.html')
        try:
            s = open(f, encoding='utf-8').read()
        except OSError:
            continue
        t = re.search(r'<title>(.*?)</title>', s, re.S)
        h = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
        d = re.search(r'<meta name="description" content="([^"]*)"', s)
        text = ' '.join([p.replace('-', ' ').replace('/', ' '), t.group(1) if t else '', re.sub('<[^>]+>', '', h.group(1)) if h else '', d.group(1) if d else ''])
        out.append((p, norm_tokens(text)))
    return out


def covered(tokens, pages):
    """Best overlap with one of our pages: share of the topic's words found in it."""
    if not tokens:
        return 1.0, None
    best, where = 0.0, None
    for p, t in pages:
        score = len(tokens & t) / len(tokens)
        if score > best:
            best, where = score, p
    return best, where


def main():
    today = datetime.date.today().isoformat()
    if '--volumes' in sys.argv:
        return volumes()
    pages = our_pages()
    print(f'our indexable pages: {len(pages)}')
    standalone = defaultdict(lambda: {'sites': set(), 'urls': [], 'last': ''})
    families = defaultdict(lambda: {'sites': set(), 'states': set(), 'example': ''})
    read_counts = {}
    cache_file = next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == '--cache' and i + 1 < len(sys.argv)), None)
    cache = json.load(open(cache_file)) if cache_file and os.path.exists(cache_file) else {}
    for site, sm in COMPETITORS.items():
        urls = [tuple(x) for x in cache.get(site, [])]
        if not urls:
            read_sitemap(sm, urls)
            cache[site] = urls
        rel = [(u, m) for u, m in urls if relevant(u)]
        read_counts[site] = (len(urls), len(rel))
        print(f'{site}: {len(urls)} URLs read, {len(rel)} about the US states')
        for u, m in rel:
            words, has_state = topic_of(u)
            if not words:
                continue
            if '{state}' in words:
                key = words
                fam = families[key]
                fam['sites'].add(site.split('/')[0]); fam['example'] = fam['example'] or u
                st = STATE_RX.search(u.lower())
                if st:
                    fam['states'].add(st.group(1))
            elif not has_state:
                key = ' '.join(sorted(norm_tokens(words)))
                if not key:
                    continue
                e = standalone[key]
                e['sites'].add(site.split('/')[0]); e['urls'].append(u); e['last'] = max(e['last'], m or '')
                e.setdefault('phrase', words.replace('-', ' '))
    if cache_file:
        json.dump(cache, open(cache_file, 'w'))
    if not sum(r for _, r in read_counts.values()):
        sys.exit('No competitor URL about the US states was read: a hollow report would look like a real one.')

    gaps = []
    for key, e in standalone.items():
        toks = set(key.split())
        score, where = covered(toks, pages)
        if score >= 0.67:
            continue
        geo = bool(GEO.search(e['phrase']))
        gaps.append({'phrase': e['phrase'], 'sites': sorted(e['sites']), 'n_sites': len(e['sites']),
                     'geo': geo, 'last': e['last'], 'url': e['urls'][0], 'closest': where, 'overlap': round(score, 2)})
    gaps.sort(key=lambda g: (-g['n_sites'], -int(g['geo']), g['last'] < '2026', g['phrase']))
    fams = [(k, v) for k, v in families.items() if len(v['states']) >= 10]
    fams.sort(key=lambda kv: (-len(kv[1]['sites']), -len(kv[1]['states'])))

    # Seeds: geographic gaps first, phrased the way people search.
    seeds = []
    def take(pred):
        for g in gaps:
            ph = re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', g['phrase'].lower())).strip()
            if len(seeds) >= MAX_SEEDS:
                return
            if (pred(g) and 2 <= len(ph.split()) <= 7 and ph not in seeds and not ORIGIN.match(ph)
                    and re.search(r'(?<![a-z])states?(?![a-z])', ph)):
                seeds.append(ph)
    take(lambda g: g['n_sites'] >= 2 and g['geo'])          # two sites cover it, on the site's subject
    # Two sites cover it and the site already has the family (education, income, cost, taxes,
    # sports, buildings): never law, health or religion, which are off its subject.
    take(lambda g: g['n_sites'] >= 2 and ADJ.search(g['phrase']) and not SENSITIVE.search(g['phrase']))
    take(lambda g: g['geo'] and len(g['phrase'].split()) <= 4 and not SENSITIVE.search(g['phrase']))   # one site, short and geographic
    json.dump({'generated': today, 'source': 'scripts/seo/competitor-gaps.py', 'seeds': seeds},
              open(os.path.join(ROOT, 'scripts', 'seo', 'competitor-seeds.json'), 'w'), indent=1)

    lines = [f'# Competitor gaps, {today}', '',
             'Topics about the US states that other sites publish and Statedoku has no page for, from their '
             'public sitemaps. Written by `scripts/seo/competitor-gaps.py`. A gap is a question, not a page to '
             'write: it goes to `scripts/content/QUEUE.md` only once the Bing reading shows demand '
             '(`--volumes` after the next Saturday collection).', '',
             '## Sites read', '']
    lines += [f'- {s}: {n:,} URLs read, {r:,} about the US states' for s, (n, r) in read_counts.items()]
    lines += ['', f'Our indexable pages compared: {len(pages)}. A topic counts as covered when two thirds of its words '
              'appear in the path, title or h1 of one of our pages.', '',
              f'## Gaps, {len(gaps)} topics ({sum(g["geo"] for g in gaps)} geographic)', '',
              '| Topic | Sites | Geographic | Last changed | Closest page of ours |', '|---|---|---|---|---|']
    for g in gaps[:150]:
        lines.append(f'| {g["phrase"]} | {", ".join(g["sites"])} | {"yes" if g["geo"] else ""} | {g["last"] or "?"} | '
                     f'{g["closest"] or ""} ({int(g["overlap"]*100)}%) |')
    lines += ['', f'## Per-state families, {len(fams)} (answered on the state pages, never one page per state)', '',
              '| Family | Sites | States | Example |', '|---|---|---|---|']
    for k, v in fams[:60]:
        lines.append(f'| {k.replace("-", " ")} | {", ".join(sorted(v["sites"]))} | {len(v["states"])} | {v["example"]} |')
    lines += ['', f'## Seeds for the Bing reading ({len(seeds)})', '', ', '.join(seeds) or 'none', '']
    out = os.path.join(ROOT, 'seo-snapshots', f'competitor-gaps-{today}.md')
    open(out, 'w', encoding='utf-8').write('\n'.join(lines))
    print(f'{len(gaps)} gap topics, {len(fams)} per-state families, {len(seeds)} seeds; wrote {out}')


def volumes():
    seeds = json.load(open(os.path.join(ROOT, 'scripts', 'seo', 'competitor-seeds.json')))['seeds']
    files = sorted(glob.glob(os.path.join(ROOT, 'seo-snapshots', 'bing-keywords-*.json')))
    if not files:
        sys.exit('no Bing keyword reading yet')
    rows = json.load(open(files[-1]))['rows']
    by = {}
    for r in rows:
        k = r.get('keyword') or {}
        if r.get('seed'):
            by[r['seed']] = k.get('Impressions')
    found = [(s, by[s]) for s in seeds if s in by]
    print(f'{os.path.basename(files[-1])}: {len(found)} of {len(seeds)} competitor seeds measured')
    for s, v in sorted(found, key=lambda x: -(x[1] or 0)):
        print(f'{v or 0:>8}  {s}')


if __name__ == '__main__':
    main()
