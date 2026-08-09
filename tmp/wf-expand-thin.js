export const meta = {
  name: 'expand-thin-indexable',
  description: 'Expand every remaining thin indexable page so nothing under 400 words is left in the index during the AdSense review',
  phases: [
    { title: 'Regions' },
    { title: 'Learn pages' },
    { title: 'Game pages' },
    { title: 'About pages' },
  ],
}

const REPO = '/Users/sacha/Desktop/Statoku'

const BATCHES = {
"regions": [
[
"regions/index.html",
"regions/pacific/index.html",
"regions/south-atlantic/index.html",
"regions/new-england/index.html",
"regions/east-north-central/index.html"
],
[
"regions/midwest/index.html",
"regions/west-north-central/index.html",
"regions/mid-atlantic/index.html",
"regions/south/index.html",
"regions/west-south-central/index.html"
],
[
"regions/west/index.html",
"regions/mountain/index.html",
"regions/northeast/index.html",
"regions/east-south-central/index.html"
]
],
"learn": [
[
"learn/is-philadelphia-a-state/index.html",
"learn/is-phoenix-a-state/index.html",
"learn/is-portland-a-state/index.html",
"learn/crossword-helper/index.html",
"learn/is-atlanta-a-state/index.html"
],
[
"learn/is-minneapolis-a-state/index.html",
"learn/is-seattle-a-state/index.html",
"learn/is-boston-a-state/index.html",
"learn/is-charlotte-a-state/index.html",
"learn/is-miami-a-state/index.html"
],
[
"fr/learn/ceremonie-ouverture-mondial-2026/index.html",
"es/learn/capital-de-minnesota/index.html",
"es/learn/capital-de-alaska/index.html",
"es/learn/capital-de-nebraska/index.html",
"es/learn/capital-de-connecticut/index.html"
],
[
"es/learn/capital-de-louisiana/index.html",
"es/learn/capital-de-north-carolina/index.html",
"es/learn/capital-de-washington/index.html",
"es/learn/capital-de-indiana/index.html",
"es/learn/capital-de-north-dakota/index.html"
],
[
"es/learn/capital-de-maine/index.html",
"es/learn/capital-de-new-mexico/index.html",
"es/learn/capital-de-new-hampshire/index.html",
"es/learn/capital-de-rhode-island/index.html",
"es/learn/capital-de-west-virginia/index.html"
],
[
"es/learn/capital-de-vermont/index.html",
"es/learn/capital-de-georgia/index.html",
"es/learn/capital-de-mississippi/index.html",
"es/learn/capital-de-alabama/index.html",
"es/learn/capital-de-maryland/index.html"
],
[
"es/learn/estado-eeuu-2-letras-nc/index.html",
"es/learn/capital-de-tennessee/index.html",
"es/learn/capital-de-colorado/index.html",
"es/learn/estado-eeuu-abreviatura-ma/index.html",
"es/learn/capital-de-oklahoma/index.html"
],
[
"es/learn/capital-de-south-carolina/index.html",
"es/learn/capital-de-delaware/index.html",
"es/learn/estado-eeuu-abreviatura-mn/index.html",
"es/learn/estado-eeuu-abreviatura-mi/index.html",
"es/learn/capital-de-massachusetts/index.html"
],
[
"es/learn/capital-de-arkansas/index.html",
"es/learn/capital-de-new-york/index.html",
"es/learn/capital-de-michigan/index.html",
"es/learn/crucigrama-estados/index.html",
"es/learn/capital-de-iowa/index.html"
],
[
"es/learn/capital-de-hawaii/index.html",
"es/learn/capital-de-idaho/index.html",
"es/learn/estado-eeuu-2-letras-sc/index.html",
"es/learn/capital-de-kansas/index.html",
"es/learn/capital-de-new-jersey/index.html"
],
[
"es/learn/capital-de-texas/index.html",
"es/learn/capital-de-wyoming/index.html",
"es/learn/capital-de-virginia/index.html",
"es/learn/capital-de-wisconsin/index.html",
"es/learn/capital-de-oregon/index.html"
],
[
"es/learn/capital-de-pennsylvania/index.html",
"es/learn/ciudad-arizona-cabecera-condado-pima/index.html",
"es/learn/capital-de-nevada/index.html",
"es/learn/capital-de-florida/index.html",
"es/learn/capital-de-california/index.html"
],
[
"es/learn/capital-de-utah/index.html",
"es/learn/capital-de-ohio/index.html"
]
],
"play": [
[
"es/play/biggest-cities/index.html",
"es/play/border-states/index.html",
"es/play/confederate-states/index.html",
"es/play/electoral-college/index.html",
"es/play/no-income-tax-states/index.html",
"es/play/place-the-state/index.html",
"es/play/president-birth-states/index.html"
],
[
"es/play/rivers-mountains/index.html",
"es/play/state-abbreviations/index.html",
"es/play/state-admission-order/index.html",
"es/play/state-capitals-match/index.html",
"es/play/state-capitals-typing/index.html",
"es/play/state-flags/index.html",
"es/play/state-mottos/index.html"
],
[
"es/play/state-nicknames/index.html",
"es/play/state-silhouettes/index.html",
"es/play/state-symbols/index.html",
"es/play/states-connections/index.html",
"es/play/swing-states/index.html",
"es/play/thirteen-colonies/index.html",
"es/play/time-zones/index.html"
],
[
"fr/play/biggest-cities/index.html",
"fr/play/border-states/index.html",
"fr/play/confederate-states/index.html",
"fr/play/electoral-college/index.html",
"fr/play/no-income-tax-states/index.html",
"fr/play/place-the-state/index.html",
"fr/play/president-birth-states/index.html"
],
[
"fr/play/rivers-mountains/index.html",
"fr/play/state-abbreviations/index.html",
"fr/play/state-admission-order/index.html",
"fr/play/state-capitals-match/index.html",
"fr/play/state-capitals-typing/index.html",
"fr/play/state-flags/index.html",
"fr/play/state-mottos/index.html"
],
[
"fr/play/state-nicknames/index.html",
"fr/play/state-silhouettes/index.html",
"fr/play/state-symbols/index.html",
"fr/play/states-connections/index.html",
"fr/play/swing-states/index.html",
"fr/play/thirteen-colonies/index.html",
"fr/play/time-zones/index.html"
],
[
"play/biggest-cities/index.html",
"play/border-states/index.html",
"play/confederate-states/index.html",
"play/electoral-college/index.html",
"play/no-income-tax-states/index.html",
"play/place-the-state/index.html",
"play/president-birth-states/index.html"
],
[
"play/rivers-mountains/index.html",
"play/state-abbreviations/index.html",
"play/state-admission-order/index.html",
"play/state-capitals-match/index.html",
"play/state-capitals-typing/index.html",
"play/state-flags/index.html",
"play/state-mottos/index.html"
],
[
"play/state-nicknames/index.html",
"play/state-silhouettes/index.html",
"play/state-symbols/index.html",
"play/states-connections/index.html",
"play/swing-states/index.html",
"play/thirteen-colonies/index.html",
"play/time-zones/index.html"
]
],
"docs": [
[
"about/index.html",
"es/about/index.html",
"fr/about/index.html"
]
]
}

