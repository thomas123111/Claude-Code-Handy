import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { calculateHappiness, decayNeeds, RARITY_COLORS, RARITY_LABELS } from '../data/PetData.js';

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

    this.cameras.main.setBackgroundColor('#221a2e');

    // Header
    this.add.text(cx, 25, '🏥 Tierarzt', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#ddaa77', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 52, `❤️ ${save.hearts} Herzen`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#998877',
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
        fontSize: '16px', fontFamily: 'Georgia, serif', color: '#44dd88',
      }).setOrigin(0.5);
      this.add.text(cx, height / 2 + 50, 'Komm wieder, wenn ein Tier\nkrank wird.', {
        fontSize: '12px', fontFamily: 'monospace', color: '#776688', align: 'center',
      }).setOrigin(0.5);
    } else {
      let y = 80;
      const cardH = 140;
      const cardW = width - 30;

      sickPets.forEach(({ pet, idx }) => {
        const diagnosis = DIAGNOSES.find((d) => d.name === pet.diagnosis) || DIAGNOSES[0];
        const isInsured = pet.insured;
        const treatCost = isInsured ? Math.ceil(diagnosis.cost / 2) : diagnosis.cost;
        const canAfford = save.hearts >= treatCost;
        const canAffordInsurance = save.hearts >= INSURANCE_COST;
        const rarityColor = RARITY_COLORS[pet.rarity];

        // Card background
        this.add.rectangle(cx, y + cardH / 2, cardW, cardH, 0x2d2240, 0.8)
          .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(rarityColor).color);

        // Pet emoji + name
        this.add.text(25, y + 10, pet.emoji, { fontSize: '32px' });
        this.add.text(70, y + 10, pet.name, {
          fontSize: '15px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
        });
        this.add.text(70, y + 30, `${pet.breed} · ${RARITY_LABELS[pet.rarity]}`, {
          fontSize: '10px', fontFamily: 'monospace', color: rarityColor,
        });

        // Insurance badge
        if (isInsured) {
          this.add.text(width - 20, y + 10, '🛡️', { fontSize: '16px' }).setOrigin(1, 0);
        }

        // Health bar
        const barY = y + 55;
        const healthPct = pet.needs.health / 100;
        this.add.text(25, barY, '💊 Gesundheit', {
          fontSize: '10px', fontFamily: 'monospace', color: '#ff6688',
        });
        this.add.rectangle(25 + 130, barY + 5, 160, 10, 0x333333)
          .setStrokeStyle(1, 0x444444);
        this.add.rectangle(25 + 130 - 80 + (80 * healthPct), barY + 5, 160 * healthPct, 10, 0xff4466)
          .setOrigin(0.5, 0.5);
        this.add.text(25 + 130 + 90, barY + 1, `${Math.round(pet.needs.health)}%`, {
          fontSize: '10px', fontFamily: 'monospace', color: '#ff6688',
        });

        // Diagnosis
        this.add.text(25, y + 76, `Diagnose: ${diagnosis.name}`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#cc8844',
        });

        // Treatment button
        const btnY = y + 100;
        const costLabel = isInsured
          ? `Behandeln (${treatCost}❤️ · 🛡️ -50%)`
          : `Behandeln (${treatCost}❤️)`;
        this.add.text(25, btnY, costLabel, {
          fontSize: '11px', fontFamily: 'monospace',
          color: canAfford ? '#44dd88' : '#554444',
        });
        if (canAfford) {
          this.addHitArea(140, btnY + 7, 260, 20, () => this.treatPet(idx, treatCost));
        }

        // Insurance upsell for uninsured pets
        if (!isInsured) {
          this.add.text(width - 20, btnY, `🛡️ Versichern (${INSURANCE_COST}❤️/Tier)`, {
            fontSize: '10px', fontFamily: 'monospace',
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
    this.add.text(cx, height - 40, '← Zurück', {
      fontSize: '14px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5);
    this.addHitArea(cx, height - 40, 120, 30, () => this.scene.start('Stations'));

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
