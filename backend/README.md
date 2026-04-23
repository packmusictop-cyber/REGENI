# REGENI Backend

Backend API para o projeto REGENI.

## Quick Start

```bash
cd backend
npm install
cp .env.example .env  # configure DATABASE_URL
npm run dev
```

## APIs

- `/corridas-abertas` - Calendário de corridas
- `/ranking` - Rankings
- `/buscar-atletas` - Buscar atletas
- `/corrida/:id/resultados` - Resultados

## Stack

- Fastify
- Prisma + PostgreSQL
- JWT Auth