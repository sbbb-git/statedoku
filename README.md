# Statedoku

Daily US States Puzzle — like Sudoku, with American geography.

## Deploy to Cloudflare Pages

### Option A — Direct upload (fastest, no GitHub needed)

```bash
# Install Wrangler once
npm install -g wrangler

# From the project root
wrangler pages deploy . --project-name=statedoku
```

Follow the prompts to log in (browser will open). First deploy creates the project; subsequent deploys update it.

### Option B — Connect a Git repo (auto-deploys on push)

1. Push this folder to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial Statedoku build"
   gh repo create statedoku --public --source=. --push
   ```
2. Go to https://dash.cloudflare.com → Pages → Create a project → Connect to Git
3. Select the `statedoku` repo
4. Build settings:
   - **Framework preset:** None
   - **Build command:** (leave empty)
   - **Build output directory:** `/`
5. Click *Save and Deploy*

### Connect your custom domain

1. Buy `statedoku.com` (~$10/yr). Recommended: **Cloudflare Registrar** — at-cost pricing, free WHOIS privacy, DNS already on Cloudflare.
2. In Cloudflare Pages → your project → **Custom domains** → Add `statedoku.com` and `www.statedoku.com`.
3. If domain is on Cloudflare Registrar, DNS is set automatically. Else, add the CNAME Cloudflare gives you to your registrar.

## Local dev

```bash
python3 -m http.server 8765
# Open http://localhost:8765/?dev=1
```

## Project structure

- `index.html` (EN), `fr/index.html`, `es/index.html`
- `js/puzzle.js` — daily puzzle generation (deterministic, seeded by date)
- `js/game.js` — game loop + dev panel (superadmin via `?dev=1`)
- `js/ads.js` — AdSense loader + GDPR consent
- `js/i18n.js` — language switching
- `data/states.json` — 50 states with ~80 attributes each
- `data/translations.json` — UI strings + constraint labels in EN/FR/ES
- `css/style.css`
- `og-image.svg`, `favicon.svg`
- `sitemap.xml`, `robots.txt`
- `_headers`, `_redirects` — Cloudflare Pages config
- `manifest.json` — PWA

## Configure AdSense

1. Get approved at [adsense.google.com](https://adsense.google.com).
2. Edit `config.js`: set `ADSENSE_PUBLISHER_ID` to your `ca-pub-...` ID.
3. Edit `js/ads.js`: replace the 3 placeholder slot IDs with your real ones.
