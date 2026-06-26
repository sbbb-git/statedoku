# Statedoku Ad Slots — Activation Procedure

Infrastructure is **wired** (1 133 pages load `/js/ads.js`, ~640 `.ad-slot` placeholders on key pages). The kill switch is `CONFIG.ADS_ENABLED` in `/config.js` — currently `false`, so nothing loads and nothing shows.

## When can I turn this on?

Depends on the network you sign with. Three realistic tiers from your current traffic level (~100 visits/day, 700-1 500 pageviews/week growing):

### 1. Apply to AdSense **now** (recommended first move)
Google has no traffic minimum. They evaluate quality: original content, navigation, privacy policy, terms, mobile-friendly. Statedoku passes all of these. Realistic outcomes:
- **Approval in 1-3 weeks.** Then flip the switch.
- **Rejection** with reason "insufficient content" or "site under construction". Apply again in 2-4 weeks once more pages are indexed and traffic is steadier — your 1 100+ indexed pages will likely tip the balance.
- **Pending review** for 4+ weeks. Just wait.

Account: https://www.google.com/adsense. Add `statedoku.com` as a site, paste the verification code into the site (a meta tag in `<head>` of `index.html`), wait.

### 2. Apply to Ezoic **in parallel** as the safety net
Ezoic has no minimums, claims AdSense-tier RPM, takes a cut. Worth applying simultaneously to AdSense so you have a fallback. https://ezoic.com.

### 3. EthicalAds for the classroom / educational angle
EthicalAds explicitly accepts educational sites at low traffic. RPM lower than AdSense but no consent banner needed and contextual to a developer / educator / student audience — fits the "learn the 50 states" pitch. https://www.ethicalads.io.

What NOT to bother with yet:
- **Mediavine** (50K monthly sessions min)
- **Raptive / AdThrive** (100K)
- **Monumetric** (10K — close but not there)
- **Adsterra / PropellerAds** (low-quality ad inventory, hurts site rep)

## When AdSense (or other) approves — activation in 4 steps

### 1. Update `/config.js`
```js
const CONFIG = {
  ADS_ENABLED: true,                              // ← flip to true
  ADSENSE_PUBLISHER_ID: 'ca-pub-1234567890123456',// ← your real ID
  // ...rest unchanged
};
```

### 2. Create ad units in the AdSense dashboard
You need **4 distinct slot IDs** (one per placeholder type already on the site):

| Placeholder name             | Recommended unit type | Where it lives                             |
|------------------------------|------------------------|--------------------------------------------|
| `PLACEHOLDER_HOME_SOLVED`    | Display, responsive    | Inside `#solved-banner` (post-victory)     |
| `PLACEHOLDER_HOME_GAMEOVER`  | Display, responsive    | Inside `#gameover-banner` (lost the puzzle)|
| `PLACEHOLDER_PLAY_BOTTOM`    | Display, responsive    | Bottom of every `/play/*` mini-game        |
| `PLACEHOLDER_LEARN_MID`      | In-article, responsive | After first `</h2>` in every `/learn/*` article |
| `PLACEHOLDER_LEARN_BOTTOM`   | Display, responsive    | Bottom of every `/learn/*` article         |

Optional 6th: an anchor / sticky bottom unit. Don't enable on the homepage if you ever want PageSpeed > 90 again.

### 3. Replace the placeholders in code
Run a single Python find-and-replace over the repo. From the repo root:
```bash
python3 - <<'PY'
import os
SLOTS = {
  'PLACEHOLDER_HOME_SOLVED':   '1111111111',
  'PLACEHOLDER_HOME_GAMEOVER': '2222222222',
  'PLACEHOLDER_PLAY_BOTTOM':   '3333333333',
  'PLACEHOLDER_LEARN_MID':     '4444444444',
  'PLACEHOLDER_LEARN_BOTTOM':  '5555555555',
}
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in {'.git','node_modules','tmp','.wrangler'}]
    for f in files:
        if not f.endswith('.html'): continue
        p = os.path.join(root, f)
        c = open(p).read()
        new = c
        for k,v in SLOTS.items(): new = new.replace(k, v)
        if new != c:
            open(p,'w').write(new)
PY
```
(Edit the slot IDs in `SLOTS` before running. The 10-digit IDs are placeholders.)

### 4. Commit, push, done
Ad-load is automatic and lazy (placeholders only push when within 200px of the viewport).

## Architecture decisions baked in

- **Lazy by IntersectionObserver** — slots above the fold still wait until visible. Saves a network request on bounced visits.
- **Skips `/admin/`, `localhost`, `127.0.0.1`, `*.local`, `file://`** — never burns impressions on your own dashboards or local dev.
- **Idempotent script load** — multiple `<script src="/js/ads.js">` won't double-load the AdSense bundle (`window.__adsbygoogle_loaded` flag).
- **OFF state is `display:none`** on every `.ad-slot`. Page is byte-identical visually to ad-free state. Useful for screenshots, press kit, OG images.
- **Cumulative Layout Shift safe** — placeholders have `min-height` so the page doesn't jump when ads arrive.
- **No consent banner shipped.** AdSense Personalized vs Non-personalized is handled in the AdSense console under Privacy & Messaging. Turn on the EEA + UK consent message there; AdSense will inject it for visitors from those regions automatically.

## Files of record

- `/js/ads.js` — the loader (~3 KB, vanilla, no deps)
- `/css/style.css` — appendix at the bottom for `.ad-slot` styling
- `/config.js` — `ADS_ENABLED` + `ADSENSE_PUBLISHER_ID`
- `/js/game.js:549` — calls `Ads.refresh()` after a daily puzzle is solved
- This document — the activation runbook

## Realistic revenue expectations

At ~700-1 500 pageviews/week with US / FR / ES traffic mix and educational vertical:
- **AdSense RPM** typically $1-$5 for this geo mix and topic
- **Weekly:** $1-7
- **Monthly:** $5-30 to start, scaling roughly linearly with pageviews

The site needs to grow to ~30K-50K monthly pageviews before this becomes meaningful income ($150-1 000/month). That's a year of compounding SEO away. Treat the current setup as infrastructure for when the traffic arrives, not a near-term revenue lever.

## Kill switch

Reverse activation by flipping `ADS_ENABLED` back to `false` and pushing. Slots collapse instantly, AdSense script stops loading, no caching gotchas.
