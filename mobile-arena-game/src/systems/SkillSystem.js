// Skill system - permanent abilities equipped before a run
// Each skill has levels (1-5), costs credits/scrap to upgrade

export const SKILLS = {
  multishot: {
    name: 'Multishot',
    desc: 'Fire extra projectiles',
    icon: '🔫',
    maxLevel: 5,
    effect: (level) => ({ extraBullets: level }), // +1 bullet per level
    costs: [10, 25, 50, 100, 200],
    scrapCosts: [3, 8, 15, 30, 60],
  },
  ricochet: {
    name: 'Ricochet',
    desc: 'Bullets bounce off walls',
    icon: '↩️',
    maxLevel: 3,
    effect: (level) => ({ bounces: level }),
    costs: [15, 40, 100],
    scrapCosts: [5, 12, 30],
  },
  speed: {
    name: 'Speed Boost',
    desc: 'Move faster',
    icon: '⚡',
    maxLevel: 5,
    effect: (level) => ({ speedMult: 1 + level * 0.12 }),
    costs: [8, 20, 40, 80, 160],
    scrapCosts: [2, 6, 12, 25, 50],
  },
  shield: {
    name: 'Shield',
    desc: 'Block hits periodically',
    icon: '🛡️',
    maxLevel: 3,
    effect: (level) => ({ shieldInterval: 20000 - level * 5000 }), // shield every 20/15/10s
    costs: [20, 50, 120],
    scrapCosts: [6, 15, 35],
  },
  lifesteal: {
    name: 'Lifesteal',
    desc: 'Heal on enemy kill',
    icon: '💚',
    maxLevel: 5,
    effect: (level) => ({ healOnKill: level * 3 }),
    costs: [12, 30, 60, 120, 250],
    scrapCosts: [4, 10, 20, 40, 80],
  },
  critChance: {
    name: 'Critical Hit',
    desc: 'Chance for double damage',
    icon: '💥',
    maxLevel: 5,
    effect: (level) => ({ critChance: level * 0.08 }), // 8% per level
    costs: [10, 25, 50, 100, 200],
    scrapCosts: [3, 8, 15, 30, 60],
  },
  magnetRange: {
    name: 'Loot Magnet',
    desc: 'Pick up loot from farther',
    icon: '🧲',
    maxLevel: 3,
    effect: (level) => ({ magnetRange: 40 + level * 30 }),
    costs: [8, 20, 50],
    scrapCosts: [2, 6, 15],
  },
  fireRate: {
    name: 'Rapid Fire',
    desc: 'Shoot faster',
    icon: '🔥',
    maxLevel: 5,
    effect: (level) => ({ fireRateMult: 1 - level * 0.1 }), // 10% faster per level
    costs: [10, 25, 50, 100, 200],
    scrapCosts: [3, 8, 15, 30, 60],
  },
};

// Max 4 skills can be equipped in a loadout
export const MAX_LOADOUT_SLOTS = 4;

// Get combined effects from a loadout
export function getLoadoutEffects(skillLevels) {
  const effects = {
    extraBullets: 0,
    bounces: 0,
    speedMult: 1,
    shieldInterval: 0,
    healOnKill: 0,
    critChance: 0,
    magnetRange: 40,
    fireRateMult: 1,
  };

  for (const [skillId, level] of Object.entries(skillLevels)) {
    if (level > 0 && SKILLS[skillId]) {
      const eff = SKILLS[skillId].effect(level);
      for (const [key, val] of Object.entries(eff)) {
        if (key === 'speedMult' || key === 'fireRateMult') {
          effects[key] *= val;
        } else if (key === 'shieldInterval') {
          effects[key] = val; // use latest
        } else {
          effects[key] += val;
        }
      }
    }
  }

  return effects;
}
