import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import { getConfig } from './config/index.js';
import { createExecutor } from './executor.js';
import type {
  ExecutionRequest
} from './types/core.js';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
});

let executor: any;

// Global error handlers
process.on('uncaughtException', (error) => {
  fastify.log.fatal('Uncaught exception: %s', error.message || String(error));
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  fastify.log.fatal('Unhandled rejection: %s', reason instanceof Error ? reason.message : String(reason));
  process.exit(1);
});

async function startServer() {
  try {
    // Parse CLI arguments
    const args = process.argv.slice(2);
    const mcpConfigPath = args.find(arg => arg.startsWith('--mcp-config='))?.split('=')[1] ||
                         process.env.MCP_CONFIG_PATH ||
                         './.mcp.json';

    // Load configuration
    const config = await getConfig();

    fastify.log.info('Starting Code Mode Unified server...');

    // Register plugins
    await fastify.register(cors, config.server.cors);
    await fastify.register(websocket);

    if (config.security.auth.provider === 'jwt') {
      await fastify.register(jwt, {
        secret: config.security.auth.secretKey || 'default-secret'
      });
    }

    // Initialize executor
    executor = createExecutor({
      config: config as any,
      mcpConfigPath
    });
    await executor.initialize();

    // Authentication middleware
    const authenticate = async (request: any, reply: any) => {
      if (config.security.auth.provider === 'jwt') {
        try {
          const token = request.headers.authorization?.replace('Bearer ', '');
          if (!token) {
            reply.code(401).send({ error: 'No token provided' });
            return null;
          }

          const authResult = await executor.authenticate(token);
          if (!authResult.success) {
            reply.code(401).send({ error: authResult.error });
            return null;
          }

          return authResult.authContext;
        } catch (error: unknown) {
          reply.code(401).send({ error: 'Invalid token' });
          return null;
        }
      }
      return null; // No auth required
    };

    // Health check endpoint
    fastify.get('/health', async (request, reply) => {
      const health = executor.getHealth();
      reply.send(health);
    });

    // Capabilities endpoint
    fastify.get('/capabilities', async (request, reply) => {
      const authContext = await authenticate(request, reply);
      if (reply.sent) return;

      const capabilities = executor.getCapabilities(authContext);
      reply.send(capabilities);
    });

    // Main execution endpoint
    fastify.post('/execute', async (request, reply) => {
      const authContext = await authenticate(request, reply);
      if (reply.sent) return;

      const body = request.body as any;

      if (!body.code) {
        reply.code(400).send({ error: 'No code provided' });
        return;
      }

      const executionRequest: ExecutionRequest = {
        code: body.code,
        options: body.options || {},
        authContext: authContext || undefined,
        requestId: body.requestId
      };

      try {
        const result = await executor.execute(executionRequest);
        reply.send(result);
      } catch (error: unknown) {
        fastify.log.error('Execution error: %s', error instanceof Error ? error.message : String(error));
        reply.code(500).send({
          error: 'Internal execution error',
          message: (error instanceof Error ? error.message : String(error))
        });
      }
    });

    // Authentication endpoints
    if (config.security.auth.provider === 'jwt') {
      // Create session
      fastify.post('/auth/session', async (request, reply) => {
        const body = request.body as any;

        if (!body.userId || !body.scopes) {
          reply.code(400).send({ error: 'userId and scopes required' });
          return;
        }

        const result = await executor.createUserSession(body.userId, body.scopes);
        reply.send(result);
      });

      // Validate token
      fastify.post('/auth/validate', async (request, reply) => {
        const authContext = await authenticate(request, reply);
        if (reply.sent) return;

        reply.send({ valid: true, authContext });
      });
    }

    // WebSocket endpoint for real-time execution
    fastify.register(async function (fastify) {
      fastify.get('/ws', { websocket: true }, (connection, request) => {
        connection.on('message', async (message) => {
          try {
            const data = JSON.parse(message.toString());

            if (data.type === 'execute') {
              const executionRequest: ExecutionRequest = {
                code: data.code,
                options: data.options || {},
                requestId: data.requestId
              };

              const result = await executor.execute(executionRequest);

              connection.send(JSON.stringify({
                type: 'result',
                requestId: data.requestId,
                result
              }));
            }
          } catch (error: unknown) {
            connection.send(JSON.stringify({
              type: 'error',
              error: (error instanceof Error ? error.message : String(error))
            }));
          }
        });
      });
    });

    // MCP Bridge endpoint (for Claude integration)
    fastify.post('/mcp/execute', async (request, reply) => {
      const body = request.body as any;

      // Transform MCP request to execution request
      const executionRequest: ExecutionRequest = {
        code: body.arguments?.code || body.code,
        options: body.arguments?.options || {},
        requestId: body.id
      };

      try {
        const result = await executor.execute(executionRequest);

        // Transform to MCP response format
        const mcpResponse = {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };

        reply.send(mcpResponse);
      } catch (error: unknown) {
        reply.code(500).send({
          content: [
            {
              type: 'text',
              text: `Error: ${(error instanceof Error ? error.message : String(error))}`
            }
          ]
        });
      }
    });

    // Metrics endpoint
    fastify.get('/metrics', async (request, reply) => {
      const health = executor.getHealth();
      const capabilities = executor.getCapabilities();

      const metrics = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        health,
        capabilities: {
          totalTools: capabilities.tools.native.length + capabilities.tools.mcp.length,
          mcpServers: capabilities.mcpServers.length
        }
      };

      reply.send(metrics);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      fastify.log.info(`Received ${signal}, shutting down gracefully...`);

      try {
        if (executor) {
          await executor.shutdown();
        }
        await fastify.close();
        process.exit(0);
      } catch (error: unknown) {
        fastify.log.error('Error during shutdown: %s', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Start the server
    const address = await fastify.listen({
      port: config.server.port,
      host: config.server.host
    });

    fastify.log.info(`🚀 Code Mode Unified server running at ${address}`);
    fastify.log.info(`📡 WebSocket endpoint: ws://${config.server.host}:${config.server.port}/ws`);
    fastify.log.info(`🔧 MCP Bridge endpoint: ${address}/mcp/execute`);

  } catch (error: unknown) {
    fastify.log.error('Failed to start server: %s', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Start the server
startServer();