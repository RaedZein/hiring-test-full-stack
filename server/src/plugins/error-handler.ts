import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';

/**
 * Global Error Handler Plugin
 *
 * Centralizes error handling across all routes.
 * - Logs full error details internally
 * - Returns user-friendly error messages to clients
 * - Sanitizes 5xx errors to prevent information leakage
 */
const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, request, reply) => {
    // Log full error for debugging
    request.log.error(error, 'Request error');

    // Determine status code (error can have statusCode property)
    const statusCode = (error as any).statusCode ?? 500;

    // User-friendly error message
    const message = statusCode >= 500
      ? 'Something went wrong. Please try again later.'
      : (error as Error).message || 'An error occurred';

    // Send error response
    reply.status(statusCode).send({
      error: message,
    });
  });
};

export default fp(errorHandlerPlugin);
