/**
 * MCP Integration Test
 *
 * Tests code execution with MCP tool access
 */

import { RuntimeFactory } from '../src/runtime/base-runtime.js';

async function main() {
  console.log('🧪 MCP Integration Test\n');
  console.log('=' .repeat(70));

  // Test 1: Simple code without MCP calls
  console.log('\n📝 Test 1: Basic Code Execution (no MCP calls)');
  console.log('-'.repeat(70));

  const runtime = await RuntimeFactory.create({ type: 'bun' });

  const code1 = `
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
sum;
`;

  const result1 = await runtime.execute(code1);
  console.log('Result:', result1.result);
  console.log(`Time: ${result1.metrics.executionTime}ms`);

  // Test 2: Check if MCP proxy is available (will fail gracefully if not)
  console.log('\n📝 Test 2: MCP Proxy Availability Check');
  console.log('-'.repeat(70));

  const code2 = `
typeof mcp !== 'undefined' ? Object.keys(mcp) : ['MCP not available'];
`;

  const result2 = await runtime.execute(code2);
  console.log('Available MCP namespaces:', result2.result);
  console.log(`Time: ${result2.metrics.executionTime}ms`);

  // Test 3: Try calling a mock MCP tool (will show placeholder)
  console.log('\n📝 Test 3: Mock MCP Call (placeholder test)');
  console.log('-'.repeat(70));

  const code3 = `
if (typeof mcp !== 'undefined' && mcp.automem) {
  'MCP proxy is available';
} else {
  'MCP proxy not injected';
}
`;

  const result3 = await runtime.execute(code3);
  console.log('Result:', result3.result);
  console.log(`Time: ${result3.metrics.executionTime}ms`);

  await runtime.shutdown();

  console.log('\n' + '='.repeat(70));
  console.log('✅ MCP Integration Test Complete\n');
}

main().catch(console.error);