// ══════════════════════════════════════════════
// PARSER CALENDRIER — Le Super Site du Zuc
// Parse du texte brut (copié-collé depuis Flashscore/FIFA)
// et génère des objets match
// ══════════════════════════════════════════════

// Formats reconnus :
// "28/05/2030 21:00 France - Allemagne"
// "28.05.2030 21:00 France vs Allemagne"
// "28/05 21:00 France - Allemagne"       (année déduite)
// "Mer. 28 mai  21:00  France  2-1  Allemagne"  (flashscore avec score)
// "France - Allemagne  28/05  21:00"

function parseCalendar(text, groups, year) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const matches = [];
  const errors = [];
  let matchNo = 1;

  // Groupe lookup: teamCode -> groupId
  const teamToGroup = {};
  if (groups) {
    Object.entries(groups).forEach(([gid, teams]) => {
      (teams || []).forEach(code => { teamToGroup[code] = gid; });
    });
  }

  lines.forEach((line, idx) => {
    // Ignorer les lignes de titre/groupe
    if (/^(groupe|group|poule|pool)\s+[a-z]/i.test(line)) return;
    if (/^(phase|round|journée|matchday|tour)\s/i.test(line)) return;
    if (line.length < 5) return;

    try {
      const m = parseLine(line, year || new Date().getFullYear());
      if (m) {
        // Résoudre les codes équipes
        const codeA = findTeamByName(m.teamA);
        const codeB = findTeamByName(m.teamB);
        if (!codeA) { errors.push({ line: idx + 1, text: line, reason: `Équipe non reconnue: "${m.teamA}"` }); return; }
        if (!codeB) { errors.push({ line: idx + 1, text: line, reason: `Équipe non reconnue: "${m.teamB}"` }); return; }

        // Déduire le groupe
        const grpA = teamToGroup[codeA];
        const grpB = teamToGroup[codeB];
        const wcGroup = grpA || grpB || '?';
        if (grpA && grpB && grpA !== grpB) {
          errors.push({ line: idx + 1, text: line, reason: `${m.teamA} (${grpA}) et ${m.teamB} (${grpB}) ne sont pas dans le même groupe` });
          return;
        }

        matches.push({
          matchNo: matchNo++,
          date: m.date,
          time: m.time,
          teamA: codeA,
          teamB: codeB,
          wcGroup,
          scoreA: m.scoreA ?? null,
          scoreB: m.scoreB ?? null,
          raw: line
        });
      }
    } catch (e) {
      errors.push({ line: idx + 1, text: line, reason: e.message });
    }
  });

  return { matches, errors };
}

function parseLine(line, defaultYear) {
  // Nettoyage
  let s = line
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')
    .trim();

  // Patterns date
  const datePatterns = [
    // 28/05/2030 ou 28.05.2030 ou 28-05-2030
    /(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})/,
    // 28/05 ou 28.05 (sans année)
    /(\d{1,2})[\/\.](\d{1,2})(?![\/\.\d])/,
    // "28 mai" ou "28 May"
    /(\d{1,2})\s+(jan|fév|feb|mar|avr|apr|mai|may|juin|jun|juil|jul|aoû|aug|sep|oct|nov|déc|dec)/i,
  ];

  let date = null, rest = s;

  for (const pat of datePatterns) {
    const m = s.match(pat);
    if (m) {
      if (m[3]) {
        // avec année
        date = `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
      } else if (/[a-z]/i.test(m[2])) {
        // mois en lettres
        const months = {jan:'01',fév:'02',feb:'02',mar:'03',avr:'04',apr:'04',mai:'05',may:'05',juin:'06',jun:'06',juil:'07',jul:'07',aoû:'08',aug:'08',sep:'09',oct:'10',nov:'11',déc:'12',dec:'12'};
        const mo = months[m[2].toLowerCase().slice(0,3)];
        date = `${defaultYear}-${mo}-${m[1].padStart(2,'0')}`;
      } else {
        date = `${defaultYear}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
      }
      rest = s.slice(m.index + m[0].length).trim();
      break;
    }
  }

  if (!date) return null; // pas de date = pas un match

  // Pattern heure
  let time = '21:00';
  const timeMatch = rest.match(/(\d{1,2})[h:](\d{2})/i);
  if (timeMatch) {
    time = `${timeMatch[1].padStart(2,'0')}:${timeMatch[2]}`;
    rest = rest.slice(0, rest.indexOf(timeMatch[0])) + rest.slice(rest.indexOf(timeMatch[0]) + timeMatch[0].length);
    rest = rest.trim();
  }

  // Score éventuel (ex: "France 2-1 Allemagne" ou "2 - 1")
  let scoreA = null, scoreB = null;
  const scoreMatch = rest.match(/(\d+)\s*-\s*(\d+)/);
  if (scoreMatch) {
    // Vérifier que c'est bien un score (nombres petits) et pas une date
    const a = parseInt(scoreMatch[1]), b = parseInt(scoreMatch[2]);
    if (a <= 20 && b <= 20) {
      scoreA = a; scoreB = b;
      rest = rest.slice(0, rest.indexOf(scoreMatch[0])) + '|||' + rest.slice(rest.indexOf(scoreMatch[0]) + scoreMatch[0].length);
    }
  }

  // Séparer les deux équipes
  // Format: "Équipe A - Équipe B", "Équipe A vs Équipe B", "Équipe A ||| Équipe B"
  let teamA = null, teamB = null;
  const sep = rest.match(/(.+?)\s*(?:\s-\s|\svs\.?\s|\|\|\|)\s*(.+)/i);
  if (sep) {
    teamA = cleanTeamName(sep[1]);
    teamB = cleanTeamName(sep[2]);
  }

  if (!teamA || !teamB) return null;

  return { date, time, teamA, teamB, scoreA, scoreB };
}

function cleanTeamName(s) {
  return s
    .replace(/^\s*\d+\s*/, '') // numéro de match en début
    .replace(/\s*\d+\s*$/, '') // numéro en fin
    .replace(/[^\w\sàâäéèêëîïôùûüçæœÀÂÄÉÈÊËÎÏÔÙÛÜÇÆŒ\-']/g, '')
    .trim();
}
