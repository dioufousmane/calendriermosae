# Audit et proposition UX/UI — MOSAE

## Périmètre réellement examiné

Archive calendriermosae-master : HTML, styles, public/script.js, bundle FullCalendar local, quatre JSON, exports ICS, deux générateurs Python, workflow GitHub Actions et trigger.js. Audit du code et des données, sans observation d’utilisateurs et sans mesure de performance sur un site de production.

Les quatre JSON contiennent respectivement 84 événements ESGT M1, 95 Université M1, 54 ESGT M2, 138 Université M2 : 371 entrées. Leur actualisation est datée du 10 septembre 2026. Les ICS fournis sont antérieurs (juillet/août 2026) ; ils ont servi à comprendre les métadonnées perdues, pas à écraser les JSON plus récents.

## Forces

- Application statique simple à héberger et à maintenir ; pas de migration serveur nécessaire.
- FullCalendar déjà adapté aux vues temporelles et aux interactions calendrier.
- Séparation ESGT / Université et M1 / M2 explicite dans les fichiers.
- Collecte automatique existante, récapitulatif horaire, détail de séance et mémorisation de semaine.

## Faiblesses et priorités

| Priorité | Constat dans l’existant | Conséquence | Réponse apportée |
|---|---|---|---|
| P0 | Les générateurs écartent les promotions et l’UID ; l’extracteur Université supprime des mentions de formation | Cours partagés invisibles | Conservation des métadonnées explicites et moteur commun de mutualisation |
| P0 | Fériés et vacances à 01:00–01:00 ; périodes d’alternance mélangées aux cours | Indicateurs trompeurs | Périodes toute la journée, exclues des heures |
| P0 | Université : remplacement du fuseau par UTC avant conversion | Risque de décalage d’horaires si l’entrée possède déjà un fuseau | Conversion du datetime existant sans remplacement arbitraire |
| P1 | Accueil de sélection puis pages distinctes, styles et logique dispersés | Clic supplémentaire et contexte fragmenté | Entrée immédiate dans le planning et filtre de promotion |
| P1 | Dépendances graphiques et exports chargés depuis plusieurs CDN | Sensibilité au réseau ; poids additionnel | Réutilisation du bundle FullCalendar local, exports natifs |
| P1 | Semaine initiale et calendrier d’options liés à des années fixes | Navigation vieillissante | Sélection libre de date et période mémorisée |
| P1 | Informations essentiellement au survol/dans une modale | Accès difficile sur mobile | Informations dans les cartes, agenda et fiche clavier |
| P1 | Absence de recherche commune et de filtres pédagogiques | Exploration lente | Recherche sans accents et filtres combinés |
| P1 | Occupation complète des salles inconnue | Un taux serait faussement précis | Heures réservées observées et explication du périmètre |
| P2 | trigger.js constitue un service Express distinct, non déployable sur Pages | Bouton d’actualisation ambigu | Actualiser recharge les JSON ; la collecte est assurée par le workflow |

## Direction graphique

Une interface de travail universitaire : rail latéral bleu pétrole, espace central lumineux, surfaces sobres et densité adaptée à la lecture quotidienne. La couleur distingue les sources, le violet signale la mutualisation ; les intitulés rendent l’information compréhensible indépendamment de la couleur. Pas d’écran d’accueil promotionnel.

La charte complète et ses composants figurent dans design.html. Les maquettes haute fidélité utilisent le code livré, dans des cadres de largeurs différentes, afin d’éviter les divergences entre une image de conception et le produit.

## Parcours

| Public | Parcours prioritaire |
|---|---|
| Étudiant | Promotion → semaine ou agenda mobile → fiche cours → ajout ICS |
| Enseignant | Espace enseignant → filtre enseignant → semaine → récapitulatif des heures |
| Responsable | Espace responsable → tableau de bord → points de vigilance → salles et charges |
| Tous | Recherche → filtres complémentaires → export de la sélection |

La promotion, l’enseignant choisi, l’apparence, la date et la vue sont mémorisés localement. Les préférences ne quittent pas le navigateur. Les espaces ne créent pas de comptes ni de droits d’accès.

## Fonctions livrées

Navigation responsive ; thèmes clair/sombre ; semaine, mois, agenda et liste en cartes ; recherche instantanée ; filtres source, promotion, enseignant, salle, UE, ECUE et mutualisation ; fiche complète ; tableau de bord ; échéances détectées par intitulés examen/soutenance/jury ; volumes par matière et enseignant ; heures de salles dédoublonnées ; chevauchements à vérifier ; impression PDF et export ICS ; abonnements enrichis par promotion.

Les UE/ECUE restent désactivées lorsque les sources ne les renseignent pas. Une formation externe apparaît dans le filtre si elle est explicitement présente dans les métadonnées ; aucun calendrier propre à cette formation n’est inventé.

## Accessibilité et limites

Labels de champs, contrôles natifs, lien d’évitement, focus visible, modale native avec fermeture Échap, événements activables au clavier, annonces de chargement, prise en compte des animations réduites et alternatives textuelles aux couleurs. Le mobile ouvre l’agenda par défaut lors de la première visite ; la grille hebdomadaire reste consultable par défilement horizontal si choisie.

Ce travail vise les pratiques WCAG 2.2, sans revendiquer une certification ou une conformité complète. Une recette navigateur, zoom 200 %, lecteur d’écran et terminaux réels reste nécessaire avant mise en production.

Références : https://www.w3.org/TR/WCAG22/ ; https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum ; documentation FullCalendar https://fullcalendar.io/docs/event-render-hooks (documentation actuelle ; version locale conservée en 6.1.21).

## Correction des mutualisations — 11 septembre 2026

Cette mise à jour complète 276 entrées JSON par les métadonnées explicites des ICS joints, uniquement si date, début, fin et intitulé correspondent de manière univoque. Aucun horaire, salle ou enseignant n’est remplacé. Les exports sont anciens : leur nom et date sont conservés dans metadata_source / metadata_snapshot_date, et une information en fiche précise que ces publics restent à confirmer avec le planning actuel. Les autres séances ne sont pas devinées. Le détail par fichier est dans mutualisations-restauration.json.

La lecture ADE couvre désormais les lignes de publics explicites M1/M2, IG, MF, LP et UEO, sans liste fermée à quatre spécialités. Les variantes MOSAE et les mentions de semestre sont harmonisées. Le label d’établissement ESGT seul ne constitue pas une promotion supplémentaire.

Pour les UID HYPERPLANNING du format Cours-numéro-numéro-MOSAE1/2-Index-Education, observés dans les deux exports fournis, un identifiant commun est dérivé uniquement en présence de plusieurs promotions explicites. Le regroupement exige toujours des débuts/fins identiques. Les autres UID restent inchangés.

Le module de restauration est une migration ponctuelle, non ajoutée au workflow automatique ; les nouvelles collectes extraient directement les métadonnées fraîches. L’historique universitaire et les trois abonnements ICS ont été régénérés. Le sélecteur de promotion reste strictement MOSAE 1 / MOSAE 2. Les publics externes figurent dans les badges, cartes et fiches.
