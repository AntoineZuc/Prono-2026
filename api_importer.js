// ══════════════════════════════════════════════
// API IMPORTER — Le Super Site du Zuc
// Importe les matchs depuis football-data.org
// Clé API gratuite sur football-data.org
// ══════════════════════════════════════════════

const FDORG_URL = 'https://api.football-data.org/v4';

// Compétitions disponibles sur le tier gratuit
const FDORG_COMPETITIONS = {
  'CL':  {label:'Ligue des Champions (UEFA)',  stages:['LEAGUE_PHASE','GROUP_STAGE']},
  'EC':  {label:'Euro (UEFA)',                  stages:['GROUP_STAGE','LEAGUE_PHASE']},
  'WC':  {label:'Coupe du Monde (FIFA)',        stages:['GROUP_STAGE','LEAGUE_PHASE']},
  'PL':  {label:'Premier League',               stages:['REGULAR_SEASON']},
  'PD':  {label:'La Liga',                      stages:['REGULAR_SEASON']},
  'BL1': {label:'Bundesliga',                   stages:['REGULAR_SEASON']},
  'SA':  {label:'Serie A',                      stages:['REGULAR_SEASON']},
  'FL1': {label:'Ligue 1',                      stages:['REGULAR_SEASON']},
};

// Clé API — stockée dans Firebase /apiKeys/footballData
async function fdorgGetApiKey(){
  try{
    const r=await fetch('https://prono-2026-515b8-default-rtdb.firebaseio.com/apiKeys/footballData.json',{cache:'no-store'});
    if(!r.ok)return null;
    const d=await r.json();
    return d||null;
  }catch(e){return null;}
}
async function fdorgSaveApiKey(key){
  try{
    const r=await fetch('https://prono-2026-515b8-default-rtdb.firebaseio.com/apiKeys/footballData.json',{
      method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(key)
    });
    return r.ok;
  }catch(e){return false;}
}

// Récupérer les matchs d'une compétition
async function fdorgGetMatches(apiKey, competitionCode, season){
  // season = "2026" pour la saison 2026-27
  const url=`${FDORG_URL}/competitions/${competitionCode}/matches?season=${season}`;
  const r=await fetch(url,{headers:{'X-Auth-Token':apiKey}});
  if(!r.ok){
    const err=await r.json().catch(()=>({}));
    throw new Error(err.message||`Erreur HTTP ${r.status}`);
  }
  return await r.json();
}

// Récupérer les infos de la compétition (équipes, etc.)
async function fdorgGetTeams(apiKey, competitionCode, season){
  const url=`${FDORG_URL}/competitions/${competitionCode}/teams?season=${season}`;
  const r=await fetch(url,{headers:{'X-Auth-Token':apiKey}});
  if(!r.ok)throw new Error(`Erreur HTTP ${r.status}`);
  return await r.json();
}

// Convertir un match football-data → format interne du site
function fdorgConvertMatch(m, teamsMap, idx){
  // Date/heure UTC → Paris (Europe/Paris)
  const utcDate=new Date(m.utcDate);
  const parisDT=new Intl.DateTimeFormat('fr-FR',{
    timeZone:'Europe/Paris',
    year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit'
  }).formatToParts(utcDate);

  const get=type=>parisDT.find(p=>p.type===type)?.value||'';
  const date=`${get('year')}-${get('month')}-${get('day')}`;
  const time=`${get('hour')}:${get('minute')}`;

  // Équipes
  const homeId=m.homeTeam?.id;
  const awayId=m.awayTeam?.id;
  const homeCode=teamsMap[homeId]?.code||m.homeTeam?.tla||String(homeId);
  const awayCode=teamsMap[awayId]?.code||m.awayTeam?.tla||String(awayId);
  const homeName=teamsMap[homeId]?.name||m.homeTeam?.shortName||m.homeTeam?.name||'?';
  const awayName=teamsMap[awayId]?.name||m.awayTeam?.shortName||m.awayTeam?.name||'?';

  // Groupe/journée
  const wcGroup=m.group||m.stage||'?';
  const matchday=m.matchday;

  return{
    id:`${date}-${homeCode}-${awayCode}`.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
    matchNo:idx+1,
    date,
    time,
    wcGroup,
    matchday,
    teamA:homeCode,
    teamB:awayCode,
    teamAName:homeName,
    teamBName:awayName,
    scoreA:null,
    scoreB:null,
    fdorgId:m.id,
    status:m.status,
  };
}

