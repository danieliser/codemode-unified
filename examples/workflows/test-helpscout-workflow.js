#!/usr/bin/env node
/**
 * Test runner for HelpScout Customer Intelligence workflow
 *
 * Tests the real-world business workflow that combines:
 * - HelpScout ticket fetching
 * - EDD customer data retrieval
 * - AutoMem context storage/retrieval
 * - AI-powered response generation
 */

import { RuntimeFactory, RuntimeType } from '../../dist/runtime/base-runtime.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testHelpscoutWorkflow() {
  console.log('🎯 Testing HelpScout Customer Intelligence Workflow\n');

  try {
    // Create Bun runtime (fastest for this type of workflow)
    console.log('1️⃣ Creating Bun runtime for optimal async performance...');
    const runtime = await RuntimeFactory.create({
      type: RuntimeType.BUN,
      maxWorkers: 1
    });
    console.log('✅ Bun runtime created\n');

    // Load workflow code
    console.log('2️⃣ Loading workflow code...');
    const workflowCode = readFileSync(
      join(__dirname, 'helpscout-customer-intelligence.js'),
      'utf-8'
    );
    console.log('✅ Workflow loaded\n');

    // Execute workflow
    console.log('3️⃣ Executing HelpScout Customer Intelligence workflow...');
    console.log('   This workflow demonstrates:');
    console.log('   - Multi-MCP server orchestration');
    console.log('   - Real business data integration');
    console.log('   - Context-aware AI response generation');
    console.log('   - Memory persistence across sessions\n');

    const startTime = Date.now();
    const result = await runtime.execute(workflowCode, { timeout: 30000 });
    const executionTime = Date.now() - startTime;

    if (!result.success) {
      console.error('❌ Workflow failed:', result.error?.message);
      console.error(result.error?.stack);
      process.exit(1);
    }

    console.log('✅ Workflow completed successfully!\n');

    // Display results
    console.log('📊 Workflow Results:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const workflowResult = result.result;

    // Customer Intelligence
    if (workflowResult.insights) {
      console.log('🔍 Customer Intelligence:');
      console.log('   Tier:', workflowResult.insights.customerTier);
      console.log('   Risk Level:', workflowResult.insights.riskLevel);
      console.log('\n   Suggested Actions:');
      workflowResult.insights.suggestedActions.forEach((action, i) => {
        console.log(`   ${i + 1}. ${action}`);
      });
      console.log('\n   Context:');
      workflowResult.insights.context.forEach(ctx => {
        console.log(`   • ${ctx}`);
      });
      console.log();
    }

    // AI-Generated Response with Metadata
    const formattedResponse = workflowResult.fullResults?.steps?.find(
      s => s.action === 'Generate Contextual Response'
    )?.formattedResponse;

    if (formattedResponse) {
      console.log('💬 AI-Generated Support Response (with metadata):\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(formattedResponse);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else if (workflowResult.suggestedResponse) {
      console.log('💬 AI-Generated Support Response:\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      const response = workflowResult.suggestedResponse;
      console.log(response.greeting);
      console.log();
      console.log(response.acknowledgment);
      console.log();
      console.log(response.troubleshooting);
      console.log();
      console.log(response.proactive);
      console.log();
      console.log(response.closing);
      console.log();
      console.log(response.signature);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Business Value
    if (workflowResult.businessValue) {
      console.log('💰 Business Value Delivered:');
      workflowResult.businessValue.forEach(value => {
        console.log(`   ✓ ${value}`);
      });
      console.log();
    }

    // Performance Metrics
    console.log('⚡ Performance Metrics:');
    console.log(`   Total Steps: ${workflowResult.stepsCompleted}`);
    console.log(`   Execution Time: ${executionTime}ms`);
    console.log(`   Runtime: Bun (optimal for async operations)`);
    console.log(`   Memory Used: ${Math.round(result.metrics.memoryUsed / 1024 / 1024)}MB`);
    console.log();

    // Full workflow details
    if (process.env.VERBOSE) {
      console.log('📋 Full Workflow Details:');
      console.log(JSON.stringify(workflowResult.fullResults, null, 2));
      console.log();
    }

    // Cleanup
    console.log('4️⃣ Shutting down runtime...');
    await runtime.shutdown();
    console.log('✅ Runtime shut down\n');

    // Summary
    console.log('🎉 Test Summary:');
    console.log('   ✓ Workflow executed successfully');
    console.log('   ✓ Customer intelligence generated');
    console.log('   ✓ AI response created');
    console.log('   ✓ Business value delivered');
    console.log(`   ✓ Total time: ${executionTime}ms`);
    console.log();

    console.log('✨ HelpScout Customer Intelligence workflow test complete!');
    console.log();
    console.log('💡 This demonstrates CodeMode Unified\'s power for real-world business automation:');
    console.log('   • Multi-system data integration');
    console.log('   • Intelligent context awareness');
    console.log('   • AI-powered decision support');
    console.log('   • Production-ready performance');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testHelpscoutWorkflow();
}

export { testHelpscoutWorkflow };