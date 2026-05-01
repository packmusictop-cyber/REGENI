/**
 * DNA Tecnico: ChipMacapa (CLAX/Wiclax via brlive.info)
 */

const ChipMacapaDNA = {
  name: 'ChipMacapa (CLAX/Wiclax)',
  format: 'XML Wiclax .clax via brlive.info',
  baseUrl: 'https://brlive.info/brlive/',
  xmlTags: {
    event: '<Epreuve nom="..." dates="...">',
    athlete: '<E d="..." n="..." x="M/F">',
    result: '<R d="..." t="00h16\'33" re="net_time">'
  },
  fields: {
    event: ['nom', 'dates', 'dt1'],
    athlete: ['d', 'n', 'a', 'x', 'ca', 'p'],
    result: ['d', 't', 're', 'm']
  },
  keys: {
    event: 'prefixo "bsb" para Macapa',
    athlete: 'd (dossard) + n (name)'
  },
  parsers: ['listEvents()', 'parseClax(xml)', 'fmtTime(raw)', 'parsePtDate(datesStr)'],
  normalization: {
    time: '00h16\'33 → 00:16:33',
    distance: 'p (km) → normDist → 5K,10K,21K,42K',
    pace: 'm (min:sec/km)',
    name: 'UPPERCASE normalize(NFD)'
  },
  particularidades: [
    'Usa re="net_time" se disponivel',
    'Distancia do maior <Etape distance=...>',
    'Estado fixo: AP (Amapa)',
    'Cidade fixa: Macapa'
  ],
  sanityChecks: ['tempo valido apos conversao', 'pace 2:00-20:00/km'],
  dependencies: ['https', 'decodeURIComponent', 'regex'],
  adapter: 'adapters/wiclax.js'
};

export const dna = ChipMacapaDNA; 

