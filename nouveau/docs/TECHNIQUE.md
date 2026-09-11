# Documentation technique

## Architecture

Application statique en JavaScript natif. `index.html`, `mosae1.html`, `mosae2.html` constituent trois points d’entrée vers le même CSS et le même module. Le maintien de trois petits squelettes évite les redirections et conserve les anciennes adresses ; synchroniser leurs modifications structurelles.

- `js/data.mjs` : normalisation, regroupement, filtres, conflits, union d’intervalles et sérialisation ICS ; aucune dépendance DOM.
- `js/app.mjs` : état des filtres, rendu FullCalendar, tableaux de bord, fiches et exports.
- `style.css` : tokens clair/sombre, composants, responsive et impression.
- `event_metadata.py` : extraction conservatrice des publics explicitement présents.
- `scripts/generate-feeds.mjs` : génération des trois abonnements avec les mêmes règles que l’interface.
- `tests/` : cas métier ciblés ; données fictives limitées aux tests.
- `public/script.js` et `trigger.js` : anciens fichiers conservés, non chargés par l’interface refondue. Le backend Express n’est pas mis en service ni authentifié par cette refonte.

## Contrat d’une entrée JSON

Champs historiques : `date` au format JJ/MM/AAAA, `start` et `end` HH:mm, `title`, `salle`, `enseignant`, `maj`.

Champs complémentaires acceptés :

```json
{
  "uid": "identifiant-source",
  "session_id": "identifiant-commun-optionnel",
  "promotions": ["MOSAE 1", "IG5"],
  "groups": ["1a", "1b"],
  "formations": ["GAED", "SIG"],
  "ue": "UE 2",
  "ecue": "SIG",
  "modality": "TD",
  "endDate": "2026-09-10",
  "allDay": false,
  "raw_title": "Intitulé avant nettoyage"
}
```

Ces valeurs sont un exemple de contrat, pas des données ajoutées aux emplois du temps. La promotion du fichier source est toujours conservée. Les listes doivent utiliser des désignations cohérentes ; les générateurs canonicalisent MOSAE1 / M1 MOSAE vers MOSAE 1. Les labels ADE pris en charge sont explicitement limités à MOSAE, URBANISTIC, MATTERRE, MIDEC ; étendre les labels en fonction des exports réels et ajouter un test pour chacun. Les UE/ECUE et modalités non préfixées CM/TD/TP doivent être fournis en amont. Aucun NER hasardeux sur les noms d’enseignants n’est ajouté.

## Mutualisation

1. Plusieurs promotions, groupes ou formations explicitement déclarés ⇒ badge MUTUALISÉ.
2. Regroupement d’occurrences de mêmes horaires avec `session_id` commun, ou même UID dans la même source.
3. En l’absence d’identifiants contradictoires, correspondance stricte de source, intitulé normalisé, début, fin, salle connue et enseignant connu. Ce cas reste une inférence, dont le motif est affiché en fiche. Aucun rapprochement flou ni fusion automatique ESGT/Université sur le seul titre.
4. Fusion des listes de publics ; volume compté une fois.

Le titre, les horaires et les métadonnées ne permettent pas de garantir toutes les mutualisations. Les 3 rapprochements du jeu fourni concernent des soutenances. Les ICS historiques montrent d’autres publics explicites, mais étant plus anciens que les JSON, ils n’ont pas été réinjectés automatiquement. Les prochains passages des générateurs conserveront ces publics.

Pour les exports ESGT dont l’UID inclut la promotion, deux UID différents ne sont pas fusionnés par heuristique. Chaque entrée peut toutefois porter le badge grâce aux promotions explicites ; pour dédoublonner entre fichiers, fournir un `session_id` commun fiable. Ne pas retirer les suffixes d’UID sans preuve sur le contrat de la source.

## Temps et indicateurs

Les JSON portent des heures civiles de Paris. FullCalendar utilise UTC comme conteneur d’affichage de ces heures sans conversion locale : 08:30 reste 08:30 quel que soit le fuseau du navigateur. La date « Aujourd’hui » est calculée pour Europe/Paris. L’indicateur d’heure courante est désactivé pour éviter un faux repère UTC. Les exports ICS utilisent explicitement Europe/Paris avec VTIMEZONE et règles heure d’hiver/été.

