/**
 * DNA Tecnico: RaceZone (MyCrono, SportsChrono, RaceMS)
 */

const RaceZoneDNA = {
  name: 'RaceZone (MyCrono, SportsChrono, RaceMS)',
  format: 'JSON API',
  baseUrl: 'https://resultados.racezone.com.br',
  fields: {
    event: ['evt.id', 'evt.name', 'evt.startDate', 'evt.place'],
    route: ['rt.i', 'rt.n', 'rt.d'],
    category: ['cat.i', 'cat.n'],
    athlete: ['r.nm', 'r.g', 'r.a', 'r.c', 'r.r'],
    result: ['r.tn', 'r.tg', 'r.n', 'r.rg']
  },
  keys: {
    event: 'evt.id (numeric)',
    athlete: 'r.nm (name)'
  },
  parsers: ['/data/events.json', '/data/{id}/event.json', '/data/{id}/results.json'],
  normalization: {
    time: 'fmtTime → HH:MM:SS',
    distance: 'rt.d meters → normDist',
    pace: 'time / distance',
    name: 'UPPERCASE no accents'
  },
  sanityChecks: ['pace 2:00-20:00/km', 'r.n numeric'],
  dependencies: ['https'],
  adapter: 'adapters/racezone.js'
};

export const dna = RaceZoneDNA; 

