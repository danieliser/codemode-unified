# TypeScript Code Generation System - Technical Design

**Date**: 2025-09-30
**Status**: Design Phase
**Priority**: High
**Dependencies**: codemode-unified MCP bridge (✅ operational)

---

## 1. System Overview

### Purpose
Generate TypeScript type definitions (`.d.ts` files) from MCP server tool schemas to provide:
- IDE autocomplete for all MCP tools
- Compile-time type checking for tool calls
- Automatic runtime proxy injection with type safety

### Design Goals
1. **Zero Developer Friction**: Auto-generate types on server startup
2. **IDE Native**: Full IntelliSense support in VSCode/Cursor/Claude Code
3. **Type Safety**: Compile-time errors for invalid tool calls
4. **Maintainable**: Clean, readable generated TypeScript
5. **Extensible**: Support new MCP servers without code changes

---

## 2. Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server Startup                        │
│  • automem (7 tools)                                         │
│  • sequential-thinking (1 tool)                              │
│  • context7 (2 tools)                                        │
│  • WordPressAPI (12 tools)                                   │
│  • helpscout (8 tools)                                       │
│  • claude-code (15 tools)                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Schema Discovery & Extraction                   │
│  • Fetch tool schemas from MCP manager                       │
│  • Extract inputSchema (JSON Schema format)                  │
│  • Extract tool description, title, required fields          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            TypeScript Type Generator                         │
│  [json-schema-to-typescript]                                 │
│  • Convert JSON Schema → TypeScript interfaces               │
│  • Generate optional/required field types                    │
│  • Handle arrays, objects, unions, enums                     │
│  • Preserve descriptions as TSDoc comments                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Declaration File (.d.ts) Generator                   │
│  • Create namespace structure per MCP server                 │
│  • Generate function signatures for each tool                │
│  • Include TSDoc comments for descriptions                   │
│  • Export global 'mcp' namespace                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Write to .d.ts File                             │
│  • services/codemode-unified/generated/mcp.d.ts              │
│  • Format with Prettier                                      │
│  • Add source attribution comments                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Runtime Proxy Injection (Existing)                   │
│  • Inject typed 'mcp' global into execution context          │
│  • Proxy calls through __mcpCall() handler                   │
│  • Types now match runtime implementation!                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component Design

### 3.1 Schema Discovery Service

**Purpose**: Extract tool schemas from MCP manager

**Location**: `src/codegen/schema-discovery.ts`

**Interface**:
```typescript
interface ToolSchema {
  server: string;           // "automem"
  tool: string;             // "store_memory"
  namespace: string;        // "automem.store_memory"
  description?: string;     // Tool description
  inputSchema: JSONSchema;  // JSON Schema for parameters
}

class SchemaDiscoveryService {
  constructor(private mcpManager: MCPManager) {}

  async discoverSchemas(): Promise<ToolSchema[]> {
    const tools: ToolSchema[] = [];

    for (const [serverName, connection] of this.mcpManager.connections) {
      const serverTools = await connection.client.request(
        { method: 'tools/list' },
        ListToolsResultSchema
      );

      for (const tool of serverTools.tools) {
        tools.push({
          server: serverName,
          tool: tool.name,
          namespace: `${serverName}.${tool.name}`,
          description: tool.description,
          inputSchema: tool.inputSchema
        });
      }
    }

    return tools;
  }
}
```

**Error Handling**:
- Gracefully handle MCP servers that don't respond
- Log warnings for invalid schemas
- Continue with partial results if some servers fail

---

### 3.2 TypeScript Type Generator

**Purpose**: Convert JSON Schema → TypeScript type definitions

**Location**: `src/codegen/type-generator.ts`

**Dependencies**:
- `json-schema-to-typescript` - Core schema transformation
- `@types/json-schema` - JSON Schema type definitions

