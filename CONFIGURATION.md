# Configuration

This document explains all configuration options for the Code Mode Unified MCP server.

## Environment Variables

### CODEMODE_ENABLE_MCP_INTEGRATION

**Type:** `boolean` (presence check)
**Default:** `false` (disabled)
**Description:** Enable integration with other MCP servers

When enabled, the server:
- Loads `.mcp.json` configuration
- Connects to configured MCP servers
- Makes their tools available via `mcp.*` proxy
- Generates TypeScript declarations

**Usage:**
```bash
CODEMODE_ENABLE_MCP_INTEGRATION=true npx tsx src/mcp-server.ts
```

---

### CODEMODE_TYPE_EXPOSURE

**Type:** `'on-demand' | 'auto-include'`
**Default:** `'on-demand'`
**Description:** Controls how TypeScript type information is exposed to agents

#### on-demand Mode (Default)

**Best for:** Production use, token efficiency
**Behavior:**
- Types available via `mcp://types/declarations` resource
- Agent must explicitly read resource to get types
- Minimal tool description, stays under token limits
- Works well with smart agents that explore capabilities

**Tool Description:**
```
Execute JavaScript/TypeScript code in a sandboxed runtime environment.
When MCP integration is enabled, code has access to MCP tools via the
global mcp object. For TypeScript type definitions and API documentation,
read the resource mcp://types/declarations before writing code.
```

**Agent Workflow:**
1. Sees execute_code tool
2. Reads mcp://types/declarations resource
3. Gets full type information
4. Writes type-safe code

#### auto-include Mode

**Best for:** Testing, less capable agents, immediate visibility
**Behavior:**
- Tool list directly in execute_code description
- Agent sees available tools immediately
- Higher token usage per request
- No need to read resource first (but still available)

**Tool Description:**
```
Execute JavaScript/TypeScript code in a sandboxed runtime environment.
When MCP integration is enabled, code has access to MCP tools via the
global mcp object.

Available MCP Tools:

mcp.automem:
  - store_memory(content, tags, importance) // Store a memory with optional...
  - recall_memory(query, embedding, limit, ...) // Recall memories with hybrid...
  - associate_memories(memory1_id, memory2_id, type) // Create an association...
  [... all tools listed ...]

mcp["sequential-thinking"]:
  - sequentialthinking(thought, nextThoughtNeeded, thoughtNumber) // A detailed...

mcp.context7:
  - "resolve-library-id"(libraryName) // Resolves a package/product name...
  [...]

For complete TypeScript type definitions, read the resource mcp://types/declarations.
```

**Agent Workflow:**
1. Sees execute_code tool WITH full tool list
2. Already knows what's available
3. Optionally reads resource for complete types
4. Writes code immediately

**Usage:**
```bash
CODEMODE_TYPE_EXPOSURE=auto-include npx tsx src/mcp-server.ts
```

---

## Comparison: on-demand vs auto-include

| Feature | on-demand | auto-include |
|---------|-----------|--------------|
| **Token Usage** | Low (~300 tokens) | High (~1500+ tokens) |
| **Agent Discovery** | Must read resource | Immediate visibility |
| **Tool List Updates** | No re-listing needed | Every tool list request |
| **Best For** | Smart agents, production | Testing, visibility |
| **Type Detail** | Full (via resource) | Summary + resource |

## Recommendations

### Use `on-demand` (default) when:
- ✅ Deploying to production
- ✅ Working with capable LLM agents (Claude, GPT-4)
- ✅ Token efficiency matters
- ✅ Agent can discover resources

### Use `auto-include` when:
- ✅ Testing MCP integration
- ✅ Debugging agent behavior
- ✅ Working with less capable agents
- ✅ You want immediate tool visibility
- ✅ Experimenting with different approaches

## Testing Both Modes

### Test on-demand Mode

```bash
# Start server (on-demand is default)
CODEMODE_ENABLE_MCP_INTEGRATION=true npx tsx src/mcp-server.ts

# Agent should:
# 1. See execute_code tool
# 2. Read mcp://types/declarations resource
# 3. Get full type information
# 4. Write code
```

### Test auto-include Mode

```bash
# Start server with auto-include
CODEMODE_ENABLE_MCP_INTEGRATION=true \
CODEMODE_TYPE_EXPOSURE=auto-include \
npx tsx src/mcp-server.ts

# Agent should:
# 1. See execute_code tool with full tool list
# 2. Immediately know what's available
# 3. Optionally read resource for complete types
# 4. Write code
```

## Future Configuration Options

Planned environment variables:

- `CODEMODE_TYPE_CACHE_TTL` - How long to cache generated types
- `CODEMODE_TYPE_REFRESH_INTERVAL` - Auto-regenerate types periodically
- `CODEMODE_DEFAULT_RUNTIME` - Change default from QuickJS
- `CODEMODE_MAX_EXECUTION_TIME` - Global timeout limit
- `CODEMODE_ENABLE_PROMPTS` - Toggle prompt templates feature