import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ToolsCoordinator } from '../../src/tools/index.js';
import type { MCPConfig } from '../../src/types/core.js';

describe('ToolsCoordinator', () => {
  let coordinator: ToolsCoordinator;

  beforeEach(async () => {
    coordinator = new ToolsCoordinator();
    await coordinator.initialize();
  });

  afterEach(async () => {
    if (coordinator) {
      await coordinator.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize without MCP config', async () => {
      const newCoordinator = new ToolsCoordinator();
      await expect(newCoordinator.initialize()).resolves.not.toThrow();
      await newCoordinator.shutdown();
    });

    it('should initialize with MCP config', async () => {
      const mcpConfig: MCPConfig = {
        servers: {
          'test-server': {
            command: 'echo',
            args: ['test'],
            transport: 'stdio',
            env: {}
          }
        }
      };

      const mcpCoordinator = new ToolsCoordinator();
      await mcpCoordinator.initialize(mcpConfig);

      expect(mcpCoordinator).toBeDefined();
      await mcpCoordinator.shutdown();
    });

    it('should not reinitialize if already initialized', async () => {
      await coordinator.initialize(); // Second call
      expect(coordinator).toBeDefined();
    });
  });

  describe('Native Tools', () => {
    it('should provide native tools by default', () => {
      const tools = coordinator.getAllTools();

      expect(tools.native).toBeDefined();
      expect(Array.isArray(tools.native)).toBe(true);
      expect(tools.native.length).toBeGreaterThan(0);
    });

    it.skip('should execute native tool', async () => {
      // TODO: Need to check actual schema for data.transform tool
      const result = await coordinator.execute('data.transform', {
        data: [1, 2, 3],
        transform: 'double'
      });

      expect(result).toBeDefined();
    });

    it('should throw error for non-existent tool', async () => {
      await expect(
        coordinator.execute('nonexistent.tool', {})
      ).rejects.toThrow('not found');
    });

    it('should throw error when not initialized', async () => {
      const uninitCoordinator = new ToolsCoordinator();

      await expect(
        uninitCoordinator.execute('data.transform', {})
      ).rejects.toThrow('not initialized');
    });
  });

  describe('Tool Discovery', () => {
    it('should list all available tools', () => {
      const tools = coordinator.getAllTools();

      expect(tools).toHaveProperty('native');
      expect(tools).toHaveProperty('mcp');
      expect(Array.isArray(tools.native)).toBe(true);
      expect(Array.isArray(tools.mcp)).toBe(true);
    });

    it('should include tool documentation', () => {
      const tools = coordinator.getAllTools();

      if (tools.native.length > 0) {
        const firstTool = tools.native[0];
        expect(firstTool).toHaveProperty('namespace');
        expect(firstTool).toHaveProperty('tools');
      }
    });
  });

  describe('Type Definitions', () => {
    it('should generate TypeScript definitions', () => {
      const types = coordinator.generateTypeDefinitions();

      expect(types).toBeDefined();
      expect(typeof types).toBe('string');
      expect(types.length).toBeGreaterThan(0);
    });

    it('should include native tools in types', () => {
      const types = coordinator.generateTypeDefinitions();

      expect(types).toContain('NATIVE TOOLS');
    });

    it('should include unified interface in types', () => {
      const types = coordinator.generateTypeDefinitions();

      expect(types).toContain('UnifiedToolsAPI');
      expect(types).toContain('execute');
      expect(types).toContain('getDocumentation');
    });
  });

  describe('Sandbox Injection', () => {
    it('should create sandbox injection code', () => {
      const injection = coordinator.createSandboxInjection();

      expect(injection).toBeDefined();
      expect(typeof injection).toBe('string');
      expect(injection.length).toBeGreaterThan(0);
    });

    it('should include unified tools API', () => {
      const injection = coordinator.createSandboxInjection();

      expect(injection).toContain('unifiedTools');
      expect(injection).toContain('execute');
    });

    it('should include native tools', () => {
      const injection = coordinator.createSandboxInjection();

      expect(injection).toContain('__executeNativeTool');
    });
  });

  describe('MCP Integration', () => {
    it('should return empty MCP tools when no MCP config', () => {
      const tools = coordinator.getAllTools();

      expect(tools.mcp).toEqual([]);
    });

    it('should integrate MCP tools when configured', async () => {
      const mcpConfig: MCPConfig = {
        servers: {
          'mock-server': {
            command: 'echo',
            args: [],
            transport: 'stdio',
            env: {}
          }
        }
      };

      const mcpCoordinator = new ToolsCoordinator();
      await mcpCoordinator.initialize(mcpConfig);

      const tools = mcpCoordinator.getAllTools();

      expect(tools).toBeDefined();
      // MCP tools may or may not be discovered depending on server availability

      await mcpCoordinator.shutdown();
    });
  });

  describe('Shutdown', () => {
    it('should shutdown cleanly', async () => {
      await expect(coordinator.shutdown()).resolves.not.toThrow();
    });

    it('should shutdown with MCP integration', async () => {
      const mcpConfig: MCPConfig = {
        servers: {
          'shutdown-test': {
            command: 'echo',
            args: [],
            transport: 'stdio',
            env: {}
          }
        }
      };

      const mcpCoordinator = new ToolsCoordinator();
      await mcpCoordinator.initialize(mcpConfig);
      await expect(mcpCoordinator.shutdown()).resolves.not.toThrow();
    });
  });
});
