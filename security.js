// ─────────────────────────────────────────────────────────────
// security.js — Génération et validation des liens joueurs
// ─────────────────────────────────────────────────────────────

/**
 * Génère un token unique pour un joueur
 * Format : base64(playerId:randomSuffix)
 */
export function createPlayerToken(playerId) {
  const suffix = Math.random().toString(36).slice(2, 10);
  return btoa(`${playerId}:${suffix}`);
}

/**
 * Valide un token et retourne le playerId
 * Retourne null si invalide
 */
export function validatePlayerToken(token) {
  try {
    const decoded = atob(token);
    const [pid]   = decoded.split(':');
    return pid || null;
  } catch (_) {
    return null;
  }
}

/**
 * Génère l'URL complète d'accès joueur
 */
export function buildPlayerUrl(token) {
  const base = location.origin + location.pathname;
  return `${base}?p=${encodeURIComponent(token)}`;
}

/**
 * Lit le token depuis l'URL courante
 * Retourne null si absent
 */
export function getTokenFromUrl() {
  return new URLSearchParams(window.location.search).get('p') || null;
}

/**
 * Copie un texte dans le presse-papier
 */
export function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback
  prompt('Copie ce lien :', text);
  return Promise.resolve();
}
