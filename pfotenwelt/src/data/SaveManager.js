const SAVE_KEY = 'pfotenwelt_save';

// === BUILDING UNLOCK ORDER (story-driven, sequential) ===
export const BUILDING_UNLOCK_ORDER = [
  { id: 'shelter',    name: 'Tierheim',        cost: 0,    minLevel: 1,  emoji: '🏠', storyId: 'ch1_arrival' },
  { id: 'merge',      name: 'Werkstatt',       cost: 0,    minLevel: 1,  emoji: '🧩', storyId: 'ch2_workshop' },
  { id: 'vet',        name: 'Tierarzt',        cost: 150,  minLevel: 3,  emoji: '🏥', storyId: 'ch3_vet' },
  { id: 'salon',      name: 'Tiersalon',       cost: 300,  minLevel: 5,  emoji: '✂️', storyId: 'ch4_salon' },
  { id: 'futterladen', name: 'Futterladen',    cost: 400,  minLevel: 7,  emoji: '🛒', storyId: 'ch5_futterladen' },
  { id: 'school',     name: 'Hundeschule',     cost: 600,  minLevel: 10, emoji: '🎓', storyId: 'ch6_school' },
  { id: 'hotel',      name: 'Tierpension',     cost: 900,  minLevel: 13, emoji: '🏨', storyId: 'ch7_hotel' },
  { id: 'spielplatz', name: 'Hundespielplatz', cost: 1200, minLevel: 16, emoji: '🌳', storyId: 'ch8_spielplatz' },
  { id: 'cafe',       name: 'Tier-Café',       cost: 1500, minLevel: 20, emoji: '☕', storyId: 'ch9_cafe' },
  { id: 'guild',      name: 'Gilde',           cost: 2000, minLevel: 25, emoji: '🤝', storyId: 'ch10_guild' },
  { id: 'farm',       name: 'Bauernhof',       cost: 3000, minLevel: 30, emoji: '🌾', storyId: 'ch11_farm' },
];

// === FARM BUILDING UNLOCK ORDER ===
export const FARM_UNLOCK_ORDER = [
  { id: 'barn',      name: 'Scheune',        cost: 0,    minFarmLevel: 1, task: 'harvest' },
  { id: 'stable',    name: 'Kuhstall',       cost: 500,  minFarmLevel: 2, task: 'milk' },
  { id: 'coop',      name: 'Hühnerstall',    cost: 800,  minFarmLevel: 3, task: 'eggs' },
  { id: 'henhouse',  name: 'Futterstation',  cost: 1000, minFarmLevel: 5, task: 'feed_animals' },
  { id: 'silo',      name: 'Silo & Lieferung', cost: 1500, minFarmLevel: 7, task: 'deliver' },
];

// === DAY/NIGHT CONSTANTS ===
export const DAY_DURATION_MS = 30 * 60 * 1000; // 30 min real time = 1 in-game day
export const EVENT_INTERVAL_DAYS = 2; // Event every 2 in-game days

const DEFAULT_SAVE = {
  // Player profile (set during onboarding)
  profile: null, // { name, gender, country, preference }
  onboardingDone: false,

  // Companion pet(s)
  companions: [], // [{ name, breedId, type: 'dog'|'cat' }]

  // Currencies
  hearts: 100,
  energy: 100,
  maxEnergy: 100,
  lastEnergyTime: Date.now(),

  // Progression
  level: 1,
  xp: 0,

  // Day/night cycle
  gameDay: 1,
  dayStartTime: Date.now(), // real timestamp when current day started
  totalPlayTimeMs: 0,       // accumulated playtime for day progression
  lastSessionTime: Date.now(),

  // Login
  loginStreak: 0,
  lastLoginDate: null,

  // Charity
  totalDonatedKg: 0,

  // Pets currently in shelter
  pets: [],
  // Collection book (discovered breeds)
  collection: [],
  // Adopted pets count
  adopted: 0,

  // Stations unlocked (sequential — only next in line can be unlocked)
  stations: {
    shelter: { level: 1, unlocked: true },
    merge: { level: 1, unlocked: true },
  },

  // Farm (unlocked via town building progression)
  farm: null, // initialized when farm is unlocked

  // Story tracking
  seenStories: [],
  lastEventTime: 0,
  lastEventDay: 0, // in-game day of last event

  // Guild
  guild: null,

  // Insurance
  insuredPets: [],

  // Merge board state
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

// Day/night cycle — call each frame or on scene enter
export function updateDayCycle(save) {
  const now = Date.now();
  const sessionDelta = now - (save.lastSessionTime || now);
  // Only count active play time (cap at 5 min gap to ignore AFK)
  const activeDelta = Math.min(sessionDelta, 5 * 60 * 1000);
  save.totalPlayTimeMs = (save.totalPlayTimeMs || 0) + activeDelta;
  save.lastSessionTime = now;
  // Calculate current game day
  const newDay = 1 + Math.floor(save.totalPlayTimeMs / DAY_DURATION_MS);
  if (newDay > save.gameDay) {
    save.gameDay = newDay;
  }
  return save;
}

// Returns 0.0-1.0 representing time of day (0=midnight, 0.25=6am, 0.5=noon, 0.75=6pm)
export function getDayProgress(save) {
  const elapsed = (save.totalPlayTimeMs || 0) % DAY_DURATION_MS;
  return elapsed / DAY_DURATION_MS;
}

// Returns named time period for game logic
export function getTimeOfDay(save) {
  const p = getDayProgress(save);
  if (p < 0.25) return 'morning';   // 0:00-6:00 → displayed as 06:00-12:00
  if (p < 0.5) return 'afternoon';  // 12:00-18:00
  if (p < 0.75) return 'evening';   // 18:00-22:00
  return 'night';                    // 22:00-06:00
}

// Check if an event should trigger (every 2 in-game days)
export function shouldTriggerEvent(save) {
  const daysSinceLastEvent = save.gameDay - (save.lastEventDay || 0);
  return daysSinceLastEvent >= EVENT_INTERVAL_DAYS;
}

// Check if a building is the next unlockable
export function getNextUnlockableBuilding(save) {
  for (const bld of BUILDING_UNLOCK_ORDER) {
    if (save.stations[bld.id] && save.stations[bld.id].unlocked) continue;
    return bld; // first non-unlocked building
  }
  return null;
}

// Check if a specific building can be unlocked now
export function canUnlockBuilding(save, buildingId) {
  const next = getNextUnlockableBuilding(save);
  if (!next || next.id !== buildingId) return false;
  return save.level >= next.minLevel && save.hearts >= next.cost;
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
