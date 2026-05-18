// Public JSON API: GET /api/states
// Returns all 50 US states with normalized data. Free to use with attribution.
//
// Query params:
//   ?fields=id,capital,population  → filter response fields
//   ?region=west                  → filter by region (west/south/midwest/northeast)
//   ?pretty=true                  → pretty-printed JSON

const STATES_URL = 'https://statedoku.com/data/states.json';

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const fields = url.searchParams.get('fields')?.split(',').map(s => s.trim()).filter(Boolean);
  const regionFilter = url.searchParams.get('region')?.toLowerCase();
  const pretty = url.searchParams.get('pretty') === 'true';

  try {
    const resp = await fetch(STATES_URL, { cf: { cacheTtl: 86400 } });
    if (!resp.ok) return badGateway('Could not fetch source data');
    let states = await resp.json();

    // Apply filters
    if (regionFilter) states = states.filter(s => s.region === regionFilter);

    // Trim to requested fields if specified
    if (fields?.length) {
      states = states.map(s => {
        const out = {};
        for (const f of fields) {
          if (f in s) out[f] = s[f];
        }
        return out;
      });
    } else {
      // Default: return a curated set of clean public-facing fields
      // (the raw data file has 137 fields, many internal to Statedoku)
      states = states.map(s => ({
        id: s.id,
        name: s.names?.en,
        names: s.names,
        capital: s.capital,
        largestCity: s.largestCity,
        region: s.region,
        subregion: s.subregion,
        population: s.population,
        areaRank: s.areaRank,
        admitted: s.admitted,
        timezone: s.timezone,
        coastline: s.coastline,
        landlocked: s.landlocked,
        bordersCanada: s.bordersCanada,
        bordersMexico: s.bordersMexico,
        original13: s.original13 || false,
        confederate: s.confederate || false,
        presidentBirthplace: s.presidentBirthplace || false,
        noIncomeTax: s.noIncomeTax || false,
      }));
    }

    const body = pretty ? JSON.stringify(states, null, 2) : JSON.stringify(states);

    return new Response(body, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, OPTIONS',
        'cache-control': 'public, max-age=86400, immutable',
        'x-source': 'https://statedoku.com',
        'x-license': 'Free to use with attribution to statedoku.com',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error', message: e.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
    },
  });
}

function badGateway(msg) {
  return new Response(JSON.stringify({ error: 'Bad gateway', message: msg }), {
    status: 502, headers: { 'content-type': 'application/json' },
  });
}
