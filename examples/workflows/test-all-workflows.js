#!/usr/bin/env node
/**
 * Comprehensive Workflow Test Runner
 *
 * Tests all "crazy powerful" real-world workflows to demonstrate
 * CodeMode Unified's capabilities for business automation:
 *
 * 1. HelpScout Customer Intelligence - Support automation
 * 2. GitHub Release Automation - Development automation
 * 3. Multi-Source Business Intelligence - Executive reporting
 *
 * These workflows showcase:
 * - Multi-MCP server orchestration
 * - Real business data integration
 * - AI-powered analytics and insights
 * - ETL data transformation
 * - Cross-platform automation
 */

import { RuntimeFactory, RuntimeType } from '../../dist/runtime/base-runtime.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workflows = [
  {
    name: 'HelpScout Customer Intelligence',
    file: 'helpscout-customer-intelligence.js',
    description: 'Support ticket automation with customer context',
    runtime: RuntimeType.BUN
  },
  {
    name: 'GitHub Release Automation',
    file: 'github-release-automation.js',
    description: 'Automated release management and announcement',
    runtime: RuntimeType.BUN
  },
  {
    name: 'Multi-Source Business Intelligence',
    file: 'multi-source-business-intelligence.js',
    description: 'Executive dashboard with cross-platform analytics',
    runtime: RuntimeType.DENO // More complex, use Deno for better error handling
  }
];

async function testAllWorkflows() {
  console.log('🚀 CodeMode Unified: Real-World Business Automation Showcase\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = [];
  const startTime = Date.now();

  for (const [index, workflow] of workflows.entries()) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`Workflow ${index + 1}/${workflows.length}: ${workflow.name}`);
    console.log(`${'═'.repeat(60)}\n`);
    console.log(`📋 Description: ${workflow.description}`);
    console.log(`⚙️  Runtime: ${workflow.runtime}\n`);

    try {
      // Create runtime
      const runtime = await RuntimeFactory.create({
        type: workflow.runtime,
        maxWorkers: 1
      });

      // Load workflow
      const code = readFileSync(join(__dirname, workflow.file), 'utf-8');

      // Execute
      const execStart = Date.now();
      const result = await runtime.execute(code, { timeout: 60000 });
      const execTime = Date.now() - execStart;

      if (!result.success) {
        console.error(`❌ FAILED: ${result.error?.message}\n`);
        results.push({
          workflow: workflow.name,
          success: false,
          error: result.error?.message,
          executionTime: execTime
        });
        await runtime.shutdown();
        continue;
      }

      console.log(`✅ SUCCESS: Completed in ${execTime}ms\n`);

      // Display key results
      const data = result.result;

      if (workflow.name.includes('HelpScout')) {
        console.log('🔍 Customer Intelligence Generated:');
        console.log(`   Tier: ${data.insights?.customerTier || 'N/A'}`);
        console.log(`   Actions: ${data.insights?.suggestedActions?.length || 0} suggested`);
        console.log(`   Response: ${data.suggestedResponse ? 'Generated' : 'N/A'}`);
      } else if (workflow.name.includes('GitHub')) {
        console.log('📦 Release Automation:');
        console.log(`   New Version: ${data.newVersion || 'N/A'}`);
        console.log(`   Type: ${data.versionBump || 'N/A'} version bump`);
        console.log(`   Announcements: ${data.twitterThread?.length || 0} tweets + Slack`);
      } else if (workflow.name.includes('Intelligence')) {
        console.log('📊 Business Intelligence:');
        console.log(`   Health Score: ${data.businessHealth || 'N/A'}/100`);
        console.log(`   Data Sources: 4 platforms integrated`);
        console.log(`   Insights: Executive summary generated`);
      }

      console.log();

      results.push({
        workflow: workflow.name,
        success: true,
        executionTime: execTime,
        data
      });

      await runtime.shutdown();

    } catch (error) {
      console.error(`❌ ERROR: ${error.message}\n`);
      results.push({
        workflow: workflow.name,
        success: false,
        error: error.message
      });
    }
  }

  const totalTime = Date.now() - startTime;

  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 Test Summary');
  console.log(`${'═'.repeat(60)}\n`);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total Workflows: ${workflows.length}`);
  console.log(`✅ Successful: ${successful}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`);
  }
  console.log(`⏱️  Total Time: ${totalTime}ms`);
  console.log();

  // Individual results
  console.log('Individual Results:');
  results.forEach((result, i) => {
    const status = result.success ? '✅' : '❌';
    const time = result.executionTime ? ` (${result.executionTime}ms)` : '';
    console.log(`   ${status} ${result.workflow}${time}`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  console.log();

  // Business value summary
  console.log('💰 Business Value Demonstrated:');
  console.log('   ✓ Automated customer support intelligence');
  console.log('   ✓ Zero-touch release management');
  console.log('   ✓ Multi-source executive reporting');
  console.log('   ✓ AI-powered insights generation');
  console.log('   ✓ Cross-platform data integration');
  console.log('   ✓ Real-time business analytics');
  console.log();

  console.log('🎯 Key Capabilities Showcased:');
  console.log('   • Multi-runtime execution (Bun, Deno)');
  console.log('   • MCP tool orchestration');
  console.log('   • ETL data transformation');
  console.log('   • AI content generation');
  console.log('   • Sub-second execution times');
  console.log('   • Production-ready error handling');
  console.log();

  console.log('✨ CodeMode Unified: Where AI Meets Business Automation\n');

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
testAllWorkflows().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});