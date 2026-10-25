// Root middleware, runs on every request including static assets.
//
// Three jobs: send stray hosts (www., the bare pages.dev project host) to
// statedoku.com; give /api/* responses the security headers that _headers
// cannot add (Pages applies _headers to static assets, not to Functions); and
// rewrite the Content-Security-Policy header for /play/* routes so the page
// can be embedded in third-party iframes (teacher blogs, classroom LMS, news
// sites). _headers cannot do the last one either, CF Pages CONCATENATES
// duplicate CSP values across rules instead of replacing, and browsers
// enforce the strictest policy when multiple CSP headers are present.
//
// Strategy for /play/: let the page render normally, then strip any inherited
// frame-ancestors directive and pin our own (`frame-ancestors *`).

const PLAY_PATHS = ['/play/', '/fr/play/', '/es/play/'];

function isPlayPath(pathname) {
  return PLAY_PATHS.some(p => pathname.startsWith(p));
}

// Build a /play/* CSP from the inherited one by stripping any existing
// frame-ancestors directives and appending a single permissive one.
function rewriteCspForEmbed(csp) {
  if (!csp) {
    return "frame-ancestors *";
  }
  const directives = csp
    .split(';')
    .map(d => d.trim())
    .filter(d => d && !/^frame-ancestors\b/i.test(d));
  directives.push('frame-ancestors *');
  return directives.join('; ');
}

// /api/ answers carry subscriber tokens, admin data or one visitor's event,
// so nothing there may be sniffed into another type, cached by a shared cache
// unless the endpoint said so (the public states API does), or leak its URL
// as a referrer. CORS headers set by an endpoint are left untouched.
function withApiHeaders(response) {
  const h = new Headers(response.headers);
  h.set('x-content-type-options', 'nosniff');
  if (!h.has('referrer-policy')) h.set('referrer-policy', 'no-referrer');
  if (!h.has('cache-control')) h.set('cache-control', 'no-store');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: h,
  });
}

export const onRequest = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);

  // www to apex, 301, before anything else runs.
  //
  // _redirects carries a rule for this and it has never fired: Cloudflare Pages
  // matches a path there, not an absolute URL carrying a different hostname, so
  // the rule is silently inert. Every page of the site has therefore been
  // reachable twice, and Bing indexed and reported the www copies. The canonical
  // tag limited the damage; it did not remove the duplicate.
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.slice(4);
    return Response.redirect(url.toString(), 301);
  }

  // The project's own pages.dev host served the whole site, /api/ included,
  // past every zone rule set on statedoku.com. Only the bare host moves:
  // <hash>.statedoku.pages.dev is how a single deployment is checked.
  if (url.hostname === 'statedoku.pages.dev') {
    return Response.redirect('https://statedoku.com' + url.pathname + url.search, 301);
  }

  // Pass through, get whatever response the static asset / function returned.
  const response = await next();

  if (url.pathname.startsWith('/api/')) return withApiHeaders(response);
  if (!isPlayPath(url.pathname)) return response;

  // Clone so we can mutate headers (CF response headers are normally immutable).
  const newHeaders = new Headers(response.headers);

  // Some CDNs emit X-Frame-Options unconditionally; nuke it for /play/.
  newHeaders.delete('x-frame-options');

  // Replace ALL Content-Security-Policy headers with a single embed-friendly one.
  const existing = newHeaders.get('content-security-policy');
  newHeaders.delete('content-security-policy');
  newHeaders.set('content-security-policy', rewriteCspForEmbed(existing));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
