// ══════════════════════════════════════════════
// BASE DE DONNÉES FIFA/UEFA — Le Super Site du Zuc
// Tous les pays reconnus FIFA + codes drapeaux ISO
// Usage: TEAMS_DB[code] = [nom, code_iso, confédération]
// Confédérations: UEFA, CONMEBOL, CONCACAF, CAF, AFC, OFC
// ══════════════════════════════════════════════

const TEAMS_DB = {
  // ── UEFA (Europe) ─────────────────────────
  ALB: ['Albanie',        'al', 'UEFA'],
  AND: ['Andorre',        'ad', 'UEFA'],
  ARM: ['Arménie',        'am', 'UEFA'],
  AUT: ['Autriche',       'at', 'UEFA'],
  AZE: ['Azerbaïdjan',    'az', 'UEFA'],
  BLR: ['Biélorussie',    'by', 'UEFA'],
  BEL: ['Belgique',       'be', 'UEFA'],
  BIH: ['Bosnie-Herzégovine','ba','UEFA'],
  BUL: ['Bulgarie',       'bg', 'UEFA'],
  CRO: ['Croatie',        'hr', 'UEFA'],
  CYP: ['Chypre',         'cy', 'UEFA'],
  CZE: ['Tchéquie',       'cz', 'UEFA'],
  DEN: ['Danemark',       'dk', 'UEFA'],
  ENG: ['Angleterre',     'gb-eng','UEFA'],
  EST: ['Estonie',        'ee', 'UEFA'],
  FRO: ['Îles Féroé',     'fo', 'UEFA'],
  FIN: ['Finlande',       'fi', 'UEFA'],
  FRA: ['France',         'fr', 'UEFA'],
  GEO: ['Géorgie',        'ge', 'UEFA'],
  GER: ['Allemagne',      'de', 'UEFA'],
  GIB: ['Gibraltar',      'gi', 'UEFA'],
  GRE: ['Grèce',          'gr', 'UEFA'],
  HUN: ['Hongrie',        'hu', 'UEFA'],
  ISL: ['Islande',        'is', 'UEFA'],
  IRL: ['Irlande',        'ie', 'UEFA'],
  NIR: ['Irlande du Nord','gb-nir','UEFA'],
  ITA: ['Italie',         'it', 'UEFA'],
  KAZ: ['Kazakhstan',     'kz', 'UEFA'],
  XKX: ['Kosovo',         'xk', 'UEFA'],
  LVA: ['Lettonie',       'lv', 'UEFA'],
  LIE: ['Liechtenstein',  'li', 'UEFA'],
  LTU: ['Lituanie',       'lt', 'UEFA'],
  LUX: ['Luxembourg',     'lu', 'UEFA'],
  MLT: ['Malte',          'mt', 'UEFA'],
  MDA: ['Moldavie',       'md', 'UEFA'],
  MNE: ['Monténégro',     'me', 'UEFA'],
  NED: ['Pays-Bas',       'nl', 'UEFA'],
  MKD: ['Macédoine du Nord','mk','UEFA'],
  NOR: ['Norvège',        'no', 'UEFA'],
  POL: ['Pologne',        'pl', 'UEFA'],
  POR: ['Portugal',       'pt', 'UEFA'],
  ROU: ['Roumanie',       'ro', 'UEFA'],
  RUS: ['Russie',         'ru', 'UEFA'],
  SMR: ['Saint-Marin',    'sm', 'UEFA'],
  SCO: ['Écosse',         'gb-sct','UEFA'],
  SRB: ['Serbie',         'rs', 'UEFA'],
  SVK: ['Slovaquie',      'sk', 'UEFA'],
  SVN: ['Slovénie',       'si', 'UEFA'],
  ESP: ['Espagne',        'es', 'UEFA'],
  SWE: ['Suède',          'se', 'UEFA'],
  SUI: ['Suisse',         'ch', 'UEFA'],
  TUR: ['Turquie',        'tr', 'UEFA'],
  UKR: ['Ukraine',        'ua', 'UEFA'],
  WAL: ['Pays de Galles', 'gb-wls','UEFA'],

  // ── CONMEBOL (Amérique du Sud) ────────────
  ARG: ['Argentine',      'ar', 'CONMEBOL'],
  BOL: ['Bolivie',        'bo', 'CONMEBOL'],
  BRA: ['Brésil',         'br', 'CONMEBOL'],
  CHI: ['Chili',          'cl', 'CONMEBOL'],
  COL: ['Colombie',       'co', 'CONMEBOL'],
  ECU: ['Équateur',       'ec', 'CONMEBOL'],
  PAR: ['Paraguay',       'py', 'CONMEBOL'],
  PER: ['Pérou',          'pe', 'CONMEBOL'],
  URU: ['Uruguay',        'uy', 'CONMEBOL'],
  VEN: ['Venezuela',      've', 'CONMEBOL'],

  // ── CONCACAF (Amérique du Nord/Centrale/Caraïbes) ──
  ATG: ['Antigua-et-Barbuda','ag','CONCACAF'],
  ARU: ['Aruba',          'aw', 'CONCACAF'],
  BAH: ['Bahamas',        'bs', 'CONCACAF'],
  BRB: ['Barbade',        'bb', 'CONCACAF'],
  BLZ: ['Belize',         'bz', 'CONCACAF'],
  BER: ['Bermudes',       'bm', 'CONCACAF'],
  VIR: ['Îles Vierges (USA)','vi','CONCACAF'],
  CAN: ['Canada',         'ca', 'CONCACAF'],
  CAY: ['Îles Caïmans',   'ky', 'CONCACAF'],
  CRC: ['Costa Rica',     'cr', 'CONCACAF'],
  CUB: ['Cuba',           'cu', 'CONCACAF'],
  CUR: ['Curaçao',        'cw', 'CONCACAF'],
  DMA: ['Dominique',      'dm', 'CONCACAF'],
  DOM: ['République dominicaine','do','CONCACAF'],
  SLV: ['Salvador',       'sv', 'CONCACAF'],
  GRD: ['Grenade',        'gd', 'CONCACAF'],
  GTM: ['Guatemala',      'gt', 'CONCACAF'],
  GUY: ['Guyana',         'gy', 'CONCACAF'],
  HAI: ['Haïti',          'ht', 'CONCACAF'],
  HON: ['Honduras',       'hn', 'CONCACAF'],
  JAM: ['Jamaïque',       'jm', 'CONCACAF'],
  MEX: ['Mexique',        'mx', 'CONCACAF'],
  MSR: ['Montserrat',     'ms', 'CONCACAF'],
  NCA: ['Nicaragua',      'ni', 'CONCACAF'],
  PAN: ['Panama',         'pa', 'CONCACAF'],
  SKN: ['Saint-Kitts-et-Nevis','kn','CONCACAF'],
  LCA: ['Sainte-Lucie',   'lc', 'CONCACAF'],
  VCT: ['Saint-Vincent',  'vc', 'CONCACAF'],
  SUR: ['Suriname',       'sr', 'CONCACAF'],
  TRI: ['Trinité-et-Tobago','tt','CONCACAF'],
  USA: ['États-Unis',     'us', 'CONCACAF'],

  // ── CAF (Afrique) ─────────────────────────
  ALG: ['Algérie',        'dz', 'CAF'],
  ANG: ['Angola',         'ao', 'CAF'],
  BEN: ['Bénin',          'bj', 'CAF'],
  BOT: ['Botswana',       'bw', 'CAF'],
  BFA: ['Burkina Faso',   'bf', 'CAF'],
  BDI: ['Burundi',        'bi', 'CAF'],
  CPV: ['Cap-Vert',       'cv', 'CAF'],
  CMR: ['Cameroun',       'cm', 'CAF'],
  CAF_CGO: ['Congo',      'cg', 'CAF'],
  COD: ['RD Congo',       'cd', 'CAF'],
  CIV: ['Côte d\'Ivoire', 'ci', 'CAF'],
  DJI: ['Djibouti',       'dj', 'CAF'],
  EGY: ['Égypte',         'eg', 'CAF'],
  ERI: ['Érythrée',       'er', 'CAF'],
  SWZ: ['Eswatini',       'sz', 'CAF'],
  ETH: ['Éthiopie',       'et', 'CAF'],
  GAB: ['Gabon',          'ga', 'CAF'],
  GAM: ['Gambie',         'gm', 'CAF'],
  GHA: ['Ghana',          'gh', 'CAF'],
  GUI: ['Guinée',         'gn', 'CAF'],
  GNB: ['Guinée-Bissau',  'gw', 'CAF'],
  GNQ: ['Guinée équatoriale','gq','CAF'],
  KEN: ['Kenya',          'ke', 'CAF'],
  LES: ['Lesotho',        'ls', 'CAF'],
  LBR: ['Liberia',        'lr', 'CAF'],
  LBA: ['Libye',          'ly', 'CAF'],
  MDG: ['Madagascar',     'mg', 'CAF'],
  MWI: ['Malawi',         'mw', 'CAF'],
  MLI: ['Mali',           'ml', 'CAF'],
  MTN: ['Mauritanie',     'mr', 'CAF'],
  MRI: ['Maurice',        'mu', 'CAF'],
  MAR: ['Maroc',          'ma', 'CAF'],
  MOZ: ['Mozambique',     'mz', 'CAF'],
  NAM: ['Namibie',        'na', 'CAF'],
  NIG: ['Niger',          'ne', 'CAF'],
  NGA: ['Nigeria',        'ng', 'CAF'],
  RWA: ['Rwanda',         'rw', 'CAF'],
  STP: ['São Tomé-et-Príncipe','st','CAF'],
  SEN: ['Sénégal',        'sn', 'CAF'],
  SEY: ['Seychelles',     'sc', 'CAF'],
  SLE: ['Sierra Leone',   'sl', 'CAF'],
  SOM: ['Somalie',        'so', 'CAF'],
  RSA: ['Afrique du Sud', 'za', 'CAF'],
  SSD: ['Soudan du Sud',  'ss', 'CAF'],
  SDN: ['Soudan',         'sd', 'CAF'],
  TAN: ['Tanzanie',       'tz', 'CAF'],
  TOG: ['Togo',           'tg', 'CAF'],
  TUN: ['Tunisie',        'tn', 'CAF'],
  UGA: ['Ouganda',        'ug', 'CAF'],
  ZAM: ['Zambie',         'zm', 'CAF'],
  ZIM: ['Zimbabwe',       'zw', 'CAF'],

  // ── AFC (Asie) ────────────────────────────
  AFG: ['Afghanistan',    'af', 'AFC'],
  AUS: ['Australie',      'au', 'AFC'],
  BHR: ['Bahreïn',        'bh', 'AFC'],
  BAN: ['Bangladesh',     'bd', 'AFC'],
  BHU: ['Bhoutan',        'bt', 'AFC'],
  BRU: ['Brunei',         'bn', 'AFC'],
  CAM: ['Cambodge',       'kh', 'AFC'],
  CHN: ['Chine',          'cn', 'AFC'],
  GUM: ['Guam',           'gu', 'AFC'],
  HKG: ['Hong Kong',      'hk', 'AFC'],
  IND: ['Inde',           'in', 'AFC'],
  IDN: ['Indonésie',      'id', 'AFC'],
  IRN: ['Iran',           'ir', 'AFC'],
  IRQ: ['Irak',           'iq', 'AFC'],
  JPN: ['Japon',          'jp', 'AFC'],
  JOR: ['Jordanie',       'jo', 'AFC'],
  KGZ: ['Kirghizstan',    'kg', 'AFC'],
  KWT: ['Koweït',         'kw', 'AFC'],
  LAO: ['Laos',           'la', 'AFC'],
  LBN: ['Liban',          'lb', 'AFC'],
  MAC: ['Macao',          'mo', 'AFC'],
  MYS: ['Malaisie',       'my', 'AFC'],
  MDV: ['Maldives',       'mv', 'AFC'],
  MNG: ['Mongolie',       'mn', 'AFC'],
  MYA: ['Myanmar',        'mm', 'AFC'],
  NEP: ['Népal',          'np', 'AFC'],
  PRK: ['Corée du Nord',  'kp', 'AFC'],
  OMN: ['Oman',           'om', 'AFC'],
  PAK: ['Pakistan',       'pk', 'AFC'],
  PLE: ['Palestine',      'ps', 'AFC'],
  PHI: ['Philippines',    'ph', 'AFC'],
  QAT: ['Qatar',          'qa', 'AFC'],
  KSA: ['Arabie Saoudite','sa', 'AFC'],
  SGP: ['Singapour',      'sg', 'AFC'],
  KOR: ['Corée du Sud',   'kr', 'AFC'],
  LKA: ['Sri Lanka',      'lk', 'AFC'],
  SYR: ['Syrie',          'sy', 'AFC'],
  TWN: ['Taipei chinois', 'tw', 'AFC'],
  TJK: ['Tadjikistan',    'tj', 'AFC'],
  THA: ['Thaïlande',      'th', 'AFC'],
  TLS: ['Timor oriental', 'tl', 'AFC'],
  TKM: ['Turkménistan',   'tm', 'AFC'],
  UAE: ['Émirats arabes unis','ae','AFC'],
  UZB: ['Ouzbékistan',    'uz', 'AFC'],
  VIE: ['Viêt Nam',       'vn', 'AFC'],
  YEM: ['Yémen',          'ye', 'AFC'],

  // ── OFC (Océanie) ─────────────────────────
  COK: ['Îles Cook',      'ck', 'OFC'],
  FIJ: ['Fidji',          'fj', 'OFC'],
  NZL: ['Nouvelle-Zélande','nz','OFC'],
  PNG: ['Papouasie-Nouvelle-Guinée','pg','OFC'],
  SAM: ['Samoa',          'ws', 'OFC'],
  SOL: ['Îles Salomon',   'sb', 'OFC'],
  TGA: ['Tonga',          'to', 'OFC'],
  VAN: ['Vanuatu',        'vu', 'OFC'],
};

