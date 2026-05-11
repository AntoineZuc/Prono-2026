// ─────────────────────────────────────────────────────────────
// knockout.js — Construction et logique du tableau final
// ─────────────────────────────────────────────────────────────

import { teamName } from './teams.js';

// ── Classement d'un groupe ────────────────────────────────────

export function groupStandings(matches, group) {
  const ms = matches.filter(m => m.preloaded && m.wcGroup === group);
  const teamSet = new Set();
  ms.forEach(m => { teamSet.add(m.teamA); teamSet.add(m.teamB); });

  const rows = {};
  teamSet.forEach(t => {
    rows[t] = { team: t, group, played: 0, points: 0, gf: 0, ga: 0, gd: 0 };
  });

  let done = 0;
  ms.forEach(m => {
    if (m.scoreA === null || m.scoreB === null) return;
    done++;
    const a = rows[m.teamA], b = rows[m.teamB];
    a.played++; b.played++;
    a.gf += m.scoreA; a.ga += m.scoreB;
    b.gf += m.scoreB; b.ga += m.scoreA;
    if (m.scoreA > m.scoreB)      { a.points += 3; }
    else if (m.scoreA < m.scoreB) { b.points += 3; }
    else                          { a.points++;  b.points++; }
  });

  const table = Object.values(rows).map(r => ({ ...r, gd: r.gf - r.ga }));
  table.sort((a, b) =>
    b.points - a.points || b.gd - a.gd || b.gf - a.gf ||
    teamName(a.team).localeCompare(teamName(b.team))
  );

  return {
    group,
    complete: done === ms.length && ms.length > 0,
    done,
    total: ms.length,
    table,
  };
}

// ── Qualifiés ─────────────────────────────────────────────────

export function getQualifiers(matches) {
  const groupLetters = 'ABCDEFGHIJKL'.split('');
  const standings = groupLetters.map(g => groupStandings(matches, g));

  if (standings.some(s => !s.complete)) {
    return { ready: false, standings, qualifiers: [] };
  }

  const top2 = standings.flatMap(s =>
    s.table.slice(0, 2).map((r, i) => ({ ...r, rank: i + 1 }))
  );

  const thirds = standings
    .map(s => ({ ...s.table[2], rank: 3 }))
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8);

  const qualifiers = [...top2, ...thirds]
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.rank - b.rank)
    .map((r, i) => ({ ...r, seed: i + 1 }));

  return { ready: qualifiers.length === 32, standings, qualifiers };
}

// ── Gestion des meilleurs 3es ─────────────────────────────────

const THIRD_SLOTS = [
  { winner: 'A', allowed: ['C','E','F','H','I'] },
  { winner: 'B', allowed: ['E','F','G','I','J'] },
  { winner: 'D', allowed: ['B','E','F','I','J'] },
  { winner: 'E', allowed: ['A','B','C','D','F'] },
  { winner: 'G', allowed: ['A','E','H','I','J'] },
  { winner: 'I', allowed: ['C','D','F','G','H'] },
  { winner: 'K', allowed: ['D','E','I','J','L'] },
  { winner: 'L', allowed: ['E','H','I','J','K'] },
];

function assignThirdGroups(thirdGroups) {
  const chosen = [...thirdGroups].sort();
  const slots  = [...THIRD_SLOTS].sort(
    (a, b) =>
      a.allowed.filter(x => chosen.includes(x)).length -
      b.allowed.filter(x => chosen.includes(x)).length
  );

  const out = {};
  function backtrack(i, remaining) {
    if (i >= slots.length) return true;
    const candidates = slots[i].allowed.filter(g => remaining.includes(g));
    for (const c of candidates) {
      out[slots[i].winner] = c;
      if (backtrack(i + 1, remaining.filter(x => x !== c))) return true;
      delete out[slots[i].winner];
    }
    return false;
  }
  backtrack(0, chosen);
  return out;
}

// ── Construction du bracket ───────────────────────────────────

function resolveTeam(code, groupMap, thirdAssignment) {
  if (code[0] === '1' || code[0] === '2') return groupMap[code] || null;
  if (code.startsWith('3slot')) {
    const winnerGroup = code.replace('3slot', '');
    const g = thirdAssignment[winnerGroup];
    return g ? groupMap['3' + g] : null;
  }
  return null;
}

