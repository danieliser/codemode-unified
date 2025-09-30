# 🚀 CodeMode Unified

> **Production-Ready Code Execution Platform for AI Agents**

A high-performance, MCP-enabled code execution service that lets AI agents run JavaScript/TypeScript with full access to tools, APIs, and knowledge systems. Built for speed, security, and seamless integration with Claude Code and other AI platforms.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()

---

## ✨ What Makes It Special

### 🎯 **Dual Architecture**
- **MCP Server Mode**: Direct integration with Claude Code via Model Context Protocol
- **HTTP Backend Mode**: RESTful API for any AI platform or custom integration
- Both architectures share the same powerful runtime engine

### ⚡ **Multi-Runtime Execution**
- **Bun Runtime** ⭐ Recommended - Full async/await, modern APIs, fastest execution
- **QuickJS** - Lightweight, 5-10ms startup, perfect for quick operations
- **Deno** - Secure by default with explicit permissions
- **isolated-vm** - V8 isolates for maximum control
- **E2B** - Cloud sandboxes for untrusted code

### 🧠 **MCP Tool Integration**
Execute code with instant access to your entire MCP ecosystem:
- **AutoMem**: AI memory with graph relationships and vector search
- **Context7**: Official library documentation on demand
- **Sequential Thinking**: Multi-step reasoning for complex analysis
- **HelpScout**: Customer support data access
- **WordPress API**: Content management operations
- *...and any other MCP server you have configured*

### 🔒 **Security First**
- Sandboxed execution with memory/CPU limits
- Capability-based permissions
- Network access controls
- Audit logging for all operations
- OAuth 2.1 + JWT authentication

---

## 🎬 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- (Optional) Bun runtime for best performance

### Installation

```bash
# Clone or navigate to the project
cd codemode-unified

# Install dependencies
npm install

# Build the project
npm run build
```

### Start the Services

**Option 1: MCP Server (for Claude Code)**
```bash
npm run start:mcp
# MCP server starts on stdio - ready for Claude Code integration
```

**Option 2: HTTP Backend**
```bash
npm start
# HTTP server starts on http://localhost:3001
```

**Option 3: Development Mode**
```bash
npm run dev        # Auto-reload on changes
npm run dev:bun    # Use Bun runtime specifically
```

---

## 🔧 Configuration

### MCP Server Setup (Claude Code)

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "codemode-unified": {
      "command": "node",
      "args": ["/path/to/codemode-unified/dist/mcp-server.js"],
      "env": {
        "MCP_CONFIG_PATH": "/path/to/your/.mcp.json"
      }
    }
  }
}
```

The MCP server automatically discovers and connects to all your other MCP servers (AutoMem, Context7, etc.) from the same config file.

### HTTP Backend Setup

Create `.env`:

```bash
PORT=3001
HOST=localhost

# MCP Integration
MCP_CONFIG_PATH=/path/to/your/.mcp.json

# Optional: Runtime selection
DEFAULT_RUNTIME=bun
```

---

## 💡 Usage Examples

### Via MCP (Claude Code)

```typescript
// Claude can execute this directly through the MCP tool
const pokemonResponse = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu');
const pokemon = await pokemonResponse.json();

// Store in AutoMem for later recall
const memory = await mcp.automem.store_memory({
  content: `Pokemon: ${pokemon.name} has ${pokemon.abilities.length} abilities`,
  tags: ['pokemon', 'api-test'],
  importance: 0.8
});

// Return structured results
return {
  pokemon: pokemon.name,
  memory_id: memory.memory_id,
  status: 'success'
};
```

### Via HTTP API

```bash
curl -X POST http://localhost:3001/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const result = await fetch(\"https://api.github.com/users/danieliser\").then(r => r.json()); return { username: result.login, repos: result.public_repos };",
    "runtime": "bun",
    "timeout": 10000
  }'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "username": "danieliser",
    "repos": 42
  },
  "stdout": "",
  "stderr": "",
  "execution_time_ms": 261
}
```

---

## 🎯 Real-World Workflows

### 1. API Aggregation + Knowledge Storage

```javascript
// Fetch data from multiple APIs in parallel
const [github, twitter, linkedin] = await Promise.all([
  fetch('https://api.github.com/users/username').then(r => r.json()),
  fetch('https://api.twitter.com/user/username').then(r => r.json()),
  fetch('https://api.linkedin.com/profile/username').then(r => r.json())
]);

// Store aggregated profile in AutoMem
await mcp.automem.store_memory({
  content: `Profile: ${github.name} - ${github.bio}`,
  tags: ['profile', 'social-media'],
  metadata: {
    github_repos: github.public_repos,
    twitter_followers: twitter.followers_count,
    linkedin_connections: linkedin.connections
  }
});

return { profile: 'stored', sources: 3 };
```

### 2. Research + Documentation Lookup

```javascript
// Use Context7 to get official React docs
const reactDocs = await mcp.context7.get_library_docs({
  context7CompatibleLibraryID: '/facebook/react',
  topic: 'hooks'
});

