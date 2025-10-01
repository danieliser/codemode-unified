#!/usr/bin/env node
/**
 * Code Mode Unified - MCP Server
 *
 * Exposes code execution capabilities via Model Context Protocol
 * Can be used with Claude Code and other MCP clients
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  type Tool
} from '@modelcontextprotocol/sdk/types.js';
import { RuntimeFactory, RuntimeType } from './runtime/base-runtime.js';
import type { BaseRuntime } from './runtime/base-runtime.js';
import type { ExecutionResult, ExecutionOptions } from './types/core.js';
import { MCPManager } from './mcp/index.js';
import type { MCPConfig } from './types/core.js';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Server metadata
const SERVER_NAME = 'codemode-unified';
const SERVER_VERSION = '0.1.0';

// Configuration from environment
const TYPE_EXPOSURE_MODE = process.env.CODEMODE_TYPE_EXPOSURE || 'on-demand'; // 'on-demand' | 'auto-include'

// Runtime cache to avoid re-initialization
const runtimeCache = new Map<RuntimeType, BaseRuntime>();

// MCP Manager for accessing other MCP tools
let mcpManager: MCPManager | null = null;

/**
 * Parse structured text responses into JSON objects
 * Attempts to extract key-value pairs from formatted text
 * Returns object with both parsed fields AND original text for flexibility
 */
function parseStructuredText(text: string): any {
  // If it's already a simple value, return as-is
  if (!text.includes('\n') && !text.includes(':')) {
    return text;
  }

  // Try to extract key-value pairs from text
  const result: any = { _text: text };
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  // Extract single-line key-value pairs (e.g., "Memory ID: xyz")
  let foundStructured = false;
  for (const line of lines) {
    const match = line.match(/^([A-Z][A-Za-z\s]+?):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      result[normalizedKey] = value;
      foundStructured = true;
    }
  }

  // If we found structured data, return object with both parsed fields and original text
  // Otherwise just return the original text string
  return foundStructured ? result : text;
}

/**
 * Load MCP configuration from environment variable or service directory
 * NOT greedy - only checks explicit path or own service directory
 */
function loadMCPConfig(): MCPConfig | null {
  try {
    // First priority: explicitly provided path
    const configPath = process.env.MCP_CONFIG_PATH;

    if (configPath) {
      const content = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);
      console.log(`✅ Loaded MCP config from: ${configPath}`);
      return convertMCPJsonToConfig(config);
    }

    // Second priority: service's own directory (NOT parent/home directories)
    // This allows codemode to have its own .mcp.json without loading the one that spawned it
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const serviceDir = join(__dirname, '..');
    const serviceMcpPath = join(serviceDir, '.mcp.json');

    try {
      const content = readFileSync(serviceMcpPath, 'utf-8');
      const config = JSON.parse(content);
      console.log(`✅ Loaded MCP config from service directory: ${serviceMcpPath}`);
      return convertMCPJsonToConfig(config);
    } catch {
      // Service directory config not found - run in standalone mode
    }

    // No config found - run in standalone mode (code execution only)
    console.log('ℹ️  No MCP config found - running in standalone mode (code execution only)');
    return null;
  } catch (error) {
    console.error('❌ Failed to load MCP config:', error);
    return null;
  }
}

/**
 * Convert .mcp.json format to MCPConfig format
 */
function convertMCPJsonToConfig(json: any): MCPConfig {
  const servers: Record<string, any> = {};

  if (json.mcpServers) {
    for (const [name, config] of Object.entries(json.mcpServers as Record<string, any>)) {
      // Skip the codemode server (that's us!)
      if (name === 'codemode' || name === 'codemode-unified') {
        continue;
      }

      // Debug logging for config conversion
      console.log(`🔍 [CONVERTER] Processing server: ${name}`);
      console.log(`🔍 [CONVERTER] Raw config.env keys:`, Object.keys(config.env || {}));
      console.log(`🔍 [CONVERTER] Raw config.env values (first 20 chars):`,
        Object.entries(config.env || {}).reduce((acc, [k, v]) => {
          acc[k] = typeof v === 'string' ? v.substring(0, 20) + '...' : v;
          return acc;
        }, {} as Record<string, any>)
      );

      servers[name] = {
        name,
        transport: config.transport || config.type || 'stdio', // Try transport first, then type, then default to stdio
        command: config.command,
        args: config.args || [],
        env: config.env || {},
        timeout: 30000,
        retryPolicy: {
          maxAttempts: 3,
          backoffMs: 1000,
          maxBackoffMs: 5000,
          retryOn: ['ECONNREFUSED', 'TIMEOUT']
        }
      };

      console.log(`🔍 [CONVERTER] Converted env keys:`, Object.keys(servers[name].env));
    }
  }

  return {
    servers,
    discovery: {
      enabled: false,
      intervalMs: 60000,
      directories: [],
      filePatterns: []
    },
    pooling: {
      maxConnections: 10,
      idleTimeout: 300000,
      reconnectAttempts: 3,
      reconnectDelay: 5000
    }
  };
}

