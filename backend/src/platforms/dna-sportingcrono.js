/**
 * DNA Tecnico: SportingCrono
 */

const SportingCronoDNA = {
  name: 'SportingCrono',
  format: 'Vue SPA + JSON',
  baseUrl: 'https://sportingcrono.com.br',
  fields: {
    event: ['id', 'name', 'place', 'startDate'],
    athlete: ['nm', 'g', 'a', 'tg', 'tn'],
    result: ['n (rank)', 'tn (net)', 'tg (gross)']
  },
  keys: {
    event: 'id (UUID)',
    athlete: 'nm (name)'
  },
  parsers: ['fetchJSON(url)', 'events.json', 'results.json'],
  normalization: {
    time: 'fmtTime → HH:MM:SS',
    distance: 'infer from name',
    pace: 'calc tempo/distance',
    name: 'UPPERCASE'
  },
  sanityChecks: ['tempo HH:MM:SS', 'g = M or F'],
  dependencies: ['https', 'JSON parse'],
  adapter: 'adapters/sportingcrono.js'
};

export const dna = SportingCronoDNA;    

