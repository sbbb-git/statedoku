// Checks BUFFER_TOKEN against Buffer and finds the X channel, for the bot
// workflow (.github/workflows/bot.yml). The key lives in GitHub secrets; the
// worker can only read Cloudflare secrets, so the workflow carries it across.
//
// The repo is public and so are its Actions logs. This prints counts and
// service names only: never the key, never an id. The X channel id is masked
// and handed to later steps through $GITHUB_ENV as BUFFER_CHANNEL_ID.
//
// Exits 1 with a plain reason when the key is missing or refused, or when no
// single X channel can be picked (one channel, or the one named BUFFER_X_HANDLE,
// default "statedoku").
import fs from 'node:fs';

const token = (process.env.BUFFER_TOKEN || '').trim();
if (!token) {
  console.log('::error::The BUFFER_TOKEN secret is missing or empty in this repository.');
  process.exit(1);
}

async function gql(query) {
  const r = await fetch('https://api.buffer.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query }),
  });
  const text = await r.text();
  if (r.status === 401) {
    console.log('::error::Buffer refused the key (401): wrong, revoked, or pasted with extra spaces. ' +
      'Keys are at https://publish.buffer.com/settings/api');
    process.exit(1);
  }
  let json = null;
  try { json = JSON.parse(text); } catch { /* reported below */ }
  if (!json) {
    console.log(`::error::Buffer answered HTTP ${r.status} with a body that is not JSON.`);
    process.exit(1);
  }
  if (json.errors?.length) {
    console.log('::error::Buffer GraphQL error: ' + json.errors.map((e) => e.message).join('; '));
    process.exit(1);
  }
  return json.data;
}

const orgs = (await gql('query { account { organizations { id name } } }'))?.account?.organizations ?? [];
let total = 0;
const services = {};
const xChannels = [];
for (const org of orgs) {
  const channels = (await gql(
    `query { channels(input: { organizationId: ${JSON.stringify(org.id)} }) { id name service } }`
  ))?.channels ?? [];
  for (const c of channels) {
    total++;
    services[c.service] = (services[c.service] || 0) + 1;
    if (/twitter|^x$/i.test(c.service || '')) xChannels.push(c);
  }
}

// Always report what was looked at, including when it is nothing.
console.log(`Buffer key accepted. ${orgs.length} organization(s), ${total} channel(s): ` +
  (Object.entries(services).map(([s, n]) => `${s} ${n}`).join(', ') || 'none'));

// The Buffer account can hold other X accounts (on 16 October 2026 it held
// two). Pick the one whose name is the handle, and never print the others:
// these logs are public and would tie those accounts to this site.
const handle = (process.env.BUFFER_X_HANDLE || 'statedoku').replace(/^@/, '').toLowerCase();
const named = (c) => String(c.name || '').replace(/^@/, '').toLowerCase();
const picked = xChannels.length === 1 ? xChannels : xChannels.filter((c) => named(c) === handle);
if (picked.length !== 1) {
  console.log(`::error::Found ${xChannels.length} X channel(s) in Buffer and ${picked.length} named "${handle}". ` +
    'Connect the @statedoku X account at https://publish.buffer.com, or set BUFFER_X_HANDLE to its name.');
  process.exit(1);
}
if (xChannels.length > 1) console.log(`${xChannels.length} X channels in this Buffer account; using the one named "${handle}".`);

const id = picked[0].id;
console.log(`::add-mask::${id}`);
console.log('One X channel found, its id is passed on as BUFFER_CHANNEL_ID.');
if (process.env.GITHUB_ENV) fs.appendFileSync(process.env.GITHUB_ENV, `BUFFER_CHANNEL_ID=${id}\n`);
