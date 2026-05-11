// ─────────────────────────────────────────────────────────────
// state.js — Gestion du stockage local
// ─────────────────────────────────────────────────────────────

import { GROUPS_SEED, MATCH_SEED } from './data.js';
import { normalizeTeam } from './teams.js';
import { clone, uid, matchId } from './utils.js';

const STORAGE_KEY = 'worldcup2026pronosv2';

// Anciennes clés à migrer si présentes
const OLD_KEYS = [
  'worldCup2026pronoscleanv1',
  'worldCup2026pronosrebuildv1',
  'worldCup2026Predictionsfinalv1',
  'worldCup2026Predictionsv7',
];

// ── Helpers ──────────────────────────────────────────────────

function seedMatches() {
  return MATCH_SEED.map(([date, group, a, b]) => ({
    id:        matchId(date, group, a, b),
    date,
    wcGroup:   group,
    teamA:     a,
    teamB:     b,
    scoreA:    null,
    scoreB:    null,
    preloaded: true,
  }));
}

export function blankState() {
  return {
    groups:      clone(GROUPS_SEED),
    players:     [],
    matches:     seedMatches(),
    predictions: {},
    payments:    {},
    knockout:    {},
  };
}

// ── Normalisation ─────────────────────────────────────────────

export function normalize(raw) {
  const d = (raw && typeof raw === 'object') ? raw : {};

  // Groupes
  let groups = Array.isArray(d.groups) ? d.groups : [];
  // S'assure que les deux groupes par défaut existent toujours
  if (!groups.some(g => g.id === 'colleagues')) groups.unshift(clone(GROUPS_SEED[0]));
  if (!groups.some(g => g.id === 'family'))     groups.push(clone(GROUPS_SEED[1]));

  // Joueurs
  const players = (Array.isArray(d.players) ? d.players : []).map(p => ({
    id:       String(p.id || uid()),
    name:     String(p.name || 'Sans nom'),
    groupIds: Array.isArray(p.groupIds)
      ? p.groupIds
      : (p.groupId ? [p.groupId] : ['colleagues']),
  }));

  // Matchs
  let matches = Array.isArray(d.matches) && d.matches.length
    ? d.matches
    : seedMatches();
  matches = matches.map(m => ({
    ...m,
    teamA: normalizeTeam(m.teamA),
    teamB: normalizeTeam(m.teamB),
  }));

  return {
    groups,
    players,
    matches,
    predictions: d.predictions || {},
    payments:    d.payments    || {},
    knockout:    d.knockout    || {},
  };
}

// ── Chargement ────────────────────────────────────────────────

export function loadState() {
  // Essaie la clé courante
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (raw) return normalize(raw);
  } catch (_) {}

  // Fallback sur les anciennes clés
  for (const key of OLD_KEYS) {
    try {
      const raw = JSON.parse(localStorage.getItem(key));
      if (raw) return normalize(raw);
    } catch (_) {}
  }

  return blankState();
}

// ── Sauvegarde ────────────────────────────────────────────────

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ── Reset ─────────────────────────────────────────────────────

export function factoryReset() {
  [STORAGE_KEY, ...OLD_KEYS].forEach(k => localStorage.removeItem(k));
  const fresh = blankState();
  saveState(fresh);
  return fresh;
}

// ── Rechargement du calendrier ────────────────────────────────

export function reloadSchedule(state) {
  const oldById = Object.fromEntries(state.matches.map(m => [m.id, m]));
  const base = seedMatches().map(m =>
    oldById[m.id]
      ? { ...m, scoreA: oldById[m.id].scoreA, scoreB: oldById[m.id].scoreB }
      : m
  );
  const custom = state.matches.filter(m => !m.preloaded);
  return [...base, ...custom];
}