const SCHEMA = {
  type: 'object',
  required: ['files', 'word_counts'],
  properties: {
    files: { type: 'array', items: { type: 'string' } },
    word_counts: { type: 'array', items: { type: 'number' } },
    notes: { type: 'string' },
  },
}

const RULES = [
  'Preserve the entire <head> exactly: title, meta description, canonical, hreflang, all existing JSON-LD, and the robots meta. Touch none of it.',
  'Keep the ad placeholders. If absent, add an HTML comment PLACEHOLDER_LEARN_MID after the first H2 and PLACEHOLDER_LEARN_BOTTOM before the closing main tag.',
  'No em-dashes or en-dashes anywhere. Use commas, periods or line breaks.',
  'Never invent a statistic, date or name. Omit rather than guess.',
  'No filler. Every sentence must carry a fact specific to this page. If a sentence would still be true with a different subject swapped in, cut it.',
  'Do not add FAQPage JSON-LD unless you also render the questions and answers visibly in the body. Markup-only FAQ is what triggers a manual action, and this site already had that problem.',
  'Write in the language of the page. Files under /fr/ are French, under /es/ are Spanish, everything else English.',
].map(s => '- ' + s).join('\n')

const DATA = 'Data available: ' + REPO + '/data/states.json has capital, largest city, region, subregion, admission year, population band, area rank, timezone and dozens of boolean flags. ' + REPO + '/data/play-extra.json has nickname, motto, bird, flower, tree, electoral votes and presidents born per state.'

