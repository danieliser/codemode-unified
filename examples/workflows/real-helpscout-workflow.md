# Real HelpScout Customer Intelligence Workflow

## Overview

This document describes how to create a **real** workflow that actually uses MCP tools, not simulated data.

## Architecture

```
Claude Code (AI Agent)
  ↓
mcp__codemode-unified__execute_code
  ↓
Bun Runtime (executes user code)
  ↓ (code would need to call back to...)
MCP Tools (helpscout, automem, etc.)
```

## The Problem

When code executes inside Bun/Deno/QuickJS runtimes, it runs in a **sandboxed environment** with no access to:
- MCP servers
- File system
- External services (without explicit permissions)

## Solution 1: MCP Bridge Pattern

The code running in the sandbox would need to call **back** to Claude Code via a bridge:

```javascript
// Inside sandboxed runtime
async function callMCP(tool, params) {
  const response = await fetch('http://localhost:3000/mcp-bridge', {
    method: 'POST',
    body: JSON.stringify({ tool, params })
  });
  return response.json();
}

// Now we can use real MCP tools
const ticket = await callMCP('mcp__helpscout__freescout_get_ticket', {
  ticketId: 12345
});
```

## Solution 2: Pre-Execute Pattern (Current Approach)

Claude Code fetches all the data **before** executing the code:

```javascript
// Claude Code does this FIRST:
const ticket = await use_mcp_tool('mcp__helpscout__freescout_get_ticket', { ticketId: 12345 });
const customer = await use_mcp_tool('mcp__edd_api__get_customer', { email: ticket.email });
const memories = await use_mcp_tool('mcp__automem__recall_memory', { query: ticket.email });

// Then passes the data INTO the code execution:
const result = await codemode.execute_code(`
  const ticket = ${JSON.stringify(ticket)};
  const customer = ${JSON.stringify(customer)};
  const memories = ${JSON.stringify(memories)};

  // Now process the data...
  const insights = analyzeCustomer(customer, ticket, memories);
  return insights;
`);
```

## Solution 3: Full Integration (Future)

In the future, CodeMode Unified could:

1. **Detect MCP Tool Calls** in user code
2. **Proxy those calls** back to Claude Code
3. **Inject results** into the sandboxed execution

```javascript
// User writes this:
const ticket = await mcp__helpscout__freescout_get_ticket({ ticketId: 12345 });

// CodeMode runtime detects MCP call pattern
// Makes request back to Claude Code
// Returns real data to sandboxed code
```

## Current Best Practice

For **real production workflows**, use CodeMode Unified for:
- ✅ Data transformation and analysis
- ✅ Complex business logic execution
- ✅ AI-powered content generation
- ✅ Performance-critical operations

And have **Claude Code** handle:
- ✅ MCP tool orchestration
- ✅ File system operations
- ✅ External API calls
- ✅ Cross-system integration

## Example: Real Production Workflow

```javascript
// Claude Code execution (not in sandbox)
const ticket = await use_mcp_tool('mcp__helpscout__freescout_get_ticket', {
  ticketId: 12345
});

const customerData = await use_mcp_tool('mcp__edd_api__get_customer', {
  email: ticket.customerEmail
});

// Now use CodeMode for complex analysis
const analysis = await use_mcp_tool('mcp__codemode-unified__execute_code', {
  code: `
    const ticket = ${JSON.stringify(ticket)};
    const customer = ${JSON.stringify(customerData)};

    // Complex business logic here
    const insights = {
      tier: customer.lifetimeValue > 200 ? 'VIP' : 'Standard',
      riskScore: calculateRisk(customer, ticket),
      suggestedActions: generateActions(customer, ticket),
      upsellOpportunities: findUpsells(customer)
    };

    return insights;
  `,
  runtime: 'bun'
});

// Store in AutoMem
await use_mcp_tool('mcp__automem__store_memory', {
  content: `Support ticket analysis: ${analysis.tier} customer`,
  tags: ['support', 'analysis', ticket.id],
  importance: analysis.tier === 'VIP' ? 0.9 : 0.7
});

// Generate response
const response = generateSupportResponse(ticket, customerData, analysis);
```

## Summary

The workflows in `examples/workflows/` demonstrate:
- ✅ What **kinds of business problems** CodeMode can solve
- ✅ The **structure and patterns** for complex workflows
- ✅ The **performance and capabilities** of different runtimes

But they use **simulated data** because real MCP integration requires the MCP Bridge pattern or Pre-Execute pattern described above.

For **production use**, Claude Code would:
1. Fetch data from MCP servers
2. Pass data to CodeMode for processing
3. Use results for further actions

This gives you **the best of both worlds**:
- Fast, sandboxed code execution
- Full access to MCP ecosystem
- Secure, production-ready architecture