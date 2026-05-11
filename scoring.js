// ─────────────────────────────────────────────────────────────
// scoring.js — Calcul des points et classement
// ─────────────────────────────────────────────────────────────

import { esc } from './utils.js';

/** Résultat d'un match : 'A' | 'B' | 'N' */
function outcome(a, b) {
  return a > b ? 'A' : a < b ? 'B' : 'N';
}

/**
 * Points pour un prono donné vs score réel
 * 3 = score exact · 1 = bon résultat · 0 = mauvais
 * null = match non joué ou pas de prono
 */
export function calcPoints(match, prono) {
  if (!prono || match.scoreA === null || match.scoreB === null) return null;
  if (prono.scoreA === match.scoreA && prono.scoreB === match.scoreB) return 3;
  return outcome(prono.scoreA, prono.scoreB) === outcome(match.scoreA, match.scoreB) ? 1 : 0;
}

/**
 * Retourne le classement trié des joueurs d'un groupe
 * gid = 'all' | id du groupe
 */
export function buildRanking(state, gid, allMatches) {
  const players = gid === 'all'
    ? state.players
    : state.players.filter(p => p.groupIds.includes(gid));

  return players.map(p => {
    let points = 0, exact = 0, good = 0, played = 0;

    allMatches.forEach(m => {
      const prono = state.predictions[m.id]?.[p.id];
      const v = calcPoints(m, prono);
      if (v !== null) {
        points += v;
        played++;
        if (v === 3) exact++;
        if (v === 1) good++;
      }
    });

    return { ...p, points, exact, good, played };
  }).sort((a, b) =>
    b.points - a.points || b.exact - a.exact || a.name.localeCompare(b.name)
  );
}

/** HTML des badges de groupes d'un joueur */
export function groupBadges(player, groups) {
  return player.groupIds
    .map(gid => {
      const g = groups.find(x => x.id === gid);
      return g ? `<span class="badge paid">${esc(g.name)}</span>` : '';
    })
    .join('');
}
