/**
 * Code Generation Module
 *
 * TypeScript declaration file generation system for MCP tools.
 * Provides automatic type-safe access to all MCP server tools.
 *
 * @packageDocumentation
 */

// Main orchestrator
export { CodeGenService } from './codegen-service.js';
export type { CodeGenOptions } from './codegen-service.js';

// Component services
export { SchemaDiscoveryService } from './schema-discovery.js';
export type { ToolSchema } from './schema-discovery.js';

export { TypeGenerator } from './type-generator.js';
export type { GeneratedType } from './type-generator.js';

export { DeclarationGenerator } from './declaration-generator.js';
export type { DeclarationFile } from './declaration-generator.js';
