#!/usr/bin/env python3
"""Reorders the videos not yet posted in data/videos.json by what has worked,
without adding or removing any (16 November 2026, owner: "sélectionne mieux,
n'en génère pas de nouvelles").

Reading of 16 November (YouTube Shorts, public view counts, one to six days
after posting): the map building itself 1.8K; last state standing, bounce out
and line closes 1.1K each; NASA photos and puns 1K; the old five-question
quizzes 10 to 1,000, most of them older. So from tonight:
  1. the animations first, one scene after another, the best scene leading;
  2. the slide formats not yet tested, one every fourth day, so the test goes on;
  3. the old quizzes last, in their existing order.

The videos already posted (index below today's, counted from shorts_epoch, which
drives TikTok, YouTube and X since 11 November) keep their place. Re-run after
add-experiments.cjs, which rebuilds the order. Change SCENES when a new
reading changes the ranking.

    python3 scripts/video/reorder-queue.py [YYYY-MM-DD]   # the first day to reorder, default today
"""
import json, os, sys, datetime
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = os.path.join(ROOT, 'data/videos.json')
# Animated scenes, best first (16 November reading). The two untested scenes last.
SCENES = ['map-builds-itself', 'last-state-standing', 'bounce-out', 'line-closes', 'spinning-state', 'missing-state']

bank = json.load(open(P, encoding='utf-8'))
v = bank['videos']
day = datetime.date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else datetime.datetime.utcnow().date()
start = (day - datetime.date.fromisoformat(bank['shorts_epoch'])).days
assert 0 < start < len(v), start
done, rest = v[:start], v[start:]


def scene(x):
    s = x['slug']
    for k in SCENES:
        if s.startswith('w') and k in s: return k
    return None


anim = {k: [x for x in rest if scene(x) == k] for k in SCENES}
slides = [x for x in rest if x['slug'].startswith('x')]
old = [x for x in rest if not x['slug'].startswith(('w', 'x'))]
assert len(sum(anim.values(), [])) + len(slides) + len(old) == len(rest)

# Round robin over the scenes in rank order, so the best scene leads and none repeats two days running.
seq = []
while any(anim.values()):
    for k in SCENES:
        if anim[k]: seq.append(anim[k].pop(0))
# An untested slide format every fourth day, starting tonight.
out = []
for i, x in enumerate(seq):
    if i % 3 == 0 and slides: out.append(slides.pop(0))
    out.append(x)
out += slides + old
assert sorted(x['slug'] for x in out) == sorted(x['slug'] for x in rest)
bank['videos'] = done + out
bank['note_order'] = (f'From {day} the videos not yet posted were reordered by scripts/video/reorder-queue.py from the YouTube views of '
                      '16 November: animations first (best scene leading), an untested slide format every fourth day, the old quizzes last.')
json.dump(bank, open(P, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
open(P, 'a').write('\n')
for i, x in enumerate(out[:14]):
    print(day + datetime.timedelta(days=i), x['slug'])
print(f'... {len(out)} videos from {day}: {len(seq)} animations, the old quizzes from {day + datetime.timedelta(days=len(out) - len(old))}')
