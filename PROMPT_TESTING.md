# Systematic Prompt Testing Plan

This document outlines systematic testing to validate that Claude Code (and other MCP agents) properly understand and use the codemode-unified MCP server.

## Testing Objective

Verify that agents can:
1. ✅ Discover available MCP tools
2. ✅ Read TypeScript declarations from resources
3. ✅ Write type-safe code using MCP proxy
4. ✅ Handle both namespace styles (dot notation and bracket notation)
5. ✅ Successfully execute code with MCP tool calls

## Test Matrix

### Configuration Modes to Test

| Mode | Description | Token Cost | Agent Visibility |
|------|-------------|------------|------------------|
| **on-demand** | Types via resource only | ~300 tokens | Must read resource |
| **auto-include** | Types in tool description | ~1500 tokens | Immediate visibility |

## Test Suite

### Phase 1: Basic Discovery (Both Modes)

**Goal:** Verify agent can discover and understand the server capabilities

#### Test 1.1: List Available Tools
```
Prompt: "What tools are available from codemode-unified MCP server?"

Expected Behavior:
- Agent lists tools: execute_code, list_runtimes, get_runtime_capabilities, runtime_health_check
- Agent mentions MCP tool access via global mcp object
- Agent mentions resource mcp://types/declarations (on-demand mode)
- OR agent lists available MCP tools directly (auto-include mode)

Success Criteria:
✅ Agent identifies all 4 tools
✅ Agent understands MCP integration concept
✅ Agent knows how to get type information

Failure Modes:
❌ Agent doesn't mention resource in on-demand mode
❌ Agent doesn't understand mcp.* proxy concept
❌ Agent skips tool discovery
```

#### Test 1.2: Understand Resources
```
Prompt: "What resources does codemode-unified provide?"

Expected Behavior:
- Agent discovers mcp://types/declarations resource
- Agent explains it contains TypeScript type definitions
- Agent understands to read this BEFORE writing code

Success Criteria:
✅ Agent finds the resource
✅ Agent understands its purpose
✅ Agent knows when to use it

Failure Modes:
❌ Agent doesn't discover resources capability
❌ Agent confuses resource with tool
```

#### Test 1.3: Explore Prompts
```
Prompt: "What code templates are available from codemode-unified?"

Expected Behavior:
- Agent discovers 3 prompts: mcp-tool-example, async-handler, mcp-batch-operations
- Agent can retrieve and show prompt content
- Agent understands prompts provide code patterns

Success Criteria:
✅ Agent finds all 3 prompts
✅ Agent can retrieve prompt content
✅ Agent explains what each provides

Failure Modes:
❌ Agent doesn't explore prompts capability
❌ Agent confuses prompts with tools
```

### Phase 2: Type Discovery (Mode-Specific)

#### Test 2.1: on-demand Mode - Resource Reading
```
Prompt: "Show me the TypeScript types for MCP tools available in codemode-unified"

Expected Behavior:
- Agent reads mcp://types/declarations resource
- Agent displays TypeScript interfaces
- Agent identifies available namespaces (automem, sequential-thinking, context7, claude-code)

Success Criteria:
✅ Agent reads resource without prompting
✅ Agent displays type declarations
✅ Agent understands namespace structure

Failure Modes:
❌ Agent tries to generate types instead of reading resource
❌ Agent doesn't know how to read resources
❌ Agent reads resource but doesn't parse content
```

#### Test 2.2: auto-include Mode - Immediate Recognition
```
Prompt: "What MCP tools can I use when executing code?"

Expected Behavior:
- Agent lists MCP tools from tool description
- Agent shows namespace.method format
- Agent explains available operations

Success Criteria:
✅ Agent extracts tool list from description
✅ Agent correctly shows namespace syntax
✅ Agent understands what each tool does

Failure Modes:
❌ Agent doesn't parse tool summary in description
❌ Agent incorrectly formats namespace access
❌ Agent misses tools in the list
```

