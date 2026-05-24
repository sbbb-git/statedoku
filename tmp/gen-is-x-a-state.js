#!/usr/bin/env node
/**
 * Generate 10 /learn/is-{city}-a-state/ disambiguation pages for the top
 * GSC queries where users ask "is X a state". Each page directly answers
 * the question and routes to the real city + state pages.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const states = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));

const cityToState = {
  'las-vegas':    { city: 'Las Vegas',     stateSlug: 'nevada',        why: 'It is the largest city in Nevada (population 660k+), and one of the world\'s top tourism destinations. Many people confuse Las Vegas with a state because of its global fame — but the state is Nevada (capital: Carson City).' },
  'boston':       { city: 'Boston',        stateSlug: 'massachusetts', why: 'Boston is the capital and largest city of Massachusetts. People sometimes call it "Boston" interchangeably because the metro area dominates the state\'s identity, but Massachusetts is the state.' },
  'atlanta':      { city: 'Atlanta',       stateSlug: 'georgia',       why: 'Atlanta is the capital of Georgia and home to major brands (Coca-Cola, Delta, CNN). It is a city, not a state — the state is Georgia.' },
  'miami':        { city: 'Miami',         stateSlug: 'florida',       why: 'Miami is one of Florida\'s largest cities and a global tourism hub. The capital of Florida is actually Tallahassee, not Miami.' },
  'minneapolis':  { city: 'Minneapolis',   stateSlug: 'minnesota',     why: 'Minneapolis is the largest city in Minnesota, paired with Saint Paul (the actual capital) to form the "Twin Cities". The state is Minnesota.' },
  'philadelphia': { city: 'Philadelphia',  stateSlug: 'pennsylvania',  why: 'Philadelphia is the largest city in Pennsylvania and where the US Constitution was signed. The state is Pennsylvania (capital: Harrisburg).' },
  'charlotte':    { city: 'Charlotte',     stateSlug: 'north-carolina',why: 'Charlotte is the largest city in North Carolina and the 2nd largest US banking center after New York City. The state is North Carolina (capital: Raleigh).' },
  'seattle':      { city: 'Seattle',       stateSlug: 'washington',    why: 'Seattle is the largest city in Washington State — home to Amazon and Microsoft\'s HQ region. Note: the state of Washington is different from Washington, D.C. (the federal capital).' },
  'portland':     { city: 'Portland',      stateSlug: 'oregon',        why: 'Portland is the largest city in Oregon. (There\'s also a smaller Portland in Maine — people sometimes confuse the two.) The state is Oregon (capital: Salem).' },
  'phoenix':      { city: 'Phoenix',       stateSlug: 'arizona',       why: 'Phoenix is the capital and largest city of Arizona — the 5th most populous US city. The state is Arizona.' },
};

const slugToState = Object.fromEntries(
  states.map(s => [s.names.en.toLowerCase().replace(/\s+/g, '-'), s])
);

function stateColor(region) {
  return { northeast: '#0EA5E9', south: '#B91C1C', midwest: '#F59E0B', west: '#16A34A' }[region] || '#0F2147';
}

const breadcrumbItems = (city) => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://statedoku.com/' },
    { '@type': 'ListItem', position: 2, name: 'Learn', item: 'https://statedoku.com/learn/' },
    { '@type': 'ListItem', position: 3, name: `Is ${city} a state?`, item: `https://statedoku.com/learn/is-${city.toLowerCase().replace(/\s+/g, '-')}-a-state/` },
  ],
});

const faqJSON = (city, stateName, why) => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: `Is ${city} a state?`, acceptedAnswer: { '@type': 'Answer', text: `No. ${city} is a US city located in ${stateName}, not a state. ${why}` } },
    { '@type': 'Question', name: `What state is ${city} in?`, acceptedAnswer: { '@type': 'Answer', text: `${city} is in ${stateName}.` } },
    { '@type': 'Question', name: `What's the capital of ${stateName}?`, acceptedAnswer: { '@type': 'Answer', text: `The capital of ${stateName} is ${slugToState[stateName.toLowerCase().replace(/\s+/g, '-')]?.capital || 'unknown'}.` } },
  ],
});

function buildPage(citySlug) {
  const cfg = cityToState[citySlug];
  const st = slugToState[cfg.stateSlug];
  if (!st) throw new Error('No state for ' + cfg.stateSlug);
  const city = cfg.city;
  const stateName = st.names.en;
  const usps = st.id;
  const capital = st.capital;
  const region = st.region;
  const color = stateColor(region);
  const slug = `is-${citySlug}-a-state`;
  const canonical = `https://statedoku.com/learn/${slug}/`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0F2147">
  <meta name="color-scheme" content="light">

  <title>Is ${city} a state? — No, ${city} is a city in ${stateName} (${usps}) | Statedoku</title>
  <meta name="description" content="No, ${city} is not a state. ${city} is a US city in ${stateName}. Capital: ${capital}. Quick answer + state facts and map.">
  <meta name="keywords" content="is ${city.toLowerCase()} a state, what state is ${city.toLowerCase()} in, ${city.toLowerCase()} state, ${city.toLowerCase()} ${stateName.toLowerCase()}">
  <meta name="robots" content="index, follow, max-image-preview:large">

  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="en" href="${canonical}">
  <link rel="alternate" hreflang="en-US" href="${canonical}">
  <link rel="alternate" hreflang="en-GB" href="${canonical}">
  <link rel="alternate" hreflang="en-CA" href="${canonical}">
  <link rel="alternate" hreflang="en-AU" href="${canonical}">
  <link rel="alternate" hreflang="en-IN" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="${canonical}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=17">

  <meta property="og:type" content="article">
  <meta property="og:title" content="Is ${city} a state? — No, it's a city in ${stateName}">
  <meta property="og:description" content="${city} is not a state — it's a US city in ${stateName} (${usps}). Capital is ${capital}.">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://statedoku.com/og/state-${cfg.stateSlug}.png">

  <style>
    .ans-hero { max-width: 720px; margin: 28px auto 14px; padding: 0 18px; text-align: center; }
    .ans-hero .crumb { font-size: .8rem; color: var(--text-3); margin-bottom: 8px; }
    .ans-hero .crumb a { color: var(--text-2); text-decoration: none; }
    .ans-hero h1 { font-size: clamp(1.8rem, 5vw, 2.4rem); font-weight: 900; letter-spacing: -0.025em; margin: 4px 0 16px; line-height: 1.15; }
    .ans-answer { display: inline-block; padding: 16px 28px; border-radius: 14px; background: ${color}; color: #fff; font-size: clamp(1.1rem, 3vw, 1.4rem); font-weight: 800; letter-spacing: -.01em; margin: 8px 0 16px; }
    .ans-answer .small { display: block; font-size: .85rem; font-weight: 600; opacity: .85; margin-top: 4px; letter-spacing: 0; }
    .ans-main { max-width: 720px; margin: 0 auto; padding: 18px 18px 60px; line-height: 1.65; color: var(--text); }
    .ans-main h2 { margin-top: 32px; margin-bottom: 10px; font-size: 1.25rem; font-weight: 800; letter-spacing: -.015em; }
    .ans-main h3 { margin-top: 18px; margin-bottom: 6px; font-size: 1rem; font-weight: 700; color: var(--navy); }
    .ans-main p, .ans-main li { line-height: 1.65; }
    .ans-main ul { padding-left: 22px; margin-bottom: 14px; }
    .ans-main li { margin-bottom: 6px; }
    .factbox { background: #F8FAFC; border: 1px solid var(--border); border-radius: 12px; padding: 14px 18px; margin: 18px 0; }
    .factbox h3 { margin-top: 0; }
    .factbox p { margin-bottom: 6px; font-size: .92rem; }
    .factbox p:last-child { margin-bottom: 0; }
    .cta-card { background: linear-gradient(135deg, var(--navy), var(--navy-soft)); color: #fff; padding: 22px; border-radius: 14px; margin: 28px 0; text-align: center; }
    .cta-card h3 { color: #fff; margin: 0 0 8px; }
    .cta-card p { margin: 0 0 12px; color: rgba(255,255,255,0.85); }
    .cta-card a { display: inline-block; background: var(--gold); color: var(--navy); padding: 10px 22px; border-radius: 999px; font-weight: 800; text-decoration: none; font-size: .92rem; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; margin: 14px 0; }
    .related-grid a { display: block; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; color: var(--navy); text-decoration: none; font-weight: 600; font-size: .9rem; transition: all 120ms; }
    .related-grid a:hover { background: #F8FAFC; border-color: var(--navy); }
    details { margin: 8px 0; padding: 10px 14px; background: #F8FAFC; border-radius: 8px; }
    details[open] { background: #fff; border: 1px solid var(--border); }
    summary { font-weight: 700; color: var(--navy); cursor: pointer; }
    details p { margin: 8px 0 0; color: var(--text-2); }
  </style>
</head>
<body class="legal-body">

<header>
  <a href="/" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="/learn/" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem;">← Learn</a></nav>
</header>

<script type="application/ld+json">
${breadcrumbItems(city)}
</script>
<script type="application/ld+json">
${faqJSON(city, stateName, cfg.why)}
</script>

<main>
  <section class="ans-hero">
    <p class="crumb"><a href="/">Home</a> · <a href="/learn/">Learn</a> · Is ${city} a state?</p>
    <h1>Is ${city} a state?</h1>
    <div class="ans-answer">
      No — ${city} is a city
      <span class="small">It is located in <strong>${stateName}</strong> (USPS: ${usps})</span>
    </div>
  </section>

  <article class="ans-main">

    <p><strong>${city} is not a US state.</strong> It is a city in the state of <a href="/states/${cfg.stateSlug}/"><strong>${stateName}</strong></a>. ${cfg.why}</p>

    <div class="factbox">
      <h3>${stateName} at a glance</h3>
      <p><strong>USPS code:</strong> ${usps}</p>
      <p><strong>Capital:</strong> ${capital}</p>
      <p><strong>Largest city:</strong> ${st.largestCity || capital}</p>
      <p><strong>Region:</strong> ${region.charAt(0).toUpperCase() + region.slice(1)}</p>
      <p><strong>Year admitted:</strong> ${st.admitted}</p>
    </div>

    <h2>Why people ask this</h2>
    <p>"Is ${city} a state?" gets searched thousands of times a year. There are three common reasons:</p>
    <ul>
      <li><strong>City is more famous than its state.</strong> Travelers see "${city}" on flights, news, sports, and TV — but the state name comes up less often.</li>
      <li><strong>The US has 50 states + many big cities</strong>, so it's easy to lose track. Only 17 of the 50 capitals are the largest city of their state — meaning a famous city is usually <em>not</em> the capital.</li>
      <li><strong>People learning US geography from scratch</strong> (non-Americans, kids, ESL learners) need a quick disambiguation page like this one. You're welcome.</li>
    </ul>

    <h2>Quick reference: ${city} vs ${stateName}</h2>
    <p>If you ever need to fill in a form or quiz:</p>
    <ul>
      <li><strong>City:</strong> ${city}</li>
      <li><strong>State:</strong> ${stateName}</li>
      <li><strong>State abbreviation (USPS):</strong> ${usps}</li>
      <li><strong>State capital:</strong> ${capital}</li>
    </ul>

    <div class="cta-card">
      <h3>Master US geography in 5 minutes a day</h3>
      <p>Statedoku is a free daily puzzle that drops a new US-states grid every morning — including states like ${stateName}.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>FAQ</h2>
    <details><summary><strong>Is ${city} a state?</strong></summary><p>No — ${city} is a US city in ${stateName}.</p></details>
    <details><summary><strong>What state is ${city} in?</strong></summary><p>${city} is in <a href="/states/${cfg.stateSlug}/">${stateName}</a>.</p></details>
    <details><summary><strong>What is the capital of ${stateName}?</strong></summary><p>The capital of ${stateName} is <strong>${capital}</strong>${capital === (st.largestCity || capital) ? ' — also the largest city' : (st.largestCity ? `. The largest city is ${st.largestCity}.` : '.')}</p></details>
    <details><summary><strong>How many cities does ${stateName} have?</strong></summary><p>${stateName} has dozens of incorporated cities and towns. The largest is ${st.largestCity || capital}. See all of <a href="/states/${cfg.stateSlug}/">${stateName}'s major cities and facts</a>.</p></details>

    <h2>Related</h2>
    <div class="related-grid">
      <a href="/states/${cfg.stateSlug}/">→ ${stateName} state profile</a>
      <a href="/cities/${citySlug}/">→ ${city} city profile</a>
      <a href="/states/${cfg.stateSlug}/symbols/">→ ${stateName} state symbols</a>
      <a href="/states/${cfg.stateSlug}/fun-facts/">→ ${stateName} fun facts</a>
      <a href="/regions/${region}/">→ The ${region.charAt(0).toUpperCase() + region.slice(1)} region</a>
      <a href="/learn/state-capitals/">→ Memorize all 50 capitals</a>
      <a href="/learn/state-abbreviations/">→ All USPS state codes</a>
      <a href="/learn/crossword-helper/">→ Crossword helper (states + capitals)</a>
    </div>
  </article>
</main>

<footer>
  <p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/about/">About</a> &nbsp;·&nbsp; <a href="/learn/">Learn</a> &nbsp;·&nbsp; <a href="/states/">States</a> &nbsp;·&nbsp; <a href="/cities/">Cities</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/api/">API</a> &nbsp;·&nbsp; <a href="/faq/">FAQ</a></p>
</footer>

<script src="/config.js"></script>
<script src="/js/admin.js"></script>
</body>
</html>
`;
}

let count = 0;
for (const citySlug of Object.keys(cityToState)) {
  const outDir = path.join(ROOT, 'learn', `is-${citySlug}-a-state`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), buildPage(citySlug));
  count++;
  console.log(`✅ /learn/is-${citySlug}-a-state/`);
}
console.log(`\n✅ ${count} disambiguation pages written.`);
