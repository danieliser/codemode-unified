/**
 * TypeScript Type Generator
 *
 * Converts JSON Schema definitions from MCP tool input schemas into
 * TypeScript interface definitions using json-schema-to-typescript.
 *
 * Key Features:
 * - Converts JSON Schema to TypeScript interfaces
 * - Handles optional/required fields, arrays, objects, unions, enums
 * - Preserves descriptions as TSDoc comments
 * - Generates consistent PascalCase interface names
 * - Provides graceful fallback to 'any' type on generation failures
 *
 * @packageDocumentation
 */

import { compile } from 'json-schema-to-typescript';
import type { JSONSchema7 } from 'json-schema';

/**
 * Result of TypeScript type generation from a JSON Schema
 */
export interface GeneratedType {
  /** Generated interface name (e.g., "AutomemStoreMemoryArgs") */
  interfaceName: string;
  /** Complete TypeScript interface definition with JSDoc comments */
  typeDefinition: string;
}

/**
 * Options for json-schema-to-typescript compiler
 */
interface CompileOptions {
  /** Banner comment showing source attribution */
  bannerComment: string;
  /** Style preferences for generated code */
  style: {
    /** Use single quotes instead of double quotes */
    singleQuote: boolean;
    /** Include semicolons at end of statements */
    semi: boolean;
  };
}

/**
 * TypeScript Type Generator
 *
 * Converts MCP tool JSON Schema definitions into TypeScript interface definitions.
 * Handles naming conventions (snake_case/kebab-case → PascalCase) and provides
 * error handling with fallback types.
 *
 * @example
 * ```typescript
 * const generator = new TypeGenerator();
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     content: { type: 'string', description: 'Memory content' }
 *   },
 *   required: ['content']
 * };
 *
 * const result = await generator.generateType('automem', 'store_memory', schema);
 * console.log(result.interfaceName); // "AutomemStoreMemoryArgs"
 * console.log(result.typeDefinition); // interface AutomemStoreMemoryArgs { ... }
 * ```
 */
export class TypeGenerator {
  /**
   * Generate TypeScript interface from JSON Schema
   *
   * Converts a JSON Schema definition into a TypeScript interface with proper
   * naming conventions and TSDoc comments. Handles errors gracefully by falling
   * back to 'any' type with warning comments.
   *
   * @param server - MCP server name (e.g., "automem", "context7")
   * @param tool - Tool name (e.g., "store_memory", "resolve-library-id")
   * @param schema - JSON Schema definition from MCP tool inputSchema
   * @returns Promise resolving to generated interface name and definition
   *
   * @example
   * ```typescript
   * const result = await generator.generateType('automem', 'store_memory', {
   *   type: 'object',
   *   properties: {
   *     content: { type: 'string', description: 'Memory content to store' },
   *     tags: { type: 'array', items: { type: 'string' } }
   *   },
   *   required: ['content']
   * });
   *
   * // Result:
   * // {
   * //   interfaceName: "AutomemStoreMemoryArgs",
   * //   typeDefinition: "interface AutomemStoreMemoryArgs { ... }"
   * // }
   * ```
   */
  async generateType(
    server: string,
    tool: string,
    schema: JSONSchema7
  ): Promise<GeneratedType> {
    const interfaceName = this.toInterfaceName(server, tool);

    try {
      // Configure json-schema-to-typescript compiler
      const options: CompileOptions = {
        bannerComment: `/** Generated from ${server}.${tool} schema */`,
        style: {
          singleQuote: true,
          semi: true,
        },
      };

      // Generate TypeScript interface from JSON Schema (cast to any to handle version mismatch)
      const typeDefinition = await compile(schema as any, interfaceName, options);

      return {
        interfaceName,
        typeDefinition,
      };
    } catch (error) {
      // Graceful fallback: log error and return 'any' type with warning
      console.error(
        `❌ Failed to generate type for ${server}.${tool}:`,
        error instanceof Error ? error.message : String(error)
      );

      // Return fallback type definition
      return {
        interfaceName,
        typeDefinition: `
/** ⚠️  Type generation failed for ${server}.${tool} - using 'any' as fallback */
type ${interfaceName} = any;
`.trim(),
      };
    }
  }

  /**
   * Convert server and tool names to TypeScript interface name
   *
   * Converts MCP tool identifier (server.tool) into PascalCase interface name
   * with "Args" suffix. Handles snake_case and kebab-case conventions.
   *
   * @param server - MCP server name
   * @param tool - Tool name
   * @returns PascalCase interface name
   *
   * @example
   * ```typescript
   * toInterfaceName('automem', 'store_memory') // "AutomemStoreMemoryArgs"
   * toInterfaceName('context7', 'resolve-library-id') // "Context7ResolveLibraryIdArgs"
   * toInterfaceName('sequential-thinking', 'sequentialthinking') // "SequentialThinkingSequentialthinkingArgs"
   * ```
   */
  private toInterfaceName(server: string, tool: string): string {
    const serverPart = this.toPascalCase(server);
    const toolPart = this.toPascalCase(tool);
    return `${serverPart}${toolPart}Args`;
  }

  /**
   * Convert string to PascalCase
   *
   * Handles both snake_case and kebab-case inputs. Splits on underscores
   * and hyphens, capitalizes first letter of each part, and joins.
   *
   * @param str - Input string in snake_case or kebab-case
   * @returns PascalCase string
   *
   * @example
   * ```typescript
   * toPascalCase('store_memory') // "StoreMemory"
   * toPascalCase('resolve-library-id') // "ResolveLibraryId"
   * toPascalCase('sequential-thinking') // "SequentialThinking"
   * toPascalCase('automem') // "Automem"
   * ```
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}