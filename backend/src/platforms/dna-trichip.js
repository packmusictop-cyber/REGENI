/**
 * DNA Tecnico: TriChip Cronometragem (Wiclax CLAX)
 */

const TriChipDNA = {
  name: 'TriChip Cronometragem (Wiclax CLAX)',
  format: 'XML Wiclax .clax',
  baseUrl: 'https://www.trichipcronometragem.com.br',
  xmlTags: {
    event: '<Epreuve nom="..." dates="...">',
    athlete: '<E d="..." n="..." x="M/F">',
    result: '<R d="..." t="1h28\'24,8">'
  },
  fields: {
    event: ['nom', 'dates', 'dt1'],
    athlete: ['d', 'n', 'a', 'x', 'ca', 'p'],
    result: ['d', 't', 'm']
  },
  keys: {
    event: 'prefixo .clax (ex: evento/2026/...)',
    athlete: 'd (dossard) + n (name)'
  },
  parsers: ['parseClaxUrls(html)', 'parseClax(xml)', 'fmtTime(raw)', 'normDist(d)'],
  normalization: {
    time: '1h28\'24,8 → 01:28:24',
    distance: 'p (km) → normDist → 5K,10K,21K,42K',
    pace: 'm (min:sec/km)',
    name: 'UPPERCASE normalize(NFD)'
  },
  particularidades: [
    'R tags no FINAL do arquivo XML',
    'Estado fixo: RS (Rio Grande do Sul)',
    'Cidade fixa: Porto Alegre',
    'athletes{} map: dossard → {name, gender, birthYear, category, distance}'
  ],
  sanityChecks: ['tempo valido apos conversao', 'pace 2:00-20:00/km', 'results[] nao vazio'],
  dependencies: ['https', 'decodeURIComponent', 'regex'],
  adapter: 'adapters/wiclax.js'
};

export const dna = TriChipDNA;    

