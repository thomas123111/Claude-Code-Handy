// Adopter profile system for matching pets to the right families

export const ADOPTER_TRAITS = {
  housing: ['Wohnung', 'Haus mit Garten', 'Bauernhof'],
  experience: ['Anfänger', 'Erfahren', 'Profi'],
  household: ['Alleinlebend', 'Paar', 'Familie mit Kindern', 'Senioren'],
  activity: ['Gemütlich', 'Aktiv', 'Sehr sportlich'],
  workSchedule: ['Zuhause', 'Teilzeit', 'Vollzeit'],
};

const FIRST_NAMES = [
  'Anna', 'Thomas', 'Julia', 'Markus', 'Sabine',
  'Stefan', 'Claudia', 'Michael', 'Petra', 'Andreas',
  'Monika', 'Klaus', 'Heike', 'Jürgen', 'Birgit',
  'Frank', 'Martina', 'Uwe', 'Karin', 'Bernd',
];

const SURNAMES = [
  'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber',
  'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch',
  'Richter', 'Klein', 'Braun',
];

const HOUSEHOLD_EMOJIS = {
  'Alleinlebend': ['👩', '👨'],
  'Paar': ['👫', '👬', '👭'],
  'Familie mit Kindern': ['👨‍👩‍👧', '👨‍👩‍👦', '👩‍👧', '👨‍👧‍👦'],
  'Senioren': ['👵', '👴', '👵👴'],
};

