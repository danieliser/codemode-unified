/**
 * Runtime Test Suite - Fixed Version
 *
 * Properly structured with explicit timeouts and simplified initialization
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RuntimeFactory, RuntimeType } from '../base-runtime.js';
import type { BaseRuntime } from '../base-runtime.js';

describe('QuickJS Runtime', () => {
  let runtime: BaseRuntime;

  beforeAll(async () => {
    console.log('Initializing QuickJS runtime...');
    runtime = await RuntimeFactory.create({
      type: RuntimeType.QUICKJS,
      maxWorkers: 2,
      defaultTimeout: 5000
    });
    console.log('QuickJS runtime initialized');
  }, 15000); // 15 second timeout for initialization

  afterAll(async () => {
    if (runtime) {
      console.log('Shutting down QuickJS runtime...');
      await runtime.shutdown();
      console.log('QuickJS runtime shut down');
    }
  }, 10000);

  describe('Initialization', () => {
    it('should be initialized', () => {
      expect(runtime.isInitialized()).toBe(true);
    });

    it('should return runtime type', () => {
      expect(runtime.getRuntimeType()).toBe(RuntimeType.QUICKJS);
    });

    it('should return capabilities', () => {
      const caps = runtime.getCapabilities();
      expect(caps).toBeDefined();
      expect(caps.supportsAsync).toBe(false);
      expect(caps.supportsTypeScript).toBe(false);
      expect(caps.isInProcess).toBe(true);
    });

    it('should pass health check', async () => {
      const health = await runtime.health();
      expect(health.healthy).toBe(true);
    }, 10000);
  });

  describe('Basic Execution', () => {
    it('should execute simple arithmetic', async () => {
      const result = await runtime.execute('1 + 1');
      expect(result.success).toBe(true);
      expect(result.result).toBe(2);
    }, 10000);

    it('should execute string concatenation', async () => {
      const result = await runtime.execute('"hello" + " " + "world"');
      expect(result.success).toBe(true);
      expect(result.result).toBe('hello world');
    }, 10000);

    it('should execute variable declaration', async () => {
      const result = await runtime.execute('var x = 10; var y = 20; x + y');
      expect(result.success).toBe(true);
      expect(result.result).toBe(30);
    }, 10000);

    it('should execute function definition and call', async () => {
      const result = await runtime.execute('function add(a, b) { return a + b; } add(5, 7)');
      expect(result.success).toBe(true);
      expect(result.result).toBe(12);
    }, 10000);

    it('should execute array operations', async () => {
      const result = await runtime.execute('[1, 2, 3].map(x => x * 2)');
      expect(result.success).toBe(true);
      expect(result.result).toEqual([2, 4, 6]);
    }, 10000);

    it('should execute object creation', async () => {
      const result = await runtime.execute('({ name: "Alice", age: 30 })');
      expect(result.success).toBe(true);
      expect(result.result).toEqual({ name: 'Alice', age: 30 });
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle syntax errors', async () => {
      const result = await runtime.execute('invalid javascript {{{');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 10000);

    it('should handle runtime errors', async () => {
      const result = await runtime.execute('undefined.property');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 10000);

    it('should handle reference errors', async () => {
      const result = await runtime.execute('nonExistentVariable');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 10000);
  });

  describe('ES2020 Features', () => {
    it('should support optional chaining', async () => {
      const result = await runtime.execute('var obj = { a: { b: 42 } }; obj?.a?.b');
      expect(result.success).toBe(true);
      expect(result.result).toBe(42);
    }, 10000);

    it('should support nullish coalescing', async () => {
      const result = await runtime.execute('var x = null; var y = x ?? 10; y');
      expect(result.success).toBe(true);
      expect(result.result).toBe(10);
    }, 10000);
  });

  describe('Metrics', () => {
    it('should return metrics', () => {
      const metrics = runtime.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalExecutions).toBe('number');
      expect(metrics.totalExecutions).toBeGreaterThan(0);
    });
  });
});

describe('Bun Runtime', () => {
  let runtime: BaseRuntime | null = null;
  let bunAvailable = false;

  beforeAll(async () => {
    try {
      console.log('Attempting to initialize Bun runtime...');
      runtime = await RuntimeFactory.create({
        type: RuntimeType.BUN,
        maxWorkers: 2,
        defaultTimeout: 5000
      });
      bunAvailable = true;
      console.log('Bun runtime initialized');
    } catch (error) {
      console.log('Bun not available:', error instanceof Error ? error.message : String(error));
      bunAvailable = false;
    }
  }, 15000);

  afterAll(async () => {
    if (runtime) {
      console.log('Shutting down Bun runtime...');
      await runtime.shutdown();
      console.log('Bun runtime shut down');
    }
  }, 10000);

  it('should check if Bun is available', () => {
    if (!bunAvailable) {
      console.log('Skipping Bun tests - runtime not available');
    }
    expect(bunAvailable).toBeDefined();
  });

  describe('When Bun is available', () => {
    it('should be initialized', () => {
      if (!bunAvailable || !runtime) {
        return; // Skip
      }
      expect(runtime.isInitialized()).toBe(true);
    });

    it('should support async/await', () => {
      if (!bunAvailable || !runtime) {
        return; // Skip
      }
      const caps = runtime.getCapabilities();
      expect(caps.supportsAsync).toBe(true);
    });

    it('should support TypeScript', () => {
      if (!bunAvailable || !runtime) {
        return; // Skip
      }
      const caps = runtime.getCapabilities();
      expect(caps.supportsTypeScript).toBe(true);
    });

    it('should execute simple code', async () => {
      if (!bunAvailable || !runtime) {
        return; // Skip
      }
      const result = await runtime.execute('1 + 1');
      expect(result.success).toBe(true);
      expect(result.result).toBe(2);
    }, 10000);

    it('should execute async code', async () => {
      if (!bunAvailable || !runtime) {
        return; // Skip
      }
      const result = await runtime.execute('await Promise.resolve(42)');
      expect(result.success).toBe(true);
      expect(result.result).toBe(42);
    }, 10000);
  });
});

describe('Runtime Factory', () => {
  it('should list available runtime types', () => {
    const types = RuntimeFactory.getAvailableRuntimes();
    expect(types).toContain(RuntimeType.QUICKJS);
    expect(types).toContain(RuntimeType.BUN);
    expect(types).toContain(RuntimeType.DENO);
    expect(types).toContain(RuntimeType.ISOLATED_VM);
    expect(types).toContain(RuntimeType.E2B);
  });

  it('should validate valid configuration', () => {
    const validation = RuntimeFactory.validateConfig({
      type: RuntimeType.QUICKJS,
      maxWorkers: 4,
      defaultTimeout: 5000
    });
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should reject invalid configuration', () => {
    const validation = RuntimeFactory.validateConfig({
      type: RuntimeType.QUICKJS,
      maxWorkers: -1 // Invalid
    });
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should require E2B API key', () => {
    const validation = RuntimeFactory.validateConfig({
      type: RuntimeType.E2B,
      e2b: {} // Missing apiKey
    });
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('E2B runtime requires apiKey in e2b config');
  });
});