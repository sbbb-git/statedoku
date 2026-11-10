/**
 * Statedoku : envoi des e-mails de prospection depuis cette feuille.
 *
 * Une ligne par message (onglet 1) : A Statut, B Lot, C Organisation,
 * D Pays ou région, E Langue, F À, G Objet, H Message, I Envoyé le.
 * Le script envoie, dans l'ordre de la feuille, les lignes dont le Statut est
 * vide, depuis contact@statedoku.com, au plus PAR_JOUR messages par jour, puis
 * écrit « envoyé » et la date. Mettre « stop » dans le Statut d'une ligne pour
 * qu'elle ne parte jamais (par exemple si quelqu'un demande à ne plus être
 * contacté).
 *
 * Mise en route, une seule fois :
 *  1. Gmail : contact@statedoku.com doit figurer dans « Envoyer des e-mails en
 *     tant que » (voir la checklist).
 *  2. Dans cette feuille : Extensions, Apps Script, coller ce fichier,
 *     enregistrer.
 *  3. Choisir la fonction « essai » puis Exécuter : Google demande
 *     l'autorisation d'envoyer des e-mails en ton nom, accepter. Tu reçois le
 *     premier message de la liste, pour vérifier.
 *  4. Choisir « demarrer » puis Exécuter : un premier lot part tout de suite,
 *     puis un lot chaque jour vers 15 h (heure de Paris, 9 h à New York).
 *  Pour tout arrêter : exécuter « arreter ».
 */
const EXPEDITEUR = 'contact@statedoku.com';
const NOM = 'Statedoku';
const PAR_JOUR = 40;            // reste prudent : un compte Gmail gratuit plafonne à 100 par jour
const PAUSE_MS = 5 * 1000;      // 5 secondes entre deux messages (un lot doit tenir dans les 6 minutes qu'Apps Script accorde)

function feuille_() { return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; }

function verifierAlias_() {
  const alias = GmailApp.getAliases().map(a => a.toLowerCase());
  if (alias.indexOf(EXPEDITEUR) === -1) {
    throw new Error(EXPEDITEUR + " n'est pas encore une adresse d'envoi de ce compte Gmail (Paramètres, Comptes, Envoyer des e-mails en tant que).");
  }
}

function envoyerLot() {
  verifierAlias_();
  const f = feuille_();
  const lignes = f.getDataRange().getValues();
  let envoyes = 0;
  for (let i = 1; i < lignes.length; i++) {
    if (envoyes >= PAR_JOUR || MailApp.getRemainingDailyQuota() < 5) break;
    const [statut, , organisation, , , a, objet, message] = lignes[i];
    if (String(statut).trim() !== '' || !a || !objet || !message) continue;
    try {
      GmailApp.sendEmail(String(a).trim(), String(objet), String(message), { from: EXPEDITEUR, name: NOM, replyTo: EXPEDITEUR });
      f.getRange(i + 1, 1).setValue('envoyé');
      f.getRange(i + 1, 9).setValue(new Date());
      envoyes++;
    } catch (e) {
      f.getRange(i + 1, 1).setValue('erreur : ' + String(e.message || e).slice(0, 80));
    }
    SpreadsheetApp.flush();
    Utilities.sleep(PAUSE_MS);
  }
  console.log(envoyes + ' message(s) envoyé(s) aujourd\'hui.');
}

function essai() {
  verifierAlias_();
  const l = feuille_().getRange(2, 1, 1, 8).getValues()[0];
  GmailApp.sendEmail(Session.getActiveUser().getEmail(), '[ESSAI] ' + l[6], 'Destinataire prévu : ' + l[5] + '\n\n' + l[7], { from: EXPEDITEUR, name: NOM });
  console.log('Essai envoyé à ' + Session.getActiveUser().getEmail());
}

function demarrer() {
  arreter();
  ScriptApp.newTrigger('envoyerLot').timeBased().everyDays(1).atHour(15).inTimezone('Europe/Paris').create();
  envoyerLot();
}

function arreter() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'envoyerLot').forEach(t => ScriptApp.deleteTrigger(t));
  console.log('Envoi quotidien arrêté.');
}
