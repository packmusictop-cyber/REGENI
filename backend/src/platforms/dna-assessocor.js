/**
 * DNA Tecnico: Assessocor
 */

const AssessocorDNA = {
  name: 'Assessocor',
  format: 'PHP + HTML Accordion (Houdini)',
  baseUrl: 'https://assessocor.online',
  fields: {
    event: ['id', 'nome', 'data', 'cidade'],
    athlete: ['Posicao', 'Numero', 'Atleta', 'Sexo', 'Tempo Liquido'],
    result: ['Posicao', 'Tempo Liquido', 'Pace']
  },
  keys: {
    event: 'id (numeric)',
    athlete: 'Atleta + Numero'
  },
  parsers: ['parseListingPage(html)', 'parseProvas(html)', 'POST /resultado/{id}'],
  normalization: {
    time: 'fmtTime → HH:MM:SS',
    distance: 'nome prova → normDist',
    pace: 'pace formatted',
    name: 'UPPERCASE'
  },
  particularidades: [
    'Accordion Houdini: Posicao, Numero, Atleta...',
    'Multiplas provas por evento',
    'Deduplicacao: atleta em prova geral + categoria'
  ],
  sanityChecks: ['tempo HH:MM:SS', 'Sexo M or F'],
  dependencies: ['https', 'POST', 'regex'],
  adapter: 'adapters/accordion.js'
};

export const dna = AssessocorDNA;
