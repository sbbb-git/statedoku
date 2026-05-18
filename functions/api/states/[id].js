// Public JSON API: GET /api/states/{id}
// Returns a single state by USPS abbreviation (case-insensitive) or by name slug.
// Examples:  /api/states/CA   /api/states/california   /api/states/new-york

const STATES_URL = 'https://statedoku.com/data/states.json';

export async function onRequestGet({ request, params }) {
  const lookup = (params.id || '').toLowerCase();

  try {
    const resp = await fetch(STATES_URL, { cf: { cacheTtl: 86400 } });
    if (!resp.ok) return jsonErr(502, 'Could not fetch source data');
    const all = await resp.json();

    const slug = name => name.toLowerCase().replace(/\s+/g, '-');
    const state = all.find(s =>
      s.id.toLowerCase() === lookup ||
      slug(s.names?.en || '') === lookup
    );

    if (!state) {
      return jsonErr(404, `State "${params.id}" not found. Use a 2-letter USPS code (CA, TX) or a slug (california, new-york).`);
    }

    // Curated public-facing fields
    const out = {
      id: state.id,
      name: state.names?.en,
      names: state.names,
      capital: state.capital,
      largestCity: state.largestCity,
      region: state.region,
      subregion: state.subregion,
      population: state.population,
      areaRank: state.areaRank,
      admitted: state.admitted,
      timezone: state.timezone,
      coastline: state.coastline,
      landlocked: state.landlocked,
      bordersCanada: state.bordersCanada,
      bordersMexico: state.bordersMexico,
      original13: state.original13 || false,
      confederate: state.confederate || false,
      presidentBirthplace: state.presidentBirthplace || false,
      noIncomeTax: state.noIncomeTax || false,
      mountainRange: state.mountainRange || [],
      // Statedoku links for developers who want to deep-link
      links: {
        page: `https://statedoku.com/states/${slug(state.names?.en || state.id)}/`,
        facts: `https://statedoku.com/facts/#${slug(state.names?.en || state.id)}`,
        map: `https://statedoku.com/states/${slug(state.names?.en || state.id)}/map/`,
      },
    };

    return new Response(JSON.stringify(out, null, 2), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=86400, immutable',
        'x-source': 'https://statedoku.com',
        'x-license': 'Free to use with attribution to statedoku.com',
      },
    });
  } catch (e) {
    return jsonErr(500, e.message);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}

function jsonErr(status, message) {
  return new Response(JSON.stringify({ error: true, status, message }), {
    status, headers: { 'content-type': 'application/json' },
  });
}
