# CodeGen Service - Example Usage

Complete examples demonstrating how to use the TypeScript code generation system.

## Basic Usage

```typescript
import { MCPManager } from '../mcp/index.js';
import { CodeGenService } from './codegen-service.js';

// Initialize MCP Manager with your servers
const mcpManager = new MCPManager({
  servers: {
    automem: {
      transport: 'stdio',
      command: 'node',
      args: ['./servers/automem/index.js']
    },
    context7: {
      transport: 'stdio',
      command: 'node',
      args: ['./servers/context7/index.js']
    }
  }
});

// Initialize and connect to MCP servers
await mcpManager.initialize();

// Create codegen service with default output path (./generated/mcp.d.ts)
const codegenService = new CodeGenService(mcpManager);

// Generate TypeScript declarations
try {
  const outputPath = await codegenService.generateDeclarations();
  console.log('✅ Generated declarations at:', outputPath);
} catch (error) {
  console.error('❌ Codegen failed:', error);
}
```

## Custom Output Path

```typescript
import { CodeGenService } from './codegen-service.js';

// Specify custom output location
const codegenService = new CodeGenService(mcpManager, {
  outputPath: './src/types/mcp-tools.d.ts'
});

const outputPath = await codegenService.generateDeclarations();
// Result: ./src/types/mcp-tools.d.ts
```

## Using Individual Components

### Schema Discovery Only

```typescript
import { SchemaDiscoveryService } from './schema-discovery.js';

const discovery = new SchemaDiscoveryService(mcpManager);
const schemas = await discovery.discoverSchemas();

console.log(`Discovered ${schemas.length} tools`);
schemas.forEach(schema => {
  console.log(`- ${schema.namespace}: ${schema.description}`);
});

// Example output:
// Discovered 7 tools
// - automem.store_memory: Store a memory with optional tags
// - automem.recall_memory: Recall memories with hybrid search
// - context7.resolve-library-id: Resolve package name to library ID
```

### Type Generation Only

```typescript
import { TypeGenerator } from './type-generator.js';

const typeGen = new TypeGenerator();

const schema = {
  type: 'object',
  properties: {
    content: {
      type: 'string',
      description: 'Memory content to store'
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Optional tags'
    }
  },
  required: ['content']
};

const result = await typeGen.generateType('automem', 'store_memory', schema);

console.log('Interface Name:', result.interfaceName);
// Output: AutomemStoreMemoryArgs

console.log('Type Definition:');
console.log(result.typeDefinition);
// Output:
// /** Generated from automem.store_memory schema */
// interface AutomemStoreMemoryArgs {
//   /** Memory content to store */
//   content: string;
//   /** Optional tags */
//   tags?: string[];
// }
```

### Declaration File Generation Only

```typescript
import { TypeGenerator } from './type-generator.js';
import { DeclarationGenerator } from './declaration-generator.js';

const typeGen = new TypeGenerator();
const declGen = new DeclarationGenerator(
  typeGen,
  './custom-output.d.ts'
);

// Assuming you have schemas from discovery
const declarationFile = await declGen.generateDeclarationFile(schemas);

console.log('File Path:', declarationFile.path);
console.log('Content Size:', declarationFile.content.length, 'bytes');
console.log('Preview:');
console.log(declarationFile.content.substring(0, 500));
```

## Integration with Server Startup

```typescript
import { CodeModeServer } from './server.js';
import { MCPManager } from './mcp/index.js';
import { CodeGenService } from './codegen/index.js';

async function startServer() {
  // Initialize MCP Manager
  const mcpManager = new MCPManager(config.mcp);
  await mcpManager.initialize();
  
  // Generate TypeScript declarations on startup
  console.log('🔧 Generating TypeScript declarations...');
  const codegenService = new CodeGenService(mcpManager, {
    outputPath: './generated/mcp.d.ts'
  });
  
  try {
    await codegenService.generateDeclarations();
    console.log('✅ Type definitions ready for IDE autocomplete');
  } catch (error) {
    console.warn('⚠️  Codegen failed (non-critical):', error);
    // Continue server startup even if codegen fails
  }
  
  // Start main server
  const server = new CodeModeServer(config, mcpManager);
  await server.start();
}

startServer().catch(console.error);
```

## Error Handling

```typescript
import { CodeGenService } from './codegen-service.js';

const codegenService = new CodeGenService(mcpManager);

try {
  const outputPath = await codegenService.generateDeclarations();
  console.log('Success:', outputPath);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
  }
  
  // Graceful degradation - continue without types
  console.warn('Continuing without type generation...');
}
```

## Expected Output Structure

The generated `.d.ts` file will have this structure:

```typescript
/**
 * Auto-generated TypeScript declarations for MCP tools
 * Generated: 2025-09-30T12:00:00.000Z
 *
 * This file provides type-safe access to all MCP server tools
 * available in the codemode-unified execution environment.
 */

/** Result type for MCP tool calls */
interface MCPToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/** Generated from automem.store_memory schema */
interface AutomemStoreMemoryArgs {
  /** Memory content to store */
  content: string;
  /** Optional tags to categorize the memory */
  tags?: string[];
  /** Importance score between 0 and 1 */
  importance?: number;
  /** Optional metadata payload */
  metadata?: Record<string, unknown>;
}

// ... more interfaces ...

declare global {
  const mcp: {
    automem: {
      /**
       * Store a memory with optional tags, importance score, metadata, timestamps, and embedding vector
       */
      store_memory(args: AutomemStoreMemoryArgs): Promise<MCPToolResult>;
      
      // ... more tools ...
    };
    
    context7: {
      /**
       * Resolves a package/product name to a Context7-compatible library ID
       */
      resolve_library_id(args: Context7ResolveLibraryIdArgs): Promise<MCPToolResult>;
      
      // ... more tools ...
    };
  };
}

export {};
```

## IDE Integration

Once generated, TypeScript and your IDE will provide:

1. **Autocomplete** - Type `mcp.` and see all available servers
2. **Tool Discovery** - Type `mcp.automem.` and see all tools
3. **Parameter Hints** - Type `mcp.automem.store_memory({` and see required/optional parameters
4. **Type Checking** - Compile-time errors for invalid tool calls or parameters
5. **Documentation** - Hover over tools to see descriptions from MCP servers

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { CodeGenService } from './codegen-service.js';

describe('CodeGenService', () => {
  it('generates declarations successfully', async () => {
    const mcpManager = await createTestMCPManager();
    const service = new CodeGenService(mcpManager, {
      outputPath: './test-output.d.ts'
    });
    
    const outputPath = await service.generateDeclarations();
    
    expect(outputPath).toBe('./test-output.d.ts');
    // Verify file exists and has content
    const content = await fs.readFile(outputPath, 'utf-8');
    expect(content).toContain('declare global');
    expect(content).toContain('const mcp:');
  });
});
```

## Regeneration on Server Changes

```typescript
import { MCPManager } from './mcp/index.js';
import { CodeGenService } from './codegen/index.js';

const mcpManager = new MCPManager(config.mcp);
await mcpManager.initialize();

const codegenService = new CodeGenService(mcpManager);

// Initial generation
await codegenService.generateDeclarations();

// Listen for server connection changes
mcpManager.on('serverConnected', async (serverName) => {
  console.log(`🔄 New server connected: ${serverName}`);
  console.log('   Regenerating type declarations...');
  await codegenService.generateDeclarations();
});

mcpManager.on('serverDisconnected', async (serverName) => {
  console.log(`🔄 Server disconnected: ${serverName}`);
  console.log('   Regenerating type declarations...');
  await codegenService.generateDeclarations();
});
```
