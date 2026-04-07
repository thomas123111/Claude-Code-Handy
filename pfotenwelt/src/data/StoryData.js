// Story & dialogue system for pet narratives
// Each chapter = a story arc, triggered by milestones

export const STORY_CHAPTERS = [
  {
    id: 'ch1_welcome',
    title: 'Willkommen in der Pfotenwelt!',
    trigger: { type: 'level', value: 1 },
    dialogues: [
      { speaker: '🐾', text: 'Willkommen! Du hast gerade dein eigenes Tierheim eröffnet!' },
      { speaker: '🐾', text: 'Hier kommen Tiere hin, die ein neues Zuhause suchen.' },
      { speaker: '🐾', text: 'Merge Items auf dem Board, um Futter und Spielzeug herzustellen.' },
      { speaker: '🐾', text: 'Kümmere dich gut um die Tiere - dann finden sie schnell eine Familie!' },
      { speaker: '💝', text: 'Und das Beste: Jedes Spielen hilft echten Tieren in Not!' },
    ],
  },
  {
    id: 'ch2_first_pet',
    title: 'Dein erstes Tier!',
    trigger: { type: 'pets', value: 1 },
    dialogues: [
      { speaker: '🎉', text: 'Toll! Dein erstes Tier ist angekommen!' },
      { speaker: '🐾', text: 'Schau im Tierheim nach - es hat Hunger und braucht Pflege.' },
      { speaker: '🐾', text: 'Wenn es glücklich ist, kann es an eine liebevolle Familie vermittelt werden.' },
      { speaker: '❤️', text: 'Jede Vermittlung zählt als echte Futterspende!' },
    ],
  },
  {
    id: 'ch3_vet',
    title: 'Der Tierarzt',
    trigger: { type: 'level', value: 5 },
    dialogues: [
      { speaker: '🏥', text: 'Du hast jetzt Zugang zum Tierarzt!' },
      { speaker: '🏥', text: 'Manchmal werden Tiere krank. Der Tierarzt kann helfen.' },
      { speaker: '🛡️', text: 'Tipp: Eine Tierversicherung halbiert die Kosten!' },
      { speaker: '🐾', text: 'Auch im echten Leben ist eine Tierversicherung wichtig.' },
    ],
  },
  {
    id: 'ch4_salon',
    title: 'Der Tiersalon',
    trigger: { type: 'level', value: 10 },
    dialogues: [
      { speaker: '✂️', text: 'Der Tiersalon ist jetzt geöffnet!' },
      { speaker: '✂️', text: 'Gepflegte Tiere werden schneller und für mehr Herzen vermittelt.' },
      { speaker: '🐾', text: 'Jedes Tier verdient es, sich schön zu fühlen!' },
    ],
  },
  {
    id: 'ch5_adoption',
    title: 'Die erste Vermittlung',
    trigger: { type: 'adopted', value: 1 },
    dialogues: [
      { speaker: '🎉', text: 'Wunderbar! Du hast dein erstes Tier erfolgreich vermittelt!' },
      { speaker: '🏠', text: 'Es hat jetzt ein liebevolles Zuhause gefunden.' },
      { speaker: '💝', text: 'Dank dir wurde echtes Futter an Tiere in Not gespendet!' },
      { speaker: '🐾', text: 'Mach weiter so - viele Tiere warten auf ihre Chance!' },
    ],
  },
  {
    id: 'ch6_collection',
    title: 'Sammlerfieber',
    trigger: { type: 'collection', value: 5 },
    dialogues: [
      { speaker: '📖', text: 'Du hast schon 5 verschiedene Rassen kennengelernt!' },
      { speaker: '📖', text: 'Schau ins Sammelbuch - wie viele Rassen gibt es noch zu entdecken?' },
      { speaker: '🐾', text: 'Jede Rasse ist besonders und einzigartig!' },
    ],
  },
  {
    id: 'ch7_school',
    title: 'Die Hundeschule',
    trigger: { type: 'level', value: 15 },
    dialogues: [
      { speaker: '🎓', text: 'Die Hundeschule öffnet ihre Türen!' },
      { speaker: '🎓', text: 'Bringe deinen Hunden Tricks bei - das macht sie glücklicher.' },
      { speaker: '🏆', text: 'Mit genug Tricks können sie an Wettbewerben teilnehmen!' },
    ],
  },
  {
    id: 'ch8_legend',
    title: 'Legendäre Entdeckung',
    trigger: { type: 'legendary', value: 1 },
    dialogues: [
      { speaker: '⭐', text: 'Unglaublich! Du hast ein LEGENDÄRES Tier gefunden!' },
      { speaker: '⭐', text: 'Diese Rasse ist extrem selten und besonders.' },
      { speaker: '💎', text: 'Die Vermittlung bringt riesige Belohnungen!' },
      { speaker: '🐾', text: 'Pflege es gut - es verdient das Allerbeste.' },
    ],
  },
];

// Check which story should trigger based on save state
export function checkStoryTrigger(save) {
  const seen = save.seenStories || [];

  for (const chapter of STORY_CHAPTERS) {
    if (seen.includes(chapter.id)) continue;

    const t = chapter.trigger;
    let shouldTrigger = false;

    switch (t.type) {
      case 'level':
        shouldTrigger = save.level >= t.value;
        break;
      case 'pets':
        shouldTrigger = (save.pets || []).length >= t.value;
        break;
      case 'adopted':
        shouldTrigger = (save.adopted || 0) >= t.value;
        break;
      case 'collection':
        shouldTrigger = (save.collection || []).length >= t.value;
        break;
      case 'legendary':
        shouldTrigger = (save.pets || []).some((p) => p.rarity === 'legendary');
        break;
    }

    if (shouldTrigger) return chapter;
  }

  return null;
}

// Random pet event stories (shown occasionally)
export const PET_EVENTS = [
  { emoji: '🌧️', text: 'Es regnet draußen... Die Tiere kuscheln sich zusammen.', effect: { need: 'play', change: -5 } },
  { emoji: '☀️', text: 'Sonniger Tag! Die Tiere spielen draußen.', effect: { need: 'play', change: 10 } },
  { emoji: '🦴', text: 'Ein Spender hat Leckerlis vorbeigebracht!', effect: { need: 'hunger', change: 15 } },
  { emoji: '🎵', text: 'Jemand spielt Musik - die Tiere sind entspannt.', effect: { need: 'play', change: 5 } },
  { emoji: '🤧', text: 'Achtung: Erkältungswelle! Manche Tiere fühlen sich unwohl.', effect: { need: 'health', change: -15 } },
  { emoji: '📸', text: 'Ein Fotograf macht Fotos für die Vermittlung!', effect: { need: 'play', change: 10 } },
  { emoji: '🎁', text: 'Überraschung! Eine anonyme Spende ist eingetroffen!', effect: { hearts: 50 } },
  { emoji: '🐾', text: 'Ein Besucher ist begeistert von deinem Tierheim!', effect: { hearts: 20 } },
];

export function getRandomEvent() {
  return PET_EVENTS[Math.floor(Math.random() * PET_EVENTS.length)];
}
