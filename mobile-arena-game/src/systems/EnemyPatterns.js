// Enemy behavior patterns and boss system
// Adds variety to enemy AI beyond simple chase behavior

// ─── BEHAVIOR TYPE CONSTANTS ───────────────────────────────────────────────

export const BEHAVIOR = {
  CHASE: 'chase',       // Run directly at player
  CIRCLE: 'circle',     // Orbit player at distance, shoot periodically
  DASH: 'dash',         // Pause, dash at player, pause again
  SNIPER: 'sniper',     // Stay far away, shoot accurate long-range shots
  BOMBER: 'bomber',     // Rush player, explode on death (area damage)
  SWARM: 'swarm',       // Very fast, very low HP, comes in groups
  TELEPORT: 'teleport', // Teleport to random position, shoot after appearing
};

// ─── BULLET PATTERN FUNCTIONS ──────────────────────────────────────────────

/**
 * Fan pattern - returns array of bullet angles spread evenly around a center angle.
 * @param {number} count - number of bullets in the fan
 * @param {number} spreadAngle - total spread in radians (e.g. Math.PI/3 for 60 degrees)
 * @param {number} centerAngle - center direction in radians (usually angle toward player)
 * @returns {number[]} array of angles in radians
 */
export function fanPattern(count, spreadAngle, centerAngle = 0) {
  if (count <= 1) return [centerAngle];
  const angles = [];
  const step = spreadAngle / (count - 1);
  const start = centerAngle - spreadAngle / 2;
  for (let i = 0; i < count; i++) {
    angles.push(start + step * i);
  }
  return angles;
}

/**
 * Spiral pattern - returns array of bullet angles that rotate over time.
 * @param {number} time - elapsed time in ms (used to rotate the spiral)
 * @param {number} armCount - number of spiral arms
 * @param {number} rotationSpeed - radians per millisecond (default: 0.002)
 * @returns {number[]} array of angles in radians
 */
export function spiralPattern(time, armCount = 3, rotationSpeed = 0.002) {
  const angles = [];
  const baseAngle = time * rotationSpeed;
  const armSpacing = (Math.PI * 2) / armCount;
  for (let i = 0; i < armCount; i++) {
    angles.push(baseAngle + armSpacing * i);
  }
  return angles;
}

/**
 * Aimed burst config - returns config object for a burst of aimed shots.
 * The caller should fire `count` shots with `delay` ms between each,
 * all aimed at the player's current position.
 * @param {number} count - number of shots in the burst
 * @param {number} delay - milliseconds between each shot
 * @returns {{ count: number, delay: number, type: string }}
 */
export function aimedBurst(count = 3, delay = 150) {
  return { count, delay, type: 'aimed' };
}

// ─── ENEMY TYPE DEFINITIONS ────────────────────────────────────────────────

const ENEMY_TYPES = [
  {
    behaviorType: BEHAVIOR.CHASE,
    textureKey: 'enemy_slime',
    hpMult: 1.0,
    speedMult: 1.0,
    damageMult: 1.0,
    shootInterval: 0,     // melee only
    bulletSpeed: 0,
    weight: 30,            // spawn weight (higher = more common)
    minArena: 0,
  },
  {
    behaviorType: BEHAVIOR.CIRCLE,
    textureKey: 'enemy_skeleton',
    hpMult: 0.8,
    speedMult: 0.9,
    damageMult: 0.7,
    shootInterval: 1800,
    bulletSpeed: 200,
    orbitRadius: 120,
    weight: 20,
    minArena: 2,
  },
  {
    behaviorType: BEHAVIOR.DASH,
    textureKey: 'enemy_orc',
    hpMult: 1.5,
    speedMult: 0.6,       // slow between dashes
    damageMult: 1.8,
    shootInterval: 0,
    bulletSpeed: 0,
    dashSpeed: 350,       // speed during dash
    dashDuration: 400,    // ms of the dash
    pauseDuration: 1200,  // ms pause between dashes
    weight: 15,
    minArena: 3,
  },
  {
    behaviorType: BEHAVIOR.SNIPER,
    textureKey: 'enemy_skeleton',
    hpMult: 0.6,
    speedMult: 0.4,
    damageMult: 1.5,
    shootInterval: 2500,
    bulletSpeed: 350,
    preferredDistance: 200,
    weight: 12,
    minArena: 4,
  },
  {
    behaviorType: BEHAVIOR.BOMBER,
    textureKey: 'enemy_demon',
    hpMult: 0.7,
    speedMult: 1.3,
    damageMult: 0.5,      // contact damage is low
    shootInterval: 0,
    bulletSpeed: 0,
    explosionRadius: 60,
    explosionDamage: 2.5,  // multiplier on base damage
    weight: 10,
    minArena: 5,
  },
  {
    behaviorType: BEHAVIOR.SWARM,
    textureKey: 'enemy_slime',
    hpMult: 0.25,
    speedMult: 1.6,
    damageMult: 0.4,
    shootInterval: 0,
    bulletSpeed: 0,
    groupSize: 5,         // spawns this many at once
    weight: 15,
    minArena: 2,
  },
  {
    behaviorType: BEHAVIOR.TELEPORT,
    textureKey: 'enemy_ghost',
    hpMult: 0.7,
    speedMult: 0.3,       // barely moves between teleports
    damageMult: 1.0,
    shootInterval: 1200,  // shoots shortly after teleporting
    bulletSpeed: 220,
    teleportInterval: 3000,
    teleportDelay: 500,   // ms of "appearing" before it can shoot
    weight: 10,
    minArena: 6,
  },
];