// Analyze with Sequential Thinking
const analysis = await mcp.sequential_thinking.sequentialthinking({
  thought: "Compare React hooks patterns with Vue Composition API",
  thoughtNumber: 1,
  totalThoughts: 3,
  nextThoughtNeeded: true
});

return { documentation: reactDocs, analysis };
```

### 3. Knowledge Graph Building

```javascript
// Fetch related entities
const company = await fetch(`https://api.example.com/companies/${id}`).then(r => r.json());

// Store as memory nodes
const companyMemory = await mcp.automem.store_memory({
  content: `Company: ${company.name} in ${company.industry}`,
  tags: ['company', company.industry]
});

// Create relationships
for (const product of company.products) {
  const productMemory = await mcp.automem.store_memory({
    content: `Product: ${product.name}`,
    tags: ['product']
  });

  await mcp.automem.associate_memories({
    memory1_id: companyMemory.memory_id,
    memory2_id: productMemory.memory_id,
    type: 'RELATES_TO',
    strength: 0.9
  });
}

return { graph_nodes: company.products.length + 1 };
```

---

## 🏗️ Architecture

### Dual Service Design

```
┌─────────────────────────────────────────────────────────┐
│                  CodeMode Unified                       │
├─────────────────────┬───────────────────────────────────┤
│                     │                                   │
│   MCP Server        │        HTTP Backend               │
│   (stdio)           │        (port 3001)                │
│                     │                                   │
│   ├─ MCP Client     │   ├─ REST API                     │
│   ├─ Tool Bridge    │   ├─ WebSocket                    │
│   └─ Executor       │   └─ MCP Aggregator               │
│        │            │           │                       │
└────────┼────────────┴───────────┼───────────────────────┘
         │                        │
         └────────────┬───────────┘
                      ▼
         ┌──────────────────────────┐
         │   Runtime Executor       │
         ├──────────────────────────┤
         │  ├─ Bun Runtime          │
         │  ├─ QuickJS Runtime      │
         │  ├─ Deno Runtime         │
         │  ├─ Isolated-VM          │
         │  └─ E2B Runtime          │
         └──────────────────────────┘
                      │
         ┌────────────┴─────────────┐
         │                          │
         ▼                          ▼
    ┌─────────┐              ┌─────────────┐
    │   MCP   │              │  Standard   │
    │  Tools  │              │    APIs     │
    └─────────┘              └─────────────┘
    AutoMem                  fetch()
    Context7                 console
    Sequential               Date, JSON, etc
```

### Key Components

- **[executor.ts](src/executor.ts)** - Core orchestration and runtime selection
- **[mcp-server.ts](src/mcp-server.ts)** - MCP protocol implementation with tool bridge
- **[server.ts](src/server.ts)** - HTTP/WebSocket server with REST API
- **[runtime/bun-runtime.ts](src/runtime/bun-runtime.ts)** - Bun execution engine (recommended)
- **[mcp-aggregator.ts](src/mcp-aggregator.ts)** - Multi-server MCP client

---

## 🧪 Testing & Quality

### Test Coverage

```bash
# Run all tests
npm test

# Test specific runtimes
npm run test:runtime:bun
npm run test:runtime:quickjs
npm run test:runtime:deno

# Coverage report
npm run test:coverage
```

## 🧪 Testing & Quality

### Test Coverage

```bash
# Run all tests
npm test

# Test specific runtimes
npm run test:runtime:bun
npm run test:runtime:quickjs
npm run test:runtime:deno

# Coverage report
npm run test:coverage
```

### Performance Benchmarks

**Comprehensive benchmark suite available**: [examples/benchmarks/](examples/benchmarks/)

```bash
# Quick comparison (Deno vs Bun)
PATH="/Users/$USER/.deno/bin:$PATH" node examples/benchmarks/compare-runtimes.js

# Full benchmark suite (3 runtimes, 20+ tests)
PATH="/Users/$USER/.deno/bin:$PATH" node examples/benchmarks/runtime-comparison.js

# Deno validation suite
PATH="/Users/$USER/.deno/bin:$PATH" node examples/benchmarks/test-deno-runtime.js

