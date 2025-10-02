/**
 * Bun Runtime Adapter
 *
 * Uses Bun's JavaScriptCore engine for fast execution with full ES2024+ support
 */

import {
  BaseRuntime,
  RuntimeType,
  type RuntimeCapabilities,
  type RuntimeMetrics,
  type RuntimeConfig
} from './base-runtime.js';
import type { ExecutionOptions, ExecutionResult } from '../types/core.js';
import { ErrorType } from '../types/core.js';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

interface BunWorker {
  id: string;
  lastUsed: number;
  isActive: boolean;
  executionCount: number;
}

export class BunRuntime extends BaseRuntime {
  private workers: Map<string, BunWorker> = new Map();
  private workerQueue: string[] = [];
  private totalExecutions: number = 0;
  private totalExecutionTime: number = 0;
  private initTime: number = 0;
  private bunPath: string;

  constructor(config: RuntimeConfig) {
    super(config);
    // Try ~/.bun/bin/bun first, fallback to 'bun' in PATH
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const bunInHome = homeDir ? `${homeDir}/.bun/bin/bun` : '';
    this.bunPath = config.bun?.bunPath || bunInHome || 'bun';
  }

  async initialize(): Promise<void> {
    const startTime = Date.now();

    // Verify Bun is available
    try {
      await this.execBun(['--version']);
    } catch (error) {
      throw new Error(`Bun not found at ${this.bunPath}. Install from https://bun.sh`);
    }

    this.initTime = Date.now() - startTime;
    this.initialized = true;
  }

