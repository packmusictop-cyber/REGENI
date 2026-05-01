/**
 * DNA Tecnico: CronusTec (Avancado)
 */

const CronusTecDNA = {
  name: 'CronusTec (Avancado)',
  format: 'XML Wiclax (per-athlete distance)',
  baseUrl: 'https://www.cronusteccorridas.com.br',
  xmlTags: {
    event: '<Epreuve nom="...">',
    athlete: '<E d="..." n="..." x="M/F">',
    result: '<R d="..." t="1h30\'45,2">'
  },
  fields: {
    event: ['nom', 'dates', 'dt1'],
    athlete: ['d', 'n', 'a', 'x', 'ca', 'p', 'ip4', 'dn'],
    result: ['d', 't', 're', 'm']
  },
  keys: {
    event: 'MD5(caminho .clax)',
    athlete: 'MD5(name|gender|birthYear|state)'
  },
  parsers: ['parseClax(xml)', 'routeToMeters(route)', 'parseBirthDate(dn)', 'composeAthleteId()'],
  normalization: {
    time: '1h30\'45,2 → 01:30:45',
    distance: 'routeToMeters → meters',
    pace: 'm (min:sec/km)',
    name: 'UPPERCASE normalize(NFD)'
  },
  particularidades: [
    'birthDate e athleteState separados',
    'Rotas invalidas filtradas',
    'Race.distances = array distancias'
  ],
  sanityChecks: ['pace 1:00-30:00/km', 'distancia valida'],
  dependencies: ['https', 'crypto (md5)', 'regex'],
  adapter: 'adapters/wiclax-advanced.js'
};

export const dna = CronusTecDNA;      
    
