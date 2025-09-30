/**
 * Core type definitions for Code Mode Unified
 */

import type { JSONSchema7 } from 'json-schema';
import type { ZodSchema } from 'zod';
import type { SchemaManagerConfig } from '../schema/index.js';

// Execution Types
export interface ExecutionOptions {
  timeout?: number;                    // Default: 30000ms
  memoryLimit?: number;               // Default: 128MB
  typescript?: boolean;               // Default: true
  capabilities?: CapabilitySet;       // Default: none
  context?: Record<string, unknown>;  // Default: {}
}

export interface ExecutionRequest {
  code: string;
  options?: ExecutionOptions;
  authContext?: AuthContext;
  requestId?: string;
}

export interface ExecutionResult {
  success: boolean;
  result?: unknown;
  error?: ExecutionError;
  metrics: ExecutionMetrics;
  logs: string[];
  requestId: string;
  mcpCalls?: Array<{
    namespace: string;
    toolName: string;
    args: unknown;
    result: unknown;
    executionTime: number;
  }>;
}

export interface ExecutionMetrics {
  executionTime: number;      // Milliseconds
  memoryUsed: number;         // Bytes
  cpuTime: number;            // Milliseconds
  apiCalls: number;           // Count of MCP calls
  startTime: number;          // Unix timestamp
  endTime: number;            // Unix timestamp
}

export interface ExecutionError {
  type: ErrorType;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
  timestamp: Date;
}

export enum ErrorType {
  VALIDATION = 'validation',
  SECURITY = 'security',
  TIMEOUT = 'timeout',
  MEMORY = 'memory',
  NETWORK = 'network',
  MCP = 'mcp',
  RUNTIME = 'runtime'
}

// Security Types
export interface CapabilitySet {
  network?: NetworkCapabilities;
  filesystem?: FilesystemCapabilities;
  mcp?: MCPCapabilities;
  system?: SystemCapabilities;
}

export interface NetworkCapabilities {
  allowedHosts?: string[];        // Default: none
  allowedPorts?: number[];        // Default: none
  maxRequestsPerSecond?: number;  // Default: 10
  maxRequestSize?: number;        // Default: 1MB
}

export interface FilesystemCapabilities {
  allowedPaths?: string[];        // Default: none
  readOnly?: boolean;            // Default: true
  maxFileSize?: number;          // Default: 1MB
  allowedExtensions?: string[];   // Default: none
}

export interface MCPCapabilities {
  allowedServers?: string[];      // Default: none
  allowedTools?: string[];        // Default: none
  maxCallsPerSecond?: number;     // Default: 5
  maxConcurrentCalls?: number;    // Default: 3
}

export interface SystemCapabilities {
  allowEnvironmentAccess?: boolean;  // Default: false
  allowProcessSpawn?: boolean;       // Default: false
  maxProcesses?: number;             // Default: 0
}

// MCP Types
export interface MCPServerConfig {
  name?: string;
  transport?: 'stdio' | 'http' | 'websocket';
  command?: string;
  args?: string[];
  url?: string;
  environment?: Record<string, string>;
  auth?: AuthConfig;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  healthCheck?: HealthCheckConfig;
}

export interface AuthConfig {
  type?: 'bearer' | 'basic' | 'oauth2' | 'api-key';
  token?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string[];
  tokenUrl?: string;
  apiKey?: string;
  header?: string;
}

export interface RetryPolicy {
  maxAttempts?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
  retryOn?: string[];  // Error codes to retry on
}

export interface HealthCheckConfig {
  enabled?: boolean;
  intervalMs?: number;
  timeoutMs?: number;
  failureThreshold?: number;
}

// Tool Types
export interface UnifiedTool {
  id: string;
  name: string;
  description: string;
  namespace: string;
  inputSchema: ZodSchema;
  outputSchema?: ZodSchema;
  execute(args: unknown): Promise<unknown>;
  metadata: ToolMetadata;
}

export interface ToolMetadata {
  source: 'mcp' | 'openapi' | 'native' | 'langchain';
  version: string;
  tags: string[];
  deprecated?: boolean;
  rateLimit?: RateLimit;
  auth?: AuthRequirement;
  documentation?: ToolDocumentation;
}

export interface RateLimit {
  requestsPerSecond: number;
  burstSize: number;
  windowMs: number;
}

export interface AuthRequirement {
  required: boolean;
  scopes?: string[];
  permissions?: string[];
}

export interface ToolDocumentation {
  summary: string;
  description: string;
  examples: ToolExample[];
  parameters: ParameterDoc[];
  returns: ReturnDoc;
}

export interface ToolExample {
  title: string;
  code: string;
  description?: string;
}

export interface ParameterDoc {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: unknown;
  examples?: unknown[];
}

export interface ReturnDoc {
  type: string;
  description: string;
  examples?: unknown[];
}

// Tool Registry Types
export interface ToolRegistry {
  servers: Map<string, ServerInfo>;
  tools: Map<string, ToolInfo>;
  namespaces: Map<string, string[]>;
  lastUpdated: Date;
}

export interface ServerInfo {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  config: MCPServerConfig;
  health: HealthStatus;
  toolCount: number;
  lastSeen: Date;
}

export interface ToolInfo {
  name: string;
  serverName: string;
  description: string;
  inputSchema: JSONSchema7;
  outputSchema?: JSONSchema7;
  namespace: string;
  metadata: Record<string, unknown>;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime?: number;
  error?: string;
  details?: Record<string, unknown>;
}

// Authentication Types
export interface AuthContext {
  userId: string;
  sessionId: string;
  scopes: string[];
  capabilities: CapabilitySet;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
}

