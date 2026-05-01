/**
 * DNA Tecnico: Zenite Esportes
 */

const ZeniteDNA = {
  name: 'Zenite Esportes',
  format: 'OpenCart (PHP) + JSON API',
  baseUrl: 'https://zeniteesportes.com.br',
  fields: {
    event: ['id (numeric)', 'nome', 'data', 'cidade'],
    athlete: ['nome', 'sexo', 'numero', 'faixa', 'equipe'],
    result: ['colocacao', 'tempo_liquido', 'pace']
  },
  keys: {
    event: 'id (OpenCart)',
    athlete: 'nome + numero'
  },
  parsers: ['POST route=result/results/getresult'],
  normalization: {
    time: 'tempo_liquido → HH:MM:SS',
    distance: 'nome prova → normDist',
    pace: 'pace (formatted)',
    name: 'UPPERCASE'
  },
  sanityChecks: ['tempo HH:MM:SS', 'pace 2:00-20:00/km'],
  dependencies: ['https', 'POST'],
  adapter: 'adapters/opencart.js'
};

export const dna = ZeniteDNA;     

