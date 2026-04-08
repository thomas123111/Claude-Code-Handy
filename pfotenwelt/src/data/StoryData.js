// Story & dialogue system — 10 chapters tied to building unlock progression
// Each chapter triggers when a building is unlocked or a milestone is reached

export const STORY_CHAPTERS = [
  {
    id: 'ch1_arrival',
    title: 'Ankunft in Pfotendorf',
    trigger: { type: 'onboarding' }, // triggered after onboarding
    dialogues: [
      { speaker: '📬', text: 'Ein Brief von Oma Helga...' },
      { speaker: '👵', text: '"Mein liebes Kind, ich übergebe dir mein Tierheim in Pfotendorf."' },
      { speaker: '👵', text: '"Ich bin zu alt geworden, aber die Tiere brauchen jemanden mit Herz."' },
      { speaker: '👵', text: '"Neben dem Tierheim steht meine alte Werkstatt — da kannst du Spielzeug und Futter herstellen."' },
      { speaker: '🐾', text: 'Du betrittst das Tierheim... und findest deinen treuen Begleiter.' },
      { speaker: '❤️', text: 'Zusammen werdet ihr Pfotendorf wieder zum Leben erwecken!' },
    ],
  },
  {
    id: 'ch2_workshop',
    title: 'Die alte Werkstatt',
    trigger: { type: 'level', value: 1 },
    dialogues: [
      { speaker: '🧩', text: 'Neben dem Tierheim steht Omas alte Werkstatt!' },
      { speaker: '🧩', text: 'Hier hat sie Spielzeug und Futter für die Tiere hergestellt.' },
      { speaker: '🧩', text: 'Du kannst Items zusammenfügen — merge gleiche Teile zu besseren!' },
      { speaker: '🐾', text: 'Aus dem besten Futter und Spielzeug entstehen sogar neue Tiere!' },
    ],
  },
  {
    id: 'ch3_vet',
    title: 'Dr. Meier kommt!',
    trigger: { type: 'station_unlock', value: 'vet' },
    dialogues: [
      { speaker: '🏥', text: 'Großartig! Dr. Meier hat von deinem Tierheim gehört.' },
      { speaker: '👨‍⚕️', text: '"Ich eröffne meine Praxis direkt neben deinem Tierheim!"' },
      { speaker: '🏥', text: 'Jetzt kannst du kranke Tiere behandeln lassen.' },
      { speaker: '🛡️', text: 'Tipp: Eine Tierversicherung halbiert die Kosten!' },
    ],
  },
  {
    id: 'ch4_salon',
    title: 'Schönheit hilft!',
    trigger: { type: 'station_unlock', value: 'salon' },
    dialogues: [
      { speaker: '✂️', text: 'Lisa eröffnet ihren Tiersalon in Pfotendorf!' },
      { speaker: '✂️', text: '"Gepflegte Tiere finden viel schneller ein neues Zuhause."' },
      { speaker: '✨', text: 'Gepflegte Tiere bekommen +25% Vermittlungsbonus.' },
    ],
  },
  {
    id: 'ch5_futterladen',
    title: 'Der Futterladen',
    trigger: { type: 'station_unlock', value: 'futterladen' },
    dialogues: [
      { speaker: '🛒', text: 'Herr Müller eröffnet einen Futterladen in der Stadt!' },
      { speaker: '🛒', text: '"Ich habe verschiedene Futtersorten — von Basic bis Bio."' },
      { speaker: '🐾', text: 'Jetzt hast du eine zuverlässige Futterquelle für deine Tiere.' },
      { speaker: '💡', text: 'Tipp: Schau regelmäßig nach Tagesangeboten!' },
    ],
  },
  {
    id: 'ch5b_adoption',
    title: 'Die erste Vermittlung',
    trigger: { type: 'adopted', value: 1 },
    dialogues: [
      { speaker: '🎉', text: 'Du hast dein erstes Tier erfolgreich vermittelt!' },
      { speaker: '🏠', text: 'Es hat jetzt ein liebevolles Zuhause gefunden.' },
      { speaker: '💝', text: 'Dank dir wurde echtes Futter an Tiere in Not gespendet!' },
      { speaker: '👵', text: '"Oma Helga wäre so stolz auf dich!"' },
    ],
  },
  {
    id: 'ch6_school',
    title: 'Die Hundeschule',
    trigger: { type: 'station_unlock', value: 'school' },
    dialogues: [
      { speaker: '🎓', text: 'Trainer Marco kommt nach Pfotendorf!' },
      { speaker: '🎓', text: '"Ich bringe deinen Hunden Tricks bei — Sitz, Platz, Pfote!"' },
      { speaker: '🏆', text: 'Trainierte Tiere können an Wettbewerben teilnehmen.' },
      { speaker: '🐕', text: 'Jeder Trick steigert die Vermittlungschancen!' },
    ],
  },
  {
    id: 'ch7_hotel',
    title: 'Die Tierpension',
    trigger: { type: 'station_unlock', value: 'hotel' },
    dialogues: [
      { speaker: '🏨', text: 'Dein Tierheim hat sich herumgesprochen!' },
      { speaker: '🏨', text: 'Leute aus der Umgebung suchen eine Urlaubsbetreuung für ihre Tiere.' },
      { speaker: '💰', text: 'Die Pension bringt regelmäßige Einnahmen — auch während du spielst!' },
    ],
  },
  {
    id: 'ch8_spielplatz',
    title: 'Der Hundespielplatz',
    trigger: { type: 'station_unlock', value: 'spielplatz' },
    dialogues: [
      { speaker: '🌳', text: 'Die Gemeinde hat einen Spielplatz für Tiere gebaut!' },
      { speaker: '🥏', text: 'Frisbee, Agility und freies Spielen — deine Tiere werden es lieben!' },
      { speaker: '🐕', text: 'Regelmäßiger Auslauf macht alle Tiere glücklicher.' },
    ],
  },
  {
    id: 'ch9_cafe',
    title: 'Das Tier-Café',
    trigger: { type: 'station_unlock', value: 'cafe' },
    dialogues: [
      { speaker: '☕', text: 'Pfotendorf bekommt ein Tier-Café!' },
      { speaker: '☕', text: 'Besucher kommen, um Zeit mit den Tieren zu verbringen.' },
      { speaker: '🐾', text: 'Gepflegte und trainierte Tiere ziehen mehr Besucher an.' },
      { speaker: '💰', text: 'Jeder Besucher bringt Herzen und Spenden!' },
    ],
  },
  {
    id: 'ch10_guild',
    title: 'Tierschutz-Netzwerk',
    trigger: { type: 'station_unlock', value: 'guild' },
    dialogues: [
      { speaker: '🤝', text: 'Andere Tierschützer haben von dir gehört!' },
      { speaker: '🤝', text: 'Zusammen gründet ihr ein Netzwerk für Tierschutz.' },
      { speaker: '🌍', text: 'Gemeinsam könnt ihr noch mehr Tieren helfen!' },
    ],
  },
  {
    id: 'ch11_farm',
    title: 'Bauer Herberts Angebot',
    trigger: { type: 'station_unlock', value: 'farm' },
    dialogues: [
      { speaker: '🌾', text: 'Bauer Herbert kommt mit großartigen Neuigkeiten!' },
      { speaker: '👨‍🌾', text: '"Ich bin zu alt für den Hof. Willst du ihn übernehmen?"' },
      { speaker: '🐄', text: 'Kühe, Schweine, Hühner und Enten warten auf dich!' },
      { speaker: '🚜', text: 'Der Hof liefert Futter direkt an dein Tierheim.' },
      { speaker: '💝', text: 'So versorgst du noch mehr Tiere in Not!' },
    ],
  },
  {
    id: 'ch_collection',
    title: 'Sammlerfieber',
    trigger: { type: 'collection', value: 5 },
    dialogues: [
      { speaker: '📖', text: 'Du hast schon 5 verschiedene Rassen kennengelernt!' },
      { speaker: '📖', text: 'Schau ins Sammelbuch — wie viele gibt es noch?' },
    ],
  },
  {
    id: 'ch_legend',
    title: 'Omas Geheimnis',
    trigger: { type: 'legendary', value: 1 },
    dialogues: [
      { speaker: '⭐', text: 'Unglaublich! Du hast ein LEGENDÄRES Tier gefunden!' },
      { speaker: '📬', text: 'Im Briefkasten findest du einen letzten Brief von Oma...' },
      { speaker: '👵', text: '"Ich wusste, du würdest es schaffen. Es gibt Tiere die besonders sind..."' },
      { speaker: '👵', text: '"Pflege es gut. Es ist ein Zeichen, dass du bereit bist für Großes."' },
      { speaker: '💎', text: 'Legendäre Tiere bringen riesige Vermittlungsbelohnungen!' },
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
      case 'onboarding':
        // Only trigger if onboarding just completed (companion exists but story not seen)
        shouldTrigger = save.onboardingDone && (save.companions || []).length > 0;
        break;
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
      case 'station_unlock':
        shouldTrigger = save.stations[t.value] && save.stations[t.value].unlocked;
        break;
    }

    if (shouldTrigger) return chapter;
  }

  return null;
}

