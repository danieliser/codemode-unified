import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createExecutor } from '../../src/executor.js';
import { defaultConfig } from '../../src/config/index.js';

describe('Code Mode Executor Integration', () => {
  let executor: any;

  beforeAll(async () => {
    const testConfig = {
      ...defaultConfig,
      server: {
        ...defaultConfig.server,
        port: 3002 // Different port for testing
      },
      sandbox: {
        ...defaultConfig.sandbox,
        limits: {
          memory: 64 * 1024 * 1024, // 64MB for testing
          timeout: 5000, // 5 seconds
          cpuQuota: 0.5,
          maxStackSize: 512 * 1024
        }
      },
      mcp: {
        servers: {}, // No MCP servers for basic testing
        discovery: { enabled: false },
        pooling: { maxConnections: 5, idleTimeout: 30000, reconnectAttempts: 2, reconnectDelay: 1000 }
      }
    };

    executor = createExecutor({ config: testConfig });
    await executor.initialize();
  });

  afterAll(async () => {
    if (executor) {
      await executor.shutdown();
    }
  });

  it('should initialize successfully', () => {
    expect(executor).toBeDefined();
  });

  it('should execute simple code', async () => {
    const result = await executor.execute({
      code: 'return 2 + 2;'
    });

    expect(result.success).toBe(true);
    expect(result.result).toBe(4);
    expect(result.requestId).toBeDefined();
    expect(result.metrics.executionTime).toBeGreaterThan(0);
  });

  it('should execute code with native tools', async () => {
    const result = await executor.execute({
      code: `
        // Test math tool
        const mathResult = await tools.math.calculate({
          expression: "10 + 5 * 2",
          precision: 2
        });

        // Test text analysis tool
        const textResult = await tools.text.analyze({
          text: "Hello world! This is a test.",
          metrics: ["wordCount", "charCount"]
        });

        return {
          math: mathResult.result,
          text: {
            words: textResult.wordCount,
            chars: textResult.charCount
          }
        };
      `
    });

    expect(result.success).toBe(true);
    expect(result.result.math).toBe(20);
    expect(result.result.text.words).toBe(6);
    expect(result.result.text.chars).toBeGreaterThan(0);
  });

  it('should execute async code with tools', async () => {
    const result = await executor.execute({
      code: `
        // Test data transformation
        const data = [
          { name: "Alice", age: 30, score: 85 },
          { name: "Bob", age: 25, score: 92 },
          { name: "Charlie", age: 35, score: 78 }
        ];

        const filtered = await tools.data.transform({
          data: data,
          operation: "filter",
          expression: "item.age >= 30"
        });

        const mapped = await tools.data.transform({
          data: filtered,
          operation: "map",
          expression: "({ name: item.name, score: item.score })"
        });

        return mapped;
      `
    });

    expect(result.success).toBe(true);
    expect(result.result).toHaveLength(2); // Alice and Charlie
    expect(result.result[0].name).toBe('Alice');
    expect(result.result[1].name).toBe('Charlie');
  });

  it('should handle execution errors gracefully', async () => {
    const result = await executor.execute({
      code: 'throw new Error("Test execution error");'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Test execution error');
    expect(result.error?.type).toBe('runtime');
  });

  it('should enforce security policies', async () => {
    const result = await executor.execute({
      code: 'eval("console.log(\'dangerous code\')");"'
    });

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('security');
  });

  it('should timeout long-running code', async () => {
    const result = await executor.execute({
      code: `
        let i = 0;
        while (i < 1000000) {
          i++;
          // Busy loop to consume time
          if (i % 10000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
        return i;
      `,
      options: { timeout: 1000 }
    });

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('timeout');
  }, 10000);

  it('should provide comprehensive metrics', async () => {
    const result = await executor.execute({
      code: `
        // Do some work to generate metrics
        const arr = Array.from({ length: 1000 }, (_, i) => i);
        const sum = arr.reduce((a, b) => a + b, 0);

        await tools.math.calculate({
          expression: "1 + 1",
          precision: 0
        });

        return sum;
      `
    });

    expect(result.success).toBe(true);
    expect(result.metrics).toBeDefined();
    expect(result.metrics.executionTime).toBeGreaterThan(0);
    expect(result.metrics.memoryUsed).toBeGreaterThan(0);
    expect(result.metrics.apiCalls).toBeGreaterThan(0); // Called math tool
    expect(result.metrics.startTime).toBeGreaterThan(0);
    expect(result.metrics.endTime).toBeGreaterThan(result.metrics.startTime);
  });

  it('should handle multiple tool calls', async () => {
    const result = await executor.execute({
      code: `
        const results = [];

        // UUID generation
        const uuid = await tools.util.uuid({ count: 1 });
        results.push(uuid.uuids[0]);

        // Date formatting
        const dateResult = await tools.datetime.format({
          date: new Date().toISOString(),
          format: "iso"
        });
        results.push(dateResult.formatted);

        // Text analysis
        const textResult = await tools.text.analyze({
          text: "The quick brown fox jumps over the lazy dog",
          metrics: ["wordCount", "charCount"]
        });
        results.push(\`\${textResult.wordCount} words, \${textResult.charCount} chars\`);

        return results;
      `
    });

    expect(result.success).toBe(true);
    expect(result.result).toHaveLength(3);
    expect(result.result[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i); // UUID format
    expect(result.result[1]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO date format
    expect(result.result[2]).toContain('9 words'); // Expected word count
  });

  it('should get system capabilities', () => {
    const capabilities = executor.getCapabilities();

    expect(capabilities).toBeDefined();
    expect(capabilities.tools).toBeDefined();
    expect(capabilities.tools.native).toBeInstanceOf(Array);
    expect(capabilities.tools.mcp).toBeInstanceOf(Array);
    expect(capabilities.sandbox).toBeDefined();
    expect(capabilities.sandbox.runtime).toBe('quickjs');
  });

  it('should get system health', () => {
    const health = executor.getHealth();

    expect(health).toBeDefined();
    expect(health.status).toBe('healthy');
    expect(health.components).toBeDefined();
    expect(health.components.sandbox).toBeDefined();
    expect(health.components.security).toBeDefined();
  });

  it('should create user session with JWT', async () => {
    const result = await executor.createUserSession('test-user', ['code:execute']);

    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
  });

  it('should authenticate with JWT token', async () => {
    // First create a session
    const sessionResult = await executor.createUserSession('test-user', ['code:execute']);
    expect(sessionResult.success).toBe(true);

    // Then authenticate with the token
    const authResult = await executor.authenticate(sessionResult.token!);

    expect(authResult.success).toBe(true);
    expect(authResult.authContext).toBeDefined();
    expect(authResult.authContext?.userId).toBe('test-user');
    expect(authResult.authContext?.scopes).toContain('code:execute');
  });
});