/**
 * DNA Tecnico: CorridasBrasil (Agregador)
 */

const CorridasBrasilDNA = {
  name: 'CorridasBrasil (Agregador)',
  format: 'HTML scraping (multi-source)',
  baseUrl: 'https://www.corridasbrasil.com.br',
  fontesAgregadas: ['Sympla', 'TicketSports', 'WebRun', 'MinhasInscricoes', 'Chipower', 'RunnerBrasil'],
  fields: {
    event: ['nome', 'data (DD/MM/YYYY)', 'cidade', 'estado (UF)', 'distancias', 'link'],
    athlete: 'NAO ENTREGA (apenas lista eventos futuros)',
    result: 'NAO ENTREGA (apenas lista eventos futuros)'
  },
  keys: {
    event: 'nome + data + cidade',
    athlete: 'Nao ha (nao entrega resultados)'
  },
  parsers: ['Scraper listagem eventos', 'Extrai nome, data, cidade via HTML'],
  normalization: {
    time: 'Nao ha',
    distance: 'texto evento → normDist → 5K,10K,etc.',
    pace: 'Nao ha',
    name: 'UPPERCASE'
  },
  particularidades: [
    'APENAS LISTA EVENTOS (nao ha resultados)',
    'Agregador: ponte entre usuario e fontes originais',
    'Cada fonte tem parser proprio (Next.js, React, etc.)'
  ],
  sanityChecks: ['Data DD/MM/YYYY', 'UF duas letras maiusculas'],
  dependencies: ['https', 'Cheerio ou regex'],
  adapter: 'adapters/aggregator.js (apenas eventos)'
};

export const dna = CorridasBrasilDNA; 

