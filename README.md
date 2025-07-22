# 📅 Calendrier MOSAE

Bienvenue dans le projet **Calendrier MOSAE** — une application web interactive permettant de visualiser les emplois du temps des promotions M1 et M2 de l'ESGT et de l'Université, semaine par semaine.

---

## 🚀 Fonctionnalités

- Affichage des calendriers hebdomadaires pour :
  - ESGT
  - ESGT2
  - UNIV
  - UNIV2
- Vue grille dynamique (15 min d’intervalle, 8h à 18h30)
- Navigation par semaine (suivante, précédente, semaine en cours)
- Actualisation automatique des données via GitHub Actions
- Déclenchement manuel via interface HTML + bouton

---

## 📁 Structure du projet

```text
📦 calendriermosae/
├── 📂 .github/
│   └── 📂 workflows/
│       └── ⚙️ all_events.yml        # Script GitHub Actions principal
├── 📂 data/
│   ├── 📄 esgt_generate-events.yml
│   ├── 📄 esgt_generate-events2.yml
│   ├── 📄 univ_generate-events.yml
│   └── 📄 univ_generate-events2.yml
├── 📂 public/
│   ├── 🖼️ index.html                # Interface utilisateur
│   ├── 📜 script.js                 # Logique JavaScript (déclenchement + UI)
│   └── 🎨 style.css                 # Mise en forme visuelle
├── 📂 scripts/
│   ├── 🐍 esgt_generate_events.py
│   └── 🐍 ... autres scripts Python
└── 📄 README.md

---

## ⚙️ Génération des événements

Les événements sont générés automatiquement via **GitHub Actions** toutes les X heures (ou à la demande via un bouton dans l’interface).  
Les scripts Python lisent des fichiers YAML et produisent des fichiers `.json` utilisés par l’interface.

---

## 🔧 Lancer en local

```bash
# Installer les dépendances Python (dans un venv de préférence)
pip install -r requirements.txt

# Exécuter manuellement la génération
python scripts/esgt_generate_events.py