// ─── ENEMY TYPE ASSIGNMENT ─────────────────────────────────────────────────

/**
 * Returns an enemy type config for a given arena and random roll.
 * Higher arena indexes unlock more enemy types.
 * @param {number} arenaIndex - current arena (0-based)
 * @param {number} roll - random value 0-1 (e.g. Math.random())
 * @returns {{ behaviorType: string, textureKey: string, hpMult: number,
 *             speedMult: number, damageMult: number, shootInterval: number,
 *             bulletSpeed: number, [key: string]: any }}
 */
export function getEnemyType(arenaIndex, roll) {
  // Filter to types unlocked at this arena level
  const available = ENEMY_TYPES.filter((t) => arenaIndex >= t.minArena);
  if (available.length === 0) {
    return { ...ENEMY_TYPES[0] }; // fallback to chase slime
  }

  // Weighted random selection
  const totalWeight = available.reduce((sum, t) => sum + t.weight, 0);
  let target = roll * totalWeight;
  for (const type of available) {
    target -= type.weight;
    if (target <= 0) {
      // Return a copy without internal-only fields
      const { weight, minArena, ...config } = type;
      return { ...config };
    }
  }

  // Fallback (shouldn't reach here)
  const { weight, minArena, ...fallback } = available[available.length - 1];
  return { ...fallback };
}

// ─── BOSS DEFINITIONS ──────────────────────────────────────────────────────