Fériés, vacances, semaines d’entreprise/alternance et périodes banalisées sont traités comme périodes toute la journée. Leurs durées ne deviennent pas des heures d’enseignement. Le contrat accepte une date de fin pour les événements sur plusieurs jours. La classification des intitulés est centralisée dans data.mjs et doit être étendue prudemment selon les données.

Les cartes d’indicateurs concernent la période et les filtres actifs. Dans le tableau de bord, les sections Aujourd’hui et Cette semaine concernent le présent, indépendamment de la période consultée ; les libellés le précisent. Les heures représentent des heures de séances, pas une charge HETD contractuelle. Les enseignants multiples dans un champ restent un libellé collectif.

L’utilisation des salles est l’union des intervalles de réservation par source et salle. Sans inventaire, horaires d’ouverture et réservations complètes, aucun pourcentage global d’occupation n’est calculé. Les collisions de salle entre sources ne sont pas automatiquement conclues : un code de salle peut désigner deux bâtiments différents.

Les chevauchements sont des points de vigilance, non une preuve de conflit. Ils comparent les intervalles, enseignants, salles dans une même source et promotions/groupes. Des doubles publications ESGT/Université peuvent subsister et augmenter les volumes : elles nécessitent un identifiant commun vérifié.

## Actualisation et abonnements

Le bouton Actualiser relit les JSON avec `cache: no-cache` ; il ne lance pas le workflow distant. La date affichée est la plus ancienne des mises à jour présentes, pour éviter de présenter un jeu mixte comme entièrement récent. Chaque source est chargée indépendamment via Promise.allSettled, et les erreurs sont affichées.

Le workflow existant conserve sa fréquence de deux heures et ses URL ; aucun téléchargement distant n’a été exécuté dans cette livraison. Il génère désormais les flux `feeds/mosae.ics`, `feeds/mosae1.ics`, `feeds/mosae2.ics` après les JSON. Node doit être présent sur le runner ubuntu-latest. Les flux incluent les badges dans SUMMARY, les publics dans DESCRIPTION et des UID stables fondés sur l’identité et la séance. Les lignes sont repliées à 75 octets UTF-8, avec échappement ICS. Les horaires invalides sont exclus.

L’abonnement nécessite des URL HTTP(S) accessibles au logiciel client. Les flux sont des fichiers statiques régénérés, non une API dynamique. Leur actualisation côté client dépend de Google/Outlook/Apple/etc. Le bouton d’export est un instantané de la sélection et ne crée pas d’abonnement.

## PDF et sécurité

L’export PDF passe par l’impression native du navigateur, avec table A4 paysage, texte sélectionnable, promotions, filtres et badges. Sélectionner « Enregistrer au format PDF ». Aucun moteur PDF tiers n’est installé.

Les valeurs issues des JSON sont échappées avant insertion HTML. Aucun secret n’est requis par le front-end. L’application ne modifie pas les emplois du temps. Le serveur Express historique et son token environnemental restent hors de ce front-end. Si ce service est utilisé séparément, prévoir authentification et contrôle d’accès avant toute exposition.

## Performance

Un seul bundle calendrier local ; aucun chargement de polices, icônes, graphes, capture d’écran ou PDF depuis un CDN. Les quatre fichiers sont chargés en parallèle. Les filtres sont appliqués en mémoire, la recherche est temporisée à 120 ms et FullCalendar utilise batchRendering. Le moteur de rapprochement et de conflits est adapté au petit jeu fourni ; pour des dizaines de milliers de séances, indexer les signatures et calculer les agrégats côté serveur. Aucune mesure Lighthouse ou de latence de production n’a été effectuée.

## Tutoriel de bienvenue (ajout du 11 septembre 2026)

`js/welcome.mjs` gère une modale native indépendante des fiches de cours, six étapes, l’encadrement des zones et la navigation précédent/suivant. L’état de la page et les filtres ne sont pas modifiés ; l’ouverture du menu mobile, le défilement et le focus sont restaurés à la fermeture. Le démarrage automatique attend le chargement du calendrier et n’a lieu qu’une fois par chargement de page. Les maquettes en iframe ne déclenchent pas la visite automatiquement.