// Filtrer seulement les matchs de phase de groupes/ligue
function fdorgFilterGroupStage(matches, competitionCode){
  const comp=FDORG_COMPETITIONS[competitionCode];
  const stages=comp?.stages||['GROUP_STAGE','LEAGUE_PHASE'];
  return matches.filter(m=>{
    // Garder si le stage correspond
    const s=m.stage||'';
    return stages.some(st=>s===st||s.includes(st.split('_')[0]));
  });
}

// Interface d'import — affichée dans la section setup admin
async function buildApiImportSection(containerId, onImported){
  const el=document.getElementById(containerId);
  if(!el)return;

  const savedKey=await fdorgGetApiKey();

  el.innerHTML=`
    <div style="background:rgba(30,111,255,.1);border:1px solid rgba(30,111,255,.3);border-radius:14px;padding:18px;margin-bottom:16px">
      <div style="font-size:14px;font-weight:800;color:#7eb8ff;margin-bottom:4px">🔄 Import automatique via API</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">
        Récupère les matchs automatiquement depuis <b style="color:rgba(255,255,255,.6)">football-data.org</b> (gratuit).<br>
        Inscription sur <a href="https://www.football-data.org" target="_blank" style="color:#7eb8ff">football-data.org</a> pour obtenir ta clé API.
      </div>

      <!-- Clé API -->
      <div style="margin-bottom:12px">
        <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Clé API football-data.org</label>
        <div style="display:flex;gap:8px">
          <input id="fdApiKey" type="password" placeholder="Colle ta clé API ici…" value="${savedKey||''}" style="flex:1;padding:8px 12px;font-size:13px">
          <button id="fdSaveKey" style="background:rgba(20,196,125,.2);border:1px solid rgba(20,196,125,.4);color:#14c47d;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">💾 Sauver</button>
        </div>
      </div>

      <!-- Compétition + Saison -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Compétition</label>
          <select id="fdCompCode" style="padding:8px 12px;font-size:13px">
            ${Object.entries(FDORG_COMPETITIONS).map(([code,c])=>`<option value="${code}">${c.label}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Saison (année de début)</label>
          <input id="fdSeason" type="number" value="${new Date().getFullYear()}" min="2020" max="2030" style="padding:8px 12px;font-size:13px">
        </div>
      </div>

      <button id="fdImportBtn" style="background:linear-gradient(135deg,#1e6fff,#1455cc);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;padding:10px 20px;width:100%">
        🔄 Importer les matchs depuis l'API
      </button>
      <div id="fdStatus" style="margin-top:10px;font-size:12px;color:var(--muted);text-align:center"></div>
      <div id="fdPreview" style="margin-top:12px"></div>
    </div>`;

  // Sauver clé
  document.getElementById('fdSaveKey')?.addEventListener('click',async()=>{
    const key=document.getElementById('fdApiKey')?.value?.trim();
    if(!key){setFdStatus('Entre ta clé API.');return;}
    setFdStatus('Sauvegarde…');
    const ok=await fdorgSaveApiKey(key);
    setFdStatus(ok?'✅ Clé sauvegardée !':'❌ Erreur de sauvegarde');
  });

  // Importer
  document.getElementById('fdImportBtn')?.addEventListener('click',async()=>{
    const key=document.getElementById('fdApiKey')?.value?.trim();
    const code=document.getElementById('fdCompCode')?.value;
    const season=document.getElementById('fdSeason')?.value;
    if(!key){setFdStatus('❌ Entre ta clé API d\'abord.');return;}
    if(!code||!season){setFdStatus('❌ Choisis une compétition et une saison.');return;}

    setFdStatus('⏳ Connexion à football-data.org…');
    document.getElementById('fdImportBtn').disabled=true;

    try{
      // 1. Récupérer les matchs
      setFdStatus('⏳ Récupération des matchs…');
      const data=await fdorgGetMatches(key,code,season);
      const allMatches=data.matches||[];

      // 2. Filtrer phase de groupes uniquement
      const groupMatches=fdorgFilterGroupStage(allMatches,code);

      if(!groupMatches.length){
        setFdStatus(`⚠️ Aucun match de phase de groupes trouvé. Saison ${season} peut-être pas encore programmée.`);
        document.getElementById('fdImportBtn').disabled=false;
        return;
      }

      // 3. Construire map équipes (id → {code, name})
      setFdStatus('⏳ Récupération des équipes…');
      let teamsMap={};
      try{
        const teamsData=await fdorgGetTeams(key,code,season);
        (teamsData.teams||[]).forEach(t=>{
          // Matcher avec TEAMS_DB si possible
          let dbCode=null;
          if(typeof TEAMS_DB!=='undefined'){
            // Chercher par nom
            const tla=(t.tla||'').toUpperCase();
            const name=t.shortName||t.name||'';
            if(TEAMS_DB[tla])dbCode=tla;
            else{
              const found=typeof findTeamByName!=='undefined'?findTeamByName(name):null;
              if(found)dbCode=found;
            }
          }
          teamsMap[t.id]={
            code:dbCode||t.tla||String(t.id),
            name:t.shortName||t.name||'?',
            iso:dbCode&&typeof TEAMS_DB!=='undefined'&&TEAMS_DB[dbCode]?TEAMS_DB[dbCode][1]:'xx'
          };
        });
      }catch(e){
        // Continue sans les infos équipes détaillées
        setFdStatus('⚠️ Équipes partiellement chargées. Poursuite…');
      }

      // 4. Convertir en format interne
      const converted=groupMatches.map((m,i)=>fdorgConvertMatch(m,teamsMap,i));

      // 5. Afficher preview
      renderFdPreview(converted,teamsMap,code,season,key,data.competition,onImported);
      setFdStatus(`✅ ${converted.length} matchs trouvés — vérifie l'aperçu puis valide.`);

    }catch(e){
      setFdStatus(`❌ Erreur : ${e.message}`);
      document.getElementById('fdImportBtn').disabled=false;
    }
  });

  function setFdStatus(msg){
    const el=document.getElementById('fdStatus');
    if(el)el.textContent=msg;
  }
}

