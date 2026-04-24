import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

function mapAthlete(data) {
  return {
    name: (data.name || '').toUpperCase().trim(),
    gender: (data.gender || 'M').substring(0, 1),
    age: data.age || null,
    birthDate: data.birthDate ? new Date(data.birthDate) : null,
    equipe: data.team || null,
    state: (data.uf || data.eventUF || 'SE').substring(0, 2).toUpperCase(),
    city: data.city || null,
  };
}

function mapRace(data, filename) {
  return {
    name: data.eventName || filename.replace(/_results/, '').replace(/-/g, ' '),
    date: data.eventMainDate ? new Date(data.eventMainDate) : new Date(),
    city: data.eventCity || 'Sergipe',
    state: (data.eventUF || 'SE').substring(0, 2).toUpperCase(),
    distances: data.modality || '5KM',
    organizer: 'Central de Resultados',
    status: 'completed',
  };
}

function mapResult(athleteId, raceId, data) {
  const time = data.liquidTime || data.rawTime;
  const genderRank = parseInt(String(data.genderPlacement || '').replace(/[^0-9]/g, '')) || null;
  
  return {
    athleteId,
    raceId,
    time,
    pace: data.pace || null,
    overallRank: data.generalPlacement || null,
    genderRank,
    ageGroup: data.category || null,
    distance: data.modality || '5KM',
    points: 0,
    source: 'import',
  };
}

async function importRaceFromJSON(filepath) {
  const filename = path.basename(filepath, '.json');
  console.log(`\n📂 Processando: ${filename}`);
  
  if (!fs.existsSync(filepath)) {
    console.log(`  ⚠️ Arquivo não encontrado`);
    return { races: 0, athletes: 0, results: 0 };
  }
  
  const rawData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  const athletes = Array.isArray(rawData) ? rawData : [rawData];
  
  const valid = athletes.filter(a => 
    a.name && 
    (a.liquidTime || a.rawTime) && 
    a.liquidTime !== '00:00:00'
  );
  
  if (valid.length === 0) {
    console.log(`  ⚠️ Nenhum dado válido`);
    return { races: 0, athletes: 0, results: 0 };
  }
  
  console.log(`  📊 ${valid.length} registros válidos`);
  
  const raceData = mapRace(valid[0], filename);
  let race = await prisma.race.findFirst({ where: { name: raceData.name } });
  
  if (!race) {
    race = await prisma.race.create({ data: raceData });
    console.log(`  ✅ Race criada: ${race.name}`);
  } else {
    console.log(`  ℹ️ Race já existe: ${race.name}`);
  }
  
  const athleteMap = new Map();
  const results = [];
  
  for (const data of valid) {
    const key = `${data.name}|${data.gender}`;
    
    if (!athleteMap.has(key)) {
      const athleteData = mapAthlete(data);
      
      let athlete = await prisma.athlete.findFirst({ 
        where: { name: athleteData.name, gender: athleteData.gender } 
      });
      
      if (!athlete) {
        athlete = await prisma.athlete.create({ data: athleteData });
      }
      athleteMap.set(key, athlete.id);
    }
    
    const athleteId = athleteMap.get(key);
    
    const exists = await prisma.result.findUnique({
      where: { athleteId_raceId: { athleteId, raceId: race.id } }
    });
    
    if (!exists) {
      results.push(mapResult(athleteId, race.id, data));
    }
  }
  
  if (results.length > 0) {
    await prisma.result.createMany({ data: results });
    console.log(`  ✅ ${results.length} resultados inseridos`);
  } else {
    console.log(`  ℹ️ Nenhum resultado novo para inserir`);
  }
  
  return { races: 1, athletes: athleteMap.size, results: results.length };
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           REGENI - Prisma Seed Script                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  const dataDir = path.join(__dirname, '..', 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.error('❌ Pasta data/ não encontrada em:', dataDir);
    process.exit(1);
  }
  
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  console.log(`📁 ${files.length} arquivo(s) JSON encontrado(s)\n`);
  
  let total = { races: 0, athletes: 0, results: 0 };
  
  for (const file of files) {
    const result = await importRaceFromJSON(path.join(dataDir, file));
    total.races += result.races;
    total.athletes += result.athletes;
    total.results += result.results;
  }
  
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    RESUMO DA IMPORTAÇÃO                     ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Corridas:  ${String(total.races).padEnd(45)}║`);
  console.log(`║  Atletas:   ${String(total.athletes).padEnd(45)}║`);
  console.log(`║  Resultados: ${String(total.results).padEnd(44)}║`);
  console.log('╚═══════════════════════════════════════════════════════════╝');
}

main()
  .catch(e => { console.error('❌ ERRO:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());