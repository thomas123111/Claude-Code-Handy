// Guild system - NPC helpers that assist with pet care
// Designed for future multiplayer (replace NPCs with real players)

const NPC_NAMES = [
  { name: 'Sophie', emoji: '👩‍🦰', specialty: 'Füttern', trait: 'Liebt Hunde' },
  { name: 'Max', emoji: '👨', specialty: 'Pflege', trait: 'Katzenflüsterer' },
  { name: 'Emma', emoji: '👩', specialty: 'Training', trait: 'Geduldig' },
  { name: 'Lukas', emoji: '👨‍🦱', specialty: 'Tierarzt', trait: 'Erfahrener Pfleger' },
  { name: 'Anna', emoji: '👧', specialty: 'Spielen', trait: 'Voller Energie' },
  { name: 'Felix', emoji: '🧑', specialty: 'Füttern', trait: 'Koch-Talent' },
  { name: 'Mia', emoji: '👩‍🦳', specialty: 'Pflege', trait: 'Sanfte Hände' },
  { name: 'Tim', emoji: '👦', specialty: 'Training', trait: 'Sportlich' },
  { name: 'Lena', emoji: '👩‍🔧', specialty: 'Tierarzt', trait: 'Medizin-Studentin' },
  { name: 'Jonas', emoji: '🧔', specialty: 'Spielen', trait: 'Hundetrainer' },
  { name: 'Clara', emoji: '👩‍🎓', specialty: 'Füttern', trait: 'Ernährungsberaterin' },
  { name: 'Niklas', emoji: '👨‍🎨', specialty: 'Pflege', trait: 'Grooming-Profi' },
];

export function createDefaultGuild() {
  return {
    name: 'Pfoten-Freunde',
    level: 1,
    xp: 0,
    members: [], // NPC or future real player IDs
    maxMembers: 5,
    totalDonated: 0,
    helpLog: [], // recent help actions
    chatMessages: [], // guild chat (NPC messages)
  };
}

export function generateNPCMember() {
  const npc = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
  return {
    id: `npc_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    isNPC: true, // flag for future multiplayer distinction
    name: npc.name,
    emoji: npc.emoji,
    specialty: npc.specialty,
    trait: npc.trait,
    level: Math.floor(Math.random() * 5) + 1,
    lastActive: Date.now(),
    helpCount: 0,
  };
}

// NPC helper actions (called periodically)
export function processNPCHelp(save) {
  const guild = save.guild;
  if (!guild || guild.members.length === 0) return save;

  const now = Date.now();
  const pets = save.pets || [];
  if (pets.length === 0) return save;

  guild.members.forEach((member) => {
    if (!member.isNPC) return;
    // NPCs help once per day
    const timeSince = now - (member.lastActive || 0);
    if (timeSince < 24 * 60 * 60 * 1000) return; // 24 hours

    member.lastActive = now;
    member.helpCount++;

    // Pick a random pet to help based on specialty
    const pet = pets[Math.floor(Math.random() * pets.length)];
    const helpAmount = 5 + member.level * 2;

    switch (member.specialty) {
      case 'Füttern':
        pet.needs.hunger = Math.min(100, pet.needs.hunger + helpAmount);
        break;
      case 'Pflege':
        pet.needs.hygiene = Math.min(100, pet.needs.hygiene + helpAmount);
        break;
      case 'Training':
      case 'Spielen':
        pet.needs.play = Math.min(100, pet.needs.play + helpAmount);
        break;
      case 'Tierarzt':
        pet.needs.health = Math.min(100, pet.needs.health + helpAmount);
        break;
    }

    // Add to help log
    guild.helpLog.unshift({
      memberName: member.name,
      memberEmoji: member.emoji,
      petName: pet.name,
      action: member.specialty,
      time: now,
    });

    // Keep log at max 20 entries
    if (guild.helpLog.length > 20) guild.helpLog.pop();

    // NPC chat messages (occasionally)
    if (Math.random() < 0.3) {
      const messages = [
        `${pet.name} ist so süß! 🥰`,
        `Hab ${pet.name} gefüttert, war richtig hungrig!`,
        `${pet.name} liebt Streicheleinheiten! ❤️`,
        `Die Tiere hier haben es verdient!`,
        `Schönes Tierheim hast du da! 👍`,
        `${pet.name} macht Fortschritte! 🐾`,
        `Morgen komme ich wieder helfen!`,
        `Wer möchte ${pet.name} adoptieren? So ein Schatz!`,
      ];
      guild.chatMessages.unshift({
        name: member.name,
        emoji: member.emoji,
        text: messages[Math.floor(Math.random() * messages.length)],
        time: now,
      });
      if (guild.chatMessages.length > 30) guild.chatMessages.pop();
    }
  });

  save.guild = guild;
  return save;
}

// Guild XP for leveling
export function addGuildXp(guild, amount) {
  guild.xp += amount;
  const needed = 100 * Math.pow(guild.level, 1.3);
  while (guild.xp >= needed) {
    guild.xp -= Math.floor(needed);
    guild.level++;
    guild.maxMembers = Math.min(10, 5 + Math.floor(guild.level / 2));
  }
  return guild;
}
