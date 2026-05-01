/**
 * DNA Tecnico: Wiclax CLAX (Base para 10+ plataformas)
 * Base para: ChipBrasil, ACrono, TriChip, CronosChip, TimeCrono, Race83, CronusTec, ChipMacapa, CronoCorridas, SMCrono
 */

const WiclaxBaseDNA = {
  name: 'Wiclax CLAX (Base)',
  format: 'XML .clax',
  baseUrl: 'https://brlive.info/brlive/',
  xmlTags: {
    event: '<Epreuve nom="..." dates="...">',
    athlete: '<E d="..." n="..." x="M/F" ca="..." p="...">',
    result: '<R d="..." t="1h30\'45,2" m="pace">'
  },
  fields: {
    event: ['nom', 'dates', 'dt1'],
    athlete: ['d', 'n', 'a', 'x', 'ca', 'p'],
    result: ['d', 't', 'm']
  },
  keys: {
    event: 'prefixo .clax (ex: bsb, aju)',
    athlete: 'd (dossard) + n (name)'
  },
  parsers: ['parseClax(xml)', 'parseClaxUrls(html)', 'fmtTime(raw)', 'parsePtDate(datesStr)'],
  normalization: {
    time: '1h30\'45,2 → 01:30:45',
    distance: 'p (km) → normDist → 5K,10K,21K,42K',
    pace: 'm (min:sec/km)',
    name: 'UPPERCASE normalize(NFD)'
  },
  platforms: ['ChipBrasil', 'ACrono', 'TriChip', 'CronosChip', 'TimeCrono', 'Race83', 'CronusTec', 'ChipMacapa', 'CronoCorridas', 'SMCrono'],
  dependencies: ['https', 'decodeURIComponent', 'regex'],
  adapter: 'adapters/wiclax.js'
};

export const dna = WiclaxBaseDNA;     
