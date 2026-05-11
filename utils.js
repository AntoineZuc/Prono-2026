// ─────────────────────────────────────────────────────────────
// utils.js — Utilitaires génériques
// ─────────────────────────────────────────────────────────────

/** Échappe le HTML pour éviter les injections */
export function esc(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[c]));
}

/** Clonage profond JSON */
export function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

/** Identifiant unique */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Date ISO → format FR */
export function dateFr(d) {
  if (!d) return 'Sans date';
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR');
}

/** Génère un ID de match déterministe */
export function matchId(date, group, teamA, teamB) {
  return `${date}-${group}-${teamA}-${teamB}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/** Affiche un message toast */
let toastTimer;
export function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

/** Raccourci getElementById */
export function $ (id) {
  return document.getElementById(id);
}

/** Valide qu'une valeur est non vide, sinon affiche un toast et renvoie false */
export function required(value, msg) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    toast(msg);
    return false;
  }
  return true;
}