export function koResult(knockout, stage, index) {
  return knockout[`${stage}-${index}`] || { scoreA: null, scoreB: null };
}

function matchWinner(match, knockout) {
  if (!match?.teamA || !match?.teamB) return null;
  const r = koResult(knockout, match.stage, match.index);
  if (r.scoreA === null || r.scoreB === null || r.scoreA === r.scoreB) return null;
  return r.scoreA > r.scoreB ? match.teamA : match.teamB;
}

export function buildKnockout(state) {
  const q = getQualifiers(state.matches);
  if (!q.ready) return { ready: false, q, rounds: [] };

  // Carte groupe/rang → équipe
  const groupMap = {};
  q.standings.forEach(s => {
    if (s.table[0]) groupMap['1' + s.group] = s.table[0].team;
    if (s.table[1]) groupMap['2' + s.group] = s.table[1].team;
    if (s.table[2]) groupMap['3' + s.group] = s.table[2].team;
  });

  const thirdGroups     = q.qualifiers.filter(x => x.rank === 3).map(x => x.group);
  const thirdAssignment = assignThirdGroups(thirdGroups);

  // 16es de finale
  const r32Defs = [
    ['2A','2B'],['1C','2F'],['1E','3slotE'],['1F','2C'],
    ['2E','2I'],['1I','3slotI'],['1A','3slotA'],['1L','3slotL'],
    ['1G','3slotG'],['1D','3slotD'],['1H','2J'],['2K','2L'],
    ['1B','3slotB'],['2D','2G'],['1J','2H'],['1K','3slotK'],
  ];

  const r32 = r32Defs.map(([a, b], i) => ({
    stage: 'r32', index: i, matchNo: 73 + i,
    teamA: resolveTeam(a, groupMap, thirdAssignment),
    teamB: resolveTeam(b, groupMap, thirdAssignment),
  }));

  const r16Pairs = [[0,2],[1,4],[3,5],[6,7],[10,11],[8,9],[14,15],[12,13]];
  const r16 = r16Pairs.map(([x, y], i) => ({
    stage: 'r16', index: i, matchNo: 89 + i,
    teamA: matchWinner(r32[x], state.knockout),
    teamB: matchWinner(r32[y], state.knockout),
  }));

  const qfPairs = [[0,1],[4,5],[2,3],[6,7]];
  const qf = qfPairs.map(([x, y], i) => ({
    stage: 'qf', index: i, matchNo: 97 + i,
    teamA: matchWinner(r16[x], state.knockout),
    teamB: matchWinner(r16[y], state.knockout),
  }));

  const sf = [
    { stage: 'sf', index: 0, matchNo: 101, teamA: matchWinner(qf[0], state.knockout), teamB: matchWinner(qf[1], state.knockout) },
    { stage: 'sf', index: 1, matchNo: 102, teamA: matchWinner(qf[2], state.knockout), teamB: matchWinner(qf[3], state.knockout) },
  ];

  const finale = [{
    stage: 'final', index: 0, matchNo: 104,
    teamA: matchWinner(sf[0], state.knockout),
    teamB: matchWinner(sf[1], state.knockout),
  }];

  return { ready: true, q, rounds: [r32, r16, qf, sf, finale], thirdAssignment };
}

// ── Liste complète des matchs pronostiquables ─────────────────

export function allPredictionMatches(state) {
  const list = [...state.matches];
  const built = buildKnockout(state);

  if (built.ready) {
    const labels = ['16es de finale','8es de finale','Quarts','Demi-finales','Finale'];
    built.rounds.forEach((round, si) => {
      round.forEach(m => {
        if (m.teamA && m.teamB) {
          const r = koResult(state.knockout, m.stage, m.index);
          list.push({
            id:        `ko-${m.stage}-${m.index}`,
            date:      '',
            wcGroup:   labels[si],
            teamA:     m.teamA,
            teamB:     m.teamB,
            scoreA:    r.scoreA,
            scoreB:    r.scoreB,
            preloaded: false,
            knockout:  true,
          });
        }
      });
    });
  }

  return list;
}
