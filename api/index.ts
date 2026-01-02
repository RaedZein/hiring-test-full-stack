import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/dist/app';

let fastifyInstance: FastifyInstance | null = null;

async function getInstance() {
  if (fastifyInstance) return fastifyInstance;

  const instance = Fastify({
    logger: true,
  });

  await instance.register(app);
  await instance.ready();

  fastifyInstance = instance;
  return instance;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const instance = await getInstance();

  // Strip /api prefix
  let url = req.url || '/';
  if (url.startsWith('/api/')) {
    url = url.substring(4);
  } else if (url === '/api') {
    url = '/';
  }

  const response = await instance.inject({
    method: req.method as any,
    url: url,
    headers: req.headers as any,
    payload: req.body,
  });

  res.status(response.statusCode);
  for (const [key, value] of Object.entries(response.headers)) {
    if (value) res.setHeader(key, value as string);
  }
  res.send(response.payload);
}
