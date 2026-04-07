// Dynamic event system for Pfotenwelt
// Events create urgent situations that require player action

import { generatePet } from './PetData.js';

// Event types with full story, choices, and consequences
export const EVENT_TYPES = [
  // === EMERGENCY EVENTS ===
  {
    id: 'shelter_closed',
    category: 'emergency',
    title: '🚨 Tierheim geschlossen!',
    emoji: '🏚️',
    story: 'Ein Tierheim in der Nachbarstadt wurde geschlossen! Die Tiere dort brauchen dringend Unterkünfte. Kannst du einige aufnehmen?',
    duration: 300, // 5 minutes to respond
    choices: [
      { label: '3 Tiere aufnehmen', cost: 0, reward: { pets: 3, xp: 50, hearts: 30 }, puzzle: null },
      { label: '5 Tiere aufnehmen (Held!)', cost: 50, reward: { pets: 5, xp: 100, hearts: 80, donationKg: 1 }, puzzle: null },
      { label: 'Leider kein Platz...', cost: 0, reward: { hearts: -10 }, puzzle: null },
    ],
    feedbackGood: 'Du hast den Tieren ein neues Zuhause gegeben! Die Community feiert dich! 🎉',
    feedbackBad: 'Schade... die Tiere mussten woanders untergebracht werden.',
  },
  {
    id: 'truck_breakdown',
    category: 'emergency',
    title: '🚛 LKW-Panne!',
    emoji: '🔧',
    story: 'Die große Futterspende ist unterwegs, aber der LKW hat eine Panne! Löse das Rätsel um die Lieferung zu retten!',
    duration: 180,
    choices: [
      { label: 'Rätsel lösen! 🧩', cost: 0, reward: { hearts: 100, donationKg: 5, xp: 40 }, puzzle: 'Match3Puzzle' },
      { label: 'Ersatz-LKW mieten (30❤️)', cost: 30, reward: { hearts: 60, donationKg: 3, xp: 20 }, puzzle: null },
      { label: 'Abwarten...', cost: 0, reward: { hearts: 10, donationKg: 0.5 }, puzzle: null },
    ],
    feedbackGood: 'Die Futterspende ist angekommen! Die Tiere freuen sich riesig! 🎁',
    feedbackBad: 'Nur ein kleiner Teil der Spende kam an...',
  },
  {
    id: 'open_day',
    category: 'community',
    title: '🎪 Tag der offenen Tür!',
    emoji: '🎉',
    story: 'Veranstalte einen Tag der offenen Tür um Spenden zu sammeln und Tiere zu vermitteln! Bereite alles vor!',
    duration: 600,
    choices: [
      { label: 'Großes Fest (Rätsel lösen)', cost: 20, reward: { hearts: 200, donationKg: 3, xp: 80, visitors: 5 }, puzzle: 'SortPuzzle' },
      { label: 'Kleines Event', cost: 0, reward: { hearts: 50, donationKg: 1, xp: 20, visitors: 2 }, puzzle: null },
    ],
    feedbackGood: 'Was für ein toller Tag! Viele Besucher waren begeistert und haben gespendet! 🥳',
    feedbackBad: 'Ein paar Besucher kamen vorbei. Nächstes Mal wird es größer!',
  },
  {
    id: 'sick_wave',
    category: 'emergency',
    title: '🤒 Krankheitswelle!',
    emoji: '🏥',
    story: 'Mehrere Tiere sind gleichzeitig krank geworden! Der Tierarzt braucht dringend Hilfe!',
    duration: 240,
    choices: [
      { label: 'Alle behandeln (Rätsel)', cost: 30, reward: { healAll: true, xp: 60, hearts: 40 }, puzzle: 'MemoryPuzzle' },
      { label: 'Nur die schlimmsten (15❤️)', cost: 15, reward: { healHalf: true, xp: 20, hearts: 10 }, puzzle: null },
    ],
    feedbackGood: 'Alle Tiere sind wieder gesund! Du bist die beste Tierheim-Leitung! 💚',
    feedbackBad: 'Einige Tiere erholen sich langsam...',
  },
  {
    id: 'celebrity_visit',
    category: 'special',
    title: '⭐ Prominenter Besuch!',
    emoji: '📸',
    story: 'Ein bekannter Tier-Influencer möchte dein Tierheim besuchen und darüber posten! Mach alles schick!',
    duration: 300,
    choices: [
      { label: 'Alles vorbereiten (Rätsel)', cost: 10, reward: { hearts: 150, xp: 70, fame: 50, donationKg: 2 }, puzzle: 'SwipePuzzle' },
      { label: 'Einfach zeigen wie es ist', cost: 0, reward: { hearts: 40, xp: 15, fame: 10 }, puzzle: null },
    ],
    feedbackGood: 'Der Beitrag ging viral! Tausende neue Follower und Spenden! 🌟',
    feedbackBad: 'Ein netter Besuch, aber ohne großen Effekt.',
  },
  {
    id: 'winter_storm',
    category: 'emergency',
    title: '❄️ Wintersturm!',
    emoji: '🌨️',
    story: 'Ein schwerer Wintersturm kommt! Die Tiere brauchen warme Decken und extra Futter!',
    duration: 180,
    choices: [
      { label: 'Vorräte sichern (Rätsel)', cost: 15, reward: { hearts: 80, xp: 40, warmth: true }, puzzle: 'TimingPuzzle' },
      { label: 'Notration verteilen', cost: 0, reward: { hearts: 20, xp: 10 }, puzzle: null },
    ],
    feedbackGood: 'Alle Tiere sind warm und sicher durch den Sturm gekommen! 🧣',
    feedbackBad: 'Der Sturm war hart, aber die Tiere haben überlebt.',
  },
  {
    id: 'surprise_puppies',
    category: 'special',
    title: '🐾 Überraschung!',
    emoji: '🍼',
    story: 'Eine Hündin hat überraschend Welpen bekommen! Kümmere dich um die Neugeborenen!',
    duration: 0, // instant
    choices: [
      { label: 'Alle aufnehmen! 🥰', cost: 0, reward: { puppies: 3, xp: 30, hearts: 20 }, puzzle: null },
    ],
    feedbackGood: 'Drei gesunde Welpen! Sie werden schnell groß und suchen bald ein Zuhause! 🐶🐶🐶',
    feedbackBad: '',
  },
  {
    id: 'donation_drive',
    category: 'community',
    title: '💰 Spendenaktion!',
    emoji: '🎗️',
    story: 'Eine lokale Firma will für jede Vermittlung diese Woche doppelt spenden! Vermittle so viele Tiere wie möglich!',
    duration: 600,
    choices: [
      { label: 'Challenge annehmen!', cost: 0, reward: { doubleDonations: true, xp: 20, hearts: 30 }, puzzle: null },
    ],
    feedbackGood: 'Fantastische Aktion! Die Firma hat großzügig gespendet! 💕',
    feedbackBad: '',
  },
  {
    id: 'lost_pet',
    category: 'special',
    title: '🔍 Tier gefunden!',
    emoji: '🐕',
    story: 'Jemand hat ein verlaufenes Tier auf der Straße gefunden und bringt es zu dir. Es sieht hungrig und verängstigt aus.',
    duration: 0,
    choices: [
      { label: 'Aufnehmen & pflegen', cost: 5, reward: { foundPet: true, xp: 25, hearts: 15 }, puzzle: null },
      { label: 'An anderes Heim weiterleiten', cost: 0, reward: { hearts: 5 }, puzzle: null },
    ],
    feedbackGood: 'Das Tier erholt sich schnell und fühlt sich schon wie zuhause! 🏠',
    feedbackBad: 'Das Tier wurde an ein anderes Heim weitergeleitet.',
  },
  {
    id: 'volunteer_day',
    category: 'community',
    title: '🤝 Freiwilligen-Tag!',
    emoji: '👥',
    story: 'Eine Gruppe Freiwilliger möchte heute helfen! Weise ihnen Aufgaben zu!',
    duration: 0,
    choices: [
      { label: 'Tiere pflegen lassen', cost: 0, reward: { careAll: true, xp: 30, hearts: 40 }, puzzle: null },
      { label: 'Tierheim renovieren', cost: 20, reward: { hearts: 80, xp: 50, donationKg: 1 }, puzzle: null },
    ],
    feedbackGood: 'Die Freiwilligen haben fantastische Arbeit geleistet! Alle Tiere sind glücklich! ✨',
    feedbackBad: '',
  },
];

