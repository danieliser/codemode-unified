# Recursive MCP Spawning - Issue & Fix

## Problem Discovered

When Code Mode Unified was used as an MCP server by Claude Code, it created a **recursive process spawning loop**:

1. Claude Code spawned `codemode-unified` as MCP server
2. Codemode read `.mcp.json` and tried to connect to OTHER MCP servers (automem, serena, context7, etc.)
3. MCPAggregator spawned child processes for each server
4. Health checks (every 30s) triggered reconnects on failures
5. Reconnects spawned NEW processes without cleanup
6. **Result**: Dozens of orphaned processes, Serena opened multiple browser windows

### Symptoms
- Multiple `automem` processes running (from different sessions)
- Serena spawned numerous web GUIs
- System slowdown
- Process explosion on every reconnect attempt

## Root Causes (Multiple Issues)

### Issue 1: Circular Config Detection
**Problem**: `loadMCPConfig()` checked `process.cwd()/.mcp.json` first
**Impact**: Loaded the SAME config that spawned the server, including codemode itself
**Location**: `src/mcp-server.ts` line 51

### Issue 2: No Process Cleanup on Reconnect
**Problem**: `MCPAggregator.connectServer()` created new connections without cleaning up old ones
**Impact**: Every reconnect attempt spawned a NEW subprocess, orphaning the old one
**Location**: `src/mcp/aggregator.ts` line 56-96

### Issue 3: Aggressive Auto-Reconnect
**Problem**: Health checks every 30s + exponential backoff reconnects
**Impact**: Failed connections kept spawning processes repeatedly
**Location**: `src/mcp/aggregator.ts` line 326-342, 345-365

### Issue 4: Always-On MCP Integration
**Problem**: MCPAggregator initialized unconditionally
**Impact**: Codemode always acted as MCP client, even when just providing services
**Location**: `src/mcp-server.ts` line 632

## Solutions Applied

### Fix 1: Removed Circular Config Path ✅
**Change**: Removed `process.cwd()` from config search paths
**Code**:
```typescript
// OLD: const defaultPaths = [join(process.cwd(), '.mcp.json'), ...]
// NEW: const defaultPaths = [join(homedir(), '.mcp.json'), ...]
```
**Result**: Server won't load the config that spawned it

### Fix 2: Added Process Cleanup on Reconnect ✅
**Change**: Clean up existing client/process before creating new connection
**Code**:
```typescript
const existingConnection = this.connections.get(name);
if (existingConnection?.client) {
  await existingConnection.client.close();
  existingConnection.client.process.kill('SIGTERM');
}
```
**Result**: No orphaned processes on reconnect

### Fix 3: Made MCP Integration Opt-In ✅
**Change**: Require explicit environment variable to enable MCP aggregation
**Code**:

```typescript
const enableMCPIntegration = process.env.CODEMODE_ENABLE_MCP_INTEGRATION === 'true';

if (enableMCPIntegration) {
  await initializeMCPManager(); // Connect to other MCP servers
} else {
  // Standalone mode - code execution only
}
```

### Default Behavior (Safe)

**WITHOUT** the env var (default):
```bash
# .mcp.json
{
  "codemode-unified": {
    "command": "npx",
    "args": ["-y", "tsx", "/path/to/mcp-server.ts"],
    "env": {}
  }
}
```

✅ Runs in **standalone mode**
✅ Provides code execution tools ONLY
✅ Does NOT spawn child MCP servers
✅ No recursion risk

### Advanced Mode (Opt-In)

**WITH** the env var (for nested MCP access):
```bash
# .mcp.json
{
  "codemode-unified": {
    "command": "npx",
    "args": ["-y", "tsx", "/path/to/mcp-server.ts"],
    "env": {
      "CODEMODE_ENABLE_MCP_INTEGRATION": "true",
      "MCP_CONFIG_PATH": "/path/to/.mcp.json"
    }
  }
}
```

✅ Enables full MCP integration
✅ Code can call `mcp.automem.store_memory()`
✅ Spawns child MCP servers properly
⚠️ Use only when you need MCP-within-MCP

## Usage Recommendations

### Use Case 1: Claude Code Integration (Default)
**Purpose**: Execute code snippets from Claude Code
**Config**: No env vars needed
**Result**: Safe, simple code execution

### Use Case 2: Standalone Tool with MCP Access
**Purpose**: Run code that needs to call other MCP tools
**Config**: Set `CODEMODE_ENABLE_MCP_INTEGRATION=true`
**Result**: Full MCP ecosystem access

### Use Case 3: Testing/Development
**Purpose**: Test MCP integration locally
**Config**: Use local `.mcp.json` with env var
**Result**: Isolated testing environment

## Cleanup

If you experienced the recursion bug, clean up orphaned processes:

```bash
# Find orphaned MCP processes
ps aux | grep -E "(automem|serena|context7)" | grep -v grep

# Kill them (use process IDs from above)
kill <PID1> <PID2> <PID3>...

# Or kill all at once (CAREFUL!)
pkill -f "mcp-automem"
pkill -f "serena"
```

## Prevention

The environment variable guard prevents:
1. ✅ Recursive process spawning
2. ✅ Unnecessary subprocess overhead
3. ✅ Resource exhaustion
4. ✅ Browser window explosions (Serena)
5. ✅ Session conflicts

## Testing

**Test standalone mode** (should work now):
```
Execute with Bun:
const result = [1,2,3,4,5].reduce((a,b) => a+b, 0);
result;
```

**Test with MCP integration** (future):
```bash
# Set env var in .mcp.json first
Execute with Bun:
const memory = await mcp.automem.store_memory({
  content: "Test",
  tags: ["test"]
});
memory;
```

## Status

- ✅ Fixed recursive spawning
- ✅ Made MCP integration opt-in
- ✅ Default mode is safe
- ⏳ Advanced mode ready for future use
- 📝 Documented thoroughly