import { getQuickJS } from 'quickjs-emscripten';
import type { QuickJSContext, QuickJSWASMModule } from 'quickjs-emscripten';
import { cpus } from 'os';
import type {
  ExecutionOptions,
  ExecutionResult,
  ExecutionMetrics,
  ExecutionError,
  CapabilitySet
} from '../types/core.js';
import { ErrorType } from '../types/core.js';

export interface SandboxWorker {
  id: string;
  context: QuickJSContext;
  lastUsed: number;
  isActive: boolean;
  executionCount: number;
}

export class QuickJSSandbox {
  private quickjs: QuickJSWASMModule | null = null;
  private workers: Map<string, SandboxWorker> = new Map();
  private workerQueue: string[] = [];
  private readonly maxWorkers: number;
  private readonly idleTimeout: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    maxWorkers: number = Math.max(2, Math.ceil(cpus().length / 2)),
    idleTimeout: number = 30000
  ) {
    this.maxWorkers = maxWorkers;
    this.idleTimeout = idleTimeout;
  }

  async initialize(): Promise<void> {
    if (this.quickjs) return;

    this.quickjs = await getQuickJS();
    this.startCleanupTimer();
  }

  async execute(
    code: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    if (!this.quickjs) {
      throw new Error('QuickJS runtime not initialized');
    }

    const requestId = this.generateRequestId();
    const startTime = Date.now();
    const logs: string[] = [];
    let worker: SandboxWorker | null = null;

    try {
      worker = await this.acquireWorker();

      // Configure security and capabilities
      this.configureWorkerSecurity(worker, options.capabilities);

      // Set up logging capture
      this.setupLogging(worker, logs);

      // Execute with timeout
      const result = await this.executeWithTimeout(
        worker,
        code,
        options.timeout || 30000,
        logs
      );

      const endTime = Date.now();
      const metrics = this.calculateMetrics(worker, startTime, endTime);

      return {
        success: true,
        result,
        metrics,
        logs,
        requestId
      };

    } catch (error: unknown) {
      const endTime = Date.now();
      const executionError = this.createExecutionError(error, startTime);

      return {
        success: false,
        error: executionError,
        metrics: worker ? this.calculateMetrics(worker, startTime, endTime) : this.getEmptyMetrics(startTime, endTime),
        logs,
        requestId
      };

    } finally {
      if (worker) {
        this.releaseWorker(worker);
      }
    }
  }

  private async acquireWorker(): Promise<SandboxWorker> {
    // Try to get an idle worker
    if (this.workerQueue.length > 0) {
      const workerId = this.workerQueue.shift()!;
      const worker = this.workers.get(workerId);
      if (worker && !worker.isActive) {
        worker.isActive = true;
        worker.lastUsed = Date.now();
        return worker;
      }
    }

    // Create new worker if under limit
    if (this.workers.size < this.maxWorkers) {
      return this.createWorker();
    }

    // Wait for a worker to become available
    return this.waitForWorker();
  }

  private async createWorker(): Promise<SandboxWorker> {
    if (!this.quickjs) {
      throw new Error('QuickJS not initialized');
    }

    const id = this.generateWorkerId();
    const context = this.quickjs.newContext();

    const worker: SandboxWorker = {
      id,
      context,
      lastUsed: Date.now(),
      isActive: true,
      executionCount: 0
    };

    this.workers.set(id, worker);
    return worker;
  }

  private async waitForWorker(): Promise<SandboxWorker> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for available worker'));
      }, 5000);

      const checkForWorker = () => {
        if (this.workerQueue.length > 0) {
          clearTimeout(timeout);
          resolve(this.acquireWorker());
        } else {
          setTimeout(checkForWorker, 10);
        }
      };

      checkForWorker();
    });
  }

  private releaseWorker(worker: SandboxWorker): void {
    worker.isActive = false;
    worker.lastUsed = Date.now();
    worker.executionCount++;

    // Add back to queue if not over execution limit
    if (worker.executionCount < 100) {
      this.workerQueue.push(worker.id);
    } else {
      this.destroyWorker(worker.id);
    }
  }

  private configureWorkerSecurity(worker: SandboxWorker, capabilities?: CapabilitySet): void {
    // No configuration for now - minimal test
  }

  private configureNetworkCapabilities(worker: SandboxWorker, capabilities: any): void {
    // Implement network capability restrictions
    // For now, network access is disabled by default
  }

  private configureFilesystemCapabilities(worker: SandboxWorker, capabilities: any): void {
    // Implement filesystem capability restrictions
    // For now, filesystem access is disabled by default
  }

  private setupLogging(worker: SandboxWorker, logs: string[]): void {
    // Logging is captured through the console.log override
    // Logs are retrieved after execution
  }

  private async executeWithTimeout(
    worker: SandboxWorker,
    code: string,
    timeout: number,
    logs: string[]
  ): Promise<unknown> {
    const { context } = worker;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Execution timeout after ${timeout}ms`));
      }, timeout);

      try {
        // Wrap code in async function to support await
        // Check if code is an expression or statement
        const isExpression = !code.trim().includes(';') &&
                            !code.trim().startsWith('const ') &&
                            !code.trim().startsWith('let ') &&
                            !code.trim().startsWith('var ') &&
                            !code.trim().startsWith('function ') &&
                            !code.trim().startsWith('if ') &&
                            !code.trim().startsWith('for ') &&
                            !code.trim().startsWith('while ') &&
                            !code.trim().startsWith('{');

        // Direct evaluation for now
        const result = context.evalCode(code.trim());

        if (result.error) {
          const error = context.getString(result.error);
          result.error.dispose();
          reject(new Error(error));
        } else if ('value' in result) {
          const value = result.value;
          let jsValue: unknown;

          if (value) {
            try {
              // Use dump() to properly serialize objects/arrays
              jsValue = context.dump(value);
            } catch {
              jsValue = undefined;
            }
            value.dispose();
          }

          // Capture enhanced logs, errors, and execution state
          try {
            // Capture all logs
            const logsResult = context.evalCode('JSON.stringify(globalThis._logs || [])');
            if (!logsResult.error && 'value' in logsResult && logsResult.value) {
              const logsValue = context.getString(logsResult.value);
              if (logsValue) {
                const parsedLogs = JSON.parse(logsValue);
                logs.push(...parsedLogs);
              }
              logsResult.value.dispose();
            }

            // Capture execution state for debugging
            const stateResult = context.evalCode('JSON.stringify(globalThis._executionState || {})');
            if (!stateResult.error && 'value' in stateResult && stateResult.value) {
              const stateValue = context.getString(stateResult.value);
              if (stateValue) {
                const executionState = JSON.parse(stateValue);
                logs.push(`EXECUTION_STATE: ${JSON.stringify(executionState)}`);
              }
              stateResult.value.dispose();
            }

            // Capture any errors
            const errorsResult = context.evalCode('JSON.stringify(globalThis._errors || [])');
            if (!errorsResult.error && 'value' in errorsResult && errorsResult.value) {
              const errorsValue = context.getString(errorsResult.value);
              if (errorsValue) {
                const errors = JSON.parse(errorsValue);
                if (errors.length > 0) {
                  logs.push(`EXECUTION_ERRORS: ${JSON.stringify(errors)}`);
                }
              }
              errorsResult.value.dispose();
            }

            // Capture MCP calls for debugging
            const mcpCallsResult = context.evalCode('JSON.stringify(globalThis.__mcpCalls || [])');
            if (!mcpCallsResult.error && 'value' in mcpCallsResult && mcpCallsResult.value) {
              const mcpCallsValue = context.getString(mcpCallsResult.value);
              if (mcpCallsValue) {
                const mcpCalls = JSON.parse(mcpCallsValue);
                if (mcpCalls.length > 0) {
                  logs.push(`MCP_CALLS: ${JSON.stringify(mcpCalls)}`);
                }
              }
              mcpCallsResult.value.dispose();
            }
          } catch (logError) {
            logs.push(`LOG_CAPTURE_ERROR: ${logError.message}`);
          }

          clearTimeout(timeoutId);
          resolve(jsValue);
        }
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  private calculateMetrics(
    worker: SandboxWorker,
    startTime: number,
    endTime: number
  ): ExecutionMetrics {
    return {
      executionTime: endTime - startTime,
      memoryUsed: this.getMemoryUsage(worker),
      cpuTime: endTime - startTime, // Approximation
      apiCalls: 0, // Will be tracked by MCP layer
      startTime,
      endTime
    };
  }

  private getEmptyMetrics(startTime: number, endTime: number): ExecutionMetrics {
    return {
      executionTime: endTime - startTime,
      memoryUsed: 0,
      cpuTime: 0,
      apiCalls: 0,
      startTime,
      endTime
    };
  }

  private getMemoryUsage(worker: SandboxWorker): number {
    // QuickJS doesn't expose direct memory usage
    // Return approximation based on context usage
    return worker.executionCount * 1024; // 1KB per execution approximation
  }

  private createExecutionError(error: unknown, timestamp: number): ExecutionError {
    const message = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    let errorType: ErrorType = ErrorType.RUNTIME;

    if (message.includes('timeout')) {
      errorType = ErrorType.TIMEOUT;
    } else if (message.includes('memory')) {
      errorType = ErrorType.MEMORY;
    } else if (message.includes('security') || message.includes('permission')) {
      errorType = ErrorType.SECURITY;
    }

    return {
      type: errorType,
      code: errorType.toUpperCase(),
      message,
      stack,
      timestamp: new Date(timestamp)
    };
  }

  private destroyWorker(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.context.dispose();
      this.workers.delete(workerId);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleWorkers();
    }, this.idleTimeout / 2);
  }

  private cleanupIdleWorkers(): void {
    const now = Date.now();
    const toDestroy: string[] = [];

    for (const [id, worker] of this.workers) {
      if (!worker.isActive && now - worker.lastUsed > this.idleTimeout) {
        toDestroy.push(id);
      }
    }

    toDestroy.forEach(id => this.destroyWorker(id));
  }

  private generateWorkerId(): string {
    return `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getWorkerCount(): number {
    return this.workers.size;
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Dispose all workers
    for (const worker of this.workers.values()) {
      worker.context.dispose();
    }

    this.workers.clear();
    this.workerQueue.length = 0;
    this.quickjs = null;
  }
}