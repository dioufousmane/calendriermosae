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