/**
 * Load TypeScript declarations from generated file
 */
function loadTypeScriptDeclarations(): string {
  try {
    const { readFileSync, existsSync } = require('fs');
    const { join } = require('path');
    const declPath = join(__dirname, '../generated/mcp.d.ts');

    if (existsSync(declPath)) {
      return readFileSync(declPath, 'utf-8');
    }
  } catch (error) {
    console.error('⚠️  Could not load TypeScript declarations:', error);
  }
  return '';
}

/**
 * Generate a concise summary of available MCP tools for tool description
 */
function generateMCPToolSummary(): string {
  if (!mcpManager) {
    return '';
  }

  const tools = mcpManager.getAvailableTools();
  if (tools.length === 0) {
    return '';
  }

  // Group by namespace
  const byNamespace = new Map<string, typeof tools>();
  for (const tool of tools) {
    const [namespace] = tool.namespace.split('.', 1);
    if (!byNamespace.has(namespace)) {
      byNamespace.set(namespace, []);
    }
    byNamespace.get(namespace)!.push(tool);
  }

  let summary = '\n\nAvailable MCP Tools:\n';

  for (const [namespace, nsTools] of byNamespace.entries()) {
    const safeNamespace = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(namespace)
      ? `mcp.${namespace}`
      : `mcp["${namespace}"]`;

    summary += `\n${safeNamespace}:\n`;

    for (const tool of nsTools) {
      const toolName = tool.name.replace(`${namespace}_`, '').replace(`${namespace}-`, '');
      const safeToolName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(toolName)
        ? toolName
        : `"${toolName}"`;

      // Get parameter names from schema
      const params = tool.inputSchema?.properties
        ? Object.keys(tool.inputSchema.properties).slice(0, 3).join(', ')
        : 'args';

      summary += `  - ${safeToolName}(${params}${tool.inputSchema?.properties && Object.keys(tool.inputSchema.properties).length > 3 ? ', ...' : ''})`;

      if (tool.description) {
        // Truncate description to first sentence
        const shortDesc = tool.description.split('.')[0] + '.';
        summary += ` // ${shortDesc.substring(0, 80)}${shortDesc.length > 80 ? '...' : ''}`;
      }

      summary += '\n';
    }
  }

  return summary;
}

/**
 * Generate MCP proxy code to inject into sandbox
 */
function generateMCPProxy(includeTypes: boolean = false): string {
  if (!mcpManager) {
    return ''; // No MCP tools available
  }

  const tools = mcpManager.getAvailableTools();
  if (tools.length === 0) {
    return '';
  }

  // Debug: Log available tools
  console.error('🔍 Available MCP tools:', tools.map(t => ({ name: t.name, namespace: t.namespace })));

  let proxyCode = '';

  // Prepend TypeScript declarations if requested
  if (includeTypes) {
    const typeDeclarations = loadTypeScriptDeclarations();
    if (typeDeclarations) {
      proxyCode += `// TypeScript declarations for MCP tools\n`;
      proxyCode += `// @ts-ignore - declarations injected at runtime\n`;
      proxyCode += typeDeclarations + '\n\n';
    }
  }

  // Group tools by namespace
  const byNamespace = new Map<string, typeof tools>();
  for (const tool of tools) {
    const [namespace] = tool.namespace.split('.', 1);
    if (!byNamespace.has(namespace)) {
      byNamespace.set(namespace, []);
    }
    byNamespace.get(namespace)!.push(tool);
  }

  // Generate proxy object
  proxyCode += 'const mcp = {\n';

  for (const [namespace, nsTools] of byNamespace.entries()) {
    // Quote namespace if it contains special characters (like hyphens)
    const safeNamespace = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(namespace)
      ? namespace
      : `"${namespace}"`;

    proxyCode += `  ${safeNamespace}: {\n`;

    for (const tool of nsTools) {
      const toolName = tool.name.replace(`${namespace}_`, '').replace(`${namespace}-`, '');

      // Quote tool name if it contains special characters
      const safeToolName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(toolName)
        ? toolName
        : `"${toolName}"`;

      proxyCode += `    ${safeToolName}: async (args) => {\n`;
      proxyCode += `      const response = await __mcpCall('${tool.namespace}', args);\n`;
      proxyCode += `      return response;\n`;
      proxyCode += `    },\n`;
    }

    proxyCode += `  },\n`;
  }

  proxyCode += '};\n\n';

  return proxyCode;
}