// Random pet event stories (shown occasionally based on day/night cycle)
export const PET_EVENTS = [
  { emoji: '🌧️', text: 'Es regnet draußen... Die Tiere kuscheln sich zusammen.', effect: { need: 'play', change: -5 } },
  { emoji: '☀️', text: 'Sonniger Tag! Die Tiere spielen draußen.', effect: { need: 'play', change: 10 } },
  { emoji: '🦴', text: 'Ein Spender hat Leckerlis vorbeigebracht!', effect: { need: 'hunger', change: 15 } },
  { emoji: '🎵', text: 'Jemand spielt Musik — die Tiere sind entspannt.', effect: { need: 'play', change: 5 } },
  { emoji: '🤧', text: 'Erkältungswelle! Manche Tiere fühlen sich unwohl.', effect: { need: 'health', change: -15 } },
  { emoji: '📸', text: 'Ein Fotograf macht Fotos für die Vermittlung!', effect: { need: 'play', change: 10 } },
  { emoji: '🎁', text: 'Eine anonyme Spende ist eingetroffen!', effect: { hearts: 50 } },
  { emoji: '🐾', text: 'Ein Besucher ist begeistert von deinem Tierheim!', effect: { hearts: 20 } },
  { emoji: '🌻', text: 'Der Futterladen hat Gratisproben verteilt!', effect: { need: 'hunger', change: 10 } },
  { emoji: '🏆', text: 'Pfotendorf gewinnt den Tierschutz-Preis der Region!', effect: { hearts: 100 } },
];

export function getRandomEvent() {
  return PET_EVENTS[Math.floor(Math.random() * PET_EVENTS.length)];
}