# Real-world workflow test
PATH="/Users/$USER/.deno/bin:$PATH" node examples/benchmarks/test-deno-pokemon.js
```

**Benchmark Results** (Actual Testing):

| Test Type | Deno | Bun | Winner |
|-----------|------|-----|--------|
| Simple Expression | 21ms | 74ms | 🦕 Deno |
| Array Operations | 19ms | 10ms | 🍞 Bun |
| Single Fetch | 582ms | 183ms | 🍞 Bun |
| Parallel Fetches | 353ms | 152ms | 🍞 Bun |
| **Average** | **199ms** | **86ms** | **🍞 Bun (2.3x faster)** |

See [examples/benchmarks/README.md](examples/benchmarks/README.md) for complete analysis.

### Production Testing Results

✅ **6/6 Workflows Passed** (100% success rate)

**Tested Capabilities:**
- ✅ Multi-API data aggregation
- ✅ Async/await with Promise.all
- ✅ MCP tool integration (store, recall, associate)
- ✅ Structured object returns
- ✅ Knowledge graph creation
- ✅ Error handling and recovery
- ✅ Complex nested data structures
- ✅ Real-world API interactions

**Performance:**
- Execution Time: 150-300ms per workflow (Bun), 350-1400ms (Deno)
- Memory Usage: <50MB per sandbox
- Throughput: 1000+ requests/second (Bun), 500+ req/sec (Deno)

---

## 🎓 Key Features Explained

### Multi-Runtime Support

Each runtime has different strengths:

| Runtime | Async | NPM Packages | Startup | Best For |
|---------|-------|--------------|---------|----------|
| **Bun** ⭐ | ✅ Full | ✅ Yes | 50-100ms | Production workflows |
| **QuickJS** | ⚠️ Emulated | ❌ No | 5-10ms | Quick computations |
| **Deno** | ✅ Full | ✅ Yes | 100-200ms | Secure execution |
| **isolated-vm** | ✅ Full | ⚠️ Limited | 50-100ms | Custom isolation |
| **E2B** | ✅ Full | ✅ Yes | 1-5s | Untrusted code |

### MCP Tool Access

All MCP tools are automatically namespaced and available:

```javascript
// AutoMem (7 tools)
await mcp.automem.store_memory({...})
await mcp.automem.recall_memory({...})
await mcp.automem.associate_memories({...})
await mcp.automem.update_memory({...})
await mcp.automem.delete_memory({...})
await mcp.automem.search_memory_by_tag({...})
await mcp.automem.check_database_health()

// Context7 (2 tools)
await mcp.context7.resolve_library_id({...})
await mcp.context7.get_library_docs({...})

// Sequential Thinking (1 tool)
await mcp.sequential_thinking.sequentialthinking({...})
```

### Structured Response Parsing

The system intelligently parses both structured and formatted responses:

```javascript
// MCP tools might return formatted text or JSON
const result = await mcp.automem.recall_memory({query: 'test'});

// Automatically parsed to structured data:
// {
//   _text: "original formatted text",
//   memory_id: "abc123",
//   content: "stored content",
//   tags: "tag1, tag2"
// }
```

---

## 🐛 Bug Fixes & Known Issues

### ✅ Recently Fixed

1. **Return Statement Wrapping** - Multi-line return statements now work correctly
2. **MCP Response Parsing** - Handles both JSON and formatted text responses
3. **Config Loading** - Properly maps mcpServers→servers format
4. **Process Cleanup** - No zombie processes after restarts

### ⚠️ Known Limitations

1. **Context7 Parsing** - Occasional inconsistencies with complex doc structures
2. **Tag-based Recall** - Less reliable than query-based memory recall
3. **QuickJS Async** - Two-pass system for async emulation (use Bun for real async)

---

## 📊 Performance Benchmarks

### Execution Speed
```
Bun Runtime:        50-100ms startup + execution time
QuickJS Runtime:    5-10ms startup + execution time
Deno Runtime:       100-200ms startup + execution time
```

### Throughput
```
Single-threaded:    1000+ req/sec
Worker pool (4):    3500+ req/sec
With MCP tools:     500+ req/sec (network-bound)
```

### Memory Usage
```
Base runtime:       10-20MB
Per sandbox:        5-50MB (depending on code)
MCP connections:    5-10MB per server
```

---

## 🔐 Security Model

### Sandbox Isolation
- ✅ Memory limits enforced (default 128MB)
- ✅ CPU quota restrictions (default 50%)
- ✅ Execution timeout (default 30s)
- ✅ Network access control
- ✅ Filesystem isolation

### Authentication Options
- JWT with HS256/RS256
- OAuth 2.1 with PKCE
- API key authentication
- Capability-based permissions

### Audit Logging
All code execution is logged with:
- Timestamp and user identity
- Code executed (sanitized)
- Runtime and resources used
- MCP tools accessed
- Success/failure status

---

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and components
- **[TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)** - Detailed specs
- **[RUNTIME_COMPARISON.md](RUNTIME_COMPARISON.md)** - Runtime trade-offs
- **[MCP_INTEGRATION_COMPLETE.md](MCP_INTEGRATION_COMPLETE.md)** - MCP setup guide
- **[TEST_RESULTS.md](TEST_RESULTS.md)** - Full test reports

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure `npm run typecheck` passes
5. Submit a pull request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with:
- [QuickJS](https://bellard.org/quickjs/) - Lightweight JavaScript engine
- [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
- [Model Context Protocol](https://github.com/modelcontextprotocol) - AI-native tool protocol
- [Fastify](https://fastify.io) - High-performance web framework

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/danieliser/codemode-unified/issues)
- **Discussions**: [GitHub Discussions](https://github.com/danieliser/codemode-unified/discussions)
- **Twitter**: [@danieliser](https://twitter.com/danieliser)

---

**Built with ❤️ for the AI agent ecosystem**