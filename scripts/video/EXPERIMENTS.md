# Format tests on TikTok, YouTube Shorts and X

Started 10 November 2026. The 100 quiz videos (five questions, 30 to 60 s)
drew 500 to 1,000 views each on YouTube Shorts and almost nothing on TikTok.
The owner asked for very different kinds of video, to see what works. Fourteen
formats, one video each, shorter (14 to 39 s), the question on screen from the
first frame. Ten are still slides with a voice (slugs x..); four are real
animation at 30 frames a second (slugs w.., `make-anim.cjs`, `anim.html`,
`render-anim.py`), made after the owner asked for something out of the
ordinary.

| # | Format | Slug | TikTok and YouTube (23:00 UTC) | X (13:00 UTC) |
| --- | --- | --- | --- | --- |
| 1 | Animation: seven rules knock states off the map, one survives | w01-last-state-standing | 10 Nov | 11 Nov |
| 2 | Animation: fifty tiles, bouncing balls, last tile wins | w02-bounce-out | 11 Nov | 12 Nov |
| 3 | Real NASA photos, guess the state | x03-from-space | 12 Nov | 13 Nov |
| 4 | Animation: the map builds itself in statehood order, loops | w03-map-builds-itself | 13 Nov | 14 Nov |
| 5 | Jokes (state puns) | x02-state-puns | 14 Nov | 15 Nov |
| 6 | Animation: a pen draws the border, name it before it closes | w04-line-closes | 15 Nov | 16 Nov |
| 7 | Time-lapse, the map fills by year of statehood | x04-time-lapse | 16 Nov | 17 Nov |
| 8 | Blind ranking by size | x08-blind-ranking | 17 Nov | 18 Nov |
| 9 | Three clues, the map narrows | x01-three-clues | 18 Nov | 19 Nov |
| 10 | Outlines upside down | x05-upside-down | 19 Nov | 20 Nov |
| 11 | Zoom out from a piece of border | x06-zoom-out | 20 Nov | 21 Nov |
| 12 | Spot the wrong label | x07-spot-the-mistake | 21 Nov | 22 Nov |
| 13 | Letter challenge (no letter A) | x09-letter-challenge | 22 Nov | 23 Nov |
| 14 | One cell of the daily grid | x10-grid-cell | 23 Nov | 24 Nov |

## The batch of 30 animations (10 November)

The owner liked the four animations and asked for thirty more before any
result was in. They follow the fourteen tests in the list, one a day, in an
order that alternates the six scenes: eight more elimination chains (eight
different survivors), six bounce rounds (six different winners), six line
drawings, four map builds (biggest first, A to Z, left to right, newest
first) and two new scenes, the spinning outline and the missing state (three
each).

| Slug | TikTok and YouTube (23:00 UTC) | X (13:00 UTC) |
| --- | --- | --- |
| w05-last-state-standing-2 | 24 Nov | 25 Nov |
| w06-bounce-out-2 | 25 Nov | 26 Nov |
| w07-line-closes-2 | 26 Nov | 27 Nov |
| w08-map-builds-itself-2 | 27 Nov | 28 Nov |
| w09-spinning-state-1 | 28 Nov | 29 Nov |
| w10-missing-state-1 | 29 Nov | 30 Nov |
| w11-last-state-standing-3 | 30 Nov | 1 Dec |
| w12-bounce-out-3 | 1 Dec | 2 Dec |
| w13-line-closes-3 | 2 Dec | 3 Dec |
| w14-map-builds-itself-3 | 3 Dec | 4 Dec |
| w15-spinning-state-2 | 4 Dec | 5 Dec |
| w16-missing-state-2 | 5 Dec | 6 Dec |
| w17-last-state-standing-4 | 6 Dec | 7 Dec |
| w18-bounce-out-4 | 7 Dec | 8 Dec |
| w19-line-closes-4 | 8 Dec | 9 Dec |
| w20-map-builds-itself-4 | 9 Dec | 10 Dec |
| w21-spinning-state-3 | 10 Dec | 11 Dec |
| w22-missing-state-3 | 11 Dec | 12 Dec |
| w23-last-state-standing-5 | 12 Dec | 13 Dec |
| w24-bounce-out-5 | 13 Dec | 14 Dec |
| w25-line-closes-5 | 14 Dec | 15 Dec |
| w26-map-builds-itself-5 | 15 Dec | 16 Dec |
| w27-last-state-standing-6 | 16 Dec | 17 Dec |
| w28-bounce-out-6 | 17 Dec | 18 Dec |
| w29-line-closes-6 | 18 Dec | 19 Dec |
| w30-last-state-standing-7 | 19 Dec | 20 Dec |
| w31-bounce-out-7 | 20 Dec | 21 Dec |
| w32-line-closes-7 | 21 Dec | 22 Dec |
| w33-last-state-standing-8 | 22 Dec | 23 Dec |
| w34-last-state-standing-9 | 23 Dec | 24 Dec |

If the reading of 24 November shows a scene that does nothing, take its
videos out of `experiments-anim.json` order (or drop them) and re-run
`add-experiments.cjs`: the list is rebuilt from the two files every time.

## How to read the result

- **YouTube**: the view count of each Short on the channel page is public.
  Baseline: 500 to 1,000 views for a quiz video.
- **TikTok**: views per video show on the profile in the app only (the web
  profile does not give them). Baseline: ask the owner for the numbers once,
  on 24 November, not every day.
- **X**: each link carries `utm_campaign=<format>`, so GA4 separates the
  clicks per format. Views are in the X app; never scrape X.
- One video per format is a first pass, not a proof: a format is worth a
  second batch when it does at least twice the baseline on one platform.
  Read on 24 November, then build ten more of the two best formats and drop
  the rest.

## Rebuild

    node scripts/video/make-experiments.cjs
    VIDEOS=experiments.json node scripts/video/render-frames.cjs OUT
    VIDEOS=experiments.json python3 scripts/video/render.py OUT VOICE.onnx
    cp OUT/mp4/x*.mp4 media/videos/ && bash scripts/video/make-tiktok-videos.sh
    node scripts/video/make-anim.cjs OUT2 && python3 scripts/video/render-anim.py OUT2 VOICE.onnx
    cp OUT2/mp4/w*.mp4 media/videos/ && bash scripts/video/make-tiktok-videos.sh
    node scripts/video/add-experiments.cjs

Facts: every answer is computed from the game's data and asserted in
make-experiments.cjs; the photo captions repeat NASA's own (photos/CREDITS.md).
