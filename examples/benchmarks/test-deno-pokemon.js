#!/usr/bin/env node
/**
 * Test Deno runtime with Pokemon workflow
 */

import { RuntimeFactory, RuntimeType } from './dist/runtime/base-runtime.js';

const pokemonCode = `
// 🚀 Pokemon Showcase - Deno Runtime Test

console.log('🎬 Starting Pokemon showcase...\\n');

// 1️⃣ Fetch real data from API
const pokemonResponse = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu');
const pokemon = await pokemonResponse.json();

console.log('📡 Fetched Pokemon:', pokemon.name);
console.log('   Height:', pokemon.height, '| Weight:', pokemon.weight);
console.log('   Abilities:', pokemon.abilities.map(a => a.ability.name).join(', '));

// 2️⃣ Parallel API calls (showcase async power)
console.log('\\n🔄 Fetching Gen 1 starters in parallel...');

const [bulbasaur, charmander, squirtle] = await Promise.all([
  fetch('https://pokeapi.co/api/v2/pokemon/bulbasaur').then(r => r.json()),
  fetch('https://pokeapi.co/api/v2/pokemon/charmander').then(r => r.json()),
  fetch('https://pokeapi.co/api/v2/pokemon/squirtle').then(r => r.json())
]);

console.log('🔥 Parallel fetch complete:', [
  bulbasaur.name,
  charmander.name,
  squirtle.name
].join(', '));

// 3️⃣ Return comprehensive results
return {
  test: 'DENO RUNTIME POKEMON SHOWCASE',
  status: 'COMPLETE SUCCESS',
  capabilities: [
    '✅ Fetch API calls',
    '✅ Async/await support',
    '✅ Parallel Promise.all',
    '✅ Complex data processing',
    '✅ Structured object returns'
  ],
  data: {
    primary_pokemon: {
      name: pokemon.name,
      height: pokemon.height,
      weight: pokemon.weight,
      abilities: pokemon.abilities.map(a => a.ability.name)
    },
    starters: {
      bulbasaur: {
        type: bulbasaur.types[0].type.name,
        moves: bulbasaur.moves.length
      },
      charmander: {
        type: charmander.types[0].type.name,
        moves: charmander.moves.length
      },
      squirtle: {
        type: squirtle.types[0].type.name,
        moves: squirtle.moves.length
      }
    }
  },
  performance: {
    api_calls: 4,
    total_operations: 4
  }
};
`;

async function testPokemonWorkflow() {
  console.log('🧪 Testing Deno Runtime with Pokemon Workflow\n');

  try {
    // Create Deno runtime
    console.log('1️⃣ Creating Deno runtime...');
    const startInit = Date.now();
    const runtime = await RuntimeFactory.create({
      type: RuntimeType.DENO,
      maxWorkers: 1
    });
    const initTime = Date.now() - startInit;
    console.log(`✅ Deno runtime created (${initTime}ms)\n`);

    // Execute Pokemon workflow
    console.log('2️⃣ Executing Pokemon workflow...');
    const startExec = Date.now();
    const result = await runtime.execute(pokemonCode, { timeout: 30000 });
    const execTime = Date.now() - startExec;

    if (!result.success) {
      console.error('❌ Execution failed:', result.error);
      process.exit(1);
    }

    console.log(`\n✅ Execution completed in ${execTime}ms\n`);

    // Display results
    console.log('📊 Results:');
    console.log(JSON.stringify(result.result, null, 2));

    console.log('\n📈 Performance Metrics:');
    console.log('- Initialization:', initTime + 'ms');
    console.log('- Execution Time:', execTime + 'ms');
    console.log('- API Calls:', result.result.performance.api_calls);
    console.log('- Capabilities:', result.result.capabilities.length);

    // Cleanup
    await runtime.shutdown();

    console.log('\n✨ Pokemon workflow test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testPokemonWorkflow();