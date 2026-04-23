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
console.log("✅ DATABASE_URL configurada");

async function initDb() {
  console.log('📦 Criando schema...');
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('✅ Banco conectado! Tabelas:', tables.length);
  } catch(e) {
    console.log('📦 Criando tabelas...');
    const { execSync } = await import('child_process');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  }
  await prisma.$disconnect();
}

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

// Serve static files from public
const publicDir = path.join(__dirname, '../public');
app.get('/regeni.css', async (req, reply) => {
  try { reply.type('text/css').header('Cache-Control','public,max-age=3600').send(fs.readFileSync(path.join(publicDir, 'regeni.css'), 'utf-8')); }
  catch { reply.code(404).send(''); }
});

app.get('/manifest.json', async (req, reply) => {
  try { reply.type('application/json').send(fs.readFileSync(path.join(publicDir,'manifest.json'),'utf-8')); }
  catch { reply.send('{}'); }
});

// HTML Pages - ler do diretório public interno
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
  await initDb();
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