# Code Mode Unified - Architecture Specification

## Executive Summary

Code Mode Unified is a local-first, protocol-agnostic code execution platform that transforms traditional tool calling into TypeScript code generation. Instead of LLMs making individual tool calls, they write TypeScript code that executes in secure sandboxes with access to unified APIs.

## Core Innovation

**Traditional Approach:**
```
LLM → Tool Call → MCP Server → Result → LLM → Next Tool Call...
```

**Code Mode Approach:**
```
LLM → Generate TypeScript → Execute in Sandbox → Access Unified APIs → Return Results
```

## Performance Benefits

- **25-77% step reduction** with structured output schemas
- **30-88% speed improvement** with predictive tool outputs
- **20% higher success rate** using code vs JSON tool calling
- **100% success rates** across models with proper implementation
- **5-10ms execution latency** with QuickJS sandbox

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   LLM Client    │────▶│  Code Mode API   │────▶│ QuickJS Sandbox │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                          │
                                ▼                          │
                        ┌──────────────────┐              │
                        │ MCP Aggregator   │◀─────────────┘
                        │                  │
                        └──────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │ HelpScout   │ │ FileSystem  │ │ OpenAPI     │
            │ MCP Server  │ │ MCP Server  │ │ Service     │
            └─────────────┘ └─────────────┘ └─────────────┘
```

## Core Components

### 1. Code Mode API Server
- **Purpose**: Main entry point for LLM interactions
- **Responsibilities**:
  - Execute TypeScript code in sandboxes
  - Manage security policies and resource limits
  - Provide unified API surface to LLMs
  - Handle authentication and authorization

### 2. QuickJS Sandbox Runtime
- **Purpose**: Secure, fast code execution environment
- **Performance**: 5-10ms startup, 2-5MB memory footprint
- **Security**: Capability-based permissions, resource limits
- **Features**: Worker pool management, runtime reuse

### 3. MCP Aggregator
- **Purpose**: Unified interface to multiple MCP servers
- **Features**:
  - Multi-server connection pooling
  - Automatic tool discovery and namespacing
  - Schema normalization across protocols
  - Health monitoring and failover

### 4. Protocol Adapters
- **Purpose**: Convert various tool protocols to unified format
- **Supported**: MCP, OpenAPI, Native Functions, LangChain
- **Features**: Schema validation, type safety, error handling

### 5. Security Manager
- **Purpose**: Enforce security policies and resource limits
- **Features**:
  - Capability-based access control
  - Resource monitoring and limits
  - Audit logging and compliance
  - Threat detection and mitigation

## Implementation Phases

### Phase 1: Core Runtime (Week 1-2)
- QuickJS sandbox with worker pools
- Basic MCP server aggregation
- Manual TypeScript API definitions
- Security framework foundation

### Phase 2: Multi-Protocol Support (Week 3-4)
- OpenAPI adapter implementation
- Native function registration
- OAuth 2.1 authentication system
- Enhanced security policies

### Phase 3: Intelligence Layer (Week 5-6)
- Structured output schema support
- Performance optimization and caching
- Advanced error handling and recovery
- Monitoring and observability

### Phase 4: Automation (Week 7-8)
- Automatic schema conversion (MCP → TypeScript)
- Dynamic API generation and updates
- Machine learning for optimization
- Production deployment tools

## Technology Stack

- **Runtime**: Node.js 20+ with QuickJS WebAssembly
- **Language**: TypeScript with strict type checking
- **Validation**: Zod for schema-first design
- **Authentication**: OAuth 2.1 with PKCE support
- **Testing**: Vitest with comprehensive test coverage
- **Documentation**: TypeDoc with API reference

## Security Architecture

### Sandbox Isolation
```typescript
interface SandboxConfig {
  memoryLimit: 128 * 1024 * 1024;    // 128MB
  executionTimeout: 30000;            // 30 seconds
  capabilities: {
    allowNetworkAccess: false;
    allowFileSystemAccess: false;
    allowSubprocesses: false;
    allowedModules: string[];
  };
}
```

### Resource Limits
- **Memory**: 128MB maximum per execution
- **CPU**: 30-second timeout with graceful termination
- **Network**: Capability-based access control
- **Filesystem**: Virtual filesystem with restricted access

### Authentication Flow
1. Client authenticates with OAuth 2.1 + PKCE
2. JWT tokens with scoped permissions
3. Per-execution capability validation
4. Audit logging for compliance

## API Design

### Execution Endpoint
```typescript
POST /execute
{
  "code": "const result = await mcp.helpscout.searchInboxes('support');",
  "typescript": true,
  "capabilities": ["network:helpscout"],
  "timeout": 30000
}
```

### Response Format
```typescript
{
  "success": true,
  "result": { /* execution output */ },
  "metrics": {
    "executionTime": 45,
    "memoryUsed": 1024000,
    "apiCalls": 3
  },
  "logs": ["console.log output..."]
}
```

## Unified API Surface

### MCP-Derived APIs
```typescript
interface UnifiedMCPAPI {
  helpscout: {
    searchInboxes(query: string): Promise<InboxResult[]>;
    searchConversations(params: ConversationParams): Promise<Conversation[]>;
    getConversationSummary(id: string): Promise<ConversationSummary>;
  };