**Interface**:
```typescript
interface GeneratedType {
  interfaceName: string;  // "AutomemStoreMemoryArgs"
  typeDefinition: string; // "interface AutomemStoreMemoryArgs { ... }"
}

class TypeGenerator {
  async generateType(
    server: string,
    tool: string,
    schema: JSONSchema
  ): Promise<GeneratedType> {
    const interfaceName = this.toInterfaceName(server, tool);

    const options = {
      bannerComment: `/** Generated from ${server}.${tool} schema */`,
      style: {
        singleQuote: true,
        semi: true
      }
    };

    const typeDefinition = await compile(schema, interfaceName, options);

    return {
      interfaceName,
      typeDefinition
    };
  }

  private toInterfaceName(server: string, tool: string): string {
    // automem.store_memory → AutomemStoreMemoryArgs
    const serverPart = this.toPascalCase(server);
    const toolPart = this.toPascalCase(tool);
    return `${serverPart}${toolPart}Args`;
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}
```

**Example Output**:
```typescript
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
```

---

### 3.3 Declaration File Generator

**Purpose**: Assemble complete `.d.ts` file with namespaces and function signatures

**Location**: `src/codegen/declaration-generator.ts`

**Interface**:
```typescript
interface DeclarationFile {
  content: string;  // Complete .d.ts file content
  path: string;     // Output file path
}

class DeclarationGenerator {
  constructor(
    private typeGenerator: TypeGenerator,
    private outputPath: string
  ) {}

  async generateDeclarationFile(
    schemas: ToolSchema[]
  ): Promise<DeclarationFile> {
    // Group schemas by server
    const serverGroups = this.groupByServer(schemas);

    // Generate header
    let content = this.generateHeader();

    // Generate type interfaces
    content += await this.generateTypeInterfaces(schemas);

    // Generate MCP namespace
    content += this.generateMCPNamespace(serverGroups);

    // Format with Prettier
    content = await this.format(content);

    return {
      content,
      path: this.outputPath
    };
  }

  private generateHeader(): string {
    return `
/**
 * Auto-generated TypeScript declarations for MCP tools
 * Generated: ${new Date().toISOString()}
 *
 * This file provides type-safe access to all MCP server tools
 * available in the codemode-unified execution environment.
 *
 * @packageDocumentation
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
`;
  }

  private async generateTypeInterfaces(
    schemas: ToolSchema[]
  ): Promise<string> {
    const interfaces: string[] = [];

    for (const schema of schemas) {
      const generated = await this.typeGenerator.generateType(
        schema.server,
        schema.tool,
        schema.inputSchema
      );
      interfaces.push(generated.typeDefinition);
    }

    return interfaces.join('\n\n');
  }

  private generateMCPNamespace(
    serverGroups: Map<string, ToolSchema[]>
  ): string {
    let namespace = '\n\ndeclare global {\n';
    namespace += '  const mcp: {\n';

    for (const [serverName, tools] of serverGroups) {
      namespace += `    ${serverName}: {\n`;

      for (const tool of tools) {
        const interfaceName = this.typeGenerator.toInterfaceName(
          tool.server,
          tool.tool
        );

        namespace += `      /**\n`;
        namespace += `       * ${tool.description || tool.tool}\n`;
        namespace += `       */\n`;
        namespace += `      ${tool.tool}(args: ${interfaceName}): Promise<MCPToolResult>;\n`;
      }

      namespace += '    };\n';
    }

    namespace += '  };\n';
    namespace += '}\n';
    namespace += '\nexport {};';

    return namespace;
  }

  private async format(content: string): Promise<string> {
    return prettier.format(content, {
      parser: 'typescript',
      singleQuote: true,
      semi: true,
      printWidth: 80
    });
  }

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
}
```

---

### 3.4 Example Generated Output

**File**: `services/codemode-unified/generated/mcp.d.ts`