### Phase 3: Code Generation

#### Test 3.1: Simple MCP Tool Call
```
Prompt: "Write code to store a memory using automem with content 'Test' and importance 0.8"

Expected Behavior (on-demand):
1. Agent reads mcp://types/declarations resource first
2. Agent writes type-safe code using mcp.automem.store_memory()
3. Agent includes all required parameters
4. Agent uses correct runtime (bun or deno for TypeScript)

Expected Behavior (auto-include):
1. Agent sees tool list in description
2. Agent writes code directly (may still read resource for types)
3. Same correct code as on-demand mode

Success Criteria:
✅ Agent reads types before coding (on-demand)
✅ Agent uses correct namespace syntax: mcp.automem
✅ Agent includes all required parameters with correct types
✅ Agent chooses TypeScript-aware runtime
✅ Code executes successfully

Failure Modes:
❌ Agent skips reading resource (on-demand)
❌ Agent uses wrong namespace: automem.store_memory() instead of mcp.automem
❌ Agent provides wrong argument types
❌ Agent uses QuickJS (doesn't support async)
❌ Execution fails due to syntax errors
```

#### Test 3.2: Hyphenated Namespace
```
Prompt: "Use sequential-thinking MCP tool to analyze the problem of code organization"

Expected Behavior:
- Agent recognizes hyphenated namespace requires bracket notation
- Agent writes: mcp["sequential-thinking"].sequentialthinking({...})
- Agent provides all required parameters
- Agent understands the tool's purpose

Success Criteria:
✅ Agent uses bracket notation: mcp["sequential-thinking"]
✅ Agent quotes the namespace correctly
✅ Agent provides proper arguments
✅ Code executes successfully

Failure Modes:
❌ Agent uses dot notation: mcp.sequential-thinking (syntax error)
❌ Agent doesn't quote namespace: mcp[sequential-thinking] (error)
❌ Agent skips hyphens: mcp.sequentialthinking (wrong namespace)
```

#### Test 3.3: Multiple Tool Calls
```
Prompt: "Store two memories and then use sequential-thinking to analyze them"

Expected Behavior:
- Agent combines multiple MCP tool calls
- Agent uses correct namespace for each
- Agent handles async operations properly
- Agent includes error handling

Success Criteria:
✅ Agent calls multiple MCP tools in sequence
✅ Agent mixes different namespace styles correctly
✅ Agent uses async/await properly
✅ Code executes all operations successfully

Failure Modes:
❌ Agent mixes up namespaces
❌ Agent forgets await on async calls
❌ Agent doesn't handle errors
```

#### Test 3.4: Batch Operations
```
Prompt: "Store 5 memories in parallel using Promise.allSettled"

Expected Behavior:
- Agent uses batch operations pattern
- Agent may reference mcp-batch-operations prompt
- Agent handles success/failure cases
- Agent reports results properly

Success Criteria:
✅ Agent uses parallel execution pattern
✅ Agent uses Promise.allSettled (not Promise.all)
✅ Agent handles both success and failure
✅ Code executes efficiently

Failure Modes:
❌ Agent uses sequential calls (slow)
❌ Agent uses Promise.all (fails on first error)
❌ Agent doesn't report which operations failed
```

### Phase 4: Error Handling

#### Test 4.1: Wrong Parameter Types
```
Prompt: "Store a memory with importance set to 'high'"

Expected Behavior:
- Agent reads types first
- Agent realizes importance must be number, not string
- Agent corrects to numeric value (e.g., 0.8)
- OR agent explains the type error

Success Criteria:
✅ Agent catches type mismatch before execution
✅ Agent provides correct type
✅ Code executes successfully

Failure Modes:
❌ Agent writes code with type error
❌ Execution fails with type error
❌ Agent doesn't consult types
```