async function run(phaseName, batches, buildPrompt, labelPrefix) {
  phase(phaseName)
  const res = await parallel(batches.map((b, i) =>
    () => agent(buildPrompt(b, i), { label: labelPrefix + '-' + (i + 1), schema: SCHEMA })))
  const ok = res.filter(Boolean)
  log(phaseName + ': ' + ok.length + '/' + batches.length + ' batches, ' + ok.flatMap(r => r.files || []).length + ' files')
  return res
}

// ── Regions ────────────────────────────────────────────────────────────
const regionsRes = await run('Regions', BATCHES.regions, (b, i) => `Expand ${b.length} US region pages from about 130 words to 700 to 900 words each.

These have real search demand and are currently far too thin to hold it: /regions/northeast/ draws 299 impressions, /regions/midwest/ 268, /regions/mountain/ 194, and "mountain region" alone is 37 AI citations. They rank around position 42 because there is nothing on them.

Files (batch ${i + 1}):
${b.map(p => '- ' + REPO + '/' + p).join('\n')}

Note that regions/index.html is the hub and should be written as an overview of the whole classification, not as one region.

For each region page, build the body around what actually distinguishes that region:
- Which states belong to it and why, naming the Census Bureau definition it follows. Be precise, since the four main regions and the nine divisions are different systems and people conflate them.
- Population, land area and economic weight relative to the other regions, with real figures.
- The physical geography that gives the region its coherence: landforms, climate, watersheds.
- How the region was settled and what shaped its current character.
- What the region is genuinely known for, in concrete terms rather than adjectives.
- Where the boundary is contested. Is Maryland the South or the Mid-Atlantic. Is Missouri the Midwest or the South. These disputes are what people actually search.

Link each constituent state to /states/<slug>/. Add a table listing the member states with capital and admission year.

${RULES}

${DATA}

Return JSON: {"files":[paths],"word_counts":[numbers],"notes":"one sentence"}`, 'regions')

// ── Learn ──────────────────────────────────────────────────────────────
const learnRes = await run('Learn pages', BATCHES.learn, (b, i) => `Expand ${b.length} thin /learn/ pages to 600 to 850 words each.

These are focused question-and-answer pages with proven demand, currently 159 to 397 words. Examples of the demand: "is miami a state" 141 AI citations, "is philadelphia a state" 320 Bing impressions at position 7.1, and the Spanish capital-de-X cluster runs 12 to 58 impressions each with several sitting at position 9 to 13.

Do not turn these into essays. They answer one question and the answer belongs in the first two lines. The extra words come from context around the answer, not from padding before it.

Files (batch ${i + 1}):
${b.map(p => '- ' + REPO + '/' + p).join('\n')}

Shape for each:
- H1 matching the search query.
- Direct answer in the opening paragraph, one or two lines. This is the featured snippet target so nothing may precede it.
- Then the context that makes the page worth reading: why the confusion exists, what the related facts are, what people usually get wrong, near-answers that are commonly guessed instead.
- A small facts table where there is data to put in it.
- A related grid linking 6 to 8 genuine siblings. Verify each target exists on disk before linking it. Broken internal links are already a known problem on this site, do not add more.

${RULES}

${DATA}

Return JSON: {"files":[paths],"word_counts":[numbers],"notes":"one sentence"}`, 'learn')

