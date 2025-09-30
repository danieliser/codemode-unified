# Health Check & Environment Variable Security Fix

## Problem Statement

Two critical issues with the health check endpoint:

1. **Environment Variable Exposure**: The `/health` endpoint was exposing sensitive credentials (API keys, client secrets) in plaintext
2. **Field Name Inconsistency**: Circular remapping between `env` → `environment` → `env` causing confusion

## Root Cause Analysis

### Issue 1: Environment Variable Masking
The health check endpoint (`GET /health`) was returning full, unmasked environment variables from MCP server configurations:

```json
{
  "HELPSCOUT_CLIENT_ID": "IKA8CezyOi2TD5stGBJFrZ376tNBdksp",  // ❌ EXPOSED
  "AUTOMEM_API_KEY": "mem_7163ec31424b3e9d74b986811fd310aa"   // ❌ EXPOSED
}
```

### Issue 2: Field Name Confusion
The codebase had inconsistent field naming:

- `.mcp.json` files use `env` (MCP standard format)
- Internal `MCPServerConfig` type used `environment`
- SDK `StdioClientTransport` uses `env`
- Unnecessary remapping: `env` → `environment` → `env`

This created circular logic with no benefit.

## Solution

### 1. Standardized on `env` Field Name

**Changed Files:**
- `src/types/core.ts`: Updated `MCPServerConfig` interface to use `env` instead of `environment`
- `src/executor.ts`: Removed unnecessary `env` → `environment` remapping
- `src/mcp/aggregator.ts`: Updated all references to use `config.env`

**Rationale:**
- Matches `.mcp.json` format (.mcp.json 的格式)
- Matches SDK expectations (SDK 的期望)
- Eliminates circular remapping (消除循环映射)

### 2. Implemented Environment Variable Masking

**Added to `src/mcp/aggregator.ts`:**

```typescript
private maskEnvironmentVariables(env: Record<string, any>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const key of Object.keys(env)) {
    const value = String(env[key]);
    if (value.length <= 4) {
      masked[key] = '***';
    } else {
      // Show first 4 chars for debugging
      masked[key] = value.substring(0, 4) + '***';
    }
  }
  return masked;
}
```

**Integration in `updateRegistry()`:**

```typescript
private updateRegistry(connection: MCPConnection): void {
  const sanitizedConfig = {
    ...connection.config,
    env: this.maskEnvironmentVariables(connection.config.env || {})
  };

  const newServerInfo: ServerInfo = {
    name: connection.name,
    status: connection.status,
    config: sanitizedConfig,  // Masked config for health endpoint
    // ...
  };

  this.registry.servers.set(connection.name, newServerInfo);
}
```

## Verification

### Before Fix
```bash
$ curl -s http://localhost:3001/health | jq '.components.mcp.servers[0].config.env'
{
  "AUTOMEM_API_KEY": "mem_7163ec31424b3e9d74b986811fd310aa",  # ❌ EXPOSED
  "OPENAI_API_KEY": "sk-proj-ixuUd404wuQP..."                # ❌ EXPOSED
}
```

### After Fix
```bash
$ curl -s http://localhost:3001/health | jq '.components.mcp.servers[0].config.env'
{
  "AUTOMEM_ENDPOINT": "http***",         # ✅ MASKED
  "AUTOMEM_API_KEY": "mem_***",          # ✅ MASKED
  "OPENAI_API_KEY": "sk-p***"            # ✅ MASKED
}
```

## Files Modified

1. **src/types/core.ts** (line 117)
   - Changed `environment?: Record<string, string>` → `env?: Record<string, string>`

2. **src/executor.ts** (lines 70-87)
   - Removed `env` → `environment` remapping
   - Simplified config normalization to only handle `type` → `transport`

3. **src/mcp/aggregator.ts**
   - Lines 144, 149-154: Updated to use `config.env`
   - Lines 258-271: Added `maskEnvironmentVariables()` method
   - Lines 273-281: Integrated masking in `updateRegistry()`

## Benefits

1. **Security**: Credentials no longer exposed via health endpoint
2. **Consistency**: Single source of truth for field naming (`env`)
3. **Simplicity**: Removed unnecessary circular remapping
4. **Debuggability**: First 4 chars preserved for debugging while maintaining security

## Testing

All 5 MCP servers connect successfully and health check shows masked values:
- ✅ automem (7 tools)
- ✅ sequential-thinking (1 tool)
- ✅ context7 (2 tools)
- ✅ WordPressAPI (12 tools)
- ✅ helpscout (8 tools)

**Total**: 30 MCP tools available with secure health monitoring

## Lessons Learned

1. **Type System Alignment**: Internal types should match external formats to avoid confusion
2. **Registry Updates**: Registry must be updated immediately when connections change for accurate health reporting
3. **Hot Reload Caveat**: `tsx watch` can create stale executor instances - full restart required to verify changes
4. **Security by Default**: Sensitive data should be masked at the source, not at display time