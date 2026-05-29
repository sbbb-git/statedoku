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

const req = https.request('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(payload) },
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log(`\nIndexNow response: HTTP ${res.statusCode}`);
    // 200 = accepted, 202 = accepted pending validation, 422 = URLs don't match host/key
    if (res.statusCode === 200 || res.statusCode === 202) {
      console.log('✅ Submitted successfully. Bing/Yandex/Seznam will crawl shortly.');
    } else {
      console.log('⚠️ Response body:', body || '(empty)');
      if (res.statusCode === 403) console.log('→ Key file not found/invalid. Make sure ' + KEY_LOCATION + ' is live.');
      if (res.statusCode === 422) console.log('→ URL/host/key mismatch.');
    }
  });
});
req.on('error', e => console.error('Request failed:', e.message));
req.write(payload);
req.end();
