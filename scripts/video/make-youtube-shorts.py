#!/usr/bin/env python3
"""YouTube Shorts metadata for the 100 videos: scripts/video/youtube/shorts.csv.

Title (100 characters at most), description, tags and playlist for each
video, from the verified post texts in data/videos.json and the series of
scripts/video/videos.json. A link in a Shorts description is not clickable,
so the description names the site and points to the channel page, whose
links are. Videos: the safe-zone versions under media/videos/tiktok/ (Shorts
cover the bottom and the right edge like TikTok). Fails on a unicode dash or
an over-long title.

    python3 scripts/video/make-youtube-shorts.py
"""
import csv, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
bank = json.load(open(os.path.join(ROOT, 'data/videos.json'), encoding='utf-8'))['videos']
scripts = {s['slug']: s for s in json.load(open(os.path.join(HERE, 'videos.json'), encoding='utf-8'))}
SERIES = {  # playlist, hashtags shown above the title (3), extra tags
    'Guess the state': ('Guess the State by Its Shape', '#shorts #geography #50states', 'guess the state, state shapes quiz, us map quiz'),
    'Name the capital': ('State Capitals Quiz', '#shorts #geography #capitals', 'state capitals quiz, us capitals, capital cities'),
    'Tricky capitals': ('State Capitals Quiz', '#shorts #capitals #funfacts', 'state capitals, tricky capitals, largest city vs capital'),
    'Map challenge': ('US Map Challenges', '#shorts #maps #geography', 'us map challenge, map quiz, us geography'),
    'Odd one out': ('Odd One Out: US States', '#shorts #quiz #geography', 'odd one out quiz, us states trivia'),
    'Which came first': ('Which State Came First?', '#shorts #ushistory #quiz', 'statehood order, us history quiz, admission to the union'),
    'Bigger or smaller': ('Bigger or Smaller? US States', '#shorts #geography #funfacts', 'state size comparison, area quiz, population quiz'),
    'Postal codes': ('State Abbreviations Quiz', '#shorts #quiz #usa', 'state abbreviations, postal codes quiz, usps codes'),
    'Top list': ('US States Top Lists', '#shorts #geography #usa', 'us states facts, top 5 states, geography facts'),
}
BASE_TAGS = 'us geography, 50 states, geography quiz, learn the states, statedoku'
rows = []
for v in bank:
    s = scripts[v['slug']]
    playlist, tags_shown, extra = SERIES[s['series']]
    text = re.sub(r'https?://\S+', '', v['text'])
    text = re.sub(r'\s+#\w+', '', text).strip()
    title = f"{s['title']} | US geography quiz"
    if len(title) > 100: title = s['title'][:100]
    desc = (f"{text}\n\nA new US map puzzle every day, free, no sign-up: statedoku.com "
            f"(link on the channel page).\n\n{tags_shown}")
    tags = f'{extra}, {BASE_TAGS}'
    blob = title + desc + tags
    if re.search('[‒–—]', blob): sys.exit(f'unicode dash in video {v["n"]}')
    if len(desc) > 5000 or len(tags) > 500: sys.exit(f'video {v["n"]}: description or tags too long')
    rows.append({'n': v['n'], 'playlist': playlist, 'title': title, 'description': desc, 'tags': tags,
                 'video': v['url'].replace('/media/videos/', '/media/videos/tiktok/')})
# The bot reads the title and description from data/videos.json.
bank_path = os.path.join(ROOT, 'data/videos.json')
full = json.load(open(bank_path, encoding='utf-8'))
by_n = {r['n']: r for r in rows}
for v in full['videos']:
    v['youtube'] = {'title': by_n[v['n']]['title'], 'description': by_n[v['n']]['description']}
json.dump(full, open(bank_path, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
open(bank_path, 'a').write('\n')
out = os.path.join(HERE, 'youtube', 'shorts.csv')
with open(out, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
titles = [r['title'] for r in rows]
print(f'{len(rows)} Shorts, {len(set(titles))} unique titles, longest title {max(map(len, titles))} characters, '
      f'{len({r["playlist"] for r in rows})} playlists -> {os.path.relpath(out, ROOT)}')
