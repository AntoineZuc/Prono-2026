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
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <div style="font-size:14px;font-weight:800;color:#7eb8ff">🔄 Import automatique via API</div>
        <button id="fdTutoBtn" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6);border-radius:999px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer">❓ Comment ça marche</button>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">
        Récupère les matchs automatiquement depuis <b style="color:rgba(255,255,255,.6)">football-data.org</b> (gratuit, pas de carte bancaire).
      </div>

      <!-- TUTO INTÉGRÉ (caché par défaut) -->
      <div id="fdTuto" style="display:none;background:rgba(0,0,0,.25);border-radius:10px;padding:14px;margin-bottom:14px;font-size:12px;line-height:1.8;color:rgba(255,255,255,.75)">
        <div style="font-weight:800;color:#7eb8ff;margin-bottom:8px">📖 Guide étape par étape</div>
        <div style="margin-bottom:10px">
          <div style="font-weight:700;color:#fff;margin-bottom:2px">① Obtenir une clé API (une seule fois dans ta vie)</div>
          <div>1. Va sur <a href="https://www.football-data.org/client/register" target="_blank" style="color:#7eb8ff">football-data.org/client/register</a></div>
          <div>2. Remplis juste ton email et un mot de passe</div>
          <div>3. Reçois la clé par email (ça prend 1 minute)</div>
          <div>4. Elle ressemble à : <code style="background:rgba(255,255,255,.1);padding:1px 6px;border-radius:4px;font-size:11px">a1b2c3d4e5f6g7h8...</code></div>
          <div style="color:var(--muted);margin-top:2px">✅ Gratuit pour toujours, couvre CDM, Euro et LDC</div>
        </div>
        <div style="margin-bottom:10px">
          <div style="font-weight:700;color:#fff;margin-bottom:2px">② Coller la clé ici et la sauvegarder</div>
          <div>Colle ta clé dans le champ ci-dessous et clique "💾 Sauver".</div>
          <div>Elle est stockée dans Firebase — tu n'auras plus jamais à la ressaisir.</div>
        </div>
        <div style="margin-bottom:10px">
          <div style="font-weight:700;color:#fff;margin-bottom:2px">③ Choisir la compétition et la saison</div>
          <div>• <b>LDC 2026-27</b> → Ligue des Champions + saison <code style="background:rgba(255,255,255,.1);padding:1px 5px;border-radius:3px">2026</code></div>
          <div>• <b>CDM 2030</b> → Coupe du Monde + saison <code style="background:rgba(255,255,255,.1);padding:1px 5px;border-radius:3px">2030</code></div>
          <div>• <b>Euro 2028</b> → Euro + saison <code style="background:rgba(255,255,255,.1);padding:1px 5px;border-radius:3px">2028</code></div>
          <div style="color:var(--muted);margin-top:2px">⚠️ La saison = l'année où la compétition commence</div>
        </div>
        <div>
          <div style="font-weight:700;color:#fff;margin-bottom:2px">④ Importer et valider</div>
          <div>Clique "🔄 Importer", attends quelques secondes, vérifie l'aperçu et confirme.</div>
          <div>Les matchs apparaissent automatiquement pour les joueurs.</div>
          <div style="color:var(--muted);margin-top:2px">💡 Si l'UEFA reprogramme un match → re-clique "Importer" pour resynchroniser</div>
        </div>
      </div>

      <!-- Clé API -->
      <div style="margin-bottom:12px">
        <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Clé API football-data.org</label>
        <div style="display:flex;gap:8px">
          <input id="fdApiKey" type="password" placeholder="Colle ta clé API ici…" value="${savedKey||''}" style="flex:1;padding:8px 12px;font-size:13px">
          <button id="fdShowKey" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.5);border-radius:8px;padding:8px 10px;font-size:14px;cursor:pointer">👁</button>
          <button id="fdSaveKey" style="background:rgba(20,196,125,.2);border:1px solid rgba(20,196,125,.4);color:#14c47d;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">💾 Sauver</button>
        </div>
        <div id="fdKeyStatus" style="font-size:11px;color:var(--muted);margin-top:4px">${savedKey?'✅ Clé déjà sauvegardée':'Aucune clé enregistrée'}</div>
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
          <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Saison (année début)</label>
          <input id="fdSeason" type="number" value="${new Date().getFullYear()}" min="2020" max="2035" style="padding:8px 12px;font-size:13px">
        </div>
      </div>

      <button id="fdImportBtn" style="background:linear-gradient(135deg,#1e6fff,#1455cc);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;padding:10px 20px;width:100%">
        🔄 Importer les matchs depuis l'API
      </button>
      <div id="fdStatus" style="margin-top:10px;font-size:12px;color:var(--muted);text-align:center"></div>
      <div id="fdPreview" style="margin-top:12px"></div>
    </div>`;

  // Tuto toggle
  document.getElementById('fdTutoBtn')?.addEventListener('click',()=>{
    const t=document.getElementById('fdTuto');
    if(!t)return;
    const open=t.style.display==='none';
    t.style.display=open?'block':'none';
    document.getElementById('fdTutoBtn').textContent=open?'✕ Fermer':'❓ Comment ça marche';
  });

  // Afficher/masquer clé
  document.getElementById('fdShowKey')?.addEventListener('click',()=>{
    const inp=document.getElementById('fdApiKey');
    if(!inp)return;
    inp.type=inp.type==='password'?'text':'password';
  });

  // Sauver clé
  document.getElementById('fdSaveKey')?.addEventListener('click',async()=>{
    const key=document.getElementById('fdApiKey')?.value?.trim();
    const status=document.getElementById('fdKeyStatus');
    if(!key){if(status)status.textContent='Entre ta clé API.';return;}
    if(status)status.textContent='Sauvegarde…';
    const ok=await fdorgSaveApiKey(key);
    if(status)status.textContent=ok?'✅ Clé sauvegardée !':'❌ Erreur de sauvegarde';
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

// ══════════════════════════════════════════════
// SYNCHRONISATION AUTOMATIQUE DES SCORES
// Vérifie les scores toutes les 60s via l'API
// ══════════════════════════════════════════════

let _scoreSyncTimer=null;
let _lastScoreSync=0;
let _syncActive=false;

// Statuts football-data.org
const FDORG_FINISHED=['FINISHED','AWARDED'];
const FDORG_LIVE=['IN_PLAY','PAUSED','HALF_TIME','EXTRA_TIME','PENALTY_SHOOTOUT'];
const FDORG_SCHEDULED=['TIMED','SCHEDULED'];

async function fdorgSyncScores(apiKey, compCode, season, state, onUpdate){
  if(_syncActive)return; // éviter les appels simultanés
  _syncActive=true;
  try{
    const data=await fdorgGetMatches(apiKey,compCode,season);
    const matches=data.matches||[];
    // Filtrer les matchs en cours ou récemment terminés
    const relevant=matches.filter(m=>
      FDORG_LIVE.includes(m.status)||
      FDORG_FINISHED.includes(m.status)
    );
    if(!relevant.length){_syncActive=false;return false;}

    let hasChanges=false;
    const newScores={...state.matchScores||{}};

    relevant.forEach(m=>{
      // Trouver le match dans notre state via fdorgId ou par équipes/date
      const localMatch=state.matches?.find(lm=>
        lm.fdorgId===m.id||
        (lm.teamA===m.homeTeam?.tla&&lm.teamB===m.awayTeam?.tla&&lm.date===new Date(m.utcDate).toISOString().slice(0,10))
      );
      if(!localMatch)return;

      const score=m.score;
      const ft=score?.fullTime;
      const et=score?.extraTime;
      const pen=score?.penalties;

      if(ft&&ft.home!=null&&ft.away!=null){
        const current=newScores[localMatch.id];
        const newScore={
          scoreA:ft.home,
          scoreB:ft.away,
          status:m.status,
          confirmed:FDORG_FINISHED.includes(m.status),
        };
        if(et&&et.home!=null){newScore.scoreAET=et.home;newScore.scoreBET=et.away;}
        if(pen&&pen.home!=null){newScore.penA=pen.home;newScore.penB=pen.away;}

        // Vérifier si c'est différent de ce qu'on a
        if(!current||current.scoreA!==newScore.scoreA||current.scoreB!==newScore.scoreB||
           current.scoreAET!==newScore.scoreAET||current.confirmed!==newScore.confirmed){
          newScores[localMatch.id]=newScore;
          hasChanges=true;
        }
      }
    });

    if(hasChanges){
      // Sauvegarder dans Firebase
      await fetch('https://prono-2026-515b8-default-rtdb.firebaseio.com/state.json',{
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({matchScores:newScores})
      });
      if(onUpdate)onUpdate(newScores);
      _syncActive=false;
      return true;
    }
  }catch(e){
    console.warn('Score sync error:',e.message);
  }
  _syncActive=false;
  return false;
}

// Démarrer la synchro automatique
async function startScoreSync(state, onUpdate){
  if(_scoreSyncTimer)clearInterval(_scoreSyncTimer);

  const apiKey=await fdorgGetApiKey();
  if(!apiKey)return; // pas de clé → pas de synchro auto

  const edition=state.edition;
  if(!edition?.fdorgCompCode||!edition?.fdorgSeason)return; // pas d'édition API

  // Vérifier si des matchs sont en cours ou à venir dans les 2h
  function hasActiveMatches(){
    const now=Date.now();
    return(state.matches||[]).some(m=>{
      const dt=new Date(m.date+'T'+(m.time||'00:00')+':00+02:00').getTime();
      return dt>now-7200000&&dt<now+86400000; // entre -2h et +24h
    });
  }

  // Synchro immédiate si matchs actifs
  if(hasActiveMatches()){
    fdorgSyncScores(apiKey,edition.fdorgCompCode,edition.fdorgSeason,state,onUpdate);
  }

  // Puis toutes les 60s
  _scoreSyncTimer=setInterval(async()=>{
    if(!hasActiveMatches())return; // rien à faire
    const changed=await fdorgSyncScores(apiKey,edition.fdorgCompCode,edition.fdorgSeason,state,onUpdate);
    if(changed)console.log('Scores mis à jour depuis l\'API');
  },60000);

  return _scoreSyncTimer;
}

function stopScoreSync(){
  if(_scoreSyncTimer)clearInterval(_scoreSyncTimer);
  _scoreSyncTimer=null;
}

// Synchro manuelle (bouton admin)
async function syncScoresNow(state, onDone){
  const apiKey=await fdorgGetApiKey();
  if(!apiKey){
    alert('Aucune clé API configurée. Va dans "Nouvelle édition" pour la saisir.');
    return;
  }
  const edition=state.edition;
  if(!edition?.fdorgCompCode){
    alert('Cette édition n\'a pas été importée via l\'API — synchro impossible.');
    return;
  }
  const changed=await fdorgSyncScores(apiKey,edition.fdorgCompCode,edition.fdorgSeason,state,onDone);
  return changed;
}
