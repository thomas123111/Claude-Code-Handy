// Arena definitions - each run goes through a sequence of these
// Difficulty scales with arena index

export const ARENA_THEMES = [
  { name: 'Scrapyard', color: 0x4a6741, enemyTint: 0xff6644, bgColor: '#1a2a1a' },
  { name: 'Foundry', color: 0x8b4513, enemyTint: 0xff4444, bgColor: '#2a1a0a' },
  { name: 'Ice Cavern', color: 0x4488aa, enemyTint: 0x88ccff, bgColor: '#0a1a2a' },
  { name: 'Volcano', color: 0xaa3300, enemyTint: 0xffaa00, bgColor: '#2a0a0a' },
  { name: 'Neon City', color: 0x8833aa, enemyTint: 0xff33ff, bgColor: '#1a0a2a' },
  { name: 'Void Station', color: 0x222244, enemyTint: 0x6666ff, bgColor: '#0a0a1a' },
];

export function getArenaConfig(arenaIndex) {
  const theme = ARENA_THEMES[arenaIndex % ARENA_THEMES.length];
  const cycle = Math.floor(arenaIndex / ARENA_THEMES.length); // how many times we've looped
  const difficulty = 1 + arenaIndex * 0.3 + cycle * 0.5;

  return {
    index: arenaIndex,
    name: `${theme.name} ${cycle > 0 ? `(Tier ${cycle + 1})` : ''}`.trim(),
    theme,
    // Enemy config
    enemyCount: Math.min(6 + Math.floor(arenaIndex * 1.5), 30),
    enemyHp: Math.floor(20 * difficulty),
    enemyDamage: Math.floor(5 * difficulty),
    enemySpeed: Math.floor(60 + arenaIndex * 5),
    spawnInterval: Math.max(800, 2000 - arenaIndex * 80),
    // Wave config
    totalWaves: Math.min(2 + Math.floor(arenaIndex * 0.5), 8),
    // Rewards
    creditsReward: Math.floor(20 + arenaIndex * 15),
    scrapReward: Math.floor(5 + arenaIndex * 5),
    xpReward: Math.floor(30 + arenaIndex * 20),
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

export const EQUIPMENT_SHOP = [
  // Weapons
  { id: 'wpn1', slot: 'weapon', name: 'Plasma Core', bonus: 5, cost: 50, costScrap: 10 },
  { id: 'wpn2', slot: 'weapon', name: 'Rail Amplifier', bonus: 12, cost: 150, costScrap: 30 },
  { id: 'wpn3', slot: 'weapon', name: 'Nova Cannon', bonus: 25, cost: 400, costScrap: 80 },
  // Armor
  { id: 'arm1', slot: 'armor', name: 'Plating Mk1', bonus: 30, cost: 40, costScrap: 8 },
  { id: 'arm2', slot: 'armor', name: 'Plating Mk2', bonus: 70, cost: 120, costScrap: 25 },
  { id: 'arm3', slot: 'armor', name: 'Titan Shield', bonus: 150, cost: 350, costScrap: 70 },
  // Engines
  { id: 'eng1', slot: 'engine', name: 'Booster Mk1', bonus: 25, cost: 40, costScrap: 8 },
  { id: 'eng2', slot: 'engine', name: 'Booster Mk2', bonus: 55, cost: 120, costScrap: 25 },
  { id: 'eng3', slot: 'engine', name: 'Warp Drive', bonus: 100, cost: 350, costScrap: 70 },
];

export const MECH_UNLOCK_COSTS = {
  tank: { credits: 200, scrap: 50 },
  scout: { credits: 150, scrap: 40 },
};
