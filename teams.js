// ─────────────────────────────────────────────────────────────
// teams.js — Helpers équipes (noms, drapeaux, HTML)
// ─────────────────────────────────────────────────────────────

import { TEAMS, ALIAS } from './data.js';
import { esc } from './utils.js';

/** Normalise une saisie libre vers la clé interne */
export function normalizeTeam(raw) {
  const k = String(raw || '').trim();
  if (TEAMS[k])      return k;
  if (ALIAS[k])      return ALIAS[k];
  // tentative sans espaces
  const compact = k.replace(/ /g, '');
  if (TEAMS[compact]) return compact;
  return k;
}

/** Nom affiché (FR) */
export function teamName(code) {
  return TEAMS[code] ? TEAMS[code][0] : code;
}

/** Trigramme */
export function teamCode(code) {
  return TEAMS[code] ? TEAMS[code][2] : String(code).slice(0, 3).toUpperCase();
}

/** URL drapeau FlagCDN */
export function teamFlagUrl(code) {
  return TEAMS[code] ? `https://flagcdn.com/w40/${TEAMS[code][1]}.png` : '';
}

/** HTML complet : drapeau + trigramme + nom */
export function teamHtml(code) {
  const url  = teamFlagUrl(code);
  const img  = url
    ? `<img src="${url}" alt="${esc(teamCode(code))}" onerror="this.style.display='none'">`
    : '';
  return `<span class="team">${img}<span class="flag-code">${esc(teamCode(code))}</span>${esc(teamName(code))}</span>`;
}
