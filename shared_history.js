// ══════════════════════════════════════════════
// SHARED HISTORY — Le Super Site du Zuc
// Fonctions communes pour l'historique joueurs
// Structure Firebase: /history/{pid}/{archiveId}
// ══════════════════════════════════════════════

const HIST_URL = 'https://prono-2026-515b8-default-rtdb.firebaseio.com/history';

// Lire tout l'historique d'un joueur
async function histGetPlayer(pid) {
  try {
    const r = await fetch(`${HIST_URL}/${pid}.json`, { cache: 'no-store' });
    if (!r.ok) return {};
    const d = await r.json();
    return d || {};
  } catch(e) { return {}; }
}

// Lire tout l'historique (tous joueurs) — pour admin
async function histGetAll() {
  try {
    const r = await fetch(`${HIST_URL}.json`, { cache: 'no-store' });
    if (!r.ok) return {};
    const d = await r.json();
    return d || {};
  } catch(e) { return {}; }
}

// Écrire une archive pour un joueur
// archive = { competition, label, date, rank, totalPlayers, totalScore, pronos, extra }
async function histSaveEntry(pid, archiveId, archive) {
  try {
    const r = await fetch(`${HIST_URL}/${pid}/${archiveId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(archive)
    });
    return r.ok;
  } catch(e) { return false; }
}

// Archiver une compétition pour TOUS les joueurs d'un coup
// entries = [{pid, archive}]
async function histArchiveAll(entries) {
  // PATCH multi-chemins
  const updates = {};
  entries.forEach(({ pid, archiveId, archive }) => {
    updates[`${pid}/${archiveId}`] = archive;
  });
  try {
    const r = await fetch(`${HIST_URL}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return r.ok;
  } catch(e) { return false; }
}
