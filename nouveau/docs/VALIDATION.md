# Validation de la livraison

## Contrôles exécutés

- 11 tests Node : publics multiples, regroupement strict, faux rapprochements, session commune, périodes et durées invalides, chevauchements, occupation sans double comptage, ICS échappé/replié et fuseau de Paris, UID stable, filtres, changement d’année.
- 2 tests Python : extraction des promotions/groupes ESGT, publics ADE et canonicalisation MOSAE.
- Vérification syntaxique des modules JavaScript et compilation syntaxique des extracteurs Python.
- Génération effective des trois abonnements ICS à partir des JSON fournis.
- Vérification des références locales des points d’entrée et maquettes.
- Calcul des contrastes des principales paires de couleurs de texte (ci-dessous).

Résultat du jeu fourni : 371 entrées sources, 368 événements après trois regroupements stricts entre promotions, 103 périodes hors calcul des heures, aucune durée invalide restante après classification des fériés. La mutualisation par correspondance stricte demeure une inférence explicitée dans la fiche.

## Contrastes calculés

Seuil retenu : 4,5:1 pour le texte courant. Les valeurs portent sur les paires déclarées, pas sur une inspection exhaustive des états rendus par le navigateur.

| Texte | Fond | Rapport |
|---|---|---|
| #192e38 | #ffffff | 14.10:1 |
| #596b76 | #ffffff | 5.54:1 |
| #0c655f | #e4f3ef | 6.04:1 |
| #205caf | #eaf1fd | 5.76:1 |
| #7137a6 | #f2e9ff | 6.39:1 |
| #ffffff | #0c655f | 6.90:1 |
| #edf5f6 | #182731 | 13.83:1 |
| #bacbd3 | #182731 | 9.15:1 |
| #88ddc6 | #173f38 | 7.32:1 |
| #a9caff | #20344d | 7.58:1 |
| #dec0ff | #37224e | 8.72:1 |

## Limites de vérification

Aucun test navigateur, capture du rendu, audit Lighthouse, lecteur d’écran, zoom 200 %, import Outlook/Google ni impression PDF réelle n’a été exécuté. Les maquettes HTML sont des surfaces interactives de revue, pas des captures validées. Les extracteurs ont été corrigés et testés sur leurs métadonnées ; aucune collecte distante n’a été déclenchée. Aucun déploiement distant n’a été effectué.

## Recette recommandée avant publication

1. Servir le projet et vérifier M1/M2, retour Aujourd’hui, navigation de mois/semaine, état vide et erreur de source.
2. Vérifier les quatre vues, thème sombre, menu mobile, filtres et fiche clavier (Entrée, Tab, Échap).
3. Contrôler les mutualisations avec les responsables ; vérifier notamment les trois soutenances rapprochées.
4. Importer un ICS dans les logiciels institutionnels, notamment autour du changement d’heure ; imprimer une semaine et vérifier les badges.
5. Exécuter le workflow en environnement prévu, vérifier les nouvelles métadonnées et les flux avant de publier le dépôt.
6. Vérifier contraste des états de focus, agrandissement 200 %, lecture d’écran et comportement de la grille sur les terminaux utilisés.

## Ajout du tutoriel — 11 septembre 2026

Syntaxe JavaScript vérifiée pour app.mjs et welcome.mjs ; présence du point d’entrée sur les trois pages et raccordement du démarrage contrôlés. La recette navigateur reste à effectuer : avancer/revenir, fermer par Échap, mémoriser « Ne plus afficher », recharger, relancer depuis le menu et vérifier sur mobile. Les 13 tests métier cités plus haut concernent la livraison initiale, dont le moteur de données est inchangé.

## Historique universitaire — validation

Quatre tests ajoutés et réussis : cours passé retiré du flux conservé, séance future supprimée non conservée, révision remplaçant une entrée sans doublon, sauvegarde avant collecte et restauration depuis l’archive. Les six tests Python (dont deux existants) passent. Syntaxe de app.mjs vérifiée et trois flux ICS régénérés. Le déploiement et la recette navigateur restent à effectuer.

## Vigilance limitée aux cours différents

14 tests Node réussis, dont trois cas ciblés : même cours entre sources exclu, même identifiant de séance exclu, cours différents conservés. Syntaxe app.mjs vérifiée.

## Correction des publics mutualisés

16 tests Node et 8 tests Python réussis. Cas supplémentaires : variantes d’un même public, publics externes, spécialités ADE, suppression du label d’établissement et UID commun HYPERPLANNING. Syntaxe du module d’interface vérifiée. 276 entrées complétées par correspondance exacte avec les snapshots. Après regroupement : 366 événements, dont 94 portant plusieurs publics (périodes incluses). Ces chiffres ne valent pas confirmation des mutualisations actuelles : les informations récupérées d’anciens exports sont signalées dans les fiches. La recette navigateur reste à effectuer.
