export const meta = {
  name: 'rewrite-subtopics-for-uniqueness',
  description: 'Rewrite geography, people and history subtopic pages so each is genuinely per-state rather than a filled-in template',
  phases: [
    { title: 'Geography' },
    { title: 'People' },
    { title: 'History' },
  ],
}

const REPO = '/Users/sacha/Desktop/Statoku'

const STATES = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware',
'florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine',
'maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada',
'new-hampshire','new-jersey','new-mexico','new-york','north-carolina','north-dakota','ohio','oklahoma',
'oregon','pennsylvania','rhode-island','south-carolina','south-dakota','tennessee','texas','utah',
'vermont','virginia','washington','west-virginia','wisconsin','wyoming']

function chunk(a, n) { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o }

const SCHEMA = {
  type: 'object',
  required: ['files', 'word_counts'],
  properties: {
    files: { type: 'array', items: { type: 'string' } },
    word_counts: { type: 'array', items: { type: 'number' } },
    notes: { type: 'string' },
  },
}

// The whole point of this run. Stated once, reused in every prompt.
const WHY = `WHY THIS REWRITE EXISTS, read carefully before writing a single line.

These pages are already long. That is not the problem. The problem is measured: across all 50 states, any two of these pages currently share about 60 percent of their five-word sequences. They were generated from a template with the state name swapped in, and Google's AdSense review flagged the site for low-value content as a direct result. A previous rewrite of the /symbols/ pages brought overlap down from 59 percent to 8 percent and those pages are now genuinely good, so the bar is proven reachable.

Your output will be measured the same way. A rewrite that keeps the same sentence frames and swaps the nouns is a failed rewrite even if it is 900 words long. Concretely this means:

- Do not reuse a section order or sentence frame across the states in your batch. If two of your pages open the same way, rewrite one of them.
- Lead with what is specific and strange about THIS state, not with a category sentence. "Michigan is the only state split into two land masses by water, and the bridge joining them did not exist until 1957" is the right shape. "Michigan is located in the Midwest region and covers 96,716 square miles" is the wrong shape and is the exact frame that got the site flagged.
- Proper nouns are the tell. A good paragraph on this topic for this state is dense with names, numbers and dates that could not appear on any other state's page. If a sentence would remain true after swapping in a different state name, cut it.
- Never write the phrase "is known for", "is home to", "boasts", "plays a significant role", "diverse landscape", or "rich history".`

const COMMON = `Preserve the entire <head> exactly: title, meta description, canonical, hreflang, BreadcrumbList JSON-LD, and the robots meta. Do NOT touch the robots tag. A separate script re-indexes these only after verifying both length and uniqueness, so leaving it alone is correct.

Keep or add the ad placeholders: an HTML comment PLACEHOLDER_LEARN_MID after the first H2 and PLACEHOLDER_LEARN_BOTTOM just before the closing main tag.

Keep or add a related-grid at the end linking 6 to 8 sibling pages for this state and the same topic for neighbouring states.

Update the FAQPage JSON-LD if present, or add one, with 4 to 5 questions phrased the way people actually search. Answers must be specific and correct.

Style: no em-dashes or en-dashes, use commas and periods. No "Did you know" or "Fun fact" openers. Never invent a statistic, date or name, omit rather than guess.

Data available: ${REPO}/data/states.json has capital, largest city, region, subregion, admission year, population band, area rank, timezone, plus boolean flags for things like landlocked, bordersCanada, hasGlaciers, continentalDivide, appalachian, greatPlains. ${REPO}/data/play-extra.json has nickname, motto, bird, flower, tree, electoral votes and presidents born there.`

// ── PHASE 1: geography ─────────────────────────────────────────────────
phase('Geography')

const geoBatches = chunk(STATES, 5)
const geoResults = await parallel(geoBatches.map((b, i) => () => agent(
`Rewrite ${b.length} /states/<state>/geography/ pages so each is genuinely about that one state.

Highest-value batch on the site. "minnesota geography" alone earns 987 AI citations and 797 Bing impressions at position 6.6. "maine geography" 197 citations and 206 impressions at position 6.0. "wyoming geography" 254 impressions, "wisconsin geography" 187. These pages rank and get cited already, they simply are not good enough to survive a quality review.

Files (batch ${i + 1}):
${b.map(s => '- ' + REPO + '/states/' + s + '/geography/index.html').join('\n')}

${WHY}

Target 750 to 1000 words of body. Build each page around the geography that is actually distinctive for that state. Useful angles, pick the ones that genuinely apply rather than working through all of them:
- The highest and lowest points by name and elevation, and how big that spread is compared to other states.
- The physiographic regions the state actually spans, named properly, and where the boundaries fall.
- Rivers and lakes that define borders or drainage, including which watershed the state drains into.
- Borders that are geometrically odd, disputed historically, or defined by something other than a straight line.
- Whether the state spans more than one time zone, and where the line runs.
- Climate extremes with the recorded numbers.
- Anything genuinely unique: the only state with X, the largest Y in the country, a feature shared with no other state.

Structure it with 4 to 6 H2 sections whose titles differ between states. Do not impose one section scheme on all five pages in your batch.

${COMMON}

Return JSON: {"files":[paths],"word_counts":[numbers],"notes":"one sentence on what made each state distinct"}`,
  { label: 'geo-' + (i + 1), schema: SCHEMA })))

