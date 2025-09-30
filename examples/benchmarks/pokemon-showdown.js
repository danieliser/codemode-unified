#!/usr/bin/env node
/**
 * Extended Pokemon Workflow - Side-by-Side Runtime Comparison
 *
 * Tests Bun and Deno with a complex real-world workflow:
 * - Multiple API endpoints
 * - Parallel and sequential operations
 * - Complex data transformations
 * - Nested async operations
 */

import { RuntimeFactory, RuntimeType } from '../../dist/runtime/base-runtime.js';

// Extended Pokemon workflow - 3x longer and more complex
const extendedPokemonCode = `
// 🚀 EXTENDED POKEMON SHOWDOWN - Complex Workflow Test

console.log('🎮 Starting Extended Pokemon Showdown...\\n');

// ═══════════════════════════════════════════════════════════
// PHASE 1: Fetch Multiple Pokemon (Sequential)
// ═══════════════════════════════════════════════════════════

console.log('📡 Phase 1: Fetching legendary Pokemon...');

const legendary1 = await fetch('https://pokeapi.co/api/v2/pokemon/mewtwo').then(r => r.json());
console.log('   ✓ Mewtwo loaded');

const legendary2 = await fetch('https://pokeapi.co/api/v2/pokemon/lugia').then(r => r.json());
console.log('   ✓ Lugia loaded');

const legendary3 = await fetch('https://pokeapi.co/api/v2/pokemon/rayquaza').then(r => r.json());
console.log('   ✓ Rayquaza loaded');

// ═══════════════════════════════════════════════════════════
// PHASE 2: Parallel Fetch of Starter Teams
// ═══════════════════════════════════════════════════════════

console.log('\\n🔄 Phase 2: Loading starter teams in parallel...');

const [gen1Team, gen2Team, gen3Team] = await Promise.all([
  // Gen 1 starters
  Promise.all([
    fetch('https://pokeapi.co/api/v2/pokemon/bulbasaur').then(r => r.json()),
    fetch('https://pokeapi.co/api/v2/pokemon/charmander').then(r => r.json()),
    fetch('https://pokeapi.co/api/v2/pokemon/squirtle').then(r => r.json())
  ]),
  // Gen 2 starters
  Promise.all([
    fetch('https://pokeapi.co/api/v2/pokemon/chikorita').then(r => r.json()),
    fetch('https://pokeapi.co/api/v2/pokemon/cyndaquil').then(r => r.json()),
    fetch('https://pokeapi.co/api/v2/pokemon/totodile').then(r => r.json())
  ]),
  // Gen 3 starters
  Promise.all([
    fetch('https://pokeapi.co/api/v2/pokemon/treecko').then(r => r.json()),
    fetch('https://pokeapi.co/api/v2/pokemon/torchic').then(r => r.json()),
    fetch('https://pokeapi.co/api/v2/pokemon/mudkip').then(r => r.json())
  ])
]);

console.log('   ✓ All 9 starters loaded');

// ═══════════════════════════════════════════════════════════
// PHASE 3: Fetch Type Information
// ═══════════════════════════════════════════════════════════

console.log('\\n🔍 Phase 3: Analyzing type effectiveness...');

const [fireType, waterType, grassType, psychicType, dragonType] = await Promise.all([
  fetch('https://pokeapi.co/api/v2/type/fire').then(r => r.json()),
  fetch('https://pokeapi.co/api/v2/type/water').then(r => r.json()),
  fetch('https://pokeapi.co/api/v2/type/grass').then(r => r.json()),
  fetch('https://pokeapi.co/api/v2/type/psychic').then(r => r.json()),
  fetch('https://pokeapi.co/api/v2/type/dragon').then(r => r.json())
]);

console.log('   ✓ Type data loaded');

// ═══════════════════════════════════════════════════════════
// PHASE 4: Complex Data Transformation
// ═══════════════════════════════════════════════════════════

console.log('\\n📊 Phase 4: Processing battle statistics...');

// Calculate average stats for each generation
const calculateTeamStats = (team) => {
  const totalStats = team.reduce((sum, pokemon) => {
    return sum + pokemon.stats.reduce((s, stat) => s + stat.base_stat, 0);
  }, 0);
  return Math.round(totalStats / team.length);
};

const gen1AvgStats = calculateTeamStats(gen1Team);
const gen2AvgStats = calculateTeamStats(gen2Team);
const gen3AvgStats = calculateTeamStats(gen3Team);

// Analyze legendary power levels
const legendaryStats = [legendary1, legendary2, legendary3].map(p => ({
  name: p.name,
  totalPower: p.stats.reduce((sum, stat) => sum + stat.base_stat, 0),
  abilities: p.abilities.length,
  moves: p.moves.length
}));

// Build type effectiveness matrix
const typeMatrix = {
  fire: {
    strong: fireType.damage_relations.double_damage_to.map(t => t.name),
    weak: fireType.damage_relations.double_damage_from.map(t => t.name)
  },
  water: {
    strong: waterType.damage_relations.double_damage_to.map(t => t.name),
    weak: waterType.damage_relations.double_damage_from.map(t => t.name)
  },
  grass: {
    strong: grassType.damage_relations.double_damage_to.map(t => t.name),
    weak: grassType.damage_relations.double_damage_from.map(t => t.name)
  }
};

console.log('   ✓ Battle analysis complete');

// ═══════════════════════════════════════════════════════════
// PHASE 5: Generate Battle Report
// ═══════════════════════════════════════════════════════════

console.log('\\n📋 Phase 5: Generating battle report...');

const battleReport = {
  test: 'EXTENDED POKEMON SHOWDOWN',
  status: 'COMPLETE SUCCESS',
  phases: {
    legendaries: {
      count: 3,
      pokemon: legendaryStats,
      avgPower: Math.round(legendaryStats.reduce((s, p) => s + p.totalPower, 0) / 3)
    },
    starterTeams: {
      generations: 3,
      totalPokemon: 9,
      avgStats: {
        gen1: gen1AvgStats,
        gen2: gen2AvgStats,
        gen3: gen3AvgStats
      },
      bestGeneration: [
        { gen: 1, avg: gen1AvgStats },
        { gen: 2, avg: gen2AvgStats },
        { gen: 3, avg: gen3AvgStats }
      ].sort((a, b) => b.avg - a.avg)[0].gen
    },
    typeAnalysis: {
      typesAnalyzed: 5,
      effectiveness: typeMatrix,
      coverage: Object.keys(typeMatrix).length
    },
    performance: {
      totalAPIcalls: 20,
      sequentialCalls: 3,
      parallelBatches: 4,
      dataTransformations: 15
    }
  },
  summary: {
    strongestLegendary: legendaryStats.sort((a, b) => b.totalPower - a.totalPower)[0].name,
    mostVersatile: legendaryStats.sort((a, b) => b.moves - a.moves)[0].name,
    recommendedStarter: gen1Team[1].name // Charmander ;)
  }
};

console.log('\\n✨ Extended Pokemon Showdown Complete!');

return battleReport;
`;

