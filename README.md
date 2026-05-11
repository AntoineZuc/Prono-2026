# 🏆 Pronos Coupe du Monde 2026

Application de pronostics pour la Coupe du Monde 2026.  
100% front-end · Stockage local · Pas de dépendances · ES Modules natifs.

---

## 📁 Structure des fichiers

```
/
├── index.html              ← Point d'entrée minimal
├── css/
│   └── style.css           ← Tous les styles
└── js/
    ├── app.js              ← Initialisation + état global
    ├── router.js           ← Détection Admin / Joueur
    ├── state.js            ← Chargement, sauvegarde, normalisation
    ├── data.js             ← Équipes, alias, calendrier, phases KO
    ├── utils.js            ← Utilitaires génériques (uid, esc, toast…)
    ├── teams.js            ← Helpers équipes (noms, drapeaux, HTML)
    ├── scoring.js          ← Calcul des points et classement
    ├── knockout.js         ← Construction du tableau final
    ├── security.js         ← Génération et validation des liens joueurs
    ├── render-admin.js     ← Interface administrateur complète
    ├── render-player.js    ← Interface joueur (accès restreint)
    ├── render-common.js    ← Composants partagés (classement, KO…)
    ├── events-admin.js     ← Événements et actions admin
    └── events-player.js    ← Événements et actions joueur
```

---

## 🚀 Lancement

L'application utilise des **ES Modules natifs** → elle ne peut PAS être ouverte directement en `file://`.

### Option 1 — VS Code + Live Server
1. Ouvre le dossier dans VS Code
2. Installe l'extension **Live Server**
3. Clic droit sur `index.html` → **Open with Live Server**

### Option 2 — Node.js (npx)
```bash
cd /ton/dossier
npx serve .
# Ouvre http://localhost:3000
```

### Option 3 — Python
```bash
python3 -m http.server 8080
# Ouvre http://localhost:8080
```

---

## 👤 Accès Admin vs Joueur

### Mode Admin
Accès direct à l'URL sans paramètre :
```
https://tonsite.com/
```
L'admin voit tous les onglets, gère les joueurs, matchs, résultats.

### Mode Joueur
Chaque joueur reçoit un lien unique généré depuis l'onglet **Joueurs** :
```
https://tonsite.com/?p=TOKEN_UNIQUE
```
Le joueur voit :
- 🏆 Classement (tous les joueurs, sans voir les pronos des autres)
- 📅 Matchs (lecture seule)
- ✍️ Ses propres pronos (saisie uniquement pour lui)
- 🏟️ Tableau final (lecture seule)

---

## 🔐 Système de liens joueurs

1. L'admin crée un joueur
2. Dans la liste des joueurs → bouton **📋 Copier lien**
3. Le lien est copié dans le presse-papier
4. L'admin l'envoie au joueur (WhatsApp, email, etc.)

Le token est stocké dans `state.tokens[playerId]` et persisté en localStorage.

---

## 🗃️ Stockage

- **Clé localStorage** : `worldcup2026pronosv2`
- **Migration automatique** depuis les anciennes clés v1
- **Export/Import** JSON disponible dans l'onglet Sauvegarde (admin uniquement)

---

## 📐 Règles de scoring

| Résultat | Points |
|----------|--------|
| Score exact | 3 pts |
| Bon résultat (V/N/D correct) | 1 pt |
| Mauvais résultat | 0 pt |

---

## 🔧 Ajouter une fonctionnalité

| Besoin | Fichier à modifier |
|--------|-------------------|
| Nouvelle équipe | `js/data.js` → `TEAMS` |
| Nouveau match | `js/data.js` → `MATCH_SEED` |
| Changer le scoring | `js/scoring.js` → `calcPoints()` |
| Modifier l'UI admin | `js/render-admin.js` |
| Modifier l'UI joueur | `js/render-player.js` |
| Nouvelle action admin | `js/events-admin.js` |
| Nouvelle action joueur | `js/events-player.js` |
| Modifier la logique KO | `js/knockout.js` |
