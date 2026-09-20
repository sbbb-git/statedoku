/**
 * Which site are we talking about, read rather than guessed.
 *
 * Never build a property id by hand and never add one more environment
 * variable for it. functions/sitemap.xml.js already decides which URLs this
 * site publishes, so it is the file that has authority on the domain. Read it.
 *
 * A check that finds nothing has verified nothing: every reader here fails
 * loudly and reports how many items it saw, rather than returning an empty
 * list that reads downstream as "all clear".
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function siteBase() {
  const f = path.join(ROOT, 'functions', 'sitemap.xml.js');
  const src = await fs.readFile(f, 'utf8');
  const m = src.match(/const\s+BASE\s*=\s*['"](https?:\/\/[^'"]+)['"]/);
  if (!m) {
    throw new Error(`No BASE constant found in ${f}. That file is the authority on this ` +
      'site\'s domain; if it moved, point _site.mjs at the new one rather than hardcoding a host.');
  }
  return m[1].replace(/\/+$/, '');
}

export async function siteHost() {
  return new URL(await siteBase()).host;
}

/**
 * Pick the property this repo is about out of everything the credential opens.
 *
 * A Bing key opens every site verified on the account, and a Google service
 * account can be added to properties across several projects. Guessing silently
 * is how one project's data ends up archived under another project's name.
 * Match on host, and when nothing matches, fail naming the candidates.
 */
export function pickProperty(candidates, host, label) {
  const norm = (u) => u.replace(/^sc-domain:/, '').replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase();
  const hit = candidates.filter((c) => norm(c) === host.toLowerCase());
  if (!hit.length) {
    throw new Error(`None of the ${candidates.length} ${label} this credential opens is ${host}. ` +
      `Candidates: ${candidates.join(', ')}`);
  }
  return hit;
}

/** The URLs this site publishes, straight from the live sitemap. */
export async function sitemapUrls(base) {
  const res = await fetch(`${base}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml -> ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (!urls.length) {
    throw new Error('The sitemap parsed to zero URLs. Either it is empty or its shape changed; ' +
      'either way, inspecting nothing and reporting success would be worse.');
  }
  return urls;
}
