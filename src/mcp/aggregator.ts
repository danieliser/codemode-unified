import { EventEmitter } from 'events';
import type {
  MCPServerConfig,
  ToolRegistry,
  ServerInfo,
  ToolInfo,
  HealthStatus
} from '../types/core.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';

export interface MCPConnection {
  name: string;
  config: MCPServerConfig;
  client: any; // MCP client instance
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastSeen: Date;
  tools: Map<string, ToolInfo>;
  retryCount: number;
  reconnectTimer?: NodeJS.Timeout;
}

export class MCPAggregator extends EventEmitter {
  private connections: Map<string, MCPConnection> = new Map();
  private registry: ToolRegistry;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly maxRetries = 3;
  private readonly reconnectDelay = 5000;

  constructor() {
    super();
    this.registry = {
      servers: new Map(),
      tools: new Map(),
      namespaces: new Map(),
      lastUpdated: new Date()
    };
  }

  async initialize(serverConfigs: Record<string, MCPServerConfig>): Promise<void> {
    console.log(`🔌 Initializing MCP Aggregator with ${Object.keys(serverConfigs).length} servers...`);

    // Initialize all server connections in parallel
    const connectionPromises = Object.entries(serverConfigs).map(
      ([name, config]) => this.connectServer(name, config)
    );

    await Promise.allSettled(connectionPromises);

    // Start health monitoring
    this.startHealthMonitoring();

    console.log(`✅ MCP Aggregator initialized with ${this.connections.size} connections`);
  }

  private async connectServer(name: string, config: MCPServerConfig): Promise<void> {
    console.log(`🔗 Connecting to MCP server: ${name}`);

    // Clean up existing connection if it exists
    const existingConnection = this.connections.get(name);
    if (existingConnection?.client) {
      console.log(`🧹 Cleaning up existing connection to ${name}`);
      try {
        if (typeof existingConnection.client.close === 'function') {
          await existingConnection.client.close();
        }
        if (existingConnection.client.process) {
          existingConnection.client.process.kill('SIGTERM');
        }
      } catch (error) {
        console.warn(`Failed to cleanup ${name}:`, error);
      }
    }

    const connection: MCPConnection = {
      name,
      config,
      client: null,
      status: 'connecting',
      lastSeen: new Date(),
      tools: new Map(),
      retryCount: existingConnection?.retryCount || 0 // Preserve retry count
    };

    this.connections.set(name, connection);

    try {
      // Create MCP client based on transport type
      const client = await this.createMCPClient(config);

      connection.client = client;
      connection.status = 'connected';
      connection.lastSeen = new Date();

      // Discover tools from this server
      await this.discoverTools(connection);

      // Update registry
      this.updateRegistry(connection);

      console.log(`✅ Connected to ${name}: ${connection.tools.size} tools discovered`);
      this.emit('serverConnected', name, connection);

    } catch (error: unknown) {
      console.error(`❌ Failed to connect to ${name}:`, (error instanceof Error ? error.message : String(error)));
      connection.status = 'error';
      this.emit('serverError', name, error);

      // Schedule retry
      this.scheduleReconnect(name);
    }
  }

  private async createMCPClient(config: MCPServerConfig): Promise<any> {
    // This is a placeholder for actual MCP client creation
    // In a real implementation, this would use the MCP SDK

    switch (config.transport) {
      case 'stdio':
        return this.createStdioClient(config);
      case 'http':
        return this.createHttpClient(config);
      case 'websocket':
        return this.createWebSocketClient(config);
      default:
        throw new Error(`Unsupported transport: ${config.transport}`);
    }
  }

  private async createStdioClient(config: MCPServerConfig): Promise<any> {
    // Resolve command if it's not an absolute path
    // This fixes "spawn npx ENOENT" errors when PATH is not inherited
    let resolvedCommand = config.command;
    if (!resolvedCommand.startsWith('/')) {
      try {
        const { execSync } = await import('child_process');
        resolvedCommand = execSync(`which ${config.command}`, { encoding: 'utf-8' }).trim();
      } catch (error) {
        console.warn(`Could not resolve command ${config.command}, using as-is`);
      }
    }

    // Merge environment variables - include parent process.env for PATH
    const mergedEnv = { ...process.env, ...(config.env || {}) };

    // Create real MCP client with stdio transport
    const transport = new StdioClientTransport({
      command: resolvedCommand,
      args: config.args || [],
      env: mergedEnv  // Pass full environment including PATH
    });

    const client = new Client({
      name: `codemode-unified-client`,
      version: '0.1.0'
    });

    await client.connect(transport);

    // Wrap client to match our interface
    return {
      type: 'stdio',
      command: resolvedCommand,
      args: config.args || [],
      client,
      transport,
      process: (transport as any)._process, // Access underlying process if available
      listTools: async () => {
        const response = await client.listTools();
        return response.tools || [];
      },
      callTool: async (name: string, args: any) => {
        const response = await client.callTool({ name, arguments: args });
        return response;
      },
      close: async () => {
        await client.close();
        // Transport cleanup is handled by client.close()
      }
    };
  }

