export const dna = {
  name: 'ChipTiming v4',
  format: 'json_nextjs',
  
  // A lógica de força bruta que estava no seu Railway
  parser: (html) => {
    try {
      const parts = html.split('__NEXT_DATA__" type="application/json">');
      const jsonStr = parts[1].split('</script>')[0];
      const data = JSON.parse(jsonStr);
      
      return data.props.pageProps.results.map(r => ({
        title: r.event.officialName,
        date: r.event.date,
        location: r.event.city,
        link: `https://chiptiming.com.br{r.event.code}`
      }));
    } catch (e) {
      return null; // Retorna null se falhar na "pesca"
    }
  }
};