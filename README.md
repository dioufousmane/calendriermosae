# MOSAE — ancien et nouveau modèles dans un seul dépôt

## Accès

| Adresse relative | Interface |
|---|---|
| `index.html` ou `/` | Accueil de l’ancien modèle (par défaut) |
| `mosae1.html` | Ancien planning MOSAE 1 |
| `mosae2.html` | Ancien planning MOSAE 2 |
| `nouveau/index.html` | Nouveau planning |
| `nouveau/mosae1.html` | Nouveau planning MOSAE 1 |
| `nouveau/mosae2.html` | Nouveau planning MOSAE 2 |

L’annonce « Découvrez le nouveau planning MOSAE » apparaît à l’accueil ancien et sur les deux anciens calendriers. Son bouton ouvre la même promotion dans le nouveau modèle. Le nouveau contient « Ancien modèle » dans la barre supérieure et « Revenir à l’ancien modèle » dans le menu, avec retour vers la promotion sélectionnée.

Aucune redirection automatique : l’ancien modèle reste l’entrée principale, même après avoir essayé le nouveau.

## Publier sur GitHub Pages

1. Décompresser l’archive et copier **le contenu** de `calendriermosae-deux-modeles/` à la racine du dépôt existant, sans ajouter ce dossier comme niveau supplémentaire.
2. Inclure `.github/workflows/all_events.yml`, `.nojekyll`, `nouveau/`, `history/`, `js/`, `scripts/`, les générateurs Python et les quatre JSON.
3. Si GitHub Pages publie déjà la branche `master` ou `main` depuis `/ (root)`, conserver ce réglage. Sinon choisir la branche concernée et la racine dans Settings → Pages → Deploy from a branch.
4. Après publication, ouvrir l’adresse habituelle, puis essayer les boutons de bascule dans les deux sens, pour MOSAE 1 et MOSAE 2.

Pour le dépôt habituel :
- Ancien : https://dioufousmane.github.io/calendriermosae/
- Nouveau : https://dioufousmane.github.io/calendriermosae/nouveau/

Ces URL décrivent l’emplacement prévu après votre publication ; aucun push ni déploiement distant n’a été effectué lors de la création de l’archive. Les liens internes sont relatifs et fonctionnent également si le dépôt change de nom.

## Données et maintenance

Les quatre fichiers `esgt_events.json`, `esgt_events2.json`, `univ_events.json`, `univ_events2.json` sont uniquement à la racine. Les deux modèles les lisent directement. Ne pas les dupliquer sous nouveau/.

Le jeu livré provient du nouveau modèle, daté du 10 septembre 2026 ; celui de l’ancienne archive datait du 20 août. La collecte commune, les métadonnées de mutualisation, l’historique `history/` et les abonnements `feeds/` sont conservés. Les modèles partagent les données mais gardent leurs fonctions et rendus respectifs : badges et nouveaux filtres appartiennent au nouveau modèle.

Les scripts et le workflow restent à la racine. Le nouveau modèle utilise `js/data.mjs` à la racine pour le moteur commun ; ses scripts d’interface sont dans `nouveau/js/`. Les abonnements pointent vers les flux communs à la racine. Les guides du nouveau modèle sont dans `nouveau/docs/`.

Le tutoriel du nouveau modèle et son option « Ne plus afficher » sont conservés. La promotion est préservée lors de la bascule ; chaque modèle conserve son propre état de navigation/date.

## Essai local

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Ouvrir http://localhost:8000 depuis la racine du projet. Ne pas ouvrir les calendriers par file:// : le chargement des JSON nécessite HTTP.

```sh
node --test tests/data.test.mjs
python -m unittest discover -s tests
node scripts/generate-feeds.mjs
```

Le bundle FullCalendar fourni est partagé localement. Les autres bibliothèques CDN de l’ancien modèle sont conservées pour ne pas modifier son fonctionnement. Les fichiers d’environnement et l’historique Git des archives sources ne sont pas inclus dans ce projet destiné à publication.

