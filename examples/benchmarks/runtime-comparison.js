#!/usr/bin/env node
/**
 * Comprehensive Runtime Performance Comparison
 *
 * Compares Bun, Deno, and QuickJS runtimes across multiple test scenarios
 * to help users choose the right runtime for their use case.
 */

import { RuntimeFactory, RuntimeType } from '../../dist/runtime/base-runtime.js';

const TEST_SUITES = {
  compute: {
    name: 'Compute Performance',
    tests: [
      {
        name: 'Simple Expression',
        code: '1 + 1'
      },
      {
        name: 'Array Operations',
        code: '[1, 2, 3, 4, 5].map(x => x * 2).reduce((a, b) => a + b, 0)'
      },
      {
        name: 'String Manipulation',
        code: '"hello world".split(" ").map(w => w.toUpperCase()).join("-")'
      },
      {
        name: 'Object Operations',
        code: 'const obj = { a: 1, b: 2, c: 3 }; Object.entries(obj).map(([k, v]) => ({ key: k, value: v * 2 }));'
      },
      {
        name: 'Fibonacci (n=20)',
        code: `
          function fib(n) {
            if (n <= 1) return n;
            return fib(n - 1) + fib(n - 2);
          }
          return fib(20);
        `
      }
    ]
  },
  async: {
    name: 'Async/Network Performance',
    tests: [
      {
        name: 'Single Fetch',
        code: 'const r = await fetch("https://jsonplaceholder.typicode.com/posts/1"); const d = await r.json(); return d.title;',
        requiresAsync: true
      },
      {
        name: 'Parallel Fetches (2)',
        code: `
          const [r1, r2] = await Promise.all([
            fetch('https://jsonplaceholder.typicode.com/posts/1').then(r => r.json()),
            fetch('https://jsonplaceholder.typicode.com/posts/2').then(r => r.json())
          ]);
          return { post1: r1.title, post2: r2.title };
        `,
        requiresAsync: true
      },
      {
        name: 'Parallel Fetches (4)',
        code: `
          const results = await Promise.all([
            fetch('https://jsonplaceholder.typicode.com/posts/1').then(r => r.json()),
            fetch('https://jsonplaceholder.typicode.com/posts/2').then(r => r.json()),
            fetch('https://jsonplaceholder.typicode.com/posts/3').then(r => r.json()),
            fetch('https://jsonplaceholder.typicode.com/posts/4').then(r => r.json())
          ]);
          return { count: results.length };
        `,
        requiresAsync: true
      },
      {
        name: 'Sequential Fetches (3)',
        code: `
          const r1 = await fetch('https://jsonplaceholder.typicode.com/posts/1').then(r => r.json());
          const r2 = await fetch('https://jsonplaceholder.typicode.com/posts/2').then(r => r.json());
          const r3 = await fetch('https://jsonplaceholder.typicode.com/posts/3').then(r => r.json());
          return { count: 3 };
        `,
        requiresAsync: true
      }
    ]
  },
  dataProcessing: {
    name: 'Data Processing',
    tests: [
      {
        name: 'JSON Parse/Stringify',
        code: `
          const data = { users: [{name: "Alice", age: 30}, {name: "Bob", age: 25}] };
          const json = JSON.stringify(data);
          const parsed = JSON.parse(json);
          return parsed.users.length;
        `
      },
      {
        name: 'Array Filtering',
        code: `
          const data = Array.from({length: 1000}, (_, i) => i);
          const filtered = data.filter(x => x % 2 === 0);
          return filtered.length;
        `
      },
      {
        name: 'Object Transformation',
        code: `
          const users = Array.from({length: 100}, (_, i) => ({
            id: i,
            name: 'User' + i,
            active: i % 2 === 0
          }));
          const active = users.filter(u => u.active).map(u => u.name);
          return active.length;
        `
      }
    ]
  }
};

const RUNTIMES = [
  { type: RuntimeType.BUN, name: 'Bun', emoji: '🍞' },
  { type: RuntimeType.DENO, name: 'Deno', emoji: '🦕' },
  { type: RuntimeType.QUICKJS, name: 'QuickJS', emoji: '⚡' }
];

async function runTest(runtime, test, timeout = 30000) {
  try {
    const result = await runtime.execute(test.code, { timeout });
    return {
      success: result.success,
      time: result.metrics.executionTime,
      error: result.error?.message
    };
  } catch (error) {
    return {
      success: false,
      time: null,
      error: error.message
    };
  }
}

