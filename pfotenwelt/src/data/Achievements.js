// Achievements — permanent milestones with one-time rewards

export const ACHIEVEMENTS = [
  // Getting started
  { id: 'first_pet', name: 'Erste Pfote', desc: 'Erstes Tier aufgenommen', icon: '🐾', reward: 5,
    check: (s) => s.pets.length >= 1 },
  { id: 'first_wash', name: 'Saubermacher', desc: 'Erstes Tier gewaschen', icon: '🧼', reward: 5,
    check: (s) => (s.totalWashed || 0) >= 1 },
  { id: 'first_feed', name: 'Futterheld', desc: 'Erstes Tier gefüttert', icon: '🍖', reward: 5,
    check: (s) => (s.totalFed || 0) >= 1 },
  { id: 'first_adopt', name: 'Vermittler', desc: 'Erstes Tier vermittelt', icon: '🏠', reward: 10,
    check: (s) => (s.adopted || 0) >= 1 },

  // Progression
  { id: 'adopt_5', name: 'Tierfreund', desc: '5 Tiere vermittelt', icon: '🏠', reward: 25,
    check: (s) => (s.adopted || 0) >= 5 },
  { id: 'adopt_10', name: 'Held der Tiere', desc: '10 Tiere vermittelt', icon: '🦸', reward: 50,
    check: (s) => (s.adopted || 0) >= 10 },
  { id: 'adopt_25', name: 'Legende', desc: '25 Tiere vermittelt', icon: '⭐', reward: 100,
    check: (s) => (s.adopted || 0) >= 25 },
  { id: 'level_5', name: 'Aufsteiger', desc: 'Level 5 erreicht', icon: '📈', reward: 15,
    check: (s) => s.level >= 5 },
  { id: 'level_10', name: 'Profi', desc: 'Level 10 erreicht', icon: '🎯', reward: 30,
    check: (s) => s.level >= 10 },
  { id: 'level_20', name: 'Meister', desc: 'Level 20 erreicht', icon: '👑', reward: 60,
    check: (s) => s.level >= 20 },

  // Collection
  { id: 'collect_5', name: 'Sammler', desc: '5 Rassen entdeckt', icon: '📖', reward: 15,
    check: (s) => (s.collection || []).length >= 5 },
  { id: 'collect_10', name: 'Kenner', desc: '10 Rassen entdeckt', icon: '📖', reward: 30,
    check: (s) => (s.collection || []).length >= 10 },
  { id: 'collect_all', name: 'Komplett!', desc: 'Alle 19 Rassen entdeckt', icon: '🏅', reward: 100,
    check: (s) => (s.collection || []).length >= 19 },

  // Rarity
  { id: 'rare_pet', name: 'Seltener Fund', desc: 'Seltenes Tier gefunden', icon: '💎', reward: 10,
    check: (s) => s.pets.some(p => p.rarity === 'rare') || (s.adopted || 0) > 0 },
  { id: 'epic_pet', name: 'Epische Entdeckung', desc: 'Episches Tier gefunden', icon: '💜', reward: 25,
    check: (s) => s.pets.some(p => p.rarity === 'epic') },
  { id: 'legend_pet', name: 'Legendenjäger', desc: 'Legendäres Tier gefunden', icon: '👑', reward: 50,
    check: (s) => s.pets.some(p => p.rarity === 'legendary') },

  // Care
  { id: 'wash_10', name: 'Bademeister', desc: '10 Tiere gewaschen', icon: '🛁', reward: 15,
    check: (s) => (s.totalWashed || 0) >= 10 },
  { id: 'wash_50', name: 'Sauberkeitsfreak', desc: '50 Tiere gewaschen', icon: '✨', reward: 40,
    check: (s) => (s.totalWashed || 0) >= 50 },
  { id: 'feed_20', name: 'Chefkoch', desc: '20x gefüttert', icon: '🍖', reward: 15,
    check: (s) => (s.totalFed || 0) >= 20 },
  { id: 'puzzles_50', name: 'Rätselmeister', desc: '50 Puzzles gespielt', icon: '🧩', reward: 30,
    check: (s) => (s.totalPuzzles || 0) >= 50 },

  // Buildings
  { id: 'buildings_3', name: 'Bauherr', desc: '3 Gebäude freigeschaltet', icon: '🏗️', reward: 15,
    check: (s) => Object.values(s.stations || {}).filter(st => st.unlocked).length >= 3 },
  { id: 'buildings_5', name: 'Stadtplaner', desc: '5 Gebäude freigeschaltet', icon: '🏘️', reward: 30,
    check: (s) => Object.values(s.stations || {}).filter(st => st.unlocked).length >= 5 },
  { id: 'buildings_all', name: 'Bürgermeister', desc: 'Alle Gebäude freigeschaltet', icon: '🏛️', reward: 100,
    check: (s) => Object.values(s.stations || {}).filter(st => st.unlocked).length >= 10 },

  // Donation
  { id: 'donate_5', name: 'Spender', desc: '5kg Futter gespendet', icon: '🎁', reward: 15,
    check: (s) => (s.totalDonatedKg || 0) >= 5 },
  { id: 'donate_25', name: 'Großspender', desc: '25kg Futter gespendet', icon: '🎁', reward: 40,
    check: (s) => (s.totalDonatedKg || 0) >= 25 },

  // Daily tasks
  { id: 'daily_7', name: 'Fleißig', desc: '7 tägliche Aufgaben erledigt', icon: '📋', reward: 10,
    check: (s) => (s.totalDailyCompleted || 0) >= 7 },
  { id: 'daily_30', name: 'Pflichtbewusst', desc: '30 tägliche Aufgaben erledigt', icon: '📋', reward: 30,
    check: (s) => (s.totalDailyCompleted || 0) >= 30 },

  // Streak
  { id: 'streak_7', name: 'Treuer Spieler', desc: '7 Tage Login-Streak', icon: '🔥', reward: 20,
    check: (s) => (s.loginStreak || 0) >= 7 },
  { id: 'streak_30', name: 'Unaufhaltsam', desc: '30 Tage Login-Streak', icon: '🔥', reward: 75,
    check: (s) => (s.loginStreak || 0) >= 30 },
];

// Check for new unlocked achievements
export function checkAchievements(save) {
  if (!save.achievements) save.achievements = [];
  const newlyUnlocked = [];
  for (const ach of ACHIEVEMENTS) {
    if (save.achievements.includes(ach.id)) continue;
    if (ach.check(save)) {
      save.achievements.push(ach.id);
      newlyUnlocked.push(ach);
      save.hearts += ach.reward;
    }
  }
  return newlyUnlocked;
}

// Get all achievements with unlock status
export function getAllAchievements(save) {
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: (save.achievements || []).includes(a.id),
  }));
}
