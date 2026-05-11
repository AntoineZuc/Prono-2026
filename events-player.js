// ─────────────────────────────────────────────────────────────
// events-player.js — Gestion des événements Joueur
// ─────────────────────────────────────────────────────────────

import { $, toast } from './utils.js';
import { saveState } from './state.js';
import { renderPlayer } from './render-player.js';

let _state;
let _player;
let _app;

export function initPlayerEvents(appRef, player) {
  _app    = appRef;
  _state  = appRef.state;
  _player = player;

  document.addEventListener('click',  handleClick);
  document.addEventListener('change', handleChange);
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

  if (btn.dataset.action === 'set-pred') {
    cmdSetPred(btn.dataset.match, btn.dataset.player);
  }
}

// ── Dispatcher change ─────────────────────────────────────────

function handleChange(e) {
  const x = e.target;
  if (!x) return;
  if (x.id === 'leaderboardGroup') renderPlayer(_state, _player);
  if (x.id === 'predictionMatch')  renderPlayer(_state, _player);
}

// ── Commandes ─────────────────────────────────────────────────

function persist() {
  saveState(_state);
  renderPlayer(_state, _player);
}

function cmdSetPred(mid, pid) {
  // Sécurité : le joueur ne peut modifier que ses propres pronos
  if (pid !== _player.id) {
    toast('Action non autorisée');
    return;
  }

  if (!_state.predictions[mid]) _state.predictions[mid] = {};
  const pa = $(`pa-${mid}-${pid}`), pb = $(`pb-${mid}-${pid}`);

  if (!pa || !pb || pa.value === '' || pb.value === '') {
    delete _state.predictions[mid][pid];
  } else {
    _state.predictions[mid][pid] = {
      scoreA: Number(pa.value),
      scoreB: Number(pb.value),
    };
  }

  persist();
  toast('Prono enregistré ✅');
}
