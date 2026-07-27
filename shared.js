// Partagé entre toutes les compétitions
const STORAGE_KEY='cdm2026v7';
const ADMIN_PWD='admin'; // Mot de passe admin par défaut

// ══════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const dateFr=d=>{if(!d)return'';try{return new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}catch{return d}};
let _tt;
const toast=msg=>{const el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(_tt);_tt=setTimeout(()=>el.classList.remove('show'),2200)};
const $=id=>document.getElementById(id);

// ══════════════════════════════════════════════
// TEAMS
// ══════════════════════════════════════════════
const teamName=c=>TEAMS[c]?TEAMS[c][0]:String(c||'?');
const teamFlag=c=>TEAMS[c]?`https://flagcdn.com/w40/${TEAMS[c][1]}.png`:'';
function teamHtml(code){
  const url=teamFlag(code);
  const img=url?`<img src="${url}" alt="" loading="lazy" onerror="this.style.display='none'">`:'';
  return`<span class="team">${img}<span>${esc(teamName(code))}</span></span>`;
}

// ══════════════════════════════════════════════
// SECURITY — Système login pseudo + mot de passe
// ══════════════════════════════════════════════
function hashPwd(pwd){
  let h=0;for(let i=0;i<pwd.length;i++){h=Math.imul(31,h)+pwd.charCodeAt(i)|0;}
  return h.toString(36);
}
function generatePwd(name){
  // Prenom avec majuscule + 6 chiffres aléatoires
  const first=name.trim().charAt(0).toUpperCase()+name.trim().slice(1).toLowerCase();
  const digits=String(Math.floor(100000+Math.random()*900000));
  return first+digits;
}
function getSession(){
  try{const s=sessionStorage.getItem('cdm2026session');return s?JSON.parse(s):null;}catch{return null;}
}
function setSession(data){
  try{sessionStorage.setItem('cdm2026session',JSON.stringify(data));}catch{}
}
function clearSession(){
  try{sessionStorage.removeItem('cdm2026session');}catch{}
}
async function copyText(text){
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true}}catch{}
  try{const t=document.createElement('textarea');t.value=text;t.style.cssText='position:fixed;top:-9999px';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');document.body.removeChild(t);return ok}catch{return false}
}

// ══════════════════════════════════════════════
// JSONBIN — stockage en ligne
// ══════════════════════════════════════════════
// Firebase Realtime Database
const FB_URL='https://prono-2026-515b8-default-rtdb.firebaseio.com';

// Compression des pronos (90chars -> 3chars)
function encodePred(p){
  if(!p||p.scoreA==null||p.scoreB==null)return'';
  let s=p.scoreA+','+p.scoreB;
  if(p.scoreAET!=null)s+=','+p.scoreAET+','+p.scoreBET;
  if(p.penA!=null)s+=','+p.penA+','+p.penB;
  return s;
}
function decodePred(s){
  if(!s)return null;
  const p=s.split(',').map(Number);
  return{scoreA:p[0],scoreB:p[1],
    scoreAET:p[2]!=null&&!isNaN(p[2])?p[2]:null,
    scoreBET:p[3]!=null&&!isNaN(p[3])?p[3]:null,
    penA:p[4]!=null&&!isNaN(p[4])?p[4]:null,
    penB:p[5]!=null&&!isNaN(p[5])?p[5]:null};
}
function compressPreds(preds){
  const r={};
  for(const[mid,byPlayer] of Object.entries(preds||{})){
    const mp={};
    for(const[pid,prono] of Object.entries(byPlayer||{})){
      const enc=encodePred(prono);if(enc)mp[pid]=enc;
    }
    if(Object.keys(mp).length)r[mid]=mp;
  }
  return r;
}
// Suivi des pronos modifiés localement (mid|pid) depuis le dernier envoi à Firebase.
// Seules ces entrées précises sont renvoyées — jamais tout l'arbre local, qui peut
// contenir des copies figées (anciennes) des pronos d'autres joueurs.
let _dirtyPreds=new Set();
function markPredDirty(mid,pid){_dirtyPreds.add(mid+'|'+pid);}
function decompressPreds(compressed){
  const r={};
  for(const[mid,byPlayer] of Object.entries(compressed||{})){
    r[mid]={};
    for(const[pid,enc] of Object.entries(byPlayer||{})){
      const dec=decodePred(enc);if(dec)r[mid][pid]=dec;
    }
  }
  return r;
}

