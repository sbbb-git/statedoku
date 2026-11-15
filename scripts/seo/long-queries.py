#!/usr/bin/env python3
"""Long questions: the searches of 7 words or more, or that start like a
question, that Google and Bing showed statedoku.com for. They are the precise
questions people also put to ChatGPT, and the ones with many impressions and
few clicks are the cheapest win: answer them at the top of the page already
shown for them (Coincheur's "questions longues", 15 November 2026).

Reads the latest committed readings in seo-snapshots/ (gsc-<date>.json and
bing-<date>.json, no API call) and writes seo-snapshots/long-queries-<date>.md:
one table per engine, most impressions first and, at equal impressions, fewest
clicks. Google gives the page it served (query x page); Bing's reading has no
query to page cut, so its table leaves the page to find. Prints how many
queries it read and kept.

    python3 scripts/seo/long-queries.py
"""
import glob, json, os, re
from collections import defaultdict
from datetime import datetime, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SNAP = os.path.join(ROOT, 'seo-snapshots')
MIN_WORDS = 7
# Question openers in the site's three languages.
ASK = re.compile(r'^(how|what|which|why|when|where|who|whose|is|are|was|were|does|do|did|can|could|should|will|'
                 r'comment|combien|quand|pourquoi|quel|quelle|quels|quelles|qui|que|quoi|où|est-ce|qu\'est-ce|'
                 r'cómo|como|cuántos|cuantos|cuántas|cuál|cual|cuáles|qué|que|quién|dónde|donde|cuándo|por qué|porque)\b', re.I)


def wanted(q):
    q = q.strip().lower()
    return len(q.split()) >= MIN_WORDS or bool(ASK.match(q))


def latest(prefix):
    files = sorted(f for f in glob.glob(os.path.join(SNAP, prefix + '-2*.json')))
    return files[-1] if files else None


def google():
    f = latest('gsc')
    if not f: return None, [], 0
    d = json.load(open(f))
    rows = next(iter(d['data'].values()))
    qp = defaultdict(list)
    for r in rows.get('by_query_page', []):
        qp[r['keys'][0]].append((r['impressions'], r['keys'][1]))
    seen = rows.get('by_query', [])
    out = []
    for r in seen:
        q = r['keys'][0]
        if not wanted(q): continue
        page = max(qp[q])[1].replace('https://statedoku.com', '') if qp.get(q) else ''
        out.append((r['impressions'], r['clicks'], round(r['position'], 1), q, page))
    w = d.get('window', {})
    return f'{os.path.basename(f)}, {w.get("startDate")} to {w.get("endDate")}', out, len(seen)


def bing(days=28):
    f = latest('bing')
    if not f: return None, [], 0
    d = json.load(open(f))
    rows = next(iter(d['data'].values())).get('GetQueryStats', [])
    if not rows: return os.path.basename(f), [], 0
    dates = [datetime.fromisoformat(r['Date'].replace('Z', '+00:00')) for r in rows]
    start = max(dates) - timedelta(days=days)
    agg = defaultdict(lambda: [0, 0, 0.0])
    for r, dt in zip(rows, dates):
        if dt <= start: continue
        a = agg[r['Query']]
        a[0] += r['Impressions']; a[1] += r['Clicks']; a[2] += r['AvgImpressionPosition'] * r['Impressions']
    out = [(a[0], a[1], round(a[2] / a[0], 1) if a[0] else 0, q, '') for q, a in agg.items() if wanted(q) and a[0]]
    return f'{os.path.basename(f)}, last {days} days to {max(dates):%Y-%m-%d}', out, len(agg)


def table(rows, n=30):
    rows = sorted(rows, key=lambda r: (-r[0], r[1]))[:n]
    if not rows: return '_None this week._\n'
    s = '| Impressions | Clicks | Position | Query | Page shown |\n| ---: | ---: | ---: | --- | --- |\n'
    return s + ''.join(f'| {i} | {c} | {p} | {q.replace("|", "/")} | {pg} |\n' for i, c, p, q, pg in rows)


gsrc, grows, gn = google()
bsrc, brows, bn = bing()
date = datetime.utcnow().strftime('%Y-%m-%d')
md = (f'# Long questions, {date}\n\nSearches of {MIN_WORDS} words or more, or starting like a question (EN, FR, ES), '
      'most impressions first, fewest clicks first at equal impressions. Built by scripts/seo/long-queries.py. '
      'Use: take one to three with impressions and few clicks; if the page shown already covers the subject, answer the '
      'question in one to three sentences at the top of that page; if no page answers it, it becomes a queue item.\n\n'
      f'## Google ({gsrc})\n\n{table(grows)}\n## Bing ({bsrc})\n\nBing\'s reading has no query to page cut: find the page '
      f'that targets the query.\n\n{table(brows)}')
assert not re.search('[‐-―−]', md)
out = os.path.join(SNAP, f'long-queries-{date}.md')
open(out, 'w').write(md)
print(f'Google: {gn} queries read, {len(grows)} long. Bing: {bn} queries read, {len(brows)} long. -> {os.path.relpath(out, ROOT)}')
