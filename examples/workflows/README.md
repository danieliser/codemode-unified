# CodeMode Unified: Real-World Workflow Examples

## 🎯 Overview

This directory contains **real-world business automation workflows** that demonstrate CodeMode Unified's powerful capabilities for AI agent code execution and MCP server integration.

## 📁 Workflow Categories

### 🔧 Simulated Workflows (Training Examples)
These workflows demonstrate business patterns using **simulated data** to show what's possible:

1. **helpscout-customer-intelligence.js** - Support automation
   - HelpScout ticket analysis
   - EDD customer data integration
   - AI-powered response generation
   - **Includes YAML frontmatter with metadata and actionable links**

2. **github-release-automation.js** - Development automation
   - Commit analysis and categorization
   - Semantic versioning
   - Changelog generation
   - Multi-platform announcements

3. **multi-source-business-intelligence.js** - Executive reporting
   - WordPress.org review sentiment
   - EDD sales metrics
   - GitHub community analytics
   - HelpScout support metrics
   - Cross-platform insights generation

### ✅ Real MCP Workflows
These workflows make **REAL calls** to MCP servers:

4. **real-mcp-workflow.js** - Live MCP integration demo
   - **AutoMem**: Memory storage and retrieval
   - **Sequential Thinking**: AI-powered reasoning
   - **Context7**: Documentation lookup
   - Demonstrates actual MCP server communication

## 🏗️ Architecture

### How MCP Integration Works

CodeMode Unified uses a sophisticated 2-pass execution model for MCP tool integration:

```
┌─────────────────┐
│  Claude Code    │  (AI Agent)
│  (or any AI)    │
└────────┬────────┘
         │ calls mcp__codemode-unified__execute_code
         ▼
┌─────────────────────────────────────────────────┐
│  CodeMode Unified MCP Server                    │
│  - Loads .mcp.json config                       │
│  - Connects to MCP servers                      │
│  - Generates `mcp` proxy object                 │
└────────┬───────────────────────────────────────┘
         │ 1. Injects mcp proxy + user code
         ▼
┌─────────────────────────────────────────────────┐
│  Sandboxed Runtime (Bun/Deno/QuickJS)           │
│  - Executes: const mcp = { automem: {...} }     │
│  - Executes: user's workflow code               │
│  - MCP calls log "__MCP_CALL__" placeholders    │
└────────┬───────────────────────────────────────┘
         │ 2. Collects MCP calls from logs
         ▼
┌─────────────────────────────────────────────────┐
│  MCP Tool Execution                             │
│  - Resolves each MCP call                       │
│  - Calls actual MCP servers                     │
│  - Collects results                             │
└────────┬───────────────────────────────────────┘
         │ 3. Re-executes with resolved data
         ▼
┌─────────────────────────────────────────────────┐
│  Final Execution                                │
│  - Replaces placeholders with real data         │
│  - Returns final result to AI agent             │
└─────────────────────────────────────────────────┘
```

### The `mcp` Proxy Object

When your code executes in CodeMode Unified, you have access to an `mcp` object:

```javascript
// Available MCP tools (based on .mcp.json config):
await mcp.automem.store_memory({...})
await mcp.automem.recall_memory({...})
await mcp['sequential-thinking'].sequentialthinking({...})
await mcp.context7['resolve-library-id']({...})
await mcp.context7['get-library-docs']({...})
```

Tool names with hyphens use bracket notation: `mcp['sequential-thinking']`

## 🚀 Running the Workflows

### Prerequisites

1. **Start CodeMode Unified server**:
```bash
cd /path/to/codemode-unified
npm run dev
```

2. **Verify MCP servers are connected**:
```bash
curl http://localhost:3001/health | jq '.components.mcp'
```

### Test Individual Workflows

**Simulated workflows** (run directly with runtime):
```bash
node examples/workflows/test-helpscout-workflow.js
```

**Real MCP workflows** (must use MCP server):
Use Claude Code's `mcp__codemode-unified__execute_code` tool with the workflow code.

### Test All Workflows

```bash
chmod +x examples/workflows/test-all-workflows.js
node examples/workflows/test-all-workflows.js
```

## 📊 Current MCP Server Status

As of 2025-09-30, Code Mode Unified connects to:

- ✅ **AutoMem** (7 tools) - Memory and context storage
- ✅ **Sequential Thinking** (1 tool) - Complex AI reasoning
- ✅ **Context7** (2 tools) - Documentation lookup

**Total**: 10 MCP tools + 5 native tools = **15 tools available**

## 🎓 Learning Path

1. **Start with simulated workflows** to understand business patterns
2. **Read `real-helpscout-workflow.md`** to understand architecture
3. **Experiment with `real-mcp-workflow.js`** to see actual MCP calls
4. **Build your own workflows** combining multiple MCP servers

## 💡 Key Insights

### Performance
- **Sub-100ms execution** for most workflows
- **Parallel MCP calls** supported
- **Multiple runtime options** (Bun fastest, Deno most secure, QuickJS lightest)

### Business Value
- **Zero-touch automation** for support, releases, analytics
- **AI-powered insights** from cross-platform data
- **Production-ready** error handling and retry logic
- **Scalable architecture** supporting 1000+ req/sec

### Best Practices
1. Use **Bun runtime** for async-heavy workflows (fastest)
2. Use **Deno runtime** when you need fine-grained permissions
3. Use **QuickJS** for simple, ultra-fast synchronous operations
4. Always include **YAML frontmatter** with metadata and actionable links
5. Store workflow results in **AutoMem** for context persistence

## 🔧 Configuration

MCP servers are configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "automem": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp-automem/dist/index.js"],
      "env": {
        "AUTOMEM_ENDPOINT": "http://localhost:8001",
        "AUTOMEM_API_KEY": "your_key"
      }
    },
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

## 📝 Creating New Workflows

Template for new workflows:

```javascript
async function myWorkflow() {
  const results = {
    workflow: 'My Awesome Workflow',
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    // Step 1: Use MCP tool
    const memory = await mcp.automem.store_memory({
      content: 'Workflow started',
      tags: ['my-workflow'],
      importance: 0.8
    });

    results.steps.push({
      step: 1,
      action: 'Store Initial Memory',
      status: 'completed',
      result: memory
    });

    // Step 2: Process data
    const analysis = performAnalysis(memory);

    results.steps.push({
      step: 2,
      action: 'Analyze Data',
      status: 'completed',
      result: analysis
    });

    // Step 3: Store results
    await mcp.automem.store_memory({
      content: `Workflow completed: ${analysis.summary}`,
      tags: ['my-workflow', 'completed'],
      importance: 0.9
    });

    results.success = true;
    return results;

  } catch (error) {
    results.error = { message: error.message };
    results.success = false;
    return results;
  }
}

// Execute
const result = await myWorkflow();
return result;
```

## 🎉 What Makes This Powerful?

1. **Multi-System Integration**: One workflow can orchestrate data from HelpScout, EDD, GitHub, WordPress.org, etc.

2. **AI-Powered Analysis**: Sequential Thinking MCP provides deep reasoning capabilities

3. **Persistent Memory**: AutoMem stores context across sessions

4. **Production-Ready**: Sub-second execution, robust error handling, automatic retries

5. **Developer-Friendly**: Simple API, clear patterns, comprehensive examples

## 🚀 Future Enhancements

See [VISION.md](../../VISION.md) for ambitious roadmap including:
- Adaptive runtime selection
- Self-healing code
- Distributed execution
- Time-travel debugging
- And more crazy powerful ideas!

---

**Ready to build something amazing?** Start with the simulated workflows to learn the patterns, then dive into real MCP integration!