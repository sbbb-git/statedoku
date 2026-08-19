#!/usr/bin/env python3
"""Rebuild data/tweets.json as a two-slot bank.

Every day posts exactly two tweets:
  slot "game" - links to the game itself
  slot "page" - links to the content page that the tweet is actually about

The old bank was one flat list where 24% of entries happened to carry a link,
all four of them pointing at the same handful of URLs. Which link went out on
a given day was luck.

Slot assignment is by angle. The four angles that talk about the game go to the
game slot; the eight that state a fact go to the page slot, where each one is
matched to a real page on the site.

Link targets are resolved against the filesystem and every one is checked for a
noindex meta, so no tweet ever points at a page we tell Google to ignore.
"""
import json, pathlib, re, sys, unicodedata
from collections import Counter

ROOT = pathlib.Path('.')
BANK = ROOT / 'data' / 'tweets.json'
SITE = 'https://statedoku.com'

GAME_ANGLES = {'puzzle-cta', 'engagement-questions', 'teacher-classroom', 'seasonal-timely'}

# Topic keyword -> page slug under /learn/. First match in this order wins, so
# the more specific patterns are listed before the general ones.
TOPIC_RULES = [
    (r'\blicen[cs]e plate', 'learn/state-license-plates'),
    (r'\bnational park', 'learn/national-parks-by-state'),
    (r'\bstate quarter|\bquarter\b', 'learn/state-quarters'),
    (r'\bmotto', 'learn/state-mottos'),
    (r'\bnickname', 'learn/state-nicknames'),
    (r'\bstate song|\banthem', 'learn/state-songs'),
    (r'\bstate bird|\bbird\b', 'learn/state-birds'),
    (r'\bstate flower|\bflower\b|\bblossom', 'learn/state-flowers'),
    (r'\bstate tree|\btree\b', 'learn/state-trees'),
    (r'\bflag\b', 'learn/state-flags'),
    (r'\babbreviation|\bpostal code', 'learn/state-abbreviations'),
    (r'\blandlocked', 'learn/landlocked-states'),
    (r'\btime zone|\btimezone', 'learn/states-by-time-zone'),
    (r'\bincome tax|\bsales tax|\bno tax', 'learn/no-income-tax'),
    (r'\belectoral college|\belectoral vote', 'learn/electoral-college'),
    (r'\bthirteen colonies|\b13 colonies|\boriginal colon', 'learn/13-colonies'),
    (r'\bhighest point|\bhighest peak|\belevation|\bmount\b|\bsummit', 'learn/highest-mountain-in-each-state'),
    (r'\briver\b', 'learn/longest-rivers-in-each-state'),
    (r'\bborders? canada|\bcanadian border', 'learn/states-bordering-canada'),
    (r'\bborders? mexico|\bmexican border', 'learn/states-bordering-mexico'),
    (r'\bstatehood|\badmitted|\bjoined the union|\bratified', 'learn/states-by-statehood-year'),
    (r'\bgdp\b|\beconomy|\bexports?\b', 'learn/states-by-gdp-ranking'),
    (r'\bpopulation|\bpopulous|\bresidents\b', 'learn/states-by-population'),
    (r'\blargest state|\bbiggest state|\bsquare miles|\barea\b', 'learn/largest-states'),
    (r'\bcapital', 'learn/states-and-capitals'),
    (r'\bpronounc', 'learn/state-capitals-pronunciation'),
    (r'\bcost of living|\bcheapest|\bexpensive', 'learn/states-by-cost-of-living'),
    (r'\bcrossword', 'learn/crossword-helper'),
]

# Used when a tweet names several states or none, and no keyword matched.
ANGLE_FALLBACK = {
    'border-quirks':      'regions',
    'capitals':           'learn/states-and-capitals',
    'geography-extremes': 'facts',
    'misconceptions':     'facts',
    'names-etymology':    'learn/state-nicknames',
    'population-economy': 'learn/states-by-population',
    'statehood':          'learn/states-by-statehood-year',
    'symbols':            'learn/state-flags',
}


def slugify(name):
    s = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def is_indexable(path):
    """A page counts as a link target only if it exists and is not noindexed."""
    f = ROOT / path / 'index.html'
    if not f.is_file():
        return False
    head = f.read_text(encoding='utf-8', errors='ignore')[:8000]
    return 'content="noindex' not in head


def tweet_length(text):
    """X counts every URL as 23 characters regardless of its real length."""
    return len(re.sub(r'https?://\S+', 'x' * 23, text))


def strip_urls(text):
    t = re.sub(r'https?://\S+', '', text)
    return re.sub(r'\n{3,}', '\n\n', re.sub(r'[ \t]+', ' ', t)).strip()


