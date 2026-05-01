import platforms from '../src/platforms/index.js';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

async function engine() {
  const url = process.argv[2]; 
  
  if (!url) return console.error("❌ Erro: Forneça uma URL.");

  // 1. IDENTIFICAÇÃO (O Maestro escolhe o DNA)
  const key = Object.keys(platforms).find(k => url.includes(k));
  const dna = platforms[key];

  if (!dna) return console.error("❌ Site não mapeado nos 15 DNAs.");

  console.log(`🤖 Scraper Geral Ativado para: ${dna.name}`);

  try {
    console.log(`🚚 Buscando dados em ${url}...`);
    const response = await fetch(url);

    // 2. O FILTRO INTELIGENTE (JSON vs HTML)
    let rawData;
    const isJson = dna.format === 'JSON_API' || dna.format === 'json_nextjs';

    if (isJson) {
      rawData = await response.json();
      console.log("💎 Dados JSON recebidos.");
    } else {
      // Se for Assessocor, Global, etc, ele lê como texto e evita o erro do '<'
      rawData = await response.text();
      console.log("📄 Conteúdo HTML/XML detectado. (Ignorando erro de JSON)");
    }

    // 3. NORMALIZAÇÃO (O DNA guia a extração)
    let cleanData = [];

    if (typeof rawData === 'object') {
      const items = Array.isArray(rawData) ? rawData : [rawData];
      cleanData = items.map(item => ({
        id: uuidv4(),
        title: item[dna.fields?.title] || item.title || item.name || 'Sem Título',
        date: item[dna.fields?.date] || item.date || 'Data não informada',
        origin: dna.name
      }));
    } else {
      // Aqui o seu DNA da Assessocor vai brilhar com Regex no futuro
      console.log("🔍 O dado está em HTML. Pronto para extração via Regex/Parser.");
      cleanData = [{ id: uuidv4(), title: "Extração Manual Necessária", origin: dna.name }];
    }

    // 4. DEPÓSITO (Salva na Raw)
    const fileName = `./data/raw/${key}-${Date.now()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(cleanData, null, 2));

    console.log(`✅ Sucesso! Arquivo gerado: ${fileName}`);

  } catch (err) {
    console.error(`❌ Erro técnico: ${err.message}`);
  } finally {
    process.exit();
  }
}

engine();