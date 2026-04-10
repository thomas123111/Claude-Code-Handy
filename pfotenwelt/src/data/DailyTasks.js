// Daily Tasks — 5 random tasks per in-game day, from a large pool
// Tasks refresh each new game day

const TASK_POOL = [
  // Washing
  { id: 'wash_1', text: 'Wasche 1 Tier', icon: '🧼', target: 1, stat: 'washed', reward: 5 },
  { id: 'wash_2', text: 'Wasche 2 Tiere', icon: '🧼', target: 2, stat: 'washed', reward: 10 },
  { id: 'wash_3', text: 'Wasche 3 Tiere', icon: '🧼', target: 3, stat: 'washed', reward: 18 },
  // Feeding
  { id: 'feed_1', text: 'Füttere 2 Tiere', icon: '🍖', target: 2, stat: 'fed', reward: 8 },
  { id: 'feed_2', text: 'Füttere 4 Tiere', icon: '🍖', target: 4, stat: 'fed', reward: 15 },
  { id: 'feed_3', text: 'Füttere alle Tiere', icon: '🍖', target: 99, stat: 'fed_all', reward: 20 },
  // Playing
  { id: 'play_1', text: 'Spiele 1 Puzzle', icon: '🎾', target: 1, stat: 'puzzles_played', reward: 5 },
  { id: 'play_2', text: 'Spiele 3 Puzzles', icon: '🎾', target: 3, stat: 'puzzles_played', reward: 12 },
  { id: 'play_3', text: 'Gewinne 2 Puzzles', icon: '🏆', target: 2, stat: 'puzzles_won', reward: 15 },
  // Merging
  { id: 'merge_1', text: 'Merge 5 Items', icon: '🧩', target: 5, stat: 'merged', reward: 6 },
  { id: 'merge_2', text: 'Merge 10 Items', icon: '🧩', target: 10, stat: 'merged', reward: 12 },
  { id: 'merge_3', text: 'Erstelle 1 Level-3 Item', icon: '✨', target: 1, stat: 'merged_lv3', reward: 10 },
  { id: 'merge_4', text: 'Erstelle 1 Level-4 Item', icon: '🌟', target: 1, stat: 'merged_lv4', reward: 18 },
  // Adoption
  { id: 'adopt_1', text: 'Vermittle 1 Tier', icon: '🏠', target: 1, stat: 'adopted_today', reward: 15 },
  // Happiness
  { id: 'happy_1', text: 'Mach 1 Tier 80% glücklich', icon: '😊', target: 1, stat: 'made_happy', reward: 8 },
  { id: 'happy_2', text: 'Mach 3 Tiere 80% glücklich', icon: '😊', target: 3, stat: 'made_happy', reward: 18 },
  // Visiting buildings
  { id: 'visit_werkstatt', text: 'Besuche die Werkstatt', icon: '🧩', target: 1, stat: 'visited_merge', reward: 3 },
  { id: 'visit_shelter', text: 'Besuche das Tierheim', icon: '🏠', target: 1, stat: 'visited_shelter', reward: 3 },
  { id: 'visit_vet', text: 'Besuche den Tierarzt', icon: '🏥', target: 1, stat: 'visited_vet', reward: 5 },
  { id: 'visit_salon', text: 'Besuche den Salon', icon: '✂️', target: 1, stat: 'visited_salon', reward: 5 },
  // Farm
  { id: 'farm_1', text: 'Erledige 1 Farm-Aufgabe', icon: '🌾', target: 1, stat: 'farm_tasks', reward: 8 },
  { id: 'farm_2', text: 'Erledige 3 Farm-Aufgaben', icon: '🌾', target: 3, stat: 'farm_tasks', reward: 20 },
  // Misc
  { id: 'login', text: 'Spiele heute', icon: '📅', target: 1, stat: 'logged_in', reward: 3 },
  { id: 'earn_hearts', text: 'Verdiene 20 Herzen', icon: '❤️', target: 20, stat: 'hearts_earned', reward: 8 },
  { id: 'earn_hearts_2', text: 'Verdiene 50 Herzen', icon: '❤️', target: 50, stat: 'hearts_earned', reward: 15 },
];

// Generate 5 daily tasks for a given game day (deterministic seed)
export function getDailyTasks(gameDay) {
  // Seed-based shuffle so same day = same tasks
  const seed = gameDay * 7919;
  const shuffled = [...TASK_POOL].sort((a, b) => {
    const ha = ((seed + a.id.charCodeAt(0) * 31) % 1000) / 1000;
    const hb = ((seed + b.id.charCodeAt(0) * 31) % 1000) / 1000;
    return ha - hb;
  });
  // Pick 5, avoiding duplicates of same stat
  const picked = [];
  const usedStats = new Set();
  for (const task of shuffled) {
    if (picked.length >= 5) break;
    if (usedStats.has(task.stat)) continue;
    picked.push({ ...task, progress: 0 });
    usedStats.add(task.stat);
  }
  return picked;
}

// Initialize or refresh daily tasks — resets once per REAL day (not game day)
export function refreshDailyTasks(save) {
  const today = new Date().toDateString();
  if (!save.dailyTasks || save.dailyTasks.realDate !== today) {
    // Use real date as seed for deterministic task selection
    const seed = new Date().getFullYear() * 10000 + (new Date().getMonth() + 1) * 100 + new Date().getDate();
    save.dailyTasks = {
      realDate: today,
      day: save.gameDay, // for display
      tasks: getDailyTasks(seed),
      stats: {},
    };
  }
  return save.dailyTasks;
}

// Increment a daily stat (call from game actions)
export function incrementDailyStat(save, statName, amount) {
  if (!save.dailyTasks) return;
  if (!save.dailyTasks.stats) save.dailyTasks.stats = {};
  save.dailyTasks.stats[statName] = (save.dailyTasks.stats[statName] || 0) + (amount || 1);
}

// Check and claim completed tasks
export function claimDailyRewards(save) {
  if (!save.dailyTasks) return 0;
  let totalReward = 0;
  save.dailyTasks.tasks.forEach((task) => {
    if (task.claimed) return;
    const current = save.dailyTasks.stats[task.stat] || 0;
    if (current >= task.target) {
      task.claimed = true;
      totalReward += task.reward;
    }
  });
  return totalReward;
}