// Index de recherche par nom (pour le parser)
const TEAMS_BY_NAME = {};
Object.entries(TEAMS_DB).forEach(([code,[name,iso,conf]])=>{
  TEAMS_BY_NAME[name.toLowerCase()] = code;
  // Aliases courants
  const aliases = {
    'france': 'FRA', 'allemagne': 'GER', 'germany': 'GER',
    'england': 'ENG', 'angleterre': 'ENG', 'espagne': 'ESP',
    'spain': 'ESP', 'italie': 'ITA', 'italy': 'ITA',
    'portugal': 'POR', 'brésil': 'BRA', 'brazil': 'BRA',
    'argentine': 'ARG', 'argentina': 'ARG', 'pays-bas': 'NED',
    'netherlands': 'NED', 'hollande': 'NED', 'hollande': 'NED',
    'belgique': 'BEL', 'belgium': 'BEL', 'croatie': 'CRO',
    'croatia': 'CRO', 'maroc': 'MAR', 'morocco': 'MAR',
    'sénégal': 'SEN', 'senegal': 'SEN', 'ghana': 'GHA',
    'nigeria': 'NGA', 'cameroun': 'CMR', 'cameroon': 'CMR',
    'japon': 'JPN', 'japan': 'JPN', 'corée du sud': 'KOR',
    'south korea': 'KOR', 'australie': 'AUS', 'australia': 'AUS',
    'mexique': 'MEX', 'mexico': 'MEX', 'états-unis': 'USA',
    'usa': 'USA', 'united states': 'USA', 'canada': 'CAN',
    'équateur': 'ECU', 'ecuador': 'ECU', 'colombie': 'COL',
    'colombia': 'COL', 'uruguay': 'URU', 'suisse': 'SUI',
    'switzerland': 'SUI', 'suede': 'SWE', 'suède': 'SWE',
    'sweden': 'SWE', 'danemark': 'DEN', 'denmark': 'DEN',
    'pologne': 'POL', 'poland': 'POL', 'ukraine': 'UKR',
    'turquie': 'TUR', 'turkey': 'TUR', 'pays de galles': 'WAL',
    'wales': 'WAL', 'ecosse': 'SCO', 'écosse': 'SCO',
    'scotland': 'SCO', 'iran': 'IRN', 'arabie saoudite': 'KSA',
    'saudi arabia': 'KSA', 'tunisie': 'TUN', 'tunisia': 'TUN',
    'côte d\'ivoire': 'CIV', 'ivory coast': 'CIV',
    'afrique du sud': 'RSA', 'south africa': 'RSA',
    'nouvelle-zélande': 'NZL', 'new zealand': 'NZL',
    'bosnie': 'BIH', 'serbie': 'SRB', 'serbia': 'SRB',
    'roumanie': 'ROU', 'romania': 'ROU', 'hongrie': 'HUN',
    'hungary': 'HUN', 'slovaquie': 'SVK', 'slovenie': 'SVN',
    'slovénie': 'SVN', 'autriche': 'AUT', 'austria': 'AUT',
    'grece': 'GRE', 'grèce': 'GRE', 'greece': 'GRE',
    'rd congo': 'COD', 'rdc': 'COD', 'congo dr': 'COD',
    'algerie': 'ALG', 'algérie': 'ALG', 'algeria': 'ALG',
    'egypte': 'EGY', 'égypte': 'EGY', 'egypt': 'EGY',
    'paraguai': 'PAR', 'chili': 'CHI', 'chile': 'CHI',
    'perou': 'PER', 'pérou': 'PER', 'peru': 'PER',
    'bolivie': 'BOL', 'bolivia': 'BOL', 'venezuela': 'VEN',
    'coree du nord': 'PRK', 'corée du nord': 'PRK',
    'taipei': 'TWN', 'emirats': 'UAE', 'émirats': 'UAE',
    'irak': 'IRQ', 'iraq': 'IRQ', 'chine': 'CHN', 'china': 'CHN',
    'inde': 'IND', 'india': 'IND', 'indonesie': 'IDN',
    'indonésie': 'IDN', 'indonesia': 'IDN', 'thaïlande': 'THA',
    'thailand': 'THA', 'vietnam': 'VIE', 'viet nam': 'VIE',
  };
  Object.entries(aliases).forEach(([alias,c])=>{TEAMS_BY_NAME[alias]=c;});
});

