import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { IncomingMessage, ServerResponse } from 'http';
import app from '../server/dist/app';

let fastifyInstance: FastifyInstance | null = null;
let requestHandler: ((req: IncomingMessage, res: ServerResponse) => void) | null = null;

async function getInstance() {
  if (fastifyInstance && requestHandler) {
    return { instance: fastifyInstance, handler: requestHandler };
  }

  // Capture the request handler via serverFactory
  let capturedHandler: ((req: IncomingMessage, res: ServerResponse) => void) | null = null;

  const instance = Fastify({
    logger: true,
    serverFactory: (handler) => {
      capturedHandler = handler;
      // Return a dummy server - we won't actually use it
      const http = require('http');
      return http.createServer(handler);
    },
  });

  await instance.register(app);
  await instance.ready();

  fastifyInstance = instance;
  requestHandler = capturedHandler;

  return { instance, handler: capturedHandler! };
}

// Check if this is a streaming endpoint
function isStreamingEndpoint(url: string, method: string): boolean {
  return method === 'POST' && url.includes('/stream');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { instance, handler: fastifyHandler } = await getInstance();

  // Strip /api prefix and update the request URL
  let url = req.url || '/';
  if (url.startsWith('/api/')) {
    url = url.substring(4);
  } else if (url === '/api') {
    url = '/';
  }

  const method = req.method || 'GET';

  // For streaming endpoints, use Fastify's handler directly
  // This allows true streaming without buffering
  if (isStreamingEndpoint(url, method)) {
    // Modify the request URL to strip /api prefix
    (req as any).url = url;

    // Let Fastify handle the request directly
    // The route handler will set SSE headers and stream the response
    return new Promise<void>((resolve) => {
      res.on('close', resolve);
      res.on('finish', resolve);
      fastifyHandler(req as any, res as any);
    });
  }

  // For non-streaming endpoints, use inject() for simplicity
  const response = await instance.inject({
    method: method as any,
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