/**
 * Initialize MCP Manager to connect to other MCP servers
 */
async function initializeMCPManager(): Promise<void> {
  const config = loadMCPConfig();

  if (!config || Object.keys(config.servers).length === 0) {
    console.error('📭 No MCP servers configured - running in standalone mode');
    return;
  }

  try {
    console.error('🔌 Initializing MCP Manager...');
    console.error(`   Connecting to ${Object.keys(config.servers).length} MCP server(s)`);

    mcpManager = new MCPManager(config);
    await mcpManager.initialize();

    const tools = mcpManager.getAvailableTools();
    console.error(`✅ MCP Manager initialized - ${tools.length} tools available`);

    // Log available namespaces
    const namespaces = new Set(tools.map(t => t.namespace.split('.')[0]));
    console.error(`   Namespaces: ${Array.from(namespaces).join(', ')}`);
  } catch (error) {
    console.error('⚠️  Failed to initialize MCP Manager:', error);
    console.error('   Continuing without MCP tool access');
    mcpManager = null;
  }
}

async function getRuntime(type: RuntimeType): Promise<BaseRuntime> {
  if (!runtimeCache.has(type)) {
    const runtime = await RuntimeFactory.create({ type });
    runtimeCache.set(type, runtime);
  }
  return runtimeCache.get(type)!;
}

/**
 * Generate tool definitions dynamically based on configuration
 */
function generateToolDefinitions(): Tool[] {
  // Base description for execute_code
  let executeCodeDescription = 'Execute JavaScript/TypeScript code in a sandboxed runtime environment. Supports multiple runtimes with different capabilities.';

  // Add MCP tool information based on mode
  if (mcpManager && TYPE_EXPOSURE_MODE === 'auto-include') {
    // Auto-include mode: Add tool summary directly in description
    executeCodeDescription += ' When MCP integration is enabled, code has access to MCP tools via the global `mcp` object.';
    const toolSummary = generateMCPToolSummary();
    if (toolSummary) {
      executeCodeDescription += toolSummary;
    }
    executeCodeDescription += '\n\nFor complete TypeScript type definitions, read the resource mcp://types/declarations.';
  } else if (mcpManager) {
    // On-demand mode: Just mention the resource
    executeCodeDescription += ' When MCP integration is enabled, code has access to MCP tools via the global `mcp` object (e.g., mcp.automem.store_memory(), mcp["sequential-thinking"].sequentialthinking()). For TypeScript type definitions and API documentation of available MCP tools, read the resource mcp://types/declarations before writing code.';
  }

  return [
    {
      name: 'execute_code',
      description: executeCodeDescription,
      inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The JavaScript or TypeScript code to execute'
        },
        runtime: {
          type: 'string',
          enum: ['quickjs', 'bun', 'deno', 'isolated-vm', 'e2b'],
          description: 'Runtime to use. QuickJS: fast/lightweight but no async. Bun: full TypeScript/async support. Deno: secure with permissions. isolated-vm: V8 isolates. E2B: cloud VMs.',
          default: 'quickjs'
        },
        timeout: {
          type: 'number',
          description: 'Execution timeout in milliseconds',
          default: 30000
        }
      },
      required: ['code']
    }
  },
  {
    name: 'list_runtimes',
    description: 'List all available code execution runtimes with their capabilities and status',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_runtime_capabilities',
    description: 'Get detailed capabilities and constraints for a specific runtime',
    inputSchema: {
      type: 'object',
      properties: {
        runtime: {
          type: 'string',
          enum: ['quickjs', 'bun', 'deno', 'isolated-vm', 'e2b'],
          description: 'Runtime to query'
        }
      },
      required: ['runtime']
    }
  },
  {
    name: 'runtime_health_check',
    description: 'Check if a runtime is operational and ready to execute code',
    inputSchema: {
      type: 'object',
      properties: {
        runtime: {
          type: 'string',
          enum: ['quickjs', 'bun', 'deno', 'isolated-vm', 'e2b'],
          description: 'Runtime to check'
        }
      },
      required: ['runtime']
    }
  }
  ];
}

