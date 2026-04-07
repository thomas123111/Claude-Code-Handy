const SAVE_KEY = 'pfotenwelt_save';

const DEFAULT_SAVE = {
  hearts: 100,
  energy: 100,
  maxEnergy: 100,
  lastEnergyTime: Date.now(),
  level: 1,
  xp: 0,
  day: 1,
  loginStreak: 0,
  lastLoginDate: null,
  totalDonatedKg: 0,

  // Pets currently in shelter
  pets: [],
  // Collection book (discovered breeds)
  collection: [],
  // Adopted pets count
  adopted: 0,

  // Stations unlocked
  stations: {
    shelter: { level: 1, unlocked: true },
    vet: { level: 0, unlocked: false },
    salon: { level: 0, unlocked: false },
    school: { level: 0, unlocked: false },
    hotel: { level: 0, unlocked: false },
    cafe: { level: 0, unlocked: false },
  },

  // Story tracking
  seenStories: [],
  lastEventTime: 0,

  // Guild
  guild: null,

  // Insurance
  insuredPets: [], // pet IDs that have insurance

  // Merge board state (null = generate fresh)
  mergeBoard: null,

  // Settings
  soundOn: true,
  musicOn: true,
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const save = JSON.parse(raw);
      return { ...JSON.parse(JSON.stringify(DEFAULT_SAVE)), ...save };
    }
  } catch (e) {
    console.warn('Save load failed', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_SAVE));
}

export function writeSave(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Save write failed', e);
  }
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  return JSON.parse(JSON.stringify(DEFAULT_SAVE));
}

// Energy regeneration: 1 per minute
export function regenerateEnergy(save) {
  const now = Date.now();
  const elapsed = now - (save.lastEnergyTime || now);
  const regen = Math.floor(elapsed / 60000); // 1 per minute
  if (regen > 0) {
    save.energy = Math.min(save.maxEnergy, save.energy + regen);
    save.lastEnergyTime = now;
  }
  return save;
}

// XP and leveling
export function addXp(save, amount) {
  save.xp += amount;
  const needed = xpForLevel(save.level);
  while (save.xp >= needed) {
    save.xp -= needed;
    save.level++;
  }
  return save;
}

export function xpForLevel(level) {
  return Math.floor(80 * Math.pow(level, 1.4));
}

// Daily login
export function checkDailyLogin(save) {
  const today = new Date().toDateString();
  if (save.lastLoginDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (save.lastLoginDate === yesterday) {
      save.loginStreak++;
    } else {
      save.loginStreak = 1;
    }
    save.lastLoginDate = today;
    return { isNew: true, streak: save.loginStreak };
  }
  return { isNew: false, streak: save.loginStreak };
}

export const DAILY_REWARDS = [
  { hearts: 50, label: '50 Herzen' },
  { hearts: 100, label: '100 Herzen' },
  { hearts: 150, energy: 50, label: '150 Herzen + Energie' },
  { hearts: 200, label: '200 Herzen' },
  { hearts: 300, label: '300 Herzen' },
  { hearts: 500, label: '500 Herzen' },
  { hearts: 1000, energy: 100, label: '1000 Herzen + volle Energie!' },
];
