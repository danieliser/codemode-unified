# TypeScript Code Generation System

This directory contains the TypeScript code generation system for MCP tools, which automatically generates `.d.ts` declaration files from MCP server tool schemas.

## Components

### DeclarationGenerator (✅ Implemented)

**File**: `declaration-generator.ts` (458 lines)

**Purpose**: Assembles complete TypeScript declaration files from generated type interfaces.

**Key Features**:
- Generates file header with auto-generation timestamp and documentation
- Defines `MCPToolResult` interface for tool return types
- Generates all type interfaces using `TypeGenerator`
- Groups schemas by server name
- Creates `declare global { const mcp: {...} }` namespace structure
- Generates nested namespaces for each server with tool function signatures
- Includes TSDoc comments from tool descriptions
- Formats final output with Prettier
- Handles errors gracefully with fallback types

**Example Usage**:
```typescript
import { DeclarationGenerator } from './declaration-generator.js';
import { TypeGenerator } from './type-generator.js';

const typeGenerator = new TypeGenerator();
const generator = new DeclarationGenerator(typeGenerator, './generated/mcp.d.ts');

const schemas = await schemaParser.parseSchemas();
const declaration = await generator.generateDeclarationFile(schemas);

console.log(`Generated ${declaration.content.split('\n').length} lines`);
```

**Example Output Structure**:

See `examples/example-output.d.ts` for a complete example showing:
- automem server with `store_memory` and `recall_memory` tools
- context7 server with `resolve-library-id` tool
- Proper namespace nesting and TypeScript interfaces

### Pending Components

The following components are referenced but not yet implemented:

1. **SchemaParser** (`schema-parser.ts`) - Parses MCP tool schemas
   - Defines `ToolSchema` interface
   - Extracts schema information from MCP servers

2. **TypeGenerator** (`type-generator.ts`) - Converts JSON Schema to TypeScript
   - Uses `json-schema-to-typescript` library
   - Generates interface definitions from schemas
   - Provides `toInterfaceName()` method for naming conventions

## Dependencies

- `prettier` (^3.0.0) - Code formatting
- `json-schema-to-typescript` (^15.0.0) - Schema conversion
- `@types/json-schema` (^7.0.15) - JSON Schema type definitions

All dependencies are already installed in package.json.

## Architecture

The declaration generator follows this flow:

```
ToolSchema[] (from SchemaParser)
    ↓
TypeGenerator.generateType() - Convert each schema to TypeScript interface
    ↓
DeclarationGenerator.generateTypeInterfaces() - Collect all interfaces
    ↓
DeclarationGenerator.groupByServer() - Organize by MCP server
    ↓
DeclarationGenerator.generateMCPNamespace() - Create namespace structure
    ↓
DeclarationGenerator.format() - Format with Prettier
    ↓
DeclarationFile { content, path } - Ready to write
```

## Generated Namespace Structure

The generated declaration file provides a type-safe `mcp` global with nested namespaces:

```typescript
declare global {
  const mcp: {
    automem: {
      store_memory(args: AutomemStoreMemoryArgs): Promise<MCPToolResult>;
      recall_memory(args: AutomemRecallMemoryArgs): Promise<MCPToolResult>;
    };
    context7: {
      'resolve-library-id'(args: Context7ResolveLibraryIdArgs): Promise<MCPToolResult>;
    };
  };
}
```

This enables IDE autocomplete and type checking for all MCP tool calls:

```typescript
// ✅ Type-safe with autocomplete
await mcp.automem.store_memory({
  content: 'Important note',
  tags: ['project'],
  importance: 0.8
});

// ❌ TypeScript error: missing required 'content' field
await mcp.automem.store_memory({
  tags: ['project']
});
```

## Error Handling

The `DeclarationGenerator` includes robust error handling:

1. **Type Generation Failures**: Falls back to `any` type with warning comment
2. **Prettier Failures**: Returns unformatted content if formatting fails
3. **Missing Schemas**: Continues with remaining schemas on individual failures

## Special Character Handling

The generator properly handles special characters in names:

- **Server names with hyphens**: `sequential-thinking` → `sequential_thinking`
- **Tool names with hyphens**: `resolve-library-id` → `'resolve-library-id'`
- **Names with special chars**: Wrapped in quotes for TypeScript compatibility

## Next Steps

To complete the codegen system:

1. Implement `schema-parser.ts` to define `ToolSchema` interface and parse MCP schemas
2. Implement `type-generator.ts` to convert JSON Schema to TypeScript interfaces
3. Create integration with MCP server startup in `mcp-server.ts`
4. Add tests for declaration generation
5. Document the complete workflow

## Reference

See `TYPESCRIPT_CODEGEN_DESIGN.md` in the project root for the complete technical design and implementation plan.