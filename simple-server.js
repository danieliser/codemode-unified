import Fastify from 'fastify';

console.log('🚀 Starting Simple Code Mode Server...');

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Simple health endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

// Simple execute endpoint
fastify.post('/execute', async (request, reply) => {
  const { code } = request.body;

  if (!code) {
    return reply.code(400).send({ error: 'No code provided' });
  }

  try {
    // Simple eval for testing - NOT SECURE FOR PRODUCTION
    const result = eval(code);

    return {
      success: true,
      result,
      metrics: {
        executionTime: 1,
        memoryUsed: 1024,
        apiCalls: 0
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'runtime',
        message: error.message
      }
    };
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: 'localhost' });
    console.log('✅ Simple Code Mode Server running on http://localhost:3001');
    console.log('📝 Try: curl -X POST http://localhost:3001/execute -H "Content-Type: application/json" -d \'{"code": "Math.sqrt(16)"}\'');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();