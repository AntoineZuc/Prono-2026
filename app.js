// ─────────────────────────────────────────────────────────────
// app.js — Point d'entrée de l'application
// ─────────────────────────────────────────────────────────────

import { loadState } from './state.js';
import { initRouter } from './router.js';

/**
 * APP — état global partagé entre les modules
 * On passe la référence (objet) pour que les modules puissent
 * mettre à jour app.state après un reset ou import.
 */
const APP = {
  state:    null,  // données persistées
  mode:     null,  // 'admin' | 'player'
  playerId: null,  // id du joueur connecté (mode player uniquement)
};

// Chargement initial
APP.state = loadState();

// Lancement du routeur
initRouter(APP);
