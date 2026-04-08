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
      pet.needs[pending.need] = Math.min(100, pet.needs[pending.need] + 40);
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
    const cardW = 160;
    const cardH = 175;
    const startY = 70;
    const gapX = 12;
    const gapY = 10;

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
      const cx = 30 + col * (cardW + gapX) + cardW / 2;
      const cy = startY + 25 + row * (cardH + gapY) + cardH / 2;

      // Card
      const rarityCol = Phaser.Display.Color.HexStringToColor(RARITY_COLORS[pet.rarity] || '#555555').color;
      drawCard(this, cx, cy, cardW, cardH, { borderColor: rarityCol });

      // Breed portrait
      const breedTex = `breed_${pet.breedId}`;
      if (this.textures.exists(breedTex)) {
        this.add.image(cx, cy - 35, breedTex).setScale(0.13);
      } else {
        this.add.text(cx, cy - 40, pet.emoji, { fontSize: '40px' }).setOrigin(0.5);
      }

      // Name
      this.add.text(cx, cy + 25, pet.name, {
        fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
      }).setOrigin(0.5);

      // Breed + rarity
      this.add.text(cx, cy + 42, pet.breed, {
        fontSize: '13px', fontFamily: 'monospace', color: RARITY_COLORS[pet.rarity],
      }).setOrigin(0.5);

      // Happiness indicator
      const happyEmoji = pet.happiness >= 75 ? '😊' : pet.happiness >= 50 ? '😐' : '😢';
      this.add.text(cx, cy + 60, `${happyEmoji} ${Math.round(pet.happiness)}%`, {
        fontSize: '14px', fontFamily: 'monospace', color: pet.happiness >= 75 ? '#33aa55' : pet.happiness >= 50 ? '#dd8833' : '#dd4444',
      }).setOrigin(0.5);

      // Badges
      let badgeX = cx - 50;
      if (pet.insured) {
        this.add.text(badgeX, cy + 75, '🛡️', { fontSize: '15px' });
        badgeX += 20;
      }
      if (pet.groomed) {
        this.add.text(badgeX, cy + 75, '✨', { fontSize: '15px' });
        badgeX += 20;
      }
      if (pet.tricks && pet.tricks.length > 0) {
        this.add.text(badgeX, cy + 75, '🎓', { fontSize: '15px' });
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
    drawCard(this, cx, needsY + 50, width - 30, 120);
    this.add.text(cx, needsY, 'Bedürfnisse', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    const needs = [
      { key: 'hunger', label: 'Hunger', emoji: '🍖', color: 0xff8844, cost: 5, puzzle: 'SortPuzzle' },
      { key: 'hygiene', label: 'Pflege', emoji: '🧼', color: 0x44aaff, cost: 3, puzzle: 'MemoryPuzzle' },
      { key: 'play', label: 'Spielen', emoji: '🎾', color: 0x44dd44, cost: 3, puzzle: null },
      { key: 'health', label: 'Gesundheit', emoji: '💊', color: 0xff4466, cost: 0, puzzle: null },
    ];

    needs.forEach((need, ni) => {
      const ny = needsY + 20 + ni * 28;
      const val = pet.needs[need.key];
      const barW = 180;

      // Label
      this.add.text(25, ny, `${need.emoji} ${need.label}`, {
        fontSize: '14px', fontFamily: 'monospace', color: THEME.text.body,
      });

      // Progress bar
      drawProgressBar(this, 170, ny + 7, barW, 12, val / 100, need.color);

      // Value text
      this.add.text(170 + barW + 8, ny, `${Math.round(val)}%`, {
        fontSize: '13px', fontFamily: 'monospace', color: val > 40 ? THEME.text.muted : THEME.text.error,
      });

      // Action button (if need is low and has action)
      if (need.cost > 0 && val < 80) {
        const btnX = width - 40;
        const canAfford = save.hearts >= need.cost;
        drawButton(this, btnX, ny + 6, 55, 22, `${need.cost}❤️`, {
          disabled: !canAfford,
          fontSize: '13px',
          textColor: canAfford ? '#fff8e8' : '#999999',
        });
        if (canAfford) {
          this.addHitArea(btnX, ny + 6, 55, 22, () => {
            this.feedPet(petIdx, need.key, need.cost);
          });
        }
      }
    });

    // === BADGES SECTION ===
    const badgeY = 480;
    let bx = 25;
    if (pet.insured) {
      this.add.text(bx, badgeY, '🛡️ Versichert', {
        fontSize: '14px', fontFamily: 'monospace', color: '#4488aa',
      });
      bx += 120;
    }
    if (pet.groomed) {
      this.add.text(bx, badgeY, '✨ Gepflegt (+25%)', {
        fontSize: '14px', fontFamily: 'monospace', color: '#9944ee',
      });
      bx += 140;
    }
    if (pet.tricks && pet.tricks.length > 0) {
      this.add.text(bx, badgeY, `🎓 ${pet.tricks.join(', ')}`, {
        fontSize: '14px', fontFamily: 'monospace', color: '#44aa44',
      });
    }

    // === ACTION BUTTONS ===
    const actY = 520;

    // Adoption progress
    pet.adoptionProgress = Math.min(100, pet.happiness * 1.2);
    const adoptBarW = width - 60;
    drawProgressBar(this, 30, actY, adoptBarW, 16, pet.adoptionProgress / 100, 0x44aa66);
    this.add.text(cx, actY, `Vermittlung: ${Math.round(pet.adoptionProgress)}%`, {
      fontSize: '13px', fontFamily: 'monospace', color: THEME.text.dark,
    }).setOrigin(0.5);

    if (pet.adoptionProgress >= 95) {
      // Adoption button
      drawButton(this, cx, actY + 40, 280, 46, '🏠 Vermitteln & Spenden!');
      this.addHitArea(cx, actY + 40, 280, 46, () => this.adoptPet(petIdx));

      const rarityBonus = { common: 20, rare: 50, epic: 120, legendary: 300 };
      const bonus = rarityBonus[pet.rarity] || 20;
      this.add.text(cx, actY + 72, `Belohnung: +${bonus}❤️ + 0.5kg Futterspende`, {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.success,
      }).setOrigin(0.5);
    } else {
      this.add.text(cx, actY + 40, 'Mach das Tier glücklicher um es zu vermitteln!', {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
      }).setOrigin(0.5);
    }

    // Insurance button (if not insured)
    if (!pet.insured) {
      const insY = actY + 100;
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
      this.scene.start('MemoryPuzzle', { petName: pet.name, onComplete: 'Shelter', need });
    } else {
      this.save.hearts -= cost;
      pet.needs[need] = Math.min(100, pet.needs[need] + 30);
      pet.happiness = calculateHappiness(pet);
      addXp(this.save, 5);
      writeSave(this.save);
      this.drawUI();
    }
  }

  adoptPet(petIdx) {
    const pet = this.save.pets[petIdx];
    if (!pet) return;

    // Go to adoption matching scene instead of instant adoption
    this.scene.start('Adoption', { petIdx, petData: pet });
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
