# Short videos

Vertical 1080x1920 videos of 30 to 60 seconds, voice and burned-in captions,
for X (and later TikTok, Reels, Shorts). Built on 4 November 2026 at the
owner's request: "ludique, éducatif, culturel, géographie".

Every fact comes from the game's own data with the corrections of
`js/puzzle.js` applied (`data.cjs`): capitals, largest cities, admission years,
area ranks and the answer sets and glosses of the daily-grid clues, each
checked twice when it entered the game. Nothing is typed from memory, so a
video can never say what the game would mark wrong.

    node scripts/video/make-scripts.cjs                 # videos.json, 100 scripts
    node scripts/video/render-frames.cjs OUT            # one PNG per segment
    python3 scripts/video/render.py OUT VOICE.onnx [A B]  # voice and MP4s in OUT/mp4/

Voice: Piper, offline neural text-to-speech (`pip install piper-tts`, model
`en_US-ryan-high` from huggingface.co/rhasspy/piper-voices), so no text leaves
the machine. The video files are not in the repo (about 100 MB); they are
rebuilt from `videos.json` in about 20 minutes.

Formats: guess the state from its shape, name the capital, capitals that are
not the biggest city, map challenges (two clues of the daily grid each), odd
one out, which joined the Union first, which state is bigger, postal codes,
top lists. `posts.csv` holds the text to post with each one (one or two
hashtags, a link with `utm_source=x&utm_medium=video`).

Posting goes through Buffer like the text tweets, never the X API and never a
browser automating X (CLAUDE.md, "Rules that bite").
