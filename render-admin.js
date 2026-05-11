// ─────────────────────────────────────────────────────────────
// render-admin.js — Construction de l'interface Administrateur
// ─────────────────────────────────────────────────────────────

import { esc, dateFr, $ } from './utils.js';
import { teamHtml, teamName, teamCode } from './teams.js';
import { calcPoints, groupBadges } from './scoring.js';
import { allPredictionMatches } from './knockout.js';
import { buildPlayerUrl } from './security.js';
import {
  renderLeaderboard,
  renderResults,
  renderKnockout,
  renderMatchSelect,
  renderPredBlockForPlayer,
} from './render-common.js';

// ── Squelette HTML de l'interface admin ──────────────────────

export function buildAdminShell() {
  document.getElementById('app').innerHTML = `
    <header>
      <div class="hero">
        <div>
          <span class="badge warn">🏆 Coupe du Monde 2026</span>
          <h1>Centre des pronos</h1>
          <p>Mode administrateur · Groupes, joueurs, matchs, pronos, classement.</p>
          <div class="top-actions">
            <button class="danger" type="button" data-action="factory-reset">🔥 Réinitialisation complète</button>
            <span class="badge info" id="jsStatus">Chargement…</span>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><strong id="statPlayers">0</strong><span>joueurs</span></div>
          <div class="stat"><strong id="statGroups">0</strong><span>groupes</span></div>
          <div class="stat"><strong id="statMatches">0</strong><span>matchs</span></div>
        </div>
      </div>
    </header>

    <main>
      <nav class="tabs">
        <button type="button" class="tab active" data-tab="dashboard">🏆 Classement</button>
        <button type="button" class="tab" data-tab="groups">👥 Groupes</button>
        <button type="button" class="tab" data-tab="players">🙋 Joueurs</button>
        <button type="button" class="tab" data-tab="matches">📅 Matchs</button>
        <button type="button" class="tab" data-tab="predictions">✍️ Pronos</button>
        <button type="button" class="tab" data-tab="knockout">🏟️ Tableau final</button>
        <button type="button" class="tab" data-tab="tools">💾 Sauvegarde</button>
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
          <h2>🧾 Résultats saisis</h2>
          <div id="pointsDetail"></div>
        </div>
      </section>

      <!-- GROUPES -->
      <section id="groups" class="section">
        <div class="grid">
          <div class="card">
            <h2>👥 Ajouter un groupe</h2>
            <label for="groupName">Nom</label>
            <input id="groupName" placeholder="Famille, Collègues, Amis…">
            <button class="primary" type="button" data-action="add-group">Ajouter</button>
          </div>
          <div class="card">
            <h2>Groupes existants</h2>
            <div id="groupsList"></div>
          </div>
        </div>
      </section>

      <!-- JOUEURS -->
      <section id="players" class="section">
        <div class="grid">
          <div class="card">
            <h2>🙋 Ajouter un joueur</h2>
            <label for="playerName">Nom</label>
            <input id="playerName" placeholder="Ex : Wilson">
            <label>Groupes</label>
            <div id="playerGroups"></div>
            <button class="primary" type="button" data-action="add-player">Enregistrer</button>
            <p class="muted">Une même personne peut être dans plusieurs groupes. Ses pronos restent uniques.</p>
          </div>
          <div class="card">
            <h2>Liste des joueurs</h2>
            <div class="filters">
              <div>
                <label for="playersFilter">Filtrer par groupe</label>
                <select id="playersFilter"></select>
              </div>
            </div>
            <div class="actions" style="margin-bottom:10px">
              <button class="danger small" type="button" data-action="delete-visible">Supprimer joueurs affichés</button>
              <button class="danger small" type="button" data-action="delete-all-players">Supprimer tous</button>
            </div>
            <div id="playersList"></div>
          </div>
        </div>
      </section>

      <!-- MATCHS -->
      <section id="matches" class="section">
        <div class="grid">
          <div class="card">
            <h2>➕ Ajouter un match</h2>
            <div class="grid3">
              <div><label for="matchDate">Date</label><input type="date" id="matchDate"></div>
              <div><label for="teamA">Équipe A</label><input id="teamA" placeholder="France"></div>
              <div><label for="teamB">Équipe B</label><input id="teamB" placeholder="Brésil"></div>
            </div>
            <button class="primary" type="button" data-action="add-match">Ajouter</button>
          </div>
          <div class="card">
            <h2>📅 Calendrier</h2>
            <p>Le calendrier de groupes est préchargé. Le rechargement conserve tes résultats déjà saisis.</p>
            <button type="button" data-action="reload-schedule">Recharger calendrier</button>
          </div>
        </div>
        <div class="card">
          <h2>⚽ Résultats</h2>
          <div class="filters">
            <div>
              <label for="matchGroupFilter">Groupe</label>
              <select id="matchGroupFilter"></select>
            </div>
            <div>
              <label for="matchSearch">Recherche</label>
              <input id="matchSearch" placeholder="France, Brésil…">
            </div>
          </div>
          <div id="matchesList"></div>
        </div>
      </section>

      <!-- PRONOS -->
      <section id="predictions" class="section">
        <div class="card">
          <h2>✍️ Pronostics</h2>
          <div class="filters">
            <div>
              <label for="predictionGroup">Groupe de joueurs</label>
              <select id="predictionGroup"></select>
            </div>
            <div>
              <label for="predictionMatch">Match</label>
              <select id="predictionMatch"><option value="all">Tous les matchs</option></select>
            </div>
          </div>
          <div id="predictionEditor"></div>
        </div>
      </section>

      <!-- KNOCKOUT -->
      <section id="knockout" class="section">
        <div class="card">
          <h2>🏟️ Tableau final</h2>
          <p>Il se remplit quand les groupes sont terminés. Les vainqueurs avancent quand tu saisis les scores.</p>
          <div id="knockoutSummary"></div>
        </div>
        <div id="knockoutBracket"></div>
      </section>

      <!-- OUTILS -->
      <section id="tools" class="section">
        <div class="grid">
          <div class="card">
            <h2>💾 Sauvegarde</h2>
            <div class="actions">
              <button class="primary" type="button" data-action="export">Exporter</button>
              <label class="file-label" for="importFile">Importer</label>
              <input type="file" id="importFile" accept="application/json" style="display:none">
            </div>
          </div>
          <div class="card">
            <h2>🧨 Reset</h2>
            <div class="actions">
              <button class="danger" type="button" data-action="reset">Tout remettre à zéro</button>
              <button class="danger" type="button" data-action="factory-reset">🔥 Réinitialisation complète</button>
            </div>
            <p class="muted">La réinitialisation complète efface aussi les anciennes sauvegardes du navigateur.</p>
          </div>
        </div>
      </section>
    </main>
    <div id="toast" class="toast"></div>`;
}

