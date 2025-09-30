/**
 * Bun Runtime Working Showcase
 *
 * Practical examples that explicitly return values
 */

import { RuntimeFactory, RuntimeType } from '../src/runtime/base-runtime.js';

async function main() {
  console.log('🚀 Bun Runtime Showcase - Working Examples\n');
  console.log('='.repeat(70));

  const runtime = await RuntimeFactory.create({
    type: RuntimeType.BUN,
    maxWorkers: 2,
    defaultTimeout: 30000
  });

  const caps = runtime.getCapabilities();
  console.log('\n✨ Capabilities: Async ✅ | TypeScript ✅ | ES2024+ ✅\n');

  // Example 1: TypeScript Interface
  console.log('📝 Example 1: TypeScript with Interfaces');
  console.log('-'.repeat(70));

  const ex1 = `
interface User { id: number; name: string; email: string; }
const user: User = { id: 1, name: 'Alice', email: 'alice@example.com' };
user;
`;

  const r1 = await runtime.execute(ex1);
  console.log('Result:', r1.result);
  console.log(`Time: ${r1.metrics.executionTime}ms\n`);

  // Example 2: Async/Await
  console.log('⏱️  Example 2: Async/Await with Promises');
  console.log('-'.repeat(70));

  const ex2 = `
async function delay(ms: number, value: any) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

const result = await delay(10, { status: 'completed', data: [1, 2, 3] });
result;
`;

  const r2 = await runtime.execute(ex2);
  console.log('Result:', r2.result);
  console.log(`Time: ${r2.metrics.executionTime}ms\n`);

  // Example 3: Promise.all
  console.log('🔄 Example 3: Parallel Async Operations (Promise.all)');
  console.log('-'.repeat(70));

  const ex3 = `
async function fetchUser(id: number) {
  await new Promise(r => setTimeout(r, 5));
  return { id, name: \`User\${id}\`, role: 'member' };
}

const users = await Promise.all([
  fetchUser(1),
  fetchUser(2),
  fetchUser(3)
]);

users;
`;

  const r3 = await runtime.execute(ex3);
  console.log('Result:', r3.result);
  console.log(`Time: ${r3.metrics.executionTime}ms\n`);

  // Example 4: Modern ES Features
  console.log('✨ Example 4: ES2024+ Features');
  console.log('-'.repeat(70));

  const ex4 = `
const data = { user: { name: 'Bob', age: 30 } };

const result = {
  name: data?.user?.name ?? 'Unknown',
  adult: data?.user?.age >= 18,
  doubled: [1, 2, 3].map(x => x * 2),
  sum: [1, 2, 3, 4, 5].reduce((a, b) => a + b, 0),
  template: \`Hello, \${data.user.name}!\`
};

result;
`;

  const r4 = await runtime.execute(ex4);
  console.log('Result:', r4.result);
  console.log(`Time: ${r4.metrics.executionTime}ms\n`);

  // Example 5: Try/Catch Error Handling
  console.log('🛡️  Example 5: Error Handling');
  console.log('-'.repeat(70));

  const ex5 = `
async function mayFail(shouldFail: boolean) {
  if (shouldFail) throw new Error('Failed!');
  return { success: true };
}

const results = [];

try {
  results.push(await mayFail(false));
} catch (e) {
  results.push({ error: e.message });
}

try {
  results.push(await mayFail(true));
} catch (e) {
  results.push({ error: e.message, caught: true });
}

results;
`;

  const r5 = await runtime.execute(ex5);
  console.log('Result:', r5.result);
  console.log(`Time: ${r5.metrics.executionTime}ms\n`);

  // Example 6: TypeScript Generics
  console.log('🎯 Example 6: TypeScript Generics');
  console.log('-'.repeat(70));

  const ex6 = `
interface ApiResponse<T> {
  data: T;
  status: number;
  timestamp: number;
}

function wrapResponse<T>(data: T, status: number = 200): ApiResponse<T> {
  return {
    data,
    status,
    timestamp: Date.now()
  };
}

const userResponse = wrapResponse({ id: 1, name: 'Charlie' }, 200);
const errorResponse = wrapResponse({ message: 'Not found' }, 404);

{ userResponse, errorResponse };
`;

  const r6 = await runtime.execute(ex6);
  console.log('Result:', JSON.stringify(r6.result, null, 2));
  console.log(`Time: ${r6.metrics.executionTime}ms\n`);

  // Example 7: Array Processing Pipeline
  console.log('📊 Example 7: Data Processing Pipeline');
  console.log('-'.repeat(70));

  const ex7 = `
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

const products: Product[] = [
  { id: 1, name: 'Laptop', price: 999, category: 'Electronics' },
  { id: 2, name: 'Mouse', price: 29, category: 'Electronics' },
  { id: 3, name: 'Desk', price: 299, category: 'Furniture' },
  { id: 4, name: 'Chair', price: 199, category: 'Furniture' }
];

const summary = {
  total: products.length,
  totalValue: products.reduce((sum, p) => sum + p.price, 0),
  byCategory: products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  expensive: products.filter(p => p.price > 200).map(p => p.name)
};

summary;
`;

  const r7 = await runtime.execute(ex7);
  console.log('Result:', JSON.stringify(r7.result, null, 2));
  console.log(`Time: ${r7.metrics.executionTime}ms\n`);

  // Example 8: Classes and OOP
  console.log('🏗️  Example 8: Object-Oriented Programming');
  console.log('-'.repeat(70));

  const ex8 = `
class Calculator {
  private history: string[] = [];

  add(a: number, b: number): number {
    const result = a + b;
    this.history.push(\`\${a} + \${b} = \${result}\`);
    return result;
  }

  multiply(a: number, b: number): number {
    const result = a * b;
    this.history.push(\`\${a} * \${b} = \${result}\`);
    return result;
  }

  getHistory(): string[] {
    return this.history;
  }
}

const calc = new Calculator();
const sum = calc.add(5, 3);
const product = calc.multiply(4, 7);

{
  sum,
  product,
  history: calc.getHistory()
};
`;

  const r8 = await runtime.execute(ex8);
  console.log('Result:', JSON.stringify(r8.result, null, 2));
  console.log(`Time: ${r8.metrics.executionTime}ms\n`);

  // Example 9: Async/Await Chaining
  console.log('🔗 Example 9: Async/Await Chaining');
  console.log('-'.repeat(70));

  const ex9 = `
async function step1() {
  await new Promise(r => setTimeout(r, 5));
  return { step: 1, value: 'initialized' };
}

async function step2(prev: any) {
  await new Promise(r => setTimeout(r, 5));
  return { step: 2, value: 'processed', prev: prev.value };
}

async function step3(prev: any) {
  await new Promise(r => setTimeout(r, 5));
  return { step: 3, value: 'completed', history: [prev.prev, prev.value] };
}

const result1 = await step1();
const result2 = await step2(result1);
const result3 = await step3(result2);

result3;
`;

  const r9 = await runtime.execute(ex9);
  console.log('Result:', r9.result);
  console.log(`Time: ${r9.metrics.executionTime}ms\n`);

  // Example 10: Complex TypeScript Types
  console.log('🎨 Example 10: Advanced TypeScript Types');
  console.log('-'.repeat(70));

  const ex10 = `
type Status = 'pending' | 'success' | 'error';

interface Task<T> {
  id: string;
  status: Status;
  data?: T;
  error?: string;
}

function createTask<T>(id: string, data: T): Task<T> {
  return {
    id,
    status: 'success',
    data
  };
}

function createErrorTask(id: string, error: string): Task<never> {
  return {
    id,
    status: 'error',
    error
  };
}

const tasks = [
  createTask('task1', { user: 'Alice', score: 95 }),
  createTask('task2', { user: 'Bob', score: 87 }),
  createErrorTask('task3', 'Network timeout')
];

tasks;
`;

  const r10 = await runtime.execute(ex10);
  console.log('Result:', JSON.stringify(r10.result, null, 2));
  console.log(`Time: ${r10.metrics.executionTime}ms\n`);

  // Performance Summary
  console.log('='.repeat(70));
  console.log('📈 Performance Summary');
  console.log('='.repeat(70));

  const metrics = runtime.getMetrics();
  console.log(`\n  Total Executions: ${metrics.totalExecutions}`);
  console.log(`  Average Time: ${metrics.averageExecutionTime.toFixed(2)}ms`);
  console.log(`  Memory Used: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB`);

  await runtime.shutdown();
  console.log('\n✅ Bun Runtime Showcase Complete!\n');
}

main().catch(console.error);