// Prints the Buffer channel ids for an API key, so BUFFER_CHANNEL_ID can be set.
//
// Runs against Buffer directly, so it works before the worker is deployed and
// tells you whether the key itself is good, separately from anything Cloudflare.
//
//   node bot/buffer-channels.mjs buf_your_key_here
//
// No dependencies. Node 18+ for global fetch.

const token = process.argv[2] || process.env.BUFFER_TOKEN;
if (!token) {
  console.error('usage: node bot/buffer-channels.mjs <BUFFER_TOKEN>');
  process.exit(1);
}
if (!token.startsWith('buf_')) {
  console.error(`warning: Buffer keys normally start with "buf_", got "${token.slice(0, 6)}..."`);
}

async function gql(query) {
  const r = await fetch('https://api.buffer.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query }),
  });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  if (r.status === 401) {
    console.error('401 Unauthorized. The key is wrong, revoked, or was copied with whitespace.');
    process.exit(1);
  }
  if (!json) {
    console.error(`HTTP ${r.status}, response was not JSON:\n${text.slice(0, 500)}`);
    process.exit(1);
  }
  if (json.errors?.length) {
    console.error('GraphQL error:', json.errors.map(e => e.message).join('; '));
    process.exit(1);
  }
  return json.data;
}

const orgs = (await gql('query { account { organizations { id name } } }'))?.account?.organizations ?? [];
if (!orgs.length) {
  console.error('No organizations on this account. Log in to publish.buffer.com and finish setup first.');
  process.exit(1);
}

for (const org of orgs) {
  console.log(`\norganization  ${org.name}  (${org.id})`);
  const channels = (await gql(
    `query { channels(input: { organizationId: ${JSON.stringify(org.id)} }) { id name service } }`
  ))?.channels ?? [];

  if (!channels.length) {
    console.log('  no channels connected yet');
    continue;
  }
  for (const c of channels) {
    const isX = /twitter|^x$/i.test(c.service || '');
    console.log(`  ${isX ? '->' : '  '} ${String(c.service).padEnd(10)} ${String(c.name).padEnd(24)} ${c.id}`);
  }
  const x = channels.filter(c => /twitter|^x$/i.test(c.service || ''));
  if (x.length === 1) {
    console.log(`\nSet this one:\n  npx wrangler secret put BUFFER_CHANNEL_ID\n  ${x[0].id}`);
  } else if (x.length > 1) {
    console.log('\nSeveral X channels found. Pick the one for @statedoku.');
  } else {
    console.log('\nNo X channel here. Connect the X account at publish.buffer.com first.');
  }
}
