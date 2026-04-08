import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { calculateHappiness, decayNeeds, RARITY_COLORS, RARITY_LABELS } from '../data/PetData.js';
import { THEME, drawHeader, drawButton, drawCard, drawBackButton, drawProgressBar } from '../ui/Theme.js';

export class ShelterScene extends Phaser.Scene {
  constructor() { super('Shelter'); }

  create() {
    this.save = loadSave();
    this.checkPuzzleResult();
    this.selectedPet = null;
    this.drawUI();
  }

  checkPuzzleResult() {
    const result = this.registry.get('puzzleResult');
    const pending = this.registry.get('pendingFeed');
    if (!result || !pending) return;
    this.registry.remove('puzzleResult');
    this.registry.remove('pendingFeed');
    const pet = this.save.pets[pending.petIdx];
    if (pet && result.success) {
      this.save.hearts -= pending.cost;
      pet.needs[pending.need] = Math.min(100, pet.needs[pending.need] + 55);
      pet.happiness = calculateHappiness(pet);
      addXp(this.save, 10);
      writeSave(this.save);
    }
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];

    const { width, height } = this.scale;
    const cx = width / 2;
    const save = this.save;

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    // Background image (dimmed behind UI)
    const bgKey = 'bg_shelter';
    if (this.textures.exists(bgKey)) {
      const bg = this.add.image(width / 2, height / 2, bgKey);
      bg.setDisplaySize(width, height);
      bg.setAlpha(0.15);
      bg.setDepth(-1);
    }

