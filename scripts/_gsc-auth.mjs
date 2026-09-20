/**
 * Google service-account auth, shared by the performance and the index
 * collectors so the JWT is built in exactly one place.
 *
 * The key never leaves CI: it is a GitHub secret, read by the workflow and by
 * nothing else. Only the name of the variable it came from is ever logged.
 */
import crypto from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

// GitHub gives no way to list the secrets on a repository, and a secret that
// does not exist expands to an empty string. Guessing one name and getting it
// wrong means skipping in silence forever, which is the failure this whole
// arrangement exists to avoid, so the workflow passes several.
export const KEY_VARS = [
  'GSC_SERVICE_ACCOUNT_JSON',
  'GOOGLE_SERVICE_ACCOUNT_JSON',
  'GOOGLE_SERVICE_ACCOUNT',
  'SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON',
  'GSC_KEY_JSON',
];

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function readKey() {
  const found = KEY_VARS.find((v) => (process.env[v] || '').trim());
  if (!found) return { skip: `none of ${KEY_VARS.join(', ')} is set` };

  let key;
  try {
    key = JSON.parse(process.env[found]);
  } catch (e) {
    throw new Error(`${found} is not valid JSON (${e.message}). ` +
      'Paste the downloaded key file whole, including the outer braces.');
  }
  for (const f of ['client_email', 'private_key']) {
    if (!key[f]) throw new Error(`${found} has no "${f}". This is not a service-account key file.`);
  }
  return { key, found };
}

export async function accessToken(key, scope) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: key.client_email, scope, aud: TOKEN_URL, iat: now, exp: now + 3600 };
  const signingInput =
    b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + b64url(JSON.stringify(claims));

  let signature;
  try {
    signature = b64url(crypto.sign('RSA-SHA256', Buffer.from(signingInput), key.private_key));
  } catch (e) {
    throw new Error(`Could not sign the JWT with private_key (${e.message}). ` +
      'A key pasted through a shell often loses its newlines; they must survive as \\n.');
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${signingInput}.${signature}`,
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    const hint = /account not found|invalid_grant/.test(body)
      ? ' The signature is well formed but Google does not know this account. ' +
        'Check client_email, and that the service account still exists.'
      : '';
    throw new Error(`token exchange failed ${res.status}: ${body}${hint}`);
  }
  return JSON.parse(body).access_token;
}

/**
 * One request with retries on 429 and 5xx.
 *
 * Nothing here is urgent, and a rate-limit answer that is allowed to propagate
 * costs the whole weekly reading. The API only ever returns the present, so a
 * hole punched in the history by a transient failure is a hole no later run can
 * fill.
 */
export async function fetchRetry(url, init = {}, { tries = 4, baseDelayMs = 1000 } = {}) {
  let last;
  for (let attempt = 1; attempt <= tries; attempt++) {
    let res;
    try {
      res = await fetch(url, init);
    } catch (e) {
      last = e;
      if (attempt === tries) throw e;
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** (attempt - 1)));
      continue;
    }
    if (res.status !== 429 && res.status < 500) return res;
    last = new Error(`${res.status}`);
    if (attempt === tries) return res;
    const retryAfter = Number(res.headers.get('retry-after'));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : baseDelayMs * 2 ** (attempt - 1);
    await new Promise((r) => setTimeout(r, wait));
  }
  throw last;
}

/** Run tasks with a small fixed concurrency. Nothing presses; a 429 costs more. */
export async function pool(items, limit, worker) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await worker(items[i], i);
      }
    })
  );
  return out;
}
