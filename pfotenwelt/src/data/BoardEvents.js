// Board events — special event cards on the Dorftafel with player choices

export const BOARD_EVENTS = [
  {
    id: 'sunny_day',
    emoji: '☀️', title: 'Sonniger Tag!',
    desc: 'Perfektes Wetter für die Tiere draußen.',
    choices: [
      { label: 'Spielplatz-Ausflug (5❤)', cost: 5, effect: { need: 'play', change: 20, allPets: true }, reward: 'Alle Tiere: +20 Spielen' },
      { label: 'Einfach genießen', cost: 0, effect: { need: 'play', change: 5, allPets: true }, reward: 'Alle Tiere: +5 Spielen' },
    ],
  },
  {
    id: 'rain',
    emoji: '🌧️', title: 'Regentag',
    desc: 'Es regnet... die Tiere sind unruhig.',
    choices: [
      { label: 'Drinnen spielen (3❤)', cost: 3, effect: { need: 'play', change: 10, allPets: true }, reward: 'Alle Tiere: +10 Spielen' },
      { label: 'Abwarten', cost: 0, effect: { need: 'play', change: -10, allPets: true }, reward: 'Alle Tiere: -10 Spielen' },
    ],
  },
  {
    id: 'donation',
    emoji: '🎁', title: 'Anonyme Spende!',
    desc: 'Jemand hat ein Paket vor die Tür gestellt.',
    choices: [
      { label: 'Annehmen', cost: 0, effect: { hearts: 25 }, reward: '+25❤' },
    ],
  },
  {
    id: 'sick_wave',
    emoji: '🤧', title: 'Erkältungswelle!',
    desc: 'Einige Tiere fühlen sich nicht gut.',
    choices: [
      { label: 'Tierarzt rufen (10❤)', cost: 10, effect: { need: 'health', change: 15, allPets: true }, reward: 'Alle Tiere: +15 Gesundheit' },
      { label: 'Hausmittel (3❤)', cost: 3, effect: { need: 'health', change: 5, allPets: true }, reward: 'Alle Tiere: +5 Gesundheit' },
      { label: 'Abwarten', cost: 0, effect: { need: 'health', change: -15, allPets: true }, reward: 'Alle Tiere: -15 Gesundheit' },
    ],
  },
  {
    id: 'visitor',
    emoji: '👨‍👩‍👧', title: 'Besucher-Gruppe!',
    desc: 'Eine Familie möchte das Tierheim besichtigen.',
    choices: [
      { label: 'Führung geben (8❤)', cost: 8, effect: { hearts: 20, xp: 10 }, reward: '+20❤ + 10 XP' },
      { label: 'Kurz reinschauen lassen', cost: 0, effect: { hearts: 5 }, reward: '+5❤' },
    ],
  },
  {
    id: 'photo',
    emoji: '📸', title: 'Zeitungs-Reporter!',
    desc: 'Die Lokalzeitung will über dein Tierheim berichten.',
    choices: [
      { label: 'Interview geben', cost: 0, effect: { hearts: 15, xp: 8 }, reward: '+15❤ + 8 XP' },
    ],
  },
  {
    id: 'storm',
    emoji: '⛈️', title: 'Gewitter!',
    desc: 'Ein Sturm zieht auf — die Tiere haben Angst.',
    choices: [
      { label: 'Alle beruhigen (5❤)', cost: 5, effect: { need: 'play', change: 10, need2: 'health', change2: 5, allPets: true }, reward: '+10 Spielen, +5 Gesundheit' },
      { label: 'Abwarten', cost: 0, effect: { need: 'play', change: -15, allPets: true }, reward: '-15 Spielen' },
    ],
  },
  {
    id: 'food_delivery',
    emoji: '🚚', title: 'Futter-Lieferung!',
    desc: 'Ein lokaler Laden spendet Futter.',
    choices: [
      { label: 'Annehmen & verteilen', cost: 0, effect: { need: 'hunger', change: 20, allPets: true }, reward: 'Alle Tiere: +20 Hunger' },
    ],
  },
  {
    id: 'volunteer',
    emoji: '🤝', title: 'Freiwilliger Helfer!',
    desc: 'Jemand bietet seine Hilfe im Tierheim an.',
    choices: [
      { label: 'Putzen lassen', cost: 0, effect: { need: 'hygiene', change: 15, allPets: true }, reward: 'Alle Tiere: +15 Pflege' },
      { label: 'Spielen lassen', cost: 0, effect: { need: 'play', change: 15, allPets: true }, reward: 'Alle Tiere: +15 Spielen' },
    ],
  },
  {
    id: 'competition',
    emoji: '🏆', title: 'Tierschutz-Wettbewerb!',
    desc: 'Dein Tierheim wurde für einen Preis nominiert.',
    choices: [
      { label: 'Teilnehmen (15❤)', cost: 15, effect: { hearts: 40, xp: 20 }, reward: '+40❤ + 20 XP' },
      { label: 'Ablehnen', cost: 0, effect: {}, reward: 'Nichts passiert' },
    ],
  },
];

// Get current board event (1 per 2 game days)
export function getBoardEvent(gameDay) {
  if (gameDay % 2 !== 0) return null; // only even days
  const idx = Math.floor((gameDay * 7919) % BOARD_EVENTS.length);
  return { ...BOARD_EVENTS[idx] };
}

// Apply event choice effects to save
export function applyEventChoice(save, choice) {
  if (choice.cost > 0) save.hearts -= choice.cost;
  const eff = choice.effect;
  if (eff.hearts) save.hearts += eff.hearts;
  if (eff.xp) { save.xp += eff.xp; }
  if (eff.need && eff.allPets) {
    (save.pets || []).forEach(p => {
      if (p.needs) p.needs[eff.need] = Math.max(0, Math.min(100, p.needs[eff.need] + eff.change));
      if (eff.need2 && p.needs) p.needs[eff.need2] = Math.max(0, Math.min(100, p.needs[eff.need2] + eff.change2));
    });
  }
}