// Get a random event (weighted by category)
export function getRandomEvent(save) {
  // Filter events that make sense given current state
  const available = EVENT_TYPES.filter((e) => {
    if (e.id === 'shelter_closed' && (save.pets || []).length >= 15) return false; // too full
    if (e.id === 'sick_wave' && (save.pets || []).length === 0) return false;
    if (e.id === 'surprise_puppies' && (save.pets || []).length >= 18) return false;
    return true;
  });

  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

// Apply event choice rewards
export function applyEventReward(save, choice) {
  const r = choice.reward;

  if (r.hearts) save.hearts = Math.max(0, save.hearts + r.hearts);
  if (r.xp) {
    save.xp = (save.xp || 0) + r.xp;
    // Simple level check
    while (save.xp >= 80 * Math.pow(save.level, 1.4)) {
      save.xp -= Math.floor(80 * Math.pow(save.level, 1.4));
      save.level++;
    }
  }
  if (r.donationKg) save.totalDonatedKg = (save.totalDonatedKg || 0) + r.donationKg;

  // Generate new pets
  if (r.pets) {
    for (let i = 0; i < r.pets; i++) {
      save.pets.push(generatePet());
    }
  }
  if (r.puppies) {
    for (let i = 0; i < r.puppies; i++) {
      const pup = generatePet('common');
      pup.name = ['Welpe', 'Kleiner', 'Mini', 'Baby'][i] || 'Welpe';
      save.pets.push(pup);
    }
  }
  if (r.foundPet) {
    save.pets.push(generatePet());
  }

  // Heal pets
  if (r.healAll) {
    (save.pets || []).forEach((p) => { p.needs.health = 100; });
  }
  if (r.healHalf) {
    const sick = (save.pets || []).filter((p) => p.needs.health < 50);
    sick.slice(0, Math.ceil(sick.length / 2)).forEach((p) => { p.needs.health = 100; });
  }

  // Care all pets
  if (r.careAll) {
    (save.pets || []).forEach((p) => {
      p.needs.hunger = Math.min(100, p.needs.hunger + 30);
      p.needs.hygiene = Math.min(100, p.needs.hygiene + 30);
      p.needs.play = Math.min(100, p.needs.play + 30);
    });
  }

  return save;
}

// Check if an event should trigger (call on town visit)
export function shouldTriggerEvent(save) {
  const lastEvent = save.lastEventTime || 0;
  const now = Date.now();
  const minInterval = 3 * 60 * 1000; // minimum 3 minutes between events
  if (now - lastEvent < minInterval) return false;
  // 15% chance on each town visit
  return Math.random() < 0.15;
}