```typescript
/**
 * Auto-generated TypeScript declarations for MCP tools
 * Generated: 2025-09-30T12:00:00.000Z
 *
 * This file provides type-safe access to all MCP server tools
 * available in the codemode-unified execution environment.
 *
 * @packageDocumentation
 */

/** Result type for MCP tool calls */
interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
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
  /** Optional ISO timestamp */
  timestamp?: string;
  /** Optional embedding vector for semantic search */
  embedding?: number[];
}

/** Generated from automem.recall_memory schema */
interface AutomemRecallMemoryArgs {
  /** Text query to search for in memory content */
  query?: string;
  /** Embedding vector for semantic similarity search */
  embedding?: number[];
  /** Maximum number of memories to return */
  limit?: number;
  /** Return memories containing any of these tags */
  tags?: string[];
  /** Natural language time window (e.g. "today", "last week") */
  time_query?: string;
  /** Explicit ISO timestamp lower bound */
  start?: string;
  /** Explicit ISO timestamp upper bound */
  end?: string;
}

/** Generated from context7.resolve-library-id schema */
interface Context7ResolveLibraryIdArgs {
  /** Library name to search for and retrieve a Context7-compatible library ID */
  libraryName: string;
}

/** Generated from context7.get-library-docs schema */
interface Context7GetLibraryDocsArgs {
  /** Exact Context7-compatible library ID (e.g., '/mongodb/docs', '/vercel/next.js') */
  context7CompatibleLibraryID: string;
  /** Topic to focus documentation on (e.g., 'hooks', 'routing') */
  topic?: string;
  /** Maximum number of tokens of documentation to retrieve (default: 5000) */
  tokens?: number;
}

/** Generated from helpscout.searchInboxes schema */
interface HelpscoutSearchInboxesArgs {
  /** Search query to filter inboxes */
  query?: string;
}

declare global {
  const mcp: {
    automem: {
      /**
       * Store a memory with optional tags, importance score, metadata, timestamps, and embedding vector
       */
      store_memory(args: AutomemStoreMemoryArgs): Promise<MCPToolResult>;

      /**
       * Recall memories with hybrid semantic/keyword search and optional time/tag filters
       */
      recall_memory(args: AutomemRecallMemoryArgs): Promise<MCPToolResult>;

      /**
       * Create an association between two memories with a relationship type and strength
       */
      associate_memories(args: AutomemAssociateMemoriesArgs): Promise<MCPToolResult>;

      /**
       * Update an existing memory (content, tags, metadata, timestamps, importance)
       */
      update_memory(args: AutomemUpdateMemoryArgs): Promise<MCPToolResult>;

      /**
       * Delete a memory and its embedding
       */
      delete_memory(args: AutomemDeleteMemoryArgs): Promise<MCPToolResult>;

      /**
       * Retrieve memories that contain specific tags
       */
      search_memory_by_tag(args: AutomemSearchMemoryByTagArgs): Promise<MCPToolResult>;

      /**
       * Check the health status of the AutoMem service and its connected databases
       */
      check_database_health(args: Record<string, never>): Promise<MCPToolResult>;
    };

    'sequential-thinking': {
      /**
       * A detailed tool for dynamic and reflective problem-solving through thoughts
       */
      sequentialthinking(args: SequentialThinkingSequentialthinkingArgs): Promise<MCPToolResult>;
    };

    context7: {
      /**
       * Resolves a package/product name to a Context7-compatible library ID
       */
      'resolve-library-id'(args: Context7ResolveLibraryIdArgs): Promise<MCPToolResult>;

      /**
       * Fetches up-to-date documentation for a library
       */
      'get-library-docs'(args: Context7GetLibraryDocsArgs): Promise<MCPToolResult>;
    };

    WordPressAPI: {
      /**
       * List content items with pagination and filtering
       */
      list_content(args: WordPressAPIListContentArgs): Promise<MCPToolResult>;

      /**
       * Get a specific content item by ID
       */
      get_content(args: WordPressAPIGetContentArgs): Promise<MCPToolResult>;

      // ... (remaining 10 WordPress tools)
    };

    helpscout: {
      /**
       * Search and list all inboxes with optional filtering
       */
      searchInboxes(args: HelpscoutSearchInboxesArgs): Promise<MCPToolResult>;

      // ... (remaining 7 HelpScout tools)
    };

    'claude-code': {
      // ... (15 Claude Code tools)
    };
  };
}

export {};
```

---

## 4. Integration Points

### 4.1 Server Startup Integration

**Location**: `src/mcp-server.ts` (main MCP server entry point)

```typescript
import { CodeGenService } from './codegen/codegen-service.js';

async function startServer() {
  // Initialize MCP manager (existing)
  const mcpManager = await initializeMCP(config);

  // NEW: Generate TypeScript declarations
  if (mcpManager) {
    const codeGenService = new CodeGenService(mcpManager);
    await codeGenService.generateDeclarations();
    console.log('✅ TypeScript declarations generated');
  }

  // Start server (existing)
  const server = new Server(/* ... */);
  // ...
}
```

### 4.2 Development Workflow

