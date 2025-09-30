# TypeScript Code Generation from MCP Schemas - Research Report

**Date**: 2025-09-30
**Research Goal**: Investigate existing solutions for generating TypeScript APIs from MCP tool schemas to enable IDE autocomplete and type safety

---

## Executive Summary

The research reveals that **Cloudflare's "Code Mode" approach exists as a concept but lacks open-source implementation details**. While the community has built several frameworks for MCP server development with TypeScript, **no existing solution automatically generates TypeScript client APIs from MCP schemas for IDE autocomplete**.

**Key Finding**: This represents a **greenfield opportunity** to build a first-class TypeScript code generation system that bridges MCP schemas to IDE-friendly type definitions.

---

## 1. Existing Solutions Analysis

### 1.1 Cloudflare's Code Mode (Conceptual)

**Status**: ⚠️ Announced but not open-sourced

**What They Claim**:
- Automatically converts MCP server schemas → TypeScript APIs
- Generates interfaces, doc comments, and type-safe method signatures
- Uses V8 isolates for sandboxed execution
- Provides "bindings" to MCP servers within sandbox

**What's Missing**:
- ❌ No public implementation or source code
- ❌ No details on schema → TypeScript conversion algorithm
- ❌ No code generation tool available
- ❌ Appears to be integrated into Cloudflare Workers (proprietary)

