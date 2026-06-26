#!/usr/bin/env node
/**
 * Regenerate /privacy/, /fr/privacy/, /es/privacy/ with full AdSense-compliant
 * disclosures. Replaces the previous "no cookies / no tracking" copy which
 * contradicted the GA4 + Clarity + AdSense reality.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const GA = `
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P7ZBQNYLS4"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-P7ZBQNYLS4');
  </script>`;

const LAST_UPDATED = 'June 19, 2026';

// ─── English version ─────────────────────────────────────────────────────
const EN_BODY = `
    <h1>Privacy Policy</h1>
    <p class="legal-meta">Last updated: ${LAST_UPDATED}</p>

    <p>This Privacy Policy explains how <strong>Statedoku</strong> ("we", "us", "the site") handles information when you visit <a href="https://statedoku.com/">statedoku.com</a>. Statedoku is operated by Sacha Bitoun, an independent solo developer based in Paris, France. The site is a free daily browser puzzle for US geography — you do not need to create an account to play.</p>

    <h2>1. What we collect</h2>

    <h3>1.1 Stored on your device (localStorage)</h3>
    <p>The game uses your browser's <strong>localStorage</strong> — a small key/value store similar to cookies but local to your browser — to remember:</p>
    <ul>
      <li>Your current puzzle progress (cells filled, mistakes, completion time)</li>
      <li>Your statistics (puzzles played, win rate, streak, best time)</li>
      <li>Per-game stats for the <code>/play/</code> mini-games (streak, best score)</li>
      <li>Your language preference (EN, FR, ES)</li>
      <li>UI dismissal choices (e.g. whether you dismissed the email signup banner)</li>
    </ul>
    <p>localStorage <strong>never leaves your device</strong>. You can clear it any time via your browser settings or by clearing site data for statedoku.com.</p>

    <h3>1.2 Cookies and similar technologies (set by third parties)</h3>
    <p>Once a page loads, third-party services we use may set cookies on your browser. The cookies, their purpose, and how long they last:</p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:.92rem">
      <thead><tr style="background:#F8FAFC"><th style="text-align:left;padding:8px;border-bottom:1px solid #E2E8F0">Provider</th><th style="text-align:left;padding:8px;border-bottom:1px solid #E2E8F0">Cookies</th><th style="text-align:left;padding:8px;border-bottom:1px solid #E2E8F0">Purpose</th></tr></thead>
      <tbody>
        <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0"><strong>Google Analytics 4</strong></td><td style="padding:8px;border-bottom:1px solid #E2E8F0"><code>_ga</code>, <code>_ga_*</code></td><td style="padding:8px;border-bottom:1px solid #E2E8F0">Audience analytics — visit counts, paths, devices, countries. 2 years.</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0"><strong>Google AdSense</strong> (when ads enabled)</td><td style="padding:8px;border-bottom:1px solid #E2E8F0"><code>NID</code>, <code>IDE</code>, <code>__gads</code>, <code>__gpi</code></td><td style="padding:8px;border-bottom:1px solid #E2E8F0">Ad serving, frequency capping, click measurement, and (if you accept personalization) ad targeting based on prior browsing. 13 months.</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0"><strong>Microsoft Clarity</strong></td><td style="padding:8px;border-bottom:1px solid #E2E8F0"><code>_clck</code>, <code>_clsk</code></td><td style="padding:8px;border-bottom:1px solid #E2E8F0">Aggregate UX heatmaps and (sampled) session recordings to find usability bugs. 1 year / session.</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0"><strong>Cloudflare Web Analytics</strong></td><td style="padding:8px;border-bottom:1px solid #E2E8F0">None</td><td style="padding:8px">Server-side request counts. Cookieless by design.</td></tr>
      </tbody>
    </table>

    <h3>1.3 Server-side request logs</h3>
    <p>Our hosting provider <strong>Cloudflare</strong> logs standard request information (IP address, user agent, timestamp, URL) for routing, security, and DDoS protection. We do not receive these logs in personally identifiable form. Read <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">Cloudflare's privacy policy</a>.</p>

    <h3>1.4 Information you choose to provide</h3>
    <p>Email subscribers — and only them — give us their email address to receive the daily puzzle reminder. We store the email address, your preferred sending hour (UTC), your language, and a country code derived from your IP at subscription time. Subscriptions are <strong>opt-in</strong>. Every email contains an unsubscribe link.</p>
    <p>If you click the daily reminder email, we may store the click event (timestamp, country, browser, destination URL) in our analytics database to measure email performance.</p>
    <p>We do not sell, rent, or share email addresses with third parties. Emails are sent via <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">Resend</a>.</p>

    <h2>2. Third-party services we use</h2>
    <p>Each of these services has its own privacy policy that governs the data they receive:</p>
    <ul>
      <li><strong>Cloudflare</strong> (hosting, CDN, DDoS protection) — <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">Privacy</a></li>
      <li><strong>Google Analytics 4</strong> (audience analytics) — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Privacy</a> · <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Opt-out add-on</a></li>
      <li><strong>Google AdSense</strong> (advertising — coverage starts only when ads are turned on) — <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">How Google uses information</a> · <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Personalization controls</a></li>
      <li><strong>Microsoft Clarity</strong> (UX heatmaps, session recordings) — <a href="https://clarity.microsoft.com/terms" target="_blank" rel="noopener">Privacy</a></li>
      <li><strong>Ahrefs Web Analytics</strong> (search-referrer attribution) — <a href="https://help.ahrefs.com/en/articles/9314929-ahrefs-web-analytics-privacy-policy" target="_blank" rel="noopener">Privacy</a></li>
      <li><strong>Google Fonts</strong> (the "Inter" typeface) — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Privacy</a></li>
      <li><strong>Resend</strong> (transactional email — reminders to subscribers) — <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">Privacy</a></li>
    </ul>

    <h2>3. Advertising disclosure (required by Google AdSense)</h2>
    <p>Statedoku displays advertising provided by <strong>Google AdSense</strong>.</p>
    <ul>
      <li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this site and other sites on the Internet.</li>
      <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the Internet.</li>
      <li>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google Ads Settings</a>. Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info/" target="_blank" rel="noopener">aboutads.info</a> (US) or <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener">youronlinechoices.eu</a> (EU).</li>
      <li>For visitors from the European Economic Area, United Kingdom, or Switzerland, Google's EU consent message will appear on first visit and allow you to grant or refuse personalization. Refusing personalization does not remove ads — only their tailoring.</li>
    </ul>

    <h2>4. Your rights</h2>
    <p>Under the EU GDPR, UK GDPR, California's CCPA, and equivalent regimes, you have the right to:</p>
    <ul>
      <li><strong>Access</strong> the personal data we hold about you</li>
      <li><strong>Rectify</strong> data that is inaccurate</li>
      <li><strong>Erase</strong> data we hold (for email subscribers: click any "unsubscribe" link; for localStorage: clear your browser data for statedoku.com)</li>
      <li><strong>Object</strong> to processing, including ad personalization (see §3)</li>
      <li><strong>Withdraw consent</strong> at any time</li>
      <li><strong>Lodge a complaint</strong> with your local data protection authority. In France: <a href="https://www.cnil.fr/" target="_blank" rel="noopener">CNIL</a>.</li>
      <li><strong>Data portability</strong>: request a copy of the data we hold about you (email subscribers can request this by writing to the address below)</li>
    </ul>
    <p>For California residents specifically: we do not "sell" personal information as defined by the CCPA. We share data with advertising partners (Google) for serving ads, which may be considered "sharing" under recent CCPA amendments — opt out via Google Ads Settings.</p>

    <h2>5. Children's privacy</h2>
    <p>Statedoku is suitable for all ages but is not specifically directed at children under 13 (US) or under 16 (EU). We do not knowingly collect personal data from children. If you are a parent or guardian and believe your child has provided us with information, contact us and we will remove it.</p>

    <h2>6. Data retention</h2>
    <ul>
      <li><strong>Email subscriptions:</strong> kept until you unsubscribe.</li>
      <li><strong>Email click events:</strong> kept indefinitely for analytics but contain no personal identifier beyond the email itself.</li>
      <li><strong>Cookies:</strong> see the durations in the table above.</li>
      <li><strong>localStorage:</strong> persists until you clear it.</li>
      <li><strong>Cloudflare access logs:</strong> retained per Cloudflare's policy (~30 days).</li>
    </ul>

    <h2>7. International data transfers</h2>
    <p>Some of our third-party providers (Google, Cloudflare, Microsoft, Resend) are headquartered in the United States and may process data there. Each provider has its own safeguards (Standard Contractual Clauses, Data Privacy Framework certifications) that we rely on to meet GDPR adequacy requirements.</p>

    <h2>8. Changes to this policy</h2>
    <p>We may update this policy when we add or remove a service, change retention periods, or to clarify wording. The "Last updated" date at the top reflects the latest revision. Material changes will be flagged on the homepage for at least 7 days.</p>

    <h2>9. Contact</h2>
    <p>For any question about this privacy policy or to exercise any of the rights described above, write to <a href="mailto:contact@statedoku.com">contact@statedoku.com</a>.</p>
    <p>Data controller: Sacha Bitoun, Paris, France.</p>

    <p class="legal-back"><a href="/">← Back to the puzzle</a></p>
`;

// ─── French version ─────────────────────────────────────────────────────
const FR_BODY = `
    <h1>Politique de confidentialité</h1>
    <p class="legal-meta">Dernière mise à jour : 19 juin 2026</p>

    <p>Cette politique de confidentialité explique comment <strong>Statedoku</strong> (« nous », « le site ») traite vos informations lorsque vous visitez <a href="https://statedoku.com/">statedoku.com</a>. Statedoku est édité par Sacha Bitoun, développeur indépendant basé à Paris. Le site est un puzzle quotidien gratuit dans le navigateur pour apprendre la géographie des États-Unis — aucun compte n'est nécessaire pour jouer.</p>

    <h2>1. Ce que nous collectons</h2>

    <h3>1.1 Données stockées sur votre appareil (localStorage)</h3>
    <p>Le jeu utilise le <strong>localStorage</strong> de votre navigateur — similaire aux cookies mais local au navigateur — pour se souvenir de :</p>
    <ul>
      <li>Votre progression dans le puzzle du jour (cellules remplies, erreurs, temps)</li>
      <li>Vos statistiques (parties jouées, taux de victoire, série, meilleur temps)</li>
      <li>Les stats par mini-jeu dans <code>/play/</code> (série, meilleur score)</li>
      <li>Votre langue préférée (EN, FR, ES)</li>
      <li>Vos choix d'interface (ex : avez-vous fermé la banniere d'inscription email)</li>
    </ul>
    <p>Le localStorage <strong>ne quitte jamais votre appareil</strong>. Vous pouvez l'effacer à tout moment via les paramètres de votre navigateur en supprimant les données du site statedoku.com.</p>

    <h3>1.2 Cookies et technologies similaires (déposés par les tiers)</h3>
    <p>À l'ouverture d'une page, les services tiers que nous utilisons peuvent déposer des cookies dans votre navigateur :</p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:.92rem">
      <thead><tr style="background:#F8FAFC"><th style="text-align:left;padding:8px;border-bottom:1px solid #E2E8F0">Fournisseur</th><th style="text-align:left;padding:8px;border-bottom:1px solid #E2E8F0">Cookies</th><th style="text-align:left;padding:8px;border-bottom:1px solid #E2E8F0">Finalité</th></tr></thead>
      <tbody>
        <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0"><strong>Google Analytics 4</strong></td><td style="padding:8px;border-bottom:1px solid #E2E8F0"><code>_ga</code>, <code>_ga_*</code></td><td style="padding:8px;border-bottom:1px solid #E2E8F0">Analyse d'audience — nombre de visites, parcours, appareils, pays. 2 ans.</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0"><strong>Google AdSense</strong> (si publicités activées)</td><td style="padding:8px;border-bottom:1px solid #E2E8F0"><code>NID</code>, <code>IDE</code>, <code>__gads</code>, <code>__gpi</code></td><td style="padding:8px;border-bottom:1px solid #E2E8F0">Diffusion des publicités, plafonnement de fréquence, mesure de clic, et (si vous acceptez la personnalisation) ciblage publicitaire selon votre navigation antérieure. 13 mois.</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0"><strong>Microsoft Clarity</strong></td><td style="padding:8px;border-bottom:1px solid #E2E8F0"><code>_clck</code>, <code>_clsk</code></td><td style="padding:8px;border-bottom:1px solid #E2E8F0">Heatmaps UX agrégées et enregistrements de sessions échantillonnés pour détecter les bugs d'ergonomie. 1 an / session.</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0"><strong>Cloudflare Web Analytics</strong></td><td style="padding:8px;border-bottom:1px solid #E2E8F0">Aucun</td><td style="padding:8px">Compteurs de requêtes côté serveur. Sans cookie par conception.</td></tr>
      </tbody>
    </table>

    <h3>1.3 Logs serveurs</h3>
    <p>Notre hébergeur <strong>Cloudflare</strong> journalise les informations standards de chaque requête (adresse IP, user-agent, horodatage, URL) pour le routage, la sécurité et la protection anti-DDoS. Nous ne recevons pas ces logs sous forme identifiable. Voir <a href="https://www.cloudflare.com/fr-fr/privacypolicy/" target="_blank" rel="noopener">la politique de confidentialité de Cloudflare</a>.</p>

    <h3>1.4 Informations que vous choisissez de fournir</h3>
    <p>Les abonnés email — et eux seuls — nous fournissent leur adresse email pour recevoir le rappel quotidien du puzzle. Nous stockons l'adresse email, l'heure d'envoi souhaitée (UTC), votre langue, et un code pays dérivé de votre IP à l'inscription. L'inscription est <strong>opt-in</strong>. Chaque email contient un lien de désinscription.</p>
    <p>Si vous cliquez sur le rappel email, nous pouvons stocker l'événement de clic (horodatage, pays, navigateur, URL de destination) dans notre base d'analyse pour mesurer la performance des emails.</p>
    <p>Nous ne vendons, ne louons et ne partageons jamais les adresses email avec des tiers. Les emails sont envoyés via <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">Resend</a>.</p>

    <h2>2. Services tiers utilisés</h2>
    <p>Chacun de ces services a sa propre politique de confidentialité qui régit les données qu'il reçoit :</p>
    <ul>
      <li><strong>Cloudflare</strong> (hébergement, CDN, anti-DDoS) — <a href="https://www.cloudflare.com/fr-fr/privacypolicy/" target="_blank" rel="noopener">Confidentialité</a></li>
      <li><strong>Google Analytics 4</strong> (analyse d'audience) — <a href="https://policies.google.com/privacy?hl=fr" target="_blank" rel="noopener">Confidentialité</a> · <a href="https://tools.google.com/dlpage/gaoptout?hl=fr" target="_blank" rel="noopener">Extension de désinscription</a></li>
      <li><strong>Google AdSense</strong> (publicité — actif uniquement quand les publicités sont activées) — <a href="https://policies.google.com/technologies/ads?hl=fr" target="_blank" rel="noopener">Comment Google utilise les informations</a> · <a href="https://www.google.com/settings/ads?hl=fr" target="_blank" rel="noopener">Paramètres de personnalisation</a></li>
      <li><strong>Microsoft Clarity</strong> (heatmaps UX, enregistrement de sessions) — <a href="https://clarity.microsoft.com/terms" target="_blank" rel="noopener">Confidentialité</a></li>
      <li><strong>Ahrefs Web Analytics</strong> (attribution des sources de recherche) — <a href="https://help.ahrefs.com/en/articles/9314929-ahrefs-web-analytics-privacy-policy" target="_blank" rel="noopener">Confidentialité</a></li>
      <li><strong>Google Fonts</strong> (police « Inter ») — <a href="https://policies.google.com/privacy?hl=fr" target="_blank" rel="noopener">Confidentialité</a></li>
      <li><strong>Resend</strong> (envoi transactionnel des emails) — <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">Confidentialité</a></li>
    </ul>

    <h2>3. Information publicitaire (requise par Google AdSense)</h2>
    <p>Statedoku affiche des publicités fournies par <strong>Google AdSense</strong>.</p>
    <ul>
      <li>Des fournisseurs tiers, dont Google, utilisent des cookies pour diffuser des annonces basées sur vos précédentes visites sur ce site et d'autres sites.</li>
      <li>L'utilisation des cookies publicitaires par Google et ses partenaires leur permet de vous présenter des annonces basées sur vos visites de ce site et/ou d'autres sites Internet.</li>
      <li>Vous pouvez désactiver les annonces personnalisées en visitant les <a href="https://www.google.com/settings/ads?hl=fr" target="_blank" rel="noopener">paramètres des annonces Google</a>. Vous pouvez également désactiver l'utilisation de cookies par un fournisseur tiers en visitant <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener">youronlinechoices.eu</a>.</li>
      <li>Pour les visiteurs depuis l'Espace économique européen, le Royaume-Uni ou la Suisse, le message de consentement européen de Google s'affiche à la première visite et permet d'accepter ou de refuser la personnalisation. Refuser la personnalisation ne supprime pas les annonces — seulement leur ciblage.</li>
    </ul>

    <h2>4. Vos droits</h2>
    <p>En vertu du RGPD européen, du RGPD britannique, du CCPA californien et de cadres équivalents, vous avez le droit de :</p>
    <ul>
      <li><strong>Accéder</strong> aux données personnelles que nous détenons à votre sujet</li>
      <li><strong>Rectifier</strong> des données inexactes</li>
      <li><strong>Effacer</strong> les données que nous détenons (abonnés email : cliquer sur n'importe quel lien « se désinscrire » ; pour le localStorage : effacer les données du site dans votre navigateur)</li>
      <li><strong>Vous opposer</strong> au traitement, y compris à la personnalisation publicitaire (voir §3)</li>
      <li><strong>Retirer votre consentement</strong> à tout moment</li>
      <li><strong>Déposer plainte</strong> auprès de votre autorité de protection des données. En France : <a href="https://www.cnil.fr/" target="_blank" rel="noopener">CNIL</a>.</li>
      <li><strong>Portabilité des données</strong> : demander une copie des données vous concernant (les abonnés email peuvent le demander en écrivant à l'adresse ci-dessous)</li>
    </ul>

    <h2>5. Confidentialité des enfants</h2>
    <p>Statedoku convient à tous les âges mais ne s'adresse pas spécifiquement aux enfants de moins de 13 ans (US) ou de moins de 16 ans (UE). Nous ne collectons pas sciemment de données personnelles d'enfants. Si vous êtes parent ou responsable légal et pensez que votre enfant nous a fourni des informations, contactez-nous, nous les supprimerons.</p>

    <h2>6. Conservation des données</h2>
    <ul>
      <li><strong>Abonnements email :</strong> conservés jusqu'à désinscription.</li>
      <li><strong>Événements de clic email :</strong> conservés indéfiniment à des fins d'analyse mais ne contiennent aucun identifiant personnel au-delà de l'email lui-même.</li>
      <li><strong>Cookies :</strong> voir les durées dans le tableau ci-dessus.</li>
      <li><strong>localStorage :</strong> conservé jusqu'à effacement par vous.</li>
      <li><strong>Logs d'accès Cloudflare :</strong> selon la politique de Cloudflare (~30 jours).</li>
    </ul>

    <h2>7. Transferts internationaux</h2>
    <p>Certains de nos prestataires tiers (Google, Cloudflare, Microsoft, Resend) ont leur siège aux États-Unis et peuvent y traiter les données. Chaque prestataire dispose de ses propres garanties (Clauses Contractuelles Types, certifications Data Privacy Framework) sur lesquelles nous nous appuyons pour respecter les exigences du RGPD.</p>

    <h2>8. Modifications de cette politique</h2>
    <p>Nous pouvons mettre à jour cette politique lors de l'ajout ou du retrait d'un service, du changement des durées de conservation, ou pour clarifier la formulation. La date de « Dernière mise à jour » en haut reflète la révision la plus récente. Les changements majeurs seront signalés sur la page d'accueil pendant au moins 7 jours.</p>

    <h2>9. Contact</h2>
    <p>Pour toute question concernant cette politique ou pour exercer l'un des droits décrits ci-dessus, écrivez à <a href="mailto:contact@statedoku.com">contact@statedoku.com</a>.</p>
    <p>Responsable du traitement : Sacha Bitoun, Paris, France.</p>

    <p class="legal-back"><a href="/fr/">← Retour au puzzle</a></p>
`;

// ─── Spanish version ─────────────────────────────────────────────────────
const ES_BODY = `
    <h1>Política de privacidad</h1>
    <p class="legal-meta">Última actualización: 19 de junio de 2026</p>

    <p>Esta política de privacidad explica cómo <strong>Statedoku</strong> («nosotros», «el sitio») trata su información cuando visita <a href="https://statedoku.com/">statedoku.com</a>. Statedoku es operado por Sacha Bitoun, desarrollador independiente con sede en París, Francia. El sitio es un puzzle diario gratuito en el navegador para aprender la geografía de los Estados Unidos — no se necesita cuenta para jugar.</p>

    <h2>1. Qué recopilamos</h2>

    <h3>1.1 Almacenado en su dispositivo (localStorage)</h3>
    <p>El juego utiliza el <strong>localStorage</strong> de su navegador — similar a las cookies pero local al navegador — para recordar:</p>
    <ul>
      <li>Su progreso en el puzzle actual (celdas rellenadas, errores, tiempo)</li>
      <li>Sus estadísticas (partidas jugadas, tasa de victoria, racha, mejor tiempo)</li>
      <li>Estadísticas por mini-juego en <code>/play/</code> (racha, mejor puntuación)</li>
      <li>Su idioma preferido (EN, FR, ES)</li>
      <li>Sus elecciones de interfaz (p. ej. si ha cerrado el banner de suscripción email)</li>
    </ul>
    <p>El localStorage <strong>nunca sale de su dispositivo</strong>. Puede borrarlo en cualquier momento eliminando los datos del sitio statedoku.com en la configuración de su navegador.</p>

    <h3>1.2 Cookies y tecnologías similares (depositadas por terceros)</h3>
    <p>Al cargar una página, los servicios de terceros que utilizamos pueden depositar cookies en su navegador:</p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:.92rem">
      <thead><tr style="background:#F8FAFC"><th style="text-align:left;padding:8px;border-bottom:1px solid #E2E8F0">Proveedor</th><th style="text-align:left;padding:8px;border-bottom:1px solid #E2E8F0">Cookies</th><th style="text-align:left;padding:8px;border-bottom:1px solid #E2E8F0">Finalidad</th></tr></thead>
      <tbody>
        <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0"><strong>Google Analytics 4</strong></td><td style="padding:8px;border-bottom:1px solid #E2E8F0"><code>_ga</code>, <code>_ga_*</code></td><td style="padding:8px;border-bottom:1px solid #E2E8F0">Análisis de audiencia — visitas, rutas, dispositivos, países. 2 años.</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0"><strong>Google AdSense</strong> (si los anuncios están activados)</td><td style="padding:8px;border-bottom:1px solid #E2E8F0"><code>NID</code>, <code>IDE</code>, <code>__gads</code>, <code>__gpi</code></td><td style="padding:8px;border-bottom:1px solid #E2E8F0">Servir anuncios, limitar frecuencia, medir clics, y (si acepta personalización) segmentación según su navegación previa. 13 meses.</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0"><strong>Microsoft Clarity</strong></td><td style="padding:8px;border-bottom:1px solid #E2E8F0"><code>_clck</code>, <code>_clsk</code></td><td style="padding:8px;border-bottom:1px solid #E2E8F0">Mapas de calor de UX agregados y grabaciones de sesión muestreadas para detectar problemas de usabilidad. 1 año / sesión.</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0"><strong>Cloudflare Web Analytics</strong></td><td style="padding:8px;border-bottom:1px solid #E2E8F0">Ninguna</td><td style="padding:8px">Conteo de solicitudes del servidor. Sin cookies por diseño.</td></tr>
      </tbody>
    </table>

    <h3>1.3 Registros de servidor</h3>
    <p>Nuestro proveedor de alojamiento <strong>Cloudflare</strong> registra información estándar de cada solicitud (dirección IP, user-agent, hora, URL) para enrutamiento, seguridad y protección anti-DDoS. No recibimos estos registros de forma identificable. Lea <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">la política de privacidad de Cloudflare</a>.</p>

    <h3>1.4 Información que decide proporcionar</h3>
    <p>Los suscriptores email — y solo ellos — nos proporcionan su dirección email para recibir el recordatorio diario del puzzle. Almacenamos la dirección email, su hora de envío preferida (UTC), su idioma y un código país derivado de su IP al suscribirse. La suscripción es <strong>opt-in</strong>. Cada email contiene un enlace para darse de baja.</p>
    <p>Si hace clic en el recordatorio email, podemos almacenar el evento de clic (hora, país, navegador, URL de destino) en nuestra base de análisis para medir el rendimiento de los emails.</p>
    <p>No vendemos, alquilamos ni compartimos direcciones email con terceros. Los emails se envían vía <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">Resend</a>.</p>

    <h2>2. Servicios de terceros utilizados</h2>
    <p>Cada uno de estos servicios tiene su propia política de privacidad que rige los datos que recibe:</p>
    <ul>
      <li><strong>Cloudflare</strong> (alojamiento, CDN, anti-DDoS) — <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">Privacidad</a></li>
      <li><strong>Google Analytics 4</strong> (análisis de audiencia) — <a href="https://policies.google.com/privacy?hl=es" target="_blank" rel="noopener">Privacidad</a> · <a href="https://tools.google.com/dlpage/gaoptout?hl=es" target="_blank" rel="noopener">Complemento de exclusión</a></li>
      <li><strong>Google AdSense</strong> (publicidad — activo solo cuando los anuncios están encendidos) — <a href="https://policies.google.com/technologies/ads?hl=es" target="_blank" rel="noopener">Cómo Google usa la información</a> · <a href="https://www.google.com/settings/ads?hl=es" target="_blank" rel="noopener">Controles de personalización</a></li>
      <li><strong>Microsoft Clarity</strong> (mapas de calor UX, grabación de sesiones) — <a href="https://clarity.microsoft.com/terms" target="_blank" rel="noopener">Privacidad</a></li>
      <li><strong>Ahrefs Web Analytics</strong> (atribución de fuentes de búsqueda) — <a href="https://help.ahrefs.com/en/articles/9314929-ahrefs-web-analytics-privacy-policy" target="_blank" rel="noopener">Privacidad</a></li>
      <li><strong>Google Fonts</strong> (tipografía «Inter») — <a href="https://policies.google.com/privacy?hl=es" target="_blank" rel="noopener">Privacidad</a></li>
      <li><strong>Resend</strong> (envío transaccional de emails) — <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">Privacidad</a></li>
    </ul>

    <h2>3. Divulgación publicitaria (requerida por Google AdSense)</h2>
    <p>Statedoku muestra publicidad proporcionada por <strong>Google AdSense</strong>.</p>
    <ul>
      <li>Proveedores externos, incluido Google, usan cookies para servir anuncios basados en sus visitas anteriores a este sitio y a otros sitios de Internet.</li>
      <li>El uso de cookies publicitarias de Google permite a Google y sus socios servirle anuncios basados en sus visitas a este sitio y/o a otros sitios de Internet.</li>
      <li>Puede inhabilitar la publicidad personalizada visitando <a href="https://www.google.com/settings/ads?hl=es" target="_blank" rel="noopener">la configuración de anuncios de Google</a>. Alternativamente, puede inhabilitar el uso de cookies de un proveedor externo visitando <a href="https://www.aboutads.info/" target="_blank" rel="noopener">aboutads.info</a> (EE.UU.) o <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener">youronlinechoices.eu</a> (UE).</li>
      <li>Para visitantes del Espacio Económico Europeo, Reino Unido o Suiza, el mensaje de consentimiento europeo de Google aparece en la primera visita y permite conceder o rechazar la personalización. Rechazar la personalización no elimina los anuncios — solo su segmentación.</li>
    </ul>

    <h2>4. Sus derechos</h2>
    <p>Bajo el RGPD europeo, el RGPD británico, el CCPA de California y regímenes equivalentes, tiene el derecho a:</p>
    <ul>
      <li><strong>Acceder</strong> a los datos personales que conservamos sobre usted</li>
      <li><strong>Rectificar</strong> datos inexactos</li>
      <li><strong>Suprimir</strong> los datos que conservamos (suscriptores email: clic en cualquier enlace «cancelar suscripción»; localStorage: borrar los datos del sitio en su navegador)</li>
      <li><strong>Oponerse</strong> al procesamiento, incluida la personalización publicitaria (ver §3)</li>
      <li><strong>Retirar el consentimiento</strong> en cualquier momento</li>
      <li><strong>Presentar reclamación</strong> ante su autoridad local de protección de datos. En España: <a href="https://www.aepd.es/" target="_blank" rel="noopener">AEPD</a>. En Francia: <a href="https://www.cnil.fr/" target="_blank" rel="noopener">CNIL</a>.</li>
      <li><strong>Portabilidad de datos</strong>: solicitar una copia de los datos sobre usted (los suscriptores email pueden hacerlo escribiendo a la dirección indicada abajo)</li>
    </ul>

    <h2>5. Privacidad de los niños</h2>
    <p>Statedoku es adecuado para todas las edades pero no se dirige específicamente a menores de 13 años (EE.UU.) o menores de 16 años (UE). No recopilamos a sabiendas datos personales de niños. Si es padre, madre o tutor legal y cree que su hijo nos ha proporcionado información, contáctenos y la eliminaremos.</p>

    <h2>6. Conservación de datos</h2>
    <ul>
      <li><strong>Suscripciones email:</strong> conservadas hasta que se cancele la suscripción.</li>
      <li><strong>Eventos de clic email:</strong> conservados indefinidamente para análisis pero no contienen identificador personal más allá del email mismo.</li>
      <li><strong>Cookies:</strong> ver las duraciones en la tabla anterior.</li>
      <li><strong>localStorage:</strong> conservado hasta que lo borre.</li>
      <li><strong>Registros de acceso Cloudflare:</strong> según la política de Cloudflare (~30 días).</li>
    </ul>

    <h2>7. Transferencias internacionales</h2>
    <p>Algunos de nuestros proveedores externos (Google, Cloudflare, Microsoft, Resend) tienen su sede en Estados Unidos y pueden procesar datos allí. Cada proveedor cuenta con sus propias salvaguardas (Cláusulas Contractuales Tipo, certificación Data Privacy Framework) en las que nos apoyamos para cumplir los requisitos del RGPD.</p>

    <h2>8. Cambios a esta política</h2>
    <p>Podemos actualizar esta política cuando añadamos o eliminemos un servicio, modifiquemos los plazos de conservación o aclaremos la redacción. La fecha de «Última actualización» en la parte superior refleja la revisión más reciente. Los cambios sustanciales se señalarán en la página principal durante al menos 7 días.</p>

    <h2>9. Contacto</h2>
    <p>Para cualquier pregunta sobre esta política o para ejercer cualquiera de los derechos descritos anteriormente, escriba a <a href="mailto:contact@statedoku.com">contact@statedoku.com</a>.</p>
    <p>Responsable del tratamiento: Sacha Bitoun, París, Francia.</p>

    <p class="legal-back"><a href="/es/">← Volver al puzzle</a></p>
`;

function wrap(lang, title, desc, body, langSwitcher) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>${GA}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0F2147">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://statedoku.com/${lang === 'en' ? '' : lang + '/'}privacy/">
  <link rel="alternate" hreflang="en" href="https://statedoku.com/privacy/">
  <link rel="alternate" hreflang="fr" href="https://statedoku.com/fr/privacy/">
  <link rel="alternate" hreflang="es" href="https://statedoku.com/es/privacy/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/privacy/">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=19">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="https://statedoku.com/${lang === 'en' ? '' : lang + '/'}privacy/">
  <meta property="og:image" content="https://statedoku.com/og-image.png?v=2">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="https://statedoku.com/og-image.png?v=2">
</head>
<body class="legal-body">

<header>
  <a href="/${lang === 'en' ? '' : lang + '/'}" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions">
    <div class="lang-switcher">
${langSwitcher}
    </div>
  </nav>
</header>

<main class="legal-main">
  <article class="legal-page">
${body}
  </article>
</main>

<footer>
  <p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="https://www.reddit.com/r/Statedoku/" rel="noopener" target="_blank">💬 Reddit</a> &nbsp;·&nbsp; <a href="/${lang === 'en' ? '' : lang + '/'}privacy/">Privacy</a> &nbsp;·&nbsp; <a href="/${lang === 'en' ? '' : lang + '/'}terms/">Terms</a></p>
</footer>

<script src="/config.js"></script>
<script src="/js/admin.js"></script>
<script src="/js/ads.js?v=1"></script>
</body>
</html>`;
}

const SWITCHER = {
  en: `      <button class="lang-btn active" data-lang="en">EN</button>
      <button class="lang-btn" data-lang="fr" onclick="location.href='/fr/privacy/'">FR</button>
      <button class="lang-btn" data-lang="es" onclick="location.href='/es/privacy/'">ES</button>`,
  fr: `      <button class="lang-btn" data-lang="en" onclick="location.href='/privacy/'">EN</button>
      <button class="lang-btn active" data-lang="fr">FR</button>
      <button class="lang-btn" data-lang="es" onclick="location.href='/es/privacy/'">ES</button>`,
  es: `      <button class="lang-btn" data-lang="en" onclick="location.href='/privacy/'">EN</button>
      <button class="lang-btn" data-lang="fr" onclick="location.href='/fr/privacy/'">FR</button>
      <button class="lang-btn active" data-lang="es">ES</button>`,
};

const out = [
  ['privacy/index.html',    wrap('en', 'Privacy Policy — Statedoku', 'Statedoku privacy policy: what data is collected, cookies used (GA4, AdSense, Clarity), third-party services, your GDPR + CCPA rights.', EN_BODY, SWITCHER.en)],
  ['fr/privacy/index.html', wrap('fr', 'Politique de confidentialité — Statedoku', 'Politique de confidentialité Statedoku : données collectées, cookies utilisés (GA4, AdSense, Clarity), services tiers, vos droits RGPD + CCPA.', FR_BODY, SWITCHER.fr)],
  ['es/privacy/index.html', wrap('es', 'Política de privacidad — Statedoku', 'Política de privacidad de Statedoku: datos recopilados, cookies utilizadas (GA4, AdSense, Clarity), servicios de terceros, sus derechos RGPD + CCPA.', ES_BODY, SWITCHER.es)],
];

for (const [rel, html] of out) {
  const p = path.join(ROOT, rel);
  fs.writeFileSync(p, html);
  console.log(`✅ /${rel}`);
}
console.log(`\n${out.length} privacy pages regenerated (AdSense-compliant).`);
