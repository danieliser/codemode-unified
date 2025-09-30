# Technical Specification - Code Mode Unified

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Core Components](#core-components)
3. [API Specifications](#api-specifications)
4. [Security Model](#security-model)
5. [Data Formats](#data-formats)
6. [Error Handling](#error-handling)
7. [Performance Requirements](#performance-requirements)

## System Requirements

### Runtime Environment
- **Node.js**: 20.x or later (required for isolated-vm compatibility)
- **TypeScript**: 5.x with strict mode enabled
- **Memory**: Minimum 512MB, recommended 2GB+
- **CPU**: Multi-core recommended for worker pool efficiency
- **Storage**: 100MB for base installation, 1GB+ for caching

### Dependencies
```json
{
  "quickjs-emscripten": "^0.23.0",
  "zod": "^3.22.0",
  "fastify": "^4.24.0",
  "@types/node": "^20.0.0",
  "typescript": "^5.0.0"
}
```

## Core Components

### 1. QuickJS Sandbox Runtime

#### Interface Definition
```typescript
interface SandboxRuntime {
  execute(code: string, options: ExecutionOptions): Promise<ExecutionResult>;
  createWorker(): Promise<SandboxWorker>;
  destroyWorker(worker: SandboxWorker): Promise<void>;
  getMetrics(): RuntimeMetrics;
}

interface ExecutionOptions {
  timeout?: number;                    // Default: 30000ms
  memoryLimit?: number;               // Default: 128MB
  typescript?: boolean;               // Default: true
  capabilities?: CapabilitySet;       // Default: none
  context?: Record<string, unknown>;  // Default: {}
}

interface ExecutionResult {
  success: boolean;
  result?: unknown;
  error?: ExecutionError;
  metrics: ExecutionMetrics;
  logs: string[];
}

interface ExecutionMetrics {
  executionTime: number;      // Milliseconds
  memoryUsed: number;         // Bytes
  cpuTime: number;            // Milliseconds
  apiCalls: number;           // Count of MCP calls
}
```

#### Worker Pool Implementation
```typescript
class SandboxWorkerPool {
  private readonly maxWorkers: number;
  private readonly idleTimeout: number;
  private workers: PooledWorker[] = [];
  private pendingRequests: QueuedRequest[] = [];

  constructor(options: PoolOptions) {
    this.maxWorkers = options.maxWorkers ?? os.cpus().length;
    this.idleTimeout = options.idleTimeout ?? 30000;
  }

  async execute(code: string, options: ExecutionOptions): Promise<ExecutionResult> {
    const worker = await this.acquireWorker();
    const startTime = performance.now();

    try {
      return await worker.execute(code, options);
    } finally {
      this.releaseWorker(worker);
    }
  }

  private async acquireWorker(): Promise<SandboxWorker> {
    // Implementation details for worker acquisition
  }

  private releaseWorker(worker: SandboxWorker): void {
    // Implementation details for worker release
  }
}
```

### 2. MCP Aggregator

#### Core Interface
```typescript
interface MCPAggregator {
  registerServer(config: MCPServerConfig): Promise<void>;
  unregisterServer(name: string): Promise<void>;
  discoverTools(): Promise<ToolRegistry>;
  callTool(serverName: string, toolName: string, args: unknown): Promise<unknown>;
  getServerHealth(): Promise<Map<string, HealthStatus>>;
}

interface MCPServerConfig {
  name: string;
  transport: 'stdio' | 'http' | 'websocket';
  command?: string;
  args?: string[];
  url?: string;
  environment?: Record<string, string>;
  auth?: AuthConfig;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

interface ToolRegistry {
  servers: Map<string, ServerInfo>;
  tools: Map<string, ToolInfo>;
  namespaces: Map<string, string[]>;
}

interface ToolInfo {
  name: string;
  serverName: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  namespace: string;
}
```

#### Connection Management
```typescript
class MCPConnectionManager {
  private connections: Map<string, MCPConnection> = new Map();
  private healthMonitor: HealthMonitor;

  async getConnection(serverName: string): Promise<MCPConnection> {
    if (!this.connections.has(serverName)) {
      const connection = await this.createConnection(serverName);
      this.connections.set(serverName, connection);
      this.healthMonitor.monitor(connection);
    }

    return this.connections.get(serverName)!;
  }

  private async createConnection(serverName: string): Promise<MCPConnection> {
    const config = this.getServerConfig(serverName);

    switch (config.transport) {
      case 'stdio':
        return new StdioMCPConnection(config);
      case 'http':
        return new HttpMCPConnection(config);
      case 'websocket':
        return new WebSocketMCPConnection(config);
      default:
        throw new Error(`Unsupported transport: ${config.transport}`);
    }
  }
}
```

### 3. Protocol Adapters

#### Unified Tool Interface
```typescript
interface UnifiedTool {
  id: string;
  name: string;
  description: string;
  namespace: string;
  inputSchema: ZodSchema;
  outputSchema?: ZodSchema;
  execute(args: unknown): Promise<unknown>;
  metadata: ToolMetadata;
}

interface ToolMetadata {
  source: 'mcp' | 'openapi' | 'native' | 'langchain';
  version: string;
  tags: string[];
  deprecated?: boolean;
  rateLimit?: RateLimit;
  auth?: AuthRequirement;
}

abstract class ProtocolAdapter {
  abstract discoverTools(): Promise<UnifiedTool[]>;
  abstract createTool(definition: unknown): UnifiedTool;
  abstract validateTool(tool: UnifiedTool): boolean;
}
```

#### MCP Protocol Adapter
```typescript
class MCPProtocolAdapter extends ProtocolAdapter {
  constructor(private aggregator: MCPAggregator) {
    super();
  }

  async discoverTools(): Promise<UnifiedTool[]> {
    const registry = await this.aggregator.discoverTools();
    return Array.from(registry.tools.values()).map(tool => this.createTool(tool));
  }

  createTool(mcpTool: ToolInfo): UnifiedTool {
    return {
      id: `${mcpTool.serverName}.${mcpTool.name}`,
      name: mcpTool.name,
      description: mcpTool.description,
      namespace: mcpTool.namespace,
      inputSchema: zodFromJsonSchema(mcpTool.inputSchema),
      outputSchema: mcpTool.outputSchema ? zodFromJsonSchema(mcpTool.outputSchema) : undefined,
      execute: (args) => this.aggregator.callTool(mcpTool.serverName, mcpTool.name, args),
      metadata: {
        source: 'mcp',
        version: '1.0',
        tags: [],
      }
    };
  }
}
```

### 4. TypeScript API Generator

#### Manual Definition Structure
```typescript
interface TypeScriptAPIDefinition {
  namespaces: Record<string, NamespaceDefinition>;
  types: Record<string, TypeDefinition>;
  imports: ImportDefinition[];
}

interface NamespaceDefinition {
  name: string;
  description: string;
  methods: Record<string, MethodDefinition>;
}

interface MethodDefinition {
  name: string;
  description: string;
  parameters: ParameterDefinition[];
  returnType: TypeReference;
  examples?: string[];
  deprecated?: boolean;
}

interface ParameterDefinition {
  name: string;
  type: TypeReference;
  optional: boolean;
  description: string;
  default?: unknown;
}
```

#### Code Generation Engine
```typescript
class TypeScriptAPIGenerator {
  generateAPI(tools: UnifiedTool[]): string {
    const namespaces = this.groupToolsByNamespace(tools);
    const types = this.generateTypes(tools);
    const imports = this.generateImports();

    return this.renderTemplate({
      imports,
      types,
      namespaces: this.generateNamespaces(namespaces)
    });
  }

  private renderTemplate(context: TemplateContext): string {
    return `
// Auto-generated TypeScript API for Code Mode
// Generated at: ${new Date().toISOString()}

${context.imports.map(imp => imp.code).join('\n')}

${context.types.map(type => type.code).join('\n')}

export interface UnifiedAPI {
${context.namespaces.map(ns => `  ${ns.name}: ${ns.interface};`).join('\n')}
}

${context.namespaces.map(ns => ns.implementation).join('\n')}
    `.trim();
  }
}
```

## API Specifications

### REST API Endpoints

#### Execute Code
```http
POST /api/v1/execute
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "code": "const result = await mcp.helpscout.searchInboxes('support'); return result;",
  "typescript": true,
  "timeout": 30000,
  "capabilities": ["network:helpscout"],
  "context": {
    "userId": "user123",
    "requestId": "req456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": [
    {
      "id": "inbox123",
      "name": "Support Inbox",
      "email": "support@company.com"
    }
  ],
  "metrics": {
    "executionTime": 245,
    "memoryUsed": 1048576,
    "cpuTime": 120,
    "apiCalls": 1
  },
  "logs": [
    "Searching inboxes with query: support",
    "Found 1 matching inbox"
  ],
  "requestId": "req456"
}
```

#### List Available Tools
```http
GET /api/v1/tools
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "namespaces": {
    "helpscout": {
      "description": "HelpScout customer support tools",
      "tools": [
        {
          "name": "searchInboxes",
          "description": "Search for inboxes by name or email",
          "inputSchema": {
            "type": "object",
            "properties": {
              "query": { "type": "string" }
            },
            "required": ["query"]
          }
        }
      ]
    }
  }
}
```

### WebSocket API

#### Real-time Execution
```typescript
interface WebSocketMessage {
  id: string;
  type: 'execute' | 'result' | 'error' | 'log';
  payload: unknown;
  timestamp: number;
}

interface ExecuteMessage extends WebSocketMessage {
  type: 'execute';
  payload: {
    code: string;
    options: ExecutionOptions;
  };
}

interface ResultMessage extends WebSocketMessage {
  type: 'result';
  payload: ExecutionResult;
}

interface LogMessage extends WebSocketMessage {
  type: 'log';
  payload: {
    level: 'info' | 'warn' | 'error';
    message: string;
  };
}
```

## Security Model

### Capability-Based Security
```typescript
interface CapabilitySet {
  network?: NetworkCapabilities;
  filesystem?: FilesystemCapabilities;
  mcp?: MCPCapabilities;
  system?: SystemCapabilities;
}

interface NetworkCapabilities {
  allowedHosts?: string[];        // Default: none
  allowedPorts?: number[];        // Default: none
  maxRequestsPerSecond?: number;  // Default: 10
  maxRequestSize?: number;        // Default: 1MB
}

interface FilesystemCapabilities {
  allowedPaths?: string[];        // Default: none
  readOnly?: boolean;            // Default: true
  maxFileSize?: number;          // Default: 1MB
  allowedExtensions?: string[];   // Default: none
}

interface MCPCapabilities {
  allowedServers?: string[];      // Default: none
  allowedTools?: string[];        // Default: none
  maxCallsPerSecond?: number;     // Default: 5
}
```

### Authentication Flow
```typescript
interface AuthContext {
  userId: string;
  sessionId: string;
  scopes: string[];
  capabilities: CapabilitySet;
  expiresAt: Date;
}

class SecurityManager {
  validateCapabilities(context: AuthContext, request: ExecutionRequest): boolean {
    // Validate network access
    if (request.needsNetwork && !context.capabilities.network) {
      return false;
    }

    // Validate MCP access
    if (request.mcpCalls.length > 0) {
      const allowedServers = context.capabilities.mcp?.allowedServers;
      if (!allowedServers || !request.mcpCalls.every(call =>
        allowedServers.includes(call.serverName))) {
        return false;
      }
    }

    return true;
  }
}
```

## Data Formats

### Configuration File Format
```yaml
# codemode.config.yaml
server:
  port: 3000
  host: "0.0.0.0"
  cors:
    enabled: true
    origins: ["http://localhost:3000"]

sandbox:
  runtime: "quickjs"
  workers:
    min: 2
    max: 10
    idleTimeout: "30s"
  limits:
    memory: "128MB"
    timeout: "30s"
    cpuQuota: 0.5

security:
  auth:
    provider: "oauth2"
    issuer: "https://auth.company.com"
    audience: "codemode-api"

  capabilities:
    network:
      maxRequestsPerSecond: 10
      allowedHosts: ["api.helpscout.net"]

    mcp:
      maxCallsPerSecond: 5
      allowedServers: ["helpscout", "filesystem"]

mcp:
  servers:
    helpscout:
      transport: "stdio"
      command: "npx"
      args: ["help-scout-mcp-server"]
      environment:
        HELPSCOUT_CLIENT_ID: "${HELPSCOUT_CLIENT_ID}"
        HELPSCOUT_CLIENT_SECRET: "${HELPSCOUT_CLIENT_SECRET}"

    filesystem:
      transport: "stdio"
      command: "node"
      args: ["./servers/filesystem.js"]

logging:
  level: "info"
  format: "json"
  outputs:
    - type: "console"
    - type: "file"
      path: "./logs/codemode.log"
      rotation: "daily"
```

### TypeScript API Definition Format
```typescript
// Manual API definitions (Phase 1)
export const MCPAPIDefinitions = {
  helpscout: {
    namespace: 'helpscout',
    description: 'HelpScout customer support API',
    methods: {
      searchInboxes: {
        description: 'Search for inboxes by query string',
        parameters: [
          {
            name: 'query',
            type: 'string',
            required: true,
            description: 'Search query for inbox names or emails'
          },
          {
            name: 'limit',
            type: 'number',
            required: false,
            default: 50,
            description: 'Maximum number of results to return'
          }
        ],
        returnType: 'InboxResult[]',
        examples: [
          'await mcp.helpscout.searchInboxes("support")',
          'await mcp.helpscout.searchInboxes("sales", 10)'
        ]
      }
    }
  }
} as const;
```

## Error Handling

### Error Classification
```typescript
enum ErrorType {
  VALIDATION = 'validation',
  SECURITY = 'security',
  TIMEOUT = 'timeout',
  MEMORY = 'memory',
  NETWORK = 'network',
  MCP = 'mcp',
  RUNTIME = 'runtime'
}

interface CodeModeError {
  type: ErrorType;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
  timestamp: Date;
  requestId: string;
}

class ErrorHandler {
  handleExecutionError(error: unknown, context: ExecutionContext): CodeModeError {
    if (error instanceof TimeoutError) {
      return {
        type: ErrorType.TIMEOUT,
        code: 'EXECUTION_TIMEOUT',
        message: `Code execution timed out after ${context.timeout}ms`,
        details: { timeout: context.timeout },
        timestamp: new Date(),
        requestId: context.requestId
      };
    }

    if (error instanceof SecurityError) {
      return {
        type: ErrorType.SECURITY,
        code: 'CAPABILITY_VIOLATION',
        message: error.message,
        details: { violation: error.violation },
        timestamp: new Date(),
        requestId: context.requestId
      };
    }

    // Handle other error types...
  }
}
```

### Recovery Strategies
```typescript
interface RecoveryStrategy {
  canRecover(error: CodeModeError): boolean;
  recover(error: CodeModeError, context: ExecutionContext): Promise<ExecutionResult>;
}

class TimeoutRecoveryStrategy implements RecoveryStrategy {
  canRecover(error: CodeModeError): boolean {
    return error.type === ErrorType.TIMEOUT;
  }

  async recover(error: CodeModeError, context: ExecutionContext): Promise<ExecutionResult> {
    // Attempt recovery with extended timeout
    const extendedContext = {
      ...context,
      timeout: context.timeout * 2
    };

    return this.retryExecution(extendedContext);
  }
}
```

## Performance Requirements

### Latency Targets
- **API Response Time**: <100ms for 95% of requests
- **Code Execution**: <50ms for simple operations
- **MCP Tool Calls**: <200ms per call
- **Worker Pool Allocation**: <10ms

### Throughput Targets
- **Concurrent Executions**: 100+ per second
- **Worker Pool Size**: Auto-scale from 2-50 workers
- **Memory Efficiency**: <5MB average per execution
- **Connection Pool**: Support 1000+ concurrent MCP connections

### Resource Limits
```typescript
const DEFAULT_LIMITS = {
  execution: {
    timeout: 30000,           // 30 seconds
    memoryLimit: 134217728,   // 128MB
    cpuQuota: 0.5,           // 50% of one CPU core
  },

  network: {
    maxRequestsPerSecond: 10,
    maxRequestSize: 1048576,  // 1MB
    timeoutPerRequest: 5000,  // 5 seconds
  },

  mcp: {
    maxCallsPerSecond: 5,
    maxConcurrentCalls: 3,
    timeoutPerCall: 10000,    // 10 seconds
  }
} as const;
```

This technical specification provides the detailed implementation guidance needed to build the Code Mode Unified system with all the performance, security, and functionality requirements identified in our analysis.