// Firebase REST API - BIN1 = state principal
async function jbGet(){
  try{
    const r=await fetch(FB_URL+'/state.json');
    if(!r.ok)return null;
    const d=await r.json();
    return d;
  }catch{return null}
}
async function jbSet(toSave){
  try{
    const r=await fetch(FB_URL+'/state.json',{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(toSave)
    });
    return r.ok;
  }catch{return false}
}
// Firebase REST API - BIN2 = predictions compressées
async function jbGetPreds(){
  try{
    const r=await fetch(FB_URL+'/predictions.json');
    if(!r.ok)return null;
    const d=await r.json();
    if(!d)return null;
    return{predictions:decompressPreds(d)};
  }catch{return null}
}
async function jbSetPreds(preds,dirtyKeys){
  try{
    if(dirtyKeys){
      // Mode ciblé: mise à jour multi-chemins Firebase en UNE seule requête.
      // Chaque clé "{mid}/{pid}" pointe précisément sur l'entrée modifiée,
      // sans toucher aux autres joueurs ni aux autres matchs — même pour
      // "Valider tous" (jusqu'à 72 entrées en une seule fois, pas de rafale).
      const updates={};
      dirtyKeys.forEach(key=>{
        const sep=key.indexOf('|');const mid=key.slice(0,sep),pid=key.slice(sep+1);
        const prono=preds?.[mid]?.[pid];
        const enc=encodePred(prono);
        if(enc)updates[mid+'/'+pid]=enc;
      });
      if(Object.keys(updates).length===0)return true;
      const r=await fetch(FB_URL+'/predictions.json',{
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(updates)
      });
      return r.ok;
    }
    // Mode legacy (saveStateSync): PATCH par match avec tout le compressé fourni
    const compressed=compressPreds(preds);
    const results=await Promise.all(Object.entries(compressed).map(([mid,byPlayer])=>
      fetch(FB_URL+'/predictions/'+mid+'.json',{
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(byPlayer)
      }).then(r=>r.ok).catch(()=>false)
    ));
    return results.every(Boolean);
  }catch{return false}
}

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
function seedMatches(){
  return MATCH_SEED.map(([date,time,group,a,b],i)=>({
    id:`${date}-${group}-${a}-${b}`.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
    matchNo:i+1,
    date,time,wcGroup:group,teamA:a,teamB:b,scoreA:null,scoreB:null,preloaded:true
  }));
}
function normalize(raw){
  const d=(raw&&typeof raw==='object')?raw:{};
  let groups=Array.isArray(d.groups)?d.groups:[];
  groups=groups.map(g=>({id:g.id||uid(),name:g.name||'?',paid:!!g.paid}));
  const players=(Array.isArray(d.players)?d.players:[]).map(p=>({
    id:String(p.id||uid()),name:String(p.name||'?'),
    groupIds:Array.isArray(p.groupIds)?p.groupIds:[],
    pwdHash:p.pwdHash||null,
    pwdClear:p.pwdClear||null,
    pwdChanged:!!p.pwdChanged,
    pwdAdmin:p.pwdAdmin||null,
    favoriteTeam:p.favoriteTeam||null,
    easterEggDone:!!p.easterEggDone,
    easterEggPts:p.easterEggPts||0
  }));
  // Reconstituer matchs depuis seed + scores sauvegardés
  const scores=d.matchScores||{};
  // Compat ancienne version
  if(Array.isArray(d.matches)){d.matches.forEach(m=>{if(m.scoreA!==null||m.scoreB!==null)scores[m.id]={scoreA:m.scoreA,scoreB:m.scoreB};});}
  const matches=seedMatches().map(m=>({...m,scoreA:scores[m.id]?.scoreA??null,scoreB:scores[m.id]?.scoreB??null}));
  return{groups,players,matches,predictions:d.predictions||{},knockout:d.knockout||{},payments:d.payments||{},tokens:d.tokens||{},matchScores:scores,specialMatch:d.specialMatch?{...d.specialMatch,scorersA:d.specialMatch.scorersA||[],scorersB:d.specialMatch.scorersB||[],et90done:!!d.specialMatch.et90done,etDone:!!d.specialMatch.etDone}:null,specialPronos:d.specialPronos||{},groupOverrides:d.groupOverrides||{},adminPwd:d.adminPwd||'admin'};
}
function mergePredictions(remote,local){
  const out={};
  const mids=new Set([...Object.keys(remote||{}),...Object.keys(local||{})]);
  mids.forEach(mid=>{out[mid]={...(remote?.[mid]||{}),...(local?.[mid]||{})};});
  return out;
}
async function loadState(){
  // 1. localStorage d'abord (instantané)
  try{
    const local=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(local&&(local.players||local.groups)){
      // Sync BIN1+BIN2 en arrière-plan
      Promise.all([jbGet(),jbGetPreds()]).then(([remote,preds])=>{
        if(remote&&(remote.players||remote.groups)){
          remote.predictions=mergePredictions(preds?.predictions,local.predictions);
          const merged=normalize(remote);
          localStorage.setItem(STORAGE_KEY,JSON.stringify(merged));
        }
      }).catch(()=>{});
      return normalize(local);
    }
  }catch{}
  // 2. Pas de cache local: charger BIN1+BIN2 en parallèle
  const [remote,preds]=await Promise.all([jbGet(),jbGetPreds()]);
  if(remote&&(remote.players||remote.groups)){
    if(preds&&preds.predictions)remote.predictions=preds.predictions;
    return normalize(remote);
  }
  return normalize({});
}
function saveState(st){
  _koCache=null;_koCacheKey=null;_gsCache={}; // Invalider caches
  localStorage.setItem(STORAGE_KEY,JSON.stringify(st));
    _lastSave=Date.now();
  const matchScores={};
  st.matches.forEach(m=>{if(m.scoreA!==null||m.scoreB!==null)matchScores[m.id]={scoreA:m.scoreA,scoreB:m.scoreB};});
  const toSave={groups:st.groups,players:st.players,knockout:st.knockout,payments:st.payments||{},tokens:st.tokens||{},matchScores,specialMatch:st.specialMatch||null,specialPronos:st.specialPronos||{},groupOverrides:st.groupOverrides||{},adminPwd:st.adminPwd||undefined};
  jbSet(toSave).catch(()=>{});
  if(_dirtyPreds.size>0){
    const dirty=_dirtyPreds;_dirtyPreds=new Set();
    jbSetPreds(st.predictions,dirty).catch(()=>{});
  }
}
async function saveStateSync(st){
  // Attend jsonbin (pour copy-link et add-player)
  localStorage.setItem(STORAGE_KEY,JSON.stringify(st));
  _lastSave=Date.now();
  const matchScores={};
  st.matches.forEach(m=>{if(m.scoreA!==null||m.scoreB!==null)matchScores[m.id]={scoreA:m.scoreA,scoreB:m.scoreB};});
  const toSave={groups:st.groups,players:st.players,knockout:st.knockout,payments:st.payments||{},tokens:st.tokens||{},matchScores,specialMatch:st.specialMatch||null,specialPronos:st.specialPronos||{},groupOverrides:st.groupOverrides||{},adminPwd:st.adminPwd||undefined};
  // Merger avec données existantes pour ne pas écraser les pronos des autres
  const existing=await jbGet()||{};
  const mergedPreds={};
  Object.keys(existing.predictions||{}).forEach(mid=>{mergedPreds[mid]={...(existing.predictions[mid]||{})};});
  Object.keys(toSave.predictions||{}).forEach(mid=>{
    if(!mergedPreds[mid])mergedPreds[mid]={};
    Object.keys(toSave.predictions[mid]||{}).forEach(pid=>{mergedPreds[mid][pid]=toSave.predictions[mid][pid];});
  });
  toSave.predictions=mergedPreds;
  toSave.tokens={...(existing.tokens||{}),...toSave.tokens};
  toSave.knockout={...(existing.knockout||{}),...toSave.knockout};
  toSave.matchScores={...(existing.matchScores||{}),...toSave.matchScores};
  await Promise.all([
    jbSet(toSave),
    Object.keys(mergedPreds).length>0?jbSetPreds(mergedPreds):Promise.resolve()
  ]);
  // Mettre à jour l'état local avec le merge
  st.predictions=mergedPreds;
  return st;
}
function factoryReset(){
  localStorage.removeItem(STORAGE_KEY);
  const f=normalize({});
  saveState(f);
  return f;
}

