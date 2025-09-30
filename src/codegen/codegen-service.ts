/**
 * Code Generation Service
 *
 * Main orchestrator for TypeScript declaration file generation from MCP tools.
 * Coordinates schema discovery, type generation, and declaration file output.
 *
 * Key Features:
 * - Orchestrates full TypeScript codegen workflow
 * - Discovers all MCP tool schemas automatically
 * - Generates type-safe declaration files
 * - Writes output to disk with error handling
 * - Provides simple API for integration
 *
 * @packageDocumentation
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';
import type { MCPManager } from '../mcp/index.js';
import { SchemaDiscoveryService } from './schema-discovery.js';
import { TypeGenerator } from './type-generator.js';
import { DeclarationGenerator } from './declaration-generator.js';

/**
 * Configuration options for code generation
 */
export interface CodeGenOptions {
  /** Output path for generated .d.ts file (default: ./generated/mcp.d.ts) */
  outputPath?: string;
}

/**
 * Code Generation Service
 *
 * Main entry point for MCP TypeScript codegen system. Orchestrates the complete
 * workflow from schema discovery through declaration file generation and output.
 *
 * @example
 * ```typescript
 * // Basic usage with defaults
 * const mcpManager = new MCPManager(config);
 * await mcpManager.initialize();
 *
 * const codegenService = new CodeGenService(mcpManager);
 * const outputPath = await codegenService.generateDeclarations();
 * console.log('Generated:', outputPath);
 * ```
 *
 * @example
 * ```typescript
 * // Custom output path
 * const codegenService = new CodeGenService(mcpManager, {
 *   outputPath: './types/mcp-tools.d.ts'
 * });
 * await codegenService.generateDeclarations();
 * ```
 */
export class CodeGenService {
  private outputPath: string;

  /**
   * Create code generation service
   *
   * @param mcpManager - Initialized MCP Manager with connected servers
   * @param options - Optional configuration (output path, etc.)
   */
  constructor(
    private mcpManager: MCPManager,
    options: CodeGenOptions = {}
  ) {
    this.outputPath = options.outputPath || './generated/mcp.d.ts';
  }

  /**
   * Generate TypeScript declarations for all MCP tools
   *
   * Orchestrates the complete codegen workflow:
   * 1. Discover schemas from all connected MCP servers
   * 2. Generate TypeScript interfaces from JSON schemas
   * 3. Assemble declaration file with namespaces
   * 4. Write declaration file to disk
   *
   * @returns Promise resolving to generated file path
   * @throws Error if generation or file write fails
   *
   * @example
   * ```typescript
   * try {
   *   const outputPath = await codegenService.generateDeclarations();
   *   console.log('✅ Generated declarations at:', outputPath);
   * } catch (error) {
   *   console.error('❌ Codegen failed:', error);
   * }
   * ```
   */
  async generateDeclarations(): Promise<string> {
    console.log('🚀 Starting TypeScript code generation...');
    console.log('   Output: ' + this.outputPath);

    try {
      // Step 1: Discover schemas from MCP servers
      console.log('\n📡 Step 1: Schema Discovery');
      const schemaDiscovery = new SchemaDiscoveryService(this.mcpManager);
      const schemas = await schemaDiscovery.discoverSchemas();

      if (schemas.length === 0) {
        console.warn('⚠️  No tool schemas discovered - generating empty declarations');
      }

      // Step 2: Create type generator
      console.log('\n🔧 Step 2: Type Generation Setup');
      const typeGenerator = new TypeGenerator();

      // Step 3: Create declaration generator and generate file
      console.log('\n📝 Step 3: Declaration File Generation');
      const declarationGenerator = new DeclarationGenerator(
        typeGenerator,
        this.outputPath
      );

      const declarationFile = await declarationGenerator.generateDeclarationFile(
        schemas
      );

      // Step 4: Write to disk
      console.log('\n💾 Step 4: Writing to Disk');
      await this.writeDeclarationFile(
        declarationFile.path,
        declarationFile.content
      );

      console.log('\n✅ Code generation complete!');
      console.log('   File: ' + declarationFile.path);
      console.log('   Size: ' + declarationFile.content.length + ' bytes');
      console.log('   Tools: ' + schemas.length);

      return declarationFile.path;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error('\n❌ Code generation failed:', errorMsg);
      if (errorStack) {
        console.error('   Stack:', errorStack);
      }

      throw new Error('TypeScript code generation failed: ' + errorMsg);
    }
  }

  /**
   * Write declaration file to disk with directory creation
   *
   * @param filePath - Output file path
   * @param content - Declaration file content
   */
  private async writeDeclarationFile(
    filePath: string,
    content: string
  ): Promise<void> {
    try {
      // Ensure output directory exists
      const dir = dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Write declaration file
      await fs.writeFile(filePath, content, 'utf-8');

      console.log('   ✅ Successfully wrote ' + filePath);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error('Failed to write declaration file: ' + errorMsg);
    }
  }
}
