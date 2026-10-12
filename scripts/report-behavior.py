#!/usr/bin/env python3
"""Turn the latest GA4 reading into a visitor-path report.

Answers, in order: where visitors come from, where they land, where they
stay, where they go next, where they leave, and how far they get in the games.
Reads audience-snapshots/ga4-*.json (written by scripts/collect-ga4.mjs) and
prints Markdown, or writes it with --out.

GA4's Data API has no exits metric, so exits are derived: the views of a page
minus the views of any statedoku.com page whose referrer is that page. A view
whose referrer is the same page (a reload) counts as neither. Back-button
returns and second tabs blur this a little; read it as an estimate.

About half the "(direct)" traffic shows almost no engagement and behaves like
automated visits, so every table also gives engaged sessions, which bots
rarely produce. Judge by those.

Usage:
  python3 scripts/report-behavior.py                 # newest reading
  python3 scripts/report-behavior.py --in FILE --out FILE.md
"""
import argparse, collections, glob, json, os, sys
from urllib.parse import urlsplit

MIN_VIEWS = 20      # pages below this are noise for rates
MIN_USERS = 15      # and below this many visitors, time per visitor is one person's habit
TOP = 12


def norm(url_or_path):
    """'https://www.statedoku.com/fr/?x=1#y' -> '/fr/'."""
    if not url_or_path:
        return ''
    s = urlsplit(url_or_path)
    path = s.path if (s.scheme or s.netloc) else url_or_path.split('?')[0].split('#')[0]
    if not path.startswith('/'):
        path = '/' + path
    if not path.endswith('/') and '.' not in path.rsplit('/', 1)[-1]:
        path += '/'
    return path


def rows(data, cut):
    c = data.get(cut) or {}
    return c.get('rows') or []


def pct(a, b):
    return f'{round(100 * a / b)}%' if b else 'n/a'


def secs(total, n):
    return f'{round(total / n)} s' if n else 'n/a'


def section(path):
    if path in ('/', '/fr/', '/es/'):
        return 'daily game (homepages)'
    for pre, name in (('/play/', 'mini-games'), ('/fr/play/', 'mini-games'), ('/es/play/', 'mini-games'),
                      ('/learn/', 'articles'), ('/fr/learn/', 'articles'), ('/es/learn/', 'articles'),
                      ('/states/', 'state pages'), ('/es/states/', 'state pages'),
                      ('/regions/', 'regions'), ('/cities/', 'cities'), ('/archive/', 'archive')):
        if path.startswith(pre):
            return name
    return 'other'