La préférence `mosae-v2-welcome-hidden` est enregistrée immédiatement dans localStorage : true désactive le lancement automatique, false le réactive. Le bouton du menu fonctionne dans les deux cas. Un stockage indisponible est signalé lorsque l’utilisateur tente d’enregistrer son choix. Aucun serveur, compte ou nouvelle dépendance.

## Historique Université et promotions — 11 septembre 2026

`university_history.py` conserve les séances dont la date est antérieure au jour courant à Paris dans `history/univ_events.json` et `history/univ_events2.json`. Avant chaque collecte, le disponible est sauvegardé ; après une collecte réussie, l’historique est réuni aux nouvelles données dans les fichiers JSON habituels. L’interface, les quatre vues, statistiques et exports le lisent donc sans chargement supplémentaire. Le workflow versionne également history/ pour le retrouver à la prochaine exécution.

Les données fraîches priment sur l’historique pour une même séance (UID et date, ou signature date/heure/intitulé en absence d’identifiant). Les séances futures absentes d’une collecte réussie ne sont pas conservées, afin de respecter les suppressions. Les archives sont écrites atomiquement avant les fichiers publiés. Un fichier historique invalide bloque l’écriture au lieu de perdre silencieusement son contenu.

La sauvegarde initiale comporte deux séances M1 du 10 septembre présentes dans les JSON fournis ; aucun cours M2 antérieur au 11 septembre n’y est disponible. Les séances déjà retirées avant la première sauvegarde ne peuvent pas être reconstituées par ce mécanisme seul : un ancien export ou l’historique Git est nécessaire. Les anciens ICS fournis n’ont pas été réinjectés sans contrôle, car ils peuvent représenter des plannings remplacés.

Déployer également university_history.py et history/, ainsi que le workflow modifié. Pour initialiser depuis les JSON présents : `python university_history.py`. Aucune collecte distante n’a été exécutée pendant cette modification.

Le sélecteur de promotion est limité à MOSAE 1 et MOSAE 2, avec MOSAE 1 comme valeur de repli et après réinitialisation. Les publics externes restent conservés dans les métadonnées et badges de mutualisation.

## Points de vigilance : cours différents uniquement

Les chevauchements portant sur le même intitulé, indépendamment de la casse, des accents et des espaces, ne déclenchent plus d’alerte, y compris entre ESGT et Université. Un identifiant commun de séance exclut également l’alerte. Les chevauchements entre cours différents restent signalés lorsqu’ils concernent une même promotion/groupe, un enseignant ou une salle selon les règles existantes. Les intitulés différents sans identifiant commun ne sont pas rapprochés automatiquement. Les anomalies de durée restent affichées séparément.

## Correction des mutualisations — 11 septembre 2026

Cette mise à jour complète 276 entrées JSON par les métadonnées explicites des ICS joints, uniquement si date, début, fin et intitulé correspondent de manière univoque. Aucun horaire, salle ou enseignant n’est remplacé. Les exports sont anciens : leur nom et date sont conservés dans metadata_source / metadata_snapshot_date, et une information en fiche précise que ces publics restent à confirmer avec le planning actuel. Les autres séances ne sont pas devinées. Le détail par fichier est dans mutualisations-restauration.json.

La lecture ADE couvre désormais les lignes de publics explicites M1/M2, IG, MF, LP et UEO, sans liste fermée à quatre spécialités. Les variantes MOSAE et les mentions de semestre sont harmonisées. Le label d’établissement ESGT seul ne constitue pas une promotion supplémentaire.

Pour les UID HYPERPLANNING du format Cours-numéro-numéro-MOSAE1/2-Index-Education, observés dans les deux exports fournis, un identifiant commun est dérivé uniquement en présence de plusieurs promotions explicites. Le regroupement exige toujours des débuts/fins identiques. Les autres UID restent inchangés.

Le module de restauration est une migration ponctuelle, non ajoutée au workflow automatique ; les nouvelles collectes extraient directement les métadonnées fraîches. L’historique universitaire et les trois abonnements ICS ont été régénérés. Le sélecteur de promotion reste strictement MOSAE 1 / MOSAE 2. Les publics externes figurent dans les badges, cartes et fiches.
