import { createClient } from '@insforge/sdk';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const insforge = createClient({
  baseUrl: process.env.INSFORGE_URL,
  anonKey: process.env.INSFORGE_ANON_KEY
});

async function processarArquivosRaw() {
  const rawPath = './data/raw';
  
  const files = fs.readdirSync(rawPath).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) return console.log("📂 Ninguém na fila para importação.");

  console.log(`🚀 Processando ${files.length} arquivos...`);

  for (const file of files) {
    const filePath = path.join(rawPath, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const races = Array.isArray(content) ? content : [content];

    for (const race of races) {
      try {
        const { data, error } = await insforge
          .database
          .from('races')
          .select('link')
          .eq('link', race.link)
          .limit(1);

        if (error) throw error;

        const exists = data && data.length > 0;

        if (!exists && race.title !== "Extração Manual Necessária") {
          const { error: insertError } = await insforge
            .database
            .from('races')
            .insert([{
              id: uuidv4(),
              title: race.title,
              date: race.date || 'A definir',
              location: race.location || 'Brasil',
              price: race.price || 0,
              link: race.link,
              origin_platform: race.origin || file.split('-')[0]
            }]);

          if (insertError) throw insertError;
          console.log(`✅ Salvo: ${race.title}`);
        }
      } catch (err) {
        console.error(`❌ Erro no item ${race.title}:`, err.message);
      }
    }
  }
  console.log("🏁 Sincronização concluída.");
  process.exit();
}

processarArquivosRaw();
