// One post through Buffer, now, from the bot workflow (mode "post").
//
//   POST_TARGET  x        POST_TEXT goes to the X channel (BUFFER_CHANNEL_ID)
//                shorts   video POST_VIDEO of data/videos.json goes to TikTok and
//                         YouTube, as the bot's evening run would post it
//                tiktok / youtube   the same, one platform
//
// Channel ids come from bot/buffer-check.mjs through GITHUB_ENV. The repo and
// its Actions logs are public: this prints the platform, the due time and
// Buffer's verdict, never a key or an id. Each post is scheduled two minutes
// out, as the worker does, and Buffer publishes it.
import fs from 'node:fs';

const token = (process.env.BUFFER_TOKEN || '').trim();
const target = (process.env.POST_TARGET || '').trim();
if (!token) { console.log('::error::BUFFER_TOKEN is missing'); process.exit(1); }

async function gql(query) {
  const r = await fetch('https://api.buffer.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query }),
  });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { errors: [{ message: `HTTP ${r.status}, body not JSON` }] }; }
}

async function post(label, channelId, text, videoUrl, metadata) {
  if (!channelId) { console.log(`::error::no ${label} channel id (is the channel connected in Buffer?)`); return false; }
  const dueAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
  // Text-only posts leave assets out, as the worker's working X posts do.
  const assets = videoUrl ? `assets: [{ video: { url: ${JSON.stringify(videoUrl)} } }],` : '';
  const meta = metadata ? `metadata: ${metadata},` : '';
  const res = await gql(`mutation { createPost(input: {
      text: ${JSON.stringify(text)}, channelId: ${JSON.stringify(channelId)}, ${assets} ${meta}
      schedulingType: automatic, mode: customScheduled, dueAt: ${JSON.stringify(dueAt)} }) {
    ... on PostActionSuccess { post { id dueAt } }
    ... on MutationError { message } } }`);
  const p = res?.data?.createPost;
  const err = res?.errors?.[0]?.message || p?.message;
  if (err || !p?.post?.id) { console.log(`::error::${label}: Buffer refused the post: ${err || 'no post id returned'}`); return false; }
  console.log(`${label}: scheduled for ${p.post.dueAt}, Buffer publishes it then.`);
  return true;
}

let ok = true;
if (target === 'x') {
  const text = (process.env.POST_TEXT || '').trim();
  if (!text) { console.log('::error::POST_TEXT is empty'); process.exit(1); }
  if (/[‒–—]/.test(text)) { console.log('::error::no unicode dash in a post (CLAUDE.md)'); process.exit(1); }
  ok = await post('X', process.env.BUFFER_CHANNEL_ID, text, null, null);
} else if (['shorts', 'tiktok', 'youtube'].includes(target)) {
  const n = Number(process.env.POST_VIDEO || '1');
  const bank = JSON.parse(fs.readFileSync(new URL('../data/videos.json', import.meta.url), 'utf8'));
  const v = (bank.videos || []).find((x) => x.n === n);
  if (!v || !v.vertical_url || !v.tiktok || !v.youtube) { console.log(`::error::video ${n} has no vertical_url, tiktok or youtube field`); process.exit(1); }
  const code = (await fetch(v.vertical_url, { method: 'HEAD' })).status;
  if (code !== 200) { console.log(`::error::video ${n} answers ${code}, Buffer could not fetch it`); process.exit(1); }
  console.log(`Video ${n} (${v.slug}) answers 200.`);
  if (target !== 'youtube') ok = (await post('TikTok', process.env.BUFFER_TIKTOK_CHANNEL_ID, v.tiktok, v.vertical_url,
    '{ tiktok: { isAiGenerated: true } }')) && ok;
  if (target !== 'tiktok') ok = (await post('YouTube', process.env.BUFFER_YOUTUBE_CHANNEL_ID, v.youtube.description, v.vertical_url,
    `{ youtube: { title: ${JSON.stringify(v.youtube.title)}, categoryId: "27", madeForKids: false, notifySubscribers: true } }`)) && ok;
} else {
  console.log('::error::POST_TARGET must be x, shorts, tiktok or youtube'); process.exit(1);
}
process.exit(ok ? 0 : 1);