  filesystem: {
    readFile(path: string): Promise<FileContent>;
    writeFile(path: string, content: string): Promise<void>;
    listDirectory(path: string): Promise<DirectoryListing>;
  };
}
```

### OpenAPI-Derived APIs
```typescript
interface UnifiedOpenAPI {
  github: {
    getRepository(owner: string, repo: string): Promise<Repository>;
    createIssue(params: IssueParams): Promise<Issue>;
    listPullRequests(params: PRParams): Promise<PullRequest[]>;
  };
}
```

## Performance Optimizations

### Worker Pool Management
```typescript
class SandboxPool {
  private workers: QuickJSWorker[] = [];
  private maxWorkers = os.cpus().length;
  private idleTimeout = 30000; // 30 seconds

  async execute(code: string): Promise<Result> {
    const worker = await this.acquireWorker();
    try {
      return await worker.execute(code);
    } finally {
      this.releaseWorker(worker);
    }
  }
}
```

### Connection Pooling
```typescript
class MCPConnectionPool {
  private connections: Map<string, MCPClient> = new Map();

  async getConnection(serverName: string): Promise<MCPClient> {
    if (!this.connections.has(serverName)) {
      const client = await this.createConnection(serverName);
      this.connections.set(serverName, client);
    }
    return this.connections.get(serverName)!;
  }
}
```

## Monitoring and Observability

### Metrics Collection
- Execution latency (p50, p95, p99)
- Memory usage per execution
- Success/failure rates
- Resource limit violations
- Security policy violations

### Health Endpoints
```typescript
GET /health      // Basic health check
GET /metrics     // Prometheus-compatible metrics
GET /debug       // Debug information (development only)
```

## Error Handling Strategy

### Execution Errors
```typescript
interface ExecutionError {
  type: 'timeout' | 'memory' | 'security' | 'runtime';
  message: string;
  stack?: string;
  context: {
    executionTime: number;
    memoryUsed: number;
    codeLength: number;
  };
}
```

### Graceful Degradation
- Fallback to traditional tool calling on sandbox failures
- Circuit breaker pattern for failing MCP servers
- Automatic retry with exponential backoff
- Comprehensive error logging and alerting

## Deployment Considerations

### Local Development
- Single process with embedded QuickJS
- SQLite for configuration storage
- File-based logging
- Hot reload for development

### Production Deployment
- Horizontal scaling with load balancing
- Redis for session management
- PostgreSQL for audit logs
- Structured logging with correlation IDs

## Future Enhancements

### Machine Learning Integration
- Usage pattern analysis for API optimization
- Predictive pre-warming of sandbox workers
- Intelligent error recovery suggestions
- Performance tuning based on execution patterns

### Advanced Security
- Hardware security module integration
- Zero-trust networking model
- Advanced threat detection
- Compliance automation (SOC2, GDPR)

## Success Metrics

### Performance Targets
- **Execution Latency**: <100ms for 95% of requests
- **Memory Efficiency**: <5MB average per execution
- **Success Rate**: >99% for valid code execution
- **Availability**: 99.9% uptime with graceful degradation

### Security Targets
- **Zero Escapes**: No successful sandbox escapes
- **Audit Coverage**: 100% of security events logged
- **Compliance**: Pass all security audits
- **Threat Response**: <5 minute detection and mitigation

This architecture provides a robust foundation for implementing the most advanced Code Mode system available, combining the best patterns from our analysis with innovative solutions to fill critical gaps in the ecosystem.