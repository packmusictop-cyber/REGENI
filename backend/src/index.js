import { config } from "dotenv";
if (!process.env.RAILWAY_ENVIRONMENT_NAME) config({ path: ".env" });

process.on("unhandledRejection", e => { console.error("❌ ERRO FATAL:", e); });
process.on("uncaughtException", e => { console.error("❌ CRASH:", e); });

if (!process.env.DATABASE_URL) { console.error("❌ DATABASE_URL não configurada!"); process.exit(1); }
if (!process.env.JWT_SECRET) console.warn("⚠️ JWT_SECRET não configurado");

async function initDb() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    await prisma.corridaAberta.count();
    console.log('✅ Banco de dados conectado');
  } catch(e) {
    console.log('📦 Criando tabelas no banco...');
    const { execSync } = await import('child_process');
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL } });
      console.log('✅ Tabelas criadas!');
    } catch(err) {
      console.error('❌ Erro ao criar tabelas:', err.message);
    }
  } finally {
    await prisma.$disconnect();
  }
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