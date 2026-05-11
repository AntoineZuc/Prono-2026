// ─────────────────────────────────────────────────────────────
// events-admin.js — Gestion des événements Admin
// ─────────────────────────────────────────────────────────────

import { $, uid, toast, required } from './utils.js';
import { normalizeTeam } from './teams.js';
import { saveState, blankState, factoryReset as doFactoryReset, reloadSchedule, normalize } from './state.js';
import { renderAdmin } from './render-admin.js';
import { buildPlayerUrl, createPlayerToken, copyToClipboard } from './security.js';

// ── Référence partagée vers l'état ───────────────────────────
let _state;
let _app;

export function initAdminEvents(appRef) {
  _app   = appRef;
  _state = appRef.state;

  // Événements globaux unifiés
  document.addEventListener('click',  handleClick);
  document.addEventListener('change', handleChange);

  const searchEl = $('matchSearch');
  if (searchEl) searchEl.addEventListener('input', () => renderAdmin(_state));
}

// ── Dispatcher click ─────────────────────────────────────────

function handleClick(e) {
  // Navigation onglets
  const tab = e.target.closest('.tab');
  if (tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    const sec = $(tab.dataset.tab);
    if (sec) sec.classList.add('active');
    return;
  }

  // Actions boutons
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const actions = {
    'factory-reset':    cmdFactoryReset,
    'reset':            cmdReset,
    'add-group':        cmdAddGroup,
    'add-player':       cmdAddPlayer,
    'delete-player':    () => cmdDeletePlayer(btn.dataset.id),
    'delete-visible':   cmdDeleteVisible,
    'delete-all-players': cmdDeleteAllPlayers,
    'copy-link':        () => cmdCopyLink(btn.dataset.id),
    'add-match':        cmdAddMatch,
    'reload-schedule':  cmdReloadSchedule,
    'update-result':    () => cmdUpdateResult(btn.dataset.id),
    'delete-match':     () => cmdDeleteMatch(btn.dataset.id),
    'set-pred':         () => cmdSetPred(btn.dataset.match, btn.dataset.player),
    'set-ko':           () => cmdSetKo(btn.dataset.stage, Number(btn.dataset.index)),
    'export':           cmdExport,
  };

  const fn = actions[btn.dataset.action];
  if (fn) fn();
}

// ── Dispatcher change ─────────────────────────────────────────

function handleChange(e) {
  const x = e.target;
  if (!x.dataset) return;

  if (x.dataset.action === 'toggle-group')
    cmdToggleGroup(x.dataset.player, x.dataset.group, x.checked);

  if (x.dataset.action === 'toggle-paid')
    cmdTogglePaid(x.dataset.player, x.checked);

  if (x.id === 'playersFilter')   renderAdmin(_state);
  if (x.id === 'leaderboardGroup') renderAdmin(_state);
  if (x.id === 'matchGroupFilter') renderAdmin(_state);
  if (x.id === 'predictionGroup')  renderAdmin(_state);
  if (x.id === 'predictionMatch')  renderAdmin(_state);
  if (x.id === 'importFile')       cmdImport(e);
}

// ── Commandes ─────────────────────────────────────────────────

function persist() {
  saveState(_state);
  renderAdmin(_state);
}

function cmdFactoryReset() {
  _state = doFactoryReset();
  _app.state = _state;
  renderAdmin(_state);
  toast('Réinitialisation complète faite');
}

function cmdReset() {
  _state = blankState();
  _app.state = _state;
  persist();
  toast('Remis à zéro');
}

function cmdAddGroup() {
  const el = $('groupName');
  if (!required(el?.value, 'Nom manquant')) return;
  _state.groups.push({ id: uid(), name: el.value.trim(), paidEntry: false });
  el.value = '';
  persist();
  toast('Groupe ajouté');
}

function cmdAddPlayer() {
  const nameEl = $('playerName');
  if (!required(nameEl?.value, 'Nom manquant')) return;

  const gs = [...document.querySelectorAll('.new-player-group:checked')].map(x => x.value);
  if (!gs.length) { toast('Coche au moins un groupe'); return; }

  const name = nameEl.value.trim();
  const existing = _state.players.find(p => p.name.toLowerCase() === name.toLowerCase());

  if (existing) {
    gs.forEach(g => { if (!existing.groupIds.includes(g)) existing.groupIds.push(g); });
  } else {
    _state.players.push({ id: uid(), name, groupIds: gs });
  }

  nameEl.value = '';
  persist();
  toast('Joueur enregistré');
}

function cmdDeletePlayer(pid) {
  _state.players = _state.players.filter(p => p.id !== pid);
  Object.values(_state.predictions).forEach(m => delete m[pid]);
  if (_state.payments.colleagues) delete _state.payments.colleagues[pid];
  persist();
  toast('Joueur supprimé');
}

