import { EventEmitter } from 'events';
import { createSandbox } from './sandbox/index.js';
import { createMCPManager } from './mcp/index.js';
import { createToolsCoordinator } from './tools/index.js';
import { createSecurityManager } from './security/index.js';
import { createAuthenticationManager } from './auth/index.js';
import { createSchemaManager } from './schema/index.js';
import type {
  Config,
  ExecutionOptions,
  ExecutionResult,
  ExecutionRequest,
  AuthContext
} from './types/core.js';
import { ErrorType } from './types/core.js';
import type { SecurityConfig } from './config/schema.js';

export interface ExecutorConfig {
  config: Config;
  mcpConfigPath?: string;
  enableMCP?: boolean;
  enableAuth?: boolean;
  enableSchemaGeneration?: boolean;
}


export class CodeModeExecutor extends EventEmitter {
  private config: Config;
  private mcpConfigPath?: string;
  private sandbox: any;
  private mcpManager: any;
  private toolsCoordinator: any;
  private securityManager: any;
  private authManager: any;
  private schemaManager: any;
  private initialized = false;

  constructor(executorConfig: ExecutorConfig) {
    super();
    this.config = executorConfig.config;
    this.mcpConfigPath = executorConfig.mcpConfigPath;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🚀 Initializing Code Mode Executor...');

    try {
      // Initialize security manager first
      this.securityManager = this.createSecurityManager(this.config.security);

      // Initialize authentication
      this.authManager = this.createAuthenticationManager(this.config.security);

      // Initialize sandbox
      this.sandbox = createSandbox(this.config.sandbox);
      await this.sandbox.initialize();

      // Initialize tools coordinator
      this.toolsCoordinator = this.createToolsCoordinator();

      // Load external MCP configuration if provided
      let mcpConfig = null;
      if (this.mcpConfigPath) {
        try {
          const mcpConfigData = await import('fs/promises').then(fs => fs.readFile(this.mcpConfigPath!, 'utf-8'));
          const loadedConfig = JSON.parse(mcpConfigData);

          // Handle both {mcpServers: ...} and {servers: ...} formats
          const servers = loadedConfig.mcpServers || loadedConfig.servers || {};

          // Normalize 'type' field to 'transport' for each server config
          const normalizedServers: Record<string, any> = {};
          for (const [name, config] of Object.entries(servers)) {
            const cfg = config as any;
            normalizedServers[name] = {
              ...cfg,
              transport: cfg.type || cfg.transport || 'stdio'
            };
            // Remove the 'type' field alias
            delete normalizedServers[name].type;
          }

          mcpConfig = { servers: normalizedServers };
          console.log(`📄 Loaded MCP configuration from ${this.mcpConfigPath}`);
        } catch (error) {
          console.warn(`⚠️  Failed to load MCP config from ${this.mcpConfigPath}:`, error);
        }
      }

      await this.toolsCoordinator.initialize(mcpConfig || this.config.mcp);

      // Initialize MCP manager if enabled
      if (mcpConfig || (this.config.mcp && Object.keys(this.config.mcp.servers || {}).length > 0)) {
        this.mcpManager = createMCPManager(mcpConfig || this.config.mcp);
        await this.mcpManager.initialize();
      }

      // Initialize schema manager if enabled
      if (this.config.schema.enableAutoGeneration) {
        this.schemaManager = createSchemaManager(this.config.schema);
        await this.schemaManager.initialize();

        // Connect schema manager to MCP changes
        if (this.mcpManager) {
          // MCP Manager doesn't emit events directly, the aggregator does
          // We'll need to access the aggregator for events if needed in the future
        }
      }

      this.setupEventHandlers();
      this.initialized = true;

      console.log('✅ Code Mode Executor initialized successfully');

    } catch (error: unknown) {
      console.error('❌ Failed to initialize Code Mode Executor:', error);
      throw error;
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    if (!this.initialized) {
      throw new Error('Executor not initialized');
    }

    const requestId = request.requestId || this.generateRequestId();
    const startTime = Date.now();

    try {
      // Security validation
      const securityResult = this.securityManager.validateExecution(
        request.code,
        request.authContext,
        request.options?.capabilities,
        requestId
      );

      if (!securityResult.allowed) {
        return {
          success: false,
          error: {
            type: ErrorType.SECURITY,
            code: 'SECURITY_VIOLATION',
            message: 'Code execution denied by security policy',
            details: { violations: securityResult.violations },
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
      }

      // Start security monitoring
      this.securityManager.startExecution(requestId, {
        ...request.options,
        capabilities: securityResult.effectiveCapabilities
      });

      // Prepare sandbox injection
      const sandboxInjection = this.createSandboxInjection();

      // Prepare execution code
      const fullCode = this.prepareExecutionCode(request.code, sandboxInjection);

      // Execute in sandbox (first pass to capture MCP calls)
      const result = await this.sandbox.execute(fullCode, {
        ...request.options,
        capabilities: securityResult.effectiveCapabilities
      });

      // Process any MCP calls that were made during execution
      const processedResult = await this.processMCPCalls(result, request.code, sandboxInjection, {
        ...request.options,
        capabilities: securityResult.effectiveCapabilities
      });

      // End security monitoring
      const securityMetrics = this.securityManager.endExecution(requestId);

      // Merge metrics
      const finalResult: ExecutionResult = {
        ...processedResult,
        metrics: {
          ...result.metrics,
          ...securityMetrics
        },
        requestId
      };

      this.emit('executionComplete', finalResult);

      return finalResult;

    } catch (error: unknown) {
      // Handle execution errors
      this.securityManager.endExecution(requestId);

      const executionError: ExecutionResult = {
        success: false,
        error: {
          type: ErrorType.RUNTIME,
          code: 'EXECUTION_ERROR',
          message: (error instanceof Error ? error.message : String(error)),
          stack: error instanceof Error ? error.stack : undefined,
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

      this.emit('executionError', executionError);

      return executionError;
    }
  }

  private createSandboxInjection(): string {
    // Get MCP tools if available
    const mcpTools = this.mcpManager ? this.mcpManager.getAvailableTools() : [];
    const mcpServers = this.mcpManager ? this.mcpManager.getServerStatus() : [];

    // Create MCP tool functions
    let mcpInjection = '';
    if (mcpTools.length > 0) {
      mcpInjection = this.generateMCPInjection(mcpTools);
    }

    return `
// Code Mode Unified - Sandbox Runtime with MCP Integration
globalThis._logs = [];
globalThis._errors = [];
globalThis._debug = [];

globalThis.console = {
  log: function(...args) {
    const message = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try { return JSON.stringify(arg); }
        catch(e) { return String(arg); }
      }
      return String(arg);
    }).join(' ');
    globalThis._logs.push(message);
  },
  error: function(...args) {
    const message = args.map(arg => String(arg)).join(' ');
    globalThis._errors.push(message);
    globalThis._logs.push('ERROR: ' + message);
  },
  warn: function(...args) {
    const message = args.map(arg => String(arg)).join(' ');
    globalThis._logs.push('WARN: ' + message);
  },
  debug: function(...args) {
    const message = args.map(arg => String(arg)).join(' ');
    globalThis._debug.push(message);
    globalThis._logs.push('DEBUG: ' + message);
  }
};

// Enhanced error handling
globalThis._handleError = function(error, context) {
  const errorInfo = {
    message: error.message || String(error),
    stack: error.stack,
    context: context,
    timestamp: new Date().toISOString()
  };
  globalThis._errors.push(errorInfo);
  globalThis._logs.push('EXECUTION ERROR in ' + context + ': ' + errorInfo.message);
  return errorInfo;
};

// Execution tracking
globalThis._executionState = {
  phase: 'initialization',
  completedStatements: 0,
  errors: 0,
  mcpCalls: 0
};

${mcpInjection}
`;
  }

  private generateMCPInjection(mcpTools: any[]): string {
    // Group tools by namespace
    const toolsByNamespace = new Map<string, any[]>();

    for (const tool of mcpTools) {
      const [namespace] = tool.namespace.split('.', 1);
      if (!toolsByNamespace.has(namespace)) {
        toolsByNamespace.set(namespace, []);
      }
      toolsByNamespace.get(namespace)!.push(tool);
    }

    // Generate namespace objects with tool functions
    const namespaceObjects = Array.from(toolsByNamespace.entries()).map(([namespace, tools]) => {
      const toolFunctions = tools.map(tool => {
        const toolName = tool.name;
        return `    ${toolName}: function(args = {}) {
      try {
        globalThis._executionState.mcpCalls++;
        console.debug('Calling MCP tool ${tool.namespace} with args:', JSON.stringify(args));
        const result = globalThis.__mcpCallTool('${tool.namespace}', args);
        console.debug('MCP tool ${tool.namespace} returned:', JSON.stringify(result));
        return result;
      } catch (error) {
        const errorInfo = globalThis._handleError(error, 'MCP tool ${tool.namespace}');
        console.error('MCP tool call failed for ${tool.namespace}:', errorInfo.message);
        throw error;
      }
    }`;
      }).join(',\n');

      return `  ${namespace}: {
${toolFunctions}
  }`;
    }).join(',\n');

    return `
// MCP Tools Integration
// MCP Tool Call Queue (for processing outside sandbox)
globalThis.__mcpCalls = [];
globalThis.__mcpCallId = 0;

globalThis.__mcpCallTool = function(namespace, args) {
  const callId = ++globalThis.__mcpCallId;
  const call = {
    id: callId,
    namespace: namespace,
    args: args,
    timestamp: new Date().toISOString()
  };

  globalThis.__mcpCalls.push(call);

  // Log the call for processing
  console.log('MCP_CALL_TRACKING: ' + JSON.stringify(call));

  // Return a simple placeholder that can be assigned to variables
  // The actual result will be substituted post-execution
  return '__MCP_RESULT_' + callId + '__';
};

// MCP Global Object
globalThis.mcp = {
${namespaceObjects}
};

// Helper to list available tools
globalThis.mcp.listTools = function() {
  const tools = [];
  ${Array.from(toolsByNamespace.entries()).map(([namespace, tools]) =>
    tools.map(tool => `  tools.push({namespace: '${namespace}', name: '${tool.name}', description: '${tool.description}', fullName: '${tool.namespace}'});`).join('\n')
  ).join('\n')}
  return tools;
};
`;
  }

  private prepareExecutionCode(userCode: string, injection: string): string {
    // Check if it's a simple expression
    const isExpression = !userCode.trim().includes(';') &&
                        !userCode.trim().startsWith('const ') &&
                        !userCode.trim().startsWith('let ') &&
                        !userCode.trim().startsWith('var ') &&
                        !userCode.trim().startsWith('function ') &&
                        !userCode.trim().startsWith('if ') &&
                        !userCode.trim().startsWith('for ') &&
                        !userCode.trim().startsWith('while ') &&
                        !userCode.trim().startsWith('{');

    if (isExpression) {
      // For simple expressions, add enhanced execution tracking
      return `
// Code Mode Unified - Sandbox Runtime
${injection}

// User Code Execution (Expression)
globalThis._executionState.phase = 'expression-execution';
try {
  console.debug('Executing expression:', ${JSON.stringify(userCode)});
  const _result = ${userCode};
  globalThis._executionState.phase = 'expression-complete';
  console.debug('Expression result type:', typeof _result);
  _result;
} catch (error) {
  globalThis._handleError(error, 'user-expression');
  throw error;
}
`;
    } else {
      // For complex code, enhanced statement execution with proper error handling
      return `
// Code Mode Unified - Sandbox Runtime
${injection}

// User Code Execution (Statements)
globalThis._executionState.phase = 'statement-execution';
try {
  console.debug('Executing statements:', ${JSON.stringify(userCode)});

  // Execute user code with enhanced tracking
  ${userCode.split(';').map((stmt, i) =>
    stmt.trim() ? `
  try {
    globalThis._executionState.completedStatements = ${i + 1};
    console.debug('Executing statement ${i + 1}:', ${JSON.stringify(stmt.trim())});
    ${stmt.trim()};
  } catch (stmtError) {
    globalThis._handleError(stmtError, 'statement-${i + 1}');
    throw stmtError;
  }` : ''
  ).filter(Boolean).join('\n')}

  globalThis._executionState.phase = 'statements-complete';
  console.log('All statements completed successfully');
} catch (error) {
  globalThis._executionState.phase = 'statements-failed';
  globalThis._executionState.errors++;
  globalThis._handleError(error, 'user-statements');
  throw error;
}
`;
    }
  }

  private setupEventHandlers(): void {
    // Security event handlers
    this.securityManager.on('resourceViolation', (violation: any) => {
      this.emit('securityAlert', { type: 'resource', violation });
    });

    this.securityManager.on('securityViolation', (violation: any) => {
      this.emit('securityAlert', { type: 'security', violation });
    });

    // Authentication event handlers
    this.authManager.on('userAuthenticated', (authContext: AuthContext) => {
      this.emit('userAuthenticated', authContext);
    });

    this.authManager.on('userLoggedOut', (sessionId: string) => {
      this.emit('userLoggedOut', sessionId);
    });

    // MCP event handlers - Skip for now as MCPManager doesn't extend EventEmitter
    // Events are logged by the MCPManager internally
  }

  // Get execution capabilities available to user
  getCapabilities(authContext?: AuthContext): any {
    const tools = this.toolsCoordinator ? this.toolsCoordinator.getAllTools() : { native: [], mcp: [] };
    const mcpServers = this.mcpManager ? this.mcpManager.getServerStatus() : [];

    const securityPolicy = this.securityManager.policyEngine?.getEffectivePolicy?.(authContext) || null;

    return {
      tools,
      mcpServers,
      securityPolicy: securityPolicy ? {
        id: securityPolicy.id,
        name: securityPolicy.name,
        capabilities: securityPolicy.capabilities
      } : null,
      sandbox: {
        runtime: this.config.sandbox.runtime,
        limits: this.config.sandbox.limits
      }
    };
  }

  // Get system health
  getHealth(): any {
    const health: any = {
      status: this.initialized ? 'healthy' : 'initializing',
      components: {}
    };

    if (this.sandbox) {
      health.components.sandbox = { status: 'healthy' };
    }

    if (this.securityManager) {
      health.components.security = this.securityManager.getSecurityHealth();
    }

    if (this.authManager) {
      health.components.auth = this.authManager.getAuthStats();
    }

    if (this.mcpManager) {
      health.components.mcp = {
        servers: this.mcpManager.getServerStatus(),
        tools: this.mcpManager.getAvailableTools().length
      };
    }

    return health;
  }

  // Authentication methods
  async authenticate(token: string): Promise<{ success: boolean; authContext?: AuthContext; error?: string }> {
    if (!this.authManager) {
      return { success: false, error: 'Authentication not configured' };
    }

    return this.authManager.authenticateWithJWT(token);
  }

  async createUserSession(userId: string, scopes: string[]): Promise<{ success: boolean; token?: string; error?: string }> {
    if (!this.authManager) {
      return { success: false, error: 'Authentication not configured' };
    }

    const result = await this.authManager.createUserSession(userId, scopes);
    return {
      success: result.success,
      token: result.authContext?.metadata?.accessToken as string,
      error: result.error
    };
  }

  private createSecurityManager(config: SecurityConfig): any {
    return createSecurityManager(config);
  }

  private createAuthenticationManager(config: SecurityConfig): any {
    return createAuthenticationManager({
      provider: 'jwt' as const,
      jwt: config.auth || {} as any
    });
  }

  private createToolsCoordinator(): any {
    return createToolsCoordinator();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Code Mode Executor...');

    const shutdownPromises = [];

    if (this.sandbox) {
      shutdownPromises.push(this.sandbox.shutdown());
    }

    if (this.mcpManager) {
      shutdownPromises.push(this.mcpManager.shutdown());
    }

    if (this.toolsCoordinator) {
      shutdownPromises.push(this.toolsCoordinator.shutdown());
    }

    if (this.securityManager) {
      shutdownPromises.push(this.securityManager.shutdown());
    }

    if (this.authManager) {
      shutdownPromises.push(this.authManager.shutdown());
    }

    if (this.schemaManager) {
      shutdownPromises.push(this.schemaManager.shutdown());
    }

    await Promise.allSettled(shutdownPromises);

    this.removeAllListeners();
    this.initialized = false;

    console.log('✅ Code Mode Executor shutdown complete');
  }

  private async processMCPCalls(
    result: ExecutionResult,
    originalCode: string,
    sandboxInjection: string,
    executionOptions: any
  ): Promise<ExecutionResult> {
    if (!this.mcpManager || !result.logs) {
      return result;
    }

    // Extract MCP calls from tracking logs
    const trackingLogs = result.logs.filter(log => log.startsWith('MCP_CALL_TRACKING: '));
    if (trackingLogs.length === 0) {
      return result;
    }

    try {
      // Parse all MCP calls from tracking logs
      const mcpCalls = trackingLogs.map(log => {
        const callData = log.replace('MCP_CALL_TRACKING: ', '');
        return JSON.parse(callData);
      });

      console.log(`Processing ${mcpCalls.length} MCP calls...`);

      const mcpResults = [];
      const callMap = new Map<number, any>();

      // Execute all MCP calls and collect results
      for (const call of mcpCalls) {
        try {
          console.log(`Calling MCP tool: ${call.namespace} with args:`, call.args);
          const mcpResult = await this.mcpManager.callTool(call.namespace, call.args);

          mcpResults.push({
            callId: call.id,
            namespace: call.namespace,
            success: true,
            result: mcpResult
          });

          callMap.set(call.id, mcpResult);
          console.log(`MCP tool ${call.namespace} returned:`, mcpResult);
        } catch (error) {
          console.error(`MCP tool call failed for ${call.namespace}:`, error);
          const errorResult = {
            callId: call.id,
            namespace: call.namespace,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
          mcpResults.push(errorResult);
          callMap.set(call.id, { error: errorResult.error });
        }
      }

      // Inject MCP results into globalThis for second pass execution
      console.log(`Injecting ${callMap.size} MCP results into globalThis...`);

      // Create modified sandbox injection that includes MCP results
      const mcpResultsInjection = `
globalThis.__mcpResults = ${JSON.stringify(Object.fromEntries(callMap))};
`;

      // Prepend MCP results to the sandbox injection
      const modifiedSandboxInjection = mcpResultsInjection + sandboxInjection.replace(
        'return \'__MCP_RESULT_\' + callId + \'__\';',
        `if (globalThis.__mcpResults && globalThis.__mcpResults[callId]) {
    return globalThis.__mcpResults[callId];
  }
  return '__MCP_RESULT_' + callId + '__';`
      );

      // Re-execute with the actual MCP results available
      if (mcpResults.length > 0) {
        console.log('Re-executing code with MCP results injected into globalThis...');

        const fullModifiedCode = this.prepareExecutionCode(originalCode, modifiedSandboxInjection);
        const finalResult = await this.sandbox.execute(fullModifiedCode, executionOptions);

        return {
          ...finalResult,
          mcpCalls: mcpResults,
          logs: [...(result.logs || []), ...(finalResult.logs || [])]
        };
      }

      // No MCP results to process
      return {
        ...result,
        mcpCalls: mcpResults
      };

    } catch (error) {
      console.error('Error processing MCP calls:', error);
      return result;
    }
  }
}

// Factory function
export function createExecutor(config: ExecutorConfig): CodeModeExecutor {
  return new CodeModeExecutor(config);
}