const BOSSES = [
  {
    name: 'Golem King',
    textureKey: 'enemy_orc',
    hpMult: 12,
    size: 1.8,
    speedMult: 0.5,
    attackPatterns: [
      { behavior: BEHAVIOR.CHASE, duration: 4000 },
      { behavior: BEHAVIOR.DASH, duration: 3000, dashSpeed: 400, pauseDuration: 600 },
      { behavior: BEHAVIOR.CHASE, duration: 3000 },
    ],
    bulletPatterns: [
      { type: 'fan', count: 5, spreadAngle: Math.PI / 3, interval: 2000 },
    ],
  },
  {
    name: 'Lich Lord',
    textureKey: 'enemy_ghost',
    hpMult: 14,
    size: 1.6,
    speedMult: 0.4,
    attackPatterns: [
      { behavior: BEHAVIOR.TELEPORT, duration: 5000, teleportInterval: 2000 },
      { behavior: BEHAVIOR.CIRCLE, duration: 4000, orbitRadius: 130 },
      { behavior: BEHAVIOR.TELEPORT, duration: 4000, teleportInterval: 1500 },
    ],
    bulletPatterns: [
      { type: 'spiral', armCount: 4, interval: 1500 },
      { type: 'aimed', count: 3, delay: 200, interval: 3000 },
    ],
  },
  {
    name: 'Inferno Brute',
    textureKey: 'enemy_demon',
    hpMult: 16,
    size: 2.0,
    speedMult: 0.7,
    attackPatterns: [
      { behavior: BEHAVIOR.DASH, duration: 3000, dashSpeed: 450, pauseDuration: 500 },
      { behavior: BEHAVIOR.CHASE, duration: 5000 },
      { behavior: BEHAVIOR.DASH, duration: 4000, dashSpeed: 500, pauseDuration: 400 },
    ],
    bulletPatterns: [
      { type: 'fan', count: 8, spreadAngle: Math.PI * 0.8, interval: 2500 },
    ],
  },
  {
    name: 'Phantom Warden',
    textureKey: 'enemy_ghost',
    hpMult: 13,
    size: 1.5,
    speedMult: 0.6,
    attackPatterns: [
      { behavior: BEHAVIOR.TELEPORT, duration: 3000, teleportInterval: 1200 },
      { behavior: BEHAVIOR.SNIPER, duration: 4000, preferredDistance: 220 },
      { behavior: BEHAVIOR.CIRCLE, duration: 4000, orbitRadius: 150 },
    ],
    bulletPatterns: [
      { type: 'aimed', count: 5, delay: 120, interval: 2000 },
      { type: 'spiral', armCount: 3, interval: 1800 },
    ],
  },
  {
    name: 'Swarm Mother',
    textureKey: 'enemy_demon',
    hpMult: 18,
    size: 2.2,
    speedMult: 0.35,
    attackPatterns: [
      { behavior: BEHAVIOR.CIRCLE, duration: 6000, orbitRadius: 100 },
      { behavior: BEHAVIOR.CHASE, duration: 3000 },
      { behavior: BEHAVIOR.CIRCLE, duration: 5000, orbitRadius: 140 },
    ],
    bulletPatterns: [
      { type: 'spiral', armCount: 6, interval: 1200 },
      { type: 'fan', count: 12, spreadAngle: Math.PI * 2, interval: 3000 },
    ],
    spawnsMinions: { type: BEHAVIOR.SWARM, count: 3, interval: 5000 },
  },
  {
    name: 'Bone Colossus',
    textureKey: 'enemy_skeleton',
    hpMult: 20,
    size: 2.4,
    speedMult: 0.3,
    attackPatterns: [
      { behavior: BEHAVIOR.SNIPER, duration: 5000, preferredDistance: 200 },
      { behavior: BEHAVIOR.DASH, duration: 3000, dashSpeed: 500, pauseDuration: 300 },
      { behavior: BEHAVIOR.SNIPER, duration: 4000, preferredDistance: 180 },
      { behavior: BEHAVIOR.CHASE, duration: 3000 },
    ],
    bulletPatterns: [
      { type: 'fan', count: 7, spreadAngle: Math.PI / 2, interval: 1800 },
      { type: 'aimed', count: 4, delay: 100, interval: 2500 },
      { type: 'spiral', armCount: 5, interval: 2000 },
    ],
  },
];

/**
 * Returns boss configuration for a given arena index.
 * Bosses appear every 5th arena (index 4, 9, 14, 19, ...).
 * Returns null if the arena is not a boss arena.
 * @param {number} arenaIndex - current arena (0-based)
 * @returns {{ name: string, textureKey: string, hpMult: number, size: number,
 *             speedMult: number, attackPatterns: object[], bulletPatterns: object[],
 *             spawnsMinions?: object } | null}
 */
export function getBossConfig(arenaIndex) {
  // Boss arenas: every 5th arena (indices 4, 9, 14, ...)
  if ((arenaIndex + 1) % 5 !== 0) return null;

  const bossIndex = Math.floor(arenaIndex / 5);
  const boss = BOSSES[bossIndex % BOSSES.length];
  const cycle = Math.floor(bossIndex / BOSSES.length);

  // Scale bosses in subsequent cycles
  const cycleMult = 1 + cycle * 0.4;

  return {
    ...boss,
    hpMult: boss.hpMult * cycleMult,
    size: Math.min(boss.size + cycle * 0.2, 3.0), // cap visual size
    isBoss: true,
    bossIndex,
    cycle,
  };
}

/**
 * Check if a given arena is a boss arena.
 * @param {number} arenaIndex
 * @returns {boolean}
 */
export function isBossArena(arenaIndex) {
  return (arenaIndex + 1) % 5 === 0;
}
