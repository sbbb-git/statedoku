// Root middleware — runs on every request including static assets.
//
// Sole job: rewrite the Content-Security-Policy header for /play/* routes
// so the page can be embedded in third-party iframes (teacher blogs,
// classroom LMS, news sites). _headers cannot do this — CF Pages
// CONCATENATES duplicate CSP values across rules instead of replacing,
// and browsers enforce the strictest policy when multiple CSP headers
// are present.
//
// Strategy: let the page render normally, then strip any inherited
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

export const onRequest = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);

  // Pass through — get whatever response the static asset / function returned.
  const response = await next();

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