## Vérifications

Contrôles de syntaxe des scripts et vérification des chemins locaux après déplacement, des six points d’entrée, des boutons de bascule et du chargement des données communes. Tests métier exécutés et flux ICS régénérés. Aucun test navigateur ni exécution du workflow sur le dépôt distant n’a été effectué ; vérifier le rendu et les bascules après publication.


## Volumes cumulés du nouveau calendrier
Les quatre compteurs distinguent ESGT / Université et cours spécifiques / mutualisés. Le cumul commence au 1er septembre de l’année universitaire correspondant à la fin de la période consultée et va jusqu’à son dernier jour inclus (fin de semaine dans les vues semaine, agenda et cartes ; fin du mois dans la vue mensuelle). Il suit les filtres actifs. Les séances futures de la période consultée sont incluses : il s’agit d’heures planifiées, pas d’un relevé de présence. Les périodes sans horaire et les durées invalides sont exclues. Un report universitaire identifié comme cours ESGT est attribué uniquement à l’ESGT. Les volumes par matière, salle et enseignant utilisent aussi ce cumul. Une source en échec de chargement est signalée comme indisponible.


### Reports ESGT et événements hors enseignement
Le référentiel d’alias `js/ownership.mjs` est fondé sur la maquette MOSAE ESGT fournie. Les mentions ESGT dans le titre ou la salle permettent aussi de reconnaître un report. Une correspondance unique de matière, promotion, date et heure de début relie les deux événements tout en les laissant visibles, avec priorité aux horaires ESGT pour les volumes, même si la fin diffère. Les reports isolés restent visibles et sont attribués à l’ESGT. Pas de fusion approximative globale : les intitulés ambigus doivent être ajoutés au référentiel après vérification. Les enseignements partagés tels que la préparation d’un observatoire ne sont pas attribués entièrement à l’ESGT sur leur seul intitulé générique.
Les soutenances, manifestations, campus en fête, rentrées, réunions et sessions d’information restent visibles mais comptent zéro heure. Les examens, semaines en entreprise et jours fériés sont exclus des volumes, tout en restant visibles dans le planning. Les badges de mutualisation utilisent les publics des séances, pas les volumes théoriques de la maquette.

Les reports universitaires restent affichés avec leur couleur et leur filtre de source UNIV. Le badge « Report ESGT · hors volume Univ. » distingue leur origine de leur attribution comptable. Un report lié à une séance ESGT ne rajoute aucune heure et ne déclenche pas de vigilance contre cette séance.


### Pauses ESGT
Le cumul ESGT et les charges par matière/enseignant déduisent 15 minutes entre chaque séance de 75 minutes : 1h15 → 1h15 ; 2h45 → 2h30 ; 4h15 → 3h45 ; 5h45 → 5h. Les horaires, la durée du créneau et l’occupation des salles restent inchangés. Les cours universitaires ne sont pas corrigés, sauf ceux attribués à l’ESGT. Une durée atypique reste inchangée et est signalée dans la fiche du cours, faute de pauses connues. Les rapports liés ne sont toujours pas ajoutés au cumul.


### Progression globale M1 + M2
Références : 373,2 h ESGT et 248,8 h Université, soit 622 h. Le bloc global ignore les filtres, mais suit la date de fin consultée. Il additionne spécifique et mutualisé sans doubler les séances communes ni les reports. Chaque établissement affiche sa progression sur son volume, sa contribution au total de 622 h et sa part du cumul. Les références sont réparties exactement à 60 % pour l’ESGT et 40 % pour l’Université. Il s’agit d’heures planifiées, pas de présences validées.

La progression globale est accessible uniquement dans l’onglet « Progression globale » du nouveau calendrier (desktop et mobile). Les quatre compteurs filtrés restent sur le planning ; le suivi global de 622 h est affiché dans sa page dédiée.
