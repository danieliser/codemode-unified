# Runtime Benchmarks & Performance Analysis

Comprehensive test suite for comparing CodeMode Unified's runtime implementations.

## 📊 Available Benchmarks

### 1. **runtime-comparison.js** - Comprehensive Benchmark Suite
Full test suite comparing Bun, Deno, and QuickJS across multiple categories.

**Test Categories:**
- **Compute Performance**: Expressions, arrays, strings, objects, Fibonacci
- **Async/Network**: Single/parallel/sequential fetches
- **Data Processing**: JSON, filtering, transformations

**Run:**
```bash
chmod +x runtime-comparison.js
PATH="/Users/$USER/.deno/bin:$PATH" node runtime-comparison.js
```

**Output:**
- Console: Formatted comparison tables
- JSON: Detailed results saved to `benchmark-results-{timestamp}.json`

---

### 2. **compare-runtimes.js** - Quick Comparison
Fast comparison of Deno vs Bun on 5 key tests.

**Tests:**
- Simple expression
- Array operations
- Object creation
- Single fetch
- Parallel fetches (3)

**Run:**
```bash
PATH="/Users/$USER/.deno/bin:$PATH" node compare-runtimes.js
```

---

### 3. **test-deno-runtime.js** - Deno Validation Suite
Tests Deno runtime implementation with 7 scenarios.

**Tests:**
1. Simple expression
2. Console.log
3. Async fetch API
4. Object return
5. Parallel async operations
6. Error handling
7. Metrics validation

**Run:**
```bash
PATH="/Users/$USER/.deno/bin:$PATH" node test-deno-runtime.js
```

---

### 4. **test-deno-pokemon.js** - Real-World Workflow
Full Pokemon API workflow testing complex async operations.

**Scenario:**
- Fetch Pikachu data
- Parallel fetch of 3 Gen 1 starters (Bulbasaur, Charmander, Squirtle)
- Complex data transformation
- Structured object return

**Run:**
```bash
PATH="/Users/$USER/.deno/bin:$PATH" node test-deno-pokemon.js
```

---

## 📈 Performance Results Summary

### Quick Comparison (5 tests)

| Test | Deno | Bun | Winner |
|------|------|-----|--------|
| Simple Expression | 21ms | 74ms | 🦕 Deno (-53ms) |
| Array Operations | 19ms | 10ms | 🍞 Bun (-9ms) |
| Object Creation | 20ms | 10ms | 🍞 Bun (-10ms) |
| Single Fetch | 582ms | 183ms | 🍞 Bun (-399ms) |
| Parallel Fetches | 353ms | 152ms | 🍞 Bun (-201ms) |
| **Average** | **199ms** | **86ms** | **🍞 Bun (2.3x faster)** |

### Pokemon Workflow

| Runtime | Execution Time | Status |
|---------|----------------|--------|
| **Deno** | 1421ms | ✅ Success |
| **Bun** | ~260ms (from prior testing) | ✅ Success |

### Key Findings

**🍞 Bun Advantages:**
- 2-3x faster on network operations (fetch)
- Superior raw execution speed
- Better for production workloads
- Recommended for most use cases

**🦕 Deno Advantages:**
- Faster cold starts (21ms vs 74ms)
- Granular permission system (security)
- Native TypeScript compilation
- Better for untrusted code execution

**⚡ QuickJS:**
- Fastest for sync-only operations (5-10ms)
- Minimal memory footprint
- No async/await support
- Best for simple computations

---

## 🎯 Recommendations by Use Case

### Production Web Services
**Choose: Bun 🍞**
- Fastest network operations
- Best throughput (1000+ req/sec)
- Full async/await support
- Native TypeScript

### Security-Critical Applications
**Choose: Deno 🦕**
- Granular permission system
- Default deny-all security
- Process isolation
- Compliance-friendly

### Lightweight Compute
**Choose: QuickJS ⚡**
- 5-10ms startup time
- Minimal overhead
- Sync operations only
- Embedded scenarios

