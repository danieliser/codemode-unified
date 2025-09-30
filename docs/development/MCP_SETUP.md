# Code Mode Unified - MCP Server Setup

## Quick Start (Local Development)

### 1. Build the Project
```bash
npm run build
```

### 2. Add to Your `.mcp.json`

Add this configuration to your MCP config file (usually `~/.mcp.json` or `.claude/mcp.json`):

```json
{
  "mcpServers": {
    "codemode": {
      "command": "node",
      "args": ["/Users/danieliser/Projects/CompanyKit/services/codemode-unified/dist/mcp-server.js"],
      "env": {}
    }
  }
}
```

### 3. Restart Claude Code

Restart Claude Code to load the new MCP server.

### 4. Test It

Try these commands in Claude Code:

```
Execute this code: console.log("Hello from Code Mode!")

List available runtimes

Check health of bun runtime

Execute with bun:
interface User { name: string; age: number; }
const user: User = { name: 'Alice', age: 30 };
console.log(user);
user;
```

## Available Tools

### `execute_code`
Execute JavaScript/TypeScript code in a sandboxed runtime.

**Parameters:**
- `code` (required): The code to execute
- `runtime` (optional): `quickjs`, `bun`, `deno`, `isolated-vm`, or `e2b`. Default: `quickjs`
- `timeout` (optional): Timeout in milliseconds. Default: `30000`

**Example:**
```typescript
{
  "code": "const sum = (a, b) => a + b; sum(5, 3);",
  "runtime": "quickjs",
  "timeout": 5000
}
```

### `list_runtimes`
Show all available runtimes with their capabilities and status.

**Example:**
```json
{}
```

**Returns:**
```json
{
  "runtimes": [
    {
      "type": "quickjs",
      "status": "available",
      "capabilities": {
        "async": false,
        "typescript": false,
        "esModules": true,
        "topLevelAwait": false,
        "inProcess": true,
        "cloudBased": false
      },
      "performance": {
        "startupMs": 5,
        "memoryMB": 3
      }
    },
    {
      "type": "bun",
      "status": "available",
      "capabilities": {
        "async": true,
        "typescript": true,
        "esModules": true,
        "topLevelAwait": true,
        "inProcess": false,
        "cloudBased": false
      },
      "performance": {
        "startupMs": 10,
        "memoryMB": 90
      }
    }
  ]
}
```

### `get_runtime_capabilities`
Get detailed capabilities for a specific runtime.

**Parameters:**
- `runtime` (required): Runtime type to query

**Example:**
```json
{
  "runtime": "bun"
}
```

### `runtime_health_check`
Verify a runtime is operational.

**Parameters:**
- `runtime` (required): Runtime type to check

**Example:**
```json
{
  "runtime": "quickjs"
}
```

## Runtime Selection Guide

### QuickJS - Fast & Lightweight
✅ Use for:
- Simple synchronous code
- High-frequency execution
- Minimal memory footprint
- Maximum security isolation

❌ Not for:
- Async/await operations
- TypeScript (needs compilation)
- Modern ES2024+ features

### Bun - Modern JavaScript
✅ Use for:
- TypeScript code (native support)
- Async/await and Promises
- ES2024+ features
- npm package usage

❌ Not for:
- High-frequency execution (subprocess overhead)
- Maximum memory efficiency
- Fine-grained permissions

### Runtime Comparison

| Feature | QuickJS | Bun |
|---------|---------|-----|
| Startup | ~5ms | ~80ms |
| Memory | ~3MB | ~90MB |
| Async | ❌ | ✅ |
| TypeScript | ❌ | ✅ |
| In-Process | ✅ | ❌ |

## Usage Examples

### Simple Calculation
```javascript
const result = [1, 2, 3, 4, 5].reduce((sum, n) => sum + n, 0);
result;
// Returns: 15
```

### TypeScript with Types (use bun)
```typescript
interface Product {
  name: string;
  price: number;
}

const cart: Product[] = [
  { name: 'Laptop', price: 999 },
  { name: 'Mouse', price: 29 }
];

const total = cart.reduce((sum, p) => sum + p.price, 0);
total;
// Returns: 1028
```

### Async Operations (use bun)
```typescript
async function delay(ms: number, value: any) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

const result = await delay(100, { status: 'done' });
result;
// Returns: { status: 'done' }
```

## Publishing to npm (Future)

Once ready for public use:

```bash
# Update version
npm version patch

# Publish
npm publish --access public
```

Then users can install and use:

```bash
# Global installation
npm install -g @danieliser/codemode-unified

# In .mcp.json
{
  "mcpServers": {
    "codemode": {
      "command": "npx",
      "args": ["-y", "@danieliser/codemode-unified@latest", "mcp"]
    }
  }
}
```

## Development

### Run in Dev Mode
```bash
npm run dev:mcp
```

### Test MCP Protocol
```bash
# Send test request via stdin
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm run start:mcp
```

### Debug
The server logs to stderr, so MCP protocol JSON goes to stdout while logs go to stderr:

```bash
npm run start:mcp 2>debug.log
```

## Troubleshooting

### Server Not Showing Up

1. Check `.mcp.json` path is correct
2. Verify `npm run build` completed successfully
3. Restart Claude Code completely
4. Check stderr logs for errors

### Runtime Not Available

```bash
# Check Bun installation
which bun
# Or install: curl -fsSL https://bun.sh/install | bash
```

### Permission Errors

```bash
# Make MCP server executable
chmod +x dist/mcp-server.js

# Rebuild to apply permissions
npm run build
```

## Next Steps

1. ✅ Build and configure the MCP server
2. Test with simple code snippets
3. Try different runtimes (quickjs vs bun)
4. Use for daily development tasks
5. Report bugs and edge cases
6. Iterate on features based on usage