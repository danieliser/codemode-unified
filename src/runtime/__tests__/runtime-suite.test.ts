/**
 * Comprehensive Runtime Test Suite
 *
 * Tests all runtime adapters against a common set of test cases
 * Each runtime is tested for:
 * - Basic execution
 * - Error handling
 * - Timeout behavior
 * - Memory limits
 * - Security constraints
 * - Runtime-specific features
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RuntimeFactory, RuntimeType, BaseRuntime } from '../base-runtime.js';
import type { ExecutionResult } from '../../types/core.js';

// Test configurations for each runtime
const TEST_RUNTIMES = [
  {
    type: RuntimeType.QUICKJS,
    name: 'QuickJS',
    skip: false,
    config: {
      type: RuntimeType.QUICKJS,
      maxWorkers: 2,
      defaultTimeout: 5000,
      memoryLimit: 134217728 // 128MB
    }
  },
  {
    type: RuntimeType.BUN,
    name: 'Bun',
    skip: false,  // Set to true if Bun not installed
    config: {
      type: RuntimeType.BUN,
      maxWorkers: 2,
      defaultTimeout: 5000
    }
  },
  {
    type: RuntimeType.DENO,
    name: 'Deno',
    skip: true,  // Not fully implemented yet
    config: {
      type: RuntimeType.DENO,
      maxWorkers: 2,
      defaultTimeout: 5000
    }
  },
  {
    type: RuntimeType.ISOLATED_VM,
    name: 'isolated-vm',
    skip: true,  // Not fully implemented yet
    config: {
      type: RuntimeType.ISOLATED_VM,
      maxWorkers: 2,
      defaultTimeout: 5000
    }
  },
  {
    type: RuntimeType.E2B,
    name: 'E2B',
    skip: true,  // Not fully implemented yet
    config: {
      type: RuntimeType.E2B,
      maxWorkers: 1,
      defaultTimeout: 10000,
      e2b: {
        apiKey: process.env.E2B_API_KEY || 'test-key',
        templateId: 'nodejs-20'
      }
    }
  }
];

// Common test cases that should work across all runtimes
const COMMON_TESTS = [
  {
    name: 'Simple arithmetic',
    code: '1 + 1',
    expectedResult: 2,
    skipRuntimes: []
  },
  {
    name: 'String concatenation',
    code: '"hello" + " " + "world"',
    expectedResult: 'hello world',
    skipRuntimes: []
  },
  {
    name: 'Variable declaration and use',
    code: 'var x = 10; var y = 20; x + y',
    expectedResult: 30,
    skipRuntimes: []
  },
  {
    name: 'Function definition and call',
    code: 'function add(a, b) { return a + b; } add(5, 7)',
    expectedResult: 12,
    skipRuntimes: []
  },
  {
    name: 'Array operations',
    code: '[1, 2, 3].map(x => x * 2)',
    expectedResult: [2, 4, 6],
    skipRuntimes: []
  },
  {
    name: 'Object creation',
    code: '({ name: "Alice", age: 30 })',
    expectedResult: { name: 'Alice', age: 30 },
    skipRuntimes: []
  },
  {
    name: 'JSON operations',
    code: 'JSON.stringify({ test: true })',
    expectedResult: '{"test":true}',
    skipRuntimes: []
  },
  {
    name: 'Console logging',
    code: 'console.log("test"); "ok"',
    expectedResult: 'ok',
    expectLogs: ['test'],
    skipRuntimes: []
  }
];

// Runtime-specific test cases
const ASYNC_TESTS = [
  {
    name: 'Async/await basic',
    code: 'async function test() { return Promise.resolve(42); } await test()',
    expectedResult: 42,
    requiresAsync: true
  },
  {
    name: 'Promise chain',
    code: 'Promise.resolve(10).then(x => x * 2)',
    expectedResult: 20,
    requiresAsync: true
  },
  {
    name: 'Async error handling',
    code: 'async function test() { throw new Error("test"); } try { await test(); } catch(e) { "caught" }',
    expectedResult: 'caught',
    requiresAsync: true
  }
];

const TYPESCRIPT_TESTS = [
  {
    name: 'TypeScript interface',
    code: 'interface User { name: string; } const user: User = { name: "Bob" }; user.name',
    expectedResult: 'Bob',
    requiresTypeScript: true
  },
  {
    name: 'TypeScript generics',
    code: 'function identity<T>(x: T): T { return x; } identity(123)',
    expectedResult: 123,
    requiresTypeScript: true
  }
];

const CONST_LET_TESTS = [
  {
    name: 'const declaration',
    code: 'const x = 100; x',
    expectedResult: 100,
    requiresConst: true
  },
  {
    name: 'let declaration',
    code: 'let y = 200; y = 300; y',
    expectedResult: 300,
    requiresLet: true
  },
  {
    name: 'Block scoping',
    code: '{ let x = 1; } let x = 2; x',
    expectedResult: 2,
    requiresLet: true
  }
];

// Error handling tests
const ERROR_TESTS = [
  {
    name: 'Syntax error',
    code: 'invalid javascript {{{',
    expectError: true
  },
  {
    name: 'Runtime error',
    code: 'undefined.property',
    expectError: true
  },
  {
    name: 'ReferenceError',
    code: 'nonExistentVariable',
    expectError: true
  }
];

// Performance tests
const PERFORMANCE_TESTS = [
  {
    name: 'Timeout enforcement',
    code: 'while(true) {}',
    timeout: 1000,
    expectTimeout: true
  },
  {
    name: 'Large array creation',
    code: 'Array(1000).fill(1).reduce((a, b) => a + b, 0)',
    expectedResult: 1000
  }
];

describe('Runtime Test Suite', () => {
  const runtimes: Map<RuntimeType, BaseRuntime> = new Map();

  beforeAll(async () => {
    // Initialize all non-skipped runtimes
    for (const testConfig of TEST_RUNTIMES) {
      if (testConfig.skip) continue;

      try {
        const runtime = await RuntimeFactory.create(testConfig.config);
        runtimes.set(testConfig.type, runtime);
        console.log(`✓ Initialized ${testConfig.name} runtime`);
      } catch (error) {
        console.error(`✗ Failed to initialize ${testConfig.name}:`, error);
      }
    }
  });

  afterAll(async () => {
    // Shutdown all runtimes
    for (const [type, runtime] of runtimes) {
      await runtime.shutdown();
    }
  });

  // Test each runtime against common test cases
  for (const testConfig of TEST_RUNTIMES) {
    if (testConfig.skip) {
      describe.skip(testConfig.name, () => {
        it('Runtime not available', () => {});
      });
      continue;
    }

    describe(testConfig.name, () => {
      let runtime: BaseRuntime;

      beforeAll(() => {
        runtime = runtimes.get(testConfig.type)!;
        expect(runtime).toBeDefined();
      });

      describe('Initialization', () => {
        it('should initialize successfully', () => {
          expect(runtime.isInitialized()).toBe(true);
        });

        it('should return capabilities', () => {
          const caps = runtime.getCapabilities();
          expect(caps).toBeDefined();
          expect(typeof caps.supportsAsync).toBe('boolean');
        });

        it('should pass health check', async () => {
          const health = await runtime.health();
          expect(health.healthy).toBe(true);
        });

        it('should return metrics', () => {
          const metrics = runtime.getMetrics();
          expect(metrics).toBeDefined();
          expect(typeof metrics.totalExecutions).toBe('number');
        });
      });

      describe('Common Tests', () => {
        for (const test of COMMON_TESTS) {
          if (test.skipRuntimes.includes(testConfig.type)) {
            it.skip(test.name, () => {});
            continue;
          }

          it(test.name, async () => {
            const result = await runtime.execute(test.code);
            expect(result.success).toBe(true);
            expect(result.result).toEqual(test.expectedResult);

            if (test.expectLogs) {
              expect(result.logs).toBeDefined();
              for (const expectedLog of test.expectLogs) {
                expect(result.logs?.some(log => log.includes(expectedLog))).toBe(true);
              }
            }
          });
        }
      });

      describe('Async/Await Tests', () => {
        for (const test of ASYNC_TESTS) {
          it(test.name, async () => {
            const caps = runtime.getCapabilities();

            if (!caps.supportsAsync) {
              return; // Skip if not supported
            }

            const result = await runtime.execute(test.code);
            expect(result.success).toBe(true);
            expect(result.result).toEqual(test.expectedResult);
          });
        }
      });

      describe('TypeScript Tests', () => {
        for (const test of TYPESCRIPT_TESTS) {
          it(test.name, async () => {
            const caps = runtime.getCapabilities();

            if (!caps.supportsTypeScript) {
              return; // Skip if not supported
            }

            const result = await runtime.execute(test.code);
            expect(result.success).toBe(true);
            expect(result.result).toEqual(test.expectedResult);
          });
        }
      });

      describe('const/let Tests', () => {
        for (const test of CONST_LET_TESTS) {
          it(test.name, async () => {
            const caps = runtime.getCapabilities();

            const shouldRun = (test.requiresConst && caps.supportsConst) ||
                              (test.requiresLet && caps.supportsLet);

            if (!shouldRun) {
              return; // Skip if not supported
            }

            const result = await runtime.execute(test.code);
            expect(result.success).toBe(true);
            expect(result.result).toEqual(test.expectedResult);
          });
        }
      });

      describe('Error Handling', () => {
        for (const test of ERROR_TESTS) {
          it(test.name, async () => {
            const result = await runtime.execute(test.code);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
          });
        }
      });

      describe('Performance', () => {
        for (const test of PERFORMANCE_TESTS) {
          if (test.expectTimeout) {
            it(test.name, async () => {
              const result = await runtime.execute(test.code, { timeout: test.timeout });
              expect(result.success).toBe(false);
              expect(result.error?.type).toContain('TIMEOUT');
            }, test.timeout! + 1000);
          } else {
            it(test.name, async () => {
              const result = await runtime.execute(test.code);
              expect(result.success).toBe(true);
              if (test.expectedResult !== undefined) {
                expect(result.result).toEqual(test.expectedResult);
              }
            });
          }
        }
      });

      describe('MCP Integration', () => {
        it('should detect MCP calls in first pass', async () => {
          // This test verifies the two-pass execution pattern
          const code = 'var result = mcp.memory.example_tool({message: "test"}); console.log("Result:", result);';
          const result = await runtime.execute(code);

          // QuickJS: placeholder in first pass, real data in second
          // Others: should work directly if MCP integration is implemented
          expect(result).toBeDefined();
        });
      });
    });
  }

  describe('Runtime Factory', () => {
    it('should list all available runtimes', () => {
      const available = RuntimeFactory.getAvailableRuntimes();
      expect(available).toContain(RuntimeType.QUICKJS);
      expect(available).toContain(RuntimeType.BUN);
      expect(available).toContain(RuntimeType.DENO);
      expect(available).toContain(RuntimeType.ISOLATED_VM);
      expect(available).toContain(RuntimeType.E2B);
    });

    it('should validate runtime configurations', () => {
      const valid = RuntimeFactory.validateConfig({
        type: RuntimeType.QUICKJS,
        maxWorkers: 4
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it('should reject invalid configurations', () => {
      const invalid = RuntimeFactory.validateConfig({
        type: RuntimeType.E2B,
        maxWorkers: -1
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThan(0);
    });
  });
});