/**
 * MCP Hybrid Response Format Tests
 *
 * NOTE: These tests require a running AutoMem MCP server.
 * Run `cd services/automem && uvicorn app.api:app --host 127.0.0.1 --port 8001`
 * before running these tests.
 *
 * To run: npx vitest run tests/integration/mcp-hybrid-response.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createExecutor } from '../../src/executor.js';
import { defaultConfig } from '../../src/config/index.js';

describe.skip('MCP Hybrid Response Format (requires AutoMem)', () => {
  let executor: any;

  beforeAll(async () => {
    const testConfig = {
      ...defaultConfig,
      server: {
        ...defaultConfig.server,
        port: 3003 // Different port for testing
      }
    };

    executor = createExecutor({ config: testConfig });
    await executor.initialize();
  });

  afterAll(async () => {
    if (executor) {
      await executor.shutdown();
    }
  });

  it('should return enhanced response with raw content array', async () => {
    const code = `
      const result = await mcp.automem.recall_memory({
        query: "test hybrid response",
        limit: 1
      });

      return {
        hasContent: Array.isArray(result.content),
        contentLength: result.content?.length
      };
    `;

    const response = await executor.execute(code, { runtime: 'bun' });

    expect(response.success).toBe(true);
    expect(response.result.hasContent).toBe(true);
    expect(response.result.contentLength).toBeGreaterThanOrEqual(1);
  });

  it('should return combined text field', async () => {
    const code = `
      const result = await mcp.automem.recall_memory({
        query: "test hybrid response",
        limit: 1
      });

      return {
        hasText: typeof result.text === 'string',
        textPreview: result.text?.substring(0, 50)
      };
    `;

    const response = await executor.execute(code, { runtime: 'bun' });

    expect(response.success).toBe(true);
    expect(response.result.hasText).toBe(true);
    expect(response.result.textPreview).toBeTruthy();
  });

  it('should return auto-parsed field', async () => {
    const code = `
      const result = await mcp.automem.recall_memory({
        query: "test hybrid response",
        limit: 1
      });

      return {
        hasParsed: result.parsed !== undefined,
        parsedType: typeof result.parsed
      };
    `;

    const response = await executor.execute(code, { runtime: 'bun' });

    expect(response.success).toBe(true);
    expect(response.result.hasParsed).toBe(true);
  });

  it('should provide helper methods', async () => {
    const code = `
      const result = await mcp.automem.recall_memory({
        query: "test hybrid response",
        limit: 1
      });

      return {
        hasHelpers: typeof result.helpers === 'object',
        helperMethods: Object.keys(result.helpers || {})
      };
    `;

    const response = await executor.execute(code, { runtime: 'bun' });

    expect(response.success).toBe(true);
    expect(response.result.hasHelpers).toBe(true);
    expect(response.result.helperMethods).toContain('parseAsArray');
    expect(response.result.helperMethods).toContain('parseAsStructured');
    expect(response.result.helperMethods).toContain('parseAsKeyValue');
    expect(response.result.helperMethods).toContain('getRawText');
  });

  it('should parse arrays with parseAsArray() helper', async () => {
    const code = `
      const result = await mcp.automem.recall_memory({
        query: "test hybrid response",
        limit: 2
      });

      const arrayParsed = result.helpers.parseAsArray();

      return {
        isArray: Array.isArray(arrayParsed),
        itemCount: arrayParsed.length,
        firstItemKeys: arrayParsed[0] ? Object.keys(arrayParsed[0]) : []
      };
    `;

    const response = await executor.execute(code, { runtime: 'bun' });

    expect(response.success).toBe(true);
    expect(response.result.isArray).toBe(true);
    expect(response.result.itemCount).toBeGreaterThan(0);
    expect(response.result.firstItemKeys).toContain('index');
    expect(response.result.firstItemKeys).toContain('content');
  });

  it('should extract metadata from array items', async () => {
    const code = `
      const result = await mcp.automem.recall_memory({
        query: "test hybrid response",
        limit: 1
      });

      const arrayParsed = result.helpers.parseAsArray();
      const firstItem = arrayParsed[0] || {};

      return {
        hasId: 'id' in firstItem,
        hasCreated: 'created' in firstItem,
        hasContent: 'content' in firstItem,
        metadata: {
          id: firstItem.id,
          created: firstItem.created
        }
      };
    `;

    const response = await executor.execute(code, { runtime: 'bun' });

    expect(response.success).toBe(true);
    expect(response.result.hasId).toBe(true);
    expect(response.result.hasCreated).toBe(true);
    expect(response.result.hasContent).toBe(true);
  });

  it('should work with store_memory response', async () => {
    const code = `
      const result = await mcp.automem.store_memory({
        content: "Test hybrid response format",
        tags: ["test"],
        importance: 0.5
      });

      return {
        hasContent: Array.isArray(result.content),
        hasText: typeof result.text === 'string',
        hasHelpers: typeof result.helpers === 'object',
        textPreview: result.text?.substring(0, 100)
      };
    `;

    const response = await executor.execute(code, { runtime: 'bun' });

    expect(response.success).toBe(true);
    expect(response.result.hasContent).toBe(true);
    expect(response.result.hasText).toBe(true);
    expect(response.result.hasHelpers).toBe(true);
  });
});
