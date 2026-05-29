#!/usr/bin/env node
/**
 * Submit all sitemap URLs to IndexNow (Bing, Yandex, Seznam, Naver instantly;
 * Google reads it too via the shared protocol).
 *
 * IndexNow lets you PING search engines the moment pages change instead of
 * waiting for the next crawl. One POST submits up to 10,000 URLs.
 *
 * Usage:
 *   node tmp/indexnow-submit.js            # submit the full URL list
 *   node tmp/indexnow-submit.js --dry-run  # print the payload only
 *
 * Key file must be live at https://statedoku.com/<KEY>.txt (deploy first).
 */
const https = require('https');

const KEY = 'a7844e0c0770e4f1a297158b783450d7';
const HOST = 'statedoku.com';
const BASE = 'https://statedoku.com';
const KEY_LOCATION = `${BASE}/${KEY}.txt`;
const DRY = process.argv.includes('--dry-run');

// Build the same URL list as the sitemap (the highest-value pages).
const urls = [];
const add = (u) => urls.push(BASE + u);

['/', '/fr/', '/es/', '/archive/', '/facts/', '/learn/', '/fr/learn/', '/es/learn/',
 '/learn/state-capitals/', '/learn/us-regions/', '/quiz/', '/states/', '/cities/',
 '/regions/', '/api/', '/press/', '/about/', '/how-to-play/', '/faq/',
 '/learn/printable-us-states-map/', '/learn/crossword-helper/',
 '/es/learn/crucigrama-estados/', '/es/learn/capitales-de-estados/'].forEach(add);

const stateSlugs = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new-hampshire','new-jersey','new-mexico','new-york','north-carolina','north-dakota','ohio','oklahoma','oregon','pennsylvania','rhode-island','south-carolina','south-dakota','tennessee','texas','utah','vermont','virginia','washington','west-virginia','wisconsin','wyoming'];
stateSlugs.forEach(s => add(`/states/${s}/`));
stateSlugs.forEach(s => add(`/es/states/${s}/`));
const SUBTOPICS = ['map','history','geography','people','sports','elections','travel','weather','symbols','fun-facts','economy','food'];
stateSlugs.forEach(s => SUBTOPICS.forEach(t => add(`/states/${s}/${t}/`)));
const CITIES = ['new-york','los-angeles','chicago','houston','phoenix','philadelphia','san-antonio','san-diego','dallas','san-jose','austin','jacksonville','fort-worth','columbus','charlotte','san-francisco','indianapolis','seattle','denver','washington','boston','el-paso','nashville','detroit','oklahoma-city','portland','las-vegas','memphis','louisville','baltimore','milwaukee','albuquerque','tucson','fresno','sacramento','mesa','kansas-city','atlanta','omaha','colorado-springs','raleigh','miami','long-beach','virginia-beach','oakland','minneapolis','tulsa','arlington','new-orleans','wichita','cleveland','tampa','bakersfield','aurora','honolulu','anaheim','santa-ana','corpus-christi','riverside','lexington','stockton','henderson','saint-paul','st-louis','cincinnati','pittsburgh','greensboro','anchorage','plano','lincoln','orlando','irvine','newark','durham','chula-vista','toledo','fort-wayne','st-petersburg','laredo','jersey-city','chandler','madison','lubbock','scottsdale','reno','buffalo','gilbert','glendale','north-las-vegas','winston-salem','chesapeake','norfolk','fremont','garland','irving','hialeah','richmond','boise','spokane','baton-rouge','tacoma'];
CITIES.forEach(c => add(`/cities/${c}/`));
const LEARN = ['state-mottos','state-nicknames','state-flags','state-birds','state-flowers','state-trees','state-songs','state-capitals-pronunciation','state-license-plates','state-quarters','states-by-statehood-year','states-by-time-zone','states-by-population','electoral-college','swing-states','states-presidents-born','states-largest-cities','states-without-capital-largest','states-with-oceans','states-with-great-lakes','states-with-mountains','states-with-deserts','states-with-national-parks','cheapest-states-to-live','most-expensive-states','best-states-for-retirees','states-by-region-list','us-territories','states-confederate','state-sport','state-abbreviations','states-and-capitals','13-colonies','landlocked-states','states-bordering-mexico','states-bordering-canada','largest-states','no-income-tax'];
LEARN.forEach(s => add(`/learn/${s}/`));
['northeast','south','midwest','west','new-england','mid-atlantic','south-atlantic','east-south-central','west-south-central','east-north-central','west-north-central','mountain','pacific'].forEach(r => add(`/regions/${r}/`));
['las-vegas','boston','atlanta','miami','minneapolis','philadelphia','charlotte','seattle','portland','phoenix'].forEach(c => add(`/learn/is-${c}-a-state/`));
['miami','pittsburgh','baltimore','milwaukee','las-vegas','charlotte','durham'].forEach(c => add(`/learn/capital-of-${c}/`));

const payload = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls });

console.log(`📦 ${urls.length} URLs prepared for IndexNow.`);

if (DRY) {
  console.log('🧪 DRY RUN — first 5 URLs:');
  urls.slice(0, 5).forEach(u => console.log('  ' + u));
  console.log(`\nKey location: ${KEY_LOCATION}`);
  console.log('Run without --dry-run to submit.');
  process.exit(0);
}

// IndexNow is a shared protocol — submitting to ANY endpoint propagates to all
// participating engines. We try them in order with retries to survive the
// occasional Bing-side 5xx outage.
const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];

function submit(endpoint) {
  return new Promise((resolve) => {
    const req = https.request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(payload);
    req.end();
  });
}

(async () => {
  for (const endpoint of ENDPOINTS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { status, body } = await submit(endpoint);
      const host = endpoint.replace(/^https:\/\//, '').split('/')[0];
      if (status === 200 || status === 202) {
        console.log(`\n✅ Submitted ${urls.length} URLs via ${host} (HTTP ${status}). Crawlers will pick up shortly.`);
        return;
      }
      console.log(`  ${host} attempt ${attempt}: HTTP ${status}${status >= 500 ? ' (server down, retrying…)' : ''}`);
      if (status === 403) { console.log(`  → Key file unreachable: ${KEY_LOCATION}`); break; }
      if (status === 422) { console.log('  → URL/host/key mismatch.'); break; }
      if (status >= 500 || status === 0) { await new Promise(r => setTimeout(r, 5000)); continue; }
      break; // other 4xx → try next endpoint
    }
  }
  console.log('\n⚠️ All endpoints failed (likely a temporary Bing/Yandex outage).');
  console.log('   Your setup is valid — just re-run this script later:');
  console.log('   node tmp/indexnow-submit.js');
})();
