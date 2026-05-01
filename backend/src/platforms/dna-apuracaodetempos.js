/**
 * DNA Tecnico: ApuracaoDeTempos
 */

const ApuracaoDeTemposDNA = {
  name: 'ApuracaoDeTempos',
  format: 'HTML estatico (Cheerio)',
  baseUrl: 'https://www.apuracaodetempos.com.br',
  fields: {
    event: ['slug', 'eventName', 'last-modified header'],
    athlete: ['Coloc', 'Nome', 'Fx.Et'],
    result: ['Fx.Et → gender + ageGroup', 'tempo liquido']
  },
  keys: {
    event: 'slug (ex: kamaluswimrun2026)',
    athlete: 'Nome + Fx.Et'
  },
  parsers: ['parseResultsHtml(html)', 'Cheerio parse', 'parseFxEt(raw) → {gender, ageGroup}'],
  normalization: {
    time: 'fmtTime → HH:MM:SS',
    distance: 'sectionDist → normDist → 5K,10K,21K,42K',
    pace: 'time / distance',
    name: 'UPPERCASE no accents'
  },
  particularidades: [
    'Descoberta via: KNOWN_SLUGS, settime.com.br, Wayback Machine',
    'Multiplas secoes por evento',
    'Fx.Et: codigo faixa etaria (F3039 = F, 30-39)'
  ],
  sanityChecks: ['tempo HH:MM:SS', 'pace 2:00-20:00/km', 'Fx.Et format: [MF]\\d{4}'],
  dependencies: ['https', 'cheerio', 'dotenv'],
  adapter: 'adapters/apuracaodetempos.js'
};

export const dna = ApuracaoDeTemposDNA; 