// Create MCP server
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    }
  }
);

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async (_request) => {
  // Only expose type declarations if MCP integration is enabled
  if (!mcpManager) {
    return { resources: [] };
  }

  return {
    resources: [
      {
        uri: 'mcp://types/declarations',
        name: 'MCP Tool Type Declarations',
        description: 'TypeScript declarations for all available MCP tools. Use these types when writing code that calls MCP tools via the mcp.* proxy.',
        mimeType: 'text/x-typescript'
      }
    ]
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'mcp://types/declarations') {
    const declarations = loadTypeScriptDeclarations();

    if (!declarations) {
      throw new Error('Type declarations not available. Ensure MCP integration is enabled and declarations have been generated.');
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'text/x-typescript',
          text: declarations
        }
      ]
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async (_request) => {
  const prompts = [
    {
      name: 'mcp-tool-example',
      description: 'Example code template for calling MCP tools with proper error handling',
      arguments: [
        {
          name: 'tool_name',
          description: 'The MCP tool to call (e.g., automem.store_memory)',
          required: true
        }
      ]
    },
    {
      name: 'async-handler',
      description: 'Template for async code with proper error handling and logging',
      arguments: []
    },
    {
      name: 'mcp-batch-operations',
      description: 'Template for batching multiple MCP tool calls efficiently',
      arguments: []
    }
  ];

  return { prompts };
});