function renderFdPreview(matches, teamsMap, compCode, season, apiKey, compInfo, onImported){
  const el=document.getElementById('fdPreview');
  if(!el)return;

  // Grouper par groupe/journée
  const byGroup={};
  matches.forEach(m=>{
    const g=m.wcGroup||'?';
    if(!byGroup[g])byGroup[g]=[];
    byGroup[g].push(m);
  });

  el.innerHTML=`
    <div style="background:rgba(0,0,0,.2);border-radius:10px;padding:14px;max-height:350px;overflow-y:auto;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.5);margin-bottom:10px">${matches.length} MATCHS — APERÇU</div>
      ${Object.entries(byGroup).slice(0,5).map(([g,ms])=>`
        <div style="margin-bottom:10px">
          <div style="font-size:10px;font-weight:800;color:var(--gold);margin-bottom:4px;text-transform:uppercase">${g}</div>
          ${ms.slice(0,3).map(m=>`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:11px;border-bottom:1px solid rgba(255,255,255,.04)">
              <span style="color:var(--muted);min-width:85px">${m.date} ${m.time}</span>
              ${m.teamAName||m.teamA} <span style="color:var(--muted)">vs</span> ${m.teamBName||m.teamB}
            </div>`).join('')}
          ${ms.length>3?`<div style="font-size:10px;color:var(--muted);padding-top:2px">…+${ms.length-3} matchs</div>`:''}
        </div>`).join('')}
      ${Object.keys(byGroup).length>5?`<div style="font-size:11px;color:var(--muted)">…et ${Object.keys(byGroup).length-5} autres groupes/journées</div>`:''}
    </div>
    <button id="fdConfirmImport" style="background:linear-gradient(135deg,#14c47d,#0a9d65);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;padding:11px 20px;width:100%">
      ✅ Confirmer et créer l'édition
    </button>`;

  document.getElementById('fdConfirmImport')?.addEventListener('click',()=>{
    if(onImported)onImported({
      matches,
      teamsMap,
      compCode,
      season,
      compName:compInfo?.name||`${FDORG_COMPETITIONS[compCode]?.label||compCode} ${season}-${parseInt(season)+1}`,
    });
  });
}