**Source**: [Code Mode: the better way to use MCP](https://blog.cloudflare.com/code-mode/)

**Key Quote**:
> "When you connect to an MCP server in 'code mode', the Agents SDK will fetch the MCP server's schema, and then convert it into a TypeScript API, complete with doc comments based on the schema."

---

### 1.2 jx-codes/codemode-mcp (Open Source Implementation)

**Repository**: https://github.com/jx-codes/codemode-mcp
**Status**: ✅ Working implementation, but limited

**What It Does**:
- Provides HTTP proxy for MCP server access (`localhost:3001`)
- Uses Deno as sandbox runtime for code execution
- Exposes `execute_code` tool for LLMs to write TypeScript/JavaScript
- Lists available servers and tools via REST API

**What It Doesn't Do**:
- ❌ No automatic TypeScript API generation from schemas
- ❌ No IDE autocomplete support
- ❌ LLMs must use `fetch()` to call proxy endpoints (not typed APIs)
- ❌ No code generation from MCP tool schemas

**Architecture**:
```
LLM writes code → Deno sandbox → HTTP proxy → MCP servers
                      ↑
                  No TypeScript
                  API generation
```

**Key Limitation**: README explicitly states that automatic TypeScript API generation is "a potential future enhancement" not currently implemented.

---

### 1.3 Official MCP TypeScript SDK

**Repository**: https://github.com/modelcontextprotocol/typescript-sdk
**Purpose**: Build MCP servers and clients

**Schema Definition Approach**:
- Uses **Zod** for runtime schema validation
- Tool registration includes `inputSchema` with Zod types
- Provides **runtime** type checking, not **compile-time** type generation

**Example**:
```typescript
server.registerTool("calculate-bmi", {
  title: "BMI Calculator",
  description: "Calculate Body Mass Index",
  inputSchema: {
    weightKg: z.number(),
    heightM: z.number()
  }
}, async ({ weightKg, heightM }) => ({
  content: [{ type: "text", text: String(weightKg / (heightM * heightM)) }]
}));
```

**Limitation for Our Use Case**:
- ✅ Defines schemas for **building** MCP servers
- ❌ Does NOT generate TypeScript client APIs for **consuming** MCP servers
- ❌ No codegen tool for schema → TypeScript types

---

### 1.4 MCP Framework Solutions

#### mcp-framework (QuantGeekDev)
**Repository**: https://github.com/QuantGeekDev/mcp-framework

**Features**:
- Directory-based discovery for tools
- Automatic TypeScript type inference from Zod schemas
- Enforces description requirements for better documentation

**Key Feature**:
```typescript
// TypeScript automatically infers types from Zod schema
const myTool = defineTool({
  name: "my-tool",
  description: "...",
  input: z.object({
    message: z.string().describe("Input message")
  })
}, async ({ message }) => {
  // `message` is automatically typed as string
  return { content: [{ type: "text", text: message }] };
});
```

**Limitation**:
- ✅ Great for **server-side** type safety
- ❌ Does NOT generate **client-side** TypeScript APIs
- ❌ Type inference only works within server definition, not for consumers

#### FastMCP (TypeScript)
**Repository**: https://github.com/punkpeye/fastmcp

**Features**:
- Framework for building MCP servers
- Supports Zod and Valibot for schema validation
- Automatic schema generation in both cases

**Limitation**: Same as mcp-framework - server-side only, no client codegen

---

### 1.5 Type Generation Libraries

#### mcp-types (Community Package)
**Repository**: https://github.com/punkpeye/mcp-types

**Purpose**: Static TypeScript types for MCP protocol

**What It Provides**:
- Zod schemas for MCP protocol types (`Tool`, `Resource`, `Prompt`)
- Static TypeScript types generated via `zod-to-typescript`
- Drop-in replacement for official SDK types

**Example**:
```typescript
import type { Tool, Resource, Prompt } from "mcp-types";
import { ToolSchema, ResourceSchema, PromptSchema } from "mcp-types";
```

**Limitation**:
- ✅ Provides **protocol-level** types (Tool, Resource, Prompt)
- ❌ Does NOT generate types for **specific tool implementations**
- ❌ No codegen from individual MCP server schemas

---

## 2. Gap Analysis

### What Exists:
1. ✅ MCP protocol specification and TypeScript SDK
2. ✅ Runtime schema validation with Zod
3. ✅ Server-side type inference within tool definitions
4. ✅ HTTP proxy implementations for MCP access
5. ✅ Sandboxed code execution environments (Deno, Bun, QuickJS)

### What's Missing:
1. ❌ **Client-side TypeScript API generation from MCP schemas**
2. ❌ **IDE autocomplete for MCP tool calls**
3. ❌ **Compile-time type checking for tool arguments**
4. ❌ **Automatic TypeScript declaration file (`.d.ts`) generation**
5. ❌ **Developer tooling for schema → TypeScript codegen workflow**

---

## 3. Community Sentiment Analysis

### Hacker News Discussions

**Thread**: [Code Mode: the better way to use MCP](https://news.ycombinator.com/item?id=45386248)

**Key Insights**:
- Community is interested in Code Mode but frustrated by lack of implementation details
- Developers recognize that "LLMs are better at writing code than tool calling"
- Some skepticism about whether it's truly revolutionary vs. incremental improvement
- Questions about security implications of sandboxed code execution

**Thread**: [Show HN: I built an MCP server using Cloudflare's code mode pattern](https://news.ycombinator.com/item?id=45405584)

**Key Insights**:
- Community appreciated the open-source attempt (jx-codes/codemode-mcp)
- Developers noted the gap between Cloudflare's claims and available implementations
- Interest in Deno as sandbox runtime for TypeScript execution

### Reddit Community Response

**Limited Discussion Found**: Search for MCP and Code Mode on r/programming and r/MachineLearning yielded minimal results

**General Sentiment**:
- MCP adoption is still early stage
- Developers are experimenting with MCP servers but tooling is immature
- Mixed reactions to Anthropic's MCP - some see it as convenient, others skeptical of "game-changer" claims

### Developer Adoption

**Positive Signs**:
- Companies like Block, Apollo, Zed, Replit, Codeium, Sourcegraph integrating MCP
- Growing ecosystem of MCP servers (100+ implementations on GitHub)
- Active development of frameworks (mcp-framework, FastMCP, mcp-ts-template)

**Challenges**:
- Tooling ecosystem is fragmented
- No standard approach to type generation
- Steep learning curve for MCP protocol
- Security concerns about running untrusted code

---

## 4. Technical Architecture Analysis

### Cloudflare's Approach (Inferred)

Based on blog posts and documentation, Cloudflare likely:

1. **Schema Fetching**: Calls MCP `tools/list` to get tool schemas
2. **AST Generation**: Converts JSON schemas → TypeScript AST
3. **Type Declaration**: Generates interface definitions for inputs/outputs
4. **Doc Comment Injection**: Transforms schema descriptions → TSDoc comments
5. **Binding Generation**: Creates runtime proxy objects with typed interfaces
6. **V8 Isolate Integration**: Injects bindings into sandboxed execution context

**Inferred Architecture**:
```typescript
MCP Server Schema
       ↓
[Schema Parser]
       ↓
[TypeScript AST Generator]
       ↓
[Type Declaration Writer]
       ↓
interface GeneratedAPI {
  /** Tool description from schema */
  toolName(args: {
    param1: string;
    param2: number;
  }): Promise<ToolResult>;
}
       ↓
[Runtime Binding Generator]
       ↓
const mcp = {
  serverName: {
    toolName: async (args) => callMCPTool('serverName', 'toolName', args)
  }
}
```

### Current codemode-unified Implementation

**What We Have**:
```typescript
// MCP Manager discovers tools
mcpManager.getTools() → [
  { namespace: "automem.store_memory", schema: {...} },
  { namespace: "context7.resolve-library-id", schema: {...} }
]

// Code execution receives MCP proxy
const mcp = {
  automem: {
    store_memory: async (args) => __mcpCall('automem.store_memory', args)
  }
}
```

**Limitation**: No TypeScript type definitions for `mcp` object!

---

## 5. Competitive Landscape

### Direct Competitors (None Found)
- ❌ No open-source tools for MCP schema → TypeScript codegen
- ❌ Cloudflare's solution is proprietary/unavailable

### Adjacent Solutions
1. **OpenAPI → TypeScript Codegen** (e.g., openapi-typescript)
   - Mature ecosystem for REST API type generation
   - Could be adapted for MCP schemas

2. **JSON Schema → TypeScript** (e.g., json-schema-to-typescript)
   - Core technology for schema transformation
   - MCP schemas are JSON Schema compatible

3. **GraphQL Code Generators** (e.g., graphql-codegen)
   - Similar problem: schema → typed client APIs
   - Proven patterns for IDE autocomplete support

---

## 6. Recommendations

### Primary Recommendation: Build It

**Why**:
1. ✅ Clear market gap - no existing solution
2. ✅ Strong developer demand (based on community discussions)
3. ✅ Proven patterns from adjacent domains (OpenAPI, GraphQL)
4. ✅ We already have the infrastructure (codemode-unified MCP bridge)

**Value Proposition**:
- First-class TypeScript support for MCP consumers
- IDE autocomplete for all MCP tools
- Compile-time type checking for tool calls
- Automatic declaration file generation

### Architecture Proposal (High-Level)

```typescript
┌─────────────────────────────────────────────────┐
│         MCP Schema Discovery                     │
│  (Fetch schemas from all connected MCP servers) │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│      Schema → TypeScript Transformer            │
│  • Parse JSON Schema input definitions          │
│  • Generate TypeScript interfaces                │
│  • Create TSDoc comments from descriptions       │
│  • Handle unions, optionals, arrays, objects     │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│      Declaration File Generator                  │
│  • Write .d.ts files for each MCP server         │
│  • Export typed namespaces                       │
│  • Include return type definitions               │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│      Runtime Proxy Generator                     │
│  • Create proxy objects matching types           │
│  • Inject into code execution context            │
│  • Maintain type safety at runtime               │
└─────────────────────────────────────────────────┘
```

---

## 7. Next Steps

### Phase 1: Proof of Concept (2-3 days)
1. Design schema → TypeScript transformer
2. Build prototype for single MCP server (AutoMem)
3. Generate `.d.ts` file with IDE autocomplete support
4. Test with real code execution in codemode-unified

### Phase 2: Full Implementation (1-2 weeks)
1. Support all MCP schema types (unions, optionals, arrays, nested objects)
2. Generate declaration files for all connected MCP servers
3. Integrate with build system for automatic regeneration
4. Add CLI tool for manual codegen (`npx mcp-codegen`)

### Phase 3: Distribution (1 week)
1. Package as standalone npm library (`@companykit/mcp-codegen`)
2. Integrate into codemode-unified startup
3. Write documentation and examples
4. Publish to npm and promote to MCP community

---

## 8. Technical Considerations

### Schema Format
MCP tools use JSON Schema for `inputSchema`:
```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "description": "Memory content to store"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Optional tags"
    }
  },
  "required": ["content"]
}
```

### Target TypeScript Output
```typescript
declare namespace mcp {
  namespace automem {
    /**
     * Store a memory with optional tags and metadata
     */
    function store_memory(args: {
      /** Memory content to store */
      content: string;
      /** Optional tags */
      tags?: string[];
      /** Importance score 0-1 */
      importance?: number;
    }): Promise<MCPToolResult>;
  }
}
```

### Libraries to Use
1. **json-schema-to-typescript**: Convert JSON Schema → TypeScript types
2. **TypeScript Compiler API**: Generate declaration files programmatically
3. **prettier**: Format generated TypeScript code
4. **ajv**: Validate MCP schemas before transformation

---

## 9. Risk Assessment

### Low Risk
- ✅ JSON Schema → TypeScript is well-understood problem
- ✅ We control both schema source and execution environment
- ✅ Incremental adoption (works alongside existing proxy approach)

### Medium Risk
- ⚠️ MCP schema complexity (recursive types, unions, complex validation)
- ⚠️ Keeping generated types in sync with schema changes
- ⚠️ Tool result types are less standardized than inputs

### High Risk
- 🚨 None identified - this is a greenfield opportunity with proven patterns

---

## 10. References

### Primary Sources
- [Cloudflare Code Mode Blog Post](https://blog.cloudflare.com/code-mode/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [jx-codes/codemode-mcp](https://github.com/jx-codes/codemode-mcp)
- [MCP Specification](https://github.com/modelcontextprotocol/modelcontextprotocol)

### Related Projects
- [mcp-framework](https://github.com/QuantGeekDev/mcp-framework)
- [FastMCP TypeScript](https://github.com/punkpeye/fastmcp)
- [mcp-types](https://github.com/punkpeye/mcp-types)
- [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript)

### Community Discussions
- [HN: Code Mode announcement](https://news.ycombinator.com/item?id=45386248)
- [HN: CodeMode MCP implementation](https://news.ycombinator.com/item?id=45405584)

---

## Conclusion

**The opportunity is clear**: Build the first open-source, production-ready TypeScript code generation system for MCP schemas. This will:

1. Fill a critical gap in the MCP ecosystem
2. Provide first-class TypeScript support for codemode-unified
3. Enable IDE autocomplete for all MCP tools
4. Position CompanyKit as a leader in MCP tooling innovation

The technical path is well-understood, risks are manageable, and community demand is strong. **This is a greenfield opportunity worth pursuing.**

---

**Next Document**: [TYPESCRIPT_CODEGEN_DESIGN.md](TYPESCRIPT_CODEGEN_DESIGN.md) - Detailed technical design and implementation plan