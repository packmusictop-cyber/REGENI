/**
 * DNA Tecnico: GlobalCronometragem
 */

const GlobalCronometragemDNA = {
  name: 'GlobalCronometragem',
  format: 'PHP + HTML tables',
  baseUrl: 'https://globalcronometragem.com.br',
  fields: {
    event: ['slug', 'dates', 'cidade'],
    athlete: ['PosGeral', 'Nome', 'Sexo', 'NumPeito'],
    result: ['TempoLiquido', 'TempoBruto', 'Pace']
  },
  keys: {
    event: 'slug',
    athlete: 'Nome + NumPeito'
  },
  parsers: ['parseEventSlugs(html)', 'parseAthletes(html)'],
  normalization: {
    time: 'fmtTime → HH:MM:SS',
    distance: 'nome prova → normDist',
    pace: 'pace formatted',
    name: 'UPPERCASE'
  },
  sanityChecks: ['tempo HH:MM:SS', 'pace 2:00-20:00/km'],
  dependencies: ['https', 'regex'],
  adapter: 'adapters/html-table.js'
};

export const dna = GlobalCronometragemDNA;

