# HelpScout MCP Connection - Fix Documentation

## Issue
HelpScout (and WordPressAPI) MCP servers were failing to connect with authentication errors despite credentials being present in `.mcp.json`.

## Root Cause
The `executor.ts` config loader was not properly mapping the `.mcp.json` format to the internal config format expected by the MCP aggregator:

- `.mcp.json` uses: `env` field for environment variables
- MCP aggregator expects: `environment` field

The normalizer in `executor.ts` was spreading the config but not mapping `env` → `environment`.

## The Fix

**File**: `src/executor.ts` (lines 73-85)

**Before**:
```typescript
const normalizedServers: Record<string, any> = {};
for (const [name, config] of Object.entries(servers)) {
  normalizedServers[name] = {
    ...(config as any),
    transport: (config as any).type || (config as any).transport
  };
}
```

**After**:
```typescript
const normalizedServers: Record<string, any> = {};
for (const [name, config] of Object.entries(servers)) {
  const cfg = config as any;
  normalizedServers[name] = {
    ...cfg,
    transport: cfg.type || cfg.transport || 'stdio',
    environment: cfg.environment || cfg.env || {}  // KEY FIX
  };
  // Remove the old fields to avoid confusion
  delete normalizedServers[name].env;
  delete normalizedServers[name].type;
}
```

## Result

### Before Fix
- ✅ **automem**: 7 tools
- ✅ **sequential-thinking**: 1 tool
- ✅ **context7**: 2 tools
- ❌ **WordPressAPI**: Connection failed (no environment vars)
- ❌ **helpscout**: Authentication failed (no environment vars)

**Total**: 10 tools from 3 servers

### After Fix
- ✅ **automem**: 7 tools
- ✅ **sequential-thinking**: 1 tool
- ✅ **context7**: 2 tools
- ✅ **WordPressAPI**: 12 tools (**FIXED!**)
- ✅ **helpscout**: 8 tools (**FIXED!**)

**Total**: 30 tools from 5 servers! 🎉

## Verification

Test standalone HelpScout MCP with credentials:
```bash
export HELPSCOUT_CLIENT_ID="IKA8CezyOi2TD5stGBJFrZ376tNBdksp"
export HELPSCOUT_CLIENT_SECRET="NoaApCokwUonLJHVtvMRPRWHBGfDz2gf"
npx help-scout-mcp-server
```

Expected output:
```
{"level":"info","message":"Authenticated with Help Scout API using OAuth2"}
{"level":"info","message":"Help Scout MCP Server started successfully"}
```

## Debug Logs Added

Added comprehensive debug logging to trace environment variable flow:

**In `mcp/aggregator.ts`** (lines 146-158):
```typescript
console.log(`🔍 [DEBUG] Creating stdio client for command: ${resolvedCommand}`);
console.log(`🔍 [DEBUG] Config environment keys:`, Object.keys(config.environment || {}));
console.log(`🔍 [DEBUG] Merged environment HELPSCOUT keys:`,
  Object.keys(mergedEnv).filter(k => k.includes('HELP'))
);
```

**In `mcp-server.ts`** (lines 122-147):
```typescript
console.log(`🔍 [CONVERTER] Processing server: ${name}`);
console.log(`🔍 [CONVERTER] Raw config.env keys:`, Object.keys(config.env || {}));
console.log(`🔍 [CONVERTER] Converted environment keys:`, Object.keys(servers[name].environment));
```

## Lessons Learned

1. **Field Name Consistency**: `.mcp.json` format uses different field names (`env`, `type`) than internal types (`environment`, `transport`)
2. **Multiple Config Loaders**: There are at least 3 places where `.mcp.json` is loaded:
   - `mcp-server.ts`: `convertMCPJsonToConfig()`
   - `executor.ts`: Direct JSON parsing with normalization
   - Each needs to handle the field mapping consistently
3. **Debug Logging is Critical**: Without the debug logs, it was impossible to see that environment vars were empty
4. **Test Standalone First**: Testing the MCP server standalone with env vars confirmed the credentials were valid

## Related Files

- `src/executor.ts`: Main fix location
- `src/mcp/aggregator.ts`: Debug logging added
- `src/mcp-server.ts`: Converter debug logging added (not used by executor path)
- `.mcp.json`: Config file with `env` field

## Future Improvements

1. **Unify Config Loading**: Create a single `loadMCPConfig()` function used by both executor and mcp-server
2. **Type Safety**: Add TypeScript types to catch field name mismatches at compile time
3. **Remove Debug Logs**: Clean up debug logging once confident the fix is stable
4. **Add Tests**: Unit tests for config normalization to prevent regression

---

**Fixed**: 2025-09-30
**By**: Claude Code
**Status**: ✅ All 5 MCP servers connected successfully