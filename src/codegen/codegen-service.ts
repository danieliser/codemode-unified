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
  /** Optional additional output paths to copy generated types to */
  copyToPath?: string | string[];
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
  private checksumPath: string;
  private copyToPaths: string[];
  private cachedChecksum: string = '';

  /**
   * Create code generation service
   *
   * @param mcpManager - Initialized MCP Manager with connected servers
   * @param options - Optional configuration (output path, copy destinations, etc.)
   */
  constructor(
    private mcpManager: MCPManager,
    options: CodeGenOptions = {}
  ) {
    this.outputPath = options.outputPath || './generated/mcp.d.ts';
    this.checksumPath = this.outputPath + '.checksum';

    // Normalize copyToPath to array
    this.copyToPaths = options.copyToPath
      ? Array.isArray(options.copyToPath)
        ? options.copyToPath
        : [options.copyToPath]
      : [];
  }

  /**
   * Load cached checksum from file
   */
  private async loadCachedChecksum(): Promise<string> {
    try {
      const checksum = await fs.readFile(this.checksumPath, 'utf-8');
      return checksum.trim();
    } catch {
      return '';
    }
  }

  /**
   * Save checksum to file
   */
  private async saveCachedChecksum(checksum: string): Promise<void> {
    try {
      await fs.writeFile(this.checksumPath, checksum, 'utf-8');
    } catch (error) {
      console.warn('⚠️  Failed to save checksum file:', error);
    }
  }

  /**
   * Check if type regeneration is needed based on checksum comparison
   * @returns true if types need to be regenerated
   */
  async needsRegeneration(): Promise<boolean> {
    const currentChecksum = this.mcpManager.getToolsChecksum();
    const cachedChecksum = await this.loadCachedChecksum();

    const needsRegen = currentChecksum !== cachedChecksum;

    if (needsRegen) {
      console.log('🔄 MCP tools changed - regeneration needed');
      console.log(`   Cached: ${cachedChecksum || '(none)'}`);
      console.log(`   Current: ${currentChecksum}`);
    } else {
      console.log('✅ MCP tools unchanged - using cached types');
    }

    return needsRegen;
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

      // Step 5: Save checksum for future validation
      console.log('\n🔐 Step 5: Saving Checksum');
      const currentChecksum = this.mcpManager.getToolsChecksum();
      await this.saveCachedChecksum(currentChecksum);
      console.log(`   Checksum: ${currentChecksum}`);

      console.log('\n✅ Code generation complete!');
      console.log('   File: ' + declarationFile.path);
      console.log('   Size: ' + declarationFile.content.length + ' bytes');
      console.log('   Tools: ' + schemas.length);
      console.log('   Checksum: ' + currentChecksum);

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

      // Copy to additional paths if configured
      if (this.copyToPaths.length > 0) {
        const absoluteFilePath = await fs.realpath(filePath);

        for (const copyPath of this.copyToPaths) {
          try {
            const absoluteCopyPath = await fs.realpath(copyPath).catch(() => null);

            // Only copy if paths are different (after resolving)
            if (!absoluteCopyPath || absoluteFilePath !== absoluteCopyPath) {
              const copyDir = dirname(copyPath);
              await fs.mkdir(copyDir, { recursive: true });
              await fs.writeFile(copyPath, content, 'utf-8');
              console.log('   ✅ Copied to: ' + copyPath);
            } else {
              console.log('   ⏭️  Skipped copy (same as output): ' + copyPath);
            }
          } catch (copyError) {
            console.warn('   ⚠️  Failed to copy to ' + copyPath + ':', copyError);
          }
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error('Failed to write declaration file: ' + errorMsg);
    }
  }
}
