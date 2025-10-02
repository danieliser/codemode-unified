#!/usr/bin/env node
/**
 * Quick test script for Deno runtime
 */

import { RuntimeFactory, RuntimeType } from './dist/runtime/base-runtime.js';

async function testDenoRuntime() {
  console.log('🧪 Testing Deno Runtime Implementation\n');

  try {
    // Create Deno runtime
    console.log('1️⃣ Creating Deno runtime...');
    const runtime = await RuntimeFactory.create({
      type: RuntimeType.DENO,
      maxWorkers: 1
    });
    console.log('✅ Deno runtime created\n');

    // Test 1: Simple expression
    console.log('2️⃣ Test 1: Simple expression');
    const test1 = await runtime.execute('1 + 1');
    console.log('Result:', JSON.stringify(test1.result));
    console.log('Success:', test1.success);
    console.log('Execution time:', test1.metrics.executionTime + 'ms\n');

    // Test 2: Console.log
    console.log('3️⃣ Test 2: Console.log');
    const test2 = await runtime.execute('console.log("Hello from Deno!"); "test"');
    console.log('Result:', JSON.stringify(test2.result));
    console.log('Logs:', test2.logs);
    console.log('Success:', test2.success + '\n');

    // Test 3: Async/await with fetch
    console.log('4️⃣ Test 3: Async fetch API');
    const test3 = await runtime.execute(`
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
      const data = await response.json();
      return { title: data.title, id: data.id };
    `);
    console.log('Result:', JSON.stringify(test3.result, null, 2));
    console.log('Success:', test3.success);
    console.log('Execution time:', test3.metrics.executionTime + 'ms\n');

    // Test 4: Return statement
    console.log('5️⃣ Test 4: Object return');
    const test4 = await runtime.execute(`
      const data = { name: "Deno", version: "2.0" };
      return data;
    `);
    console.log('Result:', JSON.stringify(test4.result));
    console.log('Success:', test4.success + '\n');

    // Test 5: Multi-line with Promise.all
    console.log('6️⃣ Test 5: Parallel async operations');
    const test5 = await runtime.execute(`
      const [post1, post2] = await Promise.all([
        fetch('https://jsonplaceholder.typicode.com/posts/1').then(r => r.json()),
        fetch('https://jsonplaceholder.typicode.com/posts/2').then(r => r.json())
      ]);

      return {
        post1: post1.title,
        post2: post2.title,
        count: 2
      };
    `);
    console.log('Result:', JSON.stringify(test5.result, null, 2));
    console.log('Success:', test5.success);
    console.log('Execution time:', test5.metrics.executionTime + 'ms\n');

    // Test 6: Error handling
    console.log('7️⃣ Test 6: Error handling');
    const test6 = await runtime.execute('throw new Error("Test error")');
    console.log('Success:', test6.success);
    console.log('Error:', test6.error?.message);
    console.log('Error type:', test6.error?.type + '\n');

    // Cleanup
    console.log('8️⃣ Shutting down runtime...');
    await runtime.shutdown();
    console.log('✅ Runtime shut down\n');

    // Summary
    console.log('📊 Test Summary:');
    const metrics = runtime.getMetrics();
    console.log('- Total executions:', metrics.totalExecutions);
    console.log('- Average execution time:', Math.round(metrics.averageExecutionTime) + 'ms');
    console.log('- Initialization time:', metrics.initializationTime + 'ms');

    console.log('\n✨ All Deno runtime tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testDenoRuntime();