def build(snapshot):
    d = snapshot['data']
    out = []
    w = snapshot.get('window', {})
    out.append(f"# Visitor paths, statedoku.com\n\nGA4 reading of {snapshot.get('collected_at', '?')[:10]}, "
               f"window {w.get('startDate')} to {w.get('endDate')}.\n")
    missing = [c for c in ('by_channel', 'landing_by_source', 'transitions', 'events_by_page')
               if c not in d or (d[c].get('error'))]
    if missing:
        out.append(f"> Cuts missing from this reading: {', '.join(missing)}. "
                   'The sections that need them say so.\n')

    # 1. Where they come from
    out.append('## 1. Where they come from\n')
    ch = rows(d, 'by_channel')
    if ch:
        tot = sum(r['sessions'] for r in ch)
        out.append('| Channel | Sessions | Engaged sessions | Engaged rate | Avg engagement per session |')
        out.append('|---|---|---|---|---|')
        for r in sorted(ch, key=lambda r: -r['sessions']):
            out.append(f"| {r['sessionDefaultChannelGroup']} | {r['sessions']} ({pct(r['sessions'], tot)}) | "
                       f"{r['engagedSessions']} | {pct(r['engagedSessions'], r['sessions'])} | "
                       f"{secs(r.get('userEngagementDuration', 0), r['sessions'])} |")
        out.append('')
    src = rows(d, 'by_source')
    if src:
        out.append('Top sources by engaged sessions:\n')
        out.append('| Source / medium | Sessions | Engaged | Engaged rate |')
        out.append('|---|---|---|---|')
        for r in sorted(src, key=lambda r: -r.get('engagedSessions', 0))[:TOP]:
            out.append(f"| {r['sessionSource']} / {r['sessionMedium']} | {r['sessions']} | "
                       f"{r['engagedSessions']} | {pct(r['engagedSessions'], r['sessions'])} |")
        out.append('')

    # 2. Where they land
    out.append('## 2. Where they land\n')
    land = rows(d, 'landing_by_source')
    if land:
        by_page = collections.defaultdict(lambda: [0, 0, 0.0, 0])
        by_src = collections.defaultdict(collections.Counter)
        for r in land:
            p = norm(r['landingPage'])
            v = by_page[p]
            v[0] += r['sessions']; v[1] += r['engagedSessions']; v[2] += r.get('userEngagementDuration', 0); v[3] += r.get('screenPageViews', 0)
            by_src[p][r['sessionSourceMedium']] += r['engagedSessions']
        out.append('| Landing page | Sessions | Engaged | Engaged rate | Pages per session | Main engaged sources |')
        out.append('|---|---|---|---|---|---|')
        for p, v in sorted(by_page.items(), key=lambda kv: -kv[1][1])[:TOP]:
            srcs = ', '.join(f'{s} {n}' for s, n in by_src[p].most_common(3) if n)
            out.append(f"| `{p}` | {v[0]} | {v[1]} | {pct(v[1], v[0])} | {round(v[3] / v[0], 1) if v[0] else 'n/a'} | {srcs} |")
        sec = collections.defaultdict(lambda: [0, 0])
        for p, v in by_page.items():
            s = sec[section(p)]; s[0] += v[0]; s[1] += v[1]
        tot = sum(v[1] for v in sec.values())
        out.append('\nEngaged entrances by section: ' + ', '.join(
            f'{k} {v[1]} ({pct(v[1], tot)})' for k, v in sorted(sec.items(), key=lambda kv: -kv[1][1])) + '.\n')
    else:
        out.append('Not in this reading (needs the landing_by_source cut).\n')

    # 3. Where they stay
    out.append('## 3. Where they stay\n')
    pg = rows(d, 'by_page')
    views = collections.Counter()
    if pg:
        cand = [r for r in pg if r['screenPageViews'] >= MIN_VIEWS and r['activeUsers'] >= MIN_USERS]
        for r in pg:
            views[norm(r['pagePath'])] += r['screenPageViews']
        out.append(f'Pages with at least {MIN_USERS} visitors, by engagement time per visitor:\n')
        out.append('| Page | Visitors | Views | Engagement per visitor |')
        out.append('|---|---|---|---|')
        for r in sorted(cand, key=lambda r: -r['userEngagementDuration'] / max(1, r['activeUsers']))[:TOP]:
            out.append(f"| `{norm(r['pagePath'])}` | {r['activeUsers']} | {r['screenPageViews']} | "
                       f"{secs(r['userEngagementDuration'], r['activeUsers'])} |")
        out.append('')

    # 4 and 5. Where they go next, where they leave
    tr = rows(d, 'transitions')
    out.append('## 4. Where they go next\n')
    if tr and views:
        nxt = collections.defaultdict(collections.Counter)
        for r in tr:
            a, b = norm(r['pageReferrer']), norm(r['pagePath'])
            if a and a != b:
                nxt[a][b] += r['screenPageViews']
        for p, v in views.most_common(TOP):
            moved = sum(nxt[p].values())
            if not moved:
                out.append(f'- `{p}` ({v} views): no recorded next page.')
                continue
            top = ', '.join(f'`{q}` {n}' for q, n in nxt[p].most_common(4))
            out.append(f'- `{p}` ({v} views): {moved} continue on the site ({pct(moved, v)}), to {top}.')
        out.append('\n## 5. Where they leave\n')
        out.append('Exits estimated as views minus views that continue to another page of the site.\n')
        out.append('| Page | Views | Continue | Estimated exits | Exit rate |')
        out.append('|---|---|---|---|---|')
        ex = []
        for p, v in views.items():
            if v < MIN_VIEWS:
                continue
            moved = min(v, sum(nxt[p].values()))
            ex.append((v - moved, p, v, moved))
        for e, p, v, moved in sorted(ex, reverse=True)[:TOP]:
            out.append(f'| `{p}` | {v} | {moved} | {e} | {pct(e, v)} |')
        out.append('')
    else:
        out.append('Not in this reading (needs the transitions cut).\n')

    # 6. Games
    out.append('## 6. How far they get in the games\n')
    ev = rows(d, 'events_by_page')
    if ev:
        per = collections.defaultdict(collections.Counter)
        for r in ev:
            per[norm(r['pagePath'])][r['eventName']] += r['eventCount']
        daily = [(p, c) for p, c in per.items() if p in ('/', '/fr/', '/es/')]
        if daily:
            out.append('| Daily game | Page views | Started | Won | Lost | Shared to Classroom |')
            out.append('|---|---|---|---|---|---|')
            for p, c in sorted(daily):
                out.append(f"| `{p}` | {views.get(p, 0)} | {c['puzzle_start']} | {c['puzzle_solve']} | {c['puzzle_lost']} | {c['classroom_share']} |")
            out.append('')
        games = [(p, c) for p, c in per.items() if '/play/' in p and (c['play_start'] or c['play_complete'])]
        if games:
            out.append('| Mini-game page | Views | Started | Finished | Finish rate | Classroom shares |')
            out.append('|---|---|---|---|---|---|')
            for p, c in sorted(games, key=lambda pc: -pc[1]['play_start'])[:TOP * 2]:
                out.append(f"| `{p}` | {views.get(p, 0)} | {c['play_start']} | {c['play_complete']} | "
                           f"{pct(c['play_complete'], c['play_start']) if c['play_start'] else 'n/a'} | {c['classroom_share']} |")
            out.append('\nplay_start exists from 12 October 2026; before that only finishes were sent.\n')
        sc = [(p, c['scroll'], views.get(p, 0)) for p, c in per.items() if views.get(p, 0) >= MIN_VIEWS]
        if sc:
            out.append('Scrolled to 90% of the page (GA4 scroll event), most-viewed pages:\n')
            for p, s, v in sorted(sc, key=lambda x: -x[2])[:TOP]:
                out.append(f'- `{p}`: {s} of {v} views ({pct(s, v)})')
            out.append('')
    else:
        out.append('Not in this reading (needs the events_by_page cut).\n')
    return '\n'.join(out) + '\n'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--in', dest='src')
    ap.add_argument('--out')
    a = ap.parse_args()
    src = a.src or (sorted(glob.glob(os.path.join('audience-snapshots', 'ga4-*.json'))) or [None])[-1]
    if not src:
        print('[behavior] no GA4 reading found in audience-snapshots/', file=sys.stderr)
        return 0
    with open(src) as f:
        md = build(json.load(f))
    if a.out:
        with open(a.out, 'w') as f:
            f.write(md)
        print(f'[behavior] wrote {a.out} from {src}')
    else:
        print(md)
    return 0


if __name__ == '__main__':
    sys.exit(main())
