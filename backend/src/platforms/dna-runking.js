/**
 * DNA Tecnico: Runking (36 empresas)
 */

const RunkingDNA = {
  name: 'Runking (36 empresas)',
  format: 'RSC (React Server Components) + AES Decrypt',
  baseUrl: 'https://resultados.runking.com.br',
  fields: {
    event: ['eventName', 'mainDate', 'eventCity', 'eventUF', 'modality'],
    athlete: ['id', 'name', 'gender', 'categoryName'],
    result: ['liquidTime', 'generalPlacement', 'genderPlacement']
  },
  keys: {
    event: 'companySlug + eventSlug',
    athlete: 'id (global)'
  },
  parsers: ['RSC header parsing', 'AES Decrypt'],
  normalization: {
    time: 'fmtTime → HH:MM:SS',
    distance: 'normDist → 5K,10K,21K',
    pace: 'time / distance',
    name: 'UPPERCASE'
  },
  sanityChecks: ['pace 2:00-20:00/km', 'generalPlacement numeric'],
  dependencies: ['https', 'crypto'],
  adapter: 'adapters/runking.js'
};

export const dna = RunkingDNA;    
