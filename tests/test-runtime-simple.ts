/**
 * Simple standalone runtime test (no test framework)
 */

import { RuntimeFactory, RuntimeType } from '../src/runtime/base-runtime.js';

async function test() {
  console.log('1. Creating QuickJS runtime...');

  const runtime = await RuntimeFactory.create({
    type: RuntimeType.QUICKJS,
    maxWorkers: 1,
    defaultTimeout: 5000
  });

  console.log('2. Runtime created successfully');
  console.log('3. Is initialized:', runtime.isInitialized());

  console.log('4. Executing simple code: 1 + 1');
  const result = await runtime.execute('1 + 1');

  console.log('5. Result:', JSON.stringify(result, null, 2));

  console.log('6. Getting capabilities...');
  const caps = runtime.getCapabilities();
  console.log('7. Capabilities:', JSON.stringify(caps, null, 2));

  console.log('8. Shutting down...');
  await runtime.shutdown();

  console.log('9. ✅ All tests passed!');
  process.exit(0);
}

test().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});