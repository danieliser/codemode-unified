// Code Mode Unified - Main Module Exports
// Local-first, protocol-agnostic code execution platform for AI agents

export { CodeModeExecutor, createExecutor } from './executor.js';
export { getConfig, configManager, defaultConfig } from './config/index.js';

// Core components
export { createSandbox, SandboxManager } from './sandbox/index.js';
export { createMCPManager, MCPManager } from './mcp/index.js';
export { createToolsCoordinator, ToolsCoordinator } from './tools/index.js';
export { createSecurityManager, SecurityManager } from './security/index.js';
export { createAuthenticationManager, AuthenticationManager } from './auth/index.js';
export { createSchemaManager, SchemaManager } from './schema/index.js';

// Types
export type {
  Config,
  ExecutionOptions,
  ExecutionResult,
  ExecutionMetrics,
  ExecutionError,
  AuthContext,
  CapabilitySet,
  UnifiedTool,
  ToolRegistry,
  MCPServerConfig
} from './types/core.js';

// Configuration types
export type {
  ServerConfig,
  SecurityConfig,
  SandboxConfig,
  MCPConfig,
  SchemaConfig,
  LoggingConfig
} from './config/schema.js';

// Quick start function for common use cases
export async function createCodeModeServer(configOverrides?: any) {
  const { getConfig } = await import('./config/index.js');
  const { createExecutor } = await import('./executor.js');

  const config = await getConfig();
  const mergedConfig = { ...config, ...configOverrides };

  const executor = createExecutor({ config: mergedConfig });
  await executor.initialize();

  return executor;
}

// Version information
export const version = '0.1.0';
export const name = '@danieliser/codemode-unified';