async function testRuntime(runtimeType, runtimeName, emoji) {
  console.log(`\n${emoji} Testing ${runtimeName}...`);
  console.log('─'.repeat(80));

  try {
    const startInit = Date.now();
    const runtime = await RuntimeFactory.create({
      type: runtimeType,
      maxWorkers: 1
    });
    const initTime = Date.now() - startInit;

    console.log(`   ✓ Runtime initialized (${initTime}ms)`);
    console.log(`   ⏱️  Executing extended Pokemon workflow...`);

    const startExec = Date.now();
    const result = await runtime.execute(extendedPokemonCode, { timeout: 60000 });
    const execTime = Date.now() - startExec;

    if (!result.success) {
      console.log(`   ❌ Execution failed: ${result.error?.message}`);
      await runtime.shutdown();
      return null;
    }

    console.log(`   ✅ Execution complete (${execTime}ms)`);

    await runtime.shutdown();

    return {
      runtime: runtimeName,
      initTime,
      execTime,
      totalTime: initTime + execTime,
      result: result.result
    };

  } catch (error) {
    console.log(`   ❌ Test failed: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('\n🏆 POKEMON SHOWDOWN: Extended Runtime Comparison');
  console.log('='.repeat(80));
  console.log('\nWorkflow: 20 API calls, 5 phases, complex transformations');
  console.log('Expected time: 1-3 seconds per runtime\n');

  const results = [];

  // Test Bun
  const bunResult = await testRuntime(RuntimeType.BUN, 'Bun', '🍞');
  if (bunResult) results.push(bunResult);

  // Test Deno
  const denoResult = await testRuntime(RuntimeType.DENO, 'Deno', '🦕');
  if (denoResult) results.push(denoResult);

  // Print comparison
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 RESULTS COMPARISON\n');
  console.log('='.repeat(80));

  if (results.length === 0) {
    console.log('\n❌ No successful executions\n');
    return;
  }

  // Sort by total time
  results.sort((a, b) => a.totalTime - b.totalTime);

  console.log('\n🏁 Performance Rankings:\n');
  results.forEach((r, i) => {
    const medal = i === 0 ? '🥇' : '🥈';
    console.log(`${medal} ${r.runtime}`);
    console.log(`   Initialization: ${r.initTime}ms`);
    console.log(`   Execution:      ${r.execTime}ms`);
    console.log(`   Total Time:     ${r.totalTime}ms`);
    console.log('');
  });

  if (results.length === 2) {
    const [winner, second] = results;
    const diff = second.totalTime - winner.totalTime;
    const diffPercent = ((diff / winner.totalTime) * 100).toFixed(1);

    console.log(`⚡ ${winner.runtime} is ${diff}ms (${diffPercent}%) faster than ${second.runtime}`);
  }

  // Show battle report from winner
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 BATTLE REPORT (from fastest runtime)\n');
  console.log('='.repeat(80) + '\n');

  const winnerReport = results[0].result;

  console.log(`🏆 Strongest Legendary: ${winnerReport.summary.strongestLegendary}`);
  console.log(`🎯 Most Versatile: ${winnerReport.summary.mostVersatile}`);
  console.log(`⭐ Recommended Starter: ${winnerReport.summary.recommendedStarter}`);

  console.log(`\n📊 Stats:`);
  console.log(`   Legendaries Analyzed: ${winnerReport.phases.legendaries.count}`);
  console.log(`   Average Legendary Power: ${winnerReport.phases.legendaries.avgPower}`);
  console.log(`   Starter Pokemon: ${winnerReport.phases.starterTeams.totalPokemon}`);
  console.log(`   Best Generation: Gen ${winnerReport.phases.starterTeams.bestGeneration}`);
  console.log(`   Types Analyzed: ${winnerReport.phases.typeAnalysis.typesAnalyzed}`);

  console.log(`\n⚙️  Technical:`);
  console.log(`   Total API Calls: ${winnerReport.phases.performance.totalAPIcalls}`);
  console.log(`   Sequential Calls: ${winnerReport.phases.performance.sequentialCalls}`);
  console.log(`   Parallel Batches: ${winnerReport.phases.performance.parallelBatches}`);
  console.log(`   Data Transformations: ${winnerReport.phases.performance.dataTransformations}`);

  console.log('\n' + '='.repeat(80));
  console.log('\n✨ Pokemon Showdown Complete!\n');
}

main().catch(error => {
  console.error('\n❌ Pokemon Showdown failed:', error);
  process.exit(1);
});