const STORIES = {
  'Alleinlebend': [
    'Ich suche einen treuen Begleiter für meine Abende.',
    'Mir fehlt jemand zum Kuscheln nach der Arbeit.',
    'Ich arbeite von zuhause und hätte gern Gesellschaft.',
  ],
  'Paar': [
    'Wir möchten unser Zuhause mit einem Tier teilen.',
    'Gemeinsam ein Tier großziehen wäre wunderschön.',
    'Wir haben endlich genug Platz für ein Haustier.',
  ],
  'Familie mit Kindern': [
    'Unsere Kinder wünschen sich nichts sehnlicher als ein Haustier.',
    'Ein Tier wäre perfekt für unsere Familie.',
    'Die Kinder sind alt genug, um Verantwortung zu lernen.',
  ],
  'Senioren': [
    'Seit der Rente fehlt mir ein Begleiter im Alltag.',
    'Ein ruhiges Tier wäre perfekt für meine Lebenslage.',
    'Ich habe viel Zeit und Liebe zu geben.',
  ],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateAdopter() {
  const household = pick(ADOPTER_TRAITS.household);
  const emojis = HOUSEHOLD_EMOJIS[household] || ['👤'];

  return {
    id: `adopter_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: `${pick(FIRST_NAMES)} ${pick(SURNAMES)}`,
    age: 25 + Math.floor(Math.random() * 46),
    emoji: pick(emojis),
    traits: {
      housing: pick(ADOPTER_TRAITS.housing),
      experience: pick(ADOPTER_TRAITS.experience),
      household,
      activity: pick(ADOPTER_TRAITS.activity),
      workSchedule: pick(ADOPTER_TRAITS.workSchedule),
    },
    preferences: {
      sizePreference: pick(['klein', 'mittel', 'groß']),
      petType: pick(['Hund', 'Katze', 'Egal']),
    },
    story: pick(STORIES[household]),
  };
}

// Breed classification helpers
const BIG_DOGS = ['schaeferhund', 'husky', 'golden', 'labrador', 'dalmatiner', 'samojede'];
const SMALL_DOGS = ['dackel', 'pudel', 'corgi'];
const DIFFICULT_BREEDS = ['husky', 'bengal', 'schaeferhund'];
const GENTLE_BREEDS = ['labrador', 'golden'];
const CALM_SMALL_BREEDS = ['dackel', 'pudel', 'hauskatze', 'perser', 'kaninchen', 'hamster', 'meerschwein'];
const ACTIVE_BREEDS = ['husky', 'schaeferhund', 'dalmatiner'];
const CAT_BREEDS = ['hauskatze', 'tiger_katze', 'schwarze', 'perser', 'maine_coon', 'siam', 'bengal'];
const SMALL_PET_BREEDS = ['kaninchen', 'hamster', 'meerschwein'];
const DOG_BREEDS = ['labrador', 'dackel', 'schaeferhund', 'golden', 'husky', 'pudel', 'corgi', 'dalmatiner', 'samojede'];

export function calculateMatchScore(pet, adopter) {
  let score = 60; // base score
  const breedId = pet.breedId;
  const traits = adopter.traits;
  const prefs = adopter.preferences;

  // Housing check: big dogs need space
  if (BIG_DOGS.includes(breedId) && traits.housing === 'Wohnung') {
    score -= 30;
  }
  // Cats are fine in Wohnung (no penalty)

  // Experience check: difficult breeds need experienced owners
  if (DIFFICULT_BREEDS.includes(breedId) && traits.experience === 'Anfänger') {
    score -= 20;
  }

  // Family with children prefer gentle breeds
  if (traits.household === 'Familie mit Kindern' && GENTLE_BREEDS.includes(breedId)) {
    score += 15;
  }

  // Seniors prefer calm small breeds
  if (traits.household === 'Senioren' && CALM_SMALL_BREEDS.includes(breedId)) {
    score += 10;
  }

  // Active/sporty people match with active breeds
  if ((traits.activity === 'Aktiv' || traits.activity === 'Sehr sportlich') && ACTIVE_BREEDS.includes(breedId)) {
    score += 10;
  }

  // Vollzeit workers better with cats/independent pets
  if (traits.workSchedule === 'Vollzeit' && (CAT_BREEDS.includes(breedId) || SMALL_PET_BREEDS.includes(breedId))) {
    score += 10;
  }

  // Pet type preference bonus
  if (prefs.petType === 'Hund' && DOG_BREEDS.includes(breedId)) {
    score += 10;
  } else if (prefs.petType === 'Katze' && CAT_BREEDS.includes(breedId)) {
    score += 10;
  } else if (prefs.petType !== 'Egal') {
    // Wrong pet type
    if (prefs.petType === 'Hund' && !DOG_BREEDS.includes(breedId)) {
      score -= 10;
    } else if (prefs.petType === 'Katze' && !CAT_BREEDS.includes(breedId)) {
      score -= 10;
    }
  }

  // Size preference bonus
  if (prefs.sizePreference === 'klein' && (SMALL_DOGS.includes(breedId) || SMALL_PET_BREEDS.includes(breedId))) {
    score += 5;
  } else if (prefs.sizePreference === 'groß' && BIG_DOGS.includes(breedId)) {
    score += 5;
  }

  // Haus mit Garten or Bauernhof bonus for dogs
  if ((traits.housing === 'Haus mit Garten' || traits.housing === 'Bauernhof') && DOG_BREEDS.includes(breedId)) {
    score += 5;
  }

  // Zuhause workers get bonus (more time for pet)
  if (traits.workSchedule === 'Zuhause') {
    score += 5;
  }

  // Profi experience bonus
  if (traits.experience === 'Profi') {
    score += 5;
  }

  // Clamp 0-100
  return Math.max(0, Math.min(100, score));
}

export function getMatchLabel(score) {
  if (score >= 90) {
    return { label: 'Perfektes Match! \u{1F495}', color: '#44ff88', emoji: '\u{1F495}' };
  } else if (score >= 70) {
    return { label: 'Gutes Match! \u{1F60A}', color: '#4488ff', emoji: '\u{1F60A}' };
  } else if (score >= 50) {
    return { label: 'Geht so... \u{1F610}', color: '#ffcc44', emoji: '\u{1F610}' };
  } else {
    return { label: 'Passt nicht gut \u{1F61F}', color: '#ff4444', emoji: '\u{1F61F}' };
  }
}

export function getAdoptionFeedback(score, petName, adopterName) {
  if (score >= 90) {
    const stories = [
      `${petName} hat sich sofort bei ${adopterName} wohlgefühlt und schläft schon auf dem Sofa!`,
      `${adopterName} und ${petName} waren Liebe auf den ersten Blick. Ein perfektes Zuhause!`,
      `${petName} hat ${adopterName} gleich am ersten Tag vor Freude abgeschleckt. Traumhaft!`,
    ];
    return pick(stories);
  } else if (score >= 70) {
    const stories = [
      `${petName} braucht noch etwas Zeit, aber ${adopterName} ist geduldig. Es wird gut!`,
      `${adopterName} berichtet, dass ${petName} langsam auftaut. Ein solides Match!`,
      `${petName} hat sich nach ein paar Tagen gut bei ${adopterName} eingelebt.`,
    ];
    return pick(stories);
  } else if (score >= 50) {
    const stories = [
      `${petName} wirkt noch etwas unsicher bei ${adopterName}. Hoffentlich wird es besser.`,
      `${adopterName} merkt, dass ${petName} viel Aufmerksamkeit braucht. Es ist anstrengend.`,
      `${petName} versteckt sich noch oft. ${adopterName} gibt aber nicht auf.`,
    ];
    return pick(stories);
  } else {
    const stories = [
      `${petName} bellt die Nachbarn an und ${adopterName} ist überfordert. Keine gute Kombination.`,
      `${adopterName} ruft an: ${petName} zerstört die Möbel. Es war wohl zu früh.`,
      `${petName} scheint einsam und ${adopterName} hat zu wenig Zeit. Das macht traurig.`,
      `Die Kinder haben Angst vor ${petName}. ${adopterName} überlegt, ${petName} zurückzugeben.`,
    ];
    return pick(stories);
  }
}
