// Checks BUFFER_TOKEN against Buffer and finds the X channel, for the bot
// workflow (.github/workflows/bot.yml). The key lives in GitHub secrets; the
// worker can only read Cloudflare secrets, so the workflow carries it across.
//
// The repo is public and so are its Actions logs. This prints counts and
// service names only: never the key, never an id. The X channel id is masked
// and handed to later steps through $GITHUB_ENV as BUFFER_CHANNEL_ID.
//
// Exits 1 with a plain reason when the key is missing or refused, or when the
// account does not hold exactly one X channel.
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

if (xChannels.length !== 1) {
  console.log(`::error::Expected exactly one X channel in Buffer, found ${xChannels.length}. ` +
    'Connect the @statedoku X account at https://publish.buffer.com, or remove the extra one.');
  process.exit(1);
}

const id = xChannels[0].id;
console.log(`::add-mask::${id}`);
console.log('One X channel found, its id is passed on as BUFFER_CHANNEL_ID.');
if (process.env.GITHUB_ENV) fs.appendFileSync(process.env.GITHUB_ENV, `BUFFER_CHANNEL_ID=${id}\n`);
