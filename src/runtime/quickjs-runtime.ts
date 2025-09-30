/**
 * QuickJS Runtime Adapter
 *
 * Wraps the existing QuickJS sandbox implementation with the BaseRuntime interface
 */

import {
  BaseRuntime,
  RuntimeType,
  type RuntimeCapabilities,
  type RuntimeMetrics,
  type RuntimeConfig
} from './base-runtime.js';
import { QuickJSSandbox } from '../sandbox/quickjs-runtime.js';
import type { ExecutionOptions, ExecutionResult } from '../types/core.js';

export class QuickJSRuntime extends BaseRuntime {
  private sandbox: QuickJSSandbox;
  private totalExecutions: number = 0;
  private totalExecutionTime: number = 0;
  private initTime: number = 0;

  constructor(config: RuntimeConfig) {
    super(config);
    this.sandbox = new QuickJSSandbox(
      config.maxWorkers,
      config.idleTimeout
    );
  }

  async initialize(): Promise<void> {
    const startTime = Date.now();
    await this.sandbox.initialize();
    this.initTime = Date.now() - startTime;
    this.initialized = true;
  }

  async execute(
    code: string,
    options?: ExecutionOptions
  ): Promise<ExecutionResult> {
    if (!this.initialized) {
      throw new Error('QuickJS runtime not initialized');
    }

    const startTime = Date.now();
    const result = await this.sandbox.execute(code, options);
    const executionTime = Date.now() - startTime;

    this.totalExecutions++;
    this.totalExecutionTime += executionTime;

    return result;
  }

  async shutdown(): Promise<void> {
    await this.sandbox.shutdown();
    this.initialized = false;
  }

  getCapabilities(): RuntimeCapabilities {
    return {
      // Language features - QuickJS ES2020
      supportsAsync: false, // QuickJS doesn't support async/await natively
      supportsConst: true,
      supportsLet: true,
      supportsTopLevelReturn: false,
      supportsTopLevelAwait: false,
      supportsESModules: true,
      supportsCommonJS: false,
      supportsTypeScript: false,

      // Execution characteristics
      isInProcess: true,
      isCloudBased: false,
      supportsConcurrency: true,

      // Performance
      typicalStartupMs: 5,
      typicalMemoryMB: 3,

      // Security
      hasNativeIsolation: true, // WASM-based isolation
      supportsFinegrainedPermissions: true
    };
  }

  getMetrics(): RuntimeMetrics {
    return {
      initializationTime: this.initTime,
      workerCount: this.sandbox.getWorkerCount(),
      totalExecutions: this.totalExecutions,
      averageExecutionTime: this.totalExecutions > 0
        ? this.totalExecutionTime / this.totalExecutions
        : 0,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }

  async health(): Promise<{ healthy: boolean; message?: string }> {
    try {
      const result = await this.sandbox.execute('1 + 1', { timeout: 1000 });
      return {
        healthy: result.success && result.result === 2,
        message: result.success ? 'QuickJS runtime healthy' : 'Health check failed'
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getRuntimeType(): RuntimeType {
    return RuntimeType.QUICKJS;
  }
}