// Polling
let _pollTimer=null,_lastSave=0;
function startPolling(app,onUpdate){
  if(_pollTimer)clearInterval(_pollTimer);
  _pollTimer=setInterval(async()=>{
    if(Date.now()-_lastSave<8000)return;
    const [remote,preds]=await Promise.all([jbGet(),jbGetPreds()]);
    if(!remote)return;
    if(preds&&preds.predictions)remote.predictions={...remote.predictions,...preds.predictions};
    const merged=normalize(remote);
    // Conserver groups et players locaux (l'admin les gère)
    // MAIS prendre specialMatch/specialPronos depuis remote (l'admin les met à jour)
    // Pour l'admin: garder ses groups/players locaux
    // Pour le joueur: prendre players depuis remote (mise à jour par admin)
    const isAdmin=getSession()?.role==='admin';
    if(isAdmin){
      // Garder les groupes locaux mais MERGER les players avec remote
      // pour avoir favoriteTeam et autres updates des joueurs
      merged.groups=app.state.groups;
      // Merger players: prendre remote comme base, mais garder groupIds locaux
      const localPlayers=app.state.players;
      merged.players=merged.players.map(rp=>{
        const lp=localPlayers.find(x=>x.id===rp.id);
        return lp?{...rp,groupIds:lp.groupIds}:rp;
      });
      // Ajouter les joueurs locaux qui ne sont pas encore dans remote
      localPlayers.forEach(lp=>{
        if(!merged.players.find(x=>x.id===lp.id))merged.players.push(lp);
      });
    }
    // specialMatch toujours depuis remote
    // specialMatch vient toujours de remote (mis à jour par l'admin)
    // Conserver pronos locaux
    const lp=app.state.predictions||{};
    const rp=merged.predictions||{};
    Object.keys(lp).forEach(mid=>{
      Object.keys(lp[mid]||{}).forEach(pid=>{
        if(lp[mid][pid]!=null){if(!rp[mid])rp[mid]={};rp[mid][pid]=lp[mid][pid];}
      });
    });
    merged.predictions=rp;
    // Fusionner specialPronos locaux
    const lsp=app.state.specialPronos||{};
    const rsp=merged.specialPronos||{};
    Object.keys(lsp).forEach(pid=>{if(lsp[pid])rsp[pid]=lsp[pid];});
    merged.specialPronos=rsp;
    if(JSON.stringify(app.state)!==JSON.stringify(merged)){
      app.state=merged;
      // Ne pas re-render si l'admin est en train de remplir un formulaire
      const focused=document.activeElement;
      const isTyping=focused&&(focused.tagName==='INPUT'||focused.tagName==='TEXTAREA'||focused.tagName==='SELECT');
      const inAdminForm=isTyping&&(
        focused.id==='smTeamA'||focused.id==='smTeamB'||
        focused.id==='smDate'||focused.id==='smTime'||
        focused.id==='smScorerInput'||focused.id==='smDateEdit'||
        focused.id==='smTimeEdit'||
        focused.closest&&(focused.closest('#testmatch')||focused.closest('#matches')||focused.closest('#players'))
      );
      if(!inAdminForm)onUpdate(merged);
    }
  },8000);
}

