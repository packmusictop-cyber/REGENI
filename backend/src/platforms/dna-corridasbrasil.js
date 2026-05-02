export const dna = {
  name: 'CorridasBrasil (Agregador)',
  format: 'HTML',
  
  // A "Mão" de Pesca: Extrai o título e gera os dados
  parser: (html) => {
    // Busca o texto entre as tags <title>
    const match = html.match(/<title>(.*?)<\/title>/i);
    const rawTitle = match ? match[1] : 'Corrida Desconhecida';
    const cleanTitle = rawTitle.split('|')[0].trim();

    return [{
      title: cleanTitle,
      date: '2026-05-15', // Exemplo (podemos automatizar depois)
      location: 'Brasil',
      link: 'https://corridasbrasil.com.br' + Math.random().toString(36).substring(7),
      origin: 'CorridasBrasil'
    }];
  }
};