// Chercher une équipe par nom (fuzzy)
function findTeamByName(query){
  const q=query.toLowerCase().trim();
  if(TEAMS_BY_NAME[q])return TEAMS_BY_NAME[q];
  // Recherche partielle
  const keys=Object.keys(TEAMS_BY_NAME);
  const exact=keys.find(k=>k===q);
  if(exact)return TEAMS_BY_NAME[exact];
  const starts=keys.find(k=>k.startsWith(q)||q.startsWith(k));
  if(starts)return TEAMS_BY_NAME[starts];
  const includes=keys.find(k=>k.includes(q)||q.includes(k));
  return includes?TEAMS_BY_NAME[includes]:null;
}

// Chercher équipes pour autocomplétion
function searchTeams(query,exclude=[]){
  if(!query||query.length<1)return[];
  const q=query.toLowerCase().trim();
  return Object.entries(TEAMS_DB)
    .filter(([code,[name]])=>!exclude.includes(code)&&(
      name.toLowerCase().includes(q)||
      code.toLowerCase().includes(q)
    ))
    .slice(0,8)
    .map(([code,[name,iso,conf]])=>({code,name,iso,conf}));
}

// Flag URL
function flagUrl(codeOrIso){
  // Si c'est un code équipe (3 lettres)
  const team=TEAMS_DB[codeOrIso];
  const iso=team?team[1]:codeOrIso;
  return`https://flagcdn.com/w40/${iso}.png`;
}

// Nom d'équipe depuis code
function teamNameFromDB(code){
  return TEAMS_DB[code]?TEAMS_DB[code][0]:code;
}