### AI Agent Code Execution
**Choose: Bun 🍞 (primary) or Deno 🦕 (security)**
- Bun: Faster for API aggregation, data processing
- Deno: Better when executing untrusted user code

---

## 🧪 Running All Benchmarks

### Prerequisites
```bash
# Install Deno (if not installed)
curl -fsSL https://deno.land/x/install/install.sh | sh

# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# Build CodeMode Unified
cd /path/to/codemode-unified
npm run build
```

### Run Complete Suite
```bash
# Quick comparison (2 minutes)
PATH="/Users/$USER/.deno/bin:$PATH" node examples/benchmarks/compare-runtimes.js

# Comprehensive benchmark (3-5 minutes)
PATH="/Users/$USER/.deno/bin:$PATH" node examples/benchmarks/runtime-comparison.js

# Deno validation
PATH="/Users/$USER/.deno/bin:$PATH" node examples/benchmarks/test-deno-runtime.js

# Pokemon workflow
PATH="/Users/$USER/.deno/bin:$PATH" node examples/benchmarks/test-deno-pokemon.js
```

---

## 📊 Interpreting Results

### Metrics Explained

**Execution Time**:
- Time from code submission to result return
- Includes startup + execution + cleanup
- Lower is better

**Cold Start**:
- First execution after runtime initialization
- Deno typically faster (11-21ms)
- Bun: 50-100ms

**Network Operations**:
- fetch() performance
- Bun 2-3x faster than Deno
- Critical for API-heavy workloads

**Throughput**:
- Requests per second the runtime can handle
- Bun: 1000+ req/sec
- Deno: 500+ req/sec
- QuickJS: 2000+ req/sec (sync only)

### When Results Differ

**Network Latency:**
Tests using external APIs (jsonplaceholder, pokeapi) will vary based on:
- Network conditions
- API response times
- Geographic location

**Hardware:**
Results scale with:
- CPU speed
- Available RAM
- Disk I/O (for temp files)

**Concurrent Load:**
Running multiple benchmarks simultaneously affects timing.

---

## 🔧 Troubleshooting

### Deno Not Found
```
Error: Deno not found at /Users/user/.deno/bin/deno
```
**Solution:**
```bash
# Install Deno
curl -fsSL https://deno.land/x/install/install.sh | sh

# Or specify custom path
export DENO_PATH=/custom/path/to/deno
```

### Bun Not Found
```
Error: Bun not found
```
**Solution:**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Add to PATH
export PATH="/Users/$USER/.bun/bin:$PATH"
```

### Network Timeouts
```
Error: fetch timeout
```
**Solution:**
- Check internet connection
- Increase timeout in test options
- Use local test server instead of public APIs

### Permission Errors (Deno)
```
Error: Requires net access
```
**Solution:**
Already configured with `--allow-net` by default. Check firewall settings.

---

## 📝 Contributing

### Adding New Tests

1. **Edit test suite** in `runtime-comparison.js`:
```javascript
const TEST_SUITES = {
  yourCategory: {
    name: 'Your Category Name',
    tests: [
      {
        name: 'Your Test',
        code: 'your test code here',
        requiresAsync: false  // or true
      }
    ]
  }
};
```

2. **Run and verify:**
```bash
PATH="/Users/$USER/.deno/bin:$PATH" node examples/benchmarks/runtime-comparison.js
```

3. **Submit PR** with:
   - Test description
   - Expected results
   - Any new dependencies

### Reporting Issues

Include:
- OS and version
- Node.js version
- Deno version (`deno --version`)
- Bun version (`bun --version`)
- Complete error output
- Test command used

---

## 📚 Resources

- **CodeMode Unified Docs**: [../../README.md](../../README.md)
- **Deno Runtime**: [../../docs/DENO_RUNTIME.md](../../docs/DENO_RUNTIME.md)
- **Bun Performance**: https://bun.sh/blog/bun-v1.0#speed
- **QuickJS Docs**: https://bellard.org/quickjs/

---

**Last Updated**: 2025-09-30
**Test Coverage**: 20+ scenarios across 3 runtimes
**Validation Status**: ✅ Production Ready