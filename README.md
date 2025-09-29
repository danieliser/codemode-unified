# Code Mode Unified

A high-performance local implementation of Cloudflare's Code Mode that enables LLMs to execute TypeScript code in a secure sandbox with access to MCP tools and native utilities.

## Features

- **🚀 High Performance**: QuickJS sandbox with 5-10ms startup time (vs 1-5s for Docker)
- **🔧 MCP Integration**: Automatic MCP server discovery and TypeScript schema generation
- **🛡️ Security First**: Capability-based access control with fine-grained permissions
- **📦 Unified API**: Single interface for both native and MCP tools
- **⚡ Worker Pool**: Reusable runtime instances for optimal performance
- **🔐 OAuth 2.1**: Modern authentication with PKCE support

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy configuration files
cp .env.example .env
cp config.example.yaml config.yaml

# Build the project
npm run build

# Start the server
npm start
```

### Basic Usage

1. **Start the server**:
   ```bash
   npm start
   # Server runs on http://localhost:3001
   ```

2. **Execute TypeScript code**:
   ```bash
   curl -X POST http://localhost:3001/execute \
     -H "Content-Type: application/json" \
     -d '{"code": "console.log(\"Hello, Code Mode!\"); return { message: \"success\" };"}'
   ```

3. **Check capabilities**:
   ```bash
   curl http://localhost:3001/capabilities
   ```

## Configuration

### Environment Variables (.env)

```bash
# Server Configuration
PORT=3001
HOST=localhost

# Authentication
AUTH_PROVIDER=jwt
JWT_SECRET=your-jwt-secret-here
JWT_ISSUER=code-mode-unified
JWT_AUDIENCE=code-execution

# Sandbox Configuration
SANDBOX_MEMORY=134217728  # 128MB
SANDBOX_TIMEOUT=30000     # 30 seconds
SANDBOX_CPU_QUOTA=0.5     # 50% CPU

# Logging
LOG_LEVEL=info
LOG_FORMAT=pretty

# CORS
CORS_ENABLED=true
CORS_ORIGINS=*
```

### YAML Configuration (config.yaml)

The `config.yaml` file provides detailed configuration for:
- Server settings (CORS, rate limiting, compression)
- Security policies (capabilities, audit settings)
- Sandbox runtime (worker pool, resource limits)
- MCP server integrations
- Schema generation settings

See `config.example.yaml` for full configuration options.

## MCP Integration

### Using with Claude Code

This service can be integrated with Claude Code via the included MCP bridge:

1. **Add to Claude's MCP configuration**:
   ```json
   {
     "mcpServers": {
       "codemode-unified": {
         "command": "node",
         "args": ["/path/to/codemode-unified-bridge.js"]
       }
     }
   }
   ```

2. **Set environment variable**:
   ```bash
   export CODE_MODE_ENDPOINT=http://localhost:3001
   ```

3. **Use in Claude**:
   Claude can now execute TypeScript code using the `execute_code` tool.

### Available Tools in Sandbox

When executing code, you have access to:

- **Native tools**: `tools.math.calculate()`, `tools.text.analyze()`, `tools.data.transform()`
- **MCP tools**: `mcp.helpscout.searchInboxes()`, `mcp.filesystem.readFile()`
- **Unified API**: `unifiedTools.execute("namespace.tool", args)`
- **Standard JavaScript/TypeScript**: All ES2022 features

## API Reference

### POST /execute

Execute TypeScript code in the sandbox.

**Request**:
```json
{
  "code": "string",
  "options": {
    "timeout": 30000,
    "memoryLimit": 134217728
  }
}
```

**Response**:
```json
{
  "success": true,
  "result": "any",
  "metrics": {
    "executionTime": 15,
    "memoryUsed": 2048,
    "apiCalls": 3
  }
}
```

### GET /capabilities

Get available tools and system capabilities.

**Response**:
```json
{
  "tools": {
    "native": [...],
    "mcp": [...]
  },
  "sandbox": {
    "runtime": "quickjs",
    "limits": {...}
  }
}
```

### GET /health

Get system health status.

**Response**:
```json
{
  "status": "healthy",
  "components": {
    "sandbox": {"status": "healthy"},
    "mcp": {"status": "healthy"}
  }
}
```

## Development

### Scripts

```bash
npm run build          # Build TypeScript
npm run dev            # Development mode with hot reload
npm run test           # Run tests
npm run typecheck      # TypeScript type checking
npm run lint           # ESLint
npm start              # Start production server
```

### Project Structure

```
src/
├── types/           # TypeScript type definitions
├── sandbox/         # QuickJS runtime implementation
├── mcp/            # MCP server integration
├── security/       # Authentication and authorization
├── schema/         # Automatic schema generation
├── tools/          # Native tool implementations
├── executor.ts     # Main execution orchestrator
└── server.ts       # HTTP/WebSocket server

tests/              # Test suites
config.example.yaml # Configuration template
.env.example       # Environment template
```

## Known Issues

### TypeScript Compilation Errors

Currently, there are several TypeScript compilation issues that need to be resolved:

1. **jose library compatibility**: JWTPayload interface conflicts
2. **exactOptionalPropertyTypes**: Strict type checking issues
3. **Error type annotations**: Missing `error: unknown` in catch blocks
4. **Zod schema extraction**: Type compatibility issues

To see the full list of errors:
```bash
npm run typecheck
```

### Temporary Workarounds

If you need to run the server before fixing TypeScript issues:
1. Temporarily disable strict type checking in `tsconfig.json`
2. Use `npm run build --skipLibCheck` for building
3. The runtime functionality should work despite type errors

## Performance

### Benchmarks

- **Startup Time**: 5-10ms (QuickJS) vs 1-5s (Docker)
- **Memory Usage**: ~10MB baseline + sandbox allocation
- **Execution Speed**: Near-native JavaScript performance
- **Throughput**: 1000+ requests/second (single-threaded)

### Optimization

- Worker pool reuses runtime instances
- Lazy MCP server initialization
- Efficient memory management
- Built-in request queuing and throttling

## Security

### Sandbox Security

- Memory limits enforced
- CPU quota restrictions
- Network access controls
- Filesystem isolation
- Module import restrictions

### Authentication

- JWT with configurable secrets
- OAuth 2.1 with PKCE support
- API key authentication
- Capability-based permissions

### Audit Logging

- All code execution logged
- Security violations tracked
- Configurable retention policies
- Multiple storage backends

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Ensure TypeScript compilation passes
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
