// ─────────────────────────────────────────────────────────────
// render-common.js — Rendu partagé Admin + Joueur
// ─────────────────────────────────────────────────────────────

import { esc, dateFr } from './utils.js';
import { teamHtml, teamName, teamCode } from './teams.js';
import { KO_STAGES } from './data.js';
import { buildKnockout, koResult, groupStandings } from './knockout.js';
import { buildRanking, groupBadges, calcPoints } from './scoring.js';
import { allPredictionMatches } from './knockout.js';

// ── Classement ───────────────────────────────────────────────

export function renderLeaderboard(state, containerId, groupFilterId) {
  const gid      = document.getElementById(groupFilterId)?.value || 'all';
  const allMatch = allPredictionMatches(state);
  const rows     = buildRanking(state, gid, allMatch);
  const el       = document.getElementById(containerId);
  if (!el) return;

  if (!rows.length) {
    el.innerHTML = '<div class="empty">Aucun joueur.</div>';
    return;
  }

  const medal = i => ['🥇','🥈','🥉'][i] ?? i + 1;
  const paidBadge = (p) => {
    if (!p.groupIds.includes('colleagues')) return '—';
    const paid = state.payments?.colleagues?.[p.id];
    return `<span class="badge ${paid ? 'paid' : 'unpaid'}">${paid ? 'Payé' : 'Non payé'}</span>`;
  };

  el.innerHTML = `
    <table>
      <thead>
        <tr><th>#</th><th>Joueur</th><th>Groupes</th><th>Payé</th>
            <th>Pts</th><th>Exact</th><th>Bon</th><th>Joués</th></tr>
      </thead>
      <tbody>
        ${rows.map((p, i) => `
          <tr>
            <td>${medal(i)}</td>
            <td><b>${esc(p.name)}</b></td>
            <td>${groupBadges(p, state.groups)}</td>
            <td>${paidBadge(p)}</td>
            <td><b>${p.points}</b></td>
            <td>${p.exact}</td>
            <td>${p.good}</td>
            <td>${p.played}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

// ── Résultats saisis ──────────────────────────────────────────

export function renderResults(state, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const done = state.matches.filter(m => m.scoreA !== null && m.scoreB !== null);
  el.innerHTML = done.length
    ? done.map(m => `
        <div class="match">
          <div class="teams">
            ${teamHtml(m.teamA)} ${m.scoreA}–${m.scoreB} ${teamHtml(m.teamB)}
          </div>
        </div>`).join('')
    : '<div class="empty">Aucun résultat.</div>';
}

// ── Tableau final (lecture seule ou éditable) ─────────────────

export function renderKnockout(state, summaryId, bracketId, editable = false) {
  const built = buildKnockout(state);
  const summary = document.getElementById(summaryId);
  const bracket = document.getElementById(bracketId);
  if (!summary || !bracket) return;

  summary.innerHTML = `<div class="grid3">${
    built.q.standings.map(s => `
      <span class="badge ${s.complete ? 'paid' : 'warn'}">
        Groupe ${s.group} ${s.done}/${s.total}
      </span>`).join('')
  }</div>`;

  if (!built.ready) {
    bracket.innerHTML = '<div class="card"><div class="empty">Le tableau final attend que tous les groupes soient terminés.</div></div>';
    return;
  }

  const stageLabels = KO_STAGES.map(s => s[1]);

  bracket.innerHTML = built.rounds.map((round, si) => {
    const stageId = KO_STAGES[si][0];
    const label   = stageLabels[si];

    return `
      <div class="card">
        <h2>${label}</h2>
        <div class="ko-round">
          ${round.map(m => {
            const r        = koResult(state.knockout, m.stage, m.index);
            const disabled = (!m.teamA || !m.teamB) ? 'disabled' : '';
            const teamAHtml = m.teamA
              ? teamHtml(m.teamA)
              : '<span class="muted">À déterminer</span>';
            const teamBHtml = m.teamB
              ? teamHtml(m.teamB)
              : '<span class="muted">À déterminer</span>';

            return `
              <div class="match">
                <div class="teams">
                  <span class="badge info">Match ${m.matchNo || ''}</span>
                  ${teamAHtml} <span class="muted">vs</span> ${teamBHtml}
                </div>
                <div class="score">
                  <input ${disabled} ${editable ? '' : 'readonly'} type="number" min="0"
                    id="koa-${stageId}-${m.index}"
                    value="${r.scoreA == null ? '' : r.scoreA}">
                  <span>-</span>
                  <input ${disabled} ${editable ? '' : 'readonly'} type="number" min="0"
                    id="kob-${stageId}-${m.index}"
                    value="${r.scoreB == null ? '' : r.scoreB}">
                </div>
                ${editable ? `
                  <button ${disabled} class="primary small" type="button"
                    data-action="set-ko"
                    data-stage="${stageId}"
                    data-index="${m.index}">Valider</button>` : ''}
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }).join('');
}

// ── Matchs (lecture seule) ────────────────────────────────────

export function renderMatchesReadOnly(state, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const sorted = [...state.matches].sort((a, b) =>
    (a.date || '9999').localeCompare(b.date || '9999')
  );

  el.innerHTML = sorted.map(m => `
    <div class="match">
      <div class="teams">${teamHtml(m.teamA)} <span class="muted">vs</span> ${teamHtml(m.teamB)}</div>
      <p>${dateFr(m.date)} · Groupe ${esc(m.wcGroup)}</p>
      ${m.scoreA !== null
        ? `<p><b>${m.scoreA} – ${m.scoreB}</b></p>`
        : '<p class="muted">Résultat non encore disponible</p>'}
    </div>`).join('') || '<div class="empty">Aucun match.</div>';
}

// ── Sélecteur de match ────────────────────────────────────────

export function renderMatchSelect(state, selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const cur  = sel.value;
  const list = allPredictionMatches(state);

  sel.innerHTML = '<option value="all">🌍 Tous les matchs</option>' +
    list.map(m => `
      <option value="${m.id}">
        ${teamCode(m.teamA)} ${teamName(m.teamA)} - ${teamCode(m.teamB)} ${teamName(m.teamB)} · ${esc(m.wcGroup)}
      </option>`).join('');

  if (list.some(m => m.id === cur)) sel.value = cur;
}

// ── Bloc prono d'un match pour un joueur spécifique ──────────

export function renderPredBlockForPlayer(state, match, player) {
  const prono = state.predictions[match.id]?.[player.id];
  const pts   = calcPoints(match, prono);

  return `
    <div class="match">
      <div class="teams">
        ${teamHtml(match.teamA)} <span class="muted">vs</span> ${teamHtml(match.teamB)}
      </div>
      <p>${dateFr(match.date)} · ${esc(match.wcGroup)}</p>
      <div class="pred">
        <div>
          <b>${esc(player.name)}</b>
          ${pts !== null ? `<span class="badge">${pts} pt${pts > 1 ? 's' : ''}</span>` : ''}
        </div>
        <input type="number" min="0"
          id="pa-${match.id}-${player.id}"
          value="${prono ? prono.scoreA : ''}"
          placeholder="${esc(teamName(match.teamA))}">
        <input type="number" min="0"
          id="pb-${match.id}-${player.id}"
          value="${prono ? prono.scoreB : ''}"
          placeholder="${esc(teamName(match.teamB))}">
        <button class="primary small" type="button"
          data-action="set-pred"
          data-match="${match.id}"
          data-player="${player.id}">OK</button>
      </div>
    </div>`;
}
