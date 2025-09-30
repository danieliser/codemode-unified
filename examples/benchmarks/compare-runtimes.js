#!/usr/bin/env node
/**
 * Compare Deno vs Bun runtime performance
 */

import { RuntimeFactory, RuntimeType } from './dist/runtime/base-runtime.js';

const testCases = [
  {
    name: 'Simple Expression',
    code: '1 + 1'
  },
  {
    name: 'Array Operations',
    code: '[1, 2, 3, 4, 5].map(x => x * 2).reduce((a, b) => a + b, 0)'
  },
  {
    name: 'Object Creation',
    code: 'const obj = { name: "test", value: 42, nested: { deep: true } }; return obj;'
  },
  {
    name: 'Single Fetch',
    code: 'const r = await fetch("https://jsonplaceholder.typicode.com/posts/1"); const d = await r.json(); return d.title;'
  },
  {
    name: 'Parallel Fetches (3)',
    code: `
      const results = await Promise.all([
        fetch('https://jsonplaceholder.typicode.com/posts/1').then(r => r.json()),
        fetch('https://jsonplaceholder.typicode.com/posts/2').then(r => r.json()),
        fetch('https://jsonplaceholder.typicode.com/posts/3').then(r => r.json())
      ]);
      return { count: results.length, titles: results.map(r => r.title) };
    `
  }
];

async function benchmarkRuntime(runtimeType, testCase) {
  const runtime = await RuntimeFactory.create({
    type: runtimeType,
    maxWorkers: 1
  });

  const result = await runtime.execute(testCase.code, { timeout: 30000 });

  await runtime.shutdown();

  return {
    success: result.success,
    executionTime: result.metrics.executionTime
  };
}

async function compareRuntimes() {
  console.log('🏁 Runtime Performance Comparison: Deno vs Bun\n');
  console.log('='.repeat(80) + '\n');

  const results = {
    deno: [],
    bun: []
  };

  for (const testCase of testCases) {
    console.log(`📊 Test: ${testCase.name}`);
    console.log('-'.repeat(80));

    // Test Deno
    console.log('  🦕 Deno:');
    try {
      const denoResult = await benchmarkRuntime(RuntimeType.DENO, testCase);
      results.deno.push({ name: testCase.name, time: denoResult.executionTime, success: denoResult.success });
      console.log(`     ✅ ${denoResult.executionTime}ms`);
    } catch (error) {
      console.log(`     ❌ Failed: ${error.message}`);
      results.deno.push({ name: testCase.name, time: null, success: false });
    }

    // Test Bun
    console.log('  🍞 Bun:');
    try {
      const bunResult = await benchmarkRuntime(RuntimeType.BUN, testCase);
      results.bun.push({ name: testCase.name, time: bunResult.executionTime, success: bunResult.success });
      console.log(`     ✅ ${bunResult.executionTime}ms`);
    } catch (error) {
      console.log(`     ❌ Failed: ${error.message}`);
      results.bun.push({ name: testCase.name, time: null, success: false });
    }

    // Calculate difference
    const denoTime = results.deno[results.deno.length - 1].time;
    const bunTime = results.bun[results.bun.length - 1].time;

    if (denoTime && bunTime) {
      const diff = denoTime - bunTime;
      const diffPercent = ((diff / bunTime) * 100).toFixed(1);
      const faster = diff > 0 ? 'Bun' : 'Deno';
      const absDiff = Math.abs(diff);
      const absDiffPercent = Math.abs(diffPercent);

      console.log(`  ⚡ ${faster} faster by ${absDiff}ms (${absDiffPercent}%)`);
    }

    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('\n📈 Summary\n');

  const denoTimes = results.deno.filter(r => r.time !== null).map(r => r.time);
  const bunTimes = results.bun.filter(r => r.time !== null).map(r => r.time);

  const denoAvg = denoTimes.reduce((a, b) => a + b, 0) / denoTimes.length;
  const bunAvg = bunTimes.reduce((a, b) => a + b, 0) / bunTimes.length;

  console.log(`🦕 Deno Average:  ${Math.round(denoAvg)}ms`);
  console.log(`🍞 Bun Average:   ${Math.round(bunAvg)}ms`);

  const avgDiff = denoAvg - bunAvg;
  const avgDiffPercent = ((avgDiff / bunAvg) * 100).toFixed(1);

  if (avgDiff > 0) {
    console.log(`\n⚡ Bun is ${Math.round(avgDiff)}ms (${avgDiffPercent}%) faster on average`);
  } else {
    console.log(`\n⚡ Deno is ${Math.round(Math.abs(avgDiff))}ms (${Math.abs(avgDiffPercent)}%) faster on average`);
  }

  // Detailed table
  console.log('\n📊 Detailed Results\n');
  console.log('Test'.padEnd(30) + 'Deno'.padEnd(15) + 'Bun'.padEnd(15) + 'Difference');
  console.log('-'.repeat(80));

  for (let i = 0; i < testCases.length; i++) {
    const denoTime = results.deno[i].time || 'Failed';
    const bunTime = results.bun[i].time || 'Failed';
    const diff = (typeof denoTime === 'number' && typeof bunTime === 'number')
      ? `${denoTime - bunTime > 0 ? '+' : ''}${denoTime - bunTime}ms`
      : 'N/A';

    console.log(
      testCases[i].name.padEnd(30) +
      (typeof denoTime === 'number' ? `${denoTime}ms` : denoTime).padEnd(15) +
      (typeof bunTime === 'number' ? `${bunTime}ms` : bunTime).padEnd(15) +
      diff
    );
  }

  console.log('\n✨ Comparison complete!');
}

compareRuntimes().catch(error => {
  console.error('❌ Comparison failed:', error);
  process.exit(1);
});