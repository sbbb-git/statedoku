#!/usr/bin/env python3
"""TikTok captions for the 100 videos: scripts/video/tiktok/captions.csv.

Built from the post texts in data/videos.json, whose facts come from the
game's corrected data. A link in a TikTok caption is not clickable, so the
URL goes and the caption points to the link in bio instead. Four hashtags at
most, two rotations per series so the same block does not repeat on every
post. Fails on a unicode dash or a caption over 2,200 characters.

    python3 scripts/video/make-tiktok-captions.py
"""
import csv, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
bank = json.load(open(os.path.join(ROOT, 'data/videos.json'), encoding='utf-8'))['videos']
scripts = {s['slug']: s for s in json.load(open(os.path.join(HERE, 'videos.json'), encoding='utf-8'))}
TAGS = {
    'Guess the state': ['#geography #usa #50states #quiz', '#geography #maps #usa #learnontiktok'],
    'Name the capital': ['#geography #capitals #usa #edutok', '#capitals #quiz #50states #learnontiktok'],
    'Tricky capitals': ['#capitals #geography #usa #funfacts', '#capitals #50states #edutok #quiz'],
    'Map challenge': ['#maps #geography #usa #learnontiktok', '#mapchallenge #geography #usa #edutok'],
    'Odd one out': ['#geography #quiz #usa #edutok', '#oddoneout #geography #50states #quiz'],
    'Which came first': ['#ushistory #geography #quiz #learnontiktok', '#history #50states #usa #edutok'],
    'Bigger or smaller': ['#geography #usa #funfacts #quiz', '#maps #50states #funfacts #edutok'],
    'Postal codes': ['#usa #geography #quiz #funfacts', '#50states #trivia #usa #edutok'],
    'Top list': ['#geography #usa #funfacts #learnontiktok', '#50states #maps #funfacts #edutok'],
}
CTA = 'A new US map puzzle every day, free: link in bio.'
rows = []
for v in bank:
    s = scripts[v['slug']]
    text = re.sub(r'https?://\S+', '', v['text'])
    text = re.sub(r'(?:\s*#\w+)+\s*$', '', text).strip()
    text = re.sub(r'\s+#\w+', '', text).strip()
    tags = TAGS[s['series']][v['n'] % 2]
    cap = f'{text}\n\n{CTA}\n\n{tags}'
    if re.search('[‒–—]', cap): sys.exit(f'unicode dash in caption {v["n"]}')
    if len(cap) > 2200: sys.exit(f'caption {v["n"]} too long')
    rows.append({'n': v['n'], 'series': s['series'], 'title': s['title'], 'caption': cap, 'video': v['url']})
# The bot reads the caption and the safe-zone URL from data/videos.json.
bank_path = os.path.join(ROOT, 'data/videos.json')
full = json.load(open(bank_path, encoding='utf-8'))
by_n = {r['n']: r for r in rows}
for v in full['videos']:
    v['tiktok'] = by_n[v['n']]['caption']
    v['vertical_url'] = v['url'].replace('/media/videos/', '/media/videos/tiktok/')
json.dump(full, open(bank_path, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
open(bank_path, 'a').write('\n')
out = os.path.join(HERE, 'tiktok', 'captions.csv')
with open(out, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['n', 'series', 'title', 'caption', 'video']); w.writeheader(); w.writerows(rows)
caps = [r['caption'] for r in rows]
print(f'{len(rows)} captions, {len(set(caps))} unique, longest {max(map(len, caps))} characters -> {os.path.relpath(out, ROOT)}')