log('geography: ' + geoResults.filter(Boolean).length + '/' + geoBatches.length + ' batches ok')

// ── PHASE 2: people ────────────────────────────────────────────────────
phase('People')

const peopleBatches = chunk(STATES, 5)
const peopleResults = await parallel(peopleBatches.map((b, i) => () => agent(
`Rewrite ${b.length} /states/<state>/people/ pages so each names real people instead of describing categories.

Demand is proven across many states: "famous people from arkansas" 152 AI citations, colorado 114, virginia 78, tennessee 78, oklahoma 62, mississippi 53, ohio 42, washington 38, georgia 35, california 32, alaska 20, plus variants like "famous ohioans" 22 and "famous washingtonians" 8.

Files (batch ${i + 1}):
${b.map(s => '- ' + REPO + '/states/' + s + '/people/index.html').join('\n')}

${WHY}

The current version of these pages is the worst offender on the site. It says things like "California has produced notable figures across politics, sports, entertainment, business, science, and the arts" and then points at Wikipedia. That sentence is true of all 50 states, carries no information, and is precisely what a quality reviewer penalises.

Target 800 to 1000 words. Name actual people. For each state, cover the ones that genuinely belong to it:
- Presidents born there, with birthplace town and years in office. If none, say so plainly and name the closest near-miss, such as a president raised there but born elsewhere.
- Two or three figures the state is genuinely most associated with, each with a sentence on what they did and their connection to the place.
- People from the state who are famous but whose origin surprises people.
- Where relevant: civil rights figures, writers, musicians, athletes, scientists, business founders. Only include a category if you can name someone real for it.

Only write a name you are confident about. A page with eight correct names beats one with twenty where three are wrong. If you are unsure whether someone was born in the state versus merely associated with it, say "raised in" or "long associated with" rather than "born in".

Structure with 4 to 6 H2 sections. Vary the section titles and order between the states in your batch.

${COMMON}

Return JSON: {"files":[paths],"word_counts":[numbers],"notes":"one sentence"}`,
  { label: 'people-' + (i + 1), schema: SCHEMA })))

log('people: ' + peopleResults.filter(Boolean).length + '/' + peopleBatches.length + ' batches ok')

// ── PHASE 3: history ───────────────────────────────────────────────────
phase('History')

const histBatches = chunk(STATES, 5)
const histResults = await parallel(histBatches.map((b, i) => () => agent(
`Rewrite ${b.length} /states/<state>/history/ pages so each tells that state's actual story.

Demand: "louisiana history" 59 AI citations, "nebraska history" 21, "history of washington state" 12, "mississippi history" 12, "north dakota history" 6.

Files (batch ${i + 1}):
${b.map(s => '- ' + REPO + '/states/' + s + '/history/index.html').join('\n')}

${WHY}

Target 850 to 1100 words. Every state has a genuinely different story, so there is no excuse for these to converge. Build a real narrative rather than a list of eras:
- Who was there before European contact, named by nation rather than as "Native Americans".
- Which colonial power claimed it and how it passed to the United States, whether by purchase, treaty, war, annexation or partition. The Louisiana Purchase, the Mexican Cession, the Oregon Treaty, the Texas annexation and the Gadsden Purchase each moved different states and the specifics matter.
- Territorial period and the road to statehood, with the admission date and what the debate was about. For many states admission was entangled with the balance of slave and free states, and that is worth naming where true.
- The Civil War where it applies, including the states that split, stayed neutral, or never had the question.
- One or two turning points from the 20th century specific to that state: an industry that arrived or collapsed, a migration, a disaster, a piece of legislation.

Structure with 4 to 6 H2 sections whose titles reflect that state's actual periods rather than a generic timeline. Vary structure across the batch.

${COMMON}

Return JSON: {"files":[paths],"word_counts":[numbers],"notes":"one sentence"}`,
  { label: 'hist-' + (i + 1), schema: SCHEMA })))

log('history: ' + histResults.filter(Boolean).length + '/' + histBatches.length + ' batches ok')

const summarise = (name, res, batches) => ({
  batches_ok: res.filter(Boolean).length,
  batches_total: batches.length,
  files: res.filter(Boolean).flatMap(r => r.files || []).length,
  words: res.filter(Boolean).flatMap(r => r.word_counts || []),
})

return {
  geography: summarise('geography', geoResults, geoBatches),
  people: summarise('people', peopleResults, peopleBatches),
  history: summarise('history', histResults, histBatches),
  next_step: 'run tmp/reindex-expanded.py geography people history symbols fun-facts, the uniqueness gate decides what gets indexed',
}