function cmdDeleteVisible() {
  const gid = $('playersFilter')?.value || 'all';
  const ids  = _state.players
    .filter(p => gid === 'all' || p.groupIds.includes(gid))
    .map(p => p.id);
  ids.forEach(pid => {
    _state.players = _state.players.filter(p => p.id !== pid);
    Object.values(_state.predictions).forEach(m => delete m[pid]);
    if (_state.payments.colleagues) delete _state.payments.colleagues[pid];
  });
  persist();
  toast('Joueurs supprimés');
}

function cmdDeleteAllPlayers() {
  _state.players     = [];
  _state.predictions = {};
  _state.payments    = {};
  persist();
  toast('Tous les joueurs supprimés');
}

function cmdCopyLink(pid) {
  const player = _state.players.find(p => p.id === pid);
  if (!player) return toast('Joueur introuvable');

  // Cherche un token existant ou en crée un
  if (!_state.tokens) _state.tokens = {};
  if (!_state.tokens[pid]) _state.tokens[pid] = createPlayerToken(pid);

  const url = buildPlayerUrl(_state.tokens[pid]);
  copyToClipboard(url)
    .then(() => toast(`Lien copié pour ${player.name}`))
    .catch(()  => toast('Lien généré (voir console)'));
}

function cmdAddMatch() {
  const a = normalizeTeam($('teamA')?.value?.trim() || '');
  const b = normalizeTeam($('teamB')?.value?.trim() || '');
  if (!a || !b) { toast('Deux équipes obligatoires'); return; }

  _state.matches.push({
    id:        uid(),
    date:      $('matchDate')?.value || '',
    wcGroup:   'Perso',
    teamA:     a,
    teamB:     b,
    scoreA:    null,
    scoreB:    null,
    preloaded: false,
  });

  const ta = $('teamA'); if (ta) ta.value = '';
  const tb = $('teamB'); if (tb) tb.value = '';
  persist();
  toast('Match ajouté');
}

function cmdReloadSchedule() {
  _state.matches = reloadSchedule(_state);
  persist();
  toast('Calendrier rechargé');
}

function cmdUpdateResult(id) {
  const m = _state.matches.find(x => x.id === id);
  if (!m) return;
  const ra = $(`ra-${id}`), rb = $(`rb-${id}`);
  m.scoreA = ra?.value === '' ? null : Number(ra.value);
  m.scoreB = rb?.value === '' ? null : Number(rb.value);
  persist();
  toast('Résultat enregistré');
}

function cmdDeleteMatch(id) {
  _state.matches = _state.matches.filter(m => m.id !== id);
  delete _state.predictions[id];
  persist();
  toast('Match supprimé');
}

function cmdSetPred(mid, pid) {
  if (!_state.predictions[mid]) _state.predictions[mid] = {};
  const pa = $(`pa-${mid}-${pid}`), pb = $(`pb-${mid}-${pid}`);
  if (pa?.value === '' || pb?.value === '') {
    delete _state.predictions[mid][pid];
  } else {
    _state.predictions[mid][pid] = { scoreA: Number(pa.value), scoreB: Number(pb.value) };
  }
  persist();
  toast('Prono enregistré');
}

function cmdSetKo(stage, index) {
  const a = $(`koa-${stage}-${index}`), b = $(`kob-${stage}-${index}`);
  _state.knockout[`${stage}-${index}`] = {
    scoreA: a?.value === '' ? null : Number(a.value),
    scoreB: b?.value === '' ? null : Number(b.value),
  };
  persist();
  toast('Tableau final mis à jour');
}

function cmdToggleGroup(pid, gid, checked) {
  const p = _state.players.find(x => x.id === pid);
  if (!p) return;
  if (checked && !p.groupIds.includes(gid)) {
    p.groupIds.push(gid);
  } else if (!checked) {
    if (p.groupIds.length <= 1) { toast('Garde au moins un groupe'); return; }
    p.groupIds = p.groupIds.filter(x => x !== gid);
  }
  persist();
}

function cmdTogglePaid(pid, checked) {
  if (!_state.payments.colleagues) _state.payments.colleagues = {};
  _state.payments.colleagues[pid] = checked;
  persist();
}

function cmdExport() {
  const blob = new Blob([JSON.stringify(_state, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'pronos-cdm-2026.json';
  a.click();
  URL.revokeObjectURL(url);
}

function cmdImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      _state     = normalize(JSON.parse(reader.result));
      _app.state = _state;
      persist();
      toast('Import réussi');
    } catch (_) {
      toast('Fichier invalide');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}
