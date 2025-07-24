# 📅 Calendrier MOSAE

Ce projet propose une interface web interactive pour visualiser les emplois du temps (EDT) de deux entités : **ESGT** et **UNIV**. Il est composé de deux pages principales : `index.html` (MOSAE 1) et `mosae2.html` (MOSAE 2), toutes deux alimentées par des fichiers JSON générés automatiquement.

## 🔧 Fonctionnalités

- Affichage des événements hebdomadaires avec **FullCalendar**
- Sélection dynamique de la semaine ISO
- Affichage des détails d’un événement dans une fenêtre modale
- Déclenchement manuel d’un **workflow GitHub Actions** pour régénérer les données
- Rechargement forcé de la page
- Filtrage des événements par source (ESGT ou UNIV)

## 🧠 Génération automatique des événements

Les fichiers JSON (`esgt_events.json`, `univ_events.json`, etc.) sont générés automatiquement à partir de fichiers ICS grâce à deux scripts Python :

- `esgt_generate_events.py` : traite les calendriers MOSAE1 et MOSAE2 de l'ESGT
- `univ_generate_events.py` : traite les calendriers UNIV et UNIV2 de l’Université du Mans

Ces scripts sont exécutés via un workflow GitHub Actions :

### `.github/workflows/all_events.yml`

- Déclenché manuellement via `workflow_dispatch`
- Télécharge les fichiers ICS
- Extrait les événements pertinents (hors week-end)
- Génère les fichiers JSON
- Commit et push automatique si des changements sont détectés

## 🗂️ Structure du projet

📁 racine/

├── 📁 .git/                      # Répertoire de configuration Git  
├── 📁 .github/                   # Workflows GitHub Actions  

├── .env                       # Variables d'environnement (non versionné)  
├── favicon.ico                # Icône du site  
├── icon.png                   # Icône personnalisée  

├── index.html                 # Page principale (MOSAE1)  
├── mosae2.html                # Page secondaire (MOSAE2)  

├── script.js                  # Logique JavaScript pour les pages  
├── style.css                  # Feuille de style CSS  

├── MOSAE1.ics                 # Fichier ICS source pour MOSAE1  
├── MOSAE2.ics                 # Fichier ICS source pour MOSAE2  

├── esgt_events.json           # Événements ESGT pour MOSAE1  
├── esgt_events2.json          # Événements ESGT pour MOSAE2  
├── univ_events.json           # Événements UNIV pour MOSAE1  
├── univ_events2.json          # Événements UNIV pour MOSAE2  

├── esgt_generate_events.py    # Script de génération JSON à partir d'ICS (ESGT)  
└── univ_generate_events.py    # Script de génération JSON à partir d'ICS (UNIV)

## 🚀 Déploiement

Ce projet peut être hébergé sur **GitHub Pages**. Assurez-vous que les fichiers JSON sont à jour et que le workflow `all_events.yml` est bien configuré pour les générer automatiquement.

## 🔐 Sécurité

⚠️ **Ne jamais exposer votre token GitHub personnel dans le code (`script.js`)**. Utilisez plutôt des **secrets GitHub** dans vos workflows.

## 👨‍💻 Auteur

- **DIOUF Ousmane**  
- GitHub : @dioufousmane
