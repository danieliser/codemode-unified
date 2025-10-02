import { z } from 'zod';

// Server configuration schema
export const ServerConfigSchema = z.object({
  port: z.number().min(1).max(65535).default(3001),
  host: z.string().default('localhost'),
  cors: z.object({
    enabled: z.boolean().default(true),
    origins: z.array(z.string()).default(['*']),
    methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
    headers: z.array(z.string()).default(['Content-Type', 'Authorization']),
    credentials: z.boolean().default(true)
  }).default({}),
  rateLimit: z.object({
    windowMs: z.number().default(60000), // 1 minute
    maxRequests: z.number().default(100),
    skipSuccessfulRequests: z.boolean().default(false)
  }).default({}),
  compression: z.boolean().default(true),
  ssl: z.object({
    enabled: z.boolean().default(false),
    keyPath: z.string().optional(),
    certPath: z.string().optional(),
    caPath: z.string().optional()
  }).optional()
});

// Security configuration schema
export const SecurityConfigSchema = z.object({
  auth: z.object({
    provider: z.enum(['oauth2', 'jwt', 'api-key']).default('jwt'),
    issuer: z.string().default('code-mode-unified'),
    audience: z.string().default('code-execution'),
    secretKey: z.string().optional(),
    privateKey: z.string().optional(),
    publicKey: z.string().optional(),
    algorithm: z.enum(['HS256', 'RS256']).default('HS256'),
    expirationTime: z.number().default(3600)
  }).default({}),
  capabilities: z.object({
    network: z.object({
      allowedHosts: z.array(z.string()).default([]),
      allowedPorts: z.array(z.number()).default([]),
      maxRequestsPerSecond: z.number().default(0),
      maxRequestSize: z.number().default(0)
    }).default({}),
    filesystem: z.object({
      allowedPaths: z.array(z.string()).default([]),
      readOnly: z.boolean().default(true),
      maxFileSize: z.number().default(0),
      allowedExtensions: z.array(z.string()).default([])
    }).default({}),
    mcp: z.object({
      allowedServers: z.array(z.string()).default([]),
      allowedTools: z.array(z.string()).default([]),
      maxCallsPerSecond: z.number().default(0),
      maxConcurrentCalls: z.number().default(0)
    }).default({}),
    system: z.object({
      allowEnvironmentAccess: z.boolean().default(false),
      allowProcessSpawn: z.boolean().default(false),
      maxProcesses: z.number().default(0)
    }).default({})
  }).default({}),
  audit: z.object({
    enabled: z.boolean().default(true),
    logLevel: z.enum(['none', 'errors', 'all']).default('all'),
    storage: z.enum(['file', 'database', 'remote']).default('file'),
    retention: z.number().default(30)
  }).default({})
});

// Sandbox configuration schema
export const SandboxConfigSchema = z.object({
  runtime: z.enum(['quickjs', 'bun', 'deno', 'isolated-vm', 'e2b']).default('quickjs'),
  workers: z.object({
    min: z.number().default(2),
    max: z.number().default(8),
    idleTimeout: z.number().default(30000),
    maxQueueSize: z.number().default(100),
    scaling: z.object({
      enabled: z.boolean().default(true),
      scaleUpThreshold: z.number().default(0.8),
      scaleDownThreshold: z.number().default(0.2),
      cooldownMs: z.number().default(5000)
    }).default({})
  }).default({}),
  limits: z.object({
    memory: z.number().default(128 * 1024 * 1024), // 128MB
    timeout: z.number().default(30000), // 30 seconds
    cpuQuota: z.number().default(0.5), // 50%
    maxStackSize: z.number().default(1024 * 1024) // 1MB
  }).default({}),
  security: z.object({
    allowEval: z.boolean().default(false),
    allowFunction: z.boolean().default(false),
    allowImports: z.boolean().default(false),
    allowedModules: z.array(z.string()).default(['zod', 'date-fns']),
    blockedModules: z.array(z.string()).default(['fs', 'child_process', 'cluster', 'crypto', 'os', 'path'])
  }).default({})
});

// MCP configuration schema
export const MCPConfigSchema = z.object({
  servers: z.record(z.object({
    name: z.string(),
    transport: z.enum(['stdio', 'http', 'websocket']),
    command: z.string().optional(),
    args: z.array(z.string()).optional(),
    url: z.string().optional(),
    env: z.record(z.string()).optional(),
    auth: z.object({
      type: z.enum(['bearer', 'basic', 'oauth2', 'api-key']),
      token: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      scope: z.array(z.string()).optional(),
      tokenUrl: z.string().optional(),
      apiKey: z.string().optional(),
      header: z.string().optional()
    }).optional(),
    timeout: z.number().default(30000),
    retryPolicy: z.object({
      maxAttempts: z.number().default(3),
      backoffMs: z.number().default(1000),
      maxBackoffMs: z.number().default(5000),
      retryOn: z.array(z.string()).default(['ECONNREFUSED', 'TIMEOUT'])
    }).default({}),
    healthCheck: z.object({
      enabled: z.boolean().default(true),
      intervalMs: z.number().default(30000),
      timeoutMs: z.number().default(5000),
      failureThreshold: z.number().default(3)
    }).default({})
  })).default({}),
  discovery: z.object({
    enabled: z.boolean().default(false),
    intervalMs: z.number().default(60000),
    directories: z.array(z.string()).default([]),
    filePatterns: z.array(z.string()).default(['**/*.mcp.json'])
  }).default({}),
  pooling: z.object({
    maxConnections: z.number().default(10),
    idleTimeout: z.number().default(300000),
    reconnectAttempts: z.number().default(3),
    reconnectDelay: z.number().default(5000)
  }).default({})
});

// Schema generation configuration
export const SchemaConfigSchema = z.object({
  converter: z.object({
    includeOptional: z.boolean().default(true),
    generateInterfaces: z.boolean().default(true),
    generateRuntime: z.boolean().default(true),
    namespaceSeparator: z.string().default('.'),
    typePrefix: z.string().default(''),
    indentation: z.string().default('  ')
  }).default({}),
  autoGenerator: z.object({
    outputDir: z.string().default('./generated/schemas'),
    watchChanges: z.boolean().default(true),
    generateOnStartup: z.boolean().default(true),
    fileNaming: z.object({
      unified: z.string().default('unified-api'),
      namespace: z.string().default('{namespace}-api'),
      extension: z.string().default('.ts')
    }).default({}),
    formatting: z.object({
      prettier: z.boolean().default(false),
      eslint: z.boolean().default(false)
    }).default({})
  }).default({}),
  enableAutoGeneration: z.boolean().default(true),
  watchInterval: z.number().default(5000)
});

// Logging configuration schema
export const LoggingConfigSchema = z.object({
  level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  format: z.enum(['json', 'pretty']).default('pretty'),
  outputs: z.array(z.object({
    type: z.enum(['console', 'file', 'remote']),
    path: z.string().optional(),
    rotation: z.enum(['daily', 'weekly', 'size']).optional(),
    maxSize: z.string().optional(),
    maxFiles: z.number().optional(),
    url: z.string().optional(),
    headers: z.record(z.string()).optional()
  })).default([{ type: 'console' }]),
  correlation: z.boolean().default(true)
});

// Main configuration schema
export const ConfigSchema = z.object({
  server: ServerConfigSchema.default({}),
  security: SecurityConfigSchema.default({}),
  sandbox: SandboxConfigSchema.default({}),
  mcp: MCPConfigSchema.default({}),
  schema: SchemaConfigSchema.default({}),
  logging: LoggingConfigSchema.default({})
});

export type Config = z.infer<typeof ConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
export type SandboxConfig = z.infer<typeof SandboxConfigSchema>;
export type MCPConfig = z.infer<typeof MCPConfigSchema>;
export type SchemaConfig = z.infer<typeof SchemaConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;