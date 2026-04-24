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
    d.name && (d.liquidTime || d.rawTime) && 
    d.liquidTime !== '00:00:00' && d.liquidTime?.length >= 5
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
    const eventName = d.eventName || filename.replace(/_results/, '').replace(/-/g, ' ');
    const raceId = 'race_' + h(eventName);
    if (!raceMap.has(raceId)) {
      const raceDate = d.eventMainDate 
        ? new Date(d.eventMainDate).toISOString().split('T')[0]
        : d.eventMainDate || '2025-01-01';
      raceMap.set(raceId, {
        id: raceId,
        name: esc(eventName),
        date: raceDate,
        city: esc(d.eventCity || 'Sergipe'),
        state: esc((d.eventUF || 'SE').substring(0, 2).toUpperCase()),
        distances: esc(d.modality || '5KM'),
        organizer: esc(d.organizer || 'Central de Resultados'),
        status: 'completed'
      });
    }
    
    const athleteId = 'ath_' + h((d.name || '').toUpperCase().trim() + (d.gender || 'M'));
    if (!athleteMap.has(athleteId)) {
      athleteMap.set(athleteId, {
        id: athleteId,
        name: esc((d.name || '').toUpperCase().trim()),
        gender: (d.gender || 'M').substring(0, 1),
        age: parseInt(d.age) || null,
        state: esc((d.uf || d.eventUF || 'SE').substring(0, 2).toUpperCase()),
        equipe: esc(d.team || ''),
        city: esc(d.city || '')
      });
    }
    
    results.push({
      id: 'res_' + h(raceId + athleteId + (d.modality || '5KM')),
      raceId,
      athleteId,
      time: esc(d.liquidTime || d.rawTime || ''),
      pace: esc(d.pace || ''),
      overallRank: parseInt(d.generalPlacement) || null,
      genderRank: parseInt(String(d.genderPlacement).replace(/[^0-9]/g, '')) || null,
      ageGroup: esc(d.category || ''),
      distance: esc(d.modality || '5KM'),
      points: 0,
      source: esc(filename)
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