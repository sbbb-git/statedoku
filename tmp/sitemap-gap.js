#!/usr/bin/env node
/**
 * Find indexable HTML pages on disk that are NOT in the generated sitemap.
 * Mirrors the URL list built in functions/sitemap.xml.js.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// ── Rebuild the sitemap URL set (must mirror functions/sitemap.xml.js) ──
const BASE = '';
const urls = new Set();
const add = u => urls.add(u.replace(/\/$/, '') || '/');

// evergreen
['/', '/fr/', '/es/', '/archive/', '/fr/archive/', '/es/archive/', '/facts/',
 '/learn/', '/fr/learn/', '/es/learn/', '/learn/state-capitals/', '/learn/us-regions/',
 '/quiz/', '/states/', '/about/', '/fr/about/', '/es/about/', '/how-to-play/',
 '/fr/how-to-play/', '/es/how-to-play/', '/faq/', '/fr/faq/', '/es/faq/',
 '/privacy/', '/terms/'].forEach(add);

const stateSlugs = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new-hampshire','new-jersey','new-mexico','new-york','north-carolina','north-dakota','ohio','oklahoma','oregon','pennsylvania','rhode-island','south-carolina','south-dakota','tennessee','texas','utah','vermont','virginia','washington','west-virginia','wisconsin','wyoming'];
stateSlugs.forEach(s => add(`/states/${s}/`));
add('/es/states/');
stateSlugs.forEach(s => add(`/es/states/${s}/`));
const SUBTOPICS = ['map','history','geography','people','sports','elections','travel','weather','symbols','fun-facts','economy','food'];
stateSlugs.forEach(s => SUBTOPICS.forEach(t => add(`/states/${s}/${t}/`)));
const CITIES = ['new-york','los-angeles','chicago','houston','phoenix','philadelphia','san-antonio','san-diego','dallas','san-jose','austin','jacksonville','fort-worth','columbus','charlotte','san-francisco','indianapolis','seattle','denver','washington','boston','el-paso','nashville','detroit','oklahoma-city','portland','las-vegas','memphis','louisville','baltimore','milwaukee','albuquerque','tucson','fresno','sacramento','mesa','kansas-city','atlanta','omaha','colorado-springs','raleigh','miami','long-beach','virginia-beach','oakland','minneapolis','tulsa','arlington','new-orleans','wichita','cleveland','tampa','bakersfield','aurora','honolulu','anaheim','santa-ana','corpus-christi','riverside','lexington','stockton','henderson','saint-paul','st-louis','cincinnati','pittsburgh','greensboro','anchorage','plano','lincoln','orlando','irvine','newark','durham','chula-vista','toledo','fort-wayne','st-petersburg','laredo','jersey-city','chandler','madison','lubbock','scottsdale','reno','buffalo','gilbert','glendale','north-las-vegas','winston-salem','chesapeake','norfolk','fremont','garland','irving','hialeah','richmond','boise','spokane','baton-rouge','tacoma'];
add('/cities/');
CITIES.forEach(c => add(`/cities/${c}/`));
const LEARN_NEW = ['state-mottos','state-nicknames','state-flags','state-birds','state-flowers','state-trees','state-songs','state-capitals-pronunciation','state-license-plates','state-quarters','states-by-statehood-year','states-by-time-zone','states-by-population','electoral-college','swing-states','states-presidents-born','states-largest-cities','states-without-capital-largest','states-with-oceans','states-with-great-lakes','states-with-mountains','states-with-deserts','states-with-national-parks','cheapest-states-to-live','most-expensive-states','best-states-for-retirees','states-by-region-list','us-territories','states-confederate','state-sport'];
LEARN_NEW.forEach(s => add(`/learn/${s}/`));
const LONGTAIL = ['state-abbreviations','states-and-capitals','13-colonies','landlocked-states','states-bordering-mexico','states-bordering-canada','largest-states','no-income-tax'];
LONGTAIL.forEach(s => { add(`/learn/${s}/`); add(`/fr/learn/${s}/`); add(`/es/learn/${s}/`); });
add('/regions/');
['northeast','south','midwest','west','new-england','mid-atlantic','south-atlantic','east-south-central','west-south-central','east-north-central','west-north-central','mountain','pacific'].forEach(r => add(`/regions/${r}/`));
['/api/','/learn/printable-us-states-map/','/learn/crossword-helper/','/es/learn/crucigrama-estados/','/es/learn/capitales-de-estados/'].forEach(add);
['las-vegas','boston','atlanta','miami','minneapolis','philadelphia','charlotte','seattle','portland','phoenix'].forEach(c => add(`/learn/is-${c}-a-state/`));
['miami','pittsburgh','baltimore','milwaukee','las-vegas','charlotte','durham'].forEach(c => add(`/learn/capital-of-${c}/`));

// ── Walk disk for index.html → URL path ──
const EXCLUDE = ['.git','node_modules','tmp','.wrangler','admin','og','logos','data','css','js','bin','workers','marketing','launch','functions'];
function walk(dir, out=[]) {
  for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir,e.name);
    const rel = path.relative(ROOT, full);
    if (EXCLUDE.some(x => rel===x || rel.startsWith(x+'/'))) continue;
    if (e.isDirectory()) walk(full,out);
    else if (e.name==='index.html') out.push(rel);
  }
  return out;
}

const missing = [];
for (const rel of walk(ROOT)) {
  const html = fs.readFileSync(path.join(ROOT,rel),'utf8');
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) continue;
  let url = '/' + rel.replace(/index\.html$/,'');
  url = url.replace(/\/$/,'') || '/';
  if (!urls.has(url)) missing.push(url + '/');
}

console.log(`\n📊 Pages indexables ABSENTES du sitemap: ${missing.length}\n`);
missing.sort().forEach(u => console.log('  ' + u));