def main():
    bank = json.loads(BANK.read_text(encoding='utf-8'))
    old = bank['tweets']

    states = json.loads((ROOT / 'data' / 'states.json').read_text(encoding='utf-8'))
    states = states if isinstance(states, list) else states['states']
    state_names = {s['names']['en']: slugify(s['names']['en']) for s in states}

    # Resolve and verify every target we might use, once, up front.
    targets = {}
    for slug in set(list(state_names.values())):
        p = f'states/{slug}'
        if is_indexable(p):
            targets[p] = f'{SITE}/{p}/'
    for _, p in TOPIC_RULES:
        if is_indexable(p):
            targets[p] = f'{SITE}/{p}/'
    for p in ANGLE_FALLBACK.values():
        if is_indexable(p):
            targets[p] = f'{SITE}/{p}/'

    missing_topics = sorted({p for _, p in TOPIC_RULES if p not in targets})
    missing_angles = sorted({p for p in ANGLE_FALLBACK.values() if p not in targets})
    if missing_angles:
        sys.exit(f'angle fallback pages missing or noindexed: {missing_angles}')
    if missing_topics:
        print(f'note: {len(missing_topics)} topic pages unavailable, those rules will fall through:')
        for p in missing_topics:
            print(f'   {p}')

    # Longest name first, so "West Virginia" is consumed before "Virginia" can
    # match inside it. Without this, every West Virginia tweet counts as two
    # states and loses its state page to a generic fallback.
    by_length = sorted(state_names, key=len, reverse=True)

    def states_in(text):
        found, taken = [], []
        for n in by_length:
            for m in re.finditer(r'\b' + re.escape(n) + r'\b', text, re.I):
                if any(m.start() < e and s < m.end() for s, e in taken):
                    continue                       # inside a longer name already claimed
                taken.append((m.start(), m.end()))
                found.append((m.start(), n))
                break                              # one mention per state is enough
        return sorted(found)

    def match_page(text, angle):
        """Pick the most relevant real page for a fact tweet."""
        named = states_in(text)
        if len(named) == 1:
            p = f'states/{state_names[named[0][1]]}'
            if p in targets:
                return p, 'state'
        low = text.lower()
        for rx, p in TOPIC_RULES:
            if p in targets and re.search(rx, low):
                return p, 'topic'
        if named:                                    # several states, no keyword
            named.sort()
            p = f'states/{state_names[named[0][1]]}'
            if p in targets:
                return p, 'state-first'
        p = ANGLE_FALLBACK[angle]
        return p, 'angle'

    game, page, skipped = [], [], []
    how = Counter()

    for t in old:
        body = strip_urls(t['text'])
        if not body:
            skipped.append((t['i'], 'empty after stripping url'))
            continue

        if t['angle'] in GAME_ANGLES:
            text = f'{body}\n\n{SITE}'
            if tweet_length(text) > 280:
                skipped.append((t['i'], f'too long: {tweet_length(text)}'))
                continue
            game.append({'text': text, 'angle': t['angle'], 'url': SITE})
        else:
            p, kind = match_page(body, t['angle'])
            how[kind] += 1
            url = targets[p]
            text = f'{body}\n\n{url}'
            if tweet_length(text) > 280:
                skipped.append((t['i'], f'too long: {tweet_length(text)}'))
                continue
            page.append({'text': text, 'angle': t['angle'], 'url': url, 'page': '/' + p + '/'})

    # Interleave angles so consecutive days never repeat a theme.
    def spread(items):
        buckets = {}
        for it in items:
            buckets.setdefault(it['angle'], []).append(it)
        order = sorted(buckets, key=lambda a: -len(buckets[a]))
        out, n = [], 0
        while n < len(items):
            for a in order:
                if buckets[a]:
                    out.append(buckets[a].pop(0))
                    n += 1
        return out

    game, page = spread(game), spread(page)
    for i, t in enumerate(game):
        t['i'] = i
    for i, t in enumerate(page):
        t['i'] = i

    out = {
        'version': 2,
        'generated': bank.get('generated'),
        'note': ('Two-slot tweet bank. Each day posts one tweet from "game" linking to the '
                 'puzzle and one from "page" linking to the page it is about. The worker '
                 'indexes each list by day number and wraps rather than running out.'),
        'slots': {
            'game': {'count': len(game), 'tweets': game},
            'page': {'count': len(page), 'tweets': page},
        },
    }
    BANK.write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print(f'game slot: {len(game)} tweets  ({len(game)} days before repeating)')
    print(f'page slot: {len(page)} tweets  ({len(page)} days before repeating)')
    print(f'page-link matching: {dict(how)}')
    print(f'distinct page URLs: {len(set(t["url"] for t in page))}')
    if skipped:
        print(f'skipped {len(skipped)}:')
        for i, why in skipped[:10]:
            print(f'   #{i} {why}')


if __name__ == '__main__':
    main()