async function benchmarkRuntime(runtimeConfig, testSuite) {
  const runtime = await RuntimeFactory.create(runtimeConfig);
  const results = [];

  for (const test of testSuite.tests) {
    // Skip async tests for QuickJS
    if (test.requiresAsync && runtimeConfig.type === RuntimeType.QUICKJS) {
      results.push({
        name: test.name,
        skipped: true,
        reason: 'QuickJS does not support native async'
      });
      continue;
    }

    const result = await runTest(runtime, test);
    results.push({
      name: test.name,
      ...result
    });

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  await runtime.shutdown();
  return results;
}

function printResults(results) {
  console.log('\n' + '='.repeat(100) + '\n');
  console.log('📊 COMPREHENSIVE RUNTIME PERFORMANCE COMPARISON\n');
  console.log('='.repeat(100) + '\n');

  for (const [suiteName, suite] of Object.entries(TEST_SUITES)) {
    console.log(`\n${'▓'.repeat(50)}`);
    console.log(`📁 ${suite.name}`);
    console.log('▓'.repeat(50) + '\n');

    for (let i = 0; i < suite.tests.length; i++) {
      const test = suite.tests[i];
      console.log(`\n${'─'.repeat(100)}`);
      console.log(`📊 Test: ${test.name}`);
      console.log('─'.repeat(100));

      const runtimeResults = {};
      RUNTIMES.forEach(rt => {
        const result = results[rt.type][suiteName][i];
        runtimeResults[rt.type] = result;

        if (result.skipped) {
          console.log(`  ${rt.emoji} ${rt.name.padEnd(12)} ⏭️  SKIPPED - ${result.reason}`);
        } else if (result.success) {
          console.log(`  ${rt.emoji} ${rt.name.padEnd(12)} ✅ ${result.time}ms`);
        } else {
          console.log(`  ${rt.emoji} ${rt.name.padEnd(12)} ❌ FAILED - ${result.error}`);
        }
      });

      // Calculate winner (excluding skipped)
      const validResults = Object.entries(runtimeResults)
        .filter(([_, r]) => r.success && !r.skipped)
        .sort((a, b) => a[1].time - b[1].time);

      if (validResults.length > 1) {
        const [winnerId, winnerResult] = validResults[0];
        const winner = RUNTIMES.find(r => r.type === winnerId);
        const [secondId, secondResult] = validResults[1];
        const diff = secondResult.time - winnerResult.time;
        const diffPercent = ((diff / winnerResult.time) * 100).toFixed(1);

        console.log(`\n  ⚡ ${winner.emoji} ${winner.name} FASTEST by ${diff}ms (${diffPercent}% faster)`);
      }
    }
  }

  // Overall Summary
  console.log('\n' + '='.repeat(100));
  console.log('\n📈 OVERALL SUMMARY\n');
  console.log('='.repeat(100) + '\n');

  RUNTIMES.forEach(rt => {
    const allResults = Object.values(results[rt.type])
      .flatMap(suite => Object.values(suite))
      .filter(r => r.success && !r.skipped);

    if (allResults.length === 0) {
      console.log(`${rt.emoji} ${rt.name}:`);
      console.log(`  No successful tests completed\n`);
      return;
    }

    const times = allResults.map(r => r.time);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const total = allResults.length;

    console.log(`${rt.emoji} ${rt.name}:`);
    console.log(`  Tests Completed: ${total}`);
    console.log(`  Average Time:    ${Math.round(avg)}ms`);
    console.log(`  Fastest Test:    ${min}ms`);
    console.log(`  Slowest Test:    ${max}ms\n`);
  });

  // Recommendations
  console.log('='.repeat(100));
  console.log('\n💡 RECOMMENDATIONS\n');
  console.log('─'.repeat(100) + '\n');
  console.log('🍞 Bun:      Best for production workloads, fastest async/network operations');
  console.log('🦕 Deno:     Best for security-critical code, granular permissions');
  console.log('⚡ QuickJS:  Best for sync-only lightweight operations, minimal overhead\n');
  console.log('='.repeat(100) + '\n');
}

async function main() {
  console.log('🚀 Starting comprehensive runtime benchmarks...\n');
  console.log('This may take 2-3 minutes to complete all tests.\n');

  const results = {};

  for (const runtime of RUNTIMES) {
    console.log(`\n▶️  Benchmarking ${runtime.emoji} ${runtime.name}...`);
    results[runtime.type] = {};

    for (const [suiteName, suite] of Object.entries(TEST_SUITES)) {
      console.log(`   Testing: ${suite.name}...`);
      const config = { type: runtime.type, maxWorkers: 1 };
      results[runtime.type][suiteName] = await benchmarkRuntime(config, suite);
    }

    console.log(`   ✅ ${runtime.name} complete`);
  }

  printResults(results);

  // Save results to JSON
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `benchmark-results-${timestamp}.json`;

  console.log(`💾 Saving detailed results to: examples/benchmarks/${filename}\n`);

  // Pretty print results for JSON
  const jsonResults = {
    timestamp: new Date().toISOString(),
    runtimes: RUNTIMES.map(r => ({ type: r.type, name: r.name })),
    testSuites: Object.keys(TEST_SUITES),
    results
  };

  const fs = await import('fs/promises');
  await fs.writeFile(
    `examples/benchmarks/${filename}`,
    JSON.stringify(jsonResults, null, 2)
  );

  console.log('✨ Benchmark complete!\n');
}

main().catch(error => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});