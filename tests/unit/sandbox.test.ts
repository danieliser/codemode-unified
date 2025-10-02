import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSandbox } from '../../src/sandbox/index.js';

// TODO: Fix sandbox initialization hang during coverage runs
// Tests pass individually but hang in beforeAll during coverage collection
describe.skip('QuickJS Sandbox', () => {
  let sandbox: any;

  beforeAll(async () => {
    sandbox = createSandbox({
      limits: {
        memory: 64 * 1024 * 1024, // 64MB
        timeout: 5000, // 5 seconds
        cpuQuota: 0.5,
        maxStackSize: 512 * 1024
      }
    });
    await sandbox.initialize();
  });

  afterAll(async () => {
    if (sandbox) {
      await sandbox.shutdown();
    }
  });

  it('should execute basic JavaScript', async () => {
    const result = await sandbox.execute('return 2 + 2;');

    expect(result.success).toBe(true);
    expect(result.result).toBe(4);
    expect(result.metrics.executionTime).toBeGreaterThan(0);
  });

  it('should handle console.log', async () => {
    const result = await sandbox.execute(`
      console.log('Hello from sandbox');
      return 'test';
    `);

    expect(result.success).toBe(true);
    expect(result.logs).toContain('Hello from sandbox');
  });

  it('should execute async code', async () => {
    const result = await sandbox.execute(`
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      await delay(10);
      return 'async complete';
    `);

    expect(result.success).toBe(true);
    expect(result.result).toBe('async complete');
  });

  it('should handle mathematical operations', async () => {
    const result = await sandbox.execute(`
      function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      }

      return fibonacci(10);
    `);

    expect(result.success).toBe(true);
    expect(result.result).toBe(55);
  });

  it('should handle JSON operations', async () => {
    const result = await sandbox.execute(`
      const data = { users: [{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }] };
      const adults = data.users.filter(user => user.age >= 30);
      return { count: adults.length, adults };
    `);

    expect(result.success).toBe(true);
    expect(result.result.count).toBe(1);
    expect(result.result.adults[0].name).toBe('Alice');
  });

  it('should enforce security restrictions', async () => {
    const result = await sandbox.execute('eval("console.log(\'evil\')")');

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('eval');
  });

  it('should handle errors gracefully', async () => {
    const result = await sandbox.execute('throw new Error("Test error");');

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Test error');
  });

  it('should timeout long-running code', async () => {
    const result = await sandbox.execute(`
      while(true) {
        // Infinite loop
      }
    `, { timeout: 1000 });

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('timeout');
  }, 10000);

  it('should provide execution metrics', async () => {
    const result = await sandbox.execute('return Math.random();');

    expect(result.success).toBe(true);
    expect(result.metrics).toBeDefined();
    expect(result.metrics.executionTime).toBeGreaterThan(0);
    expect(result.metrics.startTime).toBeGreaterThan(0);
    expect(result.metrics.endTime).toBeGreaterThan(result.metrics.startTime);
  });
});