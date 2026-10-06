// Minimal standalone HTML page for the email confirm / unsubscribe flows.
export function page(title, inner, status = 200) {
  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title></head>
<body style="margin:0;background:#F7F8FB;font-family:system-ui,sans-serif;color:#0F2147">
<div style="max-width:440px;margin:60px auto;padding:28px 24px;background:#fff;border-radius:14px;text-align:center">${inner}</div>
</body></html>`;
  return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

export const T = {
  en: { home: '← Back to today\'s puzzle', bad: 'This link is invalid or has already been used.',
        cTitle: 'Confirm your email', cText: 'Click below to start receiving the daily puzzle.', cBtn: 'Confirm',
        cDone: 'You\'re in. The puzzle will arrive in your inbox every day.',
        uTitle: 'Unsubscribe', uText: 'Stop the daily puzzle emails and delete your address from our list?', uBtn: 'Unsubscribe and delete',
        uDone: 'You\'re unsubscribed, and your address has been deleted.' },
  fr: { home: '← Retour au puzzle du jour', bad: 'Ce lien est invalide ou a déjà été utilisé.',
        cTitle: 'Confirmez votre adresse', cText: 'Cliquez ci-dessous pour recevoir le puzzle chaque jour.', cBtn: 'Confirmer',
        cDone: 'C\'est fait. Le puzzle arrivera chaque jour dans votre boîte.',
        uTitle: 'Désinscription', uText: 'Arrêter les e-mails du puzzle et supprimer votre adresse de notre liste ?', uBtn: 'Me désinscrire et supprimer',
        uDone: 'Vous êtes désinscrit, et votre adresse a été supprimée.' },
  es: { home: '← Volver al puzzle de hoy', bad: 'Este enlace no es válido o ya se ha usado.',
        cTitle: 'Confirma tu correo', cText: 'Haz clic abajo para recibir el puzzle cada día.', cBtn: 'Confirmar',
        cDone: 'Listo. El puzzle llegará cada día a tu bandeja de entrada.',
        uTitle: 'Darse de baja', uText: '¿Dejar de recibir el puzzle y borrar tu dirección de nuestra lista?', uBtn: 'Darme de baja y borrar',
        uDone: 'Te has dado de baja y tu dirección se ha borrado.' },
};

export const HOME = { en: '/', fr: '/fr/', es: '/es/' };

export function validToken(t) {
  return typeof t === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(t);
}