    // === HEADER ===
    drawHeader(this, '🏠 Mein Tierheim', save);
    // Pet count info after header
    this.add.text(width - 14, 32, `${save.pets.length} Tiere`, {
      fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(1, 0);
    this.add.text(width - 14, 47, `${save.adopted} vermittelt`, {
      fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(1, 0);

    // === EMPTY STATE ===
    if (save.pets.length === 0) {
      this.add.text(cx, 200, '🐾', { fontSize: '60px' }).setOrigin(0.5);
      this.add.text(cx, 270, 'Noch keine Tiere!', {
        fontSize: '22px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
      }).setOrigin(0.5);
      this.add.text(cx, 300, 'Merge max-level Items im Merge Board\num dein erstes Tier zu bekommen!', {
        fontSize: '15px', fontFamily: 'monospace', color: THEME.text.muted, align: 'center',
      }).setOrigin(0.5);

      // Quick link to merge
      drawButton(this, cx, 370, 220, 44, '🧩 Zum Merge Board', { type: 'secondary' });
      this.addHitArea(cx, 370, 220, 44, () => this.scene.start('MergeBoard'));

    } else if (this.selectedPet !== null) {
      // === PET DETAIL VIEW ===
      this.drawPetDetail(save.pets[this.selectedPet], this.selectedPet);
    } else {
      // === PET GRID VIEW ===
      this.drawPetGrid();
    }

    // === BACK BUTTON ===
    const backLabel = this.selectedPet !== null ? '← Zurück zur Übersicht' : '← Zurück zur Stadt';
    drawButton(this, cx, height - 30, 280, 50, backLabel, { type: 'secondary' });
    this.addHitArea(cx, height - 30, 280, 50, () => {
      if (this.selectedPet !== null) {
        this.selectedPet = null;
        this.drawUI();
      } else {
        this.scene.start('Town');
      }
    });

    // Global touch
    this.input.on('pointerdown', (pointer) => {
      for (const h of this.hitAreas) {
        if (pointer.x >= h.x - h.w / 2 && pointer.x <= h.x + h.w / 2 &&
            pointer.y >= h.y - h.h / 2 && pointer.y <= h.y + h.h / 2) {
          h.cb();
          return;
        }
      }
    });
  }

  // === PET GRID (overview) ===
  drawPetGrid() {
    const { width } = this.scale;
    const save = this.save;
    const cols = 3;
    const gapX = 8;
    const gapY = 8;
    const cardW = Math.floor((width - 20 - (cols - 1) * gapX) / cols);
    const cardH = 155;
    const startY = 70;
    const marginLeft = Math.floor((width - cols * cardW - (cols - 1) * gapX) / 2);

    this.add.text(width / 2, startY + 5, 'Tippe auf ein Tier für Details', {
      fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    save.pets.forEach((pet, idx) => {
      // Decay needs
      const elapsed = (Date.now() - (pet.arrivedAt || Date.now())) / 60000;
      decayNeeds(pet, Math.min(elapsed * 0.1, 10));
      pet.happiness = calculateHappiness(pet);

      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = marginLeft + col * (cardW + gapX) + cardW / 2;
      const cy = startY + 25 + row * (cardH + gapY) + cardH / 2;

      // Card
      const rarityCol = Phaser.Display.Color.HexStringToColor(RARITY_COLORS[pet.rarity] || '#555555').color;
      drawCard(this, cx, cy, cardW, cardH, { borderColor: rarityCol });

      // Breed portrait
      const breedTex = `breed_${pet.breedId}`;
      if (this.textures.exists(breedTex)) {
        this.add.image(cx, cy - 30, breedTex).setScale(0.11);
      } else {
        this.add.text(cx, cy - 35, pet.emoji, { fontSize: '34px' }).setOrigin(0.5);
      }

      // Name
      this.add.text(cx, cy + 20, pet.name, {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
      }).setOrigin(0.5);

      // Breed + rarity
      this.add.text(cx, cy + 36, pet.breed, {
        fontSize: '11px', fontFamily: 'monospace', color: RARITY_COLORS[pet.rarity],
      }).setOrigin(0.5);

      // Happiness indicator
      const happyEmoji = pet.happiness >= 75 ? '😊' : pet.happiness >= 50 ? '😐' : '😢';
      this.add.text(cx, cy + 50, `${happyEmoji} ${Math.round(pet.happiness)}%`, {
        fontSize: '13px', fontFamily: 'monospace', color: pet.happiness >= 75 ? '#33aa55' : pet.happiness >= 50 ? '#dd8833' : '#dd4444',
      }).setOrigin(0.5);

      // Badges
      let badgeX = cx - 30;
      if (pet.insured) {
        this.add.text(badgeX, cy + 65, '🛡️', { fontSize: '13px' });
        badgeX += 18;
      }
      if (pet.groomed) {
        this.add.text(badgeX, cy + 65, '✨', { fontSize: '13px' });
        badgeX += 18;
      }
      if (pet.tricks && pet.tricks.length > 0) {
        this.add.text(badgeX, cy + 65, '🎓', { fontSize: '13px' });
      }

      // Tap to select
      this.addHitArea(cx, cy, cardW, cardH, () => {
        this.selectedPet = idx;
        this.drawUI();
      });
    });
  }

  // === PET DETAIL VIEW ===
  drawPetDetail(pet, petIdx) {
    const { width, height } = this.scale;
    const cx = width / 2;
    const save = this.save;

    // Decay needs
    const elapsed = (Date.now() - (pet.arrivedAt || Date.now())) / 60000;
    decayNeeds(pet, Math.min(elapsed * 0.1, 10));
    pet.happiness = calculateHappiness(pet);

    // Large portrait
    const breedTex = `breed_${pet.breedId}`;
    if (this.textures.exists(breedTex)) {
      this.add.image(cx, 140, breedTex).setScale(0.28);
    } else {
      this.add.text(cx, 120, pet.emoji, { fontSize: '64px' }).setOrigin(0.5);
    }

    // Name + breed
    this.add.text(cx, 225, pet.name, {
      fontSize: '26px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 250, `${pet.breed} · ${RARITY_LABELS[pet.rarity]}`, {
      fontSize: '15px', fontFamily: 'monospace', color: RARITY_COLORS[pet.rarity],
    }).setOrigin(0.5);

    // Story
    if (pet.story) {
      this.add.text(cx, 275, `"${pet.story}"`, {
        fontSize: '13px', fontFamily: 'Georgia, serif', color: THEME.text.muted,
        fontStyle: 'italic', wordWrap: { width: width - 60 }, align: 'center',
      }).setOrigin(0.5);
    }

    // Happiness big display
    const happyEmoji = pet.happiness >= 75 ? '😊' : pet.happiness >= 50 ? '😐' : '😢';
    this.add.text(cx, 310, `${happyEmoji} Glück: ${Math.round(pet.happiness)}%`, {
      fontSize: '16px', fontFamily: 'monospace', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    // === NEEDS SECTION ===
    const needsY = 345;
    drawCard(this, cx, needsY + 70, width - 20, 180);
    this.add.text(cx, needsY, 'Bedürfnisse', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    const needs = [
      { key: 'hunger', label: 'Hunger', emoji: '🍖', color: 0xff8844, cost: 5, puzzle: 'SortPuzzle' },
      { key: 'hygiene', label: 'Pflege', emoji: '🧼', color: 0x44aaff, cost: 3, puzzle: 'WashPuzzle' },
      { key: 'play', label: 'Spielen', emoji: '🎾', color: 0x44dd44, cost: 3, puzzle: null },
      { key: 'health', label: 'Gesundheit', emoji: '💊', color: 0xff4466, cost: 0, puzzle: null },
    ];

    needs.forEach((need, ni) => {
      const ny = needsY + 20 + ni * 32;
      const val = pet.needs[need.key];
      const barW = Math.min(160, width - 200);

      // Label
      this.add.text(20, ny, `${need.emoji} ${need.label}`, {
        fontSize: '14px', fontFamily: 'monospace', color: THEME.text.body,
      });

      // Progress bar
      drawProgressBar(this, 130, ny + 7, barW, 14, val / 100, need.color);

      // Value text
      this.add.text(130 + barW + 6, ny, `${Math.round(val)}%`, {
        fontSize: '13px', fontFamily: 'monospace', color: val > 40 ? THEME.text.muted : THEME.text.error,
      });

      // Action button (if need is low and has action)
      if (need.cost > 0 && val < 80) {
        const btnX = width - 35;
        const canAfford = save.hearts >= need.cost;
        drawButton(this, btnX, ny + 7, 58, 28, `${need.cost}❤️`, {
          disabled: !canAfford,
          fontSize: '13px',
          textColor: canAfford ? '#fff8e8' : '#999999',
        });
        // Always register hit area — show feedback if can't afford
        this.addHitArea(btnX, ny + 7, 58, 28, () => {
          if (canAfford) {
            this.feedPet(petIdx, need.key, need.cost);
          } else {
            const popup = this.add.text(width / 2, ny - 10, 'Nicht genug ❤️!', {
              fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ff4444', fontStyle: 'bold',
              backgroundColor: '#fff0f0', padding: { x: 10, y: 4 },
            }).setOrigin(0.5).setDepth(300);
            this.tweens.add({ targets: popup, y: popup.y - 20, alpha: 0, duration: 1200, onComplete: () => popup.destroy() });
          }
        });
      }
    });

    // === BADGES (inside needs card) ===
    const badgeY = needsY + 145;
    let bx = 25;
    if (pet.insured) {
      this.add.text(bx, badgeY, '🛡️ Versichert', {
        fontSize: '13px', fontFamily: 'monospace', color: '#4488aa',
      });
      bx += 110;
    }
    if (pet.groomed) {
      this.add.text(bx, badgeY, '✨ Gepflegt', {
        fontSize: '13px', fontFamily: 'monospace', color: '#9944ee',
      });
      bx += 100;
    }
    if (pet.tricks && pet.tricks.length > 0) {
      this.add.text(bx, badgeY, `🎓 ${pet.tricks.join(', ')}`, {
        fontSize: '13px', fontFamily: 'monospace', color: '#44aa44',
      });
    }

    // === ADOPTION SYSTEM (time-gated, interested buyers) ===
    const actY = needsY + 170;

    // Initialize adopter queue if missing
    if (!pet.adopterQueue) pet.adopterQueue = [];
    if (!pet.lastAdopterTime) pet.lastAdopterTime = 0;

    // Generate new interested adopter every 15 minutes (max 3)
    const now = Date.now();
    const ADOPTER_INTERVAL = 15 * 60 * 1000;
    if (pet.happiness >= 60 && pet.adopterQueue.length < 3 && (now - pet.lastAdopterTime) >= ADOPTER_INTERVAL) {
      const names = ['Familie Müller', 'Herr Schmidt', 'Frau Weber', 'Familie Klein', 'Lisa & Tom', 'Opa Heinrich', 'Die Bergers', 'Frau Hoffman'];
      const rarityMult = { common: 1, rare: 1.5, epic: 2.5, legendary: 5 };
      const baseOffer = Math.floor(5 + Math.random() * 10);
      const offer = Math.floor(baseOffer * (rarityMult[pet.rarity] || 1));
      pet.adopterQueue.push({
        name: names[Math.floor(Math.random() * names.length)],
        offer,
        matchScore: Math.floor(50 + Math.random() * 50),
        createdAt: now,
      });
      pet.lastAdopterTime = now;
      writeSave(this.save);
    }

    // Show adoption status + button to detail view
    if (pet.happiness < 60) {
      this.add.text(cx, actY, 'Glück zu niedrig für Vermittlung (min. 60%)', {
        fontSize: '12px', fontFamily: 'monospace', color: THEME.text.warning,
      }).setOrigin(0.5);
    } else if (pet.adopterQueue.length === 0) {
      const timeLeft = Math.max(0, ADOPTER_INTERVAL - (now - pet.lastAdopterTime));
      const mins = Math.ceil(timeLeft / 60000);
      this.add.text(cx, actY, `⏳ Warte auf Interessenten... (${mins} Min)`, {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
      }).setOrigin(0.5);
    } else {
      // Button to view adopters with full profiles
      const count = pet.adopterQueue.length;
      drawButton(this, cx, actY, width - 60, 44, `📋 ${count} Interessent${count > 1 ? 'en' : ''} ansehen`);
      this.addHitArea(cx, actY, width - 60, 44, () => {
        this.scene.start('Adoption', { petIdx, petData: pet });
      });
    }

    // Insurance button (if not insured)
    if (!pet.insured) {
      const insY = actY + 38;
      const canAffordIns = save.hearts >= 30;
      drawButton(this, cx, insY, 240, 36, '🛡️ Versichern (30❤️)', {
        type: 'secondary',
        disabled: !canAffordIns,
      });
      if (canAffordIns) {
        this.addHitArea(cx, insY, 240, 36, () => {
          this.save.hearts -= 30;
          pet.insured = true;
          if (!save.insuredPets) save.insuredPets = [];
          save.insuredPets.push(pet.id);
          addXp(this.save, 10);
          writeSave(this.save);
          this.drawUI();
        });
      }
      this.add.text(cx, insY + 25, 'Halbiert Tierarztkosten!', {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
      }).setOrigin(0.5);
    }
  }

  feedPet(petIdx, need, cost) {
    const pet = this.save.pets[petIdx];
    if (!pet || this.save.hearts < cost) return;

    this.registry.set('pendingFeed', { petIdx, need, cost });

    if (need === 'hunger') {
      this.scene.start('SortPuzzle', { petName: pet.name, onComplete: 'Shelter', need });
    } else if (need === 'hygiene') {
      this.scene.start('WashPuzzle', { petName: pet.name, breedId: pet.breedId, onComplete: 'Shelter', need });
    } else {
      this.save.hearts -= cost;
      pet.needs[need] = Math.min(100, pet.needs[need] + 55);
      pet.happiness = calculateHappiness(pet);
      addXp(this.save, 5);
      writeSave(this.save);
      this.drawUI();
    }
  }

  adoptPetToAdopter(petIdx, adopterIdx) {
    const pet = this.save.pets[petIdx];
    if (!pet || !pet.adopterQueue || !pet.adopterQueue[adopterIdx]) return;
    const adopter = pet.adopterQueue[adopterIdx];

    // Rewards
    this.save.hearts += adopter.offer;
    this.save.adopted = (this.save.adopted || 0) + 1;
    this.save.totalDonatedKg += 0.5;

    // Add breed to collection
    if (!this.save.collection.includes(pet.breedId)) {
      this.save.collection.push(pet.breedId);
    }

    // Remove pet
    this.save.pets.splice(petIdx, 1);
    addXp(this.save, 15);
    writeSave(this.save);

    this.selectedPet = null;
    this.drawUI();
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