// Get prompt content
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'mcp-tool-example': {
      const toolName = args?.tool_name || 'automem.store_memory';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Create example code for calling mcp.${toolName}(). Include proper error handling, type-safe arguments, and result processing.`
            }
          },
          {
            role: 'assistant',
            content: {
              type: 'text',
              text: `Here's a type-safe example for mcp.${toolName}():

\`\`\`typescript
try {
  // Read types first for reference
  // Resource: mcp://types/declarations

  const result = await mcp.${toolName}({
    // Add type-safe arguments here based on the TypeScript definitions
    // Check mcp.d.ts for exact parameter types
  });

  console.log('Success:', result);
  return result;
} catch (error) {
  console.error('MCP tool call failed:', error);
  throw error;
}
\`\`\`

Remember to:
1. Read mcp://types/declarations resource for exact types
2. Use proper TypeScript types for all arguments
3. Handle errors appropriately
4. Use the correct namespace (quote if hyphenated: mcp["server-name"])
`
            }
          }
        ]
      };
    }

    case 'async-handler': {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Create an async function template with error handling'
            }
          },
          {
            role: 'assistant',
            content: {
              type: 'text',
              text: `\`\`\`typescript
async function handleOperation() {
  const startTime = Date.now();

  try {
    console.log('Starting operation...');

    // Your async operations here
    const result = await someAsyncCall();

    const duration = Date.now() - startTime;
    console.log(\`Operation completed in \${duration}ms\`);

    return {
      success: true,
      result,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(\`Operation failed after \${duration}ms:\`, error);

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration
    };
  }
}

// Execute and return
return await handleOperation();
\`\`\`
`
            }
          }
        ]
      };
    }

    case 'mcp-batch-operations': {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Create a template for batching multiple MCP tool calls'
            }
          },
          {
            role: 'assistant',
            content: {
              type: 'text',
              text: `\`\`\`typescript
async function batchMCPOperations() {
  console.log('Starting batch operations...');

  try {
    // Execute MCP calls in parallel for better performance
    const results = await Promise.allSettled([
      mcp.automem.store_memory({
        content: 'First memory',
        tags: ['batch'],
        importance: 0.8
      }),
      mcp.automem.store_memory({
        content: 'Second memory',
        tags: ['batch'],
        importance: 0.7
      }),
      mcp["sequential-thinking"].sequentialthinking({
        thought: 'Analyzing batch results',
        nextThoughtNeeded: false,
        thoughtNumber: 1,
        totalThoughts: 1
      })
    ]);

    // Process results
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    console.log(\`Batch complete: \${successful.length} succeeded, \${failed.length} failed\`);

    return {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      results: results.map((r, i) => ({
        index: i,
        status: r.status,
        value: r.status === 'fulfilled' ? r.value : undefined,
        error: r.status === 'rejected' ? r.reason : undefined
      }))
    };
  } catch (error) {
    console.error('Batch operation failed:', error);
    throw error;
  }
}

return await batchMCPOperations();
\`\`\`
`
            }
          }
        ]
      };
    }

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async (_request) => {
  const tools = generateToolDefinitions();
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'execute_code': {
        const { code, runtime = 'quickjs', timeout = 30000 } = args as {
          code: string;
          runtime?: string;
          timeout?: number;
        };

        // Validate runtime type
        const runtimeType = runtime as RuntimeType;
        if (!Object.values(RuntimeType).includes(runtimeType)) {
          throw new Error(`Invalid runtime: ${runtime}. Valid options: ${Object.values(RuntimeType).join(', ')}`);
        }

        // Get or create runtime
        const rt = await getRuntime(runtimeType);

        // Check runtime capabilities
        const capabilities = rt.getCapabilities();
        const supportsAsync = capabilities.supportsAsync;
        const supportsTypeScript = capabilities.supportsTypeScript;

        // Inject MCP proxy if available
        let enhancedCode = code;
        const mcpCalls: Array<{ placeholder: string; namespace: string; args: any }> = [];

        if (mcpManager) {
          // MCP call handler - needed for both async and non-async runtimes
          const mcpHandler = `
// MCP Tool Call Handler
const __mcpCallCounter = { count: 0 };
async function __mcpCall(namespace, args) {
  const id = __mcpCallCounter.count++;
  const placeholder = \`<<MCP_CALL_\${namespace}_\${id}>>\`;
  console.log('__MCP_CALL__', JSON.stringify({ placeholder, namespace, args }));
  return placeholder;
}

`;
          // Generate and prepend MCP proxy (with types for TypeScript-aware runtimes)
          const mcpProxy = generateMCPProxy(supportsTypeScript);
          enhancedCode = mcpHandler + mcpProxy + code;

          // Debug: Log generated code structure to file AND stderr
          const debugInfo = `
=== MCP Proxy Debug Info ===
Timestamp: ${new Date().toISOString()}
MCP Proxy Length: ${mcpProxy.length} chars
Enhanced Code Preview (first 800 chars):
${enhancedCode.substring(0, 800)}
=== End Debug Info ===
`;
          console.error(debugInfo);

          // Also write to debug log file
          try {
            const { appendFileSync } = await import('fs');
            const { tmpdir } = await import('os');
            const { join } = await import('path');
            const debugLogPath = join(tmpdir(), 'codemode-unified-debug.log');
            appendFileSync(debugLogPath, debugInfo + '\n');
            console.error(`📝 Debug log written to: ${debugLogPath}`);
          } catch (e) {
            // Ignore file write errors
          }
        }

        // Execute code
        const options: ExecutionOptions = { timeout };
        const firstResult: ExecutionResult = await rt.execute(enhancedCode, options);

        // Check if there were MCP calls - need two-pass for both runtimes
        // since sandbox can't directly access parent process MCP manager
        let finalResult = firstResult;
        if (mcpManager && firstResult.logs) {
          // Extract MCP calls from logs
          for (const log of firstResult.logs) {
            if (log.startsWith('__MCP_CALL__')) {
              try {
                const callData = JSON.parse(log.substring(12));
                mcpCalls.push(callData);
              } catch {
                // Ignore parsing errors
              }
            }
          }

          // If MCP calls were made, resolve them and re-execute
          if (mcpCalls.length > 0) {
            console.error(`🔧 Resolving ${mcpCalls.length} MCP call(s)...`);

            // Resolve all MCP calls
            const resolutions = await Promise.all(
              mcpCalls.map(async (call) => {
                try {
                  const result = await mcpManager.callTool(call.namespace, call.args);

                  // MCP responses have format: { content: [{type, text}], isError?: boolean }
                  // Extract the actual result from the response
                  let actualValue = result;
                  if (result && result.content && Array.isArray(result.content)) {
                    const textContent = result.content.find((c: any) => c.type === 'text')?.text;
                    if (textContent) {
                      try {
                        // Try parsing as JSON first
                        actualValue = JSON.parse(textContent);
                      } catch {
                        // Not JSON - try parsing structured text (works for any MCP server)
                        actualValue = parseStructuredText(textContent);
                      }
                    }
                  }

                  return {
                    placeholder: call.placeholder,
                    value: actualValue
                  };
                } catch (error) {
                  return {
                    placeholder: call.placeholder,
                    value: { error: error instanceof Error ? error.message : String(error) }
                  };
                }
              })
            );

            // Create resolution code
            let resolutionCode = '// MCP Call Resolutions\n';
            resolutionCode += 'const __mcpResults = {};\n';
            for (const res of resolutions) {
              resolutionCode += `__mcpResults['${res.placeholder}'] = ${JSON.stringify(res.value)};\n`;
            }

            // Update __mcpCall to return actual results
            const mcpHandlerV2 = `
const __mcpCallCounter = { count: 0 };
async function __mcpCall(namespace, args) {
  const id = __mcpCallCounter.count++;
  const placeholder = \`<<MCP_CALL_\${namespace}_\${id}>>\`;
  return __mcpResults[placeholder];
}

`;

            // Re-execute with resolutions
            const mcpProxy = generateMCPProxy();
            const secondPassCode = resolutionCode + mcpHandlerV2 + mcpProxy + code;
            finalResult = await rt.execute(secondPassCode, options);

            // Filter out MCP call logs from final output
            if (finalResult.logs) {
              finalResult.logs = finalResult.logs.filter(log => !log.startsWith('__MCP_CALL__'));
            }
          }
        }

        const result = finalResult;

        // Format response
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: result.success,
                result: result.result,
                logs: result.logs,
                error: result.error,
                metrics: {
                  executionTime: result.metrics.executionTime,
                  memoryUsed: result.metrics.memoryUsed
                },
                runtime: runtimeType
              }, null, 2)
            }
          ]
        };
      }

      case 'list_runtimes': {
        const availableRuntimes = RuntimeFactory.listAvailableTypes();

        const runtimesInfo = await Promise.all(
          availableRuntimes.map(async (type) => {
            try {
              const rt = await getRuntime(type);
              const caps = rt.getCapabilities();

              return {
                type,
                status: 'available',
                capabilities: {
                  async: caps.supportsAsync,
                  typescript: caps.supportsTypeScript,
                  esModules: caps.supportsESModules,
                  topLevelAwait: caps.supportsTopLevelAwait,
                  inProcess: caps.isInProcess,
                  cloudBased: caps.isCloudBased
                },
                performance: {
                  startupMs: caps.typicalStartupMs,
                  memoryMB: caps.typicalMemoryMB
                }
              };
            } catch (error) {
              return {
                type,
                status: 'unavailable',
                error: error instanceof Error ? error.message : String(error)
              };
            }
          })
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ runtimes: runtimesInfo }, null, 2)
            }
          ]
        };
      }

      case 'get_runtime_capabilities': {
        const { runtime } = args as { runtime: string };

        const runtimeType = runtime as RuntimeType;
        if (!Object.values(RuntimeType).includes(runtimeType)) {
          throw new Error(`Invalid runtime: ${runtime}`);
        }

        const rt = await getRuntime(runtimeType);
        const caps = rt.getCapabilities();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                runtime: runtimeType,
                capabilities: caps,
                recommendations: getRecommendations(caps)
              }, null, 2)
            }
          ]
        };
      }

      case 'runtime_health_check': {
        const { runtime } = args as { runtime: string };

        const runtimeType = runtime as RuntimeType;
        if (!Object.values(RuntimeType).includes(runtimeType)) {
          throw new Error(`Invalid runtime: ${runtime}`);
        }

        const rt = await getRuntime(runtimeType);
        const health = await rt.health();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                runtime: runtimeType,
                healthy: health.healthy,
                message: health.message,
                timestamp: new Date().toISOString()
              }, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            tool: name,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Helper: Get recommendations based on capabilities
