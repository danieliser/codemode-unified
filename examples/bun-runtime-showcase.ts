/**
 * Bun Runtime Showcase
 *
 * Demonstrates the full capabilities of the Bun runtime including:
 * - TypeScript support (native, no compilation needed)
 * - Async/await and Promises
 * - Modern ES2024+ features
 * - Error handling
 * - Complex data structures
 * - Real-world examples
 */

import { RuntimeFactory, RuntimeType } from '../src/runtime/base-runtime.js';

async function showcaseBunRuntime() {
  console.log('🚀 Bun Runtime Showcase\n');
  console.log('='.repeat(60));

  // Initialize Bun runtime
  console.log('\n📦 Initializing Bun Runtime...');
  const runtime = await RuntimeFactory.create({
    type: RuntimeType.BUN,
    maxWorkers: 2,
    defaultTimeout: 30000
  });

  const capabilities = runtime.getCapabilities();
  console.log('\n✨ Runtime Capabilities:');
  console.log(`  - Async/Await: ${capabilities.supportsAsync ? '✅' : '❌'}`);
  console.log(`  - TypeScript: ${capabilities.supportsTypeScript ? '✅' : '❌'}`);
  console.log(`  - ES Modules: ${capabilities.supportsESModules ? '✅' : '❌'}`);
  console.log(`  - Top-level Await: ${capabilities.supportsTopLevelAwait ? '✅' : '❌'}`);
  console.log(`  - Startup Time: ~${capabilities.typicalStartupMs}ms`);

  console.log('\n' + '='.repeat(60));

  // Example 1: TypeScript with Interfaces
  console.log('\n📝 Example 1: TypeScript Interfaces & Generics');
  console.log('-'.repeat(60));

  const example1 = `
interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

function createUser(id: number, name: string, email: string): User {
  return {
    id,
    name,
    email,
    roles: ['user']
  };
}

function wrapInResponse<T>(data: T, message: string = 'Success'): ApiResponse<T> {
  return {
    data,
    status: 200,
    message
  };
}

const user = createUser(1, 'Alice Johnson', 'alice@example.com');
const response = wrapInResponse(user, 'User created successfully');

response;
`;

  const result1 = await runtime.execute(example1);
  console.log('✅ Execution successful!');
  console.log('📊 Result:', JSON.stringify(result1.result, null, 2));
  console.log(`⚡ Execution time: ${result1.metrics.executionTime}ms`);

  // Example 2: Async/Await with Promises
  console.log('\n\n⏱️  Example 2: Async/Await with Multiple Promises');
  console.log('-'.repeat(60));

  const example2 = `
async function fetchUserData(userId: number): Promise<{ id: number; name: string }> {
  // Simulate API call with Promise
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: userId, name: \`User \${userId}\` });
    }, 10);
  });
}

async function fetchUserPosts(userId: number): Promise<{ title: string }[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { title: 'Post 1 by User ' + userId },
        { title: 'Post 2 by User ' + userId }
      ]);
    }, 15);
  });
}

async function getUserProfile(userId: number) {
  // Parallel execution with Promise.all
  const [user, posts] = await Promise.all([
    fetchUserData(userId),
    fetchUserPosts(userId)
  ]);

  return {
    user,
    posts,
    totalPosts: posts.length
  };
}

await getUserProfile(42);
`;

  const result2 = await runtime.execute(example2);
  console.log('✅ Async execution successful!');
  console.log('📊 Result:', JSON.stringify(result2.result, null, 2));
  console.log(`⚡ Execution time: ${result2.metrics.executionTime}ms`);

  // Example 3: Modern ES2024+ Features
  console.log('\n\n✨ Example 3: Modern ES2024+ Features');
  console.log('-'.repeat(60));

  const example3 = `
// Optional chaining & nullish coalescing
const data = {
  user: {
    name: 'Bob',
    profile: {
      bio: 'Developer'
    }
  }
};

const bio = data?.user?.profile?.bio ?? 'No bio available';
const age = data?.user?.age ?? 'Unknown';

// Array methods
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);

// Object destructuring
const { user: { name, profile } } = data;

// Template literals
const message = \`User \${name} (\${profile.bio}) - Bio: \${bio}\`;

// Return comprehensive result
({
  bio,
  age,
  doubled,
  evens,
  sum,
  message,
  features: {
    optionalChaining: true,
    nullishCoalescing: true,
    arrayMethods: true,
    destructuring: true,
    templateLiterals: true
  }
});
`;

  const result3 = await runtime.execute(example3);
  console.log('✅ Modern features working!');
  console.log('📊 Result:', JSON.stringify(result3.result, null, 2));
  console.log(`⚡ Execution time: ${result3.metrics.executionTime}ms`);

  // Example 4: Error Handling
  console.log('\n\n🛡️  Example 4: Error Handling with Try/Catch');
  console.log('-'.repeat(60));

  const example4 = `
async function riskyOperation(shouldFail: boolean): Promise<string> {
  if (shouldFail) {
    throw new Error('Operation failed intentionally');
  }
  return 'Operation succeeded';
}

async function safeExecute() {
  const results = [];

  // Success case
  try {
    const success = await riskyOperation(false);
    results.push({ status: 'success', message: success });
  } catch (error) {
    results.push({ status: 'error', message: error.message });
  }

  // Failure case
  try {
    const failure = await riskyOperation(true);
    results.push({ status: 'success', message: failure });
  } catch (error) {
    results.push({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      caught: true
    });
  }

  return results;
}

await safeExecute();
`;

  const result4 = await runtime.execute(example4);
  console.log('✅ Error handling validated!');
  console.log('📊 Result:', JSON.stringify(result4.result, null, 2));
  console.log(`⚡ Execution time: ${result4.metrics.executionTime}ms`);

  // Example 5: Complex Data Processing
  console.log('\n\n📊 Example 5: Complex Data Processing Pipeline');
  console.log('-'.repeat(60));

  const example5 = `
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

interface OrderSummary {
  totalProducts: number;
  totalValue: number;
  byCategory: Record<string, { count: number; value: number }>;
  outOfStock: string[];
}

async function processProducts(products: Product[]): Promise<OrderSummary> {
  // Simulate async processing
  await new Promise(resolve => setTimeout(resolve, 5));

  const summary: OrderSummary = {
    totalProducts: products.length,
    totalValue: 0,
    byCategory: {},
    outOfStock: []
  };

  for (const product of products) {
    // Total value
    summary.totalValue += product.price;

    // By category
    if (!summary.byCategory[product.category]) {
      summary.byCategory[product.category] = { count: 0, value: 0 };
    }
    summary.byCategory[product.category].count++;
    summary.byCategory[product.category].value += product.price;

    // Out of stock
    if (!product.inStock) {
      summary.outOfStock.push(product.name);
    }
  }

  // Round total value
  summary.totalValue = Math.round(summary.totalValue * 100) / 100;

  return summary;
}

const products: Product[] = [
  { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics', inStock: true },
  { id: 2, name: 'Mouse', price: 29.99, category: 'Electronics', inStock: true },
  { id: 3, name: 'Desk', price: 299.99, category: 'Furniture', inStock: false },
  { id: 4, name: 'Chair', price: 199.99, category: 'Furniture', inStock: true },
  { id: 5, name: 'Monitor', price: 349.99, category: 'Electronics', inStock: false }
];

await processProducts(products);
`;

  const result5 = await runtime.execute(example5);
  console.log('✅ Complex processing completed!');
  console.log('📊 Result:', JSON.stringify(result5.result, null, 2));
  console.log(`⚡ Execution time: ${result5.metrics.executionTime}ms`);

  // Example 6: Class-based TypeScript
  console.log('\n\n🏗️  Example 6: Object-Oriented TypeScript (Classes)');
  console.log('-'.repeat(60));

  const example6 = `
abstract class Animal {
  constructor(public name: string, public age: number) {}

  abstract makeSound(): string;

  describe(): string {
    return \`\${this.name} is \${this.age} years old and says: \${this.makeSound()}\`;
  }
}

class Dog extends Animal {
  constructor(name: string, age: number, public breed: string) {
    super(name, age);
  }

  makeSound(): string {
    return 'Woof!';
  }

  fetch(): string {
    return \`\${this.name} the \${this.breed} is fetching the ball!\`;
  }
}

class Cat extends Animal {
  constructor(name: string, age: number, public color: string) {
    super(name, age);
  }

  makeSound(): string {
    return 'Meow!';
  }

  purr(): string {
    return \`\${this.name} the \${this.color} cat is purring!\`;
  }
}

const animals: Animal[] = [
  new Dog('Buddy', 5, 'Golden Retriever'),
  new Cat('Whiskers', 3, 'orange'),
  new Dog('Max', 2, 'German Shepherd')
];

const descriptions = animals.map(animal => ({
  type: animal.constructor.name,
  description: animal.describe(),
  specialAction: animal instanceof Dog
    ? animal.fetch()
    : animal instanceof Cat
    ? animal.purr()
    : 'Unknown'
}));

descriptions;
`;

  const result6 = await runtime.execute(example6);
  console.log('✅ OOP features working!');
  console.log('📊 Result:', JSON.stringify(result6.result, null, 2));
  console.log(`⚡ Execution time: ${result6.metrics.executionTime}ms`);

  // Example 7: Real-world API Simulation
  console.log('\n\n🌐 Example 7: Real-World REST API Simulation');
  console.log('-'.repeat(60));

  const example7 = `
interface User {
  id: number;
  username: string;
  email: string;
}

interface Post {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: Date;
}

class InMemoryDatabase {
  private users: Map<number, User> = new Map();
  private posts: Map<number, Post> = new Map();
  private nextUserId = 1;
  private nextPostId = 1;

  async createUser(username: string, email: string): Promise<User> {
    await this.delay(10);
    const user: User = {
      id: this.nextUserId++,
      username,
      email
    };
    this.users.set(user.id, user);
    return user;
  }

  async createPost(userId: number, title: string, content: string): Promise<Post | null> {
    await this.delay(15);

    if (!this.users.has(userId)) {
      return null;
    }

    const post: Post = {
      id: this.nextPostId++,
      userId,
      title,
      content,
      createdAt: new Date()
    };
    this.posts.set(post.id, post);
    return post;
  }

  async getUserWithPosts(userId: number): Promise<{ user: User; posts: Post[] } | null> {
    await this.delay(20);

    const user = this.users.get(userId);
    if (!user) return null;

    const posts = Array.from(this.posts.values())
      .filter(post => post.userId === userId);

    return { user, posts };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runApiSimulation() {
  const db = new InMemoryDatabase();

  // Create users
  const [alice, bob] = await Promise.all([
    db.createUser('alice', 'alice@example.com'),
    db.createUser('bob', 'bob@example.com')
  ]);

  // Create posts
  await Promise.all([
    db.createPost(alice.id, 'My First Post', 'Hello world!'),
    db.createPost(alice.id, 'TypeScript Tips', 'TypeScript is amazing...'),
    db.createPost(bob.id, 'Bun Runtime', 'Bun is so fast!')
  ]);

  // Fetch user with posts
  const aliceWithPosts = await db.getUserWithPosts(alice.id);
  const bobWithPosts = await db.getUserWithPosts(bob.id);

  return {
    alice: aliceWithPosts,
    bob: bobWithPosts,
    summary: {
      totalUsers: 2,
      alicePosts: aliceWithPosts?.posts.length ?? 0,
      bobPosts: bobWithPosts?.posts.length ?? 0
    }
  };
}

await runApiSimulation();
`;

  const result7 = await runtime.execute(example7);
  console.log('✅ API simulation completed!');
  console.log('📊 Result:', JSON.stringify(result7.result, null, 2));
  console.log(`⚡ Execution time: ${result7.metrics.executionTime}ms`);

  // Performance Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📈 Performance Summary');
  console.log('='.repeat(60));

  const metrics = runtime.getMetrics();
  console.log(`\n  Total Executions: ${metrics.totalExecutions}`);
  console.log(`  Average Time: ${metrics.averageExecutionTime.toFixed(2)}ms`);
  console.log(`  Memory Used: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB`);

  // Shutdown
  console.log('\n🔄 Shutting down runtime...');
  await runtime.shutdown();
  console.log('✅ Runtime shut down successfully\n');

  console.log('='.repeat(60));
  console.log('🎉 Bun Runtime Showcase Complete!');
  console.log('='.repeat(60));
}

// Run the showcase
showcaseBunRuntime().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});