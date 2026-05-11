// ─────────────────────────────────────────────────────────────
// router.js — Détection du mode Admin / Joueur
// ─────────────────────────────────────────────────────────────

import { getTokenFromUrl, validatePlayerToken } from './security.js';
import { buildAdminShell, renderAdmin } from './render-admin.js';
import { buildPlayerShell, renderPlayer } from './render-player.js';
import { initAdminEvents }  from './events-admin.js';
import { initPlayerEvents } from './events-player.js';

export function initRouter(app) {
  const token = getTokenFromUrl();

  if (token) {
    // ── Mode Joueur ──────────────────────────────────────────
    const playerId = validatePlayerToken(token);
    const player   = app.state.players.find(p => p.id === playerId);

    if (!player) {
      // Token invalide ou joueur supprimé
      document.getElementById('app').innerHTML = `
        <div style="max-width:600px;margin:80px auto;text-align:center;font-family:sans-serif">
          <h2>🔒 Lien invalide</h2>
          <p>Ce lien de joueur n'est plus valide ou a expiré.<br>
          Contacte l'administrateur pour obtenir un nouveau lien.</p>
        </div>`;
      return;
    }

    app.mode     = 'player';
    app.playerId = playerId;

    buildPlayerShell(player);
    renderPlayer(app.state, player);
    initPlayerEvents(app, player);

  } else {
    // ── Mode Admin ───────────────────────────────────────────
    app.mode = 'admin';

    buildAdminShell();
    renderAdmin(app.state);
    initAdminEvents(app);
  }
}