function getRecommendations(caps: any): string[] {
  const recommendations: string[] = [];

  if (caps.supportsAsync) {
    recommendations.push('✅ Use for async/await and Promise-based code');
  } else {
    recommendations.push('⚠️ No async support - use two-pass execution for async operations');
  }

  if (caps.supportsTypeScript) {
    recommendations.push('✅ TypeScript code runs natively without compilation');
  } else {
    recommendations.push('⚠️ Compile TypeScript before execution');
  }

  if (caps.isInProcess) {
    recommendations.push('✅ Fast startup, low overhead');
  } else {
    recommendations.push('⚠️ Subprocess overhead - consider for moderate frequency execution');
  }

  if (caps.hasNativeIsolation) {
    recommendations.push('✅ Strong isolation for untrusted code');
  }

  if (caps.typicalStartupMs < 10) {
    recommendations.push('✅ Excellent for high-frequency execution');
  } else if (caps.typicalStartupMs > 50) {
    recommendations.push('⚠️ Higher latency - better for complex operations');
  }

  return recommendations;
}

// Graceful shutdown
async function shutdown() {
  console.error('🔄 Shutting down Code Mode MCP server...');

  // Shutdown MCP Manager
  if (mcpManager) {
    try {
      await mcpManager.shutdown();
      console.error('✅ MCP Manager shut down');
    } catch (error) {
      console.error('❌ Error shutting down MCP Manager:', error);
    }
  }

  // Shutdown all cached runtimes
  for (const [type, runtime] of runtimeCache.entries()) {
    try {
      await runtime.shutdown();
      console.error(`✅ Runtime ${type} shut down`);
    } catch (error) {
      console.error(`❌ Error shutting down ${type}:`, error);
    }
  }

  runtimeCache.clear();
  console.error('✅ Code Mode MCP server shut down complete');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
async function main() {
  console.error('🚀 Starting Code Mode Unified MCP Server...');
  console.error(`   Name: ${SERVER_NAME}`);
  console.error(`   Version: ${SERVER_VERSION}`);
  console.error('   Transport: stdio');
  console.error('');

  // Only initialize MCP Manager if explicitly enabled
  // This prevents recursive spawning when codemode is itself an MCP server
  const enableMCPIntegration = process.env.CODEMODE_ENABLE_MCP_INTEGRATION === 'true';

  // Import CodeGenService for TypeScript declaration generation
  const { CodeGenService } = await import('./codegen/index.js');

  if (enableMCPIntegration) {
    console.error('🔌 MCP Integration enabled via CODEMODE_ENABLE_MCP_INTEGRATION');
    await initializeMCPManager();

    // Generate TypeScript declarations after MCP servers are connected
    if (mcpManager) {
      try {
        console.error('🔧 Generating TypeScript declarations for MCP tools...');
        const codegenService = new CodeGenService(mcpManager);
        const outputPath = await codegenService.generateDeclarations();
        console.error(`✅ TypeScript declarations generated: ${outputPath}`);
      } catch (error) {
        console.error('⚠️  Failed to generate TypeScript declarations:', error);
        console.error('   MCP tools will still work, but without IDE autocomplete');
      }
    }
  } else {
    console.error('📭 MCP Integration disabled (set CODEMODE_ENABLE_MCP_INTEGRATION=true to enable)');
    console.error('   Running in standalone mode - code execution only');
  }
  console.error('');

  console.error('Available tools:');
  const tools = generateToolDefinitions();
  tools.forEach(tool => {
    console.error(`   - ${tool.name}: ${tool.description.substring(0, 100)}${tool.description.length > 100 ? '...' : ''}`);
  });
  console.error('');
  console.error('✅ Server ready and listening on stdio');
  console.error('');

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('❌ Fatal error starting MCP server:', error);
  process.exit(1);
});