  async execute(
    code: string,
    options?: ExecutionOptions
  ): Promise<ExecutionResult> {
    if (!this.initialized) {
      throw new Error('Bun runtime not initialized');
    }

    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const tmpFile = join(tmpdir(), `bun-exec-${requestId}.ts`);

    try {
      // Wrap code with logging and error capture
      const wrappedCode = this.wrapCode(code, options);
      await writeFile(tmpFile, wrappedCode);

      // Execute with Bun
      const result = await this.execBun(['run', tmpFile], {
        timeout: options?.timeout || 30000
      });

      const executionTime = Date.now() - startTime;
      this.totalExecutions++;
      this.totalExecutionTime += executionTime;

      // Parse result from JSON output
      const output = this.parseOutput(result.stdout);

      return {
        success: true,
        result: output.result,
        metrics: {
          executionTime,
          memoryUsed: 0,
          cpuTime: 0,
          apiCalls: 0,
          startTime,
          endTime: Date.now()
        },
        logs: output.logs,
        requestId
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: ErrorType.RUNTIME,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          code: 'BUN_EXEC_FAILED',
          timestamp: new Date()
        },
        metrics: {
          executionTime: Date.now() - startTime,
          memoryUsed: 0,
          cpuTime: 0,
          apiCalls: 0,
          startTime,
          endTime: Date.now()
        },
        logs: [],
        requestId
      };
    } finally {
      // Cleanup temp file
      try {
        await unlink(tmpFile);
      } catch {}
    }
  }

  async shutdown(): Promise<void> {
    this.workers.clear();
    this.initialized = false;
  }

  getCapabilities(): RuntimeCapabilities {
    return {
      // Language features - Full ES2024+
      supportsAsync: true,
      supportsConst: true,
      supportsLet: true,
      supportsTopLevelReturn: false,
      supportsTopLevelAwait: true,
      supportsESModules: true,
      supportsCommonJS: true,
      supportsTypeScript: true,

      // Execution characteristics
      isInProcess: false, // Subprocess execution
      isCloudBased: false,
      supportsConcurrency: true,

      // Performance
      typicalStartupMs: 10,
      typicalMemoryMB: 90,

      // Security
      hasNativeIsolation: true, // Process isolation
      supportsFinegrainedPermissions: false
    };
  }

  getMetrics(): RuntimeMetrics {
    return {
      initializationTime: this.initTime,
      workerCount: this.workers.size,
      totalExecutions: this.totalExecutions,
      averageExecutionTime: this.totalExecutions > 0
        ? this.totalExecutionTime / this.totalExecutions
        : 0,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }

  async health(): Promise<{ healthy: boolean; message?: string }> {
    try {
      const result = await this.execute('console.log(1 + 1)', { timeout: 1000 });
      return {
        healthy: result.success,
        message: result.success ? 'Bun runtime healthy' : 'Health check failed'
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getRuntimeType(): RuntimeType {
    return RuntimeType.BUN;
  }

  // Private helper methods

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private wrapCode(code: string, options?: ExecutionOptions): string {
    // Trim the code
    const trimmedCode = code.trim();

    // Check if code is already wrapped by the executor
    const isExecutorWrapped = trimmedCode.includes('// Code Mode Unified - Sandbox Runtime') ||
                             trimmedCode.includes('globalThis._executionState') ||
                             trimmedCode.includes('globalThis._logs');

    if (isExecutorWrapped) {
      // Code is already wrapped by executor
      // The executor evaluates expressions as last statement (e.g., "_result;") inside try-catch
      // We need to find that expression and convert it to a return statement

      // Look for pattern: "_result;" or similar identifier followed by semicolon
      // This appears before the closing brace of the try block
      let matchFound = false;
      const modifiedCode = trimmedCode.replace(
        /(\s+)(_result);/g,
        (match, whitespace, varName) => {
          matchFound = true;
          return `${whitespace}return ${varName};`;
        }
      );

      const finalWrappedCode = `
let __result;
let __logs = [];

// Save original console before executor overrides it
const __originalConsole = {
  log: console.log,
  error: console.error
};

try {
  __result = await (async function() {
    ${modifiedCode}
  })();
  __logs = globalThis._logs || [];
} catch (error) {
  __originalConsole.error('EXECUTION_ERROR:', error.message);
  __originalConsole.error(error.stack);
  process.exit(1);
}

// Use original console to output result (executor's console captures logs)
__originalConsole.log('__RESULT__', JSON.stringify({
  result: __result,
  logs: __logs
}));
`;

      return finalWrappedCode;
    }

    // Not executor-wrapped - apply our own wrapping
    // Check if code is a simple expression (doesn't contain statements)
    const isExpression = !trimmedCode.includes(';') &&
                        !trimmedCode.startsWith('var ') &&
                        !trimmedCode.startsWith('let ') &&
                        !trimmedCode.startsWith('const ') &&
                        !trimmedCode.startsWith('function ');

    let wrappedCode: string;

    if (isExpression) {
      // Simple expression - just return it
      wrappedCode = `return ${trimmedCode};`;
    } else {
      // Complex code - check if it already has a return statement or needs one
      const lines = trimmedCode.split('\n');
      const lastLine = lines[lines.length - 1].trim();

      // Check if code already contains a return statement
      // (avoid wrapping multi-line returns like: return { ... };)
      const hasReturnStatement = trimmedCode.includes('return ');

      // If code already has a return statement, don't modify it
      if (hasReturnStatement) {
        wrappedCode = trimmedCode;
      } else {
        // Check if last line is a bare expression that should become a return
        const isLastLineExpression = !lastLine.startsWith('var ') &&
                                     !lastLine.startsWith('let ') &&
                                     !lastLine.startsWith('const ') &&
                                     !lastLine.startsWith('function ') &&
                                     !lastLine.startsWith('if ') &&
                                     !lastLine.startsWith('for ') &&
                                     !lastLine.startsWith('while ') &&
                                     lastLine.length > 0;

        if (isLastLineExpression) {
          // Replace last line with return statement
          lines[lines.length - 1] = `return ${lastLine}`;
          wrappedCode = lines.join('\n');
        } else {
          wrappedCode = trimmedCode;
        }
      }
    }

    return `
const __logs = [];
const __originalConsole = console.log;
console.log = (...args) => {
  __logs.push(args.join(' '));
  __originalConsole(...args);
};

let __result;
try {
  __result = await (async function() {
    ${wrappedCode}
  })();
} catch (error) {
  console.error('EXECUTION_ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('__RESULT__', JSON.stringify({
  result: __result,
  logs: __logs
}));
`;
  }

  private parseOutput(stdout: string): { result: any; logs: string[] } {
    const lines = stdout.split('\n');
    const resultLine = lines.find(line => line.startsWith('__RESULT__'));

    if (resultLine) {
      const json = resultLine.replace('__RESULT__ ', '');
      return JSON.parse(json);
    }

    return {
      result: undefined,
      logs: lines.filter(line => !line.startsWith('__RESULT__'))
    };
  }

  private execBun(args: string[], options?: { timeout?: number }): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.bunPath, args);
      let stdout = '';
      let stderr = '';
      let resolved = false;

      const cleanup = () => {
        resolved = true;
        proc.removeAllListeners();
        proc.stdout?.removeAllListeners();
        proc.stderr?.removeAllListeners();
      };

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (resolved) return;
        cleanup();

        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Bun exited with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', (error) => {
        if (resolved) return;
        cleanup();
        reject(error);
      });

      if (options?.timeout) {
        setTimeout(() => {
          if (resolved) return;
          cleanup();
          proc.kill('SIGTERM');
          // Give it a moment to terminate gracefully
          setTimeout(() => {
            if (!proc.killed) {
              proc.kill('SIGKILL');
            }
          }, 100);
          reject(new Error('Bun execution timeout'));
        }, options.timeout);
      }
    });
  }
}