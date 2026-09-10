#!/usr/bin/env python3
"""Add one or two topical hashtags to every tweet in data/tweets.json.

Idempotent: a tweet that already carries a hashtag is left alone, so this can be
re-run after scripts/rebuild-tweet-bank.py without stacking tags.

Why per angle rather than one block everywhere: X treats a fixed tag block
repeated across hundreds of scheduled posts as a spam signal, and the bank
already exists to keep the text non-duplicative. Each angle draws from its own
short rotation, indexed by position, so two consecutive days never carry the
same pair.

Hashtags are capped at two. Every candidate has been checked against the
worker's humanize(), which lowercases runs of three or more capitals: an
all-caps tag like #DYK would come out as #dyk, so none are used.
"""
import json, re, sys, pathlib

BANK = pathlib.Path(__file__).resolve().parent.parent / 'data' / 'tweets.json'
LIMIT = 280          # X hard limit
URL_WEIGHT = 23      # X counts any link as 23 characters, whatever its length

# Rotations per angle. First entry of each is the most on-topic; the brand tag
# is spread rather than stamped on all 600.
ROTATIONS = {
    # ── game slot ──
    'puzzle-cta':          [['#Statedoku'], ['#DailyPuzzle'], ['#Statedoku', '#PuzzleGame']],
    'engagement-questions':[['#Geography'], ['#TriviaTime'], ['#Statedoku', '#QuizTime']],
    'seasonal-timely':     [['#USHistory'], ['#Statedoku'], ['#DidYouKnow']],
    'teacher-classroom':   [['#Teachers'], ['#SocialStudies'], ['#Homeschool'], ['#Statedoku', '#EdTech']],
    # ── page slot ──
    'border-quirks':       [['#Geography'], ['#MapNerd'], ['#USGeography']],
    'capitals':            [['#StateCapitals'], ['#Geography'], ['#USA', '#StateCapitals']],
    'statehood':           [['#USHistory'], ['#Statehood'], ['#DidYouKnow']],
    'symbols':             [['#StateSymbols'], ['#USA'], ['#DidYouKnow']],
    'geography-extremes':  [['#USGeography'], ['#Geography'], ['#MapNerd']],
    'names-etymology':     [['#Etymology'], ['#Geography'], ['#DidYouKnow']],
    'population-economy':  [['#Demographics'], ['#USA'], ['#Geography']],
    'misconceptions':      [['#DidYouKnow'], ['#Geography'], ['#MapNerd']],
}
FALLBACK = [['#Statedoku'], ['#Geography']]

HAS_TAG = re.compile(r'(?<!\w)#\w')
DASHES = re.compile(r'[‒–—―]')


def x_len(text):
    """Length as X counts it: every link costs URL_WEIGHT regardless of size."""
    return len(re.sub(r'https?://\S+', 'x' * URL_WEIGHT, text))


def add_tags(text, tags):
    """Insert the tags at the end of the prose, before the blank line and URL."""
    if '\n\n' in text:
        body, rest = text.split('\n\n', 1)
        return f"{body} {' '.join(tags)}\n\n{rest}"
    return f"{text} {' '.join(tags)}"


def main():
    bank = json.loads(BANK.read_text(encoding='utf-8'))
    touched = skipped = too_long = 0
    # Counter per angle, not the index in the slot. The angles are interleaved,
    # not contiguous: teacher-classroom sits at 3, 7, 11, 15 and so on, a stride
    # of four. Indexing a four-entry rotation by that position gives i % 4 == 3
    # every time, so the rotation never turns and three of its four tag sets can
    # never appear. Counting occurrences of the angle itself is immune to the
    # stride, whatever the bank's ordering.
    seen_per_angle = {}

    for slot in ('game', 'page'):
        for t in bank['slots'][slot]['tweets']:
            if HAS_TAG.search(t['text']):
                skipped += 1
                continue
            angle = t.get('angle')
            rot = ROTATIONS.get(angle, FALLBACK)
            n = seen_per_angle.get(angle, 0)
            seen_per_angle[angle] = n + 1
            tags = rot[n % len(rot)]
            new = add_tags(t['text'], tags)
            if x_len(new) > LIMIT:
                # Retry with the single shortest tag before giving up.
                shortest = [min(tags, key=len)]
                new = add_tags(t['text'], shortest)
                if x_len(new) > LIMIT:
                    too_long += 1
                    continue
            t['text'] = new
            touched += 1

    # ── guards ───────────────────────────────────────────────────────────
    all_t = [t for s in ('game', 'page') for t in bank['slots'][s]['tweets']]
    over = [t for t in all_t if x_len(t['text']) > LIMIT]
    dashed = [t for t in all_t if DASHES.search(t['text'])]
    texts = [t['text'] for t in all_t]
    dupes = len(texts) - len(set(texts))
    if over or dashed or dupes:
        print(f'REFUS: {len(over)} trop longs, {len(dashed)} avec tiret unicode, {dupes} doublons')
        sys.exit(1)

    BANK.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{touched} tweets tagges, {skipped} deja tagges, {too_long} laisses sans tag')
    print(f'longueur X max apres ajout : {max(x_len(t["text"]) for t in all_t)}/{LIMIT}')


if __name__ == '__main__':
    main()
