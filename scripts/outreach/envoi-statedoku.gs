/**
 * Statedoku : envoi des e-mails de prospection depuis cette feuille.
 *
 * Une ligne par message (onglet 1) : A Statut, B Lot, C Organisation,
 * D Pays ou région, E Langue, F À, G Objet, H Message, I Envoyé le.
 * Le script envoie, dans l'ordre de la feuille, les lignes dont le Statut est
 * vide, depuis contact@statedoku.com, par lots de LOT messages : un lot tout de
 * suite au démarrage, puis un lot par heure entre 13 h et 22 h (heure de
 * Paris), jusqu'au plafond quotidien de Google (100 destinataires par jour
 * pour un compte Gmail gratuit). Il écrit « envoyé » et la date sur chaque
 * ligne partie. Une ligne dont le Statut n'est pas vide (« stop »,
 * « attente adresse postale », « à vérifier ... ») ne part jamais.
 *
 * Mise en route, une seule fois, connecté au compte Gmail où
 * contact@statedoku.com est une adresse d'envoi (Paramètres, Comptes,
 * « Envoyer des e-mails en tant que ») :
 *  1. Dans cette feuille : Extensions, Apps Script, remplacer le contenu par
 *     ce fichier, enregistrer.
 *  2. Choisir la fonction « essai » puis Exécuter. Google demande
 *     l'autorisation : choisir le compte, puis « Paramètres avancés »,
 *     « Accéder à ... (non sécurisé) » (normal pour un script personnel),
 *     puis Autoriser. Tu reçois le premier message de la liste.
 *  3. Choisir « demarrer » puis Exécuter : un premier lot part tout de suite,
 *     puis un lot chaque heure.
 *  Pour tout arrêter : exécuter « arreter ».
 */
const EXPEDITEUR = 'contact@statedoku.com';
const NOM = 'Statedoku';
const LOT = 20;              // messages par exécution (une exécution doit tenir en 6 minutes)
const PAUSE_MS = 3 * 1000;   // 3 secondes entre deux messages
const HEURES = [13, 22];     // envoi automatique entre 13 h et 22 h, heure de Paris (7 h à 16 h à New York)

function feuille_() { return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; }

function verifierAlias_() {
  const alias = GmailApp.getAliases().map(a => a.toLowerCase());
  if (alias.indexOf(EXPEDITEUR) === -1) {
    throw new Error(EXPEDITEUR + " n'est pas une adresse d'envoi de ce compte Gmail. Ouvre la feuille depuis le compte où l'alias est configuré.");
  }
}

function envoyer_(max) {
  verifierAlias_();
  const f = feuille_();
  const lignes = f.getDataRange().getValues();
  let envoyes = 0;
  for (let i = 1; i < lignes.length && envoyes < max; i++) {
    if (MailApp.getRemainingDailyQuota() < 1) break;
    const [statut, , , , , a, objet, message] = lignes[i];
    if (String(statut).trim() !== '' || !a || !objet || !message) continue;
    try {
      GmailApp.sendEmail(String(a).trim(), String(objet), String(message), { from: EXPEDITEUR, name: NOM, replyTo: EXPEDITEUR });
    } catch (e) {
      const m = String(e.message || e);
      if (/too many times|quota|limit|trop/i.test(m)) break;   // plafond du jour atteint : la suite partira plus tard
      f.getRange(i + 1, 1).setValue('erreur : ' + m.slice(0, 80));
      continue;
    }
    f.getRange(i + 1, 1).setValue('envoyé');
    f.getRange(i + 1, 9).setValue(new Date());
    SpreadsheetApp.flush();
    envoyes++;
    Utilities.sleep(PAUSE_MS);
  }
  console.log(envoyes + " message(s) envoyé(s). Plafond restant aujourd'hui : " + MailApp.getRemainingDailyQuota() + '.');
  return envoyes;
}

function envoyerLot() {   // appelée chaque heure par le déclencheur
  const h = Number(Utilities.formatDate(new Date(), 'Europe/Paris', 'H'));
  if (h < HEURES[0] || h > HEURES[1]) return;
  envoyer_(LOT);
}

function essai() {
  verifierAlias_();
  const moi = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  const l = feuille_().getDataRange().getValues().slice(1).find(x => String(x[0]).trim() === '' && x[5]);
  if (!l) throw new Error('Aucune ligne à envoyer.');
  GmailApp.sendEmail(moi, '[ESSAI] ' + l[6], 'Destinataire prévu : ' + l[5] + '\n\n' + l[7], { from: EXPEDITEUR, name: NOM });
  console.log('Essai envoyé à ' + moi + ' depuis ' + EXPEDITEUR + '.');
}

function demarrer() {
  arreter();
  ScriptApp.newTrigger('envoyerLot').timeBased().everyHours(1).create();
  envoyer_(LOT);
}

function arreter() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'envoyerLot').forEach(t => ScriptApp.deleteTrigger(t));
  console.log('Envoi automatique arrêté.');
}
