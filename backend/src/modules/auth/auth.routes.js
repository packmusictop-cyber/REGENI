import prisma from '../../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pace-secret-2026';

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function calcularAgeGroup(birthDate) {
  const anoNasc = new Date(birthDate).getFullYear();
  const idade = 2026 - anoNasc;
  if (idade < 16) return 'SUB16';
  if (idade < 20) return 'SUB20';
  if (idade < 30) return '20-29';
  if (idade < 35) return '30-34';
  if (idade < 40) return '35-39';
  if (idade < 45) return '40-44';
  if (idade < 50) return '45-49';
  if (idade < 55) return '50-54';
  if (idade < 60) return '55-59';
  if (idade < 65) return '60-64';
  if (idade < 70) return '65-69';
  return '70+';
}

function getUser(req) {
  try { return jwt.verify(req.headers.authorization?.replace('Bearer ', ''), JWT_SECRET); }
  catch { return null; }
}

export async function authRoutes(fastify) {

  fastify.post('/auth/register', async (req, reply) => {
    try {
      const { name, email, password, birthDate, gender, city, state } = req.body || {};

      if (!name || name.trim().length < 3 || name.trim().length > 120)
        return reply.code(400).send({ error: 'Nome deve ter entre 3 e 120 caracteres' });
      if (!email || !email.includes('@') || !email.includes('.'))
        return reply.code(400).send({ error: 'Email inválido' });
      if (!password || password.length < 6)
        return reply.code(400).send({ error: 'Senha deve ter no mínimo 6 caracteres' });
      if (!birthDate)
        return reply.code(400).send({ error: 'Data de nascimento obrigatória' });
      if (!gender || !['M', 'F'].includes(gender))
        return reply.code(400).send({ error: 'Gênero deve ser M ou F' });
      if (!city || !city.trim())
        return reply.code(400).send({ error: 'Cidade obrigatória' });
      if (!state || !UFS.includes(state.toUpperCase()))
        return reply.code(400).send({ error: 'Estado inválido' });

      const nascimento = new Date(birthDate);
      if (isNaN(nascimento)) return reply.code(400).send({ error: 'Data de nascimento inválida' });
      const idade = Math.floor((Date.now() - nascimento) / (365.25 * 24 * 60 * 60 * 1000));
      if (idade < 13) return reply.code(400).send({ error: 'Idade mínima: 13 anos' });
      if (idade > 120) return reply.code(400).send({ error: 'Data de nascimento inválida' });

      const existe = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existe) return reply.code(400).send({ error: 'E-mail já cadastrado' });

      const passwordHash = await bcrypt.hash(password, 10);
      const ageGroup = calcularAgeGroup(birthDate);

      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name: name.trim(),
          city: city.trim(),
          state: state.toUpperCase(),
          gender,
          birthDate: nascimento,
          ageGroup,
          age: idade,
          bip39Hash: '',
          emailVerified: true,
        }
      });

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
      return reply.code(201).send({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          city: user.city,
          state: user.state,
          gender: user.gender,
          birthDate: user.birthDate,
          ageGroup: user.ageGroup,
          isPremium: user.isPremium,
        }
      });
    } catch(e) {
      console.error('REGISTER ERROR:', e);
      return reply.code(500).send({ error: e.message });
    }
  });

  fastify.post('/auth/login', async (req, reply) => {
    try {
      const { email, password, senha } = req.body || {};
      const pw = password || senha; // backward compat com frontend antigo
      if (!email || !pw) return reply.code(400).send({ error: 'Email e senha obrigatórios' });

      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user) return reply.code(401).send({ error: 'E-mail ou senha incorretos' });

      const ok = await bcrypt.compare(pw, user.passwordHash);
      if (!ok) return reply.code(401).send({ error: 'E-mail ou senha incorretos' });

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          city: user.city,
          state: user.state,
          gender: user.gender,
          birthDate: user.birthDate,
          ageGroup: user.ageGroup,
          age: user.age,
          isPremium: user.isPremium,
          athleteId: user.athleteId,
        }
      };
    } catch(e) {
      console.error('LOGIN ERROR:', e);
      return reply.code(500).send({ error: e.message });
    }
  });

  fastify.post('/auth/recover', async (req, reply) => {
    try {
      const { email, bip39Words, novaSenha } = req.body;
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user) return reply.code(400).send({ error: 'E-mail não encontrado' });
      if (!user.bip39Hash) return reply.code(400).send({ error: 'Recuperação por palavras não disponível. Envie email para contatoregeni@proton.me' });
      const ok = await bcrypt.compare(bip39Words.trim().toLowerCase(), user.bip39Hash);
      if (!ok) return reply.code(400).send({ error: 'Palavras de recuperação incorretas' });
      if (!novaSenha || novaSenha.length < 6) return reply.code(400).send({ error: 'Nova senha: mínimo 6 caracteres' });
      const passwordHash = await bcrypt.hash(novaSenha, 10);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
      return { success: true, message: 'Senha alterada!' };
    } catch(e) {
      return reply.code(500).send({ error: e.message });
    }
  });

  fastify.get('/auth/me', async (req, reply) => {
    try {
      const u = getUser(req);
      if (!u) return reply.code(401).send({ error: 'Token necessário' });
      const user = await prisma.user.findUnique({
        where: { id: u.userId },
        select: {
          id:true, email:true, name:true, city:true, state:true,
          gender:true, age:true, birthDate:true, ageGroup:true,
          bio:true, photo:true, distanciasFavoritas:true,
          isPremium:true, premiumUntil:true, athleteId:true,
          athlete: {
            select: {
              totalRaces:true, totalPoints:true,
              results: {
                include: { race: { select:{name:true,date:true,city:true} } },
                orderBy: { createdAt:'desc' },
                take: 10
              }
            }
          }
        }
      });
      if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' });
      return { success: true, user };
    } catch(e) {
      return reply.code(401).send({ error: 'Token inválido' });
    }
  });

  fastify.patch('/auth/me', async (req, reply) => {
    try {
      const u = getUser(req);
      if (!u) return reply.code(401).send({ error: 'Token necessário' });
      const { city, state, bio, photo, distanciasFavoritas } = req.body || {};
      const data = {};
      if (city  !== undefined) data.city  = city  || null;
      if (state !== undefined) data.state = state || null;
      if (bio   !== undefined) data.bio   = bio   || null;
      if (photo !== undefined) data.photo = photo || null;
      if (distanciasFavoritas !== undefined) data.distanciasFavoritas = distanciasFavoritas;
      const user = await prisma.user.update({
        where: { id: u.userId },
        data,
        select: { id:true, email:true, name:true, city:true, state:true, gender:true, age:true, isPremium:true }
      });
      return { success: true, user };
    } catch(e) {
      return reply.code(401).send({ error: e.message });
    }
  });

  fastify.patch('/auth/senha', async (req, reply) => {
    try {
      const u = getUser(req);
      if (!u) return reply.code(401).send({ error: 'Token necessário' });
      const { senhaAtual, novaSenha } = req.body || {};
      if (!senhaAtual || !novaSenha) return reply.code(400).send({ error: 'Senha atual e nova senha obrigatórias' });
      const user = await prisma.user.findUnique({ where: { id: u.userId } });
      if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' });
      const ok = await bcrypt.compare(senhaAtual, user.passwordHash);
      if (!ok) return reply.code(401).send({ error: 'Senha atual incorreta' });
      if (novaSenha.length < 6) return reply.code(400).send({ error: 'Nova senha: mínimo 6 caracteres' });
      const passwordHash = await bcrypt.hash(novaSenha, 10);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
      return { success: true, message: 'Senha alterada com sucesso!' };
    } catch(e) {
      return reply.code(401).send({ error: 'Token inválido' });
    }
  });

  // Admin: setar premium
  fastify.post('/auth/admin/set-premium', async (req, reply) => {
    const key = req.headers['x-admin-key'];
    if (key !== (process.env.ADMIN_KEY || '3b77d62cb40acbbe091abf119204cd5fd3371c47e68e47cf9698088a1d1a18d6'))
      return reply.code(403).send({ error: 'Negado' });
    const { email, isPremium, premiumUntil } = req.body;
    const u = await prisma.user.update({
      where: { email },
      data: { isPremium: isPremium ?? true, premiumUntil: premiumUntil ? new Date(premiumUntil) : null }
    });
    return { success: true, email: u.email, isPremium: u.isPremium };
  });

  // PaceMatch - dar like
  fastify.post('/auth/like/:targetId', async (req, reply) => {
    try {
      const u = getUser(req);
      if (!u) return reply.code(401).send({ error: 'Token necessário' });
      const fromUser = await prisma.user.findUnique({ where: { id: u.userId } });
      const toUser = await prisma.user.findUnique({ where: { id: req.params.targetId } });
      if(!fromUser||!toUser) return reply.code(404).send({ error: 'Usuário não encontrado' });
      await prisma.like.upsert({
        where: { fromUserId_toUserId: { fromUserId: fromUser.id, toUserId: toUser.id } },
        create: { fromUserId: fromUser.id, toUserId: toUser.id },
        update: {}
      });
      const mutual = await prisma.like.findUnique({
        where: { fromUserId_toUserId: { fromUserId: toUser.id, toUserId: fromUser.id } }
      });
      return { success: true, status: mutual ? 'matched' : 'liked', partner: { id: toUser.id, name: toUser.name, city: toUser.city } };
    } catch(e) {
      return reply.code(500).send({ error: e.message });
    }
  });

  // PaceMatch - meus matches
  fastify.get('/auth/matches', async (req, reply) => {
    try {
      const u = getUser(req);
      if (!u) return reply.code(401).send({ error: 'Token necessário' });
      const myLikes = await prisma.like.findMany({ where: { fromUserId: u.userId }, select: { toUserId: true } });
      const myLikeIds = myLikes.map(l => l.toUserId);
      const theyLikeMe = await prisma.like.findMany({
        where: { fromUserId: { in: myLikeIds }, toUserId: u.userId },
        include: { fromUser: { select: { id:true, name:true, city:true, state:true, gender:true, age:true } } }
      });
      return theyLikeMe.map(l => ({ partner: l.fromUser, matchedAt: l.createdAt }));
    } catch(e) {
      return reply.code(401).send({ error: e.message });
    }
  });

  // Recuperação simples por email (admin use only — sem token)
  fastify.post('/auth/recover-email', async (req, reply) => {
    try {
      const { email, novaSenha } = req.body;
      if (!email || !novaSenha) return reply.code(400).send({ error: 'Email e nova senha obrigatórios' });
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user) return reply.code(400).send({ error: 'E-mail não encontrado' });
      if (novaSenha.length < 6) return reply.code(400).send({ error: 'Senha: mínimo 6 caracteres' });
      const passwordHash = await bcrypt.hash(novaSenha, 10);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
      return { success: true, message: 'Senha alterada com sucesso!' };
    } catch(e) {
      return reply.code(500).send({ error: e.message });
    }
  });
}
