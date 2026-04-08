import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { calculateHappiness, decayNeeds, RARITY_COLORS, RARITY_LABELS } from '../data/PetData.js';
import { THEME, drawHeader, drawButton, drawCard, drawBackButton } from '../ui/Theme.js';

const DIAGNOSES = [
  { name: 'Erkältung', cost: 20 },
  { name: 'Verletzung', cost: 35 },
  { name: 'Magen-Darm', cost: 25 },
  { name: 'Allergie', cost: 15 },
];

const INSURANCE_COST = 30;

export class VetScene extends Phaser.Scene {
  constructor() { super('Vet'); }

  create() {
    this.save = loadSave();
    this.checkPuzzleResult();
    this.assignDiagnoses();
    this.drawUI();
  }

  assignDiagnoses() {
    this.save.pets.forEach((pet) => {
      // Decay needs based on time
      const elapsed = (Date.now() - pet.arrivedAt) / 60000;
      decayNeeds(pet, Math.min(elapsed, 60));
      pet.happiness = calculateHappiness(pet);

      // Assign a diagnosis if health is low and none assigned yet
      if (pet.needs.health < 50 && !pet.diagnosis) {
        pet.diagnosis = DIAGNOSES[Math.floor(Math.random() * DIAGNOSES.length)].name;
      }
      // Clear diagnosis if health is fine
      if (pet.needs.health >= 50 && pet.diagnosis) {
        delete pet.diagnosis;
      }
    });
    writeSave(this.save);
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
    const bgKey = 'bg_vet';
    if (this.textures.exists(bgKey)) {
      const bg = this.add.image(width / 2, height / 2, bgKey);
      bg.setDisplaySize(width, height);
      bg.setAlpha(0.15);
      bg.setDepth(-1);
    }

    // Header
    drawHeader(this, '🏥 Tierarzt', save);

    // Subtitle
    this.add.text(cx, 70, 'Kranke Tiere diagnostizieren und behandeln', {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Find sick pets (health < 50)
    const sickPets = [];
    save.pets.forEach((pet, idx) => {
      if (pet.needs.health < 50) {
        sickPets.push({ pet, idx });
      }
    });

    if (sickPets.length === 0) {
      this.add.text(cx, height / 2 - 40, '🎉', { fontSize: '48px' }).setOrigin(0.5);
      this.add.text(cx, height / 2 + 20, 'Alle Tiere sind gesund!', {
        fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.success,
      }).setOrigin(0.5);
      this.add.text(cx, height / 2 + 50, 'Komm wieder, wenn ein Tier\nkrank wird.', {
        fontSize: '15px', fontFamily: 'monospace', color: THEME.text.muted, align: 'center',
      }).setOrigin(0.5);
    } else {
      let y = 90;
      const cardH = 140;
      const cardW = width - 30;

      sickPets.forEach(({ pet, idx }) => {
        const diagnosis = DIAGNOSES.find((d) => d.name === pet.diagnosis) || DIAGNOSES[0];
        const isInsured = pet.insured;
        const treatCost = isInsured ? Math.ceil(diagnosis.cost / 2) : diagnosis.cost;
        const canAfford = save.hearts >= treatCost;
        const canAffordInsurance = save.hearts >= INSURANCE_COST;
        const rarityColor = RARITY_COLORS[pet.rarity];
        const rarityCol = Phaser.Display.Color.HexStringToColor(rarityColor).color;

        // Card background
        drawCard(this, cx, y + cardH / 2, cardW, cardH, { borderColor: rarityCol });

        // Pet emoji + name
        this.add.text(25, y + 10, pet.emoji, { fontSize: '32px' });
        this.add.text(70, y + 10, pet.name, {
          fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
        });
        this.add.text(70, y + 30, `${pet.breed} · ${RARITY_LABELS[pet.rarity]}`, {
          fontSize: '13px', fontFamily: 'monospace', color: rarityColor,
        });

        // Insurance badge
        if (isInsured) {
          this.add.text(width - 20, y + 10, '🛡️', { fontSize: '16px' }).setOrigin(1, 0);
        }

        // Health bar
        const barY = y + 55;
        const healthPct = pet.needs.health / 100;
        this.add.text(25, barY, '💊 Gesundheit', {
          fontSize: '13px', fontFamily: 'monospace', color: '#ff6688',
        });
        this.add.rectangle(25 + 130, barY + 5, 160, 10, 0x333333)
          .setStrokeStyle(1, 0x444444);
        this.add.rectangle(25 + 130 - 80 + (80 * healthPct), barY + 5, 160 * healthPct, 10, 0xff4466)
          .setOrigin(0.5, 0.5);
        this.add.text(25 + 130 + 90, barY + 1, `${Math.round(pet.needs.health)}%`, {
          fontSize: '13px', fontFamily: 'monospace', color: '#ff6688',
        });

        // Diagnosis
        this.add.text(25, y + 76, `Diagnose: ${diagnosis.name}`, {
          fontSize: '14px', fontFamily: 'monospace', color: THEME.text.warning,
        });

        // Treatment button
        const btnY = y + 100;
        const costLabel = isInsured
          ? `Behandeln (${treatCost}❤️ · 🛡️ -50%)`
          : `Behandeln (${treatCost}❤️)`;
        this.add.text(25, btnY, costLabel, {
          fontSize: '14px', fontFamily: 'monospace',
          color: canAfford ? THEME.text.success : '#554444',
        });
        if (canAfford) {
          this.addHitArea(140, btnY + 7, 260, 20, () => this.treatPet(idx, treatCost));
        }

        // Insurance upsell for uninsured pets
        if (!isInsured) {
          this.add.text(width - 20, btnY, `🛡️ Versichern (${INSURANCE_COST}❤️/Tier)`, {
            fontSize: '13px', fontFamily: 'monospace',
            color: canAffordInsurance ? '#88aaff' : '#554444',
          }).setOrigin(1, 0);
          if (canAffordInsurance) {
            this.addHitArea(width - 110, btnY + 6, 200, 18, () => this.insurePet(idx));
          }
        }

        y += cardH + 10;
      });
    }

    // Back button
    drawButton(this, cx, height - 40, 280, 50, '← Zurück', { type: 'secondary' });
    this.addHitArea(cx, height - 40, 280, 50, () => this.scene.start('Town'));

    // Touch handler
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

  treatPet(petIdx, cost) {
    const pet = this.save.pets[petIdx];
    if (!pet || this.save.hearts < cost) return;

    // Store pending treatment data
    this.registry.set('pendingTreatment', { petIdx, cost });

    // Launch Match-3 puzzle
    this.scene.start('Match3Puzzle', {
      petName: pet.name,
      onComplete: 'Vet',
    });
  }

  // Called when returning from puzzle
  checkPuzzleResult() {
    const result = this.registry.get('puzzleResult');
    const pending = this.registry.get('pendingTreatment');
    if (!result || !pending) return;

    this.registry.remove('puzzleResult');
    this.registry.remove('pendingTreatment');

    if (result.success) {
      const pet = this.save.pets[pending.petIdx];
      if (pet) {
        this.save.hearts -= pending.cost;
        pet.needs.health = 100;
        delete pet.diagnosis;
        pet.happiness = calculateHappiness(pet);
        addXp(this.save, 15 + (result.score || 0));
        writeSave(this.save);
      }
    }
  }

  insurePet(petIdx) {
    const pet = this.save.pets[petIdx];
    if (!pet || this.save.hearts < INSURANCE_COST) return;

    this.save.hearts -= INSURANCE_COST;
    pet.insured = true;
    // Also track in insuredPets array for backwards compat
    if (!this.save.insuredPets.includes(pet.id)) {
      this.save.insuredPets.push(pet.id);
    }
    addXp(this.save, 10);
    writeSave(this.save);
    this.drawUI();
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