// ── Rendu des filtres / selects ──────────────────────────────

export function renderAdminFilters(state) {
  // Helper options groupe
  const groupOptions = (selectedId) =>
    `<option value="all" ${selectedId === 'all' ? 'selected' : ''}>Tous</option>` +
    state.groups.map(g =>
      `<option value="${esc(g.id)}" ${selectedId === g.id ? 'selected' : ''}>${esc(g.name)}</option>`
    ).join('');

  // Selects de groupe communs
  const selectors = ['playersFilter','leaderboardGroup','predictionGroup'];
  selectors.forEach(id => {
    const el = $(id);
    if (el) {
      const cur = el.value || 'all';
      el.innerHTML = groupOptions(cur);
    }
  });

  // Checkboxes joueur → groupes
  const pgEl = $('playerGroups');
  if (pgEl) {
    pgEl.innerHTML = state.groups.map(g =>
      `<label class="check-card">
        <input class="new-player-group" type="checkbox" value="${esc(g.id)}"
          ${g.id === 'colleagues' ? 'checked' : ''}>
        ${esc(g.name)}
      </label>`
    ).join('');
  }

  // Filtre groupe matchs
  const mgEl = $('matchGroupFilter');
  if (mgEl) {
    const cur    = mgEl.value || 'all';
    const wcGrps = ['all', ...new Set(state.matches.map(m => m.wcGroup))];
    mgEl.innerHTML = wcGrps.map(g =>
      `<option value="${esc(g)}" ${g === cur ? 'selected' : ''}>
        ${g === 'all' ? 'Tous' : 'Groupe ' + esc(g)}
      </option>`
    ).join('');
  }
}

