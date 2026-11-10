# Format tests on TikTok, YouTube Shorts and X

Started 10 November 2026. The 100 quiz videos (five questions, 30 to 60 s)
drew 500 to 1,000 views each on YouTube Shorts and almost nothing on TikTok.
The owner asked for very different kinds of video, to see what works. Ten
formats, one video each, shorter (20 to 39 s), the question on screen from the
first frame.

| # | Format | Slug | TikTok and YouTube (23:00 UTC) | X (13:00 UTC) |
| --- | --- | --- | --- | --- |
| 1 | Real NASA photos, guess the state | x03-from-space | 10 Nov | 11 Nov |
| 2 | Jokes (state puns) | x02-state-puns | 11 Nov | 12 Nov |
| 3 | Time-lapse, the map fills by year of statehood | x04-time-lapse | 12 Nov | 13 Nov |
| 4 | Blind ranking by size | x08-blind-ranking | 13 Nov | 14 Nov |
| 5 | Three clues, the map narrows | x01-three-clues | 14 Nov | 15 Nov |
| 6 | Outlines upside down | x05-upside-down | 15 Nov | 16 Nov |
| 7 | Zoom out from a piece of border | x06-zoom-out | 16 Nov | 17 Nov |
| 8 | Spot the wrong label | x07-spot-the-mistake | 17 Nov | 18 Nov |
| 9 | Letter challenge (no letter A) | x09-letter-challenge | 18 Nov | 19 Nov |
| 10 | One cell of the daily grid | x10-grid-cell | 19 Nov | 20 Nov |

## How to read the result

- **YouTube**: the view count of each Short on the channel page is public.
  Baseline: 500 to 1,000 views for a quiz video.
- **TikTok**: views per video show on the profile in the app only (the web
  profile does not give them). Baseline: ask the owner for the numbers once,
  on 20 November, not every day.
- **X**: each link carries `utm_campaign=<format>`, so GA4 separates the
  clicks per format. Views are in the X app; never scrape X.
- One video per format is a first pass, not a proof: a format is worth a
  second batch when it does at least twice the baseline on one platform.
  Read on 20 November, then build ten more of the two best formats and drop
  the rest.

## Rebuild

    node scripts/video/make-experiments.cjs
    VIDEOS=experiments.json node scripts/video/render-frames.cjs OUT
    VIDEOS=experiments.json python3 scripts/video/render.py OUT VOICE.onnx
    cp OUT/mp4/x*.mp4 media/videos/ && bash scripts/video/make-tiktok-videos.sh
    node scripts/video/add-experiments.cjs

Facts: every answer is computed from the game's data and asserted in
make-experiments.cjs; the photo captions repeat NASA's own (photos/CREDITS.md).
