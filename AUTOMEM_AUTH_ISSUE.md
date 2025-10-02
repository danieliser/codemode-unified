# AutoMem Authorization Issue

## Problem
AutoMem returns "Unauthorized" when called through CodeMode's MCP proxy, but works perfectly when called directly via Claude Code's MCP or curl.

## Verified Working
```bash
# Direct curl to backend - WORKS
curl -X POST http://127.0.0.1:8001/memory \
  -H "Authorization: Bearer mem_7163ec31424b3e9d74b986811fd310aa" \
  -d '{"content":"test","tags":["test"]}'
# ✅ Returns: {"memory_id":"...","status":"success"}

# Direct MCP call from Claude Code - WORKS
mcp__automem__store_memory({content:"test",tags:["test"]})
# ✅ Success
```

## Not Working
```javascript
// Through CodeMode MCP proxy - FAILS
mcp.automem.store_memory({content:"test",tags:["test"]})
// ❌ Error: Unauthorized
```

## Architecture Flow
1. **User code execution** → CodeMode MCP server (`execute_code` tool)
2. **CodeMode runtime** → Queues MCP call with `__mcpCallTool()`
3. **Executor** → Processes queue via `mcpManager.callTool()`
4. **MCPAggregator** → Routes to AutoMem connection
5. **StdioClientTransport** → Spawns AutoMem MCP client process
6. **AutoMem MCP client** → Reads `AUTOMEM_API_KEY` from env
7. **AutoMem MCP client** → Sends `Authorization: Bearer ${AUTOMEM_API_KEY}`
8. **AutoMem backend** → Validates against `AUTOMEM_API_TOKEN`

## Configuration Status

### Backend (.env)
```bash
AUTOMEM_API_TOKEN=mem_7163ec31424b3e9d74b986811fd310aa  # ✅ Correct
```

### CodeMode Service (.mcp.json)
```json
{
  "automem": {
    "env": {
      "AUTOMEM_ENDPOINT": "http://127.0.0.1:8001",
      "AUTOMEM_API_KEY": "mem_7163ec31424b3e9d74b986811fd310aa"  # ✅ Correct
    }
  }
}
```

### MCP Aggregator (aggregator.ts:144)
```typescript
const mergedEnv = { ...process.env, ...(config.env || {}) };  // ✅ Merges env vars
```

## Debugging Added
- Added debug logging in `aggregator.ts:147-151` to log AutoMem env vars
- Logs go to stderr, not visible in tool results

## Running Processes
```bash
$ ps aux | grep automem
# 8 AutoMem MCP processes running! ⚠️
# PIDs: 63004, 45647, 23631, 45627, 45329, 41839, 32257, 32154
```

## Hypothesis
Multiple AutoMem instances may be interfering with each other, or one of them is using incorrect/missing env vars.

## Next Steps
1. Kill all AutoMem processes and restart clean
2. Verify debug logs show correct env vars being passed
3. Check if MCP client is actually receiving the env vars
4. Add logging to AutoMem MCP client to see what token it's sending
5. Verify StdioClientTransport is passing env correctly to child process

## Related Files
- [services/codemode-unified/src/mcp/aggregator.ts](src/mcp/aggregator.ts:130-158)
- [services/codemode-unified/src/executor.ts](src/executor.ts:600-680)
- [services/codemode-unified/.mcp.json](.mcp.json:3-12)
- [services/automem/app.py](../automem/app.py:171,993-1003)
- [/Users/danieliser/Projects/mcp-automem/dist/index.js](https://github.com/verygoodplugins/mcp-automem)

## Status
🔴 **BLOCKED** - Cannot use AutoMem through CodeMode until auth issue resolved
