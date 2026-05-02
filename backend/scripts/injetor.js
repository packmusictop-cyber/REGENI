import fs from 'fs';
import path from 'path';
import db from '../src/database/connection.js';
import { v4 as uuidv4 } from 'uuid';

async function processarArquivosRaw() {
  const rawPath = './data/raw';
  
  // Lê apenas arquivos JSON da pasta raw
  const files = fs.readdirSync(rawPath).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) return console.log("📂 Ninguém na fila para importação.");

  console.log(`🚀 Processando ${files.length} arquivos...`);

  for (const file of files) {
    const filePath = path.join(rawPath, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const races = Array.isArray(content) ? content : [content];

    for (const race of races) {
      try {
        // REGRA DE OURO: Só insere se o link não existir no banco
        const exists = await db('races').where({ link: race.link }).first();

        if (!exists && race.title !== "Extração Manual Necessária") {
          await db('races').insert({
            id: uuidv4(),
            title: race.title,
            date: race.date || 'A definir',
            location: race.location || 'Brasil',
            price: race.price || 0,
            link: race.link,
            origin_platform: race.origin || file.split('-')[0]
          });
          console.log(`✅ Salvo: ${race.title}`);
        }
      } catch (err) {
        console.error(`❌ Erro no item ${race.title}:`, err.message);
      }
    }
    // Opcional: deleta o arquivo após processar para manter a raw limpa
    // fs.unlinkSync(filePath); 
  }
  console.log("🏁 Sincronização concluída.");
  process.exit();
}

processarArquivosRaw();