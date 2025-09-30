/**
 * Declaration File Generator
 *
 * Assembles complete TypeScript declaration (.d.ts) file from tool schemas.
 * Generates namespace structure, function signatures, and formats output.
 *
 * Key Features:
 * - Groups tools by MCP server namespace
 * - Generates type-safe function signatures
 * - Includes TSDoc comments for IDE autocomplete
 * - Formats output with Prettier
 * - Creates global 'mcp' namespace declaration
 *
 * @packageDocumentation
 */

import type { TypeGenerator } from './type-generator.js';
import type { ToolSchema } from './schema-discovery.js';

/**
 * Complete declaration file ready for output
 */
export interface DeclarationFile {
  /** Complete .d.ts file content */
  content: string;
  /** Output file path */
  path: string;
}

/**
 * Declaration File Generator
 *
 * Assembles a complete TypeScript declaration file from discovered tool schemas.
 * Groups tools by server, generates type interfaces, creates namespace structure,
 * and formats the final output.
 */
export class DeclarationGenerator {
  /**
   * Create declaration generator
   *
   * @param typeGenerator - TypeGenerator instance for schema-to-TS conversion
   * @param outputPath - File path for generated .d.ts file
   */
  constructor(
    private typeGenerator: TypeGenerator,
    private outputPath: string
  ) {}

  /**
   * Generate complete declaration file from tool schemas
   *
   * Orchestrates the full generation process:
   * 1. Group schemas by server
   * 2. Generate header with metadata
   * 3. Generate type interfaces for all tools
   * 4. Generate MCP namespace with function signatures
   * 5. Format with basic cleanup
   */
  async generateDeclarationFile(
    schemas: ToolSchema[]
  ): Promise<DeclarationFile> {
    console.log('📝 Generating declaration file for ' + schemas.length + ' tools...');

    // Group schemas by server
    const serverGroups = this.groupByServer(schemas);
    const serverNames = Array.from(serverGroups.keys()).join(', ');
    console.log('   Servers: ' + serverNames);

    // Generate header
    let content = this.generateHeader();

    // Generate type interfaces
    content += await this.generateTypeInterfaces(schemas);

    // Generate MCP namespace
    content += this.generateMCPNamespace(serverGroups);

    // Basic formatting (manual, no Prettier dependency needed)
    content = this.formatContent(content);

    console.log('✅ Declaration file generated (' + content.length + ' bytes)');

    return {
      content,
      path: this.outputPath,
    };
  }

  /**
   * Generate file header with metadata and common types
   */
  private generateHeader(): string {
    const timestamp = new Date().toISOString();
    return '/**\n' +
      ' * Auto-generated TypeScript declarations for MCP tools\n' +
      ' * Generated: ' + timestamp + '\n' +
      ' *\n' +
      ' * This file provides type-safe access to all MCP server tools\n' +
      ' * available in the codemode-unified execution environment.\n' +
      ' *\n' +
      ' * @packageDocumentation\n' +
      ' */\n' +
      '\n' +
      '/** Result type for MCP tool calls */\n' +
      'interface MCPToolResult {\n' +
      '  content: Array<{\n' +
      '    type: "text" | "image" | "resource";\n' +
      '    text?: string;\n' +
      '    data?: string;\n' +
      '    mimeType?: string;\n' +
      '  }>;\n' +
      '  isError?: boolean;\n' +
      '}\n' +
      '\n';
  }

  /**
   * Generate TypeScript interfaces for all tool input schemas
   */
  private async generateTypeInterfaces(
    schemas: ToolSchema[]
  ): Promise<string> {
    const interfaces: string[] = [];

    for (const schema of schemas) {
      try {
        const generated = await this.typeGenerator.generateType(
          schema.server,
          schema.tool,
          schema.inputSchema
        );
        interfaces.push(generated.typeDefinition);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn('⚠️  Failed to generate interface for ' + schema.namespace + ':', errorMsg);
        // Continue with other interfaces
      }
    }

    return interfaces.join('\n\n') + '\n\n';
  }

  /**
   * Generate global MCP namespace with function signatures
   */
  private generateMCPNamespace(
    serverGroups: Map<string, ToolSchema[]>
  ): string {
    let namespace = 'declare global {\n';
    namespace += '  const mcp: {\n';

    for (const [serverName, tools] of serverGroups) {
      // Quote server names if they contain hyphens or special characters
      const serverKey = this.needsQuoting(serverName) ? `"${serverName}"` : serverName;
      namespace += '    ' + serverKey + ': {\n';

      for (const tool of tools) {
        const interfaceName = this.getInterfaceName(tool.server, tool.tool);

        // Add JSDoc comment with description
        if (tool.description) {
          namespace += '      /**\n';
          namespace += '       * ' + tool.description + '\n';
          namespace += '       */\n';
        }

        // Quote tool names if they contain hyphens or special characters
        const toolKey = this.needsQuoting(tool.tool) ? `"${tool.tool}"` : tool.tool;

        // Add function signature
        namespace += '      ' + toolKey + '(args: ' + interfaceName + '): Promise<MCPToolResult>;\n';
      }

      namespace += '    };\n';
    }

    namespace += '  };\n';
    namespace += '}\n';
    namespace += '\nexport {};';

    return namespace;
  }

  /**
   * Group tool schemas by server name
   */
  private groupByServer(
    schemas: ToolSchema[]
  ): Map<string, ToolSchema[]> {
    const groups = new Map<string, ToolSchema[]>();

    for (const schema of schemas) {
      if (!groups.has(schema.server)) {
        groups.set(schema.server, []);
      }
      groups.get(schema.server)!.push(schema);
    }

    return groups;
  }

  /**
   * Get interface name for a tool (matches TypeGenerator convention)
   */
  private getInterfaceName(server: string, tool: string): string {
    const serverPart = this.toPascalCase(server);
    const toolPart = this.toPascalCase(tool);
    return serverPart + toolPart + 'Args';
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  /**
   * Check if identifier needs quoting in TypeScript
   *
   * Identifiers with hyphens, spaces, or starting with numbers need quotes
   */
  private needsQuoting(identifier: string): boolean {
    // Check if contains hyphens, spaces, or starts with number
    return /[-\s]/.test(identifier) || /^\d/.test(identifier);
  }

  /**
   * Basic content formatting (simple cleanup, no Prettier dependency)
   */
  private formatContent(content: string): string {
    // Remove excessive blank lines (more than 2 consecutive)
    return content.replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }
}
