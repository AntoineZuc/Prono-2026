// Synchronise automatiquement, pour chaque section (l1, cdm, ldc) :
//  - les scores des matchs terminés
//  - les dates/heures des matchs (au cas où un match est reporté/déplacé)
// Tourne côté serveur (GitHub Actions), donc fonctionne même si personne
// n'a le site ouvert. Appelle football-data.org DIRECTEMENT (pas besoin
// du proxy Cloudflare : les requêtes serveur-à-serveur n'ont pas de
// restriction CORS, contrairement aux appels depuis un navigateur).

const FB = 'https://prono-2026-515b8-default-rtdb.firebaseio.com';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const SECTIONS = ['l1', 'cdm', 'ldc'];

if (!API_KEY) {
  console.error('❌ FOOTBALL_DATA_API_KEY manquant (secret GitHub non configuré)');
  process.exit(1);
}

async function fbGet(path) {
  const r = await fetch(`${FB}/${path}.json`, { cache: 'no-store' });
  if (!r.ok) return null;
  return r.json();
}
async function fbSet(path, data) {
  const r = await fetch(`${FB}/${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.ok;
}

async function fdFetch(comp, season) {
  const r = await fetch(`https://api.football-data.org/v4/competitions/${comp}/matches?season=${season}`, {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (!r.ok) {
    console.warn(`  ⚠️ football-data.org a répondu ${r.status} pour ${comp}/${season}`);
    return null;
  }
  return r.json();
}

async function syncSection(section) {
  console.log(`\n── ${section} ──`);
  const edition = await fbGet(`${section}/edition`);
  if (!edition || !edition.fdComp || !edition.season) {
    console.log('  Pas d\'édition configurée avec import football-data.org, on saute.');
    return;
  }

  const data = await fdFetch(edition.fdComp, edition.season);
  if (!data || !data.matches) return;

  const existingMatches = (await fbGet(`${section}/matches`)) || {};
  const existingScores = (await fbGet(`${section}/scores`)) || {};

  let scoresChanged = false;
  let matchesChanged = false;
  const newScores = { ...existingScores };
  const newMatches = { ...existingMatches };

  data.matches.forEach((m) => {
    const id = String(m.id);
    const existing = existingMatches[id];
    if (!existing) return; // on ne touche qu'aux matchs déjà importés, jamais on n'en invente

    // Scores
    if (m.score?.fullTime?.home != null) {
      const s = { scoreA: m.score.fullTime.home, scoreB: m.score.fullTime.away };
      if (!existingScores[id] || existingScores[id].scoreA !== s.scoreA || existingScores[id].scoreB !== s.scoreB) {
        newScores[id] = s;
        scoresChanged = true;
      }
    }

    // Dates / heures (match reporté, déplacé...)
    if (m.utcDate) {
      const dt = new Date(m.utcDate);
      const date = dt.toISOString().slice(0, 10);
      const time = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
      if (existing.date !== date || existing.time !== time) {
        newMatches[id] = { ...existing, date, time, status: m.status || existing.status };
        matchesChanged = true;
      }
    }
  });

  if (scoresChanged) {
    await fbSet(`${section}/scores`, newScores);
    console.log('  ✅ Scores mis à jour');
  } else {
    console.log('  Scores : rien de nouveau');
  }
  if (matchesChanged) {
    await fbSet(`${section}/matches`, newMatches);
    console.log('  ✅ Dates/heures mises à jour');
  } else {
    console.log('  Dates/heures : rien de nouveau');
  }
}

(async () => {
  for (const section of SECTIONS) {
    try {
      await syncSection(section);
    } catch (e) {
      console.error(`  ❌ Erreur sur ${section} :`, e.message);
    }
  }
  console.log('\nTerminé.');
})();
