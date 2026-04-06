const SAVE_KEY = 'mech_arena_save';

const DEFAULT_SAVE = {
  credits: 0,
  scrap: 0,
  highestArena: 0,
  totalRuns: 0,
  mechs: [
    {
      id: 'striker',
      name: 'Striker',
      unlocked: true,
      level: 1,
      xp: 0,
      baseHp: 100,
      baseSpeed: 200,
      baseDamage: 10,
      baseFireRate: 400,
      equipment: {
        weapon: null,
        armor: null,
        engine: null,
      },
    },
    {
      id: 'tank',
      name: 'Tank',
      unlocked: false,
      level: 1,
      xp: 0,
      baseHp: 200,
      baseSpeed: 130,
      baseDamage: 15,
      baseFireRate: 600,
      equipment: {
        weapon: null,
        armor: null,
        engine: null,
      },
    },
    {
      id: 'scout',
      name: 'Scout',
      unlocked: false,
      level: 1,
      xp: 0,
      baseHp: 70,
      baseSpeed: 280,
      baseDamage: 8,
      baseFireRate: 250,
      equipment: {
        weapon: null,
        armor: null,
        engine: null,
      },
    },
  ],
  inventory: [],
  selectedMechId: 'striker',
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const save = JSON.parse(raw);
      // Merge with defaults for forward compatibility
      return { ...DEFAULT_SAVE, ...save };
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
