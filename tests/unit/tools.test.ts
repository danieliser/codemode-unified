import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaFirstToolRegistry } from '../../src/tools/registry.js';
import { z } from 'zod';

describe('Schema-First Tool Registry', () => {
  let registry: SchemaFirstToolRegistry;

  beforeEach(() => {
    registry = new SchemaFirstToolRegistry();
  });

  it('should register a simple tool', () => {
    registry.register({
      id: 'test.add',
      name: 'add',
      namespace: 'test',
      description: 'Add two numbers',
      inputSchema: z.object({
        a: z.number(),
        b: z.number()
      }),
      outputSchema: z.number(),
      handler: async ({ a, b }) => a + b
    });

    const tool = registry.get('test.add');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('add');
    expect(tool?.namespace).toBe('test');
  });

  it('should execute a registered tool', async () => {
    registry.register({
      id: 'math.multiply',
      name: 'multiply',
      namespace: 'math',
      description: 'Multiply two numbers',
      inputSchema: z.object({
        x: z.number(),
        y: z.number()
      }),
      outputSchema: z.number(),
      handler: async ({ x, y }) => x * y
    });

    const result = await registry.execute('math.multiply', { x: 5, y: 3 });
    expect(result).toBe(15);
  });

  it('should validate input with Zod schema', async () => {
    registry.register({
      id: 'text.uppercase',
      name: 'uppercase',
      namespace: 'text',
      description: 'Convert text to uppercase',
      inputSchema: z.object({
        text: z.string().min(1)
      }),
      outputSchema: z.string(),
      handler: async ({ text }) => text.toUpperCase()
    });

    // Valid input
    const validResult = await registry.execute('text.uppercase', { text: 'hello' });
    expect(validResult).toBe('HELLO');

    // Invalid input
    await expect(
      registry.execute('text.uppercase', { text: '' })
    ).rejects.toThrow('Validation error');

    await expect(
      registry.execute('text.uppercase', { text: 123 })
    ).rejects.toThrow('Validation error');
  });

  it('should validate output with Zod schema', async () => {
    registry.register({
      id: 'data.process',
      name: 'process',
      namespace: 'data',
      description: 'Process data object',
      inputSchema: z.object({
        data: z.any()
      }),
      outputSchema: z.object({
        processed: z.boolean(),
        count: z.number()
      }),
      handler: async ({ data }) => ({
        processed: true,
        count: Array.isArray(data) ? data.length : 1
      })
    });

    const result = await registry.execute('data.process', { data: [1, 2, 3] });
    expect(result).toEqual({ processed: true, count: 3 });
  });

  it('should list tools by namespace', () => {
    registry.register({
      id: 'math.add',
      name: 'add',
      namespace: 'math',
      description: 'Add numbers',
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      handler: async ({ a, b }) => a + b
    });

    registry.register({
      id: 'math.subtract',
      name: 'subtract',
      namespace: 'math',
      description: 'Subtract numbers',
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      handler: async ({ a, b }) => a - b
    });

    registry.register({
      id: 'text.reverse',
      name: 'reverse',
      namespace: 'text',
      description: 'Reverse text',
      inputSchema: z.object({ text: z.string() }),
      handler: async ({ text }) => text.split('').reverse().join('')
    });

    const mathTools = registry.getByNamespace('math');
    expect(mathTools).toHaveLength(2);
    expect(mathTools.map(t => t.name)).toContain('add');
    expect(mathTools.map(t => t.name)).toContain('subtract');

    const textTools = registry.getByNamespace('text');
    expect(textTools).toHaveLength(1);
    expect(textTools[0].name).toBe('reverse');
  });

  it('should generate TypeScript definitions', () => {
    registry.register({
      id: 'calc.divide',
      name: 'divide',
      namespace: 'calc',
      description: 'Divide two numbers',
      inputSchema: z.object({
        dividend: z.number(),
        divisor: z.number().min(0.001)
      }),
      outputSchema: z.number(),
      handler: async ({ dividend, divisor }) => dividend / divisor
    });

    const typeDefinitions = registry.generateTypeDefinitions();
    expect(typeDefinitions).toContain('interface CalcTools');
    expect(typeDefinitions).toContain('divide');
    expect(typeDefinitions).toContain('Promise<number>');
  });

  it('should create sandbox injection code', () => {
    registry.register({
      id: 'util.random',
      name: 'random',
      namespace: 'util',
      description: 'Generate random number',
      inputSchema: z.object({
        min: z.number().optional(),
        max: z.number().optional()
      }),
      outputSchema: z.number(),
      handler: async ({ min = 0, max = 1 }) => Math.random() * (max - min) + min
    });

    const injection = registry.createSandboxInjection();
    expect(injection).toContain('globalThis.tools');
    expect(injection).toContain('util');
    expect(injection).toContain('random');
  });

  it('should unregister tools', () => {
    registry.register({
      id: 'temp.test',
      name: 'test',
      namespace: 'temp',
      description: 'Temporary test tool',
      inputSchema: z.object({}),
      handler: async () => 'test'
    });

    expect(registry.get('temp.test')).toBeDefined();

    const unregistered = registry.unregister('temp.test');
    expect(unregistered).toBe(true);
    expect(registry.get('temp.test')).toBeUndefined();

    const unregisteredAgain = registry.unregister('temp.test');
    expect(unregisteredAgain).toBe(false);
  });

  it('should provide tool documentation', () => {
    registry.register({
      id: 'docs.example',
      name: 'example',
      namespace: 'docs',
      description: 'Example tool for documentation',
      inputSchema: z.object({
        message: z.string().describe('The message to process'),
        count: z.number().min(1).describe('Number of repetitions')
      }),
      outputSchema: z.array(z.string()),
      handler: async ({ message, count }) => Array(count).fill(message),
      metadata: {
        tags: ['example', 'documentation'],
        version: '1.0.0'
      }
    });

    const documentation = registry.getDocumentation();
    expect(documentation).toHaveLength(1);

    const docsNamespace = documentation[0];
    expect(docsNamespace.namespace).toBe('docs');
    expect(docsNamespace.tools).toHaveLength(1);

    const tool = docsNamespace.tools[0];
    expect(tool.name).toBe('example');
    expect(tool.description).toBe('Example tool for documentation');
    expect(tool.inputSchema.properties.message.description).toBe('The message to process');
  });
});