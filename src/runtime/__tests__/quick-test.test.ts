/**
 * Quick smoke tests for runtime implementations
 */

import { describe, it, expect } from 'vitest';
import { RuntimeFactory, RuntimeType } from '../base-runtime.js';

describe('Quick Runtime Tests', () => {
  it('should create QuickJS runtime', async () => {
    const runtime = await RuntimeFactory.create({
      type: RuntimeType.QUICKJS,
      maxWorkers: 1,
      defaultTimeout: 5000
    });

    expect(runtime).toBeDefined();
    expect(runtime.isInitialized()).toBe(true);

    await runtime.shutdown();
  }, 10000);

  it('should execute simple code in QuickJS', async () => {
    const runtime = await RuntimeFactory.create({
      type: RuntimeType.QUICKJS,
      maxWorkers: 1,
      defaultTimeout: 5000
    });

    const result = await runtime.execute('1 + 1');

    expect(result.success).toBe(true);
    expect(result.result).toBe(2);

    await runtime.shutdown();
  }, 10000);

  it('should get QuickJS capabilities', async () => {
    const runtime = await RuntimeFactory.create({
      type: RuntimeType.QUICKJS
    });

    const caps = runtime.getCapabilities();

    expect(caps.supportsAsync).toBe(false);
    expect(caps.supportsTypeScript).toBe(false);
    expect(caps.isInProcess).toBe(true);

    await runtime.shutdown();
  }, 10000);

  it('should create Bun runtime if available', async () => {
    try {
      const runtime = await RuntimeFactory.create({
        type: RuntimeType.BUN,
        maxWorkers: 1,
        defaultTimeout: 5000
      });

      expect(runtime).toBeDefined();
      expect(runtime.isInitialized()).toBe(true);

      const caps = runtime.getCapabilities();
      expect(caps.supportsAsync).toBe(true);
      expect(caps.supportsTypeScript).toBe(true);

      await runtime.shutdown();
    } catch (error) {
      console.log('Bun not available:', error.message);
    }
  }, 10000);
});