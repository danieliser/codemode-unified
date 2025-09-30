/**
 * Deno Runtime Adapter
 *
 * Uses Deno's V8 sandbox with fine-grained permissions for secure execution
 * Similar to Bun but with explicit permission model
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

interface DenoWorker {
  id: string;
  lastUsed: number;
  isActive: boolean;
  executionCount: number;
}

export class DenoRuntime extends BaseRuntime {
  private workers: Map<string, DenoWorker> = new Map();
  private totalExecutions: number = 0;
  private totalExecutionTime: number = 0;
  private initTime: number = 0;
  private denoPath: string;

  constructor(config: RuntimeConfig) {
    super(config);
    // Try ~/.deno/bin/deno first, fallback to 'deno' in PATH
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const denoInHome = homeDir ? `${homeDir}/.deno/bin/deno` : '';
    this.denoPath = config.deno?.denoPath || denoInHome || 'deno';
  }

  async initialize(): Promise<void> {
    const startTime = Date.now();

    // Verify Deno is available
    try {
      await this.execDeno(['--version']);
    } catch (error) {
      throw new Error(`Deno not found at ${this.denoPath}. Install from https://deno.land`);
    }

    this.initTime = Date.now() - startTime;
    this.initialized = true;
  }

  async execute(
    code: string,
    options?: ExecutionOptions
  ): Promise<ExecutionResult> {
    if (!this.initialized) {
      throw new Error('Deno runtime not initialized');
    }

    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const tmpFile = join(tmpdir(), `deno-exec-${requestId}.ts`);

    try {
      // Wrap code with logging and error capture
      const wrappedCode = this.wrapCode(code, options);
      await writeFile(tmpFile, wrappedCode);

      // Execute with Deno with appropriate permissions
      const permissions = this.getPermissions(options);
      const result = await this.execDeno(
        ['run', ...permissions, tmpFile],
        { timeout: options?.timeout || 30000 }
      );

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
          code: 'DENO_EXEC_FAILED',
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
      supportsCommonJS: false, // Deno uses ES modules only
      supportsTypeScript: true,

      // Execution characteristics
      isInProcess: false, // Subprocess execution
      isCloudBased: false,
      supportsConcurrency: true,

      // Performance
      typicalStartupMs: 15,
      typicalMemoryMB: 50,

      // Security
      hasNativeIsolation: true, // Process isolation
      supportsFinegrainedPermissions: true // Deno's permission system
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
        message: result.success ? 'Deno runtime healthy' : 'Health check failed'
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getRuntimeType(): RuntimeType {
    return RuntimeType.DENO;
  }

  // Private helper methods

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPermissions(options?: ExecutionOptions): string[] {
    // Deno requires explicit permissions
    // For AI code execution, we allow network access but restrict everything else
    const permissions: string[] = [
      '--allow-net', // Allow network access (for fetch, APIs)
      '--no-prompt'  // Don't prompt for permissions
    ];

    // Add optional permissions based on options
    if (options?.permissions?.allowRead) {
      permissions.push('--allow-read');
    }
    if (options?.permissions?.allowWrite) {
      permissions.push('--allow-write');
    }
    if (options?.permissions?.allowEnv) {
      permissions.push('--allow-env');
    }

    return permissions;
  }

  private wrapCode(code: string, options?: ExecutionOptions): string {
    // Trim the code
    const trimmedCode = code.trim();

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
const __logs: string[] = [];
const __originalConsole = console.log;
console.log = (...args: any[]) => {
  __logs.push(args.join(' '));
  __originalConsole(...args);
};

let __result: any;
try {
  __result = await (async function() {
    ${wrappedCode}
  })();
} catch (error) {
  console.error('EXECUTION_ERROR:', (error as Error).message);
  console.error((error as Error).stack);
  Deno.exit(1);
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

  private execDeno(args: string[], options?: { timeout?: number }): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.denoPath, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Deno exited with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', reject);

      if (options?.timeout) {
        setTimeout(() => {
          proc.kill();
          reject(new Error('Deno execution timeout'));
        }, options.timeout);
      }
    });
  }
}