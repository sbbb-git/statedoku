// Prints the Buffer channel ids for an API key, so BUFFER_CHANNEL_ID can be set.
//
// Runs against Buffer directly, so it works before the worker is deployed and
// tells you whether the key itself is good, separately from anything Cloudflare.
//
//   node bot/buffer-channels.mjs buf_your_key_here
//
// No dependencies. Node 18+ for global fetch.

// Reading from stdin when no argument is given keeps the key out of shell
// history, which is where it ends up if it is typed as an argument.
async function readStdin(promptText) {
  process.stderr.write(promptText);
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString().trim();
}

let token = process.argv[2] || process.env.BUFFER_TOKEN;
if (!token && !process.stdin.isTTY) token = await readStdin('');
if (!token && process.stdin.isTTY) token = await readStdin('Paste your Buffer API key, then Ctrl-D: ');

if (!token) {
  console.error('usage: node bot/buffer-channels.mjs <BUFFER_TOKEN>');
  console.error('   or: node bot/buffer-channels.mjs        (prompts, keeps the key out of history)');
  process.exit(1);
}

// The setup instructions hand out a command with a placeholder in it, so catch
// the placeholder itself rather than letting it come back as a puzzling 401.
if (/TA_CLE|YOUR_KEY|your_key|xxx+$|TON_TOKEN/i.test(token)) {
  console.error(`That is the placeholder from the instructions, not a key: "${token}"`);
  console.error('Get the real one at https://publish.buffer.com/settings/api and pass that instead.');
  process.exit(1);
}
// No format check here on purpose. Buffer's docs describe keys as `buf_...`,
// but working keys are issued in an older format too, and warning about a key
// that then authenticates fine just trains you to ignore the output.

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
    console.error('Keys are at https://publish.buffer.com/settings/api. Both the newer');
    console.error('"buf_..." format and the older opaque one work, so the shape is not the issue.');
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