#### Test 4.2: Missing Required Parameters
```
Prompt: "Call automem.store_memory without any arguments"

Expected Behavior:
- Agent reads types and sees 'content' is required
- Agent either refuses or adds placeholder value
- Agent explains parameter requirements

Success Criteria:
✅ Agent identifies missing required parameter
✅ Agent provides complete arguments
✅ Code is valid

Failure Modes:
❌ Agent writes incomplete code
❌ Execution fails due to missing parameter
```

### Phase 5: Runtime Selection

#### Test 5.1: Automatic Runtime Selection
```
Prompt: "Execute code that calls MCP tools"

Expected Behavior:
- Agent chooses Bun or Deno (TypeScript-aware)
- Agent avoids QuickJS (no async support)
- Agent explains runtime choice if asked

Success Criteria:
✅ Agent selects Bun or Deno automatically
✅ Code executes with async/await support
✅ MCP tools work correctly

Failure Modes:
❌ Agent uses QuickJS (no async)
❌ Code fails due to runtime limitations
```

#### Test 5.2: Explicit Runtime Request
```
Prompt: "Use Bun runtime to execute code with MCP tools"

Expected Behavior:
- Agent respects runtime choice
- Agent writes code appropriate for Bun
- Code executes successfully

Success Criteria:
✅ Agent uses specified runtime
✅ Code compatible with runtime
✅ Execution successful

Failure Modes:
❌ Agent ignores runtime request
❌ Agent uses wrong runtime
```

## Test Execution Protocol

### For Each Test:
1. **Setup:** Start server with appropriate configuration mode
2. **Execute:** Run the prompt with Claude Code
3. **Observe:** Record agent behavior and outcomes
4. **Score:** Rate understanding (0-100%)
5. **Document:** Note any failures or improvements needed

### Scoring Rubric

| Score | Meaning | Action |
|-------|---------|--------|
| **90-100%** | Excellent | Prompt is clear and effective |
| **75-89%** | Good | Minor refinements may help |
| **50-74%** | Needs Work | Significant prompt improvements needed |
| **0-49%** | Poor | Major redesign required |

### Success Threshold

**Target:** 99% comprehension on critical tests (Phase 1, 3.1, 3.2)
**Acceptable:** 95%+ on all other tests

## Results Documentation

For each test run, document:

```markdown
### Test X.Y: [Test Name]

**Date:** YYYY-MM-DD
**Mode:** on-demand | auto-include
**Model:** Claude 3.5 Sonnet | GPT-4 | etc.

**Prompt:**
[Exact prompt used]

**Agent Behavior:**
[What the agent did step-by-step]

**Outcome:**
✅ Success | ❌ Failure | ⚠️ Partial

**Score:** X%

**Issues Identified:**
- [List any problems]

**Prompt Improvements:**
- [Proposed changes to tool descriptions]
```

## Iterative Improvement Process

1. **Run all tests** in current mode
2. **Calculate average score** across all tests
3. **If < 99% on critical tests:**
   - Identify failure patterns
   - Revise tool descriptions
   - Re-test affected scenarios
4. **Repeat** until 99% threshold met
5. **Switch modes** and re-run tests
6. **Compare results** between modes

## Prompt Refinement Guidelines

If tests reveal comprehension issues:

### Tool Description Improvements:
- Make instructions more explicit
- Add examples inline
- Clarify namespace syntax rules
- Emphasize resource reading requirement

### Resource Description Improvements:
- Clarify when to read resource
- Explain resource format
- Show example usage

### Prompt Template Improvements:
- Add more detailed examples
- Include common error patterns
- Show best practices

## Automation Potential

Future: Create automated test harness that:
1. Starts MCP server
2. Runs prompt suite
3. Validates agent responses
4. Scores comprehension automatically
5. Generates improvement recommendations

## Next Steps

1. ✅ Complete initial test run in on-demand mode
2. ✅ Complete initial test run in auto-include mode
3. ✅ Compare results and identify optimal configuration
4. ✅ Refine tool descriptions based on findings
5. ✅ Achieve 99% comprehension threshold
6. ✅ Document final configuration recommendations