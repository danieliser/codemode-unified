# 🚀 CodeMode Unified - Now Production Ready!

I'm excited to share **CodeMode Unified** - a high-performance code execution platform for AI agents that I've been building! 🎉

---

## 🎯 What is it?

A dual-architecture service that lets AI agents (like Claude Code) execute JavaScript/TypeScript with full access to MCP tools, APIs, and knowledge systems.

**Two ways to use it:**
1. **MCP Server Mode** - Direct integration with Claude Code
2. **HTTP Backend** - REST API for any AI platform

---

## ⚡ Key Features

### Multi-Runtime Execution
Choose the right runtime for your use case:
- **Bun** ⭐ - Full async/await, fastest execution (50-100ms startup)
- **QuickJS** - Ultra-lightweight, 5-10ms startup
- **Deno** - Secure by default with explicit permissions
- **isolated-vm** - V8 isolates for maximum control
- **E2B** - Cloud sandboxes for untrusted code

### 🧠 MCP Tool Integration
Execute code with instant access to your entire MCP ecosystem:
- **AutoMem** - AI memory with graph relationships
- **Context7** - Official library documentation
- **Sequential Thinking** - Multi-step reasoning
- **HelpScout, WordPress, GitHub** - All your MCP servers!

### 🔒 Production-Ready
- ✅ 6/6 workflows passing (100% success rate)
- ✅ 150-300ms execution time
- ✅ 1000+ requests/second throughput
- ✅ Sandboxed execution with memory/CPU limits
- ✅ OAuth 2.1 + JWT authentication

---

## 💡 Real-World Example

```javascript
// AI agent executes this code with full MCP access
const pokemon = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu')
  .then(r => r.json());

// Store in AutoMem knowledge graph
const memory = await mcp.automem.store_memory({
  content: `Pokemon: ${pokemon.name} has ${pokemon.abilities.length} abilities`,
  tags: ['pokemon', 'api-test'],
  importance: 0.8,
  metadata: {
    height: pokemon.height,
    weight: pokemon.weight
  }
});

// Return structured results
return {
  pokemon: pokemon.name,
  memory_id: memory.memory_id,
  abilities: pokemon.abilities.map(a => a.ability.name)
};
```

**Result:** Agent can fetch external APIs, store knowledge, and return structured data - all in one execution!

---

## 🎬 Quick Start

**For Claude Code users:**
```json
// Add to .mcp.json
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

**For HTTP API:**
```bash
npm install
npm run build
npm start  # Runs on http://localhost:3001
```

---

## 🏗️ Architecture Highlights

### Dual Service Design
```
┌─────────────────────────────────────────┐
│         CodeMode Unified                │
├──────────────┬──────────────────────────┤
│  MCP Server  │      HTTP Backend        │
│   (stdio)    │      (port 3001)         │
└──────┬───────┴──────────┬───────────────┘
       │                  │
       └────────┬─────────┘
                ▼
       ┌────────────────┐
       │    Executor    │
       ├────────────────┤
       │ Multi-Runtime  │
       │   • Bun ⭐     │
       │   • QuickJS    │
       │   • Deno       │
       └────────┬───────┘
                │
       ┌────────┴────────┐
       │                 │
       ▼                 ▼
   MCP Tools      Standard APIs
   AutoMem        fetch()
   Context7       console
   Sequential     Date, JSON
```

---

## 📊 Performance Benchmarks

| Metric | Performance |
|--------|-------------|
| **Startup (Bun)** | 50-100ms |
| **Startup (QuickJS)** | 5-10ms |
| **Throughput** | 1000+ req/sec |
| **Memory/sandbox** | 5-50MB |
| **Success Rate** | 100% (6/6 workflows) |

---

## 🐛 Recently Fixed

Big shoutout to my testing partner for finding these critical bugs:

1. ✅ **Return statement wrapping** - Multi-line returns work correctly
2. ✅ **MCP response parsing** - Handles both JSON and formatted text
3. ✅ **Config loading** - Proper mcpServers→servers mapping
4. ✅ **Process cleanup** - No more zombie processes

---

## 🎯 Use Cases

**✅ API Aggregation**
Fetch from multiple APIs in parallel, aggregate results

**✅ Knowledge Graph Building**
Store entities and relationships in AutoMem

**✅ Research Workflows**
Use Context7 for docs, Sequential Thinking for analysis

**✅ Customer Data Analysis**
Access HelpScout, analyze patterns, generate insights

**✅ Content Operations**
WordPress integration for content management automation

---

## 📚 Resources

- **GitHub**: [danieliser/codemode-unified](https://github.com/danieliser/codemode-unified)
- **Documentation**: Full architecture, runtime comparison, MCP setup guide
- **Examples**: Pokemon showcase, API aggregation, knowledge graphs
- **License**: MIT (open source!)

---

## 🙏 Built With

- [QuickJS](https://bellard.org/quickjs/) - Lightweight JS engine
- [Bun](https://bun.sh) - Fast all-in-one runtime
- [Model Context Protocol](https://github.com/modelcontextprotocol) - AI-native tool protocol
- [Fastify](https://fastify.io) - High-performance web framework

---

## 💬 Let's Connect!

Would love to hear your thoughts, feedback, or use cases! Feel free to:
- Open issues or discussions on GitHub
- Contribute improvements or runtime implementations
- Share how you're using it in your AI workflows

**Built with ❤️ for the AI agent ecosystem** 🤖

---

## Screenshots & Demos

### 📸 Suggested Screenshots:

1. **Terminal Output** - Pokemon workflow execution with colored output
2. **Architecture Diagram** - The ASCII art from README
3. **Performance Metrics** - Execution times and throughput graph
4. **MCP Config** - Sample .mcp.json configuration
5. **Code Sample** - The Pokemon example with syntax highlighting
6. **Test Results** - 6/6 workflows passing output

### 🎥 Demo Ideas:

1. **Live execution** - Run Pokemon workflow via MCP tool
2. **Performance comparison** - Show different runtime speeds
3. **Knowledge graph** - Visualize AutoMem associations being created
4. **API aggregation** - Parallel Promise.all execution
5. **Error handling** - Show graceful failure and recovery

---

*Ready to supercharge your AI agents with code execution? Give it a try!* 🚀