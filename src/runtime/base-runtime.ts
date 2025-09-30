/**
 * Base Runtime Interface
 *
 * Abstract interface that all runtime adapters must implement.
 * Provides a consistent API across QuickJS, Bun, Deno, isolated-vm, and E2B.
 */

import type {
  ExecutionOptions,
  ExecutionResult,
  CapabilitySet
} from '../types/core.js';

export enum RuntimeType {
  QUICKJS = 'quickjs',
  BUN = 'bun',
  DENO = 'deno',
  ISOLATED_VM = 'isolated-vm',
  E2B = 'e2b'
}

export interface RuntimeCapabilities {
  // Language features
  supportsAsync: boolean;
  supportsConst: boolean;
  supportsLet: boolean;
  supportsTopLevelReturn: boolean;
  supportsTopLevelAwait: boolean;
  supportsESModules: boolean;
  supportsCommonJS: boolean;
  supportsTypeScript: boolean;

  // Execution characteristics
  isInProcess: boolean;
  isCloudBased: boolean;
  supportsConcurrency: boolean;

  // Performance
  typicalStartupMs: number;
  typicalMemoryMB: number;

  // Security
  hasNativeIsolation: boolean;
  supportsFinegrainedPermissions: boolean;
}

export interface RuntimeMetrics {
  initializationTime: number;
  workerCount: number;
  totalExecutions: number;
  averageExecutionTime: number;
  memoryUsage: number;
}

export interface RuntimeConfig {
  type: RuntimeType;
  maxWorkers?: number;
  idleTimeout?: number;
  defaultTimeout?: number;
  memoryLimit?: number;
  enableLogging?: boolean;

  // Runtime-specific configs
  quickjs?: {
    wasmPath?: string;
  };
  bun?: {
    bunPath?: string;
  };
  deno?: {
    denoPath?: string;
    permissions?: string[];
  };
  isolatedVm?: {
    memoryLimit?: number;
    inspector?: boolean;
  };
  e2b?: {
    apiKey?: string;
    templateId?: string;
  };
}

/**
 * Base Runtime Abstract Class
 * All runtime adapters extend this class
 */
export abstract class BaseRuntime {
  protected initialized: boolean = false;
  protected config: RuntimeConfig;

  constructor(config: RuntimeConfig) {
    this.config = config;
  }

  /**
   * Initialize the runtime and its workers
   */
  abstract initialize(): Promise<void>;

  /**
   * Execute code in the runtime
   */
  abstract execute(
    code: string,
    options?: ExecutionOptions
  ): Promise<ExecutionResult>;

  /**
   * Shutdown the runtime and cleanup resources
   */
  abstract shutdown(): Promise<void>;

  /**
   * Get runtime capabilities
   */
  abstract getCapabilities(): RuntimeCapabilities;

  /**
   * Get runtime metrics
   */
  abstract getMetrics(): RuntimeMetrics;

  /**
   * Health check
   */
  abstract health(): Promise<{ healthy: boolean; message?: string }>;

  /**
   * Runtime type identifier
   */
  abstract getRuntimeType(): RuntimeType;

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Runtime Factory
 * Creates runtime instances based on configuration
 */
export class RuntimeFactory {
  /**
   * List all available runtime types
   */
  static listAvailableTypes(): RuntimeType[] {
    return Object.values(RuntimeType);
  }

  static async create(config: RuntimeConfig): Promise<BaseRuntime> {
    let runtime: BaseRuntime;

    switch (config.type) {
      case RuntimeType.QUICKJS:
        const { QuickJSRuntime } = await import('./quickjs-runtime.js');
        runtime = new QuickJSRuntime(config);
        break;

      case RuntimeType.BUN:
        const { BunRuntime } = await import('./bun-runtime.js');
        runtime = new BunRuntime(config);
        break;

      case RuntimeType.DENO:
        const { DenoRuntime } = await import('./deno-runtime.js');
        runtime = new DenoRuntime(config);
        break;

      case RuntimeType.ISOLATED_VM:
        const { IsolatedVMRuntime } = await import('./isolated-vm-runtime.js');
        runtime = new IsolatedVMRuntime(config);
        break;

      case RuntimeType.E2B:
        const { E2BRuntime } = await import('./e2b-runtime.js');
        runtime = new E2BRuntime(config);
        break;

      default:
        throw new Error(`Unsupported runtime type: ${config.type}`);
    }

    await runtime.initialize();
    return runtime;
  }

  /**
   * Get all available runtime types
   */
  static getAvailableRuntimes(): RuntimeType[] {
    return Object.values(RuntimeType);
  }

  /**
   * Validate runtime configuration
   */
  static validateConfig(config: RuntimeConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.type) {
      errors.push('Runtime type is required');
    }

    if (config.type === RuntimeType.E2B && !config.e2b?.apiKey) {
      errors.push('E2B runtime requires apiKey in e2b config');
    }

    if (config.maxWorkers && config.maxWorkers < 1) {
      errors.push('maxWorkers must be at least 1');
    }

    if (config.memoryLimit && config.memoryLimit < 1) {
      errors.push('memoryLimit must be positive');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}