**Automatic Regeneration**:
1. Developer starts codemode-unified with `npm run dev`
2. MCP servers connect and tools are discovered
3. TypeScript declarations are auto-generated
4. IDE immediately picks up types (no restart needed)

**Manual Regeneration**:
```bash
# CLI command for explicit regeneration
npm run mcp:codegen

# Or via direct script
npx tsx src/codegen/cli.ts
```

### 4.3 IDE Configuration

**VSCode/Cursor Configuration**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "types": ["node"],
    "typeRoots": ["./node_modules/@types", "./services/codemode-unified/generated"]
  },
  "include": [
    "services/codemode-unified/generated/**/*.d.ts"
  ]
}
```

**Result**: IDE automatically loads `mcp.d.ts` and provides autocomplete!

---

## 5. Implementation Plan

### Phase 1: Core Infrastructure (Day 1-2)
- [ ] Create `src/codegen/` directory structure
- [ ] Implement `SchemaDiscoveryService`
- [ ] Implement `TypeGenerator` with json-schema-to-typescript
- [ ] Implement `DeclarationGenerator`
- [ ] Write unit tests for each component

### Phase 2: Integration (Day 2-3)
- [ ] Integrate with `mcp-server.ts` startup
- [ ] Add CLI command for manual generation
- [ ] Configure output path (`generated/mcp.d.ts`)
- [ ] Add Prettier formatting
- [ ] Test with existing MCP servers (automem, context7, etc.)

### Phase 3: Validation & Polish (Day 3-4)
- [ ] Validate generated types match runtime behavior
- [ ] Test IDE autocomplete in VSCode/Cursor
- [ ] Handle edge cases (optional fields, unions, arrays)
- [ ] Add error handling and logging
- [ ] Write integration tests

### Phase 4: Documentation (Day 4-5)
- [ ] Write README for codegen system
- [ ] Add JSDoc comments to all codegen classes
- [ ] Create developer guide for extending codegen
- [ ] Document troubleshooting common issues

### Phase 5: Distribution (Day 5-7)
- [ ] Package as standalone npm module (`@companykit/mcp-codegen`)
- [ ] Publish to npm
- [ ] Write announcement blog post
- [ ] Share with MCP community on GitHub/Twitter/HN

---

## 6. Testing Strategy

### Unit Tests

**Test Files**:
- `src/codegen/__tests__/schema-discovery.test.ts`
- `src/codegen/__tests__/type-generator.test.ts`
- `src/codegen/__tests__/declaration-generator.test.ts`

**Test Cases**:
```typescript
describe('TypeGenerator', () => {
  it('converts string field to TypeScript string type', async () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'User name' }
      },
      required: ['name']
    };

    const result = await typeGenerator.generateType('test', 'tool', schema);

    expect(result.typeDefinition).toContain('name: string');
    expect(result.typeDefinition).toContain('/** User name */');
  });

  it('converts optional field correctly', async () => {
    const schema = {
      type: 'object',
      properties: {
        optional: { type: 'number' }
      }
    };

    const result = await typeGenerator.generateType('test', 'tool', schema);

    expect(result.typeDefinition).toContain('optional?: number');
  });

  it('handles array types', async () => {
    const schema = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    };

    const result = await typeGenerator.generateType('test', 'tool', schema);

    expect(result.typeDefinition).toContain('tags?: string[]');
  });

  it('handles nested objects', async () => {
    const schema = {
      type: 'object',
      properties: {
        metadata: {
          type: 'object',
          additionalProperties: true
        }
      }
    };

    const result = await typeGenerator.generateType('test', 'tool', schema);

    expect(result.typeDefinition).toContain('metadata?: Record<string, unknown>');
  });
});
```

### Integration Tests

**Test File**: `src/codegen/__tests__/integration.test.ts`

```typescript
describe('CodeGen Integration', () => {
  it('generates valid TypeScript from real MCP schemas', async () => {
    // Use real automem schemas
    const schemas = await schemaDiscovery.discoverSchemas();
    const declaration = await declarationGenerator.generateDeclarationFile(schemas);

    // Write to temp file
    const tempPath = '/tmp/test-mcp.d.ts';
    await fs.writeFile(tempPath, declaration.content);

    // Validate TypeScript compiles without errors
    const result = execSync(`npx tsc --noEmit ${tempPath}`);
    expect(result.toString()).toBe('');
  });

  it('provides IDE autocomplete for all tools', async () => {
    // This test would be manual - verify in VSCode
    // But we can check the declaration structure
    const schemas = await schemaDiscovery.discoverSchemas();
    const declaration = await declarationGenerator.generateDeclarationFile(schemas);

    expect(declaration.content).toContain('declare global');
    expect(declaration.content).toContain('const mcp');
    expect(declaration.content).toContain('automem:');
    expect(declaration.content).toContain('store_memory(');
  });
});
```

---

## 7. Error Handling

### Schema Discovery Failures
```typescript
async discoverSchemas(): Promise<ToolSchema[]> {
  const tools: ToolSchema[] = [];
  const errors: Error[] = [];

  for (const [serverName, connection] of this.mcpManager.connections) {
    try {
      const serverTools = await connection.client.request(
        { method: 'tools/list' },
        ListToolsResultSchema
      );

      for (const tool of serverTools.tools) {
        tools.push(/* ... */);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to discover tools from ${serverName}:`, error);
      errors.push(new Error(`${serverName}: ${error.message}`));
      // Continue with other servers
    }
  }

  if (errors.length > 0 && tools.length === 0) {
    throw new Error(`Failed to discover schemas from all servers:\n${errors.join('\n')}`);
  }

  return tools;
}
```

### Type Generation Failures
```typescript
async generateType(
  server: string,
  tool: string,
  schema: JSONSchema
): Promise<GeneratedType> {
  try {
    const typeDefinition = await compile(schema, interfaceName, options);
    return { interfaceName, typeDefinition };
  } catch (error) {
    console.error(`❌ Failed to generate type for ${server}.${tool}:`, error);

    // Fallback to 'any' type with warning comment
    return {
      interfaceName,
      typeDefinition: `
        /** ⚠️  Type generation failed for ${server}.${tool} - using 'any' */
        type ${interfaceName} = any;
      `
    };
  }
}
```

### File Write Failures
```typescript
async writeDeclarationFile(declaration: DeclarationFile): Promise<void> {
  try {
    await fs.mkdir(path.dirname(declaration.path), { recursive: true });
    await fs.writeFile(declaration.path, declaration.content, 'utf-8');
    console.log(`✅ TypeScript declarations written to ${declaration.path}`);
  } catch (error) {
    console.error(`❌ Failed to write declarations to ${declaration.path}:`, error);
    throw new Error(`Declaration file write failed: ${error.message}`);
  }
}
```

---

## 8. Performance Considerations

### Caching Strategy
- Cache generated types in memory during development
- Only regenerate when MCP server configuration changes
- Use file modification timestamps to detect changes

### Optimization Targets
- **Schema Discovery**: < 500ms for 6 MCP servers
- **Type Generation**: < 100ms per tool (< 1s for 37 tools)
- **File Write**: < 50ms
- **Total**: < 2 seconds from startup to types available

### Resource Usage
- Memory: < 50MB for type generation
- Disk: < 100KB for generated `.d.ts` file (37 tools)

---

## 9. Extensibility

### Adding New Schema Transformers

**Custom Transformer Interface**:
```typescript
interface SchemaTransformer {
  name: string;
  canHandle(schema: JSONSchema): boolean;
  transform(schema: JSONSchema): string;
}

class EnumTransformer implements SchemaTransformer {
  name = 'EnumTransformer';

  canHandle(schema: JSONSchema): boolean {
    return schema.enum !== undefined;
  }

  transform(schema: JSONSchema): string {
    const values = schema.enum.map(v => `'${v}'`).join(' | ');
    return values;
  }
}

// Register custom transformers
typeGenerator.registerTransformer(new EnumTransformer());
```

### Supporting Other Languages

**Future**: Extend to generate Python stubs, Go interfaces, etc.

```typescript
interface CodeGenerator {
  language: string;
  generate(schemas: ToolSchema[]): Promise<GeneratedFile>;
}

class PythonStubGenerator implements CodeGenerator {
  language = 'python';

  async generate(schemas: ToolSchema[]): Promise<GeneratedFile> {
    // Generate .pyi stub files
  }
}
```

---

## 10. Deployment & Distribution

### NPM Package Structure

```
@companykit/mcp-codegen/
├── package.json
├── README.md
├── src/
│   ├── index.ts                    # Public API
│   ├── schema-discovery.ts
│   ├── type-generator.ts
│   ├── declaration-generator.ts
│   └── cli.ts                      # CLI entry point
├── dist/                           # Compiled JS
└── examples/
    ├── basic-usage.ts
    └── custom-transformers.ts
```

### CLI Usage

```bash
# Generate types from .mcp.json config
npx @companykit/mcp-codegen

# Specify custom config path
npx @companykit/mcp-codegen --config ./my-mcp.json

# Watch mode (regenerate on config changes)
npx @companykit/mcp-codegen --watch

# Output to custom path
npx @companykit/mcp-codegen --output ./custom/mcp.d.ts
```

### Programmatic API

```typescript
import { CodeGenService } from '@companykit/mcp-codegen';

const codeGen = new CodeGenService({
  mcpConfigPath: './.mcp.json',
  outputPath: './generated/mcp.d.ts'
});

await codeGen.generateDeclarations();
```

---

## 11. Success Metrics

### Technical Metrics
- [ ] TypeScript compilation succeeds with generated types
- [ ] 100% of MCP tools have type definitions
- [ ] IDE autocomplete works in VSCode/Cursor/Claude Code
- [ ] Zero runtime type errors with generated types

### Developer Experience Metrics
- [ ] < 2 seconds for type generation on startup
- [ ] Zero manual steps required for type updates
- [ ] Developers report improved productivity

### Community Adoption Metrics
- [ ] GitHub stars on mcp-codegen repository
- [ ] npm downloads per week
- [ ] Community contributions (issues, PRs)
- [ ] Integration by other MCP projects

---

## 12. Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| json-schema-to-typescript fails on complex schemas | Medium | Implement fallback transformers, catch errors per-tool |
| Generated types don't match runtime behavior | High | Comprehensive integration tests, runtime validation |
| IDE doesn't pick up .d.ts files | Medium | Document tsconfig.json setup, provide troubleshooting guide |
| Performance impact on server startup | Low | Implement caching, async generation, lazy loading |
| Breaking changes in MCP protocol | Low | Pin MCP SDK versions, monitor for protocol updates |

---

## 13. Future Enhancements

### Short-Term (1-2 months)
- [ ] Support for tool result type inference
- [ ] Generate Zod schemas from JSON Schema for runtime validation
- [ ] Add `@deprecated` tags for deprecated tools
- [ ] Generate markdown documentation alongside types

### Medium-Term (3-6 months)
- [ ] Language Server Protocol (LSP) integration for real-time type updates
- [ ] Generate Python `.pyi` stub files
- [ ] Visual Studio Code extension for MCP type management
- [ ] Automatic versioning of generated types

### Long-Term (6-12 months)
- [ ] GraphQL-style schema introspection for MCP
- [ ] Type-safe MCP client generator (like tRPC)
- [ ] Integration with Anthropic's official MCP tooling
- [ ] Community-driven schema registry

---

## 14. References

### Technical Dependencies
- [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript) - Core type generation
- [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) - AST manipulation
- [Prettier](https://prettier.io/) - Code formatting
- [@types/json-schema](https://www.npmjs.com/package/@types/json-schema) - JSON Schema types

### Related Projects
- [openapi-typescript](https://github.com/drwpow/openapi-typescript) - Similar approach for OpenAPI
- [graphql-code-generator](https://github.com/dotansimha/graphql-code-generator) - GraphQL codegen patterns
- [quicktype](https://github.com/quicktype/quicktype) - Multi-language type generation

### MCP Resources
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://github.com/modelcontextprotocol/modelcontextprotocol)
- [Cloudflare Code Mode Blog](https://blog.cloudflare.com/code-mode/)

---

## Conclusion

This design provides a **comprehensive, production-ready blueprint** for TypeScript code generation from MCP schemas. The system will:

1. ✅ **Fill a critical gap** in the MCP ecosystem
2. ✅ **Provide first-class TypeScript support** for codemode-unified
3. ✅ **Enable IDE autocomplete** for all MCP tools
4. ✅ **Position CompanyKit** as a leader in MCP tooling

**Next Steps**: Begin Phase 1 implementation with `SchemaDiscoveryService` and `TypeGenerator` components.

---

**Implementation Start Date**: TBD
**Target Completion**: 7-10 days
**Lead Developer**: TBD