// ── Stats header ─────────────────────────────────────────────

export function renderAdminStats(state) {
  const sp = $('statPlayers'); if (sp) sp.textContent = state.players.length;
  const sg = $('statGroups');  if (sg) sg.textContent = state.groups.length;
  const sm = $('statMatches'); if (sm) sm.textContent = state.matches.length;
}

// ── Groupes ───────────────────────────────────────────────────

export function renderAdminGroups(state) {
  const el = $('groupsList');
  if (!el) return;

  el.innerHTML = `
    <table>
      <thead>
        <tr><th>Groupe</th><th>Joueurs</th><th>Payés</th></tr>
      </thead>
      <tbody>
        ${state.groups.map(g => {
          const members = state.players.filter(p => p.groupIds.includes(g.id));
          const paidCount = members.filter(p => state.payments?.colleagues?.[p.id]).length;
          return `
            <tr>
              <td>
                ${esc(g.name)}
                ${g.paidEntry ? '<span class="badge paid">entrée payante</span>' : ''}
              </td>
              <td>${members.length}</td>
              <td>${g.paidEntry ? `${paidCount}/${members.length}` : '—'}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ── Joueurs ───────────────────────────────────────────────────

export function renderAdminPlayers(state) {
  const el  = $('playersList');
  const fEl = $('playersFilter');
  if (!el) return;

  const gid = fEl?.value || 'all';
  const arr = gid === 'all'
    ? state.players
    : state.players.filter(p => p.groupIds.includes(gid));

  if (!arr.length) {
    el.innerHTML = '<div class="empty">Aucun joueur.</div>';
    return;
  }

  el.innerHTML = `
    <table>
      <thead>
        <tr><th>Nom</th><th>Groupes</th><th>Payé</th><th>Lien joueur</th><th></th></tr>
      </thead>
      <tbody>
        ${arr.map(p => {
          const isPaid    = state.payments?.colleagues?.[p.id];
          const inColleag = p.groupIds.includes('colleagues');
          return `
            <tr>
              <td><b>${esc(p.name)}</b></td>
              <td>
                ${state.groups.map(g =>
                  `<label class="check-card">
                    <input type="checkbox"
                      data-action="toggle-group"
                      data-player="${p.id}"
                      data-group="${g.id}"
                      ${p.groupIds.includes(g.id) ? 'checked' : ''}>
                    ${esc(g.name)}
                  </label>`
                ).join('')}
              </td>
              <td>
                ${inColleag
                  ? `<input type="checkbox"
                      data-action="toggle-paid"
                      data-player="${p.id}"
                      ${isPaid ? 'checked' : ''}>`
                  : '—'}
              </td>
              <td>
                <button class="small" type="button"
                  data-action="copy-link"
                  data-id="${p.id}">📋 Copier lien</button>
              </td>
              <td>
                <button class="danger small" type="button"
                  data-action="delete-player"
                  data-id="${p.id}">Supprimer</button>
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ── Matchs éditable ───────────────────────────────────────────

export function renderAdminMatches(state) {
  const el    = $('matchesList');
  const gfEl  = $('matchGroupFilter');
  const srEl  = $('matchSearch');
  if (!el) return;

  const gf = gfEl?.value || 'all';
  const q  = (srEl?.value || '').toLowerCase();

  const arr = state.matches
    .filter(m =>
      (gf === 'all' || m.wcGroup === gf) &&
      (teamName(m.teamA) + ' ' + teamName(m.teamB) + ' ' + m.teamA + ' ' + m.teamB)
        .toLowerCase().includes(q)
    )
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));

  el.innerHTML = arr.map(m => `
    <div class="match">
      <div class="teams">${teamHtml(m.teamA)} <span class="muted">vs</span> ${teamHtml(m.teamB)}</div>
      <p>${dateFr(m.date)} · Groupe ${esc(m.wcGroup)}</p>
      <div class="score">
        <input type="number" min="0" id="ra-${m.id}" value="${m.scoreA == null ? '' : m.scoreA}">
        <span>-</span>
        <input type="number" min="0" id="rb-${m.id}" value="${m.scoreB == null ? '' : m.scoreB}">
      </div>
      <div class="actions">
        <button class="primary small" type="button" data-action="update-result" data-id="${m.id}">Valider</button>
        <button class="danger small"  type="button" data-action="delete-match"  data-id="${m.id}">Supprimer</button>
      </div>
    </div>`).join('') || '<div class="empty">Aucun match.</div>';
}

