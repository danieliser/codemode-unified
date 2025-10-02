#!/usr/bin/env node
/**
 * Pokemon Analysis - First 151 Pokemon
 *
 * Fetches all Gen 1 Pokemon and finds the best one for each type
 * based on total base stats.
 */

(async () => {
// Fetch Pokemon data in parallel batches
console.log('🎮 Fetching first 151 Pokemon from PokeAPI...\n');

const batchSize = 50;
const totalPokemon = 151;
const batches = Math.ceil(totalPokemon / batchSize);

const allPokemon = [];

for (let batch = 0; batch < batches; batch++) {
  const start = batch * batchSize + 1;
  const end = Math.min((batch + 1) * batchSize, totalPokemon);

  console.log(`📦 Fetching batch ${batch + 1}/${batches}: Pokemon #${start}-${end}`);

  const promises = [];
  for (let i = start; i <= end; i++) {
    promises.push(
      fetch(`https://pokeapi.co/api/v2/pokemon/${i}`)
        .then(r => r.json())
        .catch(err => ({ error: true, id: i }))
    );
  }

  const batchResults = await Promise.all(promises);
  allPokemon.push(...batchResults.filter(p => !p.error));

  // Be nice to the API
  if (batch < batches - 1) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

console.log(`\n✅ Fetched ${allPokemon.length} Pokemon successfully!\n`);

// Process Pokemon data
const pokemonData = allPokemon.map(p => ({
  id: p.id,
  name: p.name,
  types: p.types.map(t => t.type.name),
  stats: {
    hp: p.stats.find(s => s.stat.name === 'hp').base_stat,
    attack: p.stats.find(s => s.stat.name === 'attack').base_stat,
    defense: p.stats.find(s => s.stat.name === 'defense').base_stat,
    specialAttack: p.stats.find(s => s.stat.name === 'special-attack').base_stat,
    specialDefense: p.stats.find(s => s.stat.name === 'special-defense').base_stat,
    speed: p.stats.find(s => s.stat.name === 'speed').base_stat
  }
}));

// Calculate total stats
pokemonData.forEach(p => {
  p.totalStats = Object.values(p.stats).reduce((sum, stat) => sum + stat, 0);
});

// Find best Pokemon for each type
const typeChampions = {};

pokemonData.forEach(p => {
  p.types.forEach(type => {
    if (!typeChampions[type] || p.totalStats > typeChampions[type].totalStats) {
      typeChampions[type] = p;
    }
  });
});

// Display results
console.log('🏆 BEST POKEMON BY TYPE (Based on Total Base Stats)\n');
console.log('═'.repeat(70));

const typeOrder = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

typeOrder.forEach(type => {
  if (typeChampions[type]) {
    const champ = typeChampions[type];
    const typeIcon = {
      fire: '🔥', water: '💧', grass: '🌿', electric: '⚡', ice: '❄️',
      fighting: '🥊', poison: '☠️', ground: '🏔️', flying: '🦅', psychic: '🔮',
      bug: '🐛', rock: '🪨', ghost: '👻', dragon: '🐉', normal: '⭐',
      dark: '🌙', steel: '⚙️', fairy: '✨'
    }[type] || '⚪';

    console.log(`${typeIcon} ${type.toUpperCase().padEnd(12)} → #${String(champ.id).padStart(3, '0')} ${champ.name.toUpperCase().padEnd(15)} (${champ.totalStats} total)`);
  }
});

console.log('═'.repeat(70));

// Find overall strongest
const strongest = pokemonData.reduce((max, p) =>
  p.totalStats > max.totalStats ? p : max
);

console.log(`\n👑 STRONGEST OVERALL: #${String(strongest.id).padStart(3, '0')} ${strongest.name.toUpperCase()}`);
console.log(`   Types: ${strongest.types.join(', ')}`);
console.log(`   Total Stats: ${strongest.totalStats}`);
console.log(`   HP: ${strongest.stats.hp} | ATK: ${strongest.stats.attack} | DEF: ${strongest.stats.defense}`);
console.log(`   SP.ATK: ${strongest.stats.specialAttack} | SP.DEF: ${strongest.stats.specialDefense} | SPD: ${strongest.stats.speed}`);

// Find weakest (for fun)
const weakest = pokemonData.reduce((min, p) =>
  p.totalStats < min.totalStats ? p : min
);

console.log(`\n🐛 WEAKEST OVERALL: #${String(weakest.id).padStart(3, '0')} ${weakest.name.toUpperCase()}`);
console.log(`   Types: ${weakest.types.join(', ')}`);
console.log(`   Total Stats: ${weakest.totalStats}`);

// Type distribution
console.log('\n📊 TYPE DISTRIBUTION:');
const typeCounts = {};
pokemonData.forEach(p => {
  p.types.forEach(type => {
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
});

const sortedTypes = Object.entries(typeCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

sortedTypes.forEach(([type, count]) => {
  const bar = '█'.repeat(Math.ceil(count / 2));
  console.log(`   ${type.padEnd(12)}: ${bar} ${count}`);
});

// Return structured results
const results = {
  totalFetched: allPokemon.length,
  typeChampions: Object.fromEntries(
    Object.entries(typeChampions).map(([type, p]) => [
      type,
      { id: p.id, name: p.name, totalStats: p.totalStats }
    ])
  ),
  strongest: {
    id: strongest.id,
    name: strongest.name,
    types: strongest.types,
    totalStats: strongest.totalStats
  },
  weakest: {
    id: weakest.id,
    name: weakest.name,
    types: weakest.types,
    totalStats: weakest.totalStats
  },
  typeDistribution: typeCounts
};

console.log('\n✨ Analysis complete!');
return results;
})();
