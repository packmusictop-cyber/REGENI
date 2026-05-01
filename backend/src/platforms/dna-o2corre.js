/**
 * DNA Tecnico: O2Corre
 */

const O2CorreDNA = {
  name: 'O2Corre',
  format: 'Next.js + API Ativo',
  baseUrl: 'https://www.o2corre.com.br',
  fields: {
    event: ['id_evento', 'title_evento', 'data', 'cidade', 'estado'],
    athlete: ['nome', 'sexo', 'num_peito', 'modalidade'],
    result: ['tempo_total', 'pace', 'itens.classificacao']
  },
  keys: {
    event: 'id_evento',
    athlete: 'nome + num_peito'
  },
  parsers: ['Parse __NEXT_DATA__', 'Fetch API Ativo'],
  normalization: {
    time: 'fmtTime → HH:MM:SS',
    distance: 'normDist → 5K,10K,21K',
    pace: 'pace formatted',
    name: 'UPPERCASE'
  },
  sanityChecks: ['pace 2:00-20:00/km', 'classificacao numeric'],
  dependencies: ['https', 'Next.js parser'],
  adapter: 'adapters/o2corre.js'
};

export const dna = O2CorreDNA;  
