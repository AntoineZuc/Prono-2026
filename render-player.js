// ─────────────────────────────────────────────────────────────
// render-player.js — Interface joueur (même UI, accès restreint)
// ─────────────────────────────────────────────────────────────

import { esc, $ } from './utils.js';
import { allPredictionMatches } from './knockout.js';
import {
  renderLeaderboard,
  renderResults,
  renderKnockout,
  renderMatchSelect,
  renderMatchesReadOnly,
  renderPredBlockForPlayer,
} from './render-common.js';

// ── Squelette HTML (même structure que l'admin, onglets filtrés) ──

export function buildPlayerShell(player) {
  document.getElementById('app').innerHTML = `
    <header>
      <div class="hero">
        <div>
          <span class="badge warn">🏆 Coupe du Monde 2026</span>
          <h1>Mes pronos</h1>
          <div class="player-banner">
            <span>👤</span>
            <div>
              <strong>${esc(player.name)}</strong>
              <div class="sub">
                ${player.groupIds.map(g => `<span>${esc(g)}</span>`).join(' · ')}
              </div>
            </div>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><strong id="statPoints">0</strong><span>points</span></div>
          <div class="stat"><strong id="statExact">0</strong><span>exacts</span></div>
          <div class="stat"><strong id="statPlayed">0</strong><span>joués</span></div>
        </div>
      </div>
    </header>

    <main>
      <nav class="tabs">
        <button type="button" class="tab active" data-tab="dashboard">🏆 Classement</button>
        <!-- Onglets Groupes, Joueurs, Sauvegarde masqués côté joueur -->
        <button type="button" class="tab" data-tab="matches">📅 Matchs</button>
        <button type="button" class="tab" data-tab="predictions">✍️ Mes pronos</button>
        <button type="button" class="tab" data-tab="knockout">🏟️ Tableau final</button>
      </nav>

      <!-- CLASSEMENT -->
      <section id="dashboard" class="section active">
        <div class="card">
          <h2>🏆 Classement</h2>
          <div class="filters">
            <div>
              <label for="leaderboardGroup">Groupe</label>
              <select id="leaderboardGroup"></select>
            </div>
            <div>
              <label>Règle</label>
              <input disabled value="3 exact · 1 bon résultat · 0 mauvais">
            </div>
          </div>
          <div id="leaderboard"></div>
        </div>
        <div class="card">
          <h2>🧾 Résultats</h2>
          <div id="pointsDetail"></div>
        </div>
      </section>

      <!-- MATCHS (lecture seule) -->
      <section id="matches" class="section">
        <div class="card">
          <h2>📅 Calendrier des matchs</h2>
          <div id="matchesReadOnly"></div>
        </div>
      </section>

      <!-- PRONOS DU JOUEUR UNIQUEMENT -->
      <section id="predictions" class="section">
        <div class="card">
          <h2>✍️ Mes pronostics</h2>
          <div class="filters">
            <div>
              <label for="predictionMatch">Match</label>
              <select id="predictionMatch"><option value="all">Tous les matchs</option></select>
            </div>
          </div>
          <div id="predictionEditor"></div>
        </div>
      </section>

      <!-- TABLEAU FINAL (lecture seule) -->
      <section id="knockout" class="section">
        <div class="card">
          <h2>🏟️ Tableau final</h2>
          <div id="knockoutSummary"></div>
        </div>
        <div id="knockoutBracket"></div>
      </section>
    </main>

    <div id="toast" class="toast"></div>`;
}

// ── Stats mini joueur ─────────────────────────────────────────

export function renderPlayerStats(state, player) {
  const allMatch = allPredictionMatches(state);
  let points = 0, exact = 0, played = 0;

  allMatch.forEach(m => {
    const prono = state.predictions[m.id]?.[player.id];
    if (!prono || m.scoreA === null) return;
    played++;
    const pa = prono.scoreA, pb = prono.scoreB;
    if (pa === m.scoreA && pb === m.scoreB) { points += 3; exact++; }
    else if (Math.sign(pa - pb) === Math.sign(m.scoreA - m.scoreB)) points += 1;
  });

  const sp = $('statPoints'); if (sp) sp.textContent = points;
  const se = $('statExact');  if (se) se.textContent = exact;
  const sl = $('statPlayed'); if (sl) sl.textContent = played;
}

// ── Filtre groupe pour le classement ─────────────────────────

function renderPlayerLeaderboardFilter(state) {
  const el = $('leaderboardGroup');
  if (!el) return;
  const cur = el.value || 'all';
  el.innerHTML =
    `<option value="all" ${cur === 'all' ? 'selected' : ''}>Tous</option>` +
    state.groups.map(g =>
      `<option value="${esc(g.id)}" ${cur === g.id ? 'selected' : ''}>${esc(g.name)}</option>`
    ).join('');
}

// ── Pronos joueur ─────────────────────────────────────────────

export function renderPlayerPredictions(state, player) {
  const editor = $('predictionEditor');
  if (!editor) return;

  const selMatch = $('predictionMatch');
  const selected = selMatch?.value || 'all';
  const list     = allPredictionMatches(state);

  const matchesToShow = selected === 'all'
    ? [...list].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
    : list.filter(m => m.id === selected);

  editor.innerHTML = matchesToShow
    .map(m => renderPredBlockForPlayer(state, m, player))
    .join('') || '<div class="empty">Aucun match.</div>';
}

// ── Render global joueur ──────────────────────────────────────

export function renderPlayer(state, player) {
  renderPlayerLeaderboardFilter(state);
  renderPlayerStats(state, player);
  renderLeaderboard(state, 'leaderboard', 'leaderboardGroup');
  renderResults(state, 'pointsDetail');
  renderMatchesReadOnly(state, 'matchesReadOnly');
  renderMatchSelect(state, 'predictionMatch');
  renderPlayerPredictions(state, player);
  renderKnockout(state, 'knockoutSummary', 'knockoutBracket', false); // lecture seule
}
