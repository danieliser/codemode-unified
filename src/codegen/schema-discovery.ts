/**
 * Schema Discovery Service
 *
 * Extracts tool schemas from MCP Manager by querying all connected servers
 * and collecting their tool definitions with input schemas.
 *
 * Key Features:
 * - Discovers all tools from connected MCP servers
 * - Extracts JSON Schema definitions for tool parameters
 * - Handles server failures gracefully with partial results
 * - Provides structured tool metadata for codegen pipeline
 *
 * @packageDocumentation
 */

import type { MCPManager } from '../mcp/index.js';
import type { ToolInfo } from '../types/core.js';
import type { JSONSchema7 } from 'json-schema';

/**
 * Tool schema metadata extracted from MCP server
 */
export interface ToolSchema {
  /** MCP server name (e.g., "automem", "context7") */
  server: string;
  /** Tool name (e.g., "store_memory", "resolve-library-id") */
  tool: string;
  /** Full namespace identifier (e.g., "automem.store_memory") */
  namespace: string;
  /** Tool description for documentation */
  description?: string;
  /** JSON Schema definition for tool input parameters */
  inputSchema: JSONSchema7;
}

/**
 * Schema Discovery Service
 *
 * Queries the MCP Manager to extract all available tool schemas from
 * connected servers. Handles failures gracefully and provides structured
 * metadata for the TypeScript codegen pipeline.
 *
 * @example
 * ```typescript
 * const mcpManager = new MCPManager(config);
 * await mcpManager.initialize();
 *
 * const discovery = new SchemaDiscoveryService(mcpManager);
 * const schemas = await discovery.discoverSchemas();
 *
 * console.log(`Discovered ${schemas.length} tools`);
 * schemas.forEach(schema => {
 *   console.log(`- ${schema.namespace}: ${schema.description}`);
 * });
 * ```
 */
export class SchemaDiscoveryService {
  /**
   * Create schema discovery service
   *
   * @param mcpManager - Initialized MCP Manager instance
   */
  constructor(private mcpManager: MCPManager) {}

  /**
   * Discover all tool schemas from connected MCP servers
   *
   * Queries each connected server to extract tool definitions and their
   * input schemas. Handles server failures gracefully by logging warnings
   * and continuing with partial results.
   *
   * @returns Promise resolving to array of discovered tool schemas
   *
   * @example
   * ```typescript
   * const schemas = await discovery.discoverSchemas();
   *
   * // Result structure:
   * // [
   * //   {
   * //     server: "automem",
   * //     tool: "store_memory",
   * //     namespace: "automem.store_memory",
   * //     description: "Store a memory with optional tags...",
   * //     inputSchema: { type: "object", properties: {...} }
   * //   },
   * //   ...
   * // ]
   * ```
   */
  async discoverSchemas(): Promise<ToolSchema[]> {
    const schemas: ToolSchema[] = [];

    try {
      // Get all available tools from MCP manager
      const tools: ToolInfo[] = this.mcpManager.getAvailableTools();

      console.log(`🔍 Discovering schemas for ${tools.length} tools...`);

      // Convert ToolInfo to ToolSchema format
      for (const tool of tools) {
        try {
          // Extract server name from namespace (e.g., "automem.store_memory" → "automem")
          const serverName = this.extractServerName(tool.namespace);

          schemas.push({
            server: serverName,
            tool: tool.name,
            namespace: tool.namespace,
            description: tool.description,
            inputSchema: tool.inputSchema as JSONSchema7,
          });
        } catch (error) {
          // Log warning but continue with other tools
          console.warn(
            `⚠️  Failed to extract schema for ${tool.namespace}:`,
            error instanceof Error ? error.message : String(error)
          );
        }
      }

      console.log(`✅ Successfully discovered ${schemas.length} tool schemas`);
    } catch (error) {
      console.error(
        '❌ Schema discovery failed:',
        error instanceof Error ? error.message : String(error)
      );
      // Return empty array on complete failure
      return [];
    }

    return schemas;
  }

  /**
   * Extract server name from namespace
   *
   * Parses the namespace string to extract the server name component.
   * Handles both simple and complex namespace formats.
   *
   * @param namespace - Full namespace (e.g., "automem.store_memory")
   * @returns Server name (e.g., "automem")
   *
   * @example
   * ```typescript
   * extractServerName("automem.store_memory") // "automem"
   * extractServerName("context7.resolve-library-id") // "context7"
   * extractServerName("sequential-thinking.sequentialthinking") // "sequential-thinking"
   * ```
   */
  private extractServerName(namespace: string): string {
    // Split on first dot to get server name
    const parts = namespace.split('.');
    return parts[0] || namespace;
  }
}
