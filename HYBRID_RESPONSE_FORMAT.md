# MCP Hybrid Response Format

## Overview

Implemented a flexible hybrid architecture for MCP tool responses that gives AI agents choice in how they consume data while maintaining MCP spec compliance.

## Response Structure

```typescript
interface EnhancedMCPResponse {
  content: any[];                    // Raw MCP content array (spec-compliant)
  text: string;                      // Pre-extracted combined text
  parsed: any | null;                // Auto-parsed structure (or null)
  helpers: MCPResponseHelpers;       // Utility methods for custom parsing
  isError?: boolean;
}

interface MCPResponseHelpers {
  parseAsStructured(): any;          // Extract key-value pairs
  parseAsArray(): any[];             // Parse numbered lists with metadata
  parseAsKeyValue(): Record<string, any>;  // Simple colon-separated pairs
  getRawText(): string;              // Get original text
}
```

## Features

### 1. Auto-Parse Detection
Attempts intelligent parsing in this order:
1. **JSON parsing** - If valid JSON, parse it
2. **Key-value structure** - Extract "Key: Value" pairs
3. **Array structure** - Parse numbered lists with multi-line metadata

### 2. Helper Methods
Agents can call helpers on-demand for specific parsing needs:

```javascript
const result = await mcp.automem.recall_memory({ query: "test" });

// Use auto-parsed if it worked
if (Array.isArray(result.parsed)) {
  console.log(result.parsed);
}

// Or use helper for guaranteed format
const memories = result.helpers.parseAsArray();
console.log(memories[0].id, memories[0].created);
```

### 3. AutoMem Optimization
Enhanced array parser handles AutoMem's multi-line format:

```
Found 2 memories:

1. Memory content here [tags] (importance: 0.8) score=0.483
   ID: abc-123
   Created: 2025-10-02T00:23:17.457968+00:00

2. Another memory [more-tags] (importance: 0.5) score=0.312
   ID: def-456
   Created: 2025-10-02T00:25:42.123456+00:00
```

Parses to:
```javascript
[
  {
    index: 1,
    content: "Memory content here [tags] (importance: 0.8) score=0.483",
    id: "abc-123",
    created: "2025-10-02T00:23:17.457968+00:00"
  },
  {
    index: 2,
    content: "Another memory [more-tags] (importance: 0.5) score=0.312",
    id: "def-456",
    created: "2025-10-02T00:25:42.123456+00:00"
  }
]
```

## Implementation Details

### Function Injection
Helper methods are injected into the execution environment rather than serialized with JSON:

```javascript
// Injected into agent's runtime
function __createMCPHelpers(text) {
  return {
    parseAsStructured: function() { /* ... */ },
    parseAsArray: function() { /* ... */ },
    parseAsKeyValue: function() { /* ... */ },
    getRawText: function() { return text; }
  };
}

// Applied to each MCP result
result.helpers = __createMCPHelpers(result.text);
```

### Two-Pass Execution
1. **First pass**: Detect MCP calls with placeholder syntax
2. **Resolve**: Execute MCP calls and build enhanced responses
3. **Second pass**: Inject helpers and re-execute with actual data

## Usage Examples

### Simple Case (Auto-Parse)
```javascript
const result = await mcp.automem.store_memory({
  content: "Test memory",
  tags: ["test"]
});

// Auto-parsed key-value structure available
console.log(result.parsed.memory_id);
```

### Complex Case (Helper Methods)
```javascript
const result = await mcp.automem.recall_memory({
  query: "search term",
  limit: 10
});

// Parse as array with metadata
const memories = result.helpers.parseAsArray();

memories.forEach(mem => {
  console.log(`Memory ${mem.index}: ${mem.content}`);
  console.log(`  ID: ${mem.id}`);
  console.log(`  Created: ${mem.created}`);
});
```

### Fallback to Raw
```javascript
const result = await mcp.someserver.sometool({ args });

// If auto-parsing didn't work, use raw text
if (!result.parsed) {
  console.log(result.text);
}

// Or access raw MCP content
console.log(result.content[0].text);
```

## Benefits

### For Agents
- **Progressive Enhancement**: Simple cases work automatically
- **Flexible Fallback**: Complex cases have escape hatches
- **Type Safety**: Raw content preserved, types available
- **Self-Documenting**: Response structure shows what's possible

### For Development
- **MCP Compliant**: Maintains spec-compliant content arrays
- **Extensible**: Easy to add tool-specific helpers
- **Debuggable**: Raw content always available for inspection
- **Testable**: Clear interface for unit/integration tests

## Testing

### Manual Verification
```javascript
const result = await mcp.automem.recall_memory({ query: "test", limit: 2 });

console.log("Has content:", Array.isArray(result.content));
console.log("Has text:", typeof result.text === 'string');
console.log("Has parsed:", result.parsed !== undefined);
console.log("Has helpers:", typeof result.helpers === 'object');
console.log("Helper methods:", Object.keys(result.helpers));

const arrayParsed = result.helpers.parseAsArray();
console.log("Parsed items:", arrayParsed.length);
console.log("First item:", arrayParsed[0]);
```

### Integration Tests
See `tests/integration/mcp-hybrid-response.test.ts` (requires running AutoMem instance)

## Files Modified

- `src/mcp-server.ts`: Core implementation
  - Lines 43-179: Helper interfaces and parsing functions
  - Lines 926-978: Enhanced response creation
  - Lines 983-1062: Helper function injection

## Related Issues

- AutoMem authentication fix (environment variable propagation)
- MCP response format inconsistency (#previous-issue)
- Type-safe MCP integration (#typescript-codegen)
