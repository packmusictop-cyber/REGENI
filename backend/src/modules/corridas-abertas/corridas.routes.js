import prisma from '../../lib/prisma.js';
import jwt from 'jsonwebtoken';

function getUser(req) {
  try {
    const h = req.headers.authorization;
    if (!h) return null;
    return jwt.verify(h.replace('Bearer ', ''), process.env.JWT_SECRET || 'describe-oxygen-acoustic-pace2026');
  } catch { return null; }
}

const scraperStatus = { rodando: false, logs: [], totalColetadas: 0 };

export async function corridasAbertasRoutes(fastify) {
  fastify.get('/corridas-abertas', async (req) => {
    const { estado, distancia, mes, ano, busca, page = 1, limit = 30 } = req.query;
    const where = { ativa: true, data: { gte: new Date() } };
    if (estado) where.estado = estado.toUpperCase();
    if (distancia) where.distancias = { contains: distancia, mode: 'insensitive' };
    if (busca) where.OR = [
      { nome: { contains: busca, mode: 'insensitive' } },
      { cidade: { contains: busca, mode: 'insensitive' } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [corridas, total] = await Promise.all([
      prisma.corridaAberta.findMany({ where, orderBy: { data: 'asc' }, skip, take: parseInt(limit) }),
      prisma.corridaAberta.count({ where })
    ]);

    return { corridas, total, paginas: Math.ceil(total / parseInt(limit)), pagina: parseInt(page) };
  });

  fastify.get('/corridas-abertas/:id', async (req, reply) => {
    const corrida = await prisma.corridaAberta.findUnique({ where: { id: req.params.id } });
    if (!corrida) return reply.code(404).send({ error: 'Corrida não encontrada' });
    return corrida;
  });

  fastify.get('/corridas-abertas/stats/estados', async () => {
    const stats = await prisma.corridaAberta.groupBy({
      by: ['estado'],
      where: { ativa: true, data: { gte: new Date() } },
      _count: { id: true },
    });
    return { estados: stats.map(s => ({ estado: s.estado, total: s._count.id })) };
  });

  fastify.get('/corridas-abertas/scraper/status', async () => {
    return { ...scraperStatus, msg: 'Scraper desabilitado temporariamente' };
  });
}