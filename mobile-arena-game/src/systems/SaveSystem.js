const SAVE_KEY = 'mech_arena_save';

const DEFAULT_SAVE = {
  credits: 0,
  scrap: 0,
  highestArena: 0,
  totalRuns: 0,
  mechs: [
    {
      id: 'striker',
      name: 'Knight',
      title: 'Warrior',
      description: 'Balanced fighter. Rapid sword strikes.',
      unlocked: true,
      level: 1,
      xp: 0,
      // Stats
      baseHp: 100,
      baseSpeed: 200,
      baseDamage: 8,
      baseFireRate: 300,    // fast fire
      // Unique weapon behavior
      weaponType: 'pulse',  // rapid single shots
      bulletCount: 1,       // bullets per shot
      bulletSpread: 0,      // spread angle in radians
      bulletSize: 1.0,
      bulletColor: 0x3399ff,
      // Special ability: Dash - short burst of speed + invulnerability
      specialType: 'dash',
      specialCharge: 0,       // current charge (0-100)
      specialChargeRate: 8,   // charge gained per enemy killed
      specialDuration: 400,   // ms
      specialCooldown: 0,
      equipment: { weapon: null, armor: null, engine: null },
    },
    {
      id: 'titan',
      name: 'Guardian',
      title: 'Tank',
      description: 'Slow but devastating. Axe sweep + shield.',
      unlocked: false,
      level: 1,
      xp: 0,
      baseHp: 220,
      baseSpeed: 120,
      baseDamage: 5,          // per pellet
      baseFireRate: 700,      // slow fire
      weaponType: 'shotgun',  // multiple pellets in spread
      bulletCount: 5,         // 5 pellets per shot
      bulletSpread: 0.6,      // wide spread
      bulletSize: 0.8,
      bulletColor: 0x44aa44,
      // Special ability: Shield - absorbs damage for a duration
      specialType: 'shield',
      specialCharge: 0,
      specialChargeRate: 12,
      specialDuration: 2000,
      specialCooldown: 0,
      equipment: { weapon: null, armor: null, engine: null },
    },
    {
      id: 'phantom',
      name: 'Mage',
      title: 'Sorcerer',
      description: 'Fragile but powerful. Piercing magic bolts + cloak.',
      unlocked: false,
      level: 1,
      xp: 0,
      baseHp: 65,
      baseSpeed: 240,
      baseDamage: 18,         // high per-shot
      baseFireRate: 800,      // very slow fire
      weaponType: 'laser',    // long-range piercing beam
      bulletCount: 1,
      bulletSpread: 0,
      bulletSize: 0.6,
      bulletColor: 0xff4488,
      // Special ability: Cloak - become invisible to enemies
      specialType: 'cloak',
      specialCharge: 0,
      specialChargeRate: 10,
      specialDuration: 3000,
      specialCooldown: 0,
      equipment: { weapon: null, armor: null, engine: null },
    },
  ],
  inventory: [],
  selectedMechId: 'striker',
  // Skill levels (permanent upgrades)
  skillLevels: {
    multishot: 0,
    ricochet: 0,
    speed: 0,
    shield: 0,
    lifesteal: 0,
    critChance: 0,
    magnetRange: 0,
    fireRate: 0,
  },
  // Equipped loadout (max 4 skill ids)
  loadout: [],
  // Ammo stock (basic is infinite, others are counted)
  ammo: {
    plasma: 0,    // +50% damage
    explosive: 0, // +100% damage, splash
    piercing: 0,  // goes through enemies
  },
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const save = JSON.parse(raw);
      const defaults = JSON.parse(JSON.stringify(DEFAULT_SAVE));

      // Deep merge: keep saved progress but add any new fields from defaults
      const merged = { ...defaults, ...save };

      // Deep merge mechs: for each default mech, merge with saved mech data
      merged.mechs = defaults.mechs.map((defaultMech) => {
        const savedMech = (save.mechs || []).find((m) => m.id === defaultMech.id);
        if (savedMech) {
          // Keep saved progress (level, xp, equipment, unlocked) but add new fields
          return { ...defaultMech, ...savedMech };
        }
        // Check if old mech ids exist (tank→titan, scout→phantom migration)
        if (defaultMech.id === 'titan') {
          const old = (save.mechs || []).find((m) => m.id === 'tank');
          if (old) return { ...defaultMech, level: old.level, xp: old.xp, unlocked: old.unlocked, equipment: old.equipment };
        }
        if (defaultMech.id === 'phantom') {
          const old = (save.mechs || []).find((m) => m.id === 'scout');
          if (old) return { ...defaultMech, level: old.level, xp: old.xp, unlocked: old.unlocked, equipment: old.equipment };
        }
        return defaultMech;
      });

      // Ensure ammo and skills have all keys
      merged.ammo = { ...defaults.ammo, ...(save.ammo || {}) };
      merged.skillLevels = { ...defaults.skillLevels, ...(save.skillLevels || {}) };
      if (!merged.loadout) merged.loadout = [];

      // Migrate old selectedMechId
      if (merged.selectedMechId === 'tank') merged.selectedMechId = 'titan';
      if (merged.selectedMechId === 'scout') merged.selectedMechId = 'phantom';

      return merged;
    }
  } catch (e) {
    console.warn('Failed to load save, using defaults', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_SAVE));
}

export function writeSave(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to write save', e);
  }
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  return JSON.parse(JSON.stringify(DEFAULT_SAVE));
}

export function getSelectedMech(save) {
  return save.mechs.find((m) => m.id === save.selectedMechId) || save.mechs[0];
}

export function xpForLevel(level) {
  return Math.floor(50 * Math.pow(level, 1.5));
}

export function addXpToMech(mech, xp) {
  mech.xp += xp;
  while (mech.xp >= xpForLevel(mech.level)) {
    mech.xp -= xpForLevel(mech.level);
    mech.level++;
  }
}

export function getMechStats(mech) {
  const lvlBonus = (mech.level - 1) * 0.08;
  let hp = Math.floor(mech.baseHp * (1 + lvlBonus));
  let speed = Math.floor(mech.baseSpeed * (1 + lvlBonus * 0.5));
  let damage = Math.floor(mech.baseDamage * (1 + lvlBonus));
  let fireRate = Math.max(100, Math.floor(mech.baseFireRate * (1 - lvlBonus * 0.3)));

  // Equipment bonuses
  if (mech.equipment.weapon) {
    damage += mech.equipment.weapon.bonus;
  }
  if (mech.equipment.armor) {
    hp += mech.equipment.armor.bonus;
  }
  if (mech.equipment.engine) {
    speed += mech.equipment.engine.bonus;
  }

  return { hp, speed, damage, fireRate };
}