// ── Play ───────────────────────────────────────────────────────────────
const playRes = await run('Game pages', BATCHES.play, (b, i) => `Add substantive surrounding content to ${b.length} game pages, taking each to 500 to 700 words of text.

These pages carry a working interactive game, which is the real value, but a crawler sees only 70 to 230 words of chrome. During an AdSense low-value-content review that reads as a thin page. The fix is not to pad, it is to write the context a player actually wants around the game.

Files (batch ${i + 1}):
${b.map(p => '- ' + REPO + '/' + p).join('\n')}

Critical: do not touch the game markup, its container, its scripts, or any element the game JavaScript queries. Add your content around it, after the game section, before the footer. If you are unsure whether an element is load bearing, leave it alone.

Add, in the language of the page:
- A short intro naming what skill the game builds and how long a round takes.
- H2 "How to play" with the actual rules, scoring and lives.
- H2 with strategy that is specific to this game. For a capitals typing game that means spelling traps and the capitals people always miss. For a silhouette game that means the lookalike pairs. For an abbreviations game that means the eight M states. Make it genuinely useful, not generic advice.
- H2 with the underlying facts the game tests, as a compact reference table where that fits.
- A closing block linking the matching /learn/ article and 3 to 5 sibling games that exist on disk.

${RULES}

${DATA}

Return JSON: {"files":[paths],"word_counts":[numbers],"notes":"one sentence"}`, 'play')

// ── About ──────────────────────────────────────────────────────────────
const docsRes = await run('About pages', BATCHES.docs, (b, i) => `Expand ${b.length} About pages to 500 to 700 words each.

An About page matters more than its traffic suggests right now: it is one of the pages a human AdSense reviewer opens to decide whether a site is a real publication or a thin content farm. The current versions are too short to answer that question.

Files (batch ${i + 1}):
${b.map(p => '- ' + REPO + '/' + p).join('\n')}

Cover, in the language of the page:
- What Statedoku is, concretely. A daily 3x3 grid puzzle where each row and column is a real geographic constraint and the cells are US states.
- Who makes it. Sacha Bitoun, solo developer, based in Paris. Say that plainly, a named human behind the site is exactly the signal a reviewer looks for.
- Why it exists and how the daily puzzle is generated.
- What else is on the site: roughly 300 learn articles, 21 mini-games, per-state reference pages, printable classroom worksheets, three languages.
- Where the data comes from: US Census Bureau, USGS, USPS, all public domain, reformatted with original prose.
- How it is funded and what the privacy stance is. No account required, no personal data collected beyond aggregated analytics.
- How to get in touch: contact@statedoku.com.

Keep the tone plain and first person where it already is. Do not invent awards, press coverage, user numbers or team members.

${RULES}

Return JSON: {"files":[paths],"word_counts":[numbers],"notes":"one sentence"}`, 'docs')

const sum = (name, res, batches) => ({
  batches_ok: res.filter(Boolean).length,
  batches_total: batches.length,
  files: res.filter(Boolean).flatMap(r => r.files || []).length,
  words: res.filter(Boolean).flatMap(r => r.word_counts || []),
})

return {
  regions: sum('regions', regionsRes, BATCHES.regions),
  learn: sum('learn', learnRes, BATCHES.learn),
  play: sum('play', playRes, BATCHES.play),
  docs: sum('docs', docsRes, BATCHES.docs),
  next: 'verify with: python3 -c thin-page recount, then commit',
}
