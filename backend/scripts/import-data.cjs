#!/usr/bin/env node
/**
 * REGENI - Import Data Script
 * Popula o banco de dados com dados dos arquivos JSON
 * 
 * Uso: node scripts/import-data.js
 *      node scripts/import-data.js --dry-run
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('❌ DATABASE_URL não definida');
  console.error('   Configure no .env ou variáveis de ambiente');
  process.exit(1);
}

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║           REGENI - Import Data Script                     ║');
console.log('╚═══════════════════════════════════════════════════════════╝');

if (DRY_RUN) console.log('⚠️  DRY RUN MODE - Nenhum dado será inserido\n');

let db;
try {
  const { Client } = require('pg');
  db = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  console.log('✅ Conectando ao banco...');
} catch (e) {
  console.error('❌ Erro ao importar pg:', e.message);
  process.exit(1);
}

function esc(s) {
  return String(s || '').replace(/'/g, "''").replace(/\\/g, '').substring(0, 200);
}

function h(s) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(String(s || '')).digest('hex').substring(0, 20);
}

async function importFile(filepath) {
  const filename = path.basename(filepath, '.json');
  console.log(`\n📂 Processando: ${filename}`);
  
  if (!fs.existsSync(filepath)) {
    console.log(`   ⚠️ Arquivo não encontrado`);
    return { races: 0, athletes: 0, results: 0 };
  }
  
  const raw = fs.readFileSync(filepath, 'utf8');
  let dados;
  
  try {
    dados = JSON.parse(raw);
  } catch (e) {
    console.log(`   ❌ Erro ao parsear JSON`);
    return { races: 0, athletes: 0, results: 0 };
  }
  
  const validos = Array.isArray(dados) ? dados : [dados];
  const filtered = validos.filter(d => 
    d.nome && d.tempo && d.tempo !== '00:00:00' && d.tempo.length >= 5
  );
  
  if (filtered.length === 0) {
    console.log(`   ℹ️ Nenhum dado válido`);
    return { races: 0, athletes: 0, results: 0 };
  }
  
  console.log(`   📊 ${filtered.length} registros válidos`);
  
  if (DRY_RUN) return { races: 1, athletes: filtered.length, results: filtered.length };
  
  const raceMap = new Map();
  const athleteMap = new Map();
  const results = [];
  
  filtered.forEach(d => {
    const raceId = 'race_' + h(d.slug || d.eventoId || d.eventoNome || filename);
    if (!raceMap.has(raceId)) {
      const parts = (d.eventoLocal || '').split('-').map(s => s.trim());
      raceMap.set(raceId, {
        id: raceId,
        name: esc(d.eventoNome || filename.replace(/_results/, '').replace(/-/g, ' ')),
        date: d.eventoData || '2025-01-01',
        city: esc(parts[0] || 'Sergipe'),
        state: esc((parts[parts.length - 1] || 'SE').substring(0, 2).toUpperCase()),
        distances: esc(d.distancia || '5K'),
        organizer: esc(d.organizador || 'Central de Resultados'),
        status: 'completed'
      });
    }
    
    const athleteId = 'ath_' + h((d.nome || '').toUpperCase().trim() + (d.genero || 'M'));
    if (!athleteMap.has(athleteId)) {
      athleteMap.set(athleteId, {
        id: athleteId,
        name: esc((d.nome || '').toUpperCase().trim()),
        gender: (d.genero || 'M').substring(0, 1),
        age: parseInt(d.idade) || null,
        state: esc((d.estado || 'SE').substring(0, 2).toUpperCase()),
        equipe: esc(d.equipe || ''),
        city: esc(d.cidade || '')
      });
    }
    
    results.push({
      id: 'res_' + h(raceId + athleteId + (d.distancia || '5K')),
      raceId,
      athleteId,
      time: esc(d.tempo),
      pace: esc(d.pace || ''),
      overallRank: parseInt(d.pos) || null,
      genderRank: parseInt(d.posGenero) || null,
      ageGroup: esc(d.faixa || ''),
      distance: esc(d.distancia || '5K'),
      points: 0,
      source: esc(d.source || filename)
    });
  });
  
  const races = [...raceMap.values()];
  if (races.length > 0) {
    const vals = races.map(r => 
      `('${r.id}','${r.name}','${r.date}','${r.city}','${r.state}','${r.distances}','${r.organizer}','${r.status}',NOW(),NOW())`
    ).join(',');
    
    try {
      await db.query(`INSERT INTO "Race"(id,name,date,city,state,distances,organizer,status,"createdAt","updatedAt") VALUES ${vals} ON CONFLICT(id) DO NOTHING`);
      console.log(`   ✅ ${races.length} corrida(s) inserida(s)`);
    } catch (e) {
      console.log(`   ⚠️ Erro ao inserir races: ${e.message.substring(0, 50)}`);
    }
  }
  
  const athletes = [...athleteMap.values()];
  for (let i = 0; i < athletes.length; i += 100) {
    const batch = athletes.slice(i, i + 100);
    const vals = batch.map(a => 
      `('${a.id}','${a.name}','${a.equipe}','${a.state}','${a.gender}',${a.age},NULL,NULL,'${a.city}',NULL,NULL,NULL,NULL,0,0,NOW(),NOW())`
    ).join(',');
    
    try {
      await db.query(`INSERT INTO "Athlete"(id,name,equipe,state,gender,age,"birthDate",cpf,city,club,coach,"photoUrl",bio,"totalRaces","totalPoints","createdAt","updatedAt") VALUES ${vals} ON CONFLICT(id) DO NOTHING`);
    } catch (e) {}
  }
  console.log(`   ✅ ${athletes.length} atleta(s) processado(s)`);
  
  for (let i = 0; i < results.length; i += 100) {
    const batch = results.slice(i, i + 100);
    const vals = batch.map(r => 
      `('${r.id}','${r.raceId}','${r.athleteId}','${r.time}','${r.pace}',${r.overallRank},${r.genderRank},'${r.ageGroup}','${r.distance}',${r.points},false,NULL,'${r.source}',NOW(),false,NULL)`
    ).join(',');
    
    try {
      await db.query(`INSERT INTO "Result"(id,"raceId","athleteId",time,pace,"overallRank","genderRank","ageGroup",distance,points,"editedByAthlete","originalData",source,"createdAt",flagged,"flagReason") VALUES ${vals} ON CONFLICT(id) DO NOTHING`);
    } catch (e) {}
  }
  console.log(`   ✅ ${results.length} resultado(s) inserido(s)`);
  
  return { races: races.length, athletes: athletes.length, results: results.length };
}

async function main() {
  try {
    await db.connect();
    console.log('✅ Banco conectado\n');
    
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    console.log(`📁 ${files.length} arquivo(s) encontrado(s) em data/\n`);
    
    let totalRaces = 0, totalAthletes = 0, totalResults = 0;
    
    for (const file of files) {
      const filepath = path.join(DATA_DIR, file);
      const result = await importFile(filepath);
      totalRaces += result.races;
      totalAthletes += result.athletes;
      totalResults += result.results;
    }
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    RESUMO DA IMPORTAÇÃO                     ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║  Corridas:  ${String(totalRaces).padEnd(45)}║`);
    console.log(`║  Atletas:   ${String(totalAthletes).padEnd(45)}║`);
    console.log(`║  Resultados: ${String(totalResults).padEnd(44)}║`);
    console.log('╚═══════════════════════════════════════════════════════════╝');
    
    await db.end();
    console.log('\n✅ Importação concluída!');
    
  } catch (e) {
    console.error('\n❌ ERRO:', e.message);
    if (db) await db.end().catch(() => {});
    process.exit(1);
  }
}

main();