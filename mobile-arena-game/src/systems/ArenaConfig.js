// Arena definitions - each run goes through a sequence of these
// Difficulty scales with arena index

export const ARENA_THEMES = [
  { name: 'Stone Dungeon', color: 0x6b6b6b, bgColor: '#1a1a22' },
  { name: 'Crypt', color: 0x5a4a3a, bgColor: '#1a1510' },
  { name: 'Ice Cave', color: 0x4488aa, bgColor: '#0a1520' },
  { name: 'Lava Pit', color: 0x8b3300, bgColor: '#1a0a05' },
  { name: 'Shadow Keep', color: 0x6633aa, bgColor: '#120a1a' },
  { name: 'Ancient Tomb', color: 0x8b7b5b, bgColor: '#151210' },
];

export function getArenaConfig(arenaIndex) {
  const theme = ARENA_THEMES[arenaIndex % ARENA_THEMES.length];
  const cycle = Math.floor(arenaIndex / ARENA_THEMES.length); // how many times we've looped
  const difficulty = 1 + arenaIndex * 0.3 + cycle * 0.5;

  return {
    index: arenaIndex,
    name: `${theme.name} ${cycle > 0 ? `(Tier ${cycle + 1})` : ''}`.trim(),
    theme,
    // Enemy config - significantly tougher
    enemyCount: Math.min(8 + Math.floor(arenaIndex * 2), 35),
    enemyHp: Math.floor(50 * difficulty),
    enemyDamage: Math.floor(12 * difficulty),
    enemySpeed: Math.floor(80 + arenaIndex * 8),
    spawnInterval: Math.max(600, 1800 - arenaIndex * 100),
    // Wave config
    totalWaves: Math.min(2 + Math.floor(arenaIndex * 0.5), 8),
    // Rewards - credits are scarce, like XBlaster
    creditsReward: Math.floor(3 + arenaIndex * 2),
    scrapReward: Math.floor(1 + arenaIndex),
    xpReward: Math.floor(15 + arenaIndex * 8),
    // Loot crates - collect all to open portal early
    crateCount: Math.min(3 + Math.floor(arenaIndex * 0.5), 8),
    // Timer portal - portal opens after this many seconds regardless
    portalTimerSeconds: Math.max(25, 60 - arenaIndex * 2),
    // Arena size
    width: 390,
    height: 700,
    // Time bonus: seconds under this = bonus credits (only for crate/kill clear)
    parTimeSeconds: Math.max(15, 45 - arenaIndex * 2),
  };
}

// Determine arena type: maze arenas appear at varied intervals
// Pattern per 7 arenas: 5 combat, 1 maze, 1 combat (then repeat)
// First maze at arena 3, then 7, 10, 14, 17, 21...
const ARENA_TYPE_PATTERN = ['combat', 'combat', 'combat', 'maze', 'combat', 'combat', 'combat'];

export function getArenaType(arenaIndex) {
  if (arenaIndex < 2) return 'combat'; // first 2 arenas always combat
  return ARENA_TYPE_PATTERN[(arenaIndex - 2) % ARENA_TYPE_PATTERN.length];
}

export function getArenaSceneName(arenaIndex) {
  return getArenaType(arenaIndex) === 'maze' ? 'MazeArena' : 'Arena';
}

export const EQUIPMENT_SHOP = [
  // Weapons - take several runs to afford
  { id: 'wpn1', slot: 'weapon', name: 'Plasma Core', bonus: 5, cost: 25, costScrap: 8 },
  { id: 'wpn2', slot: 'weapon', name: 'Rail Amplifier', bonus: 12, cost: 75, costScrap: 20 },
  { id: 'wpn3', slot: 'weapon', name: 'Nova Cannon', bonus: 25, cost: 200, costScrap: 50 },
  // Armor
  { id: 'arm1', slot: 'armor', name: 'Plating Mk1', bonus: 30, cost: 20, costScrap: 6 },
  { id: 'arm2', slot: 'armor', name: 'Plating Mk2', bonus: 70, cost: 60, costScrap: 18 },
  { id: 'arm3', slot: 'armor', name: 'Titan Shield', bonus: 150, cost: 180, costScrap: 45 },
  // Engines
  { id: 'eng1', slot: 'engine', name: 'Booster Mk1', bonus: 25, cost: 20, costScrap: 6 },
  { id: 'eng2', slot: 'engine', name: 'Booster Mk2', bonus: 55, cost: 60, costScrap: 18 },
  { id: 'eng3', slot: 'engine', name: 'Warp Drive', bonus: 100, cost: 180, costScrap: 45 },
];

export const MECH_UNLOCK_COSTS = {
  titan: { credits: 100, scrap: 30 },
  phantom: { credits: 80, scrap: 25 },
};

// Ammo types - basic is infinite, others are consumable
export const AMMO_TYPES = {
  basic: {
    name: 'Basic',
    color: 0xffff44,
    damageMult: 1.0,
    speed: 450,
    infinite: true,
    piercing: false,
    splash: false,
  },
  plasma: {
    name: 'Plasma',
    color: 0x44ddff,
    damageMult: 1.5,
    speed: 500,
    infinite: false,
    piercing: false,
    splash: false,
  },
  explosive: {
    name: 'Explosive',
    color: 0xff6622,
    damageMult: 2.0,
    speed: 350,
    infinite: false,
    piercing: false,
    splash: true,    // damages nearby enemies on hit
    splashRadius: 50,
  },
  piercing: {
    name: 'Piercing',
    color: 0xcc44ff,
    damageMult: 1.2,
    speed: 550,
    infinite: false,
    piercing: true,  // goes through enemies
    splash: false,
  },
};

// Ammo shop prices (buy in Hangar)
export const AMMO_SHOP = [
  { id: 'plasma', name: 'Plasma Rounds', amount: 20, cost: 10, costScrap: 3 },
  { id: 'plasma', name: 'Plasma Rounds x50', amount: 50, cost: 22, costScrap: 6 },
  { id: 'explosive', name: 'Explosive Shells', amount: 10, cost: 12, costScrap: 4 },
  { id: 'explosive', name: 'Explosive Shells x30', amount: 30, cost: 30, costScrap: 10 },
  { id: 'piercing', name: 'Piercing Bolts', amount: 15, cost: 8, costScrap: 2 },
  { id: 'piercing', name: 'Piercing Bolts x40', amount: 40, cost: 18, costScrap: 5 },
];
