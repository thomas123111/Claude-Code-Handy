// Pet breeds and generation

export const BREEDS = {
  dogs: [
    { id: 'labrador', name: 'Labrador', rarity: 'common', emoji: '🦮', color: 0xd4a854 },
    { id: 'dackel', name: 'Dackel', rarity: 'common', emoji: '🐕', color: 0x8b5e3c },
    { id: 'schaeferhund', name: 'Schäferhund', rarity: 'common', emoji: '🐕‍🦺', color: 0x6b4226 },
    { id: 'golden', name: 'Golden Retriever', rarity: 'rare', emoji: '🐶', color: 0xe8c36a },
    { id: 'husky', name: 'Husky', rarity: 'rare', emoji: '🐺', color: 0x8899aa },
    { id: 'pudel', name: 'Pudel', rarity: 'rare', emoji: '🐩', color: 0xffffff },
    { id: 'corgi', name: 'Corgi', rarity: 'epic', emoji: '🐕', color: 0xf0a830 },
    { id: 'dalmatiner', name: 'Dalmatiner', rarity: 'epic', emoji: '🐾', color: 0xfafafa },
    { id: 'samojede', name: 'Samojede', rarity: 'legendary', emoji: '🐻‍❄️', color: 0xfff8f0 },
  ],
  cats: [
    { id: 'hauskatze', name: 'Hauskatze', rarity: 'common', emoji: '🐱', color: 0x888888 },
    { id: 'tiger_katze', name: 'Tigerkatze', rarity: 'common', emoji: '🐈', color: 0xbb8844 },
    { id: 'schwarze', name: 'Schwarze Katze', rarity: 'common', emoji: '🐈‍⬛', color: 0x222222 },
    { id: 'perser', name: 'Perserkatze', rarity: 'rare', emoji: '😺', color: 0xddc8a0 },
    { id: 'maine_coon', name: 'Maine Coon', rarity: 'rare', emoji: '🦁', color: 0xaa7744 },
    { id: 'siam', name: 'Siamkatze', rarity: 'epic', emoji: '😸', color: 0xf5e6d0 },
    { id: 'bengal', name: 'Bengalkatze', rarity: 'legendary', emoji: '🐆', color: 0xd4a020 },
  ],
  small: [
    { id: 'kaninchen', name: 'Kaninchen', rarity: 'common', emoji: '🐰', color: 0xccbbaa },
    { id: 'hamster', name: 'Hamster', rarity: 'common', emoji: '🐹', color: 0xe8c080 },
    { id: 'meerschwein', name: 'Meerschweinchen', rarity: 'rare', emoji: '🐹', color: 0xbb8855 },
  ],
};

const ALL_BREEDS = [...BREEDS.dogs, ...BREEDS.cats, ...BREEDS.small];

const RARITY_WEIGHTS = { common: 70, rare: 20, epic: 8, legendary: 1 };
const RARITY_COLORS = {
  common: '#aaaaaa',
  rare: '#4488ff',
  epic: '#aa44ff',
  legendary: '#ffaa00',
};
const RARITY_LABELS = {
  common: 'Gewöhnlich',
  rare: 'Selten',
  epic: 'Episch',
  legendary: 'Legendär',
};

export { RARITY_COLORS, RARITY_LABELS };

// Pet needs
const NEED_TYPES = ['hunger', 'hygiene', 'play', 'health'];

export function generatePet(preferredRarity) {
  let pool;
  if (preferredRarity) {
    pool = ALL_BREEDS.filter((b) => b.rarity === preferredRarity);
  } else {
    // Weighted random rarity
    const roll = Math.random() * 100;
    let rarity;
    if (roll < RARITY_WEIGHTS.legendary) rarity = 'legendary';
    else if (roll < RARITY_WEIGHTS.legendary + RARITY_WEIGHTS.epic) rarity = 'epic';
    else if (roll < RARITY_WEIGHTS.legendary + RARITY_WEIGHTS.epic + RARITY_WEIGHTS.rare) rarity = 'rare';
    else rarity = 'common';
    pool = ALL_BREEDS.filter((b) => b.rarity === rarity);
  }

  const breed = pool[Math.floor(Math.random() * pool.length)];
  const names = ['Bella', 'Max', 'Luna', 'Buddy', 'Milo', 'Nala', 'Rocky', 'Coco',
    'Charlie', 'Daisy', 'Leo', 'Lilly', 'Bruno', 'Mia', 'Teddy', 'Rosie',
    'Balu', 'Frieda', 'Felix', 'Greta', 'Hansi', 'Susi', 'Waldi', 'Mitzi'];

  return {
    id: `pet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    breedId: breed.id,
    name: names[Math.floor(Math.random() * names.length)],
    breed: breed.name,
    rarity: breed.rarity,
    emoji: breed.emoji,
    color: breed.color,
    // Needs (0-100, decay over time)
    needs: {
      hunger: 80 + Math.random() * 20,
      hygiene: 60 + Math.random() * 40,
      play: 50 + Math.random() * 50,
      health: 90 + Math.random() * 10,
    },
    happiness: 75,
    adoptionProgress: 0, // 0-100, when full can be adopted
    insured: false,
    arrivedAt: Date.now(),
    story: generateStory(breed),
  };
}

function generateStory(breed) {
  const stories = [
    `${breed.name} wurde auf der Straße gefunden und braucht ein liebevolles Zuhause.`,
    `Dieser süße ${breed.name} wurde abgegeben, weil die Familie umziehen musste.`,
    `Ein kleiner ${breed.name}, der noch etwas schüchtern ist, aber schnell auftaut!`,
    `${breed.name} liebt Streicheleinheiten und wartet auf seine zweite Chance.`,
    `Gerettet aus schlechter Haltung - dieser ${breed.name} verdient alles Gute!`,
  ];
  return stories[Math.floor(Math.random() * stories.length)];
}

// Calculate happiness from needs
export function calculateHappiness(pet) {
  const n = pet.needs;
  return Math.floor((n.hunger + n.hygiene + n.play + n.health) / 4);
}

// Decay needs over time
export function decayNeeds(pet, minutesElapsed) {
  const decay = minutesElapsed * 0.5; // 0.5 per minute
  pet.needs.hunger = Math.max(0, pet.needs.hunger - decay * 1.2);
  pet.needs.hygiene = Math.max(0, pet.needs.hygiene - decay * 0.8);
  pet.needs.play = Math.max(0, pet.needs.play - decay);
  pet.needs.health = Math.max(0, pet.needs.health - decay * 0.3);
  pet.happiness = calculateHappiness(pet);
  return pet;
}
