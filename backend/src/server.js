import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { db } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';

const app = Fastify({ logger: true });

await app.register(cors, { origin: isDev ? true : false });

app.get('/api/health', async () => ({ ok: true }));

app.get('/api/entries/latest', async () => {
  const row = db.prepare('SELECT * FROM entries ORDER BY end_time DESC LIMIT 1').get();
  return row || null;
});

app.get('/api/entries', async (req) => {
  const { from, to } = req.query;
  let sql = 'SELECT * FROM entries';
  const params = [];
  if (from && to) {
    sql += ' WHERE end_time > ? AND start_time < ?';
    params.push(from, to);
  }
  sql += ' ORDER BY start_time ASC';
  return db.prepare(sql).all(...params);
});

app.post('/api/entries', async (req, reply) => {
  const { start_time, end_time } = req.body || {};
  if (!start_time || !end_time) {
    return reply.code(400).send({ error: 'start_time and end_time required' });
  }
  const type = classifyType(start_time);
  const info = db.prepare(
    'INSERT INTO entries (start_time, end_time, type) VALUES (?, ?, ?)'
  ).run(start_time, end_time, type);
  return db.prepare('SELECT * FROM entries WHERE id = ?').get(info.lastInsertRowid);
});

app.patch('/api/entries/:id', async (req, reply) => {
  const id = Number(req.params.id);
  const { start_time, end_time } = req.body || {};
  const existing = db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
  if (!existing) return reply.code(404).send({ error: 'not found' });
  const newStart = start_time ?? existing.start_time;
  const newEnd = end_time ?? existing.end_time;
  const type = classifyType(newStart);
  db.prepare(
    'UPDATE entries SET start_time = ?, end_time = ?, type = ? WHERE id = ?'
  ).run(newStart, newEnd, type, id);
  return db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
});

app.delete('/api/entries/:id', async (req, reply) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM entries WHERE id = ?').run(id);
  if (info.changes === 0) return reply.code(404).send({ error: 'not found' });
  return { ok: true };
});

function classifyType(isoStart) {
  const hour = new Date(isoStart).getHours();
  return hour >= 18 || hour < 6 ? 'night' : 'nap';
}

const staticDir = process.env.STATIC_DIR || join(__dirname, '..', '..', 'frontend', 'dist');
if (!isDev && existsSync(staticDir)) {
  await app.register(fastifyStatic, { root: staticDir });
  app.setNotFoundHandler((req, reply) => {
    if (req.raw.url.startsWith('/api')) return reply.code(404).send({ error: 'not found' });
    reply.sendFile('index.html');
  });
}

const port = Number(process.env.PORT || 3000);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
