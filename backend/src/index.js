import { config } from "dotenv";
if (process.env.RAILWAY_ENVIRONMENT_NAME) config({ path: ".env" });

process.on("unhandledRejection", e => { console.error("❌ ERRO FATAL:", e); });
process.on("uncaughtException", e => { console.error("❌ CRASH:", e); });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) { 
  console.error("❌ DATABASE_URL não configurada!"); 
  process.exit(1); 
}
process.env.DATABASE_URL = dbUrl;
console.log("✅ DATABASE_URL OK");

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function ensureDb() {
  try {
    await prisma.$connect();
    await prisma.race.findFirst({ take: 1 });
    console.log('✅ Banco já tem tabelas!');
  } catch(e) {
    console.log('📦 Criando tabelas via SQL direto...');
    const tables = [
      `CREATE TABLE IF NOT EXISTS "User" (id TEXT PRIMARY KEY, email TEXT UNIQUE, "passwordHash" TEXT, name TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "Race" (id TEXT PRIMARY KEY, name TEXT, date TIMESTAMP, city TEXT, state TEXT, distances TEXT, organizer TEXT, status TEXT DEFAULT 'upcoming', "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "Athlete" (id TEXT PRIMARY KEY, name TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS "Result" (id TEXT PRIMARY KEY, "athleteId" TEXT, "raceId" TEXT, time TEXT, pace TEXT, "overallRank" INT, "genderRank" INT, "ageGroup" TEXT, distance TEXT, points INT DEFAULT 0)`,
      `CREATE TABLE IF NOT EXISTS "CorridaAberta" (id TEXT PRIMARY KEY, nome TEXT, data TIMESTAMP, cidade TEXT, estado TEXT, distancias TEXT, "linkInscricao" TEXT, ativa BOOLEAN DEFAULT TRUE, "criadoEm" TIMESTAMP DEFAULT NOW(), "atualizadoEm" TIMESTAMP DEFAULT NOW())`
    ];
    for (const sql of tables) {
      try { await prisma.$executeRawUnsafe(sql); } catch(err) {}
    }
    console.log('✅ Tabelas criadas!');
  }
  await prisma.$disconnect();
}

await ensureDb();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { raceRoutes } from './modules/races/races.routes.js';
import { resultsRoutes } from './modules/results/results.routes.js';
import { rankingRoutes } from './modules/ranking/ranking.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { corridasAbertasRoutes } from './modules/corridas-abertas/corridas.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = Fastify({ logger: false });

await app.register(cors, { origin: true });

const publicDir = path.join(__dirname, '../public');
app.get('/regeni.css', async (req, reply) => {
  try { reply.type('text/css').header('Cache-Control','public,max-age=3600').send(fs.readFileSync(path.join(publicDir, 'regeni.css'), 'utf-8')); }
  catch { reply.code(404).send(''); }
});

app.get('/manifest.json', async (req, reply) => {
  try { reply.type('application/json').send(fs.readFileSync(path.join(publicDir,'manifest.json'),'utf-8')); }
  catch { reply.send('{}'); }
});

const htmlCache = {};
for (const pg of ['index','entrar','resultados','corridas-abertas']) {
  const file = pg === 'index' ? 'index.html' : `${pg}.html`;
  try { htmlCache[pg] = fs.readFileSync(path.join(publicDir, file), 'utf-8'); }
  catch { htmlCache[pg] = null; }
}

for (const pg of ['index','entrar','resultados','corridas-abertas']) {
  const route = pg === 'index' ? '/' : `/${pg}.html`;
  app.get(route, async (req, reply) => {
    if (htmlCache[pg]) return reply.type('text/html').send(htmlCache[pg]);
    return reply.code(404).send('Not found');
  });
}

try {
  await app.register(authRoutes);
  await app.register(raceRoutes);
  await app.register(resultsRoutes);
  await app.register(rankingRoutes);
  await app.register(corridasAbertasRoutes);
  console.log('✅ REGENI Backend APIs carregadas');
} catch(e) {
  console.error('❌ ERRO ao registrar rotas:', e.message);
}

app.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' }, (err) => {
  if (err) { console.error('❌', err); process.exit(1); }
  console.log('🏃 REGENI API na porta ' + (process.env.PORT || 3000));
});