export interface CodeModeJWTPayload {
  sub: string;          // User ID
  iat: number;          // Issued at
  exp: number;          // Expires at
  aud: string;          // Audience
  iss: string;          // Issuer
  scopes: string[];     // OAuth scopes
  capabilities: CapabilitySet;
  [key: string]: any;   // Index signature for jose compatibility
}

// Configuration Types
export interface CodeModeConfig {
  server?: ServerConfig;
  sandbox?: SandboxConfig;
  security?: SecurityConfig;
  mcp?: MCPConfig;
  logging?: LoggingConfig;
  schema?: SchemaManagerConfig;
}

// Alias for convenience
export type Config = CodeModeConfig;

export interface ServerConfig {
  port?: number;
  host?: string;
  cors?: CORSConfig;
  rateLimit?: GlobalRateLimit;
  compression?: boolean;
  ssl?: SSLConfig;
}

export interface CORSConfig {
  enabled?: boolean;
  origins?: string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
}

export interface GlobalRateLimit {
  windowMs?: number;
  maxRequests?: number;
  skipSuccessfulRequests?: boolean;
}

export interface SSLConfig {
  enabled?: boolean;
  keyPath?: string;
  certPath?: string;
  caPath?: string;
}

export interface SandboxConfig {
  runtime?: 'quickjs' | 'deno' | 'isolated-vm';
  workers?: WorkerConfig;
  limits?: ResourceLimits;
  security?: SandboxSecurity;
}

export interface WorkerConfig {
  min?: number;
  max?: number;
  idleTimeout?: number;
  maxQueueSize?: number;
  scaling?: ScalingConfig;
}

export interface ScalingConfig {
  enabled?: boolean;
  scaleUpThreshold?: number;
  scaleDownThreshold?: number;
  cooldownMs?: number;
}

export interface ResourceLimits {
  memory?: number;           // Bytes
  timeout?: number;          // Milliseconds
  cpuQuota?: number;        // 0.0 - 1.0
  maxStackSize?: number;    // Bytes
}

export interface SandboxSecurity {
  allowEval?: boolean;
  allowFunction?: boolean;
  allowImports?: boolean;
  allowedModules?: string[];
  blockedModules?: string[];
}

export interface SecurityConfig {
  auth?: AuthProviderConfig;
  capabilities?: DefaultCapabilities;
  audit?: AuditConfig;
}

export interface AuthProviderConfig {
  provider?: 'oauth2' | 'jwt' | 'api-key';
  issuer?: string;
  audience?: string;
  jwksUrl?: string;
  secretKey?: string;
  expirationTime?: number;
}

export interface DefaultCapabilities {
  network?: NetworkCapabilities;
  filesystem?: FilesystemCapabilities;
  mcp?: MCPCapabilities;
  system?: SystemCapabilities;
}

export interface AuditConfig {
  enabled?: boolean;
  logLevel?: 'none' | 'errors' | 'all';
  storage?: 'file' | 'database' | 'remote';
  retention?: number; // Days
}

export interface MCPConfig {
  servers?: Record<string, MCPServerConfig>;
  discovery?: DiscoveryConfig;
  pooling?: PoolingConfig;
}

export interface DiscoveryConfig {
  enabled?: boolean;
  intervalMs?: number;
  directories?: string[];
  filePatterns?: string[];
}

export interface PoolingConfig {
  maxConnections?: number;
  idleTimeout?: number;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface LoggingConfig {
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  format?: 'json' | 'pretty';
  outputs?: LogOutput[];
  correlation?: boolean;
}

export interface LogOutput {
  type?: 'console' | 'file' | 'remote';
  path?: string;
  rotation?: 'daily' | 'weekly' | 'size';
  maxSize?: string;
  maxFiles?: number;
  url?: string;
  headers?: Record<string, string>;
}

// Runtime Types
export interface RuntimeMetrics {
  activeWorkers: number;
  queuedRequests: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  memoryUsage: MemoryUsage;
  uptime: number;
}

export interface MemoryUsage {
  rss: number;          // Resident Set Size
  heapTotal: number;    // Total heap size
  heapUsed: number;     // Used heap size
  external: number;     // External memory
  arrayBuffers: number; // ArrayBuffer memory
}

// API Types
export interface APIRequest {
  code: string;
  options?: ExecutionOptions;
  metadata?: RequestMetadata;
}

export interface RequestMetadata {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  tags?: string[];
  priority?: 'low' | 'normal' | 'high';
}

export interface APIResponse {
  success: boolean;
  result?: unknown;
  error?: ExecutionError;
  metrics: ExecutionMetrics;
  logs: string[];
  requestId: string;
  metadata?: ResponseMetadata;
}

export interface ResponseMetadata {
  version: string;
  timestamp: Date;
  processingTime: number;
  workerId?: string;
}

// WebSocket Types
export interface WebSocketMessage {
  id: string;
  type: MessageType;
  payload: unknown;
  timestamp: number;
}

export enum MessageType {
  EXECUTE = 'execute',
  RESULT = 'result',
  ERROR = 'error',
  LOG = 'log',
  METRICS = 'metrics',
  STATUS = 'status'
}

export interface ExecuteMessage extends WebSocketMessage {
  type: MessageType.EXECUTE;
  payload: APIRequest;
}

export interface ResultMessage extends WebSocketMessage {
  type: MessageType.RESULT;
  payload: APIResponse;
}

export interface LogMessage extends WebSocketMessage {
  type: MessageType.LOG;
  payload: {
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    context?: Record<string, unknown>;
  };
}

export interface MetricsMessage extends WebSocketMessage {
  type: MessageType.METRICS;
  payload: RuntimeMetrics;
}

export interface StatusMessage extends WebSocketMessage {
  type: MessageType.STATUS;
  payload: {
    status: 'connected' | 'disconnected' | 'error';
    message?: string;
  };
}