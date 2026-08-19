#!/usr/bin/env python3
"""Export the tweet bank as a dated schedule for bulk upload to a scheduler.

The Cloudflare worker posts straight from data/tweets.json, so this file is only
needed when posting through a third-party tool instead of the X API. It resolves
the same day-indexed rotation the worker uses, so both routes send exactly the
same tweet on the same day and switching between them changes nothing.

Usage:  python3 scripts/export-tweet-schedule.py [start_date] [days]
"""
import csv, json, pathlib, sys
from datetime import date, datetime, timedelta, timezone

BANK = pathlib.Path('data/tweets.json')
OUT_DIR = pathlib.Path('bot/exports')
EPOCH = date(2026, 8, 9)          # must match BANK_EPOCH in bot/src/worker.js
SLOT_TIMES = [('game', '13:00'), ('page', '23:00')]   # matches wrangler.toml crons


def main():
    start = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else date.today()
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 90

    bank = json.loads(BANK.read_text(encoding='utf-8'))
    if bank.get('version') != 2:
        sys.exit('tweets.json is not the two-slot v2 bank')
    slots = {k: v['tweets'] for k, v in bank['slots'].items()}

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rows = []
    for n in range(days):
        d = start + timedelta(days=n)
        day_index = (d - EPOCH).days
        if day_index < 0:
            continue
        for slot, hhmm in SLOT_TIMES:
            pool = slots[slot]
            t = pool[day_index % len(pool)]
            rows.append({
                'date': d.isoformat(),
                'time_utc': hhmm,
                'slot': slot,
                'link': t['url'],
                'page': t.get('page', '/'),
                'angle': t['angle'],
                'text': t['text'],
            })

    csv_path = OUT_DIR / 'statedoku-schedule.csv'
    with csv_path.open('w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['date', 'time_utc', 'slot', 'link', 'page', 'angle', 'text'])
        w.writeheader()
        w.writerows(rows)

    # Publer and Hypefury both want a minimal date/time/content shape.
    simple_path = OUT_DIR / 'statedoku-schedule-simple.csv'
    with simple_path.open('w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['Date', 'Time', 'Content'])
        for r in rows:
            w.writerow([r['date'], r['time_utc'], r['text']])

    print(f'{len(rows)} posts over {days} days, {start} to {start + timedelta(days=days-1)}')
    print(f'  {csv_path}')
    print(f'  {simple_path}')
    print(f'  game-link posts: {sum(1 for r in rows if r["slot"] == "game")}')
    print(f'  page-link posts: {sum(1 for r in rows if r["slot"] == "page")}'
          f'  across {len(set(r["page"] for r in rows if r["slot"] == "page"))} distinct pages')


if __name__ == '__main__':
    main()
