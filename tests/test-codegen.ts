#!/usr/bin/env tsx
/**
 * Test script for TypeScript codegen system
 * Tests the complete workflow without starting the full MCP server
 */

import { MCPManager } from '../src/mcp/index.js';
import { CodeGenService } from '../src/codegen/index.js';
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('🧪 Testing TypeScript CodeGen System\n');

  // Load MCP config and convert to MCPConfig format
  const configPath = join(process.cwd(), '.mcp.json');
  const rawConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

  // Convert .mcp.json format to MCPConfig
  const mcpConfig: any = { servers: {} };
  if (rawConfig.mcpServers) {
    for (const [name, serverConfig] of Object.entries(rawConfig.mcpServers as any)) {
      if (name === 'codemode' || name === 'codemode-unified') continue;

      mcpConfig.servers[name] = {
        name,
        transport: (serverConfig as any).transport || 'stdio',
        command: (serverConfig as any).command,
        args: (serverConfig as any).args || [],
        environment: (serverConfig as any).env || {},
        timeout: 30000
      };
    }
  }

  // Initialize MCP Manager
  console.log('1️⃣ Initializing MCP Manager...');
  const mcpManager = new MCPManager(mcpConfig);
  await mcpManager.initialize();
  console.log('✅ MCP Manager initialized\n');

  // Generate TypeScript declarations
  console.log('2️⃣ Generating TypeScript declarations...');
  const codegenService = new CodeGenService(mcpManager);

  try {
    const outputPath = await codegenService.generateDeclarations();
    console.log(`✅ Generated: ${outputPath}\n`);

    // Read and display the generated file
    console.log('3️⃣ Generated file contents:');
    console.log('─'.repeat(80));
    const generated = readFileSync(outputPath, 'utf-8');
    console.log(generated);
    console.log('─'.repeat(80));

    console.log('\n✨ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mcpManager.shutdown();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});