  private async createHttpClient(config: MCPServerConfig): Promise<any> {
    // Placeholder for HTTP MCP client
    return {
      type: 'http',
      url: config.url,
      listTools: async () => [],
      callTool: async (name: string, args: any) => {
        const response = await fetch(`${config.url}/tools/${name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args)
        });
        return response.json();
      }
    };
  }

  private async createWebSocketClient(config: MCPServerConfig): Promise<any> {
    // Placeholder for WebSocket MCP client
    return {
      type: 'websocket',
      url: config.url,
      listTools: async () => [],
      callTool: async (name: string, args: any) => {
        // WebSocket implementation would go here
        return { result: 'WebSocket call result' };
      }
    };
  }

  private async discoverTools(connection: MCPConnection): Promise<void> {
    try {
      const tools = await connection.client.listTools();

      console.log(`\n🔍 [TOOL DISCOVERY] Server: ${connection.name}`);
      console.log(`📋 [TOOL DISCOVERY] Found ${tools.length} tools`);

      connection.tools.clear();

      for (const tool of tools) {
        const namespace = this.generateNamespace(connection.name, tool.name);

        console.log(`  ✨ [TOOL] Original: "${tool.name}" → Namespace: "${namespace}"`);
        if (tool.description) {
          console.log(`     📝 Description: ${tool.description.substring(0, 100)}${tool.description.length > 100 ? '...' : ''}`);
        }
        if (tool.inputSchema) {
          const params = tool.inputSchema.properties ? Object.keys(tool.inputSchema.properties) : [];
          console.log(`     📥 Parameters: [${params.join(', ')}]`);
        }

        const toolInfo: ToolInfo = {
          name: tool.name,
          serverName: connection.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          outputSchema: tool.outputSchema,
          namespace: namespace,
          metadata: tool.metadata || {}
        };

        connection.tools.set(tool.name, toolInfo);
      }

    } catch (error: unknown) {
      console.error(`Failed to discover tools for ${connection.name}:`, (error instanceof Error ? error.message : String(error)));
      throw error;
    }
  }

  private generateNamespace(serverName: string, toolName: string): string {
    // Create namespace like "helpscout.searchInboxes" or "filesystem.readFile"
    return `${serverName}.${toolName}`;
  }

  private maskEnvironmentVariables(env: Record<string, any>): Record<string, string> {
    // Mask all environment variable values for security
    const masked: Record<string, string> = {};
    for (const key of Object.keys(env)) {
      const value = String(env[key]);
      if (value.length <= 4) {
        masked[key] = '***';
      } else {
        // Show first 4 chars + '...' for longer values
        masked[key] = value.substring(0, 4) + '***';
      }
    }
    return masked;
  }

  private updateRegistry(connection: MCPConnection): void {
    // Check if this is an actual change before updating
    const existingServer = this.registry.servers.get(connection.name);

    // Create a sanitized config for health checks (mask environment variables)
    const sanitizedConfig = {
      ...connection.config,
      env: this.maskEnvironmentVariables(connection.config.env || {})
    };

    const newServerInfo: ServerInfo = {
      name: connection.name,
      status: connection.status as 'connected' | 'disconnected' | 'error',
      config: sanitizedConfig,
      health: this.getHealthStatus(connection),
      toolCount: connection.tools.size,
      lastSeen: connection.lastSeen
    };

    // Only emit registryUpdated if there are actual changes
    const hasChanges = !existingServer ||
      existingServer.status !== newServerInfo.status ||
      existingServer.toolCount !== newServerInfo.toolCount ||
      existingServer.health?.status !== newServerInfo.health?.status;

    this.registry.servers.set(connection.name, newServerInfo);

    // Update tools registry only if tools changed
    if (!existingServer || existingServer.toolCount !== newServerInfo.toolCount) {
      // Clear existing tools for this namespace
      const namespace = connection.name;
      this.registry.namespaces.set(namespace, []);

      // Re-add current tools
      for (const [toolName, toolInfo] of connection.tools) {
        const namespacedName = toolInfo.namespace;
        this.registry.tools.set(namespacedName, toolInfo);
        this.registry.namespaces.get(namespace)!.push(namespacedName);
      }
    }

    // Only emit if there were actual changes
    if (hasChanges) {
      this.registry.lastUpdated = new Date();
      this.emit('registryUpdated', this.registry);
    }
  }

  private getHealthStatus(connection: MCPConnection): HealthStatus {
    const now = new Date();
    const timeSinceLastSeen = now.getTime() - connection.lastSeen.getTime();

    let status: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';

    if (connection.status === 'connected' && timeSinceLastSeen < 60000) {
      status = 'healthy';
    } else if (connection.status === 'error' || timeSinceLastSeen > 300000) {
      status = 'unhealthy';
    }

    return {
      status,
      lastCheck: now,
      responseTime: timeSinceLastSeen,
      error: connection.status === 'error' ? 'Connection failed' : undefined
    };
  }

  async callTool(namespace: string, args: any): Promise<any> {
    const [serverName, toolName] = namespace.split('.', 2);

    const connection = this.connections.get(serverName);
    if (!connection || connection.status !== 'connected') {
      throw new Error(`Server ${serverName} is not available`);
    }

    const toolInfo = connection.tools.get(toolName);
    if (!toolInfo) {
      throw new Error(`Tool ${toolName} not found on server ${serverName}`);
    }

    try {
      const result = await connection.client.callTool(toolName, args);

      // Update last seen time
      connection.lastSeen = new Date();

      return result;

    } catch (error: unknown) {
      console.error(`Tool call failed for ${namespace}:`, (error instanceof Error ? error.message : String(error)));

      // Mark connection as potentially unhealthy
      if ((error instanceof Error ? error.message : String(error)).includes('timeout') || (error instanceof Error ? error.message : String(error)).includes('connection')) {
        connection.status = 'error';
        this.scheduleReconnect(serverName);
      }

      throw error;
    }
  }

  getAvailableTools(): ToolInfo[] {
    return Array.from(this.registry.tools.values());
  }

  getServerStatus(): ServerInfo[] {
    return Array.from(this.registry.servers.values());
  }

  getToolsByNamespace(namespace: string): ToolInfo[] {
    const toolNames = this.registry.namespaces.get(namespace) || [];
    return toolNames.map(name => this.registry.tools.get(name)!).filter(Boolean);
  }

  private scheduleReconnect(serverName: string): void {
    const connection = this.connections.get(serverName);
    if (!connection || connection.retryCount >= this.maxRetries) {
      return;
    }

    connection.retryCount++;
    const delay = this.reconnectDelay * Math.pow(2, connection.retryCount - 1); // Exponential backoff

    console.log(`⏳ Scheduling reconnect for ${serverName} in ${delay}ms (attempt ${connection.retryCount}/${this.maxRetries})`);

    // Clear any existing reconnect timer
    if (connection.reconnectTimer) {
      clearTimeout(connection.reconnectTimer);
    }

    connection.reconnectTimer = setTimeout(async () => {
      if (connection.status === 'error') {
        console.log(`🔄 Retrying connection to ${serverName}...`);
        await this.connectServer(serverName, connection.config);
      }
      connection.reconnectTimer = undefined;
    }, delay);
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 30000); // Check every 30 seconds
  }

  private async performHealthChecks(): Promise<void> {
    for (const [name, connection] of this.connections) {
      if (connection.status === 'connected') {
        try {
          // Simple ping to check if connection is still alive
          await connection.client.listTools();
          connection.lastSeen = new Date();
        } catch (error: unknown) {
          console.warn(`Health check failed for ${name}:`, (error instanceof Error ? error.message : String(error)));
          connection.status = 'error';
          this.scheduleReconnect(name);
        }
      }
    }

    // Update registry with latest health status
    for (const connection of this.connections.values()) {
      this.updateRegistry(connection);
    }
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down MCP Aggregator...');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Clear all reconnect timers
    for (const connection of this.connections.values()) {
      if (connection.reconnectTimer) {
        clearTimeout(connection.reconnectTimer);
        connection.reconnectTimer = undefined;
      }
    }

    // Close all connections
    const shutdownPromises = Array.from(this.connections.values()).map(
      async (connection) => {
        if (connection.client && typeof connection.client.close === 'function') {
          try {
            await connection.client.close();
          } catch (error: unknown) {
            console.warn(`Error closing connection ${connection.name}:`, (error instanceof Error ? error.message : String(error)));
          }
        }
      }
    );

    await Promise.allSettled(shutdownPromises);

    this.connections.clear();
    this.registry.servers.clear();
    this.registry.tools.clear();
    this.registry.namespaces.clear();

    console.log('✅ MCP Aggregator shutdown complete');
  }
}