// ── Pronostics (admin = tous les joueurs) ─────────────────────

export function renderAdminPredictions(state) {
  const editor = $('predictionEditor');
  if (!editor) return;

  const selMatch  = $('predictionMatch');
  const selGroup  = $('predictionGroup');
  const selectedM = selMatch?.value  || 'all';
  const selectedG = selGroup?.value  || 'all';

  const players = selectedG === 'all'
    ? state.players
    : state.players.filter(p => p.groupIds.includes(selectedG));

  if (!players.length) {
    editor.innerHTML = '<div class="empty">Aucun joueur dans ce groupe.</div>';
    return;
  }

  const list = allPredictionMatches(state);

  const matchesToShow = selectedM === 'all'
    ? [...list].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
    : list.filter(m => m.id === selectedM);

  editor.innerHTML = matchesToShow.map(m => `
    <div class="match">
      <div class="teams">
        ${teamHtml(m.teamA)} <span class="muted">vs</span> ${teamHtml(m.teamB)}
      </div>
      <p>${dateFr(m.date)} · ${esc(m.wcGroup)}</p>
      ${players.map(p => {
        const prono = state.predictions[m.id]?.[p.id];
        const pts   = calcPoints(m, prono);
        return `
          <div class="pred">
            <div>
              <b>${esc(p.name)}</b>
              ${groupBadges(p, state.groups)}
              ${pts !== null ? `<span class="badge">${pts} pt${pts > 1 ? 's' : ''}</span>` : ''}
            </div>
            <input type="number" min="0"
              id="pa-${m.id}-${p.id}"
              value="${prono ? prono.scoreA : ''}"
              placeholder="${esc(teamName(m.teamA))}">
            <input type="number" min="0"
              id="pb-${m.id}-${p.id}"
              value="${prono ? prono.scoreB : ''}"
              placeholder="${esc(teamName(m.teamB))}">
            <button class="primary small" type="button"
              data-action="set-pred"
              data-match="${m.id}"
              data-player="${p.id}">OK</button>
          </div>`;
      }).join('')}
    </div>`).join('') || '<div class="empty">Aucun match.</div>';
}

// ── Render global admin ───────────────────────────────────────

export function renderAdmin(state) {
  renderAdminFilters(state);
  renderAdminStats(state);
  renderAdminGroups(state);
  renderAdminPlayers(state);
  renderAdminMatches(state);
  renderMatchSelect(state, 'predictionMatch');
  renderAdminPredictions(state);
  renderLeaderboard(state, 'leaderboard', 'leaderboardGroup');
  renderResults(state, 'pointsDetail');
  renderKnockout(state, 'knockoutSummary', 'knockoutBracket', true);

  const js = $('jsStatus');
  if (js) js.textContent = 